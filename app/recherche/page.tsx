import Link from 'next/link';
import { Building2, CalendarDays, Search, UserRound } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireIdentity();
  const params = await searchParams;
  const query = (params.q ?? '').trim().replace(/[%_,().]/g, ' ').replace(/\s+/g, ' ').slice(0, 80);
  const supabase = await createServerSupabaseClient();
  const pattern = `%${query}%`;
  const [profiles, associations, tournaments] = query.length >= 2 ? await Promise.all([
    supabase.from('profiles').select('id, username, first_name, last_name, show_real_name, avatar_path, city, club_name').eq('status', 'active').is('deleted_at', null).or(`username.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern},club_name.ilike.${pattern}`).limit(12),
    supabase.from('associations').select('id, slug, name, city, logo_path').eq('status', 'approved').is('deleted_at', null).or(`name.ilike.${pattern},city.ilike.${pattern}`).limit(12),
    supabase.from('tournaments').select('id, name, city, date, type').in('status', ['published', 'archived']).is('deleted_at', null).or(`name.ilike.${pattern},city.ilike.${pattern},organizer.ilike.${pattern}`).order('date', { ascending: false }).limit(12),
  ]) : [{ data: [] }, { data: [] }, { data: [] }];

  return <section className="px-4 py-8 sm:py-12"><div className="mx-auto max-w-4xl">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">Toute la communauté</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-5xl">Recherche</h1>
    <form className="relative mt-6"><Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400" /><input name="q" defaultValue={query} type="search" minLength={2} autoFocus placeholder="Pseudo, joueur, club, association, tournoi…" className="w-full rounded-2xl border border-ink-200 bg-white py-4 pl-12 pr-28 text-base shadow-soft outline-none focus:border-ink-500" /><button className="absolute right-2 top-2 rounded-xl bg-ink-950 px-4 py-2 text-sm font-semibold text-white">Chercher</button></form>
    {query.length < 2 ? <p className="mt-8 text-center text-sm text-ink-400">Saisis au moins 2 caractères.</p> : <div className="mt-8 space-y-8">
      <section><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><UserRound className="h-5 w-5" /> Joueurs et membres <span className="text-sm text-ink-400">({profiles.data?.length ?? 0})</span></h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{profiles.data?.map((profile) => <Link key={profile.id} href={`/joueurs/${profile.username}`} className="flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-card"><ProfileAvatar username={profile.username} avatarPath={profile.avatar_path} /><span><span className="block font-semibold">@{profile.username}</span>{profile.show_real_name && <span className="block text-sm text-ink-500">{[profile.first_name, profile.last_name].filter(Boolean).join(' ')}</span>}<span className="block text-xs text-ink-400">{[profile.club_name, profile.city].filter(Boolean).join(' · ')}</span></span></Link>)}</div></section>
      <section><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><Building2 className="h-5 w-5" /> Associations <span className="text-sm text-ink-400">({associations.data?.length ?? 0})</span></h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{associations.data?.map((association) => <Link key={association.id} href={`/associations/${association.slug}`} className="rounded-2xl border border-ink-200 bg-white p-4 transition hover:shadow-card"><span className="font-semibold">{association.name}</span><span className="mt-1 block text-sm text-ink-400">{association.city || 'La Réunion'}</span></Link>)}</div></section>
      <section><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><CalendarDays className="h-5 w-5" /> Tournois <span className="text-sm text-ink-400">({tournaments.data?.length ?? 0})</span></h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{tournaments.data?.map((tournament) => <Link key={tournament.id} href={`/tournoi/${tournament.id}`} className="rounded-2xl border border-ink-200 bg-white p-4 transition hover:shadow-card"><span className="font-semibold">{tournament.name}</span><span className="mt-1 block text-sm text-ink-400">{tournament.city} · {new Intl.DateTimeFormat('fr-FR').format(new Date(tournament.date))}</span></Link>)}</div></section>
    </div>}
  </div></section>;
}
