import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, ClipboardList, Eye, Plus, UsersRound } from 'lucide-react';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { protectedMediaUrl } from '@/lib/media';

type ManagedTournament = { id: string; name: string; date: string; city: string; poster_url: string; status: string; views_count: number; registration_enabled: boolean; association: { name: string } | { name: string }[] | null; registrations: { count: number }[] };
function associationName(value: ManagedTournament['association']) { const item = Array.isArray(value) ? value[0] : value; return item?.name ?? 'Association'; }

export default async function ManagedTournamentsPage() {
  const identity = await requireIdentity('/connexion?retour=/mes-tournois');
  const supabase = await createServerSupabaseClient();
  const { data: memberships } = await supabase.from('association_members').select('association_id').eq('user_id', identity.id).eq('status', 'active').in('role', ['owner', 'admin']);
  const associationIds = memberships?.map((item) => item.association_id) ?? [];
  const { data } = associationIds.length ? await supabase.from('tournaments').select('id, name, date, city, poster_url, status, views_count, registration_enabled, association:associations(name), registrations:tournament_registrations(count)').in('association_id', associationIds).is('deleted_at', null).order('date', { ascending: false }) : { data: [] };
  const tournaments = (data ?? []) as unknown as ManagedTournament[];

  return <section className="px-4 py-10 sm:py-14"><div className="mx-auto max-w-6xl"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">Espace association</p><h1 className="mt-3 font-display text-3xl font-semibold sm:text-5xl">Mes tournois</h1><p className="mt-2 text-sm text-ink-500">Gère les événements et les inscriptions de tes associations.</p></div><Link href="/mes-tournois/nouveau" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white"><Plus className="h-4 w-4" /> Créer un tournoi</Link></div>
    <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{tournaments.length ? tournaments.map((tournament) => <article key={tournament.id} className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-soft"><div className="relative aspect-[16/10] bg-ink-100"><Image src={protectedMediaUrl(tournament.poster_url) ?? ''} alt="" fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover" unoptimized /></div><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{associationName(tournament.association)}</p><h2 className="mt-2 font-display text-xl font-semibold">{tournament.name}</h2><p className="mt-2 text-sm text-ink-500">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(tournament.date))} · {tournament.city}</p><div className="mt-4 flex gap-4 text-xs text-ink-400"><span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{tournament.views_count}</span><span className="inline-flex items-center gap-1"><UsersRound className="h-3.5 w-3.5" />{tournament.registrations?.[0]?.count ?? 0} équipes</span></div><div className="mt-5 flex gap-2"><Link href={`/tournoi/${tournament.id}`} className="flex-1 rounded-xl border border-ink-200 px-3 py-2.5 text-center text-sm font-medium">Voir</Link>{tournament.registration_enabled && <Link href={`/mes-tournois/${tournament.id}/inscriptions`} className="inline-flex items-center gap-1.5 rounded-xl bg-reunion-blue px-3 py-2.5 text-sm font-medium text-white"><ClipboardList className="h-4 w-4" /> Inscriptions</Link>}</div></div></article>) : <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center"><CalendarDays className="mx-auto h-9 w-9 text-ink-300" /><h2 className="mt-4 font-display text-xl font-semibold">Aucun tournoi géré</h2><p className="mt-2 text-sm text-ink-500">Crée le premier tournoi après validation de ton association.</p></div>}</div>
  </div></section>;
}
