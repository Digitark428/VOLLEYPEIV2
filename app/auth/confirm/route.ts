import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  const requestedNext = url.searchParams.get('next') ?? '/profil/completer';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/profil/completer';

  if (tokenHash && type) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const { data: claims } = await supabase.auth.getClaims();
      if (claims?.claims?.sub) {
        const { data: privateProfile } = await supabase
          .from('profile_private')
          .select('birth_date, guardian_consent')
          .eq('user_id', claims.claims.sub)
          .maybeSingle();
        const birthDate = privateProfile?.birth_date ? new Date(`${privateProfile.birth_date}T00:00:00`) : null;
        const adultBoundary = new Date();
        adultBoundary.setFullYear(adultBoundary.getFullYear() - 18);
        if (birthDate && birthDate > adultBoundary && privateProfile?.guardian_consent === 'pending') {
          const { data: consentToken } = await supabase.rpc('create_profile_guardian_consent_request');
          if (consentToken) {
            return NextResponse.redirect(new URL(`/profil/autorisation?token=${encodeURIComponent(String(consentToken))}`, url.origin));
          }
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  return NextResponse.redirect(new URL('/connexion?erreur=Lien%20invalide%20ou%20expiré.', url.origin));
}
