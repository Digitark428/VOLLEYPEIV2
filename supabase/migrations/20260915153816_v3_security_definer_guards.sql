-- Security-definer functions bypass RLS by design. Keep their privileges narrow
-- and explicitly reject suspended or soft-deleted callers.

create or replace function private.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins pa
    join auth.users u on u.id = pa.user_id
    join public.profiles p on p.id = pa.user_id
    where pa.user_id = auth.uid() and u.email_confirmed_at is not null
      and p.status = 'active' and p.deleted_at is null
  );
$$;

create or replace function private.is_association_member(target_association uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.association_members am
    join public.profiles p on p.id = am.user_id
    where am.association_id = target_association and am.user_id = auth.uid()
      and am.status = 'active' and p.status = 'active' and p.deleted_at is null
  );
$$;

create or replace function private.is_association_manager(target_association uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.association_members am
    join public.profiles p on p.id = am.user_id
    where am.association_id = target_association and am.user_id = auth.uid()
      and am.status = 'active' and am.role in ('owner', 'admin')
      and p.status = 'active' and p.deleted_at is null
  );
$$;

create or replace function public.record_site_visit(hashed_visitor text)
returns table (unique_visits integer, page_views integer)
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_active_member() then raise exception 'active membership required'; end if;
  return query select * from private.record_visit(hashed_visitor);
end;
$$;

create or replace function public.record_tournament_view(target_tournament uuid, hashed_visitor text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  reunion_day date := (now() at time zone 'Indian/Reunion')::date;
  is_new boolean;
  current_count bigint;
begin
  if not private.is_active_member() then raise exception 'active membership required'; end if;
  if hashed_visitor is null or hashed_visitor !~ '^[a-f0-9]{64}$' then raise exception 'invalid visitor hash'; end if;

  insert into private.tournament_view_sessions (tournament_id, view_date, visitor_hash)
  values (target_tournament, reunion_day, hashed_visitor)
  on conflict (tournament_id, view_date, visitor_hash) do update
    set last_seen_at = now(), page_views = private.tournament_view_sessions.page_views + 1
  returning (xmax = 0) into is_new;

  if is_new then
    update public.tournaments set views_count = views_count + 1
    where id = target_tournament and deleted_at is null returning views_count into current_count;
  else
    select views_count into current_count from public.tournaments
    where id = target_tournament and deleted_at is null;
  end if;
  return coalesce(current_count, 0);
end;
$$;

create or replace function public.profile_age_label(target_profile uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare birth_date_value date; show_age_value boolean; age_value integer;
begin
  if not private.is_active_member() then raise exception 'active membership required'; end if;
  select pp.birth_date, p.show_age into birth_date_value, show_age_value
  from public.profiles p join public.profile_private pp on pp.user_id = p.id
  where p.id = target_profile and p.status = 'active' and p.deleted_at is null;
  if birth_date_value is null then return null; end if;
  age_value := extract(year from age((now() at time zone 'Indian/Reunion')::date, birth_date_value));
  if age_value < 18 then return age_value::text || ' ans · profil mineur'; end if;
  if show_age_value then return age_value::text || ' ans'; end if;
  return null;
end;
$$;

create or replace function private.guard_active_registration_write()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.role() <> 'service_role' and not private.is_active_member() then
    raise exception 'active membership required';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists guard_active_registration_write on public.tournament_registrations;
create trigger guard_active_registration_write
before insert or update or delete on public.tournament_registrations
for each row execute function private.guard_active_registration_write();

create or replace function public.create_profile_guardian_consent_request()
returns text language plpgsql security definer set search_path = '' as $$
declare
  private_profile public.profile_private%rowtype;
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if not private.is_active_member() then raise exception 'active membership required'; end if;
  select * into private_profile from public.profile_private where user_id = auth.uid();
  if not found or private_profile.birth_date is null
    or private_profile.birth_date <= ((now() at time zone 'Indian/Reunion')::date - interval '18 years')::date
    or private_profile.guardian_full_name is null or private_profile.guardian_email is null then
    raise exception 'guardian request is not required';
  end if;
  delete from private.guardian_consent_requests where profile_id = auth.uid() and confirmed_at is null;
  insert into private.guardian_consent_requests (profile_id, guardian_email, token_hash, expires_at)
  values (auth.uid(), private_profile.guardian_email, encode(extensions.digest(raw_token, 'sha256'), 'hex'), now() + interval '7 days');
  return raw_token;
end;
$$;

revoke execute on function public.record_site_visit(text) from anon;
revoke execute on function public.record_tournament_view(uuid, text) from anon;
