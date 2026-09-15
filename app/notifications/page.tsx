import { Bell, CheckCheck } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { markAllNotificationsRead, openNotification } from './actions';

type Actor = { username: string | null; avatar_path: string | null };
function one<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, occurrences, href, read_at, created_at, actor:profiles!notifications_actor_id_fkey(username, avatar_path)')
    .eq('recipient_id', identity.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return <section className="px-4 py-8 sm:py-12"><div className="mx-auto max-w-2xl">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">Reste dans le match</p><h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Notifications</h1></div>{data?.some((item) => !item.read_at) && <form action={markAllNotificationsRead}><button className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold"><CheckCheck className="h-4 w-4" /> Tout marquer comme lu</button></form>}</div>
    <div className="mt-6"><AuthNotice error={params.erreur ?? error?.message} message={params.message} /></div>
    <div className="mt-4 space-y-2">
      {!data?.length ? <div className="rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center"><Bell className="mx-auto h-7 w-7 text-ink-300" /><p className="mt-3 font-semibold">Aucune notification</p><p className="mt-1 text-sm text-ink-500">Les interactions utiles apparaîtront ici.</p></div> : data.map((item) => {
        const actor = one(item.actor as Actor | Actor[] | null);
        return <form action={openNotification} key={item.id}><input type="hidden" name="notification_id" value={item.id} /><button className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition hover:border-ink-300 ${item.read_at ? 'border-ink-100 bg-white/60' : 'border-reunion-blue/20 bg-blue-50/60 shadow-soft'}`}><ProfileAvatar username={actor?.username} avatarPath={actor?.avatar_path} /><span className="min-w-0 flex-1"><span className="flex items-center gap-2 text-sm font-semibold">{item.title}{item.occurrences > 1 && <span className="rounded-full bg-ink-950 px-2 py-0.5 text-[10px] text-white">×{item.occurrences}</span>}</span>{item.body && <span className="mt-1 block text-sm leading-5 text-ink-500">{item.body}</span>}<time className="mt-2 block text-xs text-ink-400">{new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Indian/Reunion' }).format(new Date(item.created_at))}</time></span>{!item.read_at && <span className="mt-2 h-2.5 w-2.5 rounded-full bg-reunion-blue" />}</button></form>;
      })}
    </div>
  </div></section>;
}
