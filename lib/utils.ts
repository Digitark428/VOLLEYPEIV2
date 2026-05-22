import type { TournamentType } from './supabase';

export const TOURNAMENT_TYPES: TournamentType[] = [
  'Beach volley',
  'Volley indoor',
  'Green volley',
  'Officiel LRVB',
  'Sparing',
  'Loisirs',
];

export const TYPE_COLORS: Record<TournamentType, { bg: string; text: string; ring: string }> = {
  'Beach volley':   { bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  'Volley indoor':  { bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200' },
  'Green volley':   { bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200' },
  'Officiel LRVB':  { bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200' },
  'Sparing':        { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200' },
  'Loisirs':        { bg: 'bg-ink-100',   text: 'text-ink-700',    ring: 'ring-ink-200' },
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
  // "14:30:00" -> "14h30"
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
