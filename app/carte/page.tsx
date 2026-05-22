'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { supabase, type Tournament } from '@/lib/supabase';

// Leaflet doit être chargé en client uniquement
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-ink-100 rounded-3xl animate-pulse flex items-center justify-center">
      <span className="text-ink-400 text-sm">Chargement de la carte…</span>
    </div>
  ),
});

export default function CartePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date', { ascending: true });
      setTournaments(data ?? []);
      setLoading(false);
    })();
  }, []);

  const withCoords = tournaments.filter((t) => t.latitude && t.longitude);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 sm:mb-8 flex items-end justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-2">
            <MapPin className="w-3.5 h-3.5" />
            Géolocalisation
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900">
            Carte des tournois
          </h1>
          <p className="mt-2 text-sm text-ink-500 max-w-xl">
            Tous les tournois géolocalisés à La Réunion. Cliquez sur un pin pour voir le détail.
          </p>
        </div>
        <div className="hidden sm:block text-right text-sm">
          <div className="text-2xl font-display font-bold tabular-nums">
            {withCoords.length}
          </div>
          <div className="text-xs text-ink-400">localisés</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="h-[70vh] min-h-[500px] w-full rounded-3xl overflow-hidden border border-ink-200/60 shadow-card"
      >
        {!loading && <MapView tournaments={tournaments} />}
      </motion.div>

      {!loading && withCoords.length === 0 && (
        <div className="mt-6 text-center text-sm text-ink-500">
          Aucun tournoi géolocalisé à venir. Les organisateurs peuvent ajouter une localisation
          précise via le formulaire de publication.
        </div>
      )}
    </div>
  );
}
