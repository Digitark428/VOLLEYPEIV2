import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Clock, Eye, Heart, Mail, MapPin, MessageCircle, Phone, UserRoundCheck, Users } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import RegistrationForm from '@/components/tournament/RegistrationForm';
import ShareTournamentButton from '@/components/tournament/ShareTournamentButton';
import TournamentViewTracker from '@/components/tournament/TournamentViewTracker';
import TypeBadge from '@/components/ui/TypeBadge';
import { getCurrentIdentity } from '@/lib/auth';
import type { TournamentType } from '@/lib/supabase';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { formatDate, formatTime } from '@/lib/utils';
import { addTournamentComment, deleteTournamentComment, submitTournamentRegistration, toggleParticipation, toggleTournamentLike } from './actions';

type Profile = { id: string; username: string | null; first_name: string | null; last_name: string | null; show_real_name: boolean };
type Comment = { id: string; author_id: string; body: string; created_at: string; author: Profile | Profile[] | null };
type TournamentDetails = {
  id: string; name: string; date: string; time: string; city: string; type: TournamentType; location: string; address: string | null;
  players_count: number; description: string; poster_url: string; phone: string | null; email: string | null; format: string | null;
  additional_info: string | null; registration_enabled: boolean; registration_deadline: string | null; max_teams: number | null;
  views_count: number; status: string; association: { name: string; slug: string } | { name: string; slug: string }[] | null;
  participants: { profile_id: string; profile: Profile | Profile[] | null }[]; likes: { profile_id: string }[]; comments: Comment[];
};

function one<T>(entry: T | T[] | null) { return Array.isArray(entry) ? entry[0] ?? null : entry; }
function displayName(profile: Profile | null) {
  if (!profile) return 'Membre VolleyPéi';
  if (profile.show_real_name && (profile.first_name || profile.last_name)) return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  return `@${profile.username ?? 'joueur'}`;
}

