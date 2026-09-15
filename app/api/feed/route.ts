import { NextResponse } from 'next/server';
import { FEED_PAGE_SIZE, FEED_SELECT, type FeedPost } from '@/lib/feed';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return NextResponse.json({ error: 'Authentification requise.' }, { status: 401 });
  const page = Math.max(1, Number.parseInt(new URL(request.url).searchParams.get('page') ?? '1', 10) || 1);
  const from = (page - 1) * FEED_PAGE_SIZE;
  const { data, error } = await supabase.from('posts').select(FEED_SELECT).eq('status', 'published').is('deleted_at', null).order('created_at', { ascending: false }).order('created_at', { referencedTable: 'post_comments', ascending: true }).range(from, from + FEED_PAGE_SIZE);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const posts = (data ?? []) as unknown as FeedPost[];
  return NextResponse.json({ posts, hasMore: posts.length === FEED_PAGE_SIZE });
}
