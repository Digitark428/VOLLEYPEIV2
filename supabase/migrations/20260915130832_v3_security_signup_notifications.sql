-- VolleyPei V3: private member-only application, richer profiles and in-app notifications.
-- Additive migration: current profiles, associations, tournaments, posts and media are preserved.

alter table public.profiles
  add column if not exists city text;

create index if not exists profiles_search_idx
  on public.profiles (lower(username), lower(coalesce(first_name, '')), lower(coalesce(last_name, '')))
  where status = 'active' and deleted_at is null;

-- New accounts are complete as soon as the email address is confirmed. The legal
-- guardian flow remains pending for minors until the guardian uses the consent link.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_type public.account_type;
  requested_birth_date date;
  requested_is_minor boolean;
  requested_guardian_name text;
  requested_guardian_email text;
begin
  requested_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'joueur-' || left(new.id::text, 8));
  requested_type := case
    when new.raw_user_meta_data ->> 'account_type' = 'association' then 'association'::public.account_type
    else 'player'::public.account_type
  end;

  begin
    requested_birth_date := nullif(new.raw_user_meta_data ->> 'birth_date', '')::date;
  exception when others then
    requested_birth_date := null;
  end;
  requested_is_minor := requested_birth_date is not null
    and requested_birth_date > ((now() at time zone 'Indian/Reunion')::date - interval '18 years')::date;
  requested_guardian_name := nullif(trim(new.raw_user_meta_data ->> 'guardian_full_name'), '');
  requested_guardian_email := nullif(lower(trim(new.raw_user_meta_data ->> 'guardian_email')), '');

  insert into public.profiles (
    id, username, account_type, first_name, last_name, city, onboarding_completed
  ) values (
    new.id,
    requested_username,
    requested_type,
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
    not requested_is_minor
  );

  insert into public.profile_private (
    user_id, birth_date, guardian_full_name, guardian_email, guardian_consent
  ) values (
    new.id,
    requested_birth_date,
    case when requested_is_minor then requested_guardian_name else null end,
    case when requested_is_minor then requested_guardian_email else null end,
    case when requested_is_minor
      then 'pending'::public.guardian_consent_status
      else 'not_required'::public.guardian_consent_status
    end
  );

  if exists (
    select 1 from private.admin_email_allowlist a where lower(a.email) = lower(new.email)
  ) then
    insert into public.platform_admins (user_id) values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- The application is member-only. Remove all Data API privileges from anon and
-- replace every public read policy with an authenticated-only equivalent.
revoke all on public.profiles, public.associations, public.association_members,
  public.tournaments, public.tournament_participants, public.tournament_likes,
  public.tournament_comments, public.tournament_results, public.media_assets,
  public.posts, public.post_media, public.post_likes, public.post_comments,
  public.sponsors
from anon;

revoke execute on function public.record_site_visit(text) from anon;
revoke execute on function public.record_tournament_view(uuid, text) from anon;
revoke execute on function public.get_public_stats() from anon;

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_member_read on public.profiles for select
  to authenticated using (status = 'active' and deleted_at is null);

drop policy if exists associations_public_read on public.associations;
create policy associations_member_community_read on public.associations for select
  to authenticated using (status = 'approved' and deleted_at is null);

drop policy if exists association_members_public_read on public.association_members;
create policy association_members_community_read on public.association_members for select
  to authenticated using (
    status = 'active'
    and exists (
      select 1 from public.associations a
      where a.id = association_id and a.status = 'approved' and a.deleted_at is null
    )
  );

drop policy if exists tournaments_public_read on public.tournaments;
create policy tournaments_member_read on public.tournaments for select
  to authenticated using (deleted_at is null and status in ('published', 'archived', 'cancelled'));

drop policy if exists tournament_participants_public_read on public.tournament_participants;
create policy tournament_participants_member_read on public.tournament_participants for select
  to authenticated using (true);

drop policy if exists tournament_likes_public_read on public.tournament_likes;
create policy tournament_likes_member_read on public.tournament_likes for select
  to authenticated using (true);

drop policy if exists tournament_comments_public_read on public.tournament_comments;
create policy tournament_comments_member_read on public.tournament_comments for select
  to authenticated using (status = 'published' and deleted_at is null);

drop policy if exists tournament_results_public_read on public.tournament_results;
create policy tournament_results_member_read on public.tournament_results for select
  to authenticated using (true);

