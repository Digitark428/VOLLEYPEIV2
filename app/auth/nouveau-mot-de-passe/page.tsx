import AuthNotice from '@/components/auth/AuthNotice';
import AuthShell from '@/components/auth/AuthShell';
import { updatePassword } from '@/app/auth/actions';

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell eyebrow="Sécurité" title="Nouveau mot de passe" description="Choisis un nouveau mot de passe pour ton compte VolleyPéi.">
      <AuthNotice error={params.erreur} />
      <form action={updatePassword} className="space-y-4">
        <input name="password" type="password" minLength={8} autoComplete="new-password" required placeholder="Nouveau mot de passe" className="w-full rounded-xl border border-ink-200 px-4 py-3" />
        <input name="password_confirmation" type="password" minLength={8} autoComplete="new-password" required placeholder="Confirmer le mot de passe" className="w-full rounded-xl border border-ink-200 px-4 py-3" />
        <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white">Mettre à jour</button>
      </form>
    </AuthShell>
  );
}
