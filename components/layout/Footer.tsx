import Link from 'next/link';
import Logo from './Logo';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 sm:mt-24 border-t border-ink-200/60 bg-white/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9"><Logo /></div>
              <span className="font-display font-semibold text-base">
                Volley <span className="text-ink-500">Péi</span>
              </span>
            </div>
            <p className="text-sm text-ink-500 leading-relaxed max-w-xs">
              Le calendrier de référence pour tous les événements volley à La Réunion.
              Publication libre, vérification éditoriale.
            </p>
          </div>

          {/* Liens */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-medium text-ink-900 mb-2 tracking-tight">Navigation</h3>
            <Link href="/" className="text-ink-500 hover:text-ink-900 transition-colors w-fit">Calendrier</Link>
            <Link href="/carte" className="text-ink-500 hover:text-ink-900 transition-colors w-fit">Carte</Link>
            <Link href="/partenaires" className="text-ink-500 hover:text-ink-900 transition-colors w-fit">Partenaires</Link>
          </div>

          {/* Réunion */}
          <div className="flex flex-col gap-2 text-sm">
            <h3 className="font-medium text-ink-900 mb-2 tracking-tight">À propos</h3>
            <p className="text-ink-500 leading-relaxed">
              Conçu à La Réunion · 974<br />
              Pour la communauté volley péi.
            </p>
            <div className="flex gap-1.5 mt-2">
              <span className="w-6 h-1 rounded-full bg-reunion-blue" />
              <span className="w-6 h-1 rounded-full bg-reunion-yellow" />
              <span className="w-6 h-1 rounded-full bg-reunion-red" />
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-ink-200/60 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-400">
          <p>© {year} Volley Péi. Tous droits réservés.</p>
          <p>Données vérifiées par l'équipe éditoriale.</p>
        </div>
      </div>
    </footer>
  );
}
