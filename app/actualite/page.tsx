import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Heart, MessageCircle, Send, Sparkles, Trash2 } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import { getCurrentIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { addPostComment, createPost, deletePost, togglePostLike } from './actions';

const PAGE_SIZE = 12;

type MiniProfile = { id: string; username: string | null; first_name: string | null; last_name: string | null; show_real_name: boolean };
type MiniTournament = { id: string; name: string; date: string };
type MiniAssociation = { id: string; name: string; slug: string };
type FeedComment = { id: string; body: string; created_at: string; author_id: string; author: MiniProfile | MiniProfile[] | null };
type FeedMedia = { display_order: number; media: { storage_path: string; alt_text: string | null; width: number; height: number; bucket_id: string } | { storage_path: string; alt_text: string | null; width: number; height: number; bucket_id: string }[] | null };
type FeedPost = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: MiniProfile | MiniProfile[] | null;
  tournament: MiniTournament | MiniTournament[] | null;
  association: MiniAssociation | MiniAssociation[] | null;
  likes: { profile_id: string }[];
  comments: FeedComment[];
  media_items: FeedMedia[];
};

function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function displayName(profile: MiniProfile | null) {
  if (!profile) return 'Membre VolleyPéi';
  if (profile.show_real_name && (profile.first_name || profile.last_name)) {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  }
  return `@${profile.username ?? 'joueur'}`;
}

function relativeDate(input: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Indian/Reunion',
  }).format(new Date(input));
}

