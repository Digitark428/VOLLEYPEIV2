import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

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
