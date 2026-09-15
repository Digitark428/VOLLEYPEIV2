-- Suspended or soft-deleted accounts keep their history but cannot use the community.
create or replace function private.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'active' and p.deleted_at is null
  );
$$;
revoke all on function private.is_active_member() from public, anon;
grant execute on function private.is_active_member() to authenticated, service_role;

drop policy if exists profiles_self_status_read on public.profiles;
create policy profiles_self_status_read on public.profiles for select
  to authenticated using (id = auth.uid());

do $$
declare target_table text;
begin
  foreach target_table in array array[
    'associations', 'association_members', 'tournaments', 'tournament_participants',
    'tournament_likes', 'tournament_comments', 'tournament_registrations',
    'registration_players', 'tournament_results', 'tournament_result_claims',
    'media_assets', 'posts', 'post_media', 'post_likes', 'post_comments',
    'content_reports', 'sponsors', 'notifications'
  ] loop
    execute format('drop policy if exists active_member_guard on public.%I', target_table);
    execute format(
      'create policy active_member_guard on public.%I as restrictive for all to authenticated using ((select private.is_active_member())) with check ((select private.is_active_member()))',
      target_table
    );
  end loop;
end;
$$;

drop policy if exists storage_active_member_guard on storage.objects;
create policy storage_active_member_guard on storage.objects as restrictive for all
  to authenticated
  using ((select private.is_active_member()))
  with check ((select private.is_active_member()));

create or replace function public.get_public_stats()
returns table (
  players bigint, associations bigint, tournaments bigint, visits_today bigint,
  visits_month bigint, tournaments_this_month bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_active_member() then raise exception 'active membership required'; end if;
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
    (select count(*) from public.tournaments t, reunion_dates r where t.date >= r.month_start and t.date < (r.month_start + interval '1 month')::date and t.status <> 'hidden' and t.deleted_at is null);
end;
$$;
revoke all on function public.get_public_stats() from public, anon;
grant execute on function public.get_public_stats() to authenticated, service_role;
