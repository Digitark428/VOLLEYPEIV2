'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { slugify } from '@/lib/text';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) {
  const item = String(formData.get(key) ?? '').trim();
  return item || null;
}

export async function createAssociation(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/associations/nouvelle');
  const name = value(formData, 'name') ?? '';
  const email = value(formData, 'email')?.toLowerCase() ?? '';
  const accepted = formData.get('certification') === 'on';
  const logoMediaId = value(formData, 'logo_media_id');

  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || !accepted) {
    redirect('/associations/nouvelle?erreur=Vérifie%20les%20informations%20obligatoires.');
  }

  const supabase = await createServerSupabaseClient();
  let logoPath: string | null = null;
  if (logoMediaId) {
    const { data: logo } = await supabase.from('media_assets').select('storage_path').eq('id', logoMediaId).eq('owner_id', identity.id).eq('kind', 'logo').is('deleted_at', null).maybeSingle();
    if (!logo) redirect('/associations/nouvelle?erreur=Logo%20introuvable.');
    logoPath = logo.storage_path;
  }
  const baseSlug = slugify(name) || 'association';
  const suffix = crypto.randomUUID().slice(0, 6);
  const slug = `${baseSlug}-${suffix}`;
  const { data: created, error } = await supabase.from('associations').insert({
    name,
    slug,
    email,
    phone: value(formData, 'phone'),
    description: value(formData, 'description'),
    address: value(formData, 'address'),
    city: value(formData, 'city'),
    registration_number: value(formData, 'registration_number'),
    website: value(formData, 'website'),
    instagram_url: value(formData, 'instagram_url'),
    facebook_url: value(formData, 'facebook_url'),
    logo_path: logoPath,
    status: 'pending',
    created_by: identity.id,
  }).select('id').single();

  if (error) redirect(`/associations/nouvelle?erreur=${encodeURIComponent(error.message)}`);

  if (logoMediaId) {
    if (created) await supabase.from('media_assets').update({ association_id: created.id }).eq('id', logoMediaId);
  }

  await supabase.from('profiles').update({ account_type: 'association' }).eq('id', identity.id);
  revalidatePath('/mon-association');
  redirect('/mon-association?message=Demande%20envoyée.%20VolleyPéi%20va%20la%20vérifier.');
}

export async function updateAssociation(formData: FormData) {
  const identity = await requireIdentity('/connexion');
  const associationId = value(formData, 'association_id');
  if (!associationId) redirect('/mon-association?erreur=Association%20introuvable.');

  const supabase = await createServerSupabaseClient();
  const { data: membership } = await supabase.from('association_members').select('role').eq('association_id', associationId).eq('user_id', identity.id).eq('status', 'active').in('role', ['owner', 'admin']).maybeSingle();
  if (!membership) redirect('/mon-association?erreur=Vous%20ne%20pouvez%20pas%20modifier%20cette%20association.');

  const logoMediaId = value(formData, 'logo_media_id');
  let logoPath: string | undefined;
  if (logoMediaId) {
    const { data: logo } = await supabase.from('media_assets').select('storage_path').eq('id', logoMediaId).eq('owner_id', identity.id).eq('association_id', associationId).eq('kind', 'logo').is('deleted_at', null).maybeSingle();
    if (!logo) redirect(`/mon-association/${associationId}/modifier?erreur=Logo%20introuvable.`);
    logoPath = logo.storage_path;
  }

  const name = value(formData, 'name') ?? '';
  const email = value(formData, 'email')?.toLowerCase() ?? '';
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email)) redirect(`/mon-association/${associationId}/modifier?erreur=Vérifie%20les%20informations%20obligatoires.`);

  const { error } = await supabase
    .from('associations')
    .update({
      name,
      email,
      phone: value(formData, 'phone'),
      description: value(formData, 'description'),
      address: value(formData, 'address'),
      city: value(formData, 'city'),
      registration_number: value(formData, 'registration_number'),
      website: value(formData, 'website'),
      instagram_url: value(formData, 'instagram_url'),
      facebook_url: value(formData, 'facebook_url'),
      ...(logoPath ? { logo_path: logoPath } : {}),
    })
    .eq('id', associationId)
    .select('slug')
    .single();

  if (error) redirect(`/mon-association/${associationId}/modifier?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/mon-association');
  revalidatePath('/associations', 'layout');
  redirect('/mon-association?message=Association%20mise%20à%20jour.');
}

export async function deleteManagedAssociation(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/mon-association');
  const associationId = value(formData, 'association_id');
  if (!associationId) redirect('/mon-association?erreur=Association%20introuvable.');
  const supabase = await createServerSupabaseClient();
  const { data: membership } = await supabase.from('association_members').select('id').eq('association_id', associationId).eq('user_id', identity.id).eq('status', 'active').eq('role', 'owner').maybeSingle();
  if (!membership) redirect('/mon-association?erreur=Seul%20le%20propriétaire%20peut%20supprimer%20cette%20association.');
  const { error } = await supabase.from('associations').update({ deleted_at: new Date().toISOString(), status: 'suspended' }).eq('id', associationId).select('id').single();
  if (error) redirect(`/mon-association?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/mon-association'); revalidatePath('/admin/associations'); revalidatePath('/', 'layout');
  redirect('/mon-association?message=Association%20supprimée.');
}