drop policy if exists media_assets_public_read on public.media_assets;
create policy media_assets_member_read on public.media_assets for select
  to authenticated using (deleted_at is null);

drop policy if exists posts_public_read on public.posts;
create policy posts_member_read on public.posts for select
  to authenticated using (status = 'published' and deleted_at is null);

drop policy if exists post_media_public_read on public.post_media;
create policy post_media_member_read on public.post_media for select
  to authenticated using (true);

drop policy if exists post_likes_public_read on public.post_likes;
create policy post_likes_member_read on public.post_likes for select
  to authenticated using (true);

drop policy if exists post_comments_public_read on public.post_comments;
create policy post_comments_member_read on public.post_comments for select
  to authenticated using (status = 'published' and deleted_at is null);

drop policy if exists sponsors_public_read on public.sponsors;
create policy sponsors_member_read on public.sponsors for select
  to authenticated using (true);

drop policy if exists media_public_read on storage.objects;
create policy media_member_read on storage.objects for select
  to authenticated using (bucket_id = 'media-public');

-- Keep media URLs private: every image is now served through an authenticated app route.
update storage.buckets set public = false where id = 'media-public';

-- Association membership hardening. Managers can only operate inside their own
-- association; only owners can grant/manage the owner role and the last owner is protected.
create or replace function private.guard_association_member_change()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  actor_role public.association_member_role;
  owner_count integer;
begin
  if private.is_platform_admin() then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' and new.role = 'owner' and new.user_id = auth.uid()
     and exists (
       select 1 from public.associations a
       where a.id = new.association_id and a.created_by = auth.uid()
     )
     and not exists (
       select 1 from public.association_members am where am.association_id = new.association_id
     ) then
    return new;
  end if;

  select am.role into actor_role
  from public.association_members am
  where am.association_id = coalesce(new.association_id, old.association_id)
    and am.user_id = auth.uid()
    and am.status = 'active';

  if actor_role not in ('owner', 'admin') then
    raise exception 'association manager access required';
  end if;
  if tg_op <> 'INSERT' and old.role = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner can manage another owner';
  end if;
  if tg_op <> 'DELETE' and new.role = 'owner' and actor_role <> 'owner' then
    raise exception 'only an owner can grant the owner role';
  end if;
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.association_id := old.association_id;
    new.user_id := old.user_id;
  end if;
  if tg_op in ('UPDATE', 'DELETE') and old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner' or new.status <> 'active') then
    select count(*) into owner_count
    from public.association_members am
    where am.association_id = old.association_id and am.role = 'owner' and am.status = 'active';
    if owner_count <= 1 then raise exception 'an association must keep at least one active owner'; end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists guard_association_member_change on public.association_members;
create trigger guard_association_member_change
before insert or update or delete on public.association_members
for each row execute function private.guard_association_member_change();

-- Internal notifications, grouped by recipient/type/entity to avoid like/comment spam.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  kind text not null check (kind in (
    'post_like', 'post_comment', 'tournament_comment', 'tournament_registration',
    'tournament_update', 'association_status'
  )),
  entity_id uuid not null,
  title text not null,
  body text,
  href text not null,
  occurrences integer not null default 1 check (occurrences > 0),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recipient_id, kind, entity_id)
);

create index if not exists notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc) where read_at is null;

alter table public.notifications enable row level security;
grant select, update, delete on public.notifications to authenticated;

create policy notifications_self_read on public.notifications for select
  to authenticated using (recipient_id = auth.uid());
create policy notifications_self_update on public.notifications for update
  to authenticated using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());
create policy notifications_self_delete on public.notifications for delete
  to authenticated using (recipient_id = auth.uid());

create trigger set_updated_at before update on public.notifications
for each row execute function private.set_updated_at();

