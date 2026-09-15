import AuthNotice from '@/components/auth/AuthNotice';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import { requireIdentity } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { updateProfile } from '../actions';

export default async function CompleteProfilePage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const [identity, params] = await Promise.all([requireIdentity(), searchParams]);
  const supabase = await createServerSupabaseClient();
  const { data: privateProfile } = await supabase
    .from('profile_private')
    .select('birth_date, guardian_full_name, guardian_email, guardian_consent')
    .eq('user_id', identity.id)
    .maybeSingle();
  const profile = identity.profile;

  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">Profil joueur</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Présente-toi à la communauté</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">Tu choisis si ton nom réel est visible. Ton pseudo reste toujours l’identité principale sur VolleyPéi.</p>
        <div className="mt-8 rounded-3xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <AuthNotice error={params.erreur} />
          <form action={updateProfile} className="space-y-6">
            <div><p className="mb-2 text-sm font-medium">Photo de profil</p><OptimizedMediaPicker usage="avatar" inputName="avatar_media_id" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Pseudo<input name="username" defaultValue={profile?.username ?? ''} required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
              <label className="text-sm font-medium">Date de naissance<input name="birth_date" type="date" defaultValue={privateProfile?.birth_date ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
              <label className="text-sm font-medium">Prénom<input name="first_name" defaultValue={profile?.first_name ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
              <label className="text-sm font-medium">Nom<input name="last_name" defaultValue={profile?.last_name ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            </div>
            <label className="flex items-start gap-3 rounded-xl bg-ink-50 p-4 text-sm text-ink-700">
              <input name="show_real_name" type="checkbox" defaultChecked={profile?.show_real_name} className="mt-0.5" />
              Afficher mon prénom et mon nom sur mon profil public.
            </label>
            <label className="block text-sm font-medium">Club actuel<input name="club_name" defaultValue={profile?.club_name ?? ''} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="block text-sm font-medium">Bio<textarea name="bio" defaultValue={profile?.bio ?? ''} maxLength={1000} rows={4} className="mt-2 w-full resize-none rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="block text-sm font-medium">Expérience et palmarès<textarea name="experience_summary" defaultValue={profile?.experience_summary ?? ''} maxLength={2000} rows={4} className="mt-2 w-full resize-none rounded-xl border border-ink-200 px-4 py-3" /></label>
            <fieldset>
              <legend className="text-sm font-medium">Disciplines pratiquées</legend>
              <div className="mt-3 flex flex-wrap gap-3">
                {['beach', 'indoor', 'green'].map((item) => <label key={item} className="rounded-full border border-ink-200 px-4 py-2 text-sm"><input name="disciplines" value={item} type="checkbox" defaultChecked={profile?.disciplines?.includes(item)} className="mr-2" />{item === 'beach' ? 'Beach volley' : item === 'indoor' ? 'Volley indoor' : 'Green volley'}</label>)}
              </div>
            </fieldset>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="font-semibold text-amber-950">Pour les joueurs mineurs</h2>
              <p className="mt-1 text-xs leading-5 text-amber-800">Si tu as moins de 18 ans, les informations d’un parent ou responsable majeur sont obligatoires et devront être confirmées.</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Nom du responsable<input name="guardian_full_name" defaultValue={privateProfile?.guardian_full_name ?? ''} className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3" /></label>
                <label className="text-sm font-medium">E-mail du responsable<input name="guardian_email" type="email" defaultValue={privateProfile?.guardian_email ?? ''} className="mt-2 w-full rounded-xl border border-amber-200 bg-white px-4 py-3" /></label>
              </div>
              {privateProfile?.guardian_consent === 'pending' && <p className="mt-3 text-xs font-medium text-amber-900">Confirmation parentale en attente.</p>}
            </div>
            <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white">Enregistrer mon profil</button>
          </form>
        </div>
      </div>
    </section>
  );
}
