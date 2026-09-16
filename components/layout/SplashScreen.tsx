'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/layout/Logo';

export default function SplashScreen() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Affiché 1 seule fois par session pour ne pas gêner
    if (sessionStorage.getItem('vp_splash_done') === '1') {
      const frame = requestAnimationFrame(() => setShow(false));
      return () => cancelAnimationFrame(frame);
    }
    const t = setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('vp_splash_done', '1');
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col items-center gap-5"
          >
            <Logo variant="splash" />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-center"
            >
              <p className="text-sm text-ink-500 tracking-wide">
                Le volley à La Réunion · 974
              </p>
            </motion.div>

            {/* Ligne de progression discrète */}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 80 }}
              transition={{ delay: 0.4, duration: 1.6, ease: 'easeInOut' }}
              className="mt-2 h-px bg-gradient-to-r from-reunion-blue via-reunion-yellow to-reunion-red"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
