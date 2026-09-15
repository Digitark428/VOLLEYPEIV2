import Link from 'next/link';
import { UserRound, Building2, ShieldCheck, LogOut } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import { signOut } from '@/app/auth/actions';
import { requireIdentity } from '@/lib/auth';

export default async function ProfileDashboard({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity(), searchParams]);
  const profile = identity.profile;

  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <AuthNotice error={params.erreur} message={params.message} />
        <div className="rounded-3xl bg-ink-950 p-7 text-white shadow-lift sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Mon espace</p>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="font-display text-3xl font-semibold sm:text-5xl">@{profile?.username ?? 'joueur'}</h1>
              <p className="mt-3 max-w-xl text-sm text-white/60">{identity.email}</p>
            </div>
            {identity.isAdmin && <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm"><ShieldCheck className="h-4 w-4" /> Administrateur VolleyPéi</span>}
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link href="/profil/completer" className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
            <UserRound className="h-6 w-6" />
            <h2 className="mt-4 font-display text-xl font-semibold">Compléter mon profil</h2>
            <p className="mt-2 text-sm text-ink-500">Identité publique, pseudo, club, bio et disciplines.</p>
          </Link>
          <Link href="/mon-association" className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
            <Building2 className="h-6 w-6" />
            <h2 className="mt-4 font-display text-xl font-semibold">Mon association</h2>
            <p className="mt-2 text-sm text-ink-500">Déposer une demande ou administrer une association approuvée.</p>
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {profile?.username && <Link href={`/joueurs/${profile.username}`} className="rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-medium">Voir mon profil public</Link>}
          {identity.isAdmin && <Link href="/admin" className="rounded-xl bg-ink-950 px-5 py-3 text-sm font-medium text-white">Administration</Link>}
          <form action={signOut}>
            <button className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm text-ink-500 hover:bg-ink-100"><LogOut className="h-4 w-4" /> Déconnexion</button>
          </form>
        </div>
      </div>
    </section>
  );
}