create or replace function private.upsert_notification(
  target_recipient uuid,
  target_actor uuid,
  target_kind text,
  target_entity uuid,
  target_title text,
  target_body text,
  target_href text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_recipient is null or target_recipient = target_actor then return; end if;
  insert into public.notifications (
    recipient_id, actor_id, kind, entity_id, title, body, href
  ) values (
    target_recipient, target_actor, target_kind, target_entity, target_title, target_body, target_href
  )
  on conflict (recipient_id, kind, entity_id) do update set
    actor_id = excluded.actor_id,
    title = excluded.title,
    body = excluded.body,
    href = excluded.href,
    occurrences = public.notifications.occurrences + 1,
    read_at = null,
    updated_at = now();
end;
$$;

revoke all on function private.upsert_notification(uuid, uuid, text, uuid, text, text, text) from public, anon, authenticated;

create or replace function private.notify_post_like()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; begin
  select p.author_id into owner_id from public.posts p where p.id = new.post_id;
  perform private.upsert_notification(owner_id, new.profile_id, 'post_like', new.post_id,
    'Ta publication plaît', 'Une personne a aimé ta publication.', '/actualite#post-' || new.post_id::text);
  return new;
end; $$;
drop trigger if exists notify_post_like on public.post_likes;
create trigger notify_post_like after insert on public.post_likes
for each row execute function private.notify_post_like();

create or replace function private.notify_post_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare owner_id uuid; begin
  select p.author_id into owner_id from public.posts p where p.id = new.post_id;
  perform private.upsert_notification(owner_id, new.author_id, 'post_comment', new.post_id,
    'Nouveau commentaire', 'Une personne a commenté ta publication.', '/actualite#post-' || new.post_id::text);
  return new;
end; $$;
drop trigger if exists notify_post_comment on public.post_comments;
create trigger notify_post_comment after insert on public.post_comments
for each row execute function private.notify_post_comment();

create or replace function private.notify_tournament_registration()
returns trigger language plpgsql security definer set search_path = '' as $$
declare manager_id uuid; begin
  for manager_id in
    select am.user_id from public.association_members am
    join public.tournaments t on t.association_id = am.association_id
    where t.id = new.tournament_id and am.status = 'active' and am.role in ('owner', 'admin')
  loop
    perform private.upsert_notification(manager_id, new.submitted_by, 'tournament_registration', new.id,
      'Nouvelle inscription', 'Une équipe vient de s’inscrire à ton tournoi.', '/mes-tournois/' || new.tournament_id::text || '/inscriptions');
  end loop;
  return new;
end; $$;
drop trigger if exists notify_tournament_registration on public.tournament_registrations;
create trigger notify_tournament_registration after insert on public.tournament_registrations
for each row execute function private.notify_tournament_registration();

create or replace function private.notify_association_status()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    perform private.upsert_notification(new.created_by, auth.uid(), 'association_status', new.id,
      case new.status
        when 'approved' then 'Association approuvée'
        when 'rejected' then 'Association refusée'
        when 'suspended' then 'Association suspendue'
        else 'Statut de l’association modifié'
      end,
      coalesce(new.review_note, 'Le statut de ton association a été mis à jour.'),
      '/mon-association');
  end if;
  return new;
end; $$;
drop trigger if exists notify_association_status on public.associations;
create trigger notify_association_status after update of status on public.associations
for each row execute function private.notify_association_status();

-- A responsible association account is still a person in the community. The
-- member counter therefore counts all active personal profiles.
create or replace function public.get_public_stats()
returns table (
  players bigint,
  associations bigint,
  tournaments bigint,
  visits_today bigint,
  visits_month bigint,
  tournaments_this_month bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  return query
  with reunion_dates as (
    select (now() at time zone 'Indian/Reunion')::date as today,
      date_trunc('month', now() at time zone 'Indian/Reunion')::date as month_start
  )
  select
    (select count(*) from public.profiles p where p.status = 'active' and p.deleted_at is null),
    (select count(*) from public.associations a where a.status = 'approved' and a.deleted_at is null),
    (select count(*) from public.tournaments t where t.status <> 'hidden' and t.deleted_at is null),
    coalesce((select d.unique_visits::bigint from private.analytics_daily d, reunion_dates r where d.visit_date = r.today), 0),
    coalesce((select sum(d.unique_visits)::bigint from private.analytics_daily d, reunion_dates r where d.visit_date >= r.month_start and d.visit_date <= r.today), 0),
    (select count(*) from public.tournaments t, reunion_dates r
      where t.date >= r.month_start and t.date < (r.month_start + interval '1 month')::date
        and t.status <> 'hidden' and t.deleted_at is null);
end;
$$;

revoke all on function public.get_public_stats() from public, anon;
grant execute on function public.get_public_stats() to authenticated, service_role;
