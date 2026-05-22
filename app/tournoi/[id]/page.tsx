'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Phone,
  Mail,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { supabase, type Tournament } from '@/lib/supabase';
import TypeBadge from '@/components/ui/TypeBadge';
import Button from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/utils';

export default function TournamentDetail() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [t, setT] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('tournaments').select('*').eq('id', id).single();
      setT(data);
      setLoading(false);
    })();
  }, [id]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: t?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Lien copié');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 bg-white rounded-3xl border border-ink-200/60 animate-pulse" />
      </div>
    );
  }

  if (!t) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-display text-3xl font-semibold">Tournoi introuvable</h1>
        <Button onClick={() => router.push('/')} className="mt-6">
          <ArrowLeft className="w-4 h-4" />
          Retour au calendrier
        </Button>
      </div>
    );
  }

  const infoBlocks = [
    { icon: Calendar, label: 'Date', value: formatDate(t.date) },
    { icon: Clock, label: 'Heure', value: formatTime(t.time) },
    { icon: MapPin, label: 'Ville', value: t.city },
    { icon: Users, label: 'Équipes max', value: `${t.players_count} équipes` },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900 mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        Retour
      </motion.button>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_1.4fr] gap-6 lg:gap-10">
        {/* Affiche */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="md:sticky md:top-24 self-start"
        >
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-ink-100 shadow-lift">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={t.poster_url} alt={t.name} className="w-full h-full object-cover" />
          </div>
        </motion.div>

        {/* Infos */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-6"
        >
          <div>
            <TypeBadge type={t.type} />
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-ink-900 mt-3 leading-tight">
              {t.name}
            </h1>
            <p className="mt-3 text-ink-500 text-[15px] leading-relaxed">{t.location}</p>
          </div>

          {/* Action */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={share}>
              <Share2 className="w-3.5 h-3.5" />
              Partager
            </Button>
          </div>

          {/* Grille infos */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {infoBlocks.map((b) => (
              <div
                key={b.label}
                className="bg-white rounded-2xl border border-ink-200/60 p-4 shadow-soft"
              >
                <div className="flex items-center gap-2 text-ink-400 text-xs font-medium uppercase tracking-wider">
                  <b.icon className="w-3.5 h-3.5" />
                  {b.label}
                </div>
                <div className="mt-1.5 text-ink-900 font-semibold text-[15px]">{b.value}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-ink-200/60 p-5 sm:p-6 shadow-soft">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900 mb-3">
              Description
            </h2>
            <p className="text-[15px] text-ink-600 leading-relaxed whitespace-pre-line">
              {t.description}
            </p>
          </div>

          {/* Contacts */}
          {(t.phone || t.email) && (
            <div className="bg-white rounded-2xl border border-ink-200/60 p-5 sm:p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900 mb-3">
                Contact
              </h2>
              <div className="space-y-2.5">
                {t.phone && (
                  <a
                    href={`tel:${t.phone}`}
                    className="flex items-center gap-3 text-[15px] text-ink-700 hover:text-ink-900 group"
                  >
                    <span className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center group-hover:bg-ink-200 transition-colors">
                      <Phone className="w-4 h-4" />
                    </span>
                    {t.phone}
                  </a>
                )}
                {t.email && (
                  <a
                    href={`mailto:${t.email}`}
                    className="flex items-center gap-3 text-[15px] text-ink-700 hover:text-ink-900 group"
                  >
                    <span className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center group-hover:bg-ink-200 transition-colors">
                      <Mail className="w-4 h-4" />
                    </span>
                    {t.email}
                  </a>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
