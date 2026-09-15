import Link from 'next/link';
import { Send, Sparkles } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import FeedStream from '@/components/feed/FeedStream';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { requireIdentity } from '@/lib/auth';
import { FEED_PAGE_SIZE, FEED_SELECT, one, type FeedPost, type MiniAssociation } from '@/lib/feed';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createPost } from './actions';

export default async function NewsFeedPage({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const [postsResult, tournamentsResult, membershipsResult] = await Promise.all([
    supabase.from('posts').select(FEED_SELECT).eq('status', 'published').is('deleted_at', null).order('created_at', { ascending: false }).order('created_at', { referencedTable: 'post_comments', ascending: true }).range(0, FEED_PAGE_SIZE - 1),
    supabase.from('tournaments').select('id, name, date').eq('status', 'published').is('deleted_at', null).order('date', { ascending: false }).limit(60),
    supabase.from('association_members').select('association:associations(id, name, slug)').eq('user_id', identity.id).eq('status', 'active'),
  ]);
  const posts = (postsResult.data ?? []) as unknown as FeedPost[];
  const associations = (membershipsResult.data ?? []).map((membership) => one(membership.association as MiniAssociation | MiniAssociation[] | null)).filter((association): association is MiniAssociation => Boolean(association));

  return <section className="px-4 py-8 sm:py-12"><div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
    <div className="min-w-0">
      <AuthNotice error={params.erreur ?? postsResult.error?.message} message={params.message} />
      <div className="mb-7"><p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue"><Sparkles className="h-4 w-4" /> La communauté volley 974</p><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Feed d’actualité</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">Les publications les plus récentes, les résultats, les entraînements et les souvenirs des terrains réunionnais.</p></div>

      <form action={createPost} className="mb-6 rounded-3xl border border-ink-200 bg-white p-5 shadow-soft sm:p-6">
        <div className="flex gap-3"><ProfileAvatar username={identity.profile?.username} avatarPath={identity.profile?.avatar_path} /><div className="min-w-0 flex-1">
          <label htmlFor="post-body" className="sr-only">Ta publication</label><textarea id="post-body" name="body" required maxLength={5000} rows={4} placeholder="Quoi de neuf dans le volley péi ?" className="w-full resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-base outline-none transition focus:border-ink-400 focus:bg-white" />
          <div className="mt-3"><OptimizedMediaPicker usage="post" maxFiles={4} /></div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-ink-500">Lier à un tournoi<select name="tournament_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">Aucun tournoi</option>{tournamentsResult.data?.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name} · {new Intl.DateTimeFormat('fr-FR').format(new Date(tournament.date))}</option>)}</select></label>{associations.length > 0 && <label className="text-xs font-medium text-ink-500">Publier en tant que<select name="association_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">@{identity.profile?.username}</option>{associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}</select></label>}</div>
          <div className="mt-4 flex justify-end"><button className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white"><Send className="h-4 w-4" /> Publier</button></div>
        </div></div>
      </form>

      <FeedStream initialPosts={posts} identityId={identity.id} initialHasMore={posts.length === FEED_PAGE_SIZE} />
    </div>
    <aside className="hidden lg:block"><div className="sticky top-24 rounded-3xl bg-gradient-to-br from-ink-950 via-slate-900 to-reunion-blue p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Esprit VolleyPéi</p><h2 className="mt-3 font-display text-2xl font-semibold">Le volley réunionnais, toute l’année.</h2><p className="mt-3 text-sm leading-6 text-white/60">Avant, pendant et après les tournois : partage la vie des terrains et construis leur mémoire.</p><Link href="/" className="mt-5 inline-flex text-sm font-semibold text-white">Voir le calendrier →</Link></div></aside>
  </div></section>;
}
