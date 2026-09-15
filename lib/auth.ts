import 'server-only';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function getCurrentIdentity() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) return null;

  const userId = data.claims.sub;
  const [{ data: profile }, { data: admin }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, username, account_type, first_name, last_name, show_real_name, show_age, avatar_path, city, club_name, bio, experience_summary, disciplines, achievements, years_practice, onboarding_completed, status')
      .eq('id', userId)
      .maybeSingle(),
    supabase.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle(),
  ]);

  return {
    id: userId,
    email: typeof data.claims.email === 'string' ? data.claims.email : null,
    profile,
    isAdmin: Boolean(admin),
  };
}

export async function requireIdentity(next = '/connexion') {
  const identity = await getCurrentIdentity();
  if (!identity) redirect(next);
  return identity;
}

export async function requireAdmin() {
  const identity = await requireIdentity('/connexion?retour=/admin');
  if (!identity.isAdmin) redirect('/profil?erreur=acces-refuse');
  return identity;
}
