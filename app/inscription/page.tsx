import Link from 'next/link';
import AuthNotice from '@/components/auth/AuthNotice';
import AuthShell from '@/components/auth/AuthShell';
import { signUp } from '@/app/auth/actions';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Rejoins le terrain"
      title="Créer mon compte"
      description="Un seul compte pour participer, inscrire ton équipe, commenter et partager tes photos."
      footer={<>Déjà inscrit ? <Link href="/connexion" className="font-semibold text-ink-900">Se connecter</Link></>}
    >
      <AuthNotice error={params.erreur} />
      <form action={signUp} className="space-y-4">
        <label className="block text-sm font-medium text-ink-800">
          Je m’inscris comme
          <select name="account_type" className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3">
            <option value="player">Joueur / particulier</option>
            <option value="association">Responsable d’association</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Pseudo
          <input name="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9._-]+" autoComplete="username" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" />
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Adresse e-mail
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" />
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Mot de passe
          <input name="password" type="password" minLength={8} autoComplete="new-password" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" />
          <span className="mt-1 block text-xs text-ink-400">8 caractères minimum.</span>
        </label>
        <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white transition hover:bg-ink-800">Créer mon compte</button>
      </form>
    </AuthShell>
  );
}
