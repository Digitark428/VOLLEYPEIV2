-- VolleyPei V3.1: searchable social tokens, idempotent tournament creation and branding.

alter table public.tournaments add column if not exists creation_token uuid;
create unique index if not exists tournaments_creation_token_unique
  on public.tournaments (association_id, created_by, creation_token)
  where creation_token is not null and deleted_at is null;

create table if not exists public.post_hashtags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag text not null check (tag ~ '^[a-z0-9_]{2,50}$'),
  created_at timestamptz not null default now(),
  primary key (post_id, tag)
);
create index if not exists post_hashtags_tag_idx on public.post_hashtags (tag, created_at desc);
alter table public.post_hashtags enable row level security;
grant select, insert, delete on public.post_hashtags to authenticated;
create policy post_hashtags_member_read on public.post_hashtags for select to authenticated
  using (private.is_active_member());
create policy post_hashtags_author_insert on public.post_hashtags for insert to authenticated
  with check (private.is_active_member() and exists (
    select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
  ));
create policy post_hashtags_author_delete on public.post_hashtags for delete to authenticated
  using (private.is_active_member() and exists (
    select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
  ));

create table if not exists public.post_mentions (
  post_id uuid not null references public.posts(id) on delete cascade,
  mentioned_profile_id uuid not null references public.profiles(id) on delete cascade,
  mentioning_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, mentioned_profile_id)
);
create index if not exists post_mentions_recipient_idx on public.post_mentions (mentioned_profile_id, created_at desc);
alter table public.post_mentions enable row level security;
grant select, insert, delete on public.post_mentions to authenticated;
create policy post_mentions_member_read on public.post_mentions for select to authenticated
  using (private.is_active_member());
create policy post_mentions_author_insert on public.post_mentions for insert to authenticated
  with check (private.is_active_member() and mentioning_profile_id = auth.uid() and exists (
    select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
  ));
create policy post_mentions_author_delete on public.post_mentions for delete to authenticated
  using (private.is_active_member() and mentioning_profile_id = auth.uid());

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check check (kind in (
  'post_like', 'post_comment', 'post_mention', 'tournament_comment',
  'tournament_registration', 'tournament_update', 'association_status'
));

create or replace function private.notify_post_mention()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.upsert_notification(
    new.mentioned_profile_id, new.mentioning_profile_id, 'post_mention', new.post_id,
    'Vous avez été mentionné', 'Une personne vous a mentionné dans une publication.',
    '/actualite#post-' || new.post_id::text
  );
  return new;
end;
$$;
insert into public.post_hashtags (post_id, tag)
select distinct p.id, lower(match[1])
from public.posts p
cross join lateral regexp_matches(p.body, '#([A-Za-z0-9_]{2,50})', 'g') as match
on conflict do nothing;

insert into public.post_mentions (post_id, mentioned_profile_id, mentioning_profile_id)
select distinct p.id, profile.id, p.author_id
from public.posts p
cross join lateral regexp_matches(p.body, '@([A-Za-z0-9._-]{3,30})', 'g') as match
join public.profiles profile on lower(profile.username) = lower(match[1])
on conflict do nothing;

drop trigger if exists notify_post_mention on public.post_mentions;
create trigger notify_post_mention after insert on public.post_mentions
for each row execute function private.notify_post_mention();

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
create policy app_settings_logo_read on public.app_settings for select to anon, authenticated
  using (key = 'logo_url');
create policy app_settings_admin_update on public.app_settings for update to authenticated
  using (private.is_platform_admin()) with check (private.is_platform_admin());
insert into public.app_settings (key, value) values ('logo_url', '/brand/volley-pei.png')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 1048576, array['image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
create policy branding_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'branding');
create policy branding_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'branding' and private.is_platform_admin());
create policy branding_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'branding' and private.is_platform_admin())
  with check (bucket_id = 'branding' and private.is_platform_admin());
create policy branding_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'branding' and private.is_platform_admin());
