'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function markAllNotificationsRead() {
  const identity = await requireIdentity();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', identity.id).is('read_at', null);
  if (error) redirect(`/notifications?erreur=${encodeURIComponent(error.message)}`);
  revalidatePath('/', 'layout');
  redirect('/notifications?message=Toutes%20les%20notifications%20sont%20lues.');
}

export async function openNotification(formData: FormData) {
  const identity = await requireIdentity();
  const notificationId = String(formData.get('notification_id') ?? '');
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.from('notifications').select('href').eq('id', notificationId).eq('recipient_id', identity.id).maybeSingle();
  if (error || !data) redirect('/notifications?erreur=Notification%20introuvable.');
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId).eq('recipient_id', identity.id);
  revalidatePath('/', 'layout');
  redirect(data.href.startsWith('/') && !data.href.startsWith('//') ? data.href : '/notifications');
}
