import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import CopyConsentLink from '@/components/auth/CopyConsentLink';
import { requireIdentity } from '@/lib/auth';

export default async function GuardianLinkPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const [, params] = await Promise.all([requireIdentity(), searchParams]);
  const path = params.token ? `/autorisation-parentale/${encodeURIComponent(params.token)}` : '';
  return <section className="px-4 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-card"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-800"><ShieldCheck className="h-7 w-7" /></div><h1 className="mt-5 font-display text-3xl font-semibold">Autorisation parentale requise</h1><p className="mt-3 text-sm leading-6 text-ink-500">Envoie ce lien privé au parent ou responsable majeur renseigné. Il expire dans 7 jours. Le profil sera complété après sa confirmation.</p>{path ? <div className="mt-6"><CopyConsentLink path={path} /></div> : <p className="mt-6 text-sm font-medium text-red-600">Le lien n’est plus disponible. Enregistre à nouveau le profil pour en créer un.</p>}<Link href="/profil" className="mt-5 inline-flex text-sm font-semibold text-reunion-blue">Retour à mon profil</Link></div></section>;
}
