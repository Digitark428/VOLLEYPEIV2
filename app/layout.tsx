import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SplashScreen from '@/components/layout/SplashScreen';
import VisitTracker from '@/components/layout/VisitTracker';
import { getCurrentIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { signOut } from '@/app/auth/actions';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Volley Péi — Tous les tournois volley à La Réunion',
  description:
    'Volley Péi : le calendrier de référence pour tous les événements volley à La Réunion. Beach volley, indoor, green volley, tournois officiels LRVB et sparring.',
  keywords: ['volley', 'La Réunion', '974', 'tournoi', 'beach volley', 'LRVB'],
};

export const viewport: Viewport = {
  themeColor: '#FAFAFA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const identity = await getCurrentIdentity();
  const blocked = Boolean(identity && identity.profile?.status !== 'active');
  let unreadNotifications = 0;
  if (identity && !blocked) {
    const supabase = await createServerSupabaseClient();
    const { count } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('recipient_id', identity.id).is('read_at', null);
    unreadNotifications = count ?? 0;
  }
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <SplashScreen />
        {identity && !blocked && <VisitTracker />}
        <Header identity={identity && !blocked ? { username: identity.profile?.username ?? 'Profil', avatarPath: identity.profile?.avatar_path ?? null, isAdmin: identity.isAdmin } : null} unreadNotifications={unreadNotifications} />
        <main className={`flex-1 ${identity && !blocked ? 'pb-24 md:pb-0' : ''}`}>{blocked ? <section className="px-4 py-20 text-center"><div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-white p-8 shadow-card"><h1 className="font-display text-3xl font-semibold">Compte indisponible</h1><p className="mt-3 text-sm leading-6 text-ink-500">Ce compte est suspendu ou supprimé. Contacte l’équipe VolleyPéi si tu penses qu’il s’agit d’une erreur.</p><form action={signOut} className="mt-6"><button className="rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white">Se déconnecter</button></form></div></section> : children}</main>
        {identity && !blocked && <Footer />}
      </body>
    </html>
  );
}
