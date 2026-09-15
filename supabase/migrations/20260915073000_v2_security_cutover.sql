-- Retire the V1 browser-writable policies now that V2 uses authenticated roles.

drop policy if exists tournaments_select_public on public.tournaments;
drop policy if exists tournaments_insert_public on public.tournaments;
drop policy if exists tournaments_update_public on public.tournaments;
drop policy if exists tournaments_delete_public on public.tournaments;
drop policy if exists tournaments_public_read on public.tournaments;
drop policy if exists tournaments_manager_read on public.tournaments;
drop policy if exists tournaments_manager_insert on public.tournaments;
drop policy if exists tournaments_manager_update on public.tournaments;
drop policy if exists tournaments_admin_all on public.tournaments;

revoke all on public.tournaments from anon, authenticated;
grant select on public.tournaments to anon, authenticated;
grant insert, update on public.tournaments to authenticated;

create policy tournaments_public_read on public.tournaments for select
  to anon, authenticated
  using (deleted_at is null and status in ('published', 'archived'));

create policy tournaments_manager_read on public.tournaments for select
  to authenticated
  using (private.is_association_manager(association_id));

create policy tournaments_manager_insert on public.tournaments for insert
  to authenticated
  with check (
    created_by = (select auth.uid())
    and private.is_association_manager(association_id)
    and exists (
      select 1
      from public.associations a
      where a.id = association_id
        and a.status = 'approved'
        and a.deleted_at is null
    )
  );

create policy tournaments_manager_update on public.tournaments for update
  to authenticated
  using (private.is_association_manager(association_id))
  with check (
    private.is_association_manager(association_id)
    and exists (
      select 1
      from public.associations a
      where a.id = association_id
        and a.status = 'approved'
        and a.deleted_at is null
    )
  );

create policy tournaments_admin_all on public.tournaments for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

create or replace function private.guard_tournament_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not private.is_platform_admin() then
    new.id := old.id;
    new.association_id := old.association_id;
    new.created_by := old.created_by;
    new.views_count := old.views_count;
    new.deleted_at := old.deleted_at;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_tournament_update on public.tournaments;
create trigger guard_tournament_update before update on public.tournaments
  for each row execute function private.guard_tournament_update();

drop policy if exists sponsors_select_public on public.sponsors;
drop policy if exists sponsors_insert_public on public.sponsors;
drop policy if exists sponsors_update_public on public.sponsors;
drop policy if exists sponsors_delete_public on public.sponsors;
drop policy if exists sponsors_public_read on public.sponsors;
drop policy if exists sponsors_admin_all on public.sponsors;

revoke all on public.sponsors from anon, authenticated;
grant select on public.sponsors to anon, authenticated;
grant insert, update, delete on public.sponsors to authenticated;

create policy sponsors_public_read on public.sponsors for select
  to anon, authenticated
  using (true);

create policy sponsors_admin_all on public.sponsors for all
  to authenticated
  using ((select private.is_platform_admin()))
  with check ((select private.is_platform_admin()));

drop policy if exists visits_select_public on public.visits;
drop policy if exists visits_insert_public on public.visits;
revoke all on public.visits from anon, authenticated;

drop policy if exists posters_insert_public on storage.objects;
drop policy if exists sponsors_insert_public on storage.objects;
drop policy if exists sponsors_delete_public on storage.objects;
