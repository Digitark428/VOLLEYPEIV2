'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function feedError(message: string): never {
  redirect(`/actualite?erreur=${encodeURIComponent(message)}`);
}

export async function createPost(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/actualite');
  const body = textValue(formData, 'body');
  const tournamentId = textValue(formData, 'tournament_id') || null;
  const associationId = textValue(formData, 'association_id') || null;
  const mediaIds = formData.getAll('media_ids').map(String).filter(Boolean).slice(0, 4);

  if (body.length < 1 || body.length > 5000) {
    feedError('La publication doit contenir entre 1 et 5 000 caractères.');
  }

  const supabase = await createServerSupabaseClient();
  const { data: post, error } = await supabase.from('posts').insert({
    author_id: identity.id,
    association_id: associationId,
    tournament_id: tournamentId,
    body,
    status: 'published',
  }).select('id').single();

  if (error) feedError(error.message);
  if (mediaIds.length && post) {
    const { error: mediaError } = await supabase.from('post_media').insert(
      mediaIds.map((mediaId, index) => ({ post_id: post.id, media_id: mediaId, display_order: index + 1 }))
    );
    if (mediaError) {
      await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', post.id);
      feedError(mediaError.message);
    }
  }
  revalidatePath('/actualite');
  if (tournamentId) revalidatePath(`/tournoi/${tournamentId}`);
  redirect('/actualite?message=Publication%20partagée.');
}

export async function togglePostLike(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/actualite');
  const postId = textValue(formData, 'post_id');
  if (!postId) feedError('Publication introuvable.');

  const supabase = await createServerSupabaseClient();
  const { data: existing, error: readError } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('profile_id', identity.id)
    .maybeSingle();

  if (readError) feedError(readError.message);
  const result = existing
    ? await supabase.from('post_likes').delete().eq('post_id', postId).eq('profile_id', identity.id)
    : await supabase.from('post_likes').insert({ post_id: postId, profile_id: identity.id });

  if (result.error) feedError(result.error.message);
  revalidatePath('/actualite');
}

export async function addPostComment(formData: FormData) {
  const identity = await requireIdentity('/connexion?retour=/actualite');
  const postId = textValue(formData, 'post_id');
  const body = textValue(formData, 'body');
  if (!postId || body.length < 1 || body.length > 2000) {
    feedError('Le commentaire doit contenir entre 1 et 2 000 caractères.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('post_comments').insert({
    post_id: postId,
    author_id: identity.id,
    body,
    status: 'published',
  });
  if (error) feedError(error.message);
  revalidatePath('/actualite');
}

export async function deletePost(formData: FormData) {
  await requireIdentity('/connexion?retour=/actualite');
  const postId = textValue(formData, 'post_id');
  if (!postId) feedError('Publication introuvable.');
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', postId);
  if (error) feedError(error.message);
  revalidatePath('/actualite');
}
