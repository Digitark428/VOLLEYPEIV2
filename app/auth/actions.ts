'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ageOn } from '@/lib/text';

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
  const firstName = value(formData, 'first_name');
  const lastName = value(formData, 'last_name');
  const birthDate = value(formData, 'birth_date');
  const city = value(formData, 'city');
  const guardianFullName = value(formData, 'guardian_full_name');
  const guardianEmail = value(formData, 'guardian_email').toLowerCase();
  const requestedAccountType = value(formData, 'account_type');
  const accountType = requestedAccountType === 'association' ? 'association' : 'player';
  const age = ageOn(birthDate);
  const isMinor = age !== null && age < 18;

  if (!['player', 'association'].includes(requestedAccountType)) {
    redirect(withMessage('/inscription', 'erreur', 'Choisis un type de compte.'));
  }

  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    redirect(withMessage('/inscription', 'erreur', 'Le pseudo doit contenir 3 à 30 lettres, chiffres, points, tirets ou underscores.'));
  }
  if (firstName.length < 2 || lastName.length < 2) {
    redirect(withMessage('/inscription', 'erreur', 'Le prénom et le nom sont obligatoires.'));
  }
  if (!birthDate || age === null || !Number.isFinite(age) || age < 5 || age > 120) {
    redirect(withMessage('/inscription', 'erreur', 'La date de naissance est invalide.'));
  }
  if (city.length < 2 || city.length > 100) {
    redirect(withMessage('/inscription', 'erreur', 'La ville de résidence est obligatoire.'));
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    redirect(withMessage('/inscription', 'erreur', 'Adresse e-mail invalide.'));
  }
  if (password.length < 8 || !/[A-Za-zÀ-ÿ]/.test(password) || !/\d/.test(password)) {
    redirect(withMessage('/inscription', 'erreur', 'Le mot de passe doit contenir au moins 8 caractères, une lettre et un chiffre.'));
  }
  if (isMinor && (guardianFullName.length < 3 || !/^\S+@\S+\.\S+$/.test(guardianEmail))) {
    redirect(withMessage('/inscription', 'erreur', 'Les coordonnées du responsable légal sont obligatoires pour un mineur.'));
  }
  if (isMinor && guardianEmail === email) {
    redirect(withMessage('/inscription', 'erreur', 'L’adresse du responsable légal doit être différente de celle du mineur.'));
  }

  const supabase = await createServerSupabaseClient();
  const origin = await getSiteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm?next=/profil`,
      data: {
        username,
        account_type: accountType,
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate,
        city,
        guardian_full_name: isMinor ? guardianFullName : null,
        guardian_email: isMinor ? guardianEmail : null,
      },
    },
  });

  if (error) {
    redirect(withMessage('/inscription', 'erreur', error.message));
  }

  if (data.session) {
    if (isMinor) {
      const { data: token } = await supabase.rpc('create_profile_guardian_consent_request');
      if (token) redirect(`/profil/autorisation?token=${encodeURIComponent(String(token))}`);
    }
    redirect('/profil');
  }
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
  redirect('/connexion');
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
