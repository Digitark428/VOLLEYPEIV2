'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';
import Calendar from '@/components/calendar/Calendar';
import DayEventsModal from '@/components/calendar/DayEventsModal';
import StatsTrackers from '@/components/calendar/StatsTrackers';
import TournamentCard from '@/components/calendar/TournamentCard';
import PublishForm from '@/components/forms/PublishForm';
import Button from '@/components/ui/Button';
import { supabase, type Tournament } from '@/lib/supabase';

export default function HomePage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Tournament[]>([]);
  const [dayOpen, setDayOpen] = useState(false);

  const [publishOpen, setPublishOpen] = useState(false);

  const fetchTournaments = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: true });
    setTournaments(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleDayClick = (date: Date, events: Tournament[]) => {
    if (events.length === 1) {
      // 1 seul tournoi : redirection directe
      window.location.href = `/tournoi/${events[0].id}`;
      return;
    }
    setSelectedDate(date);
    setSelectedEvents(events);
    setDayOpen(true);
  };

  // Prochains tournois = à venir, max 8
  const upcoming = tournaments
    .filter((t) => new Date(t.date) >= new Date(new Date().toDateString()))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12">
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center mb-10 sm:mb-14"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ink-100 border border-ink-200/60 text-[11px] font-medium text-ink-600 tracking-wide uppercase mb-5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
          </span>
          Calendrier en direct
        </div>

        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-ink-900 leading-[1.05]">
          Le volley à La Réunion,
          <br />
          <span className="shimmer-text">tous les tournois en un calendrier.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-ink-500 max-w-2xl mx-auto leading-relaxed">
          Beach volley, indoor, green volley, tournois officiels LRVB.
          Publication libre, calendrier public, mis à jour en temps réel par la communauté.
        </p>

        {/* Bouton principal */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={() => setPublishOpen(true)} className="group">
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            Publier un tournoi
          </Button>
          <a
            href="#calendrier"
            className="text-sm font-medium text-ink-600 hover:text-ink-900 px-4 py-2 transition-colors"
          >
            Voir le calendrier →
          </a>
        </div>
      </motion.section>

      {/* TRACKERS */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="mb-8 sm:mb-12"
      >
        <StatsTrackers />
      </motion.section>

      {/* CALENDRIER */}
      <motion.section
        id="calendrier"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mb-12 sm:mb-16 scroll-mt-24"
      >
        {loading ? (
          <div className="aspect-[4/3] sm:aspect-[16/10] bg-white rounded-3xl border border-ink-200/60 animate-pulse" />
        ) : (
          <Calendar tournaments={tournaments} onDayClick={handleDayClick} />
        )}
      </motion.section>

      {/* PROCHAINS TOURNOIS */}
      <section>
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              À venir
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
              Prochains tournois
            </h2>
          </div>
          {upcoming.length > 0 && (
            <span className="text-sm text-ink-500 hidden sm:block">
              {upcoming.length} événement{upcoming.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] bg-white rounded-3xl border border-ink-200/60 animate-pulse"
              />
            ))}
          </div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-3xl bg-white border border-ink-200/60 p-12 text-center">
            <p className="text-ink-500">Aucun tournoi à venir pour le moment.</p>
            <Button onClick={() => setPublishOpen(true)} className="mt-4" variant="secondary">
              Publier le premier
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {upcoming.map((t, i) => (
              <TournamentCard key={t.id} tournament={t} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      <DayEventsModal
        open={dayOpen}
        onClose={() => setDayOpen(false)}
        date={selectedDate}
        tournaments={selectedEvents}
      />
      <PublishForm
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        onPublished={fetchTournaments}
      />
    </div>
  );
}
