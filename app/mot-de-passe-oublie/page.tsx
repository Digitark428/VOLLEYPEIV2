import AuthShell from '@/components/auth/AuthShell';
import { requestPasswordReset } from '@/app/auth/actions';

export default function ForgotPasswordPage() {
  return (
    <AuthShell eyebrow="Accès au compte" title="Mot de passe oublié" description="Indique ton e-mail. Si le compte existe, tu recevras un lien sécurisé.">
      <form action={requestPasswordReset} className="space-y-4">
        <label className="block text-sm font-medium text-ink-800">
          Adresse e-mail
          <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-ink-200 px-4 py-3" />
        </label>
        <button className="w-full rounded-xl bg-ink-950 px-5 py-3 font-medium text-white">Envoyer le lien</button>
      </form>
    </AuthShell>
  );
}
