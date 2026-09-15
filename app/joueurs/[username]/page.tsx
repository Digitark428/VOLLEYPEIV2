import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MapPin, Medal, Trophy, Volleyball } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Participation = { joined_at: string; result_position: number | null; result_label: string | null; tournaments: { id: string; name: string; date: string; city: string } | { id: string; name: string; date: string; city: string }[] | null };

export default async function PublicPlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase.from('profiles').select('id, username, first_name, last_name, show_real_name, avatar_path, city, club_name, bio, experience_summary, years_practice, disciplines, achievements').ilike('username', username).maybeSingle();
  if (!profile) notFound();

  const [{ data }, { data: ageLabel }] = await Promise.all([
    supabase.from('tournament_participants').select('result_position, result_label, joined_at, tournaments(id, name, date, city)').eq('profile_id', profile.id).order('joined_at', { ascending: false }).limit(20),
    supabase.rpc('profile_age_label', { target_profile: profile.id }),
  ]);
  const participations = (data ?? []) as Participation[];
  const publicName = profile.show_real_name && (profile.first_name || profile.last_name) ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : `@${profile.username}`;

  return <section className="px-4 py-8 sm:py-14"><div className="mx-auto max-w-5xl">
    <div className="rounded-[2rem] border border-ink-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-card sm:p-10"><div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left"><ProfileAvatar username={profile.username} avatarPath={profile.avatar_path} size="xl" className="ring-4 ring-white shadow-lift" /><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">Profil joueur</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{publicName}</h1>{publicName !== `@${profile.username}` && <p className="mt-1 text-ink-400">@{profile.username}</p>}<div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-ink-500 sm:justify-start">{profile.club_name && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100"><Volleyball className="mr-1.5 inline h-4 w-4" />{profile.club_name}</span>}{profile.city && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100"><MapPin className="mr-1.5 inline h-4 w-4" />{profile.city}</span>}{ageLabel && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100">{String(ageLabel)}</span>}</div></div></div></div>
    <div className="mt-6 grid gap-4 md:grid-cols-2"><InfoCard title="Bio" icon={<Volleyball className="h-5 w-5" />} value={profile.bio} /><InfoCard title="Expérience" icon={<Trophy className="h-5 w-5" />} value={profile.experience_summary} footer={profile.years_practice ? `${profile.years_practice} année(s) de pratique` : undefined} /><InfoCard title="Palmarès" icon={<Medal className="h-5 w-5" />} value={profile.achievements} /><div className="rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-slate-50 p-6"><h2 className="font-display text-xl font-semibold">Disciplines</h2><div className="mt-4 flex flex-wrap gap-2">{profile.disciplines?.length ? profile.disciplines.map((item: string) => <span key={item} className="rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white">{item}</span>) : <span className="text-sm text-ink-400">Non renseignées</span>}</div></div></div>
    <section className="mt-6 rounded-3xl border border-ink-200 bg-white p-6 sm:p-8"><div className="flex items-center gap-2"><Volleyball className="h-5 w-5" /><h2 className="font-display text-2xl font-semibold">Tournois et résultats</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{participations.length ? participations.map((participation) => { const tournament = Array.isArray(participation.tournaments) ? participation.tournaments[0] : participation.tournaments; return <Link href={`/tournoi/${tournament?.id}`} key={`${tournament?.id}-${participation.joined_at}`} className="rounded-2xl bg-ink-50 p-4 transition hover:bg-ink-100"><p className="font-medium">{tournament?.name}</p><p className="mt-1 text-xs text-ink-500">{tournament?.date} · {tournament?.city}</p>{(participation.result_position || participation.result_label) && <p className="mt-2 text-sm font-semibold text-reunion-blue">{participation.result_label ?? `${participation.result_position}e place`}</p>}</Link>; }) : <p className="text-sm text-ink-500">Aucune participation enregistrée.</p>}</div></section>
  </div></section>;
}

function InfoCard({ title, icon, value, footer }: { title: string; icon: React.ReactNode; value?: string | null; footer?: string }) { return <div className="rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-blue-50/30 p-6"><div className="flex items-center gap-2">{icon}<h2 className="font-display text-xl font-semibold">{title}</h2></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink-600">{value || 'Non renseigné.'}</p>{footer && <p className="mt-3 text-xs font-semibold text-ink-400">{footer}</p>}</div>; }
