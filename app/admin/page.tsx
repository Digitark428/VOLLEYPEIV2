import Link from 'next/link';
import { Building2, CalendarDays, FileText, ShieldCheck, UsersRound, UserRoundCheck, Eye, ClipboardList } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import AdminNav from '@/components/admin/AdminNav';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { reviewAssociation } from './actions';

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [admin, params] = await Promise.all([requireAdmin(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const [profiles, players, associations, tournaments, upcoming, past, posts, registrations, pending, stats] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('status', 'deleted'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('account_type', 'player').eq('status', 'active'),
    supabase.from('associations').select('id', { count: 'exact', head: true }).neq('status', 'suspended'),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }).gte('date', today).eq('status', 'published').is('deleted_at', null),
    supabase.from('tournaments').select('id', { count: 'exact', head: true }).lt('date', today).is('deleted_at', null),
    supabase.from('posts').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase.from('tournament_registrations').select('id', { count: 'exact', head: true }),
    supabase.from('associations').select('id, name, city, email, phone, registration_number, created_at, review_note').eq('status', 'pending').order('created_at'),
    supabase.rpc('get_public_stats'),
  ]);
  const publicStats = Array.isArray(stats.data) ? stats.data[0] : null;
  const cards = [
    ['Utilisateurs', profiles.count ?? 0, UsersRound],
    ['Comptes joueur', players.count ?? 0, UserRoundCheck],
    ['Associations', associations.count ?? 0, Building2],
    ['Tournois total', tournaments.count ?? 0, CalendarDays],
    ['À venir', upcoming.count ?? 0, CalendarDays],
    ['Passés', past.count ?? 0, CalendarDays],
    ['Publications', posts.count ?? 0, FileText],
    ['Inscriptions', registrations.count ?? 0, ClipboardList],
    ['Visites aujourd’hui', publicStats?.visits_today ?? 0, Eye],
    ['Visites ce mois', publicStats?.visits_month ?? 0, Eye],
  ] as const;

  return (
    <section className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <AuthNotice error={params.erreur} message={params.message} />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue"><ShieldCheck className="h-4 w-4" /> Admin VolleyPéi</p><h1 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Tableau de bord</h1><p className="mt-2 text-sm text-ink-500">Connecté avec {admin.email}</p></div>
          <Link href="/" className="rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-medium">Voir l’espace membre</Link>
        </div>
        <AdminNav />

        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map(([label, count, Icon]) => <div key={label} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft"><Icon className="h-5 w-5 text-ink-400" /><p className="mt-5 font-display text-3xl font-semibold">{count}</p><p className="mt-1 text-xs text-ink-500">{label}</p></div>)}
        </div>

        <section className="mt-10">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-400">Validation</p><h2 className="mt-2 font-display text-2xl font-semibold">Associations en attente</h2></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900">{pending.data?.length ?? 0}</span></div>
          <div className="mt-5 grid gap-4">
            {pending.data?.length ? pending.data.map((association) => (
              <form action={reviewAssociation} key={association.id} className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft">
                <input type="hidden" name="association_id" value={association.id} />
                <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
                  <div><h3 className="font-display text-xl font-semibold">{association.name}</h3><p className="mt-2 text-sm text-ink-500">{association.city ?? 'Commune non renseignée'} · {association.email}</p><p className="mt-1 text-xs text-ink-400">Identifiant : {association.registration_number ?? 'non renseigné'}</p></div>
                  <label className="text-sm font-medium">Note de validation<input name="review_note" defaultValue={association.review_note ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
                  <div className="flex gap-2"><button name="decision" value="rejected" className="rounded-xl border border-ink-200 px-4 py-3 text-sm font-medium">À corriger</button><button name="decision" value="approved" className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white">Approuver</button></div>
                </div>
              </form>
            )) : <div className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-center text-sm text-ink-500">Aucune demande en attente.</div>}
          </div>
        </section>
      </div>
    </section>
  );
}
