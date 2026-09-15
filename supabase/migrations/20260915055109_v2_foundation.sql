-- VolleyPei V2 foundation.
-- This migration is deliberately additive: the existing public application keeps
-- working until the security cutover migration is deployed with the new UI.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

do $$ begin
  create type public.account_type as enum ('player', 'association');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.account_status as enum ('active', 'suspended', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.guardian_consent_status as enum ('not_required', 'pending', 'confirmed', 'revoked');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.association_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.association_member_role as enum ('owner', 'admin', 'member');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.membership_status as enum ('invited', 'active', 'suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.tournament_status as enum ('draft', 'published', 'cancelled', 'archived', 'hidden');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.registration_status as enum ('pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.content_status as enum ('published', 'hidden', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.media_kind as enum ('avatar', 'logo', 'poster', 'post', 'gallery');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  account_type public.account_type not null default 'player',
  first_name text,
  last_name text,
  show_real_name boolean not null default false,
  avatar_path text,
  club_name text,
  bio text,
  experience_summary text,
  years_practice smallint check (years_practice between 0 and 90),
  disciplines text[] not null default '{}',
  achievements text,
  onboarding_completed boolean not null default false,
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint profiles_username_format check (username ~ '^[A-Za-z0-9._-]{3,30}$')
);

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where deleted_at is null;
create index if not exists profiles_status_created_idx
  on public.profiles (status, created_at desc);

create table if not exists public.profile_private (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  birth_date date,
  guardian_full_name text,
  guardian_email text,
  guardian_consent public.guardian_consent_status not null default 'not_required',
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_private_guardian_email check (
    guardian_email is null or guardian_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists private.admin_email_allowlist (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into private.admin_email_allowlist (email)
values ('kevin@digit-ark.com')
on conflict (email) do nothing;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins pa
    join auth.users u on u.id = pa.user_id
    where pa.user_id = (select auth.uid())
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function private.is_platform_admin() from public;
grant execute on function private.is_platform_admin() to authenticated, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_type public.account_type;
begin
  requested_username := coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), 'joueur-' || left(new.id::text, 8));
  requested_type := case
    when new.raw_user_meta_data ->> 'account_type' = 'association' then 'association'::public.account_type
    else 'player'::public.account_type
  end;

  insert into public.profiles (id, username, account_type)
  values (new.id, requested_username, requested_type);

  insert into public.profile_private (user_id)
  values (new.id);

  if exists (
    select 1
    from private.admin_email_allowlist a
    where lower(a.email) = lower(new.email)
  ) then
    insert into public.platform_admins (user_id)
    values (new.id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create table if not exists public.associations (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  name text not null,
  description text,
  address text,
  city text,
  email text not null,
  phone text,
  registration_number text,
  website text,
  instagram_url text,
  facebook_url text,
  logo_path text,
  status public.association_status not null default 'pending',
  review_note text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint associations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint associations_email_format check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

create unique index if not exists associations_slug_unique
  on public.associations (lower(slug))
  where deleted_at is null;
create index if not exists associations_status_created_idx
  on public.associations (status, created_at desc);

create table if not exists public.association_members (
  id uuid primary key default gen_random_uuid(),
  association_id uuid not null references public.associations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.association_member_role not null default 'member',
  status public.membership_status not null default 'active',
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (association_id, user_id)
);

create index if not exists association_members_user_idx
  on public.association_members (user_id, status);
create index if not exists association_members_association_idx
  on public.association_members (association_id, role, status);

create or replace function private.add_association_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.association_members (association_id, user_id, role, status)
  values (new.id, new.created_by, 'owner', 'active');
  return new;
end;
$$;

drop trigger if exists on_association_created on public.associations;
create trigger on_association_created
  after insert on public.associations
  for each row execute function private.add_association_owner();

create or replace function private.is_association_member(target_association uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.association_members am
    where am.association_id = target_association
      and am.user_id = (select auth.uid())
      and am.status = 'active'
  );
$$;

create or replace function private.is_association_manager(target_association uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.association_members am
    where am.association_id = target_association
      and am.user_id = (select auth.uid())
      and am.status = 'active'
      and am.role in ('owner', 'admin')
  );
$$;

revoke all on function private.is_association_member(uuid) from public;
revoke all on function private.is_association_manager(uuid) from public;
grant execute on function private.is_association_member(uuid) to authenticated, service_role;
grant execute on function private.is_association_manager(uuid) to authenticated, service_role;

-- Database guards complement RLS: owning a row never grants the right to change
-- moderation, approval or identity fields on that row.
create or replace function private.guard_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    new.id := old.id;
    new.status := old.status;
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function private.guard_profile_update();

create or replace function private.guard_private_profile_update()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_minor boolean := new.birth_date is not null
    and new.birth_date > ((now() at time zone 'Indian/Reunion')::date - interval '18 years')::date;
begin
  new.user_id := old.user_id;
  if private.is_platform_admin() then
    return new;
  end if;
  if is_minor then
    if old.guardian_consent = 'confirmed'
      and new.guardian_email is not distinct from old.guardian_email
      and new.guardian_full_name is not distinct from old.guardian_full_name then
      new.guardian_consent := old.guardian_consent;
      new.guardian_consent_at := old.guardian_consent_at;
    else
      new.guardian_consent := 'pending';
      new.guardian_consent_at := null;
    end if;
  else
    new.guardian_full_name := null;
    new.guardian_email := null;
    new.guardian_consent := 'not_required';
    new.guardian_consent_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_private_profile_update on public.profile_private;
create trigger guard_private_profile_update before update on public.profile_private
  for each row execute function private.guard_private_profile_update();

create or replace function private.guard_association_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    new.id := old.id;
    new.slug := old.slug;
    new.created_by := old.created_by;
    new.status := old.status;
    new.review_note := old.review_note;
    new.approved_by := old.approved_by;
    new.approved_at := old.approved_at;
    new.suspended_at := old.suspended_at;
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_association_update on public.associations;
create trigger guard_association_update before update on public.associations
  for each row execute function private.guard_association_update();

alter table public.tournaments
  add column if not exists association_id uuid references public.associations(id) on delete set null,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists slug text,
  add column if not exists status public.tournament_status not null default 'published',
  add column if not exists format text,
  add column if not exists address text,
  add column if not exists registration_enabled boolean not null default false,
  add column if not exists registration_deadline timestamptz,
  add column if not exists max_teams integer check (max_teams is null or max_teams > 0),
  add column if not exists additional_info text,
  add column if not exists views_count bigint not null default 0 check (views_count >= 0),
  add column if not exists deleted_at timestamptz;

create unique index if not exists tournaments_slug_unique
  on public.tournaments (lower(slug))
  where slug is not null and deleted_at is null;
create index if not exists tournaments_public_timeline_idx
  on public.tournaments (status, date, time)
  where deleted_at is null;
create index if not exists tournaments_association_idx
  on public.tournaments (association_id, date desc)
  where deleted_at is null;

create table if not exists public.tournament_participants (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  result_position smallint check (result_position is null or result_position > 0),
  result_label text,
  joined_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, profile_id)
);

create index if not exists tournament_participants_profile_idx
  on public.tournament_participants (profile_id, joined_at desc);

create table if not exists public.tournament_likes (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (tournament_id, profile_id)
);

create index if not exists tournament_likes_profile_idx
  on public.tournament_likes (profile_id, created_at desc);

create table if not exists public.tournament_comments (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.tournament_comments(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists tournament_comments_tournament_idx
  on public.tournament_comments (tournament_id, created_at)
  where deleted_at is null;

create table if not exists public.tournament_registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  team_name text not null check (char_length(trim(team_name)) between 2 and 100),
  referent_email text not null,
  referent_phone text not null,
  category text,
  level text,
  notes text,
  status public.registration_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint tournament_registrations_email_format check (
    referent_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  )
);

create index if not exists tournament_registrations_tournament_idx
  on public.tournament_registrations (tournament_id, status, created_at desc);
create index if not exists tournament_registrations_submitter_idx
  on public.tournament_registrations (submitted_by, created_at desc);

create or replace function private.guard_registration_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.id := old.id;
  new.tournament_id := old.tournament_id;
  new.submitted_by := old.submitted_by;
  if not private.is_platform_admin()
    and not exists (
      select 1 from public.tournaments t
      where t.id = old.tournament_id and private.is_association_manager(t.association_id)
    ) then
    if new.status = 'cancelled' and old.status <> 'cancelled' then
      new.cancelled_at := now();
    else
      new.status := old.status;
      new.cancelled_at := old.cancelled_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_registration_update on public.tournament_registrations;
create trigger guard_registration_update before update on public.tournament_registrations
  for each row execute function private.guard_registration_update();

create table if not exists public.registration_players (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.tournament_registrations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text not null,
  roster_order smallint not null default 1 check (roster_order > 0),
  is_minor boolean not null default false,
  guardian_full_name text,
  guardian_email text,
  guardian_consent public.guardian_consent_status not null default 'not_required',
  guardian_consent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (registration_id, roster_order),
  constraint registration_players_guardian_required check (
    not is_minor or (
      guardian_full_name is not null
      and guardian_email is not null
      and guardian_consent in ('pending', 'confirmed')
    )
  )
);

create index if not exists registration_players_profile_idx
  on public.registration_players (profile_id)
  where profile_id is not null;

create or replace function public.submit_tournament_registration(
  target_tournament uuid,
  submitted_team_name text,
  submitted_email text,
  submitted_phone text,
  submitted_category text,
  submitted_level text,
  submitted_notes text,
  submitted_players jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  registration_id uuid;
  tournament_row public.tournaments%rowtype;
  player jsonb;
  player_index integer := 0;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if char_length(trim(submitted_team_name)) not between 2 and 100 then
    raise exception 'invalid team name';
  end if;
  if submitted_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid email';
  end if;
  if nullif(trim(submitted_phone), '') is null then
    raise exception 'phone required';
  end if;
  if jsonb_typeof(submitted_players) <> 'array' or jsonb_array_length(submitted_players) < 1 then
    raise exception 'at least one player is required';
  end if;

  select * into tournament_row
  from public.tournaments
  where id = target_tournament
  for update;

  if not found
    or not tournament_row.registration_enabled
    or tournament_row.status <> 'published'
    or tournament_row.deleted_at is not null
    or (tournament_row.registration_deadline is not null and tournament_row.registration_deadline < now()) then
    raise exception 'registrations are closed';
  end if;

  if tournament_row.max_teams is not null and (
    select count(*)
    from public.tournament_registrations r
    where r.tournament_id = target_tournament
      and r.status in ('pending', 'confirmed', 'waitlisted')
  ) >= tournament_row.max_teams then
    raise exception 'tournament is full';
  end if;

  insert into public.tournament_registrations (
    tournament_id, submitted_by, team_name, referent_email, referent_phone,
    category, level, notes
  ) values (
    target_tournament, auth.uid(), trim(submitted_team_name), lower(trim(submitted_email)),
    trim(submitted_phone), nullif(trim(submitted_category), ''), nullif(trim(submitted_level), ''),
    nullif(trim(submitted_notes), '')
  ) returning id into registration_id;

  for player in select value from jsonb_array_elements(submitted_players) loop
    player_index := player_index + 1;
    if nullif(trim(player ->> 'first_name'), '') is null or nullif(trim(player ->> 'last_name'), '') is null then
      raise exception 'player name required';
    end if;
    if coalesce((player ->> 'is_minor')::boolean, false)
      and (nullif(trim(player ->> 'guardian_full_name'), '') is null
        or nullif(trim(player ->> 'guardian_email'), '') is null) then
      raise exception 'guardian details required for minors';
    end if;

    insert into public.registration_players (
      registration_id, first_name, last_name, roster_order, is_minor,
      guardian_full_name, guardian_email, guardian_consent
    ) values (
      registration_id,
      trim(player ->> 'first_name'),
      trim(player ->> 'last_name'),
      player_index,
      coalesce((player ->> 'is_minor')::boolean, false),
      nullif(trim(player ->> 'guardian_full_name'), ''),
      nullif(lower(trim(player ->> 'guardian_email')), ''),
      case when coalesce((player ->> 'is_minor')::boolean, false)
        then 'pending'::public.guardian_consent_status
        else 'not_required'::public.guardian_consent_status
      end
    );
  end loop;

  return registration_id;
end;
$$;

revoke all on function public.submit_tournament_registration(uuid, text, text, text, text, text, text, jsonb) from public;
grant execute on function public.submit_tournament_registration(uuid, text, text, text, text, text, text, jsonb) to authenticated, service_role;

create table if not exists public.tournament_results (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  registration_id uuid references public.tournament_registrations(id) on delete set null,
  team_name text not null,
  position smallint check (position is null or position > 0),
  result_label text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_id, position)
);

create index if not exists tournament_results_tournament_idx
  on public.tournament_results (tournament_id, position);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  association_id uuid references public.associations(id) on delete set null,
  kind public.media_kind not null,
  bucket_id text not null default 'media-public',
  storage_path text not null,
  mime_type text not null,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  byte_size integer not null check (byte_size > 0 and byte_size <= 5242880),
  alt_text text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (bucket_id, storage_path)
);

alter table public.tournaments
  add column if not exists poster_media_id uuid references public.media_assets(id) on delete set null;

create index if not exists media_assets_owner_idx
  on public.media_assets (owner_id, created_at desc)
  where deleted_at is null;
create index if not exists media_assets_association_idx
  on public.media_assets (association_id, created_at desc)
  where association_id is not null and deleted_at is null;

create or replace function private.guard_media_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    new.id := old.id;
    new.owner_id := old.owner_id;
    new.kind := old.kind;
    new.bucket_id := old.bucket_id;
    new.storage_path := old.storage_path;
    new.mime_type := old.mime_type;
    new.width := old.width;
    new.height := old.height;
    new.byte_size := old.byte_size;
    if new.association_id is distinct from old.association_id
      and new.association_id is not null
      and not private.is_association_member(new.association_id) then
      raise exception 'association membership required';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_media_update on public.media_assets;
create trigger guard_media_update before update on public.media_assets
  for each row execute function private.guard_media_update();

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete restrict,
  association_id uuid references public.associations(id) on delete set null,
  tournament_id uuid references public.tournaments(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 5000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists posts_feed_idx
  on public.posts (created_at desc, id desc)
  where status = 'published' and deleted_at is null;
create index if not exists posts_tournament_idx
  on public.posts (tournament_id, created_at desc)
  where tournament_id is not null and status = 'published' and deleted_at is null;
create index if not exists posts_author_idx
  on public.posts (author_id, created_at desc)
  where status = 'published' and deleted_at is null;

create table if not exists public.post_media (
  post_id uuid not null references public.posts(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete restrict,
  display_order smallint not null default 1 check (display_order > 0),
  primary key (post_id, media_id),
  unique (post_id, display_order)
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create index if not exists post_likes_profile_idx
  on public.post_likes (profile_id, created_at desc);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.post_comments(id) on delete set null,
  body text not null check (char_length(trim(body)) between 1 and 2000),
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists post_comments_post_idx
  on public.post_comments (post_id, created_at)
  where deleted_at is null;

create or replace function private.guard_content_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    if tg_table_name = 'posts' then
      new.author_id := old.author_id;
      if old.status <> 'published' then new.status := old.status; end if;
      if old.deleted_at is not null then new.deleted_at := old.deleted_at; end if;
    elsif tg_table_name in ('post_comments', 'tournament_comments') then
      new.author_id := old.author_id;
      if old.status <> 'published' then new.status := old.status; end if;
      if old.deleted_at is not null then new.deleted_at := old.deleted_at; end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_content_update on public.posts;
create trigger guard_content_update before update on public.posts
  for each row execute function private.guard_content_update();
drop trigger if exists guard_content_update on public.post_comments;
create trigger guard_content_update before update on public.post_comments
  for each row execute function private.guard_content_update();
drop trigger if exists guard_content_update on public.tournament_comments;
create trigger guard_content_update before update on public.tournament_comments
  for each row execute function private.guard_content_update();

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('profile', 'association', 'tournament', 'post', 'comment', 'media')),
  target_id uuid not null,
  reason text not null check (char_length(trim(reason)) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);

create index if not exists content_reports_status_idx
  on public.content_reports (status, created_at desc);

create table if not exists private.guardian_consent_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  registration_player_id uuid references public.registration_players(id) on delete cascade,
  guardian_email text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint guardian_consent_single_target check (
    (profile_id is not null and registration_player_id is null)
    or (profile_id is null and registration_player_id is not null)
  )
);

create table if not exists private.analytics_sessions (
  visit_date date not null,
  visitor_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_views integer not null default 1 check (page_views > 0),
  primary key (visit_date, visitor_hash)
);

create index if not exists analytics_sessions_last_seen_idx
  on private.analytics_sessions (last_seen_at desc);

create table if not exists private.analytics_daily (
  visit_date date primary key,
  unique_visits integer not null default 0 check (unique_visits >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  updated_at timestamptz not null default now()
);

create table if not exists private.tournament_view_sessions (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  view_date date not null,
  visitor_hash text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_views integer not null default 1 check (page_views > 0),
  primary key (tournament_id, view_date, visitor_hash)
);

create index if not exists tournament_view_sessions_date_idx
  on private.tournament_view_sessions (view_date, last_seen_at desc);

create or replace function private.record_visit(hashed_visitor text)
returns table (unique_visits integer, page_views integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  reunion_day date := (now() at time zone 'Indian/Reunion')::date;
  is_new boolean;
begin
  if hashed_visitor is null or length(hashed_visitor) < 32 then
    raise exception 'invalid visitor hash';
  end if;

  insert into private.analytics_sessions (visit_date, visitor_hash)
  values (reunion_day, hashed_visitor)
  on conflict (visit_date, visitor_hash) do update
    set last_seen_at = now(),
        page_views = private.analytics_sessions.page_views + 1
  returning (xmax = 0) into is_new;

  insert into private.analytics_daily (visit_date, unique_visits, page_views)
  values (reunion_day, case when is_new then 1 else 0 end, 1)
  on conflict (visit_date) do update
    set unique_visits = private.analytics_daily.unique_visits + case when is_new then 1 else 0 end,
        page_views = private.analytics_daily.page_views + 1,
        updated_at = now();

  return query
  select d.unique_visits, d.page_views
  from private.analytics_daily d
  where d.visit_date = reunion_day;
end;
$$;

revoke all on function private.record_visit(text) from public, anon, authenticated;
grant execute on function private.record_visit(text) to service_role;

create or replace function public.record_site_visit(hashed_visitor text)
returns table (unique_visits integer, page_views integer)
language sql
security definer
set search_path = ''
as $$
  select * from private.record_visit(hashed_visitor);
$$;

revoke all on function public.record_site_visit(text) from public;
grant execute on function public.record_site_visit(text) to anon, authenticated, service_role;

create or replace function public.record_tournament_view(target_tournament uuid, hashed_visitor text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  reunion_day date := (now() at time zone 'Indian/Reunion')::date;
  is_new boolean;
  current_count bigint;
begin
  if hashed_visitor is null or hashed_visitor !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid visitor hash';
  end if;

  insert into private.tournament_view_sessions (tournament_id, view_date, visitor_hash)
  values (target_tournament, reunion_day, hashed_visitor)
  on conflict (tournament_id, view_date, visitor_hash) do update
    set last_seen_at = now(),
        page_views = private.tournament_view_sessions.page_views + 1
  returning (xmax = 0) into is_new;

  if is_new then
    update public.tournaments
    set views_count = views_count + 1
    where id = target_tournament and deleted_at is null
    returning views_count into current_count;
  else
    select views_count into current_count
    from public.tournaments
    where id = target_tournament and deleted_at is null;
  end if;

  return coalesce(current_count, 0);
end;
$$;

revoke all on function public.record_tournament_view(uuid, text) from public;
grant execute on function public.record_tournament_view(uuid, text) to anon, authenticated, service_role;

create or replace function public.get_public_stats()
returns table (
  players bigint,
  associations bigint,
  tournaments bigint,
  visits_today bigint,
  visits_month bigint,
  tournaments_this_month bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  with reunion_dates as (
    select
      (now() at time zone 'Indian/Reunion')::date as today,
      date_trunc('month', now() at time zone 'Indian/Reunion')::date as month_start
  )
  select
    (select count(*) from public.profiles p where p.status = 'active' and p.account_type = 'player' and p.deleted_at is null),
    (select count(*) from public.associations a where a.status = 'approved' and a.deleted_at is null),
    (select count(*) from public.tournaments t where t.status <> 'hidden' and t.deleted_at is null),
    coalesce((select d.unique_visits::bigint from private.analytics_daily d, reunion_dates r where d.visit_date = r.today), 0),
    coalesce((select sum(d.unique_visits)::bigint from private.analytics_daily d, reunion_dates r where d.visit_date >= r.month_start and d.visit_date <= r.today), 0),
    (select count(*) from public.tournaments t, reunion_dates r
      where t.date >= r.month_start
        and t.date < (r.month_start + interval '1 month')::date
        and t.status <> 'hidden'
        and t.deleted_at is null)
  ;
$$;

revoke all on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated, service_role;

-- Updated-at triggers for all mutable V2 tables.
do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'profiles', 'profile_private', 'associations', 'association_members',
    'tournament_participants', 'tournament_comments', 'tournament_registrations',
    'tournament_results', 'posts', 'post_comments'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', target_table);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()',
      target_table
    );
  end loop;
end $$;

-- New public media bucket. Inputs are converted before upload, so HEIC is not stored.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-public',
  'media-public',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Explicit Data API grants. RLS below remains the actual row authorization layer.
grant select on public.profiles, public.associations, public.association_members,
  public.tournaments, public.tournament_participants, public.tournament_likes,
  public.tournament_comments, public.tournament_results, public.media_assets,
  public.posts, public.post_media, public.post_likes, public.post_comments
to anon, authenticated;

grant select on public.platform_admins to authenticated;

grant select, insert, update on public.profile_private to authenticated;
grant insert, update on public.profiles, public.associations, public.association_members,
  public.tournaments, public.tournament_participants, public.tournament_comments,
  public.tournament_registrations, public.registration_players, public.tournament_results,
  public.media_assets, public.posts, public.post_media, public.post_comments,
  public.content_reports to authenticated;
grant insert, delete on public.tournament_likes, public.post_likes to authenticated;
grant select on public.tournament_registrations, public.registration_players,
  public.content_reports to authenticated;
grant delete on public.tournament_participants, public.tournament_comments,
  public.posts, public.post_comments, public.post_media to authenticated;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.platform_admins enable row level security;
alter table public.associations enable row level security;
alter table public.association_members enable row level security;
alter table public.tournament_participants enable row level security;
alter table public.tournament_likes enable row level security;
alter table public.tournament_comments enable row level security;
alter table public.tournament_registrations enable row level security;
alter table public.registration_players enable row level security;
alter table public.tournament_results enable row level security;
alter table public.media_assets enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_comments enable row level security;
alter table public.content_reports enable row level security;

create policy profiles_public_read on public.profiles for select
  to anon, authenticated
  using (status = 'active' and deleted_at is null);
create policy profiles_self_update on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
create policy profiles_admin_all on public.profiles for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy profile_private_self_read on public.profile_private for select
  to authenticated using ((select auth.uid()) = user_id);
create policy profile_private_self_update on public.profile_private for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy profile_private_admin_all on public.profile_private for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy platform_admins_self_read on public.platform_admins for select
  to authenticated using ((select auth.uid()) = user_id);
create policy platform_admins_admin_all on public.platform_admins for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy associations_public_read on public.associations for select
  to anon, authenticated
  using (status = 'approved' and deleted_at is null);
create policy associations_member_read on public.associations for select
  to authenticated using ((select private.is_association_member(id)));
create policy associations_admin_read on public.associations for select
  to authenticated using ((select private.is_platform_admin()));
create policy associations_create_pending on public.associations for insert
  to authenticated
  with check (created_by = (select auth.uid()) and status = 'pending');
create policy associations_manager_update on public.associations for update
  to authenticated
  using ((select private.is_association_manager(id)))
  with check ((select private.is_association_manager(id)));
create policy associations_admin_all on public.associations for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy association_members_public_read on public.association_members for select
  to anon, authenticated
  using (
    status = 'active'
    and exists (
      select 1 from public.associations a
      where a.id = association_id and a.status = 'approved' and a.deleted_at is null
    )
  );
create policy association_members_self_read on public.association_members for select
  to authenticated using (user_id = (select auth.uid()));
create policy association_members_manager_all on public.association_members for all
  to authenticated
  using ((select private.is_association_manager(association_id)))
  with check ((select private.is_association_manager(association_id)));
create policy association_members_admin_all on public.association_members for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy tournament_participants_public_read on public.tournament_participants for select
  to anon, authenticated using (true);
create policy tournament_participants_self_insert on public.tournament_participants for insert
  to authenticated with check (profile_id = (select auth.uid()));
create policy tournament_participants_self_update on public.tournament_participants for update
  to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));
create policy tournament_participants_self_delete on public.tournament_participants for delete
  to authenticated using (profile_id = (select auth.uid()));
create policy tournament_participants_admin_all on public.tournament_participants for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy tournament_likes_public_read on public.tournament_likes for select
  to anon, authenticated using (true);
create policy tournament_likes_self_insert on public.tournament_likes for insert
  to authenticated with check (profile_id = (select auth.uid()));
create policy tournament_likes_self_delete on public.tournament_likes for delete
  to authenticated using (profile_id = (select auth.uid()));

create policy tournament_comments_public_read on public.tournament_comments for select
  to anon, authenticated using (status = 'published' and deleted_at is null);
create policy tournament_comments_self_insert on public.tournament_comments for insert
  to authenticated with check (author_id = (select auth.uid()) and status = 'published');
create policy tournament_comments_self_update on public.tournament_comments for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy tournament_comments_self_delete on public.tournament_comments for delete
  to authenticated using (author_id = (select auth.uid()));
create policy tournament_comments_admin_all on public.tournament_comments for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy tournament_registrations_self_read on public.tournament_registrations for select
  to authenticated using (submitted_by = (select auth.uid()));
create policy tournament_registrations_manager_read on public.tournament_registrations for select
  to authenticated using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and (select private.is_association_manager(t.association_id))
    )
  );
create policy tournament_registrations_self_insert on public.tournament_registrations for insert
  to authenticated with check (
    submitted_by = (select auth.uid())
    and status = 'pending'
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and t.registration_enabled
        and t.status = 'published'
        and t.deleted_at is null
        and (t.registration_deadline is null or t.registration_deadline >= now())
    )
  );
create policy tournament_registrations_self_update on public.tournament_registrations for update
  to authenticated
  using (submitted_by = (select auth.uid()))
  with check (submitted_by = (select auth.uid()));
create policy tournament_registrations_manager_update on public.tournament_registrations for update
  to authenticated
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and (select private.is_association_manager(t.association_id))
    )
  )
  with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and (select private.is_association_manager(t.association_id))
    )
  );
