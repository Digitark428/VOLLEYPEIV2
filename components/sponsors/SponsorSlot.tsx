'use client';

import { motion } from 'framer-motion';
import type { Sponsor } from '@/lib/supabase';
import { classNames } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

type Tier = 'gold' | 'silver' | 'bronze';

interface SlotProps {
  tier: Tier;
  sponsor?: Sponsor;
  onClick?: () => void;
  showPlaceholder?: boolean;
  index?: number;
}

const tierStyles: Record<
  Tier,
  { ring: string; label: string; aspect: string; minH: string; glow: string }
> = {
  gold: {
    ring: 'ring-amber-300/60',
    label: 'Gold',
    aspect: 'aspect-[3/1] sm:aspect-[5/1]',
    minH: 'min-h-[120px] sm:min-h-[180px]',
    glow: 'from-amber-100/60 to-amber-50/20',
  },
  silver: {
    ring: 'ring-ink-300/60',
    label: 'Silver',
    aspect: 'aspect-square sm:aspect-[4/3]',
    minH: 'min-h-[160px]',
    glow: 'from-ink-100/80 to-ink-50/30',
  },
  bronze: {
    ring: 'ring-orange-200/60',
    label: 'Bronze',
    aspect: 'aspect-square',
    minH: 'min-h-[100px]',
    glow: 'from-orange-50/80 to-orange-50/20',
  },
};

export default function SponsorSlot({
  tier,
  sponsor,
  onClick,
  showPlaceholder = false,
  index = 0,
}: SlotProps) {
  const s = tierStyles[tier];

  if (!sponsor && !showPlaceholder) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onClick={onClick}
      disabled={!sponsor}
      className={classNames(
        'relative w-full overflow-hidden rounded-2xl bg-white border border-ink-200/60',
        'ring-1 ring-inset',
        s.ring,
        s.aspect,
        s.minH,
        sponsor ? 'cursor-pointer hover:shadow-lift transition-all hover:-translate-y-0.5' : 'cursor-default',
        showPlaceholder && !sponsor && 'border-dashed bg-ink-50/50'
      )}
    >
      {/* Glow */}
      <div
        className={classNames(
          'absolute inset-0 bg-gradient-to-br opacity-50',
          s.glow
        )}
      />

      {/* Label tier */}
      <div className="absolute top-2 left-2 z-10">
        <span
          className={classNames(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider uppercase',
            tier === 'gold' && 'bg-amber-100 text-amber-800',
            tier === 'silver' && 'bg-ink-100 text-ink-700',
            tier === 'bronze' && 'bg-orange-100 text-orange-800'
          )}
        >
          {tier === 'gold' && <Sparkles className="w-2.5 h-2.5" />}
          {s.label}
        </span>
      </div>

      {sponsor ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.image_url}
            alt={sponsor.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          {tier !== 'bronze' && sponsor.slogan && (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-left">
              <p className="text-white font-medium text-sm tracking-tight line-clamp-1">
                {sponsor.name}
              </p>
              {tier === 'gold' && (
                <p className="text-white/80 text-xs mt-0.5 line-clamp-1">{sponsor.slogan}</p>
              )}
            </div>
          )}
        </>
      ) : (
        // Placeholder partenaires
        <div className="relative h-full w-full flex flex-col items-center justify-center text-center p-3">
          <span className="text-ink-400 text-xs font-medium">Emplacement {s.label}</span>
          <span className="text-ink-300 text-[10px] mt-1">Disponible</span>
        </div>
      )}
    </motion.button>
  );
}
