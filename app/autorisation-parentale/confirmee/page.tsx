import Link from 'next/link';
import { CircleCheck } from 'lucide-react';

export default function ConsentConfirmedPage() {
  return <section className="px-4 py-20"><div className="mx-auto max-w-lg text-center"><CircleCheck className="mx-auto h-14 w-14 text-emerald-600" /><h1 className="mt-5 font-display text-3xl font-semibold">Autorisation confirmée</h1><p className="mt-3 text-sm text-ink-500">Merci. Le profil du joueur peut maintenant être utilisé normalement sur VolleyPéi.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white">Découvrir VolleyPéi</Link></div></section>;
}