export default async function NewsFeedPage({ searchParams }: { searchParams: Promise<{ page?: string; erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([getCurrentIdentity(), searchParams]);
  const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const supabase = await createServerSupabaseClient();

  const [postsResult, tournamentsResult, membershipsResult] = await Promise.all([
    supabase
      .from('posts')
      .select(`
        id, author_id, body, created_at,
        author:profiles!posts_author_id_fkey(id, username, first_name, last_name, show_real_name),
        tournament:tournaments(id, name, date),
        association:associations(id, name, slug),
        likes:post_likes(profile_id),
        media_items:post_media(display_order, media:media_assets(storage_path, alt_text, width, height, bucket_id)),
        comments:post_comments(id, body, created_at, author_id, author:profiles!post_comments_author_id_fkey(id, username, first_name, last_name, show_real_name))
      `, { count: 'exact' })
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .order('created_at', { referencedTable: 'post_comments', ascending: true })
      .range(from, from + PAGE_SIZE - 1),
    supabase
      .from('tournaments')
      .select('id, name, date')
      .eq('status', 'published')
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(60),
    identity
      ? supabase
          .from('association_members')
          .select('association:associations(id, name, slug)')
          .eq('user_id', identity.id)
          .eq('status', 'active')
      : Promise.resolve({ data: [], error: null }),
  ]);

  const posts = (postsResult.data ?? []) as unknown as FeedPost[];
  const totalPages = Math.max(1, Math.ceil((postsResult.count ?? 0) / PAGE_SIZE));
  const associations = (membershipsResult.data ?? [])
    .map((membership) => one(membership.association as MiniAssociation | MiniAssociation[] | null))
    .filter((association): association is MiniAssociation => Boolean(association));

  return (
    <section className="px-4 py-8 sm:py-12">
      <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <AuthNotice error={params.erreur ?? postsResult.error?.message} message={params.message} />
          <div className="mb-7">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue"><Sparkles className="h-4 w-4" /> La communauté volley 974</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">Actualité VolleyPéi</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-500">Partage les résultats, les entraînements, les photos et les souvenirs liés aux tournois de l’île.</p>
          </div>

          {identity ? (
            <form action={createPost} className="mb-6 rounded-3xl border border-ink-200 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-950 text-sm font-semibold text-white">{identity.profile?.username?.slice(0, 1).toUpperCase() ?? 'V'}</div>
                <div className="min-w-0 flex-1">
                  <label htmlFor="post-body" className="sr-only">Ta publication</label>
                  <textarea id="post-body" name="body" required maxLength={5000} rows={4} placeholder="Quoi de neuf dans le volley péi ?" className="w-full resize-none rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-[15px] outline-none transition focus:border-ink-400 focus:bg-white" />
                  <div className="mt-3"><OptimizedMediaPicker usage="post" maxFiles={4} /></div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-medium text-ink-500">Lier à un tournoi
                      <select name="tournament_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">Aucun tournoi</option>{tournamentsResult.data?.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name} · {new Intl.DateTimeFormat('fr-FR').format(new Date(tournament.date))}</option>)}</select>
                    </label>
                    {associations.length > 0 && <label className="text-xs font-medium text-ink-500">Publier en tant que
                      <select name="association_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">@{identity.profile?.username}</option>{associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}</select>
                    </label>}
                  </div>
                  <div className="mt-4 flex justify-end"><button className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white"><Send className="h-4 w-4" /> Publier</button></div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 rounded-3xl border border-ink-200 bg-white p-6 text-center shadow-soft"><p className="font-display text-lg font-semibold">Rejoins la conversation</p><p className="mt-1 text-sm text-ink-500">Un compte est nécessaire pour publier, aimer et commenter.</p><Link href="/connexion?retour=/actualite" className="mt-4 inline-flex rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white">Se connecter</Link></div>
          )}

          <div className="space-y-5">
            {posts.length === 0 ? <div className="rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center"><p className="font-display text-xl font-semibold">Le terrain est prêt.</p><p className="mt-2 text-sm text-ink-500">Sois la première personne à partager une actualité.</p></div> : posts.map((post) => {
              const author = one(post.author);
              const tournament = one(post.tournament);
              const association = one(post.association);
              const liked = Boolean(identity && post.likes.some((like) => like.profile_id === identity.id));
              return <article key={post.id} className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-soft">
                <div className="p-5 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-reunion-blue/10 font-semibold text-reunion-blue">{(association?.name ?? displayName(author)).replace('@', '').slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{association?.name ?? displayName(author)}</p><time className="text-xs text-ink-400" dateTime={post.created_at}>{relativeDate(post.created_at)}</time></div></div>
                    {identity?.id === post.author_id && <form action={deletePost}><input type="hidden" name="post_id" value={post.id} /><button aria-label="Supprimer la publication" className="rounded-full p-2 text-ink-300 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></form>}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-ink-700">{post.body}</p>
                  {post.media_items.length > 0 && <div className={`mt-4 grid gap-1.5 overflow-hidden rounded-2xl ${post.media_items.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>{post.media_items.sort((a, b) => a.display_order - b.display_order).map((item) => {
                    const media = one(item.media);
                    if (!media) return null;
                    const imageUrl = supabase.storage.from(media.bucket_id).getPublicUrl(media.storage_path).data.publicUrl;
                    return <div key={media.storage_path} className="relative aspect-square bg-ink-100"><Image src={imageUrl} alt={media.alt_text ?? 'Photo partagée sur VolleyPéi'} fill sizes={post.media_items.length > 1 ? '(max-width: 1024px) 50vw, 350px' : '(max-width: 1024px) 100vw, 700px'} className="object-cover" /></div>;
                  })}</div>}
                  {tournament && <Link href={`/tournoi/${tournament.id}`} className="mt-4 flex items-center gap-3 rounded-2xl border border-reunion-blue/15 bg-reunion-blue/[0.04] p-4 text-sm transition hover:bg-reunion-blue/[0.08]"><CalendarDays className="h-5 w-5 text-reunion-blue" /><span><span className="block font-semibold text-ink-900">{tournament.name}</span><span className="text-xs text-ink-500">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(tournament.date))}</span></span></Link>}
                  <div className="mt-5 flex items-center gap-5 border-t border-ink-100 pt-4">
                    <form action={togglePostLike}><input type="hidden" name="post_id" value={post.id} /><button className={`inline-flex items-center gap-2 text-sm font-medium ${liked ? 'text-red-600' : 'text-ink-500 hover:text-ink-900'}`}><Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} /> {post.likes.length || 'J’aime'}</button></form>
                    <span className="inline-flex items-center gap-2 text-sm text-ink-500"><MessageCircle className="h-4 w-4" /> {post.comments.length || 'Commenter'}</span>
                  </div>
                </div>
                {(post.comments.length > 0 || identity) && <div className="border-t border-ink-100 bg-ink-50/60 px-5 py-4 sm:px-6">
                  {post.comments.length > 0 && <div className="mb-4 space-y-3">{post.comments.map((comment) => <div key={comment.id} className="flex gap-2.5"><div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-semibold ring-1 ring-ink-200">{displayName(one(comment.author)).replace('@', '').slice(0, 1).toUpperCase()}</div><div className="rounded-2xl bg-white px-3.5 py-2 ring-1 ring-ink-100"><p className="text-xs font-semibold">{displayName(one(comment.author))}</p><p className="mt-0.5 text-sm leading-5 text-ink-600">{comment.body}</p></div></div>)}</div>}
                  {identity && <form action={addPostComment} className="flex gap-2"><input type="hidden" name="post_id" value={post.id} /><label className="sr-only" htmlFor={`comment-${post.id}`}>Ajouter un commentaire</label><input id={`comment-${post.id}`} name="body" required maxLength={2000} placeholder="Écrire un commentaire…" className="min-w-0 flex-1 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm" /><button aria-label="Envoyer le commentaire" className="rounded-xl bg-ink-950 p-3 text-white"><Send className="h-4 w-4" /></button></form>}
                </div>}
              </article>;
            })}
          </div>

          {totalPages > 1 && <nav className="mt-7 flex items-center justify-center gap-3" aria-label="Pagination du fil">{page > 1 && <Link href={`/actualite?page=${page - 1}`} className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm">Précédent</Link>}<span className="text-xs text-ink-400">Page {page} sur {totalPages}</span>{page < totalPages && <Link href={`/actualite?page=${page + 1}`} className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm">Suivant</Link>}</nav>}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl bg-ink-950 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Esprit VolleyPéi</p>
            <h2 className="mt-3 font-display text-2xl font-semibold">Le volley réunionnais, toute l’année.</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Avant, pendant et après les tournois : partage la vie des terrains et construis leur mémoire.</p>
            <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-white">Voir le calendrier →</Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
