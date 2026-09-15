import Link from 'next/link';
import { Building2, Edit3, MapPin, Medal, ShieldCheck, Trophy, UserRound, Volleyball } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ProfileDashboard({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity(), searchParams]);
  const profile = identity.profile;
  const supabase = await createServerSupabaseClient();
  const [{ count: tournaments }, { count: posts }, { data: ageLabel }] = await Promise.all([
    supabase.from('tournament_participants').select('id', { count: 'exact', head: true }).eq('profile_id', identity.id),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', identity.id).eq('status', 'published').is('deleted_at', null),
    supabase.rpc('profile_age_label', { target_profile: identity.id }),
  ]);
  const realName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ');

  return <section className="px-4 py-8 sm:py-14"><div className="mx-auto max-w-5xl">
    <AuthNotice error={params.erreur} message={params.message} />
    <div className="overflow-hidden rounded-[2rem] border border-ink-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-card sm:p-10">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left"><ProfileAvatar username={profile?.username} avatarPath={profile?.avatar_path} size="xl" className="ring-4 ring-white shadow-lift" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">Mon profil personnel</p><h1 className="mt-2 truncate font-display text-4xl font-semibold sm:text-5xl">@{profile?.username ?? 'joueur'}</h1>{realName && <p className="mt-2 text-lg text-ink-600">{realName}</p>}<div className="mt-3 flex flex-wrap justify-center gap-2 text-sm text-ink-500 sm:justify-start">{profile?.club_name && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100"><Volleyball className="mr-1.5 inline h-4 w-4" />{profile.club_name}</span>}{profile?.city && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100"><MapPin className="mr-1.5 inline h-4 w-4" />{profile.city}</span>}{ageLabel && <span className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink-100">{String(ageLabel)}</span>}</div>{identity.isAdmin && <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white"><ShieldCheck className="h-4 w-4" /> Administrateur VolleyPéi</span>}</div><Link href="/profil/completer" className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white"><Edit3 className="h-4 w-4" /> Modifier</Link></div>
      <div className="mt-8 grid grid-cols-3 gap-2 border-t border-ink-200/60 pt-6 text-center"><div><strong className="block font-display text-2xl">{tournaments ?? 0}</strong><span className="text-xs text-ink-400">Tournois</span></div><div><strong className="block font-display text-2xl">{posts ?? 0}</strong><span className="text-xs text-ink-400">Publications</span></div><div><strong className="block font-display text-2xl">{profile?.years_practice ?? 0}</strong><span className="text-xs text-ink-400">Années de pratique</span></div></div>
    </div>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <ProfileCard icon={<UserRound className="h-5 w-5" />} title="Bio" value={profile?.bio} empty="Présente-toi à la communauté." />
      <ProfileCard icon={<Trophy className="h-5 w-5" />} title="Expérience" value={profile?.experience_summary} empty="Ajoute ton expérience sportive." />
      <ProfileCard icon={<Medal className="h-5 w-5" />} title="Palmarès" value={profile?.achievements} empty="Ajoute tes résultats et moments marquants." />
      <div className="rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-slate-50 p-6"><h2 className="font-display text-xl font-semibold">Disciplines</h2><div className="mt-4 flex flex-wrap gap-2">{profile?.disciplines?.length ? profile.disciplines.map((item: string) => <span key={item} className="rounded-full bg-ink-950 px-3 py-1.5 text-xs font-semibold text-white">{item === 'beach' ? 'Beach volley' : item === 'indoor' ? 'Volley indoor' : 'Green volley'}</span>) : <p className="text-sm text-ink-400">Aucune discipline renseignée.</p>}</div></div>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2"><Link href="/mon-association" className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"><Building2 className="h-6 w-6" /><h2 className="mt-4 font-display text-xl font-semibold">Mon association</h2><p className="mt-2 text-sm text-ink-500">Créer, rejoindre et gérer une association distincte de ton profil.</p></Link><Link href={`/joueurs/${profile?.username}`} className="rounded-2xl border border-ink-200 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"><UserRound className="h-6 w-6" /><h2 className="mt-4 font-display text-xl font-semibold">Voir mon profil public</h2><p className="mt-2 text-sm text-ink-500">Vérifie ce que les autres membres de VolleyPéi voient.</p></Link></div>
    {identity.isAdmin && <Link href="/admin" className="mt-5 inline-flex rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white">Ouvrir l’administration</Link>}
  </div></section>;
}

function ProfileCard({ icon, title, value, empty }: { icon: React.ReactNode; title: string; value?: string | null; empty: string }) {
  return <div className="rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-blue-50/40 p-6"><div className="flex items-center gap-2">{icon}<h2 className="font-display text-xl font-semibold">{title}</h2></div><p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-ink-600">{value || empty}</p></div>;
}
