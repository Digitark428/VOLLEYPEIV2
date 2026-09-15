'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function tournamentError(tournamentId: string, message: string): never {
  redirect(`/tournoi/${tournamentId}?erreur=${encodeURIComponent(message)}`);
}

async function toggleRelation(table: 'tournament_participants' | 'tournament_likes', formData: FormData) {
  const tournamentId = value(formData, 'tournament_id');
  const identity = await requireIdentity(`/connexion?retour=/tournoi/${tournamentId}`);
  if (!tournamentId) tournamentError(tournamentId, 'Tournoi introuvable.');
  const supabase = await createServerSupabaseClient();
  const { data: existing, error: readError } = await supabase.from(table).select('tournament_id').eq('tournament_id', tournamentId).eq('profile_id', identity.id).maybeSingle();
  if (readError) tournamentError(tournamentId, readError.message);
  const result = existing
    ? await supabase.from(table).delete().eq('tournament_id', tournamentId).eq('profile_id', identity.id)
    : await supabase.from(table).insert({ tournament_id: tournamentId, profile_id: identity.id });
  if (result.error) tournamentError(tournamentId, result.error.message);
  revalidatePath(`/tournoi/${tournamentId}`);
}

export async function toggleParticipation(formData: FormData) { return toggleRelation('tournament_participants', formData); }
export async function toggleTournamentLike(formData: FormData) { return toggleRelation('tournament_likes', formData); }

export async function addTournamentComment(formData: FormData) {
  const tournamentId = value(formData, 'tournament_id');
  const identity = await requireIdentity(`/connexion?retour=/tournoi/${tournamentId}`);
  const body = value(formData, 'body');
  if (!tournamentId || body.length < 1 || body.length > 2000) tournamentError(tournamentId, 'Le commentaire doit contenir entre 1 et 2 000 caractères.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournament_comments').insert({ tournament_id: tournamentId, author_id: identity.id, body, status: 'published' });
  if (error) tournamentError(tournamentId, error.message);
  revalidatePath(`/tournoi/${tournamentId}`);
}

export async function deleteTournamentComment(formData: FormData) {
  const tournamentId = value(formData, 'tournament_id');
  await requireIdentity(`/connexion?retour=/tournoi/${tournamentId}`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournament_comments').update({ deleted_at: new Date().toISOString() }).eq('id', value(formData, 'comment_id'));
  if (error) tournamentError(tournamentId, error.message);
  revalidatePath(`/tournoi/${tournamentId}`);
}

export async function submitTournamentRegistration(formData: FormData) {
  const tournamentId = value(formData, 'tournament_id');
  await requireIdentity(`/connexion?retour=/tournoi/${tournamentId}`);
  const teamName = value(formData, 'team_name');
  const email = value(formData, 'referent_email').toLowerCase();
  const phone = value(formData, 'referent_phone');
  const players = Array.from({ length: 8 }, (_, index) => ({
    first_name: value(formData, `player_${index}_first_name`),
    last_name: value(formData, `player_${index}_last_name`),
    is_minor: formData.get(`player_${index}_is_minor`) === 'on',
    guardian_full_name: value(formData, `player_${index}_guardian_name`),
    guardian_email: value(formData, `player_${index}_guardian_email`).toLowerCase(),
  })).filter((player) => player.first_name || player.last_name);

  if (!tournamentId || teamName.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !phone || players.length < 1) tournamentError(tournamentId, 'Vérifie les informations obligatoires de l’équipe.');
  if (players.some((player) => !player.first_name || !player.last_name || (player.is_minor && (!player.guardian_full_name || !/^\S+@\S+\.\S+$/.test(player.guardian_email))))) tournamentError(tournamentId, 'Chaque joueur doit avoir un nom complet. Le responsable est obligatoire pour un mineur.');

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('submit_tournament_registration', {
    target_tournament: tournamentId,
    submitted_team_name: teamName,
    submitted_email: email,
    submitted_phone: phone,
    submitted_category: value(formData, 'category'),
    submitted_level: value(formData, 'level'),
    submitted_notes: value(formData, 'notes'),
    submitted_players: players,
  });
  if (error) tournamentError(tournamentId, error.message);
  revalidatePath(`/tournoi/${tournamentId}`);
  redirect(`/tournoi/${tournamentId}?message=Inscription%20envoyée%20à%20l’association.`);
}
