import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type VisitDay = { visit_date: string; unique_visits: number; page_views: number };
export default async function AdminStatisticsPage() {
  await requireAdmin(); const supabase = await createServerSupabaseClient();
  const [{ data }, { data: totals }] = await Promise.all([supabase.rpc('admin_visit_history', { requested_days: 30 }), supabase.rpc('get_public_stats')]);
  const days = (data ?? []) as VisitDay[]; const stats = Array.isArray(totals) ? totals[0] : totals; const max = Math.max(1, ...days.map((day) => day.unique_visits));
  const last = (offset: number) => days.slice(-offset).reduce((sum, day) => sum + day.unique_visits, 0);
  const cards = [['Aujourd’hui', stats?.visits_today ?? 0], ['7 derniers jours', last(7)], ['30 derniers jours', last(30)], ['Mois en cours', stats?.visits_month ?? 0]];
  return <section className="px-4 py-10"><div className="mx-auto max-w-7xl"><AdminPageHeader eyebrow="Administration" title="Statistiques" description="Visiteurs uniques approximatifs et pages vues, calculés dans le fuseau de La Réunion sans donnée personnelle invasive." /><div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">{cards.map(([label, count]) => <div key={label} className="rounded-2xl border border-ink-200 bg-white p-5"><p className="font-display text-3xl font-semibold">{count}</p><p className="mt-1 text-xs text-ink-500">{label}</p></div>)}</div><div className="mt-7 rounded-3xl border border-ink-200 bg-white p-6"><h2 className="font-display text-xl font-semibold">Fréquentation sur 30 jours</h2><div className="mt-6 flex h-56 items-end gap-1 overflow-hidden" aria-label="Graphique des visites">{days.map((day) => <div key={day.visit_date} className="group relative flex min-w-0 flex-1 flex-col justify-end"><div className="w-full rounded-t bg-reunion-blue/80 transition hover:bg-reunion-blue" style={{ height: `${Math.max(3, day.unique_visits / max * 100)}%` }} title={`${day.visit_date} : ${day.unique_visits} visiteurs, ${day.page_views} pages`} /></div>)}</div><div className="mt-3 flex justify-between text-[10px] text-ink-400"><span>{days[0]?.visit_date ?? 'Aucune donnée'}</span><span>{days.at(-1)?.visit_date ?? ''}</span></div></div></div></section>;
}