create policy tournament_registrations_admin_all on public.tournament_registrations for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy registration_players_owner_read on public.registration_players for select
  to authenticated using (
    exists (
      select 1 from public.tournament_registrations r
      where r.id = registration_id and r.submitted_by = (select auth.uid())
    )
  );
create policy registration_players_manager_read on public.registration_players for select
  to authenticated using (
    exists (
      select 1
      from public.tournament_registrations r
      join public.tournaments t on t.id = r.tournament_id
      where r.id = registration_id
        and (select private.is_association_manager(t.association_id))
    )
  );
create policy registration_players_owner_insert on public.registration_players for insert
  to authenticated with check (
    exists (
      select 1 from public.tournament_registrations r
      where r.id = registration_id and r.submitted_by = (select auth.uid())
    )
  );
create policy registration_players_owner_update on public.registration_players for update
  to authenticated
  using (
    exists (
      select 1 from public.tournament_registrations r
      where r.id = registration_id and r.submitted_by = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.tournament_registrations r
      where r.id = registration_id and r.submitted_by = (select auth.uid())
    )
  );
create policy registration_players_admin_all on public.registration_players for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy tournament_results_public_read on public.tournament_results for select
  to anon, authenticated using (true);
create policy tournament_results_manager_all on public.tournament_results for all
  to authenticated
  using (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and (select private.is_association_manager(t.association_id))
    )
  )
  with check (
    exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and (select private.is_association_manager(t.association_id))
    )
  );
