import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import SplashScreen from '@/components/layout/SplashScreen';
import VisitTracker from '@/components/layout/VisitTracker';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans min-h-screen flex flex-col">
        <SplashScreen />
        <VisitTracker />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
