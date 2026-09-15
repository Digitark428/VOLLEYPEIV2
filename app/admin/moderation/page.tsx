import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AuthNotice from '@/components/auth/AuthNotice';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { moderateContent } from '../actions';

type ContentItem = { id: string; body: string; status: string; created_at: string; kind: 'posts' | 'post_comments' | 'tournament_comments' };
export default async function AdminModerationPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const [, params] = await Promise.all([requireAdmin(), searchParams]); const supabase = await createServerSupabaseClient();
  const [posts, postComments, tournamentComments, reports] = await Promise.all([
    supabase.from('posts').select('id, body, status, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('post_comments').select('id, body, status, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('tournament_comments').select('id, body, status, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
  ]);
  const items: ContentItem[] = [...(posts.data ?? []).map((item) => ({ ...item, kind: 'posts' as const })), ...(postComments.data ?? []).map((item) => ({ ...item, kind: 'post_comments' as const })), ...(tournamentComments.data ?? []).map((item) => ({ ...item, kind: 'tournament_comments' as const }))].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 60);
  return <section className="px-4 py-10"><div className="mx-auto max-w-6xl"><AdminPageHeader eyebrow="Administration" title="Modération" description={`${reports.count ?? 0} signalement(s) ouvert(s). Les contenus retirés restent conservés pour préserver les relations.`} /><AuthNotice error={params.erreur} /><div className="mt-7 space-y-3">{items.map((item) => <article key={`${item.kind}-${item.id}`} className="rounded-2xl border border-ink-200 bg-white p-5"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">{item.kind.replaceAll('_', ' ')} · {item.status}</p><p className="mt-2 line-clamp-3 text-sm leading-6 text-ink-600">{item.body}</p><form action={moderateContent} className="mt-4 flex gap-2"><input type="hidden" name="content_type" value={item.kind} /><input type="hidden" name="content_id" value={item.id} /><button name="status" value="published" className="rounded-lg border border-emerald-200 px-3 py-2 text-xs text-emerald-800">Publier</button><button name="status" value="hidden" className="rounded-lg border border-amber-200 px-3 py-2 text-xs text-amber-800">Masquer</button><button name="status" value="deleted" className="rounded-lg border border-red-200 px-3 py-2 text-xs text-red-700">Retirer</button></form></article>)}{items.length === 0 && <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-ink-500">Aucun contenu à modérer.</p>}</div></div></section>;
}
