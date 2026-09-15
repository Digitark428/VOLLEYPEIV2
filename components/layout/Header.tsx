'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, Map, Menu, Newspaper, Search, UserRound, X } from 'lucide-react';
import { signOut } from '@/app/auth/actions';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import { classNames } from '@/lib/utils';
import Logo from './Logo';

type Identity = { username: string; avatarPath: string | null; isAdmin: boolean };

const primaryNav = [
  { href: '/actualite', label: 'Feed', icon: Newspaper },
  { href: '/', label: 'Calendrier', icon: CalendarDays },
  { href: '/recherche', label: 'Recherche', icon: Search },
  { href: '/carte', label: 'Carte', icon: Map },
  { href: '/profil', label: 'Profil', icon: UserRound },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header({ identity, unreadNotifications = 0 }: { identity: Identity | null; unreadNotifications?: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={classNames('sticky top-0 z-50 border-b transition-all duration-300', scrolled ? 'border-ink-200/70 bg-white/90 shadow-soft backdrop-blur-xl' : 'border-ink-200/40 bg-white/75 backdrop-blur-xl')}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={identity ? '/actualite' : '/connexion'} className="flex items-center gap-2.5" aria-label="VolleyPéi">
            <Logo />
            <span className="hidden text-[10px] uppercase tracking-[0.15em] text-ink-400 sm:block">Communauté 974</span>
          </Link>

          {identity ? (
            <>
              <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation principale">
                {primaryNav.slice(0, 4).map((item) => {
                  const active = isActive(pathname, item.href);
                  return <Link key={item.href} href={item.href} className={classNames('relative rounded-full px-4 py-2 text-sm font-medium transition', active ? 'bg-ink-950 text-white' : 'text-ink-500 hover:bg-ink-100 hover:text-ink-950')}>{item.label}</Link>;
                })}
              </nav>
              <div className="flex items-center gap-1.5">
                <Link href="/notifications" className={classNames('relative rounded-full p-2.5 transition hover:bg-ink-100', isActive(pathname, '/notifications') ? 'bg-ink-950 text-white' : 'text-ink-600')} aria-label={`${unreadNotifications} notification(s) non lue(s)`}>
                  <Bell className="h-5 w-5" />
                  {unreadNotifications > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-reunion-red px-1 text-center text-[10px] font-bold leading-5 text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
                </Link>
                <Link href="/profil" className="hidden items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm font-medium hover:bg-ink-100 sm:flex"><ProfileAvatar username={identity.username} avatarPath={identity.avatarPath} size="sm" />@{identity.username}</Link>
                <button onClick={() => setOpen((value) => !value)} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-ink-100" aria-label="Menu secondaire" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/connexion" className="rounded-xl px-3 py-2 text-sm font-semibold text-ink-700">Se connecter</Link>
              <Link href="/inscription" className="rounded-xl bg-ink-950 px-3 py-2 text-sm font-semibold text-white">Créer un compte</Link>
            </div>
          )}
        </div>
        <AnimatePresence>
          {identity && open && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="border-t border-ink-100 bg-white/95 backdrop-blur-xl">
              <div className="mx-auto grid max-w-7xl gap-1 px-4 py-4 text-sm sm:grid-cols-2 md:grid-cols-4 sm:px-6 lg:px-8">
                <Link href="/mon-association" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 hover:bg-ink-50">Mon association</Link>
                <Link href="/mes-tournois" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 hover:bg-ink-50">Mes tournois</Link>
                <Link href="/partenaires" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 hover:bg-ink-50">Partenaires</Link>
                {identity.isAdmin && <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 font-semibold text-reunion-blue hover:bg-blue-50">Administration</Link>}
                <form action={signOut} className="sm:col-span-2 md:col-span-4"><button className="w-full rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50">Se déconnecter</button></form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {identity && (
        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-ink-200/80 bg-white/95 px-2 pb-[max(env(safe-area-inset-bottom),0.35rem)] pt-1.5 shadow-[0_-8px_28px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden" aria-label="Navigation mobile">
          <div className="mx-auto grid max-w-md grid-cols-5">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return <Link key={item.href} href={item.href} className={classNames('relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition', active ? 'text-ink-950' : 'text-ink-400')}><Icon className={classNames('h-5 w-5', active ? 'stroke-[2.5]' : '')} /><span>{item.label}</span>{active && <span className="absolute bottom-0 h-1 w-5 rounded-full bg-reunion-blue" />}</Link>;
            })}
          </div>
        </nav>
      )}
    </>
  );
}
