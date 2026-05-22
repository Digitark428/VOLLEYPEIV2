'use client';

import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import TypeBadge from '@/components/ui/TypeBadge';
import { formatDate, formatTime } from '@/lib/utils';
import type { Tournament } from '@/lib/supabase';
import { MapPin, Clock, ArrowRight } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  date: Date | null;
  tournaments: Tournament[];
}

export default function DayEventsModal({ open, onClose, date, tournaments }: Props) {
  if (!date) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={formatDate(date)}
      description={`${tournaments.length} tournoi${tournaments.length > 1 ? 's' : ''} prévu${tournaments.length > 1 ? 's' : ''}`}
      maxWidth="lg"
    >
      <div className="flex flex-col gap-3">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/tournoi/${t.id}`}
            onClick={onClose}
            className="group flex gap-4 p-3 rounded-2xl border border-ink-200/60 hover:border-ink-300 hover:shadow-soft transition-all bg-white"
          >
            {/* Affiche */}
            <div className="flex-shrink-0 w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-ink-100">
              {t.poster_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={t.poster_url}
                  alt={t.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5 py-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-ink-900 text-[15px] leading-tight line-clamp-2">
                  {t.name}
                </h3>
                <ArrowRight className="w-4 h-4 text-ink-400 group-hover:text-ink-900 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-0.5" />
              </div>
              <TypeBadge type={t.type} size="sm" />
              <div className="flex items-center gap-3 text-xs text-ink-500 mt-auto">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(t.time)}
                </span>
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{t.city}</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Modal>
  );
}
