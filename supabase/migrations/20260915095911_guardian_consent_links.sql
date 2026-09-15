create or replace function public.create_profile_guardian_consent_request()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  private_profile public.profile_private%rowtype;
  raw_token text := encode(extensions.gen_random_bytes(32), 'hex');
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into private_profile from public.profile_private where user_id = auth.uid();
  if not found
    or private_profile.birth_date is null
    or private_profile.birth_date <= ((now() at time zone 'Indian/Reunion')::date - interval '18 years')::date
    or private_profile.guardian_full_name is null
    or private_profile.guardian_email is null then
    raise exception 'guardian request is not required';
  end if;

  delete from private.guardian_consent_requests
  where profile_id = auth.uid() and confirmed_at is null;
  insert into private.guardian_consent_requests (profile_id, guardian_email, token_hash, expires_at)
  values (auth.uid(), private_profile.guardian_email, encode(extensions.digest(raw_token, 'sha256'), 'hex'), now() + interval '7 days');
  return raw_token;
end;
$$;

revoke all on function public.create_profile_guardian_consent_request() from public, anon;
grant execute on function public.create_profile_guardian_consent_request() to authenticated, service_role;

create or replace function public.confirm_guardian_consent(raw_token text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  request private.guardian_consent_requests%rowtype;
begin
  select * into request
  from private.guardian_consent_requests
  where token_hash = encode(extensions.digest(raw_token, 'sha256'), 'hex')
    and confirmed_at is null
    and expires_at >= now()
  for update;
  if not found then raise exception 'invalid or expired consent link'; end if;

  update private.guardian_consent_requests set confirmed_at = now() where id = request.id;
  if request.profile_id is not null then
    update public.profile_private set guardian_consent = 'confirmed', guardian_consent_at = now() where user_id = request.profile_id;
    update public.profiles set onboarding_completed = true where id = request.profile_id;
    return 'profile';
  end if;
  update public.registration_players set guardian_consent = 'confirmed', guardian_consent_at = now() where id = request.registration_player_id;
  return 'registration';
end;
$$;

revoke all on function public.confirm_guardian_consent(text) from public;
grant execute on function public.confirm_guardian_consent(text) to anon, authenticated, service_role;
