export const FEED_PAGE_SIZE = 12;

export const FEED_SELECT = `
  id, author_id, body, created_at,
  author:profiles!posts_author_id_fkey(id, username, first_name, last_name, show_real_name, avatar_path),
  tournament:tournaments(id, name, date),
  association:associations(id, name, slug, logo_path),
  likes:post_likes(profile_id),
  media_items:post_media(display_order, media:media_assets(storage_path, alt_text, width, height, bucket_id)),
  comments:post_comments(id, body, created_at, author_id, author:profiles!post_comments_author_id_fkey(id, username, first_name, last_name, show_real_name, avatar_path))
`;

export type MiniProfile = { id: string; username: string | null; first_name: string | null; last_name: string | null; show_real_name: boolean; avatar_path: string | null };
export type MiniTournament = { id: string; name: string; date: string };
export type MiniAssociation = { id: string; name: string; slug: string; logo_path: string | null };
export type FeedComment = { id: string; body: string; created_at: string; author_id: string; author: MiniProfile | MiniProfile[] | null };
export type FeedMedia = { display_order: number; media: { storage_path: string; alt_text: string | null; width: number; height: number; bucket_id: string } | { storage_path: string; alt_text: string | null; width: number; height: number; bucket_id: string }[] | null };
export type FeedPost = {
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

export function one<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function displayName(profile: MiniProfile | null) {
  if (!profile) return 'Membre VolleyPéi';
  if (profile.show_real_name && (profile.first_name || profile.last_name)) return [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  return `@${profile.username ?? 'joueur'}`;
}
