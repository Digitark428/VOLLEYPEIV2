import Link from 'next/link';
import AuthNotice from '@/components/auth/AuthNotice';
import AuthShell from '@/components/auth/AuthShell';
import { signIn } from '@/app/auth/actions';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; message?: string; retour?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Bienvenue"
      title="Se connecter"
      description="Retrouve tes tournois, ton équipe et toute la communauté volley réunionnaise."
      footer={<>Pas encore de compte ? <Link href="/inscription" className="font-semibold text-ink-900">Créer mon compte</Link></>}
    >
      <AuthNotice error={params.erreur} message={params.message} />
      <form action={signIn} className="space-y-4">
        <input type="hidden" name="return_to" value={params.retour ?? '/profil'} />
        <label className="block text-sm font-medium text-ink-800">
          Adresse e-mail
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 outline-none focus:border-ink-900" />
        </label>
        <label className="block text-sm font-medium text-ink-800">
          Mot de passe
          <input name="password" type="password" autoComplete="current-password" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3 outline-none focus:border-ink-900" />
        </label>
        <div className="flex justify-end">
          <Link href="/mot-de-passe-oublie" className="text-xs text-ink-500 hover:text-ink-900">Mot de passe oublié ?</Link>
        </div>
        <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white transition hover:bg-ink-800">Se connecter</button>
      </form>
    </AuthShell>
  );
}
