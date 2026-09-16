import { NextResponse } from 'next/server';
import { getCurrentIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  if (!await getCurrentIdentity()) return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (!/^[A-Za-z0-9._-]{1,30}$/.test(query)) return NextResponse.json({ users: [] });
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.from('profiles').select('id, username, first_name, last_name').ilike('username', `${query}%`).eq('status', 'active').is('deleted_at', null).order('username').limit(6);
  return NextResponse.json({ users: data ?? [] });
}
