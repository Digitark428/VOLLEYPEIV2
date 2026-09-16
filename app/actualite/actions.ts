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
  if (post) {
    const hashtags = [...new Set(Array.from(body.matchAll(/#([A-Za-z0-9_]{2,50})/g), (match) => match[1].toLowerCase()))].slice(0, 20);
    const usernames = [...new Set(Array.from(body.matchAll(/@([A-Za-z0-9._-]{3,30})/g), (match) => match[1]))].slice(0, 20);
    if (hashtags.length) {
      const { error: hashtagError } = await supabase.from('post_hashtags').insert(hashtags.map((tag) => ({ post_id: post.id, tag })));
      if (hashtagError) {
        await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', post.id);
        feedError(`Impossible de publier les hashtags : ${hashtagError.message}`);
      }
    }
    if (usernames.length) {
      const filters = usernames.map((username) => `username.ilike.${username}`).join(',');
      const { data: mentionedProfiles } = await supabase.from('profiles').select('id').or(filters).eq('status', 'active').is('deleted_at', null);
      const mentionedIds = [...new Set((mentionedProfiles ?? []).map((profile) => profile.id))].filter((id) => id !== identity.id);
      if (mentionedIds.length) {
        const { error: mentionError } = await supabase.from('post_mentions').insert(mentionedIds.map((mentioned_profile_id) => ({ post_id: post.id, mentioned_profile_id, mentioning_profile_id: identity.id })));
        if (mentionError) {
          await supabase.from('posts').update({ deleted_at: new Date().toISOString() }).eq('id', post.id);
          feedError(`Impossible de publier les mentions : ${mentionError.message}`);
        }
      }
    }
  }
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
