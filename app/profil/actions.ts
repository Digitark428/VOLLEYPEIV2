'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { ageOn } from '@/lib/text';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function text(formData: FormData, key: string) {
  const result = String(formData.get(key) ?? '').trim();
  return result || null;
}

export async function updateProfile(formData: FormData) {
  const identity = await requireIdentity();
  const username = text(formData, 'username') ?? '';
  const birthDate = text(formData, 'birth_date');
  const age = birthDate ? ageOn(birthDate) : null;
  const isMinor = age !== null && age < 18;
  const guardianFullName = text(formData, 'guardian_full_name');
  const guardianEmail = text(formData, 'guardian_email')?.toLowerCase() ?? null;

  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    redirect('/profil/completer?erreur=Pseudo%20invalide.');
  }
  if (age !== null && (age < 0 || age > 120)) {
    redirect('/profil/completer?erreur=Date%20de%20naissance%20invalide.');
  }
  if (isMinor && (!guardianFullName || !guardianEmail)) {
    redirect('/profil/completer?erreur=Les%20coordonnées%20du%20responsable%20majeur%20sont%20obligatoires.');
  }

  const disciplines = formData
    .getAll('disciplines')
    .map(String)
    .filter((item) => ['beach', 'indoor', 'green'].includes(item));
  const supabase = await createServerSupabaseClient();
  const avatarMediaId = text(formData, 'avatar_media_id');
  let avatarPath: string | undefined;
  if (avatarMediaId) {
    const { data: avatar } = await supabase.from('media_assets').select('storage_path').eq('id', avatarMediaId).eq('owner_id', identity.id).eq('kind', 'avatar').is('deleted_at', null).maybeSingle();
    if (!avatar) redirect('/profil/completer?erreur=Photo%20de%20profil%20introuvable.');
    avatarPath = avatar.storage_path;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      username,
      first_name: text(formData, 'first_name'),
      last_name: text(formData, 'last_name'),
      show_real_name: formData.get('show_real_name') === 'on',
      club_name: text(formData, 'club_name'),
      bio: text(formData, 'bio'),
      experience_summary: text(formData, 'experience_summary'),
      ...(avatarPath ? { avatar_path: avatarPath } : {}),
      disciplines,
      onboarding_completed: !isMinor,
    })
    .eq('id', identity.id);

  if (profileError) redirect(`/profil/completer?erreur=${encodeURIComponent(profileError.message)}`);

  const { error: privateError } = await supabase
    .from('profile_private')
    .update({
      birth_date: birthDate,
      guardian_full_name: isMinor ? guardianFullName : null,
      guardian_email: isMinor ? guardianEmail : null,
      guardian_consent: isMinor ? 'pending' : 'not_required',
      guardian_consent_at: null,
    })
    .eq('user_id', identity.id);

  if (privateError) redirect(`/profil/completer?erreur=${encodeURIComponent(privateError.message)}`);

  revalidatePath('/profil');
  revalidatePath(`/joueurs/${username}`);
  if (isMinor) {
    const { data: token, error: tokenError } = await supabase.rpc('create_profile_guardian_consent_request');
    if (tokenError || !token) redirect(`/profil?erreur=${encodeURIComponent(tokenError?.message ?? 'Impossible de créer le lien parental.')}`);
    redirect(`/profil/autorisation?token=${encodeURIComponent(String(token))}`);
  }
  redirect('/profil?message=Profil%20mis%20à%20jour.');
}
