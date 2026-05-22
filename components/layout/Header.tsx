'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ShieldCheck } from 'lucide-react';
import Logo from './Logo';
import { classNames } from '@/lib/utils';

const nav = [
  { href: '/', label: 'Calendrier' },
  { href: '/carte', label: 'Carte' },
  { href: '/partenaires', label: 'Partenaires' },
];

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={classNames(
        'sticky top-0 z-50 transition-all duration-500',
        scrolled
          ? 'bg-white/75 backdrop-blur-xl border-b border-ink-200/60 shadow-soft'
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-[72px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="transition-transform duration-500 group-hover:scale-105">
              <Logo />
            </div>
            <span className="hidden sm:block text-[10px] text-ink-400 tracking-[0.15em] uppercase">
              Calendrier 974
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href === '/' && pathname === '/calendrier');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    'relative px-4 py-2 text-sm font-medium transition-colors rounded-full',
                    active
                      ? 'text-ink-900'
                      : 'text-ink-500 hover:text-ink-900'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-ink-100 rounded-full -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Admin desktop */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-700 transition-colors px-3 py-2 rounded-full hover:bg-ink-100"
              aria-label="Admin"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </Link>
          </div>

          {/* Burger mobile */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden w-10 h-10 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors"
            aria-label="Menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="md:hidden border-t border-ink-200/60 bg-white/95 backdrop-blur-xl"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              {nav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={classNames(
                      'px-4 py-3 rounded-xl text-[15px] font-medium transition-colors',
                      active ? 'bg-ink-100 text-ink-900' : 'text-ink-600 hover:bg-ink-50'
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/admin"
                className="px-4 py-3 rounded-xl text-[15px] font-medium text-ink-400 hover:bg-ink-50 flex items-center gap-2 mt-2 border-t border-ink-200/60 pt-4"
              >
                <ShieldCheck className="w-4 h-4" />
                Espace admin
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
