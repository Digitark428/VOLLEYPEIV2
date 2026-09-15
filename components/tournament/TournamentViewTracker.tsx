'use client';

import { useEffect } from 'react';
import { anonymousDailyHash } from '@/lib/analytics/client';
import { supabase } from '@/lib/supabase';

export default function TournamentViewTracker({ tournamentId }: { tournamentId: string }) {
  useEffect(() => {
    anonymousDailyHash(`tournament:${tournamentId}`)
      .then((hashedVisitor) => supabase.rpc('record_tournament_view', {
        target_tournament: tournamentId,
        hashed_visitor: hashedVisitor,
      }))
      .catch(() => undefined);
  }, [tournamentId]);

  return null;
}
