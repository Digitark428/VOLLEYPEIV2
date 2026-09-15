'use client';

import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { FeedPost } from '@/lib/feed';
import FeedPostCard from './FeedPostCard';

export default function FeedStream({ initialPosts, identityId, initialHasMore }: { initialPosts: FeedPost[]; identityId: string; initialHasMore: boolean }) {
  const [posts, setPosts] = useState(initialPosts);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    const nextPage = page + 1;
    try {
      const response = await fetch(`/api/feed?page=${nextPage}`);
      const payload = await response.json() as { posts?: FeedPost[]; hasMore?: boolean; error?: string };
      if (!response.ok || !payload.posts) throw new Error(payload.error ?? 'Impossible de charger les publications.');
      setPosts((current) => [...current, ...payload.posts!]);
      setPage(nextPage);
      setHasMore(Boolean(payload.hasMore));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Impossible de charger les publications.');
    } finally {
      setLoading(false);
    }
  }

  return <>
    <div className="space-y-5">{posts.length === 0 ? <div className="rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center"><p className="font-display text-xl font-semibold">Le terrain est prêt.</p><p className="mt-2 text-sm text-ink-500">Sois la première personne à partager une actualité.</p></div> : posts.map((post) => <FeedPostCard key={post.id} post={post} identityId={identityId} />)}</div>
    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-center text-sm text-red-700">{error}</p>}
    {hasMore && <div className="mt-7 text-center"><button onClick={loadMore} disabled={loading} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-3 text-sm font-semibold shadow-soft disabled:opacity-60">{loading ? <><LoaderCircle className="h-4 w-4 animate-spin" /> Chargement…</> : 'Afficher plus'}</button></div>}
  </>;
}
