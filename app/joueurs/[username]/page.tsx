import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Trophy, MapPin, Volleyball } from 'lucide-react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

type Participation = {
  joined_at: string;
  result_position: number | null;
  result_label: string | null;
  tournaments: { id: string; name: string; date: string; city: string } | { id: string; name: string; date: string; city: string }[] | null;
};

export default async function PublicPlayerPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, first_name, last_name, show_real_name, avatar_path, club_name, bio, experience_summary, disciplines')
    .ilike('username', username)
    .maybeSingle();
  if (!profile) notFound();

  const { data } = await supabase
    .from('tournament_participants')
    .select('result_position, result_label, joined_at, tournaments(id, name, date, city)')
    .eq('profile_id', profile.id)
    .order('joined_at', { ascending: false })
    .limit(20);
  const participations = (data ?? []) as Participation[];
  const publicName = profile.show_real_name && (profile.first_name || profile.last_name)
    ? [profile.first_name, profile.last_name].filter(Boolean).join(' ')
    : `@${profile.username}`;

  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="rounded-3xl bg-ink-950 p-8 text-white sm:p-12">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl bg-white/10 text-3xl font-semibold">{profile.avatar_path ? <Image src={supabase.storage.from('media-public').getPublicUrl(profile.avatar_path).data.publicUrl} alt={`Photo de ${publicName}`} fill sizes="80px" className="object-cover" /> : profile.username.slice(0, 1).toUpperCase()}</div>
          <h1 className="mt-6 font-display text-4xl font-semibold sm:text-5xl">{publicName}</h1>
          {publicName !== `@${profile.username}` && <p className="mt-2 text-white/50">@{profile.username}</p>}
          {profile.club_name && <p className="mt-4 inline-flex items-center gap-2 text-sm text-white/70"><MapPin className="h-4 w-4" /> {profile.club_name}</p>}
          {profile.bio && <p className="mt-6 max-w-2xl leading-7 text-white/75">{profile.bio}</p>}
          <div className="mt-6 flex flex-wrap gap-2">{(profile.disciplines ?? []).map((item: string) => <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{item}</span>)}</div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
          <aside className="rounded-2xl border border-ink-200 bg-white p-6">
            <Trophy className="h-5 w-5" />
            <h2 className="mt-4 font-display text-xl font-semibold">Expérience</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink-500">{profile.experience_summary ?? 'Pas encore renseignée.'}</p>
          </aside>
          <div className="rounded-2xl border border-ink-200 bg-white p-6">
            <div className="flex items-center gap-2"><Volleyball className="h-5 w-5" /><h2 className="font-display text-xl font-semibold">Mes tournois</h2></div>
            <div className="mt-5 space-y-3">
              {participations.length ? participations.map((participation) => {
                const tournament = Array.isArray(participation.tournaments) ? participation.tournaments[0] : participation.tournaments;
                return (
                  <div key={`${tournament?.id}-${participation.joined_at}`} className="rounded-xl bg-ink-50 p-4">
                    <p className="font-medium">{tournament?.name}</p>
                    <p className="mt-1 text-xs text-ink-500">{tournament?.date} · {tournament?.city}</p>
                    {(participation.result_position || participation.result_label) && <p className="mt-2 text-sm font-medium">{participation.result_label ?? `${participation.result_position}e place`}</p>}
                  </div>
                );
              }) : <p className="text-sm text-ink-500">Aucune participation enregistrée pour le moment.</p>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
