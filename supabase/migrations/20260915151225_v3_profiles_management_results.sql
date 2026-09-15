-- VolleyPei V3 profile privacy and controlled tournament result claims.

alter table public.profiles
  add column if not exists show_age boolean not null default false;

create or replace function public.profile_age_label(target_profile uuid)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  birth_date_value date;
  show_age_value boolean;
  age_value integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select pp.birth_date, p.show_age into birth_date_value, show_age_value
  from public.profiles p
  join public.profile_private pp on pp.user_id = p.id
  where p.id = target_profile and p.status = 'active' and p.deleted_at is null;
  if birth_date_value is null then return null; end if;
  age_value := extract(year from age((now() at time zone 'Indian/Reunion')::date, birth_date_value));
  if age_value < 18 then return age_value::text || ' ans · profil mineur'; end if;
  if show_age_value then return age_value::text || ' ans'; end if;
  return null;
end;
$$;

revoke all on function public.profile_age_label(uuid) from public, anon;
grant execute on function public.profile_age_label(uuid) to authenticated, service_role;

create table if not exists public.tournament_result_claims (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  claimed_position smallint check (claimed_position is null or claimed_position > 0),
  claimed_label text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, profile_id)
);

create index if not exists tournament_result_claims_review_idx
  on public.tournament_result_claims (tournament_id, status, created_at desc);
alter table public.tournament_result_claims enable row level security;
grant select, insert, update on public.tournament_result_claims to authenticated;

create policy result_claims_self_read on public.tournament_result_claims for select
  to authenticated using (profile_id = auth.uid());
create policy result_claims_manager_read on public.tournament_result_claims for select
  to authenticated using (exists (
    select 1 from public.tournaments t where t.id = tournament_id and private.is_association_manager(t.association_id)
  ));
create policy result_claims_self_insert on public.tournament_result_claims for insert
  to authenticated with check (
    profile_id = auth.uid() and status = 'pending'
    and exists (select 1 from public.tournament_participants tp where tp.tournament_id = tournament_id and tp.profile_id = auth.uid())
  );
create policy result_claims_self_update on public.tournament_result_claims for update
  to authenticated using (profile_id = auth.uid() and status = 'pending')
  with check (profile_id = auth.uid() and status = 'pending');
create policy result_claims_manager_update on public.tournament_result_claims for update
  to authenticated using (exists (
    select 1 from public.tournaments t where t.id = tournament_id and private.is_association_manager(t.association_id)
  )) with check (exists (
    select 1 from public.tournaments t where t.id = tournament_id and private.is_association_manager(t.association_id)
  ));
create policy result_claims_admin_all on public.tournament_result_claims for all
  to authenticated using (private.is_platform_admin()) with check (private.is_platform_admin());

create or replace function private.guard_result_claim_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.id := old.id;
  new.tournament_id := old.tournament_id;
  new.profile_id := old.profile_id;
  if not private.is_platform_admin()
     and not exists (select 1 from public.tournaments t where t.id = old.tournament_id and private.is_association_manager(t.association_id)) then
    new.status := old.status;
    new.reviewed_by := old.reviewed_by;
    new.reviewed_at := old.reviewed_at;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_result_claim_update on public.tournament_result_claims;
create trigger guard_result_claim_update before update on public.tournament_result_claims
for each row execute function private.guard_result_claim_update();
create trigger set_updated_at before update on public.tournament_result_claims
for each row execute function private.set_updated_at();

create or replace function private.guard_participant_result_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.id := old.id;
  new.tournament_id := old.tournament_id;
  new.profile_id := old.profile_id;
  if not private.is_platform_admin()
     and not exists (select 1 from public.tournaments t where t.id = old.tournament_id and private.is_association_manager(t.association_id)) then
    new.result_position := old.result_position;
    new.result_label := old.result_label;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_participant_result_update on public.tournament_participants;
create trigger guard_participant_result_update before update on public.tournament_participants
for each row execute function private.guard_participant_result_update();

create or replace function public.review_tournament_result_claim(target_claim uuid, decision text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare claim public.tournament_result_claims%rowtype;
begin
  select * into claim from public.tournament_result_claims where id = target_claim for update;
  if not found then raise exception 'result claim not found'; end if;
  if not private.is_platform_admin()
     and not exists (select 1 from public.tournaments t where t.id = claim.tournament_id and private.is_association_manager(t.association_id)) then
    raise exception 'association manager access required';
  end if;
  if decision not in ('confirmed', 'rejected') then raise exception 'invalid decision'; end if;
  update public.tournament_result_claims set status = decision, reviewed_by = auth.uid(), reviewed_at = now() where id = target_claim;
  if decision = 'confirmed' then
    update public.tournament_participants set result_position = claim.claimed_position, result_label = claim.claimed_label
    where tournament_id = claim.tournament_id and profile_id = claim.profile_id;
  end if;
end;
$$;
revoke all on function public.review_tournament_result_claim(uuid, text) from public, anon;
grant execute on function public.review_tournament_result_claim(uuid, text) to authenticated, service_role;

create or replace function private.notify_tournament_comment()
returns trigger language plpgsql security definer set search_path = '' as $$
declare manager_id uuid; begin
  for manager_id in
    select am.user_id from public.association_members am
    join public.tournaments t on t.association_id = am.association_id
    where t.id = new.tournament_id and am.status = 'active' and am.role in ('owner', 'admin')
  loop
    perform private.upsert_notification(manager_id, new.author_id, 'tournament_comment', new.tournament_id,
      'Commentaire sur un tournoi', 'Une personne a commenté ton tournoi.', '/tournoi/' || new.tournament_id::text || '#commentaires');
  end loop;
  return new;
end;
$$;
drop trigger if exists notify_tournament_comment on public.tournament_comments;
create trigger notify_tournament_comment after insert on public.tournament_comments
for each row execute function private.notify_tournament_comment();

create or replace function private.notify_tournament_update()
returns trigger language plpgsql security definer set search_path = '' as $$
declare participant_id uuid; begin
  if new.status is distinct from old.status or new.date is distinct from old.date or new.time is distinct from old.time then
    for participant_id in select tp.profile_id from public.tournament_participants tp where tp.tournament_id = new.id loop
      perform private.upsert_notification(participant_id, auth.uid(), 'tournament_update', new.id,
        'Tournoi mis à jour', new.name || ' a changé. Consulte les nouvelles informations.', '/tournoi/' || new.id::text);
    end loop;
  end if;
  return new;
end;
$$;
drop trigger if exists notify_tournament_update on public.tournaments;
create trigger notify_tournament_update after update of status, date, time on public.tournaments
for each row execute function private.notify_tournament_update();

drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (
  id uuid,
  email text,
  username text,
  account_type public.account_type,
  first_name text,
  last_name text,
  avatar_path text,
  city text,
  club_name text,
  status public.account_status,
  created_at timestamptz,
  email_confirmed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then raise exception 'admin access required'; end if;
  return query
  select u.id, u.email::text, p.username, p.account_type, p.first_name, p.last_name,
    p.avatar_path, p.city, p.club_name, p.status, u.created_at, u.email_confirmed_at
  from auth.users u join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;
revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated, service_role;