create policy tournament_results_admin_all on public.tournament_results for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy media_assets_public_read on public.media_assets for select
  to anon, authenticated using (deleted_at is null);
create policy media_assets_self_insert on public.media_assets for insert
  to authenticated with check (
    owner_id = (select auth.uid())
    and (association_id is null or (select private.is_association_member(association_id)))
  );
create policy media_assets_self_update on public.media_assets for update
  to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy media_assets_admin_all on public.media_assets for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy posts_public_read on public.posts for select
  to anon, authenticated using (status = 'published' and deleted_at is null);
create policy posts_self_insert on public.posts for insert
  to authenticated with check (
    author_id = (select auth.uid())
    and status = 'published'
    and (association_id is null or (select private.is_association_member(association_id)))
  );
create policy posts_self_update on public.posts for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy posts_self_delete on public.posts for delete
  to authenticated using (author_id = (select auth.uid()));
create policy posts_admin_all on public.posts for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy post_media_public_read on public.post_media for select
  to anon, authenticated using (true);
create policy post_media_author_insert on public.post_media for insert
  to authenticated with check (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
    and exists (
      select 1 from public.media_assets m
      where m.id = media_id and m.owner_id = (select auth.uid()) and m.deleted_at is null
    )
  );
create policy post_media_author_delete on public.post_media for delete
  to authenticated using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = (select auth.uid())
    )
  );

