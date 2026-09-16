import Image from 'next/image';
import AdminNav from '@/components/admin/AdminNav';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AuthNotice from '@/components/auth/AuthNotice';
import PendingSubmitButton from '@/components/forms/PendingSubmitButton';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateAppLogo } from '../actions';

export default async function AppearancePage({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [, params] = await Promise.all([requireAdmin(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'logo_url').maybeSingle();
  const logoUrl = data?.value ?? '/brand/volley-pei.png';
  return <section className="px-4 py-10"><div className="mx-auto max-w-4xl"><AdminPageHeader eyebrow="Administration" title="Apparence / Logo VolleyPéi" description="Une seule source de vérité pour le header, la connexion et l’écran d’introduction." /><AdminNav /><div className="mt-5"><AuthNotice error={params.erreur} message={params.message} /></div><div className="mt-7 grid gap-6 md:grid-cols-2"><div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft"><h2 className="font-display text-xl font-semibold">Logo actuel</h2><div className="mt-5 flex min-h-64 items-center justify-center rounded-2xl bg-white p-6 ring-1 ring-ink-100"><Image src={logoUrl} alt="Logo VolleyPéi actuel" width={500} height={500} className="max-h-56 w-auto max-w-full object-contain" unoptimized /></div></div><form action={updateAppLogo} className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft"><h2 className="font-display text-xl font-semibold">Remplacer le logo</h2><p className="mt-2 text-sm leading-6 text-ink-500">PNG ou WebP transparent. Le fichier est optimisé avant l’envoi et son ratio reste intact.</p><div className="mt-5"><OptimizedMediaPicker usage="logo" bucket="branding" inputName="logo_media_id" required /></div><PendingSubmitButton pendingLabel="Mise à jour…" className="mt-6 w-full rounded-xl bg-ink-950 px-5 py-3 font-semibold text-white disabled:opacity-60">Utiliser ce logo partout</PendingSubmitButton></form></div></div></section>;
}
