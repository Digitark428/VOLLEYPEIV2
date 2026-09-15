'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function confirmGuardianConsent(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  if (!token || formData.get('certification') !== 'on') redirect(`/autorisation-parentale/${encodeURIComponent(token)}?erreur=La%20confirmation%20est%20obligatoire.`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('confirm_guardian_consent', { raw_token: token });
  if (error) redirect(`/autorisation-parentale/${encodeURIComponent(token)}?erreur=Lien%20invalide%20ou%20expiré.`);
  redirect('/autorisation-parentale/confirmee');
}
