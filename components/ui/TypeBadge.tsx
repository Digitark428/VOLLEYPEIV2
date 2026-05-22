import { TYPE_COLORS } from '@/lib/utils';
import type { TournamentType } from '@/lib/supabase';

export default function TypeBadge({ type, size = 'md' }: { type: TournamentType; size?: 'sm' | 'md' }) {
  const c = TYPE_COLORS[type];
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${c.bg} ${c.text} ring-1 ring-inset ${c.ring} font-medium rounded-full ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${c.text.replace('text-', 'bg-')}`} />
      {type}
    </span>
  );
}
