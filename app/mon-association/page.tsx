import Link from 'next/link';
import { Building2, Clock3, ShieldCheck, Trophy } from 'lucide-react';
import AuthNotice from '@/components/auth/AuthNotice';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type AssociationMembership = {
  role: 'owner' | 'admin' | 'member';
  associations: AssociationSummary | AssociationSummary[] | null;
};

type AssociationSummary = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    city: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    review_note: string | null;
};

export default async function MyAssociationPage({ searchParams }: { searchParams: Promise<{ erreur?: string; message?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity('/connexion?retour=/mon-association'), searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('association_members')
    .select('role, associations(id, slug, name, description, city, status, review_note)')
    .eq('user_id', identity.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });
  const memberships = (data ?? []) as unknown as AssociationMembership[];

  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <AuthNotice error={params.erreur} message={params.message} />
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">Espace association</p><h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Mon association</h1></div>
          <Link href="/associations/nouvelle" className="rounded-xl bg-ink-950 px-5 py-3 text-center text-sm font-medium text-white">Déposer une demande</Link>
        </div>

        <div className="mt-8 grid gap-5">
          {memberships.length ? memberships.map(({ role, associations }) => {
            const association = Array.isArray(associations) ? associations[0] : associations;
            return association ? (
            <article key={association.id} className="rounded-3xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                <div>
                  <div className="flex items-center gap-3"><Building2 className="h-6 w-6" /><h2 className="font-display text-2xl font-semibold">{association.name}</h2></div>
                  <p className="mt-2 text-sm text-ink-500">{association.city ?? 'La Réunion'} · rôle {role}</p>
                </div>
                <StatusBadge status={association.status} />
              </div>
              {association.description && <p className="mt-5 max-w-2xl text-sm leading-6 text-ink-600">{association.description}</p>}
              {association.review_note && <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">Message VolleyPéi : {association.review_note}</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                {role !== 'member' && <Link href={`/mon-association/${association.id}/modifier`} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium">Modifier l’association</Link>}
                {association.status === 'approved' ? <><Link href={`/associations/${association.slug}`} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium">Voir la page publique</Link>{role !== 'member' && <Link href={`/mon-association/${association.id}/membres`} className="rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-medium">Gérer les membres</Link>}<Link href="/mes-tournois" className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-medium text-white"><Trophy className="h-4 w-4" /> Mes tournois</Link></> : <span className="inline-flex items-center gap-2 text-sm text-ink-500"><Clock3 className="h-4 w-4" /> La création de tournoi sera activée après validation.</span>}
              </div>
            </article>
          ) : null;
          }) : (
            <div className="rounded-3xl border border-dashed border-ink-300 bg-white p-10 text-center"><Building2 className="mx-auto h-9 w-9 text-ink-300" /><h2 className="mt-4 font-display text-xl font-semibold">Aucune association liée</h2><p className="mt-2 text-sm text-ink-500">Dépose une fiche complète pour démarrer la validation.</p></div>
          )}
        </div>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: AssociationSummary['status'] }) {
  const labels = { pending: 'En attente', approved: 'Approuvée', rejected: 'À corriger', suspended: 'Suspendue' } as const;
  const approved = status === 'approved';
  return <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${approved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{approved && <ShieldCheck className="h-4 w-4" />}{labels[status]}</span>;
}
