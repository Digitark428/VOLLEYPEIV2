import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new Response('Authentification requise', { status: 401 });

  const { path } = await params;
  if (!path.length || path.some((part) => part === '..' || part.includes('\\'))) {
    return new Response('Chemin invalide', { status: 400 });
  }

  const legacyBucket = ['posters', 'sponsors'].includes(path[0]) ? path[0] : null;
  const bucket = legacyBucket ?? 'media-public';
  const storagePath = (legacyBucket ? path.slice(1) : path).join('/');
  const { data, error } = await supabase.storage.from(bucket).download(storagePath);
  if (error || !data) return new Response('Média introuvable', { status: 404 });

  return new Response(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'application/octet-stream',
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
