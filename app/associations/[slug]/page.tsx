import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function AssociationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: association } = await supabase
    .from('associations')
    .select('id, name, description, address, city, email, phone, website, instagram_url, facebook_url, logo_path')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  if (!association) notFound();

  const [{ data: tournaments }, { count: members }] = await Promise.all([
    supabase.from('tournaments').select('id, name, date, city, type, poster_url').eq('association_id', association.id).eq('status', 'published').order('date').limit(12),
    supabase.from('association_members').select('id', { count: 'exact', head: true }).eq('association_id', association.id).eq('status', 'active'),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (tournaments ?? []).filter((tournament) => tournament.date >= today);
  const past = (tournaments ?? []).filter((tournament) => tournament.date < today).reverse();

  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-3xl bg-ink-950 p-8 text-white sm:p-12">
          {association.logo_path && <div className="relative mb-6 h-20 w-20 overflow-hidden rounded-2xl bg-white"><Image src={supabase.storage.from('media-public').getPublicUrl(association.logo_path).data.publicUrl} alt={`Logo de ${association.name}`} fill sizes="80px" className="object-contain p-1" /></div>}
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Association approuvée</p>
          <h1 className="mt-4 font-display text-4xl font-semibold sm:text-5xl">{association.name}</h1>
          {association.city && <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/65"><MapPin className="h-4 w-4" /> {association.city}</p>}
          {association.description && <p className="mt-6 max-w-3xl leading-7 text-white/75">{association.description}</p>}
          <div className="mt-6 flex flex-wrap gap-3 text-xs text-white/60"><span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><UsersRound className="h-4 w-4" /> {members ?? 0} gestionnaire(s)</span>{association.website && <a href={association.website} target="_blank" rel="noreferrer" className="rounded-full bg-white/10 px-3 py-2">Site web</a>}</div>
        </div>
        <TournamentSection title="Prochains tournois" tournaments={upcoming} empty="Aucun tournoi annoncé." />
        <TournamentSection title="Archives" tournaments={past} empty="Aucun tournoi passé." />
      </div>
    </section>
  );
}

function TournamentSection({ title, tournaments, empty }: { title: string; tournaments: { id: string; name: string; date: string; city: string; type: string }[]; empty: string }) {
  return <div className="mt-10"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5" /><h2 className="font-display text-2xl font-semibold">{title}</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tournaments.length ? tournaments.map((tournament) => <Link key={tournament.id} href={`/tournoi/${tournament.id}`} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition hover:shadow-card"><p className="font-semibold">{tournament.name}</p><p className="mt-2 text-xs text-ink-500">{tournament.date} · {tournament.city}</p><p className="mt-3 text-xs font-medium text-reunion-blue">{tournament.type}</p></Link>) : <p className="text-sm text-ink-500">{empty}</p>}</div></div>;
}
