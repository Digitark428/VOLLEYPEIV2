import Link from 'next/link';
import FeedPostCard from '@/components/feed/FeedPostCard';
import { requireIdentity } from '@/lib/auth';
import { FEED_SELECT, type FeedPost } from '@/lib/feed';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const [{ tag: rawTag }, identity] = await Promise.all([params, requireIdentity()]);
  const tag = decodeURIComponent(rawTag).toLowerCase();
  const supabase = await createServerSupabaseClient();
  const { data: links } = /^[a-z0-9_]{2,50}$/.test(tag) ? await supabase.from('post_hashtags').select('post_id').eq('tag', tag).order('created_at', { ascending: false }).limit(60) : { data: [] };
  const ids = (links ?? []).map((link) => link.post_id);
  const { data } = ids.length ? await supabase.from('posts').select(FEED_SELECT).in('id', ids).eq('status', 'published').is('deleted_at', null).order('created_at', { ascending: false }) : { data: [] };
  const posts = (data ?? []) as unknown as FeedPost[];
  return <section className="px-4 py-8 sm:py-12"><div className="mx-auto max-w-3xl"><Link href="/actualite" className="text-sm font-medium text-ink-500">← Feed d’actualité</Link><p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">Hashtag</p><h1 className="mt-2 font-display text-4xl font-semibold">#{tag}</h1><p className="mt-2 text-sm text-ink-500">{posts.length} publication{posts.length > 1 ? 's' : ''}</p><div className="mt-7 space-y-5">{posts.map((post) => <FeedPostCard key={post.id} post={post} identityId={identity.id} />)}{posts.length === 0 && <div className="rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center text-sm text-ink-500">Aucune publication pour ce hashtag.</div>}</div></div></section>;
}
