'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Heart, MessageCircle, Send, Trash2 } from 'lucide-react';
import { addPostComment, deletePost, togglePostLike } from '@/app/actualite/actions';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { displayName, one, type FeedPost } from '@/lib/feed';
import { protectedMediaUrl } from '@/lib/media';
import PhotoLightbox, { type LightboxImage } from './PhotoLightbox';

function relativeDate(input: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Indian/Reunion' }).format(new Date(input));
}

export default function FeedPostCard({ post, identityId }: { post: FeedPost; identityId: string }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const author = one(post.author);
  const tournament = one(post.tournament);
  const association = one(post.association);
  const liked = post.likes.some((like) => like.profile_id === identityId);
  const images = [...post.media_items]
    .sort((a, b) => a.display_order - b.display_order)
    .map((item) => one(item.media))
    .filter((media): media is NonNullable<typeof media> => Boolean(media))
    .map((media) => ({ src: protectedMediaUrl(media.storage_path) ?? '', alt: media.alt_text ?? 'Photo partagée sur VolleyPéi' }))
    .filter((media) => Boolean(media.src)) as LightboxImage[];

  return <article id={`post-${post.id}`} className="scroll-mt-24 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-soft">
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3"><ProfileAvatar username={association?.name ?? author?.username} avatarPath={association?.logo_path ?? author?.avatar_path} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{association?.name ?? displayName(author)}</p><time className="text-xs text-ink-400" dateTime={post.created_at}>{relativeDate(post.created_at)}</time></div></div>
        {identityId === post.author_id && <form action={deletePost}><input type="hidden" name="post_id" value={post.id} /><button aria-label="Supprimer la publication" className="rounded-full p-2 text-ink-300 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></form>}
      </div>
      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-ink-700">{post.body}</p>
      {images.length > 0 && <div className={`mt-4 grid gap-1.5 overflow-hidden rounded-2xl ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{images.map((image, index) => <button type="button" key={image.src} onClick={() => setLightboxIndex(index)} className="relative aspect-square overflow-hidden bg-ink-100 text-left"><img src={image.src} alt={image.alt} className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]" /></button>)}</div>}
      {tournament && <Link href={`/tournoi/${tournament.id}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-reunion-blue/15 bg-reunion-blue/[0.04] p-4 text-sm transition hover:bg-reunion-blue/[0.08]"><CalendarDays className="h-5 w-5 text-reunion-blue" /><span><span className="block font-semibold text-ink-900">{tournament.name}</span><span className="text-xs text-ink-500">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(tournament.date))}</span></span></Link>}
      <div className="mt-5 flex items-center gap-5 border-t border-ink-100 pt-4">
        <form action={togglePostLike}><input type="hidden" name="post_id" value={post.id} /><button className={`inline-flex items-center gap-2 text-sm font-medium ${liked ? 'text-red-600' : 'text-ink-500 hover:text-ink-900'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {post.likes.length || 'J’aime'}</button></form>
        <span className="inline-flex items-center gap-2 text-sm text-ink-500"><MessageCircle className="h-4 w-4" /> {post.comments.length || 'Commenter'}</span>
      </div>
    </div>
    <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:px-6">
      {post.comments.length > 0 && <div className="mb-4 space-y-3">{post.comments.map((comment) => { const commentAuthor = one(comment.author); return <div key={comment.id} className="flex gap-2.5"><ProfileAvatar username={commentAuthor?.username} avatarPath={commentAuthor?.avatar_path} size="sm" /><div className="rounded-2xl bg-white px-3.5 py-2 ring-1 ring-ink-100"><p className="text-xs font-semibold">{displayName(commentAuthor)}</p><p className="mt-0.5 text-sm leading-5 text-ink-600">{comment.body}</p></div></div>; })}</div>}
      <form action={addPostComment} className="flex gap-2"><input type="hidden" name="post_id" value={post.id} /><label className="sr-only" htmlFor={`comment-${post.id}`}>Ajouter un commentaire</label><input id={`comment-${post.id}`} name="body" required maxLength={2000} placeholder="Écrire un commentaire…" className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-base sm:text-sm" /><button aria-label="Envoyer le commentaire" className="rounded-xl bg-ink-950 p-3 text-white"><Send className="h-4 w-4" /></button></form>
    </div>
    {lightboxIndex !== null && <PhotoLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />}
  </article>;
}
