'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Tournament } from '@/lib/supabase';
import { TYPE_COLORS, classNames, isSameDay } from '@/lib/utils';

interface Props {
  tournaments: Tournament[];
  onDayClick: (date: Date, tournaments: Tournament[]) => void;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export default function Calendar({ tournaments, onDayClick }: Props) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const { weeks, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);

    // Lundi de la première semaine
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Lundi
    const start = new Date(year, month, 1 - firstWeekday);

    // 6 semaines pour stabilité
    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }

    const weeks: Date[][] = [];
    for (let i = 0; i < 6; i++) weeks.push(days.slice(i * 7, i * 7 + 7));

    return {
      weeks,
      monthLabel: `${MONTHS[month]} ${year}`,
      firstOfMonth,
      lastOfMonth,
    };
  }, [cursor]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Tournament[]>();
    for (const t of tournaments) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tournaments]);

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1));

  return (
    <div className="bg-white rounded-3xl shadow-card border border-ink-200/60 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-ink-200/60">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink-900 capitalize">
            {monthLabel}
          </h2>
          <button
            onClick={goToday}
            className="text-xs font-medium text-ink-500 hover:text-ink-900 px-2.5 py-1 rounded-full hover:bg-ink-100 transition-colors"
          >
            Aujourd'hui
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goPrev}
            className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4 text-ink-600" />
          </button>
          <button
            onClick={goNext}
            className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-4 h-4 text-ink-600" />
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 px-2 sm:px-3 pt-3 pb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-[11px] font-medium tracking-wider uppercase text-ink-400 text-center py-2"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{d.charAt(0)}</span>
          </div>
        ))}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-7 px-2 sm:px-3 pb-3 gap-1 sm:gap-1.5">
        <AnimatePresence mode="wait">
          {weeks.flat().map((day, idx) => {
            const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const dayEvents = eventsByDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === cursor.getMonth();
            const isToday = isSameDay(day, today);
            const hasEvents = dayEvents.length > 0;

            return (
              <motion.button
                key={`${cursor.getMonth()}-${idx}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.005 }}
                onClick={() => hasEvents && onDayClick(day, dayEvents)}
                disabled={!hasEvents}
                className={classNames(
                  'relative aspect-square sm:aspect-[1.1] min-h-[56px] sm:min-h-[80px] rounded-xl sm:rounded-2xl p-1.5 sm:p-2',
                  'flex flex-col items-start text-left',
                  'transition-all duration-300',
                  isCurrentMonth ? 'bg-white' : 'bg-ink-50/40',
                  hasEvents
                    ? 'hover:bg-ink-100 cursor-pointer ring-1 ring-inset ring-ink-200/80 hover:ring-ink-300 hover:shadow-soft hover:-translate-y-0.5'
                    : 'cursor-default',
                  isToday && 'ring-2 ring-ink-900 ring-inset',
                  !isCurrentMonth && 'opacity-50'
                )}
              >
                <span
                  className={classNames(
                    'text-[13px] sm:text-sm font-medium',
                    isToday ? 'text-ink-900 font-semibold' : 'text-ink-700',
                    !isCurrentMonth && 'text-ink-400'
                  )}
                >
                  {day.getDate()}
                </span>

                {hasEvents && (
                  <div className="mt-auto flex flex-col gap-0.5 w-full">
                    {/* Mobile : juste des points */}
                    <div className="sm:hidden flex gap-0.5 mt-1 flex-wrap">
                      {dayEvents.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[e.type].text.replace('text-', 'bg-')}`}
                        />
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="text-[9px] text-ink-500">+{dayEvents.length - 3}</span>
                      )}
                    </div>

                    {/* Desktop : pastilles avec nom */}
                    <div className="hidden sm:flex flex-col gap-0.5">
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className={`block truncate text-[10.5px] font-medium px-1.5 py-0.5 rounded-md ${TYPE_COLORS[e.type].bg} ${TYPE_COLORS[e.type].text}`}
                        >
                          {e.name}
                        </span>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-[10px] text-ink-500 pl-1.5">
                          +{dayEvents.length - 2} autres
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
