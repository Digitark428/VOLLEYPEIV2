import Link from 'next/link';
import AuthNotice from '@/components/auth/AuthNotice';
import AuthShell from '@/components/auth/AuthShell';
import SignUpForm from '@/components/auth/SignUpForm';

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const params = await searchParams;
  return (
    <AuthShell
      eyebrow="Rejoins le terrain"
      title="Créer mon compte"
      description="Ton profil personnel te permet de participer, publier et rejoindre une association."
      footer={<>Déjà inscrit ? <Link href="/connexion" className="font-semibold text-ink-900">Se connecter</Link></>}
    >
      <AuthNotice error={params.erreur} />
      <SignUpForm />
    </AuthShell>
  );
}
