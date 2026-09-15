import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, Newspaper, UsersRound } from 'lucide-react';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { protectedMediaUrl } from '@/lib/media';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Member = { role: string; profiles: { username: string; avatar_path: string | null } | { username: string; avatar_path: string | null }[] | null };

export default async function AssociationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: association } = await supabase.from('associations').select('id, name, description, address, city, email, phone, website, instagram_url, facebook_url, logo_path').eq('slug', slug).eq('status', 'approved').maybeSingle();
  if (!association) notFound();
  const [{ data: tournaments }, { data: members }, { data: posts }] = await Promise.all([
    supabase.from('tournaments').select('id, name, date, city, type').eq('association_id', association.id).in('status', ['published', 'archived']).is('deleted_at', null).order('date').limit(18),
    supabase.from('association_members').select('role, profiles(username, avatar_path)').eq('association_id', association.id).eq('status', 'active').in('role', ['owner', 'admin']).limit(12),
    supabase.from('posts').select('id, body, created_at').eq('association_id', association.id).eq('status', 'published').is('deleted_at', null).order('created_at', { ascending: false }).limit(6),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (tournaments ?? []).filter((tournament) => tournament.date >= today);
  const past = (tournaments ?? []).filter((tournament) => tournament.date < today).reverse();
  const logoUrl = protectedMediaUrl(association.logo_path);

  return <section className="px-4 py-8 sm:py-14"><div className="mx-auto max-w-5xl">
    <div className="rounded-[2rem] border border-ink-200 bg-gradient-to-br from-blue-50 via-white to-amber-50 p-6 shadow-card sm:p-10"><div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">{logoUrl ? <span className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] bg-white p-3 shadow-lift ring-1 ring-ink-200 sm:h-40 sm:w-40"><img src={logoUrl} alt={`Logo de ${association.name}`} className="h-full w-full object-contain" /></span> : <span className="flex h-32 w-32 shrink-0 items-center justify-center rounded-[2rem] bg-ink-950 text-4xl font-semibold text-white sm:h-40 sm:w-40">{association.name.slice(0, 2).toUpperCase()}</span>}<div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Association approuvée</p><h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">{association.name}</h1>{association.city && <p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-500"><MapPin className="h-4 w-4" />{association.city}</p>}{association.description && <p className="mt-5 max-w-2xl leading-7 text-ink-600">{association.description}</p>}<div className="mt-5 flex flex-wrap justify-center gap-2 text-xs sm:justify-start">{association.website && <a href={association.website} target="_blank" rel="noreferrer" className="rounded-full bg-white px-3 py-2 ring-1 ring-ink-200">Site web</a>}{association.email && <a href={`mailto:${association.email}`} className="rounded-full bg-white px-3 py-2 ring-1 ring-ink-200">Contacter</a>}</div></div></div></div>
    <TournamentSection title="Prochains tournois" tournaments={upcoming} empty="Aucun tournoi annoncé." />
    <TournamentSection title="Anciens tournois" tournaments={past} empty="Aucun tournoi passé." />
    <div className="mt-10 grid gap-6 lg:grid-cols-2"><section className="rounded-3xl border border-ink-200 bg-white p-6"><h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><Newspaper className="h-5 w-5" /> Publications</h2><div className="mt-4 space-y-3">{posts?.length ? posts.map((post) => <Link href={`/actualite#post-${post.id}`} key={post.id} className="block rounded-2xl bg-ink-50 p-4"><p className="line-clamp-3 text-sm leading-6 text-ink-600">{post.body}</p><time className="mt-2 block text-xs text-ink-400">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(post.created_at))}</time></Link>) : <p className="text-sm text-ink-400">Aucune publication.</p>}</div></section><section className="rounded-3xl border border-ink-200 bg-gradient-to-br from-white to-slate-50 p-6"><h2 className="flex items-center gap-2 font-display text-2xl font-semibold"><UsersRound className="h-5 w-5" /> Responsables</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{(members as unknown as Member[] | null)?.map((membership, index) => { const profile = Array.isArray(membership.profiles) ? membership.profiles[0] : membership.profiles; return profile ? <Link href={`/joueurs/${profile.username}`} key={`${profile.username}-${index}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink-100"><ProfileAvatar username={profile.username} avatarPath={profile.avatar_path} /><span><span className="block text-sm font-semibold">@{profile.username}</span><span className="text-xs text-ink-400">{membership.role === 'owner' ? 'Propriétaire' : 'Administrateur'}</span></span></Link> : null; })}</div></section></div>
  </div></section>;
}

function TournamentSection({ title, tournaments, empty }: { title: string; tournaments: { id: string; name: string; date: string; city: string; type: string }[]; empty: string }) { return <section className="mt-10"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /><h2 className="font-display text-2xl font-semibold">{title}</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tournaments.length ? tournaments.map((tournament) => <Link key={tournament.id} href={`/tournoi/${tournament.id}`} className="rounded-2xl border border-ink-200 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"><p className="font-semibold">{tournament.name}</p><p className="mt-2 text-xs text-ink-500">{new Intl.DateTimeFormat('fr-FR').format(new Date(tournament.date))} · {tournament.city}</p><p className="mt-3 text-xs font-medium text-reunion-blue">{tournament.type}</p></Link>) : <p className="text-sm text-ink-500">{empty}</p>}</div></section>; }
