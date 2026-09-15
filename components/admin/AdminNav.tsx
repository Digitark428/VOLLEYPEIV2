import Link from 'next/link';

const links = [
  ['Vue générale', '/admin'],
  ['Utilisateurs', '/admin/utilisateurs'],
  ['Associations', '/admin/associations'],
  ['Tournois', '/admin/tournois'],
  ['Modération', '/admin/moderation'],
  ['Inscriptions', '/admin/inscriptions'],
  ['Statistiques', '/admin/statistiques'],
] as const;

export default function AdminNav() {
  return <nav className="mt-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide" aria-label="Administration VolleyPéi">{links.map(([label, href]) => <Link key={href} href={href} className="whitespace-nowrap rounded-full border border-ink-200 bg-white px-4 py-2 text-xs font-semibold text-ink-600 hover:border-ink-400">{label}</Link>)}</nav>;
}
