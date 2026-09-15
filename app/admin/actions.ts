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
    .eq('id', associationId);

  if (error) redirect(`/admin?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin');
  revalidatePath('/mon-association');
  redirect('/admin?message=Association%20mise%20à%20jour.');
}

function field(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }

export async function updateUserStatus(formData: FormData) {
  await requireAdmin();
  const userId = field(formData, 'user_id');
  const status = field(formData, 'status');
  if (!userId || !['active', 'suspended', 'deleted'].includes(status)) redirect('/admin/utilisateurs?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('profiles').update({ status, deleted_at: status === 'deleted' ? new Date().toISOString() : null }).eq('id', userId);
  if (error) redirect(`/admin/utilisateurs?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/utilisateurs');
}

export async function updateAssociationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const associationId = field(formData, 'association_id');
  const status = field(formData, 'status');
  if (!associationId || !['pending', 'approved', 'rejected', 'suspended'].includes(status)) redirect('/admin/associations?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('associations').update({ status, approved_by: status === 'approved' ? admin.id : null, approved_at: status === 'approved' ? new Date().toISOString() : null, suspended_at: status === 'suspended' ? new Date().toISOString() : null }).eq('id', associationId);
  if (error) redirect(`/admin/associations?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/associations');
}

export async function updateTournamentStatus(formData: FormData) {
  await requireAdmin();
  const tournamentId = field(formData, 'tournament_id');
  const status = field(formData, 'status');
  if (!tournamentId || !['published', 'cancelled', 'archived', 'hidden'].includes(status)) redirect('/admin/tournois?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournaments').update({ status }).eq('id', tournamentId);
  if (error) redirect(`/admin/tournois?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/tournois');
  revalidatePath(`/tournoi/${tournamentId}`);
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
    ? await supabase.from('posts').update(values).eq('id', contentId)
    : table === 'post_comments'
      ? await supabase.from('post_comments').update(values).eq('id', contentId)
      : await supabase.from('tournament_comments').update(values).eq('id', contentId);
  if (result.error) redirect(`/admin/moderation?erreur=${encodeURIComponent(result.error.message)}`);
  revalidatePath('/admin/moderation');
  revalidatePath('/actualite');
}

export async function updateRegistrationStatus(formData: FormData) {
  await requireAdmin();
  const registrationId = field(formData, 'registration_id');
  const status = field(formData, 'status');
  if (!registrationId || !['pending', 'confirmed', 'waitlisted', 'cancelled', 'rejected'].includes(status)) redirect('/admin/inscriptions?erreur=Action%20invalide.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('tournament_registrations').update({ status, cancelled_at: status === 'cancelled' ? new Date().toISOString() : null }).eq('id', registrationId);
  if (error) redirect(`/admin/inscriptions?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/admin/inscriptions');
}
