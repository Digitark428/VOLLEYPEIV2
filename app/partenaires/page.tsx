'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck } from 'lucide-react';
import { supabase, type Sponsor, type Tournament } from '@/lib/supabase';
import Calendar from '@/components/calendar/Calendar';
import DayEventsModal from '@/components/calendar/DayEventsModal';
import StatsTrackers from '@/components/calendar/StatsTrackers';
import TournamentCard from '@/components/calendar/TournamentCard';
import SponsorSlot from '@/components/sponsors/SponsorSlot';
import SponsorModal from '@/components/sponsors/SponsorModal';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';

const PARTNERS_CODE = process.env.NEXT_PUBLIC_PARTNERS_CODE || 'PARTENAIRES974';

export default function PartenairesPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('vp_partners') === '1') setUnlocked(true);
  }, []);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim() === PARTNERS_CODE) {
      sessionStorage.setItem('vp_partners', '1');
      setUnlocked(true);
    } else {
      setError('Code invalide.');
      setCode('');
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl border border-ink-200/60 shadow-card p-8 sm:p-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-ink-100 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-ink-700" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 mt-5">
            Espace partenaires
          </h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed">
            Vitrine privée. Code d'accès requis pour consulter les emplacements sponsors.
          </p>

          <form onSubmit={handle} className="mt-7 flex flex-col gap-3 text-left">
            <Field label="Code d'accès" required>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Saisissez votre code"
                autoFocus
              />
            </Field>
            {error && (
              <p className="text-xs text-reunion-red text-center">{error}</p>
            )}
            <Button type="submit" className="mt-2">
              <ShieldCheck className="w-4 h-4" />
              Accéder à l'espace
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return <PartnersContent />;
}

function PartnersContent() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<Tournament[]>([]);
  const [dayOpen, setDayOpen] = useState(false);

  const [sponsorOpen, setSponsorOpen] = useState(false);
  const [activeSponsor, setActiveSponsor] = useState<Sponsor | null>(null);

  useEffect(() => {
    (async () => {
      const [tRes, sRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('date'),
        supabase.from('sponsors').select('*').order('display_order'),
      ]);
      setTournaments(tRes.data ?? []);
      setSponsors(sRes.data ?? []);
      setLoading(false);
    })();
  }, []);

  const gold = sponsors.filter((s) => s.category === 'gold');
  const silver = sponsors.filter((s) => s.category === 'silver');
  const bronze = sponsors.filter((s) => s.category === 'bronze');

  const openSponsor = (s: Sponsor) => {
    setActiveSponsor(s);
    setSponsorOpen(true);
  };

  const handleDay = (date: Date, events: Tournament[]) => {
    if (events.length === 1) {
      window.location.href = `/tournoi/${events[0].id}`;
      return;
    }
    setSelectedDate(date);
    setSelectedEvents(events);
    setDayOpen(true);
  };

  const upcoming = tournaments
    .filter((t) => new Date(t.date) >= new Date(new Date().toDateString()))
    .slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header partenaires */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 sm:mb-10 text-center"
      >
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Vitrine partenaires
        </div>
        <h1 className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-ink-900">
          Visibilité premium sur Volley Péi
        </h1>
        <p className="mt-3 text-base text-ink-500 max-w-xl mx-auto leading-relaxed">
          Prévisualisation des emplacements sponsors disponibles sur le calendrier public.
        </p>
      </motion.div>

      {/* GOLD au-dessus du calendrier */}
      <section className="mb-6 sm:mb-8">
        <SectionLabel tier="gold" count={1} />
        <div className="mt-3">
          <SponsorSlot
            tier="gold"
            sponsor={gold[0]}
            showPlaceholder
            onClick={() => gold[0] && openSponsor(gold[0])}
          />
        </div>
      </section>

      {/* Trackers + calendrier */}
      <section className="mb-8">
        <StatsTrackers />
      </section>

      <section className="mb-8 sm:mb-10">
        {loading ? (
          <div className="aspect-[16/10] bg-white rounded-3xl border border-ink-200/60 animate-pulse" />
        ) : (
          <Calendar tournaments={tournaments} onDayClick={handleDay} />
        )}
      </section>

      {/* SILVER sous le calendrier (6 emplacements) */}
      <section className="mb-10 sm:mb-12">
        <SectionLabel tier="silver" count={6} />
        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SponsorSlot
              key={i}
              tier="silver"
              sponsor={silver[i]}
              showPlaceholder
              index={i}
              onClick={() => silver[i] && openSponsor(silver[i])}
            />
          ))}
        </div>
      </section>

      {/* Prochains tournois */}
      <section className="mb-10 sm:mb-12">
        <h2 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 mb-6">
          Prochains tournois
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {upcoming.map((t, i) => (
            <TournamentCard key={t.id} tournament={t} index={i} />
          ))}
        </div>
      </section>

      {/* BRONZE tout en bas (8 emplacements) */}
      <section>
        <SectionLabel tier="bronze" count={8} />
        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SponsorSlot
              key={i}
              tier="bronze"
              sponsor={bronze[i]}
              showPlaceholder
              index={i}
              onClick={() => bronze[i] && openSponsor(bronze[i])}
            />
          ))}
        </div>
      </section>

      <DayEventsModal
        open={dayOpen}
        onClose={() => setDayOpen(false)}
        date={selectedDate}
        tournaments={selectedEvents}
      />
      <SponsorModal
        open={sponsorOpen}
        onClose={() => setSponsorOpen(false)}
        sponsor={activeSponsor}
      />
    </div>
  );
}

function SectionLabel({ tier, count }: { tier: 'gold' | 'silver' | 'bronze'; count: number }) {
  const labels = {
    gold: { name: 'Gold', desc: 'Emplacement principal en tête de page' },
    silver: { name: 'Silver', desc: 'Emplacements visibles sous le calendrier' },
    bronze: { name: 'Bronze', desc: 'Emplacements de pied de page' },
  };
  const l = labels[tier];
  return (
    <div className="flex items-end justify-between">
      <div>
        <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink-400">
          Catégorie · {l.name}
        </span>
        <p className="text-sm text-ink-600 mt-1">{l.desc}</p>
      </div>
      <span className="text-xs text-ink-400">
        {count} emplacement{count > 1 ? 's' : ''}
      </span>
    </div>
  );
}
