import type { ReactNode } from 'react';

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="px-4 py-12 sm:py-20">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">{eyebrow}</p>
          <h1 className="font-display text-3xl font-semibold text-ink-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500">{description}</p>
        </div>
        <div className="rounded-3xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>}
        <p className="mt-8 text-center text-xs text-ink-400">En continuant, tu acceptes les règles de la communauté VolleyPéi.</p>
      </div>
    </section>
  );
}
