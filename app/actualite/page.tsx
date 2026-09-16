import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import FeedStream from '@/components/feed/FeedStream';
import FeedComposer from '@/components/feed/FeedComposer';
import { requireIdentity } from '@/lib/auth';
import { FEED_PAGE_SIZE, FEED_SELECT, one, type FeedPost, type MiniAssociation } from '@/lib/feed';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

      <FeedComposer username={identity.profile?.username ?? 'joueur'} avatarPath={identity.profile?.avatar_path ?? null} tournaments={tournamentsResult.data ?? []} associations={associations} />

      <FeedStream initialPosts={posts} identityId={identity.id} initialHasMore={posts.length === FEED_PAGE_SIZE} />
    </div>
    <aside className="hidden lg:block"><div className="sticky top-24 rounded-3xl bg-gradient-to-br from-ink-950 via-slate-900 to-reunion-blue p-6 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Esprit VolleyPéi</p><h2 className="mt-3 font-display text-2xl font-semibold">Le volley réunionnais, toute l’année.</h2><p className="mt-3 text-sm leading-6 text-white/60">Avant, pendant et après les tournois : partage la vie des terrains et construis leur mémoire.</p><Link href="/" className="mt-5 inline-flex text-sm font-semibold text-white">Voir le calendrier →</Link></div></aside>
  </div></section>;
}
