import AdminNav from './AdminNav';

export default function AdminPageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <><p className="text-xs font-semibold uppercase tracking-[0.18em] text-reunion-blue">{eyebrow}</p><h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{title}</h1><p className="mt-2 text-sm leading-6 text-ink-500">{description}</p><AdminNav /></>;
}
