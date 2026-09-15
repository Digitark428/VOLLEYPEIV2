'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function text(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
function back(id: string, key: 'erreur' | 'message', message: string) { return `/mon-association/${id}/membres?${key}=${encodeURIComponent(message)}`; }

export async function addAssociationMember(formData: FormData) {
  const identity = await requireIdentity();
  const associationId = text(formData, 'association_id');
  const username = text(formData, 'username');
  const role = text(formData, 'role') === 'member' ? 'member' : 'admin';
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('id').ilike('username', username).eq('status', 'active').is('deleted_at', null).maybeSingle();
  if (!profile) redirect(back(associationId, 'erreur', 'Aucun utilisateur actif ne correspond à ce pseudo.'));
  const { data: existing } = await supabase.from('association_members').select('id').eq('association_id', associationId).eq('user_id', profile.id).maybeSingle();
  const mutation = existing
    ? supabase.from('association_members').update({ role, status: 'active', invited_by: identity.id }).eq('id', existing.id).select('id').single()
    : supabase.from('association_members').insert({ association_id: associationId, user_id: profile.id, role, status: 'active', invited_by: identity.id }).select('id').single();
  const { error } = await mutation;
  if (error) redirect(back(associationId, 'erreur', `Impossible d’ajouter ce membre : ${error.message}`));
  revalidatePath(`/mon-association/${associationId}/membres`);
  redirect(back(associationId, 'message', 'Responsable ajouté à l’association.'));
}

export async function updateAssociationMemberRole(formData: FormData) {
  await requireIdentity();
  const associationId = text(formData, 'association_id');
  const membershipId = text(formData, 'membership_id');
  const role = text(formData, 'role');
  if (!['owner', 'admin', 'member'].includes(role)) redirect(back(associationId, 'erreur', 'Rôle invalide.'));
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('association_members').update({ role }).eq('id', membershipId).eq('association_id', associationId).select('id').single();
  if (error) redirect(back(associationId, 'erreur', `Impossible de modifier le rôle : ${error.message}`));
  revalidatePath(`/mon-association/${associationId}/membres`);
  redirect(back(associationId, 'message', 'Rôle mis à jour.'));
}

export async function removeAssociationMember(formData: FormData) {
  await requireIdentity();
  const associationId = text(formData, 'association_id');
  const membershipId = text(formData, 'membership_id');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('association_members').delete().eq('id', membershipId).eq('association_id', associationId);
  if (error) redirect(back(associationId, 'erreur', `Impossible de retirer ce membre : ${error.message}`));
  revalidatePath(`/mon-association/${associationId}/membres`);
  redirect(back(associationId, 'message', 'Membre retiré de l’association.'));
}
