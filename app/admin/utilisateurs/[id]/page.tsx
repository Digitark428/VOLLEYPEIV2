import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuthNotice from '@/components/auth/AuthNotice';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { requireAdmin } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateUserProfileAdmin } from '../../actions';

type UserRow = {
  id: string; email: string; username: string; account_type: string;
  first_name: string | null; last_name: string | null; avatar_path: string | null;
  city: string | null; club_name: string | null; status: string; created_at: string;
};
const input = 'mt-2 w-full rounded-xl border border-ink-200 px-4 py-3';

export default async function AdminUserEditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams, requireAdmin()]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.rpc('admin_list_users');
  const user = ((data ?? []) as UserRow[]).find((item) => item.id === id);
  if (!user) notFound();

  return <section className="px-4 py-10"><div className="mx-auto max-w-2xl">
    <Link href="/admin/utilisateurs" className="text-sm text-ink-500">← Utilisateurs</Link>
    <div className="mt-6 flex items-center gap-4"><ProfileAvatar username={user.username} avatarPath={user.avatar_path} size="lg" /><div><h1 className="font-display text-3xl font-semibold">@{user.username}</h1><p className="text-sm text-ink-500">{user.email} · {user.status}</p></div></div>
    <div className="mt-5"><AuthNotice error={query.erreur} message={query.message} /></div>
    <form action={updateUserProfileAdmin} className="mt-5 space-y-5 rounded-3xl border border-ink-200 bg-white p-6">
      <input type="hidden" name="user_id" value={id} />
      <label className="block text-sm font-medium">Pseudo<input name="username" defaultValue={user.username} required className={input} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Prénom<input name="first_name" defaultValue={user.first_name ?? ''} className={input} /></label>
        <label className="text-sm font-medium">Nom<input name="last_name" defaultValue={user.last_name ?? ''} className={input} /></label>
        <label className="text-sm font-medium">Ville<input name="city" defaultValue={user.city ?? ''} className={input} /></label>
        <label className="text-sm font-medium">Club<input name="club_name" defaultValue={user.club_name ?? ''} className={input} /></label>
      </div>
      <label className="block text-sm font-medium">Type de compte<select name="account_type" defaultValue={user.account_type} className={input}><option value="player">Joueur</option><option value="association">Responsable d’association</option></select></label>
      <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-semibold text-white">Enregistrer</button>
    </form>
  </div></section>;
}