create policy post_likes_public_read on public.post_likes for select
  to anon, authenticated using (true);
create policy post_likes_self_insert on public.post_likes for insert
  to authenticated with check (profile_id = (select auth.uid()));
create policy post_likes_self_delete on public.post_likes for delete
  to authenticated using (profile_id = (select auth.uid()));

create policy post_comments_public_read on public.post_comments for select
  to anon, authenticated using (status = 'published' and deleted_at is null);
create policy post_comments_self_insert on public.post_comments for insert
  to authenticated with check (author_id = (select auth.uid()) and status = 'published');
create policy post_comments_self_update on public.post_comments for update
  to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));
create policy post_comments_self_delete on public.post_comments for delete
  to authenticated using (author_id = (select auth.uid()));
create policy post_comments_admin_all on public.post_comments for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create policy content_reports_self_insert on public.content_reports for insert
  to authenticated with check (reporter_id = (select auth.uid()) and status = 'open');
create policy content_reports_self_read on public.content_reports for select
  to authenticated using (reporter_id = (select auth.uid()));
create policy content_reports_admin_all on public.content_reports for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'media-public');
drop policy if exists media_owner_insert on storage.objects;
create policy media_owner_insert on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'media-public'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
drop policy if exists media_owner_update on storage.objects;
create policy media_owner_update on storage.objects for update
  to authenticated
  using (
    bucket_id = 'media-public'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_platform_admin()))
  )
  with check (
    bucket_id = 'media-public'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_platform_admin()))
  );
drop policy if exists media_owner_delete on storage.objects;
create policy media_owner_delete on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'media-public'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select private.is_platform_admin()))
  );
