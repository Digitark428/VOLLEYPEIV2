import { ShieldCheck } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import { confirmGuardianConsent } from './actions';

export default async function GuardianConsentPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ erreur?: string }> }) {
  const [{ token }, notices] = await Promise.all([params, searchParams]);
  return <section className="px-4 py-16"><div className="mx-auto max-w-xl rounded-3xl border border-ink-200 bg-white p-8 shadow-card"><ShieldCheck className="h-9 w-9 text-reunion-blue" /><p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">VolleyPéi · Mineur</p><h1 className="mt-3 font-display text-3xl font-semibold">Confirmation du responsable légal</h1><p className="mt-3 text-sm leading-6 text-ink-500">Ce lien confirme uniquement que vous autorisez le joueur mineur à disposer d’un profil VolleyPéi. Aucune donnée parentale n’est rendue publique.</p><AuthNotice error={notices.erreur} /><form action={confirmGuardianConsent} className="mt-6"><input type="hidden" name="token" value={token} /><label className="flex items-start gap-3 rounded-2xl bg-ink-50 p-4 text-sm leading-6"><input name="certification" type="checkbox" required className="mt-1" /><span>Je confirme être le parent ou responsable majeur du joueur et autoriser la création de son profil VolleyPéi.</span></label><button className="mt-5 w-full rounded-xl bg-ink-950 px-5 py-3.5 font-semibold text-white">Confirmer l’autorisation</button></form></div></section>;
}
