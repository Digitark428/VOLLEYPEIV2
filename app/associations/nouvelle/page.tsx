import AuthNotice from '@/components/auth/AuthNotice';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import { requireIdentity } from '@/lib/auth';
import { createAssociation } from '../actions';

export default async function NewAssociationPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const [, params] = await Promise.all([requireIdentity('/connexion?retour=/associations/nouvelle'), searchParams]);
  return (
    <section className="px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-reunion-blue">Association</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Rejoindre VolleyPéi</h1>
        <p className="mt-3 text-sm leading-6 text-ink-500">Seuls le nom, l’e-mail officiel et la certification sont obligatoires. Tout le reste peut être complété plus tard.</p>
        <form action={createAssociation} className="mt-8 space-y-5 rounded-3xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
          <AuthNotice error={params.erreur} />
          <div><p className="mb-2 text-sm font-medium">Logo</p><OptimizedMediaPicker usage="logo" inputName="logo_media_id" /></div>
          <label className="block text-sm font-medium">Nom de l’association <span className="text-red-600">* obligatoire</span><input name="name" required minLength={2} className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
          <label className="block text-sm font-medium">Présentation<textarea name="description" rows={5} maxLength={3000} className="mt-2 w-full resize-none rounded-xl border border-ink-200 px-4 py-3" /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">E-mail officiel <span className="text-red-600">* obligatoire</span><input name="email" type="email" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Téléphone<input name="phone" type="tel" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Adresse<input name="address" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Commune<input name="city" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">N° d’identification<input name="registration_number" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Site web<input name="website" type="url" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Instagram<input name="instagram_url" type="url" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
            <label className="text-sm font-medium">Facebook<input name="facebook_url" type="url" className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" /></label>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-ink-50 p-4 text-sm text-ink-700"><input name="certification" type="checkbox" required className="mt-0.5" /><span>Je certifie être autorisé à représenter cette association et que les informations sont exactes.</span></label>
          <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white">Envoyer pour validation</button>
        </form>
      </div>
    </section>
  );
}
