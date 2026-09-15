'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { anonymousDailyHash } from '@/lib/analytics/client';

export default function VisitTracker() {
  useEffect(() => {
    // Une page vue au maximum toutes les 30 minutes par onglet. Le visiteur
    // unique reste dédupliqué pour la journée dans Supabase.
    const last = sessionStorage.getItem('vp_last_visit');
    const now = Date.now();
    if (last && now - parseInt(last, 10) < 30 * 60 * 1000) return;
    sessionStorage.setItem('vp_last_visit', String(now));

    anonymousDailyHash('site').then((hashedVisitor) =>
      supabase.rpc('record_site_visit', { hashed_visitor: hashedVisitor })
    ).catch(() => undefined);
  }, []);

  return null;
}
