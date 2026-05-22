import type { TournamentType } from './supabase';

export const TOURNAMENT_TYPES: TournamentType[] = [
  'Beach volley',
  'Volley indoor',
  'Green volley',
  'Officiel LRVB',
  'Sparing',
  'Loisirs',
];

// Couleurs des catégories : fond plein + texte blanc
// Chaque catégorie a sa couleur pleine (solid) + soft (dégradé léger pour fond calendrier desktop)
export const TYPE_COLORS: Record<
  TournamentType,
  {
    solid: string;     // fond plein pour badges
    soft: string;      // fond doux pour pastilles calendrier desktop
    softText: string;  // texte sur fond doux
    dot: string;       // pastille colorée mobile
    ring: string;      // ring/border
  }
> = {
  'Beach volley':  { solid: 'bg-orange-500',  soft: 'bg-orange-100',  softText: 'text-orange-800',  dot: 'bg-orange-500',  ring: 'ring-orange-200' },
  'Volley indoor': { solid: 'bg-zinc-600',    soft: 'bg-zinc-100',    softText: 'text-zinc-800',    dot: 'bg-zinc-600',    ring: 'ring-zinc-200' },
  'Green volley':  { solid: 'bg-emerald-600', soft: 'bg-emerald-100', softText: 'text-emerald-800', dot: 'bg-emerald-600', ring: 'ring-emerald-200' },
  'Officiel LRVB': { solid: 'bg-blue-600',    soft: 'bg-blue-100',    softText: 'text-blue-800',    dot: 'bg-blue-600',    ring: 'ring-blue-200' },
  'Sparing':       { solid: 'bg-red-600',     soft: 'bg-red-100',     softText: 'text-red-800',     dot: 'bg-red-600',     ring: 'ring-red-200' },
  'Loisirs':       { solid: 'bg-pink-500',    soft: 'bg-pink-100',    softText: 'text-pink-800',    dot: 'bg-pink-500',    ring: 'ring-pink-200' },
};

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', opts ?? {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatTime(time: string) {
  const [h, m] = time.split(':');
  return `${h}h${m}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function classNames(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(' ');
}
