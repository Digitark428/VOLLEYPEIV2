import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Compatibility browser client for the existing client-side pages.
 * New server code must import createServerSupabaseClient from
 * `@/lib/supabase/server` instead.
 */
export const supabase = createBrowserClient(supabaseUrl, supabasePublishableKey);

// Types
export type TournamentType =
  | 'Beach volley'
  | 'Volley indoor'
  | 'Green volley'
  | 'Officiel LRVB'
  | 'Sparing'
  | 'Loisirs';

export interface Tournament {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  date: string;       // ISO date
  time: string;       // HH:MM:SS
  city: string;
  type: TournamentType;
  location: string;
  players_count: number;
  description: string;
  poster_url: string;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  views_count?: number;
  likes?: { profile_id: string }[];
  association_id?: string | null;
  created_by?: string | null;
  slug?: string | null;
  status?: 'draft' | 'published' | 'cancelled' | 'archived' | 'hidden';
  format?: string | null;
  address?: string | null;
  registration_enabled?: boolean;
  registration_deadline?: string | null;
  max_teams?: number | null;
  additional_info?: string | null;
}

export type SponsorCategory = 'gold' | 'silver' | 'bronze';

export interface Sponsor {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: SponsorCategory;
  image_url: string;
  slogan?: string | null;
  website?: string | null;
  phone?: string | null;
  description?: string | null;
  gallery: string[];
  display_order: number;
}
