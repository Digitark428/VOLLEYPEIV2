'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Users } from 'lucide-react';
import type { Tournament } from '@/lib/supabase';
import TypeBadge from '@/components/ui/TypeBadge';
import { formatDate, formatTime } from '@/lib/utils';

interface Props {
  tournament: Tournament;
  index?: number;
}

export default function TournamentCard({ tournament: t, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/tournoi/${t.id}`}
        className="group block bg-white rounded-3xl overflow-hidden border border-ink-200/60 hover:border-ink-300 hover:shadow-lift transition-all duration-500 hover:-translate-y-1"
      >
        {/* Affiche */}
        <div className="aspect-[4/5] overflow-hidden bg-ink-100 relative">
          {t.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.poster_url}
              alt={t.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          )}
          {/* Badge type en overlay */}
          <div className="absolute top-3 left-3">
            <TypeBadge type={t.type} size="sm" />
          </div>
          {/* Gradient bas */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <div className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-2.5 py-1 text-[11px] font-medium text-ink-900">
              <Calendar className="w-3 h-3" />
              {formatDate(t.date, { day: 'numeric', month: 'short' })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-[15px] sm:text-base text-ink-900 leading-tight line-clamp-2 tracking-tight">
            {t.name}
          </h3>

          <div className="mt-3 space-y-1.5 text-[13px] text-ink-500">
            <p className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
              {formatTime(t.time)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{t.city}</span>
            </p>
            <p className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 flex-shrink-0" />
              {t.players_count} équipes
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
