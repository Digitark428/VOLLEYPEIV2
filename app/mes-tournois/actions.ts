'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { slugify } from '@/lib/text';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function createError(message: string): never { redirect(`/mes-tournois/nouveau?erreur=${encodeURIComponent(message)}`); }

export async function createTournament(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/mes-tournois/nouveau');
  const associationId = value(formData, 'association_id');
  const posterMediaId = value(formData, 'poster_media_id');
  const name = value(formData, 'name');
  const date = value(formData, 'date');
  const time = value(formData, 'time');
  const city = value(formData, 'city');
  const type = value(formData, 'type');
  const location = value(formData, 'location');
  const playersCount = Number.parseInt(value(formData, 'players_count'), 10);
  if (!associationId || !posterMediaId || name.length < 2 || !date || !time || !city || !type || !location || !Number.isFinite(playersCount) || playersCount < 1) createError('Vérifie tous les champs obligatoires et ajoute une affiche.');

  const supabase = await createServerSupabaseClient();
  const [{ data: membership }, { data: association }, { data: media }] = await Promise.all([
    supabase.from('association_members').select('id').eq('association_id', associationId).eq('user_id', identity.id).eq('status', 'active').in('role', ['owner', 'admin']).maybeSingle(),
    supabase.from('associations').select('id').eq('id', associationId).eq('status', 'approved').is('deleted_at', null).maybeSingle(),
    supabase.from('media_assets').select('id, bucket_id, storage_path').eq('id', posterMediaId).eq('owner_id', identity.id).eq('kind', 'poster').is('deleted_at', null).maybeSingle(),
  ]);
  if (!membership || !association) createError('Cette association n’est pas encore autorisée à publier des tournois.');
  if (!media) createError('L’affiche optimisée est introuvable.');
  const posterUrl = supabase.storage.from(media.bucket_id).getPublicUrl(media.storage_path).data.publicUrl;
  const deadlineInput = value(formData, 'registration_deadline');
  const deadline = deadlineInput ? new Date(`${deadlineInput}:00+04:00`).toISOString() : null;
  const { data: tournament, error } = await supabase.from('tournaments').insert({
    association_id: associationId,
    created_by: identity.id,
    poster_media_id: posterMediaId,
    poster_url: posterUrl,
    slug: `${slugify(name) || 'tournoi'}-${crypto.randomUUID().slice(0, 6)}`,
    status: 'published',
    name,
    date,
    time,
    city,
    type,
    location,
    address: value(formData, 'address') || null,
    latitude: Number(value(formData, 'latitude')) || null,
    longitude: Number(value(formData, 'longitude')) || null,
    players_count: playersCount,
    format: value(formData, 'format') || null,
    description: value(formData, 'description'),
    additional_info: value(formData, 'additional_info') || null,
    phone: value(formData, 'phone') || null,
    email: value(formData, 'email').toLowerCase() || null,
    registration_enabled: formData.get('registration_enabled') === 'on',
    registration_deadline: deadline,
    max_teams: Number(value(formData, 'max_teams')) || null,
  }).select('id').single();
  if (error || !tournament) createError(error?.message ?? 'Impossible de créer le tournoi.');
  await supabase.from('media_assets').update({ association_id: associationId }).eq('id', posterMediaId);
  revalidatePath('/');
  revalidatePath('/mes-tournois');
  redirect(`/tournoi/${tournament.id}?message=Tournoi%20publié.`);
}

export async function reviewResultClaim(formData: FormData) {
  const identity = await requireIdentity();
  const tournamentId = value(formData, 'tournament_id');
  const claimId = value(formData, 'claim_id');
  const decision = value(formData, 'decision');
  if (!claimId || !tournamentId || !['confirmed', 'rejected'].includes(decision)) redirect(`/mes-tournois/${tournamentId}/inscriptions?erreur=Décision%20invalide.`);
  const supabase = await createServerSupabaseClient();
  const { data: tournament } = await supabase.from('tournaments').select('association_id').eq('id', tournamentId).maybeSingle();
  if (!tournament) redirect(`/mes-tournois?erreur=Tournoi%20introuvable.`);
  const { data: membership } = await supabase.from('association_members').select('id').eq('association_id', tournament.association_id).eq('user_id', identity.id).eq('status', 'active').in('role', ['owner', 'admin']).maybeSingle();
  if (!membership && !identity.isAdmin) redirect(`/mes-tournois/${tournamentId}/inscriptions?erreur=Accès%20refusé.`);
  const { error } = await supabase.rpc('review_tournament_result_claim', { target_claim: claimId, decision });
  if (error) redirect(`/mes-tournois/${tournamentId}/inscriptions?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath(`/mes-tournois/${tournamentId}/inscriptions`); revalidatePath(`/tournoi/${tournamentId}`);
  redirect(`/mes-tournois/${tournamentId}/inscriptions?message=${decision === 'confirmed' ? 'Résultat%20confirmé.' : 'Résultat%20refusé.'}`);
}
