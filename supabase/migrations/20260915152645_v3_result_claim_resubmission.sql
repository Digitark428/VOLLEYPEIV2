-- Allow a player to correct and resubmit a rejected result claim.

drop policy if exists result_claims_self_update on public.tournament_result_claims;
create policy result_claims_self_update on public.tournament_result_claims for update
  to authenticated
  using (profile_id = auth.uid() and status in ('pending', 'rejected'))
  with check (profile_id = auth.uid() and status = 'pending');

create or replace function private.guard_result_claim_update()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.id := old.id;
  new.tournament_id := old.tournament_id;
  new.profile_id := old.profile_id;
  if not private.is_platform_admin()
     and not exists (select 1 from public.tournaments t where t.id = old.tournament_id and private.is_association_manager(t.association_id)) then
    new.status := case when old.status = 'rejected' then 'pending' else old.status end;
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;
