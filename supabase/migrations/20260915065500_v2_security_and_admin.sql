-- Follow-up hardening after the V2 foundation.

revoke execute on function public.submit_tournament_registration(uuid, text, text, text, text, text, text, jsonb) from anon;

alter function public.set_updated_at() set search_path = '';
drop function if exists public.increment_tournament_views(uuid);

create index if not exists guardian_consent_requests_profile_idx
  on private.guardian_consent_requests (profile_id) where profile_id is not null;
create index if not exists guardian_consent_requests_player_idx
  on private.guardian_consent_requests (registration_player_id) where registration_player_id is not null;
create index if not exists post_media_media_idx on public.post_media (media_id);
create index if not exists posts_association_created_idx on public.posts (association_id, created_at desc) where association_id is not null;
create index if not exists post_comments_author_idx on public.post_comments (author_id, created_at desc);
create index if not exists tournament_comments_author_idx on public.tournament_comments (author_id, created_at desc);
create index if not exists tournaments_created_by_idx on public.tournaments (created_by) where created_by is not null;
create index if not exists tournaments_poster_media_idx on public.tournaments (poster_media_id) where poster_media_id is not null;

create or replace function public.admin_list_users()
returns table (
  id uuid,
  email text,
  username text,
  account_type public.account_type,
  first_name text,
  last_name text,
  status public.account_status,
  created_at timestamptz,
  email_confirmed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'admin access required';
  end if;
  return query
  select u.id, u.email::text, p.username, p.account_type, p.first_name, p.last_name,
    p.status, u.created_at, u.email_confirmed_at
  from auth.users u
  join public.profiles p on p.id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated, service_role;

create or replace function public.admin_visit_history(requested_days integer default 30)
returns table (visit_date date, unique_visits integer, page_views integer)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    raise exception 'admin access required';
  end if;
  return query
  select d.visit_date, d.unique_visits, d.page_views
  from private.analytics_daily d
  where d.visit_date >= ((now() at time zone 'Indian/Reunion')::date - greatest(1, least(requested_days, 366)) + 1)
  order by d.visit_date;
end;
$$;

revoke all on function public.admin_visit_history(integer) from public, anon;
grant execute on function public.admin_visit_history(integer) to authenticated, service_role;
