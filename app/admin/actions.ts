'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function reviewAssociation(formData: FormData) {
  const admin = await requireAdmin();
  const associationId = String(formData.get('association_id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  const note = String(formData.get('review_note') ?? '').trim() || null;
  if (!associationId || !['approved', 'rejected', 'suspended'].includes(decision)) {
    redirect('/admin?erreur=Décision%20invalide.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('associations')
    .update({
      status: decision,
      review_note: note,
      approved_by: decision === 'approved' ? admin.id : null,
      approved_at: decision === 'approved' ? new Date().toISOString() : null,
      suspended_at: decision === 'suspended' ? new Date().toISOString() : null,
    })
    .eq('id', associationId)
    .select('id')
    .single();

  if (error) redirect(`/admin?erreur=${encodeURIComponent(`Impossible de modifier l’association : ${error.message}`)}`);
  revalidatePath('/admin');
  revalidatePath('/mon-association');
  redirect(`/admin?message=${encodeURIComponent(decision === 'approved' ? 'Association approuvée.' : decision === 'rejected' ? 'Association refusée.' : 'Association suspendue.')}`);
}

function field(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }

export async function updateUserStatus(formData: FormData) {
  const admin = await requireAdmin();
  const userId = field(formData, 'user_id');
  const status = field(formData, 'status');
  if (!userId || !['active', 'suspended', 'deleted'].includes(status)) redirect('/admin/utilisateurs?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  if (admin.id === userId && status !== 'active') redirect('/admin/utilisateurs?erreur=Tu%20ne%20peux%20pas%20suspendre%20ou%20supprimer%20ton%20propre%20compte%20administrateur.');
  const { error } = await supabase.from('profiles').update({ status, deleted_at: status === 'deleted' ? new Date().toISOString() : null }).eq('id', userId).select('id').single();
  if (error) redirect(`/admin/utilisateurs?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/utilisateurs');
  redirect(`/admin/utilisateurs?message=${encodeURIComponent(status === 'active' ? 'Compte réactivé.' : status === 'suspended' ? 'Compte suspendu.' : 'Compte supprimé sans effacer son historique.')}`);
}

export async function updateAssociationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const associationId = field(formData, 'association_id');
  const status = field(formData, 'status');
  if (!associationId || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) redirect('/admin/associations?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('associations').update({ status, approved_by: status === 'approved' ? admin.id : null, approved_at: status === 'approved' ? new Date().toISOString() : null, suspended_at: status === 'suspended' ? new Date().toISOString() : null }).eq('id', associationId).select('id').single();
  if (error) redirect(`/admin/associations?erreur=${encodeURIComponent(`Impossible de modifier l’association : ${error.message}`)}`);
  revalidatePath('/admin/associations');
  revalidatePath('/mon-association');
  redirect(`/admin/associations?message=${encodeURIComponent(status === 'approved' ? 'Association approuvée.' : status === 'rejected' ? 'Association refusée.' : status === 'suspended' ? 'Association suspendue.' : 'Association réactivée en attente.')}`);
}

export async function updateTournamentStatus(formData: FormData) {
  await requireAdmin();
  const tournamentId = field(formData, 'tournament_id');
  const status = field(formData, 'status');
  if (!tournamentId || !['published', 'cancelled', 'archived', 'hidden'].includes(status)) redirect('/admin/tournois?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournaments').update({ status }).eq('id', tournamentId).select('id').single();
  if (error) redirect(`/admin/tournois?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/tournois');
  revalidatePath(`/tournoi/${tournamentId}`);
  redirect(`/admin/tournois?message=${encodeURIComponent(`Tournoi ${status === 'published' ? 'publié' : status === 'archived' ? 'archivé' : status === 'cancelled' ? 'annulé' : 'masqué'}.`)}`);
}

export async function moderateContent(formData: FormData) {
  await requireAdmin();
  const table = field(formData, 'content_type');
  const contentId = field(formData, 'content_id');
  const status = field(formData, 'status');
  if (!['posts', 'post_comments', 'tournament_comments'].includes(table) || !contentId || !['published', 'hidden', 'deleted'].includes(status)) redirect('/admin/moderation?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const values = { status, deleted_at: status === 'deleted' ? new Date().toISOString() : null };
  const result = table === 'posts'
    ? await supabase.from('posts').update(values).eq('id', contentId).select('id').single()
    : table === 'post_comments'
      ? await supabase.from('post_comments').update(values).eq('id', contentId).select('id').single()
      : await supabase.from('tournament_comments').update(values).eq('id', contentId).select('id').single();
  if (result.error) redirect(`/admin/moderation?erreur=${encodeURIComponent(result.error.message)}`);
  revalidatePath('/admin/moderation');
  revalidatePath('/actualite');
  redirect(`/admin/moderation?message=${encodeURIComponent(status === 'published' ? 'Contenu publié.' : status === 'hidden' ? 'Contenu masqué.' : 'Contenu retiré sans effacer son historique.')}`);
}

export async function updateRegistrationStatus(formData: FormData) {
  await requireAdmin();
  const registrationId = field(formData, 'registration_id');
  const status = field(formData, 'status');
  if (!registrationId || !['pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected'].includes(status)) redirect('/admin/inscriptions?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournament_registrations').update({ status, cancelled_at: status === 'cancelled' ? new Date().toISOString() : null }).eq('id', registrationId).select('id').single();
  if (error) redirect(`/admin/inscriptions?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/inscriptions');
  redirect(`/admin/inscriptions?message=${encodeURIComponent(`Inscription mise à jour : ${status}.`)}`);
}

export async function updateUserProfileAdmin(formData: FormData) {
  await requireAdmin();
  const userId = field(formData, 'user_id');
  const username = field(formData, 'username');
  const accountType = field(formData, 'account_type');
  if (!userId || !/^[A-Za-z0-9._-]{3,30}$/.test(username) || !['player', 'association'].includes(accountType)) redirect(`/admin/utilisateurs/${userId}?erreur=Informations%20invalides.`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('profiles').update({ username, account_type: accountType, first_name: field(formData, 'first_name') || null, last_name: field(formData, 'last_name') || null, city: field(formData, 'city') || null, club_name: field(formData, 'club_name') || null }).eq('id', userId).select('id').single();
  if (error) redirect(`/admin/utilisateurs/${userId}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/utilisateurs/${userId}`); revalidatePath('/admin/utilisateurs'); revalidatePath('/recherche');
  redirect(`/admin/utilisateurs/${userId}?message=Compte%20mis%20à%20jour.`);
}

export async function updateAssociationAdmin(formData: FormData) {
  await requireAdmin();
  const id = field(formData, 'association_id');
  const name = field(formData, 'name');
  const email = field(formData, 'email').toLowerCase();
  if (!id || name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) redirect(`/admin/associations/${id}?erreur=Informations%20invalides.`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('associations').update({ name, email, city: field(formData, 'city') || null, phone: field(formData, 'phone') || null, description: field(formData, 'description') || null, address: field(formData, 'address') || null, website: field(formData, 'website') || null, review_note: field(formData, 'review_note') || null }).eq('id', id).select('id').single();
  if (error) redirect(`/admin/associations/${id}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/associations/${id}`); revalidatePath('/admin/associations');
  redirect(`/admin/associations/${id}?message=Association%20mise%20à%20jour.`);
}

export async function deleteAssociationAdmin(formData: FormData) {
  await requireAdmin(); const id = field(formData, 'association_id'); const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('associations').update({ deleted_at: new Date().toISOString(), status: 'suspended' }).eq('id', id).select('id').single();
  if (error) redirect(`/admin/associations/${id}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/associations'); redirect('/admin/associations?message=Association%20supprimée%20sans%20effacer%20son%20historique.');
}

export async function updateTournamentAdmin(formData: FormData) {
  await requireAdmin(); const id = field(formData, 'tournament_id'); const name = field(formData, 'name');
  if (!id || name.length < 2) redirect(`/admin/tournois/${id}?erreur=Informations%20invalides.`);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournaments').update({ name, date: field(formData, 'date'), time: field(formData, 'time'), city: field(formData, 'city'), location: field(formData, 'location'), address: field(formData, 'address') || null, format: field(formData, 'format') || null, description: field(formData, 'description') || null, additional_info: field(formData, 'additional_info') || null, registration_enabled: formData.get('registration_enabled') === 'on' }).eq('id', id).select('id').single();
  if (error) redirect(`/admin/tournois/${id}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath(`/admin/tournois/${id}`); revalidatePath(`/tournoi/${id}`); revalidatePath('/admin/tournois');
  redirect(`/admin/tournois/${id}?message=Tournoi%20mis%20à%20jour.`);
}

export async function deleteTournamentAdmin(formData: FormData) {
  await requireAdmin(); const id = field(formData, 'tournament_id'); const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournaments').update({ deleted_at: new Date().toISOString(), status: 'hidden' }).eq('id', id).select('id').single();
  if (error) redirect(`/admin/tournois/${id}?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/tournois'); redirect('/admin/tournois?message=Tournoi%20supprimé%20sans%20effacer%20les%20données%20liées.');
}

export async function updateAppLogo(formData: FormData) {
  const admin = await requireAdmin();
  const mediaId = field(formData, 'logo_media_id');
  if (!mediaId) redirect('/admin/apparence?erreur=Choisis%20un%20logo.');
  const supabase = await createServerSupabaseClient();
  const { data: media, error: mediaError } = await supabase.from('media_assets').select('bucket_id, storage_path').eq('id', mediaId).eq('owner_id', admin.id).eq('kind', 'logo').eq('bucket_id', 'branding').is('deleted_at', null).maybeSingle();
  if (mediaError || !media) redirect(`/admin/apparence?erreur=${encodeURIComponent(mediaError?.message ?? 'Logo introuvable.')}`);
  const logoUrl = supabase.storage.from(media.bucket_id).getPublicUrl(media.storage_path).data.publicUrl;
  const { error } = await supabase.from('app_settings').update({ value: logoUrl, updated_by: admin.id, updated_at: new Date().toISOString() }).eq('key', 'logo_url').select('key').single();
  if (error) redirect(`/admin/apparence?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/', 'layout');
  redirect('/admin/apparence?message=Logo%20VolleyPéi%20mis%20à%20jour.');
}
