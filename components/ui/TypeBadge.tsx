import { TYPE_COLORS } from '@/lib/utils';
import type { TournamentType } from '@/lib/supabase';

export default function TypeBadge({
  type,
  size = 'md',
}: {
  type: TournamentType;
  size?: 'sm' | 'md';
}) {
  const c = TYPE_COLORS[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${c.solid} text-white font-medium rounded-full shadow-sm ${
        size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {type}
    </span>
  );
}
