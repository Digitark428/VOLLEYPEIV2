'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VisitTracker() {
  useEffect(() => {
    // Pour éviter de spammer : 1 visite par 30 min par onglet
    const last = sessionStorage.getItem('vp_last_visit');
    const now = Date.now();
    if (last && now - parseInt(last, 10) < 30 * 60 * 1000) return;
    sessionStorage.setItem('vp_last_visit', String(now));

    supabase.from('visits').insert({}).then(() => {
      /* silent */
    });
  }, []);

  return null;
}