export default async function TournamentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [{ id }, notices, identity] = await Promise.all([params, searchParams, getCurrentIdentity()]);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('tournaments').select(`
    id, name, date, time, city, type, location, address, players_count, description, poster_url, phone, email,
    format, additional_info, registration_enabled, registration_deadline, max_teams, views_count, status,
    association:associations(name, slug),
    participants:tournament_participants(profile_id, profile:profiles(id, username, first_name, last_name, show_real_name)),
    likes:tournament_likes(profile_id),
    comments:tournament_comments(id, author_id, body, created_at, author:profiles!tournament_comments_author_id_fkey(id, username, first_name, last_name, show_real_name))
  `).eq('id', id).is('deleted_at', null).order('created_at', { referencedTable: 'tournament_comments', ascending: true }).maybeSingle();
  if (error || !data) notFound();
  const tournament = data as unknown as TournamentDetails;
  const association = one(tournament.association);
  const participates = Boolean(identity && tournament.participants.some((item) => item.profile_id === identity.id));
  const liked = Boolean(identity && tournament.likes.some((item) => item.profile_id === identity.id));
  const registrationOpen = tournament.registration_enabled && (!tournament.registration_deadline || new Date(tournament.registration_deadline) >= new Date());
  const info = [
    [Calendar, 'Date', formatDate(tournament.date)], [Clock, 'Heure', formatTime(tournament.time)],
    [MapPin, 'Commune', tournament.city], [Users, 'Format', tournament.format ?? `${tournament.players_count} équipes`],
  ] as const;

  return <main className="px-4 py-7 sm:py-12">
    <TournamentViewTracker tournamentId={tournament.id} />
    <div className="mx-auto max-w-6xl">
      <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900"><ArrowLeft className="h-4 w-4" /> Retour au calendrier</Link>
      <AuthNotice error={notices.erreur} message={notices.message} />
      <div className="grid gap-7 lg:grid-cols-[390px_minmax(0,1fr)] lg:gap-11">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-ink-100 shadow-lift"><Image src={tournament.poster_url} alt={`Affiche de ${tournament.name}`} fill sizes="(max-width: 1024px) 100vw, 390px" className="object-cover" priority /></div>
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-500"><span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" /> {tournament.views_count} vue{tournament.views_count > 1 ? 's' : ''}</span><ShareTournamentButton name={tournament.name} /></div>
        </div>

        <div className="min-w-0 space-y-6">
          <section><div className="flex flex-wrap items-center gap-2"><TypeBadge type={tournament.type} />{new Date(tournament.date) < new Date(new Date().toDateString()) && <span className="rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-500">Archive</span>}</div><h1 className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{tournament.name}</h1><p className="mt-3 text-[15px] leading-6 text-ink-500">{tournament.location}{tournament.address ? ` · ${tournament.address}` : ''}</p>{association && <Link href={`/associations/${association.slug}`} className="mt-3 inline-flex text-sm font-semibold text-reunion-blue">Organisé par {association.name} →</Link>}</section>
          <div className="grid grid-cols-2 gap-3">{info.map(([Icon, label, shownValue]) => <div key={label} className="rounded-2xl border border-ink-200 bg-white p-4 shadow-soft"><span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink-400"><Icon className="h-3.5 w-3.5" />{label}</span><p className="mt-2 text-sm font-semibold">{shownValue}</p></div>)}</div>
          <div className="flex flex-wrap gap-2">
            <form action={toggleParticipation}><input type="hidden" name="tournament_id" value={tournament.id} /><button className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold ${participates ? 'bg-emerald-600 text-white' : 'bg-ink-950 text-white'}`}><UserRoundCheck className="h-4 w-4" />Je participe · {tournament.participants.length}</button></form>
            <form action={toggleTournamentLike}><input type="hidden" name="tournament_id" value={tournament.id} /><button className={`inline-flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${liked ? 'border-red-200 bg-red-50 text-red-600' : 'border-ink-200 bg-white text-ink-600'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {tournament.likes.length || 'J’aime'}</button></form>
          </div>
          <section className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft"><h2 className="font-display text-xl font-semibold">À propos du tournoi</h2><p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-ink-600">{tournament.description}</p>{tournament.additional_info && <p className="mt-4 border-t border-ink-100 pt-4 text-sm leading-6 text-ink-500">{tournament.additional_info}</p>}</section>
          {(tournament.phone || tournament.email) && <section className="rounded-3xl border border-ink-200 bg-white p-6 shadow-soft"><h2 className="font-display text-xl font-semibold">Contact</h2><div className="mt-4 flex flex-wrap gap-3">{tournament.phone && <a href={`tel:${tournament.phone}`} className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-4 py-3 text-sm"><Phone className="h-4 w-4" />{tournament.phone}</a>}{tournament.email && <a href={`mailto:${tournament.email}`} className="inline-flex items-center gap-2 rounded-xl bg-ink-100 px-4 py-3 text-sm"><Mail className="h-4 w-4" />{tournament.email}</a>}</div></section>}
          {registrationOpen && (identity ? <RegistrationForm tournamentId={tournament.id} action={submitTournamentRegistration} defaultEmail={identity.email ?? ''} defaultFirstName={identity.profile?.first_name ?? ''} defaultLastName={identity.profile?.last_name ?? ''} /> : <section className="rounded-3xl border border-reunion-blue/20 bg-reunion-blue/[0.04] p-6"><h2 className="font-display text-xl font-semibold">Inscriptions ouvertes</h2><p className="mt-2 text-sm text-ink-500">Crée ou connecte ton compte VolleyPéi pour inscrire ton équipe.</p><Link href={`/connexion?retour=/tournoi/${tournament.id}`} className="mt-4 inline-flex rounded-xl bg-reunion-blue px-5 py-3 text-sm font-semibold text-white">Se connecter pour s’inscrire</Link></section>)}
          <section className="rounded-3xl border border-ink-200 bg-white p-5 shadow-soft sm:p-7"><div className="flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-xl font-semibold"><MessageCircle className="h-5 w-5" /> Commentaires</h2><span className="text-xs text-ink-400">{tournament.comments.length}</span></div><div className="mt-5 space-y-4">{tournament.comments.map((comment) => <article key={comment.id} className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-xs font-semibold">{displayName(one(comment.author)).replace('@', '').slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1 rounded-2xl bg-ink-50 px-4 py-3"><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold">{displayName(one(comment.author))}</p>{identity?.id === comment.author_id && <form action={deleteTournamentComment}><input type="hidden" name="tournament_id" value={tournament.id} /><input type="hidden" name="comment_id" value={comment.id} /><button className="text-[11px] text-ink-400 hover:text-red-600">Supprimer</button></form>}</div><p className="mt-1 text-sm leading-6 text-ink-600">{comment.body}</p></div></article>)}</div>{identity ? <form action={addTournamentComment} className="mt-5 flex gap-2 border-t border-ink-100 pt-5"><input type="hidden" name="tournament_id" value={tournament.id} /><label className="sr-only" htmlFor="tournament-comment">Ton commentaire</label><input id="tournament-comment" name="body" required maxLength={2000} placeholder="Ajouter un commentaire…" className="min-w-0 flex-1 rounded-xl border border-ink-200 px-4 py-3 text-sm" /><button className="rounded-xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white">Envoyer</button></form> : <Link href={`/connexion?retour=/tournoi/${tournament.id}`} className="mt-5 inline-flex text-sm font-semibold text-reunion-blue">Connecte-toi pour commenter →</Link>}</section>
        </div>
      </div>
    </div>
  </main>;
}
