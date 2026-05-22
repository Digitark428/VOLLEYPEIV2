'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, CalendarDays, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stats {
  visitsToday: number;
  visitsMonth: number;
  tournamentsMonth: number;
}

export default function StatsTrackers() {
  const [stats, setStats] = useState<Stats>({
    visitsToday: 0,
    visitsMonth: 0,
    tournamentsMonth: 0,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      const [todayRes, monthRes, tournRes] = await Promise.all([
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visited_at', startOfDay.toISOString()),
        supabase
          .from('visits')
          .select('*', { count: 'exact', head: true })
          .gte('visited_at', startOfMonth.toISOString()),
        supabase
          .from('tournaments')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString())
          .lte('created_at', endOfMonth.toISOString()),
      ]);

      setStats({
        visitsToday: todayRes.count ?? 0,
        visitsMonth: monthRes.count ?? 0,
        tournamentsMonth: tournRes.count ?? 0,
      });
      setLoaded(true);
    })();
  }, []);

  const items = [
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
    {
      label: 'Tournois ce mois-ci',
      value: stats.tournamentsMonth,
      icon: Trophy,
      accent: 'bg-reunion-red/10 text-reunion-red',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
