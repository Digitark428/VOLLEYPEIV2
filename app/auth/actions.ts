'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function withMessage(path: string, key: 'erreur' | 'message', message: string) {
  return `${path}?${key}=${encodeURIComponent(message)}`;
}

async function getSiteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;

  const requestHeaders = await headers();
  const host = requestHeaders.get('x-forwarded-host') ?? requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? (host?.includes('localhost') ? 'http' : 'https');
  return host ? `${protocol}://${host}` : 'https://volleypeiv-2.vercel.app';
}

export async function signUp(formData: FormData) {
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  const username = value(formData, 'username');
  const accountType = value(formData, 'account_type') === 'association' ? 'association' : 'player';

  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    redirect(withMessage('/inscription', 'erreur', 'Le pseudo doit contenir 3 à 30 lettres, chiffres, points, tirets ou underscores.'));
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    redirect(withMessage('/inscription', 'erreur', 'Adresse e-mail invalide.'));
  }
  if (password.length < 8) {
    redirect(withMessage('/inscription', 'erreur', 'Le mot de passe doit contenir au moins 8 caractères.'));
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getSiteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/profil/completer`,
      data: { username, account_type: accountType },
    },
  });

  if (error) {
    redirect(withMessage('/inscription', 'erreur', error.message));
  }

  if (data.session) redirect('/profil/completer');
  redirect(withMessage('/connexion', 'message', 'Compte créé. Vérifie ta boîte e-mail pour confirmer ton adresse.'));
}

export async function signIn(formData: FormData) {
  const email = value(formData, 'email').toLowerCase();
  const password = value(formData, 'password');
  const requestedReturn = value(formData, 'return_to');
  const returnTo = requestedReturn.startsWith('/') && !requestedReturn.startsWith('//') ? requestedReturn : '/profil';
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(withMessage('/connexion', 'erreur', 'E-mail ou mot de passe incorrect.'));
  }

  redirect(returnTo);
}

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/');
}

export async function requestPasswordReset(formData: FormData) {
  const email = value(formData, 'email').toLowerCase();
  const supabase = await createServerSupabaseClient();
  const origin = await getSiteOrigin();

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/nouveau-mot-de-passe`,
  });

  redirect(withMessage('/connexion', 'message', 'Si ce compte existe, un e-mail de réinitialisation vient d’être envoyé.'));
}

export async function updatePassword(formData: FormData) {
  const password = value(formData, 'password');
  const confirmation = value(formData, 'password_confirmation');

  if (password.length < 8 || password !== confirmation) {
    redirect(withMessage('/auth/nouveau-mot-de-passe', 'erreur', 'Les mots de passe doivent correspondre et contenir au moins 8 caractères.'));
  }

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims) redirect('/connexion');

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(withMessage('/auth/nouveau-mot-de-passe', 'erreur', error.message));
  redirect(withMessage('/profil', 'message', 'Ton mot de passe a été mis à jour.'));
}
