'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CalendarDays, Trophy, UserRound, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stats {
  players: number;
  associations: number;
  tournaments: number;
  visitsToday: number;
  visitsMonth: number;
  tournamentsMonth: number;
}

export default function StatsTrackers() {
  const [stats, setStats] = useState<Stats>({
    players: 0,
    associations: 0,
    tournaments: 0,
    visitsToday: 0,
    visitsMonth: 0,
    tournamentsMonth: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.rpc('get_public_stats');
      const row = Array.isArray(data) ? data[0] : data;
      setStats({
        players: Number(row?.players ?? 0),
        associations: Number(row?.associations ?? 0),
        tournaments: Number(row?.tournaments ?? 0),
        visitsToday: Number(row?.visits_today ?? 0),
        visitsMonth: Number(row?.visits_month ?? 0),
        tournamentsMonth: Number(row?.tournaments_this_month ?? 0),
      });
      setLoaded(true);
    })();
  }, []);

  const items = [
    {
      label: 'Membres inscrits',
      value: stats.players,
      icon: UserRound,
      accent: 'bg-emerald-500/10 text-emerald-700',
    },
    {
      label: 'Associations',
      value: stats.associations,
      icon: Building2,
      accent: 'bg-violet-500/10 text-violet-700',
    },
    {
      label: 'Tournois créés',
      value: stats.tournaments,
      icon: Trophy,
      accent: 'bg-reunion-red/10 text-reunion-red',
    },
    {
      label: 'Visites du jour',
      value: stats.visitsToday,
      icon: Eye,
      accent: 'bg-reunion-blue/10 text-reunion-blue',
    },
    {
      label: 'Visites du mois',
      value: stats.visitsMonth,
      icon: CalendarDays,
      accent: 'bg-reunion-yellow/10 text-amber-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
      {items.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.08 }}
          className="relative bg-white border border-ink-200/60 rounded-2xl p-3 sm:p-5 shadow-soft hover:shadow-card transition-shadow group overflow-hidden"
        >
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${item.accent} flex items-center justify-center`}>
              <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display text-2xl sm:text-3xl font-bold text-ink-900 tracking-tight tabular-nums">
              {loaded ? item.value.toLocaleString('fr-FR') : <span className="opacity-30">—</span>}
            </span>
            <span className="text-[11px] sm:text-xs text-ink-500 mt-0.5 leading-tight">
              {item.label}
            </span>
          </div>

          {/* shimmer décoratif */}
          <div className="absolute -right-8 -bottom-8 w-24 h-24 rounded-full bg-gradient-to-br from-ink-50 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
        </motion.div>
      ))}
    </div>
  );
}
