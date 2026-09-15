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
  if current_user in ('postgres', 'service_role') or private.is_platform_admin() then
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
