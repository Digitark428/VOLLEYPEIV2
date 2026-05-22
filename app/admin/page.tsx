'use client';

import { useEffect, useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogOut, Calendar as CalIcon, Award } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Input';
import AdminTournaments from '@/components/admin/AdminTournaments';
import AdminSponsors from '@/components/admin/AdminSponsors';
import { classNames } from '@/lib/utils';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin974';

type Tab = 'tournaments' | 'sponsors';

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pwd, setPwd] = useState('');
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('tournaments');

  useEffect(() => {
    if (sessionStorage.getItem('vp_admin') === '1') setUnlocked(true);
  }, []);

  const handle = (e: FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      sessionStorage.setItem('vp_admin', '1');
      setUnlocked(true);
    } else {
      setError('Mot de passe incorrect.');
      setPwd('');
    }
  };

  const logout = () => {
    sessionStorage.removeItem('vp_admin');
    setUnlocked(false);
    setPwd('');
  };

  if (!unlocked) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl border border-ink-200/60 shadow-card p-8 sm:p-10"
        >
          <div className="w-14 h-14 rounded-2xl bg-ink-950 mx-auto flex items-center justify-center">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900 mt-5 text-center">
            Espace administrateur
          </h1>
          <p className="mt-2 text-sm text-ink-500 leading-relaxed text-center">
            Authentification requise.
          </p>

          <form onSubmit={handle} className="mt-7 flex flex-col gap-3">
            <Field label="Mot de passe" required>
              <Input
                type="password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                autoFocus
                placeholder="••••••••"
              />
            </Field>
            {error && (
              <p className="text-xs text-reunion-red text-center">{error}</p>
            )}
            <Button type="submit" className="mt-2">
              Se connecter
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header admin */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-ink-400">
            Administration
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 mt-1">
            Tableau de bord
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={logout}>
          <LogOut className="w-3.5 h-3.5" />
          Déconnexion
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-ink-100 rounded-2xl w-fit mb-6">
        {([
          { id: 'tournaments', label: 'Tournois', icon: CalIcon },
          { id: 'sponsors', label: 'Sponsors', icon: Award },
        ] as { id: Tab; label: string; icon: any }[]).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={classNames(
                'relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                active ? 'text-ink-900' : 'text-ink-500 hover:text-ink-900'
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-tab"
                  className="absolute inset-0 bg-white rounded-xl shadow-soft -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {tab === 'tournaments' ? <AdminTournaments /> : <AdminSponsors />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
