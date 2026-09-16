import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import PendingSubmitButton from '@/components/forms/PendingSubmitButton';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import { updateAssociation } from '@/app/associations/actions';
import { requireIdentity } from '@/lib/auth';
import { protectedMediaUrl } from '@/lib/media';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function EditAssociationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const [{ id }, query, identity] = await Promise.all([params, searchParams, requireIdentity('/connexion?retour=/mon-association')]);
  const supabase = await createServerSupabaseClient();
  const { data: membership } = await supabase.from('association_members').select('role, associations(id, name, description, email, phone, address, city, registration_number, website, instagram_url, facebook_url, logo_path)').eq('association_id', id).eq('user_id', identity.id).eq('status', 'active').in('role', ['owner', 'admin']).maybeSingle();
  const relation = membership?.associations as Association | Association[] | null | undefined;
  const association = Array.isArray(relation) ? relation[0] : relation;

  if (!association) return <section className="px-4 py-16 text-center"><h1 className="font-display text-2xl font-semibold">Accès refusé</h1><Link href="/mon-association" className="mt-4 inline-block text-sm underline">Retour à mes associations</Link></section>;
  const logoUrl = protectedMediaUrl(association.logo_path);

  return <section className="px-4 py-8 sm:py-14"><div className="mx-auto max-w-3xl"><Link href="/mon-association" className="inline-flex items-center gap-2 text-sm text-ink-500"><ArrowLeft className="h-4 w-4" /> Mon association</Link><p className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">Gestion</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Modifier {association.name}</h1><p className="mt-3 text-sm text-ink-500">Toutes les informations peuvent être actualisées. Le nouveau logo remplace l’ancien uniquement si tu en sélectionnes un.</p><form action={updateAssociation} className="mt-7 space-y-5 rounded-3xl border border-ink-200 bg-white p-6 shadow-card sm:p-8"><AuthNotice error={query.erreur} /><input type="hidden" name="association_id" value={association.id} /><div><p className="mb-2 text-sm font-medium">Logo de l’association</p>{logoUrl && <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-2xl bg-ink-50 p-3 ring-1 ring-ink-200"><Image src={logoUrl} alt={`Logo de ${association.name}`} width={180} height={180} className="max-h-full w-auto object-contain" unoptimized /></div>}<OptimizedMediaPicker usage="logo" associationId={association.id} inputName="logo_media_id" /></div><label className="block text-sm font-medium">Nom de l’association<input name="name" required minLength={2} defaultValue={association.name} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label><label className="block text-sm font-medium">Présentation<textarea name="description" rows={5} maxLength={3000} defaultValue={association.description ?? ''} className="mt-2 w-full resize-none rounded-xl border border-ink-200 px-4 py-3" /></label><div className="grid gap-4 sm:grid-cols-2"><Field label="E-mail officiel" name="email" type="email" value={association.email} required /><Field label="Téléphone" name="phone" type="tel" value={association.phone} /><Field label="Adresse" name="address" value={association.address} /><Field label="Commune" name="city" value={association.city} /><Field label="N° d’identification" name="registration_number" value={association.registration_number} /><Field label="Site web" name="website" type="url" value={association.website} /><Field label="Instagram" name="instagram_url" type="url" value={association.instagram_url} /><Field label="Facebook" name="facebook_url" type="url" value={association.facebook_url} /></div><PendingSubmitButton pendingLabel="Enregistrement…" className="w-full rounded-xl bg-ink-950 px-5 py-3 font-semibold text-white disabled:opacity-60">Enregistrer les modifications</PendingSubmitButton></form></div></section>;
}

type Association = { id: string; name: string; description: string | null; email: string | null; phone: string | null; address: string | null; city: string | null; registration_number: string | null; website: string | null; instagram_url: string | null; facebook_url: string | null; logo_path: string | null };

function Field({ label, name, value, type = 'text', required = false }: { label: string; name: string; value: string | null; type?: string; required?: boolean }) {
  return <label className="text-sm font-medium">{label}<input name={name} type={type} required={required} defaultValue={value ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>;
}
