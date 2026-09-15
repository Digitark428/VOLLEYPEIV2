'use client';

import { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { signUp } from '@/app/auth/actions';

const fieldClass = 'mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-ink-500';

function ageFromDate(value: string) {
  if (!value) return null;
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age;
}

export default function SignUpForm() {
  const [birthDate, setBirthDate] = useState('');
  const age = useMemo(() => ageFromDate(birthDate), [birthDate]);
  const isMinor = age !== null && age < 18;

  return (
    <form action={signUp} className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-ink-800">Type de compte</legend>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="cursor-pointer rounded-2xl border border-ink-200 p-3 text-center text-sm has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950 has-[:checked]:text-white">
            <input name="account_type" type="radio" value="player" defaultChecked className="sr-only" />Joueur
          </label>
          <label className="cursor-pointer rounded-2xl border border-ink-200 p-3 text-center text-sm has-[:checked]:border-ink-950 has-[:checked]:bg-ink-950 has-[:checked]:text-white">
            <input name="account_type" type="radio" value="association" className="sr-only" />Responsable d’association
          </label>
        </div>
        <p className="mt-2 text-xs leading-5 text-ink-400">Le responsable garde un profil personnel et pourra ensuite créer ou rejoindre une association distincte.</p>
      </fieldset>

      <label className="block text-sm font-medium text-ink-800">Pseudo
        <input name="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9._-]+" autoComplete="username" required className={fieldClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink-800">Prénom<input name="first_name" minLength={2} maxLength={100} autoComplete="given-name" required className={fieldClass} /></label>
        <label className="block text-sm font-medium text-ink-800">Nom<input name="last_name" minLength={2} maxLength={100} autoComplete="family-name" required className={fieldClass} /></label>
      </div>
      <label className="block text-sm font-medium text-ink-800">Date de naissance
        <input name="birth_date" type="date" required value={birthDate} onChange={(event) => setBirthDate(event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-ink-800">Ville de résidence
        <input name="city" minLength={2} maxLength={100} autoComplete="address-level2" required className={fieldClass} />
      </label>

      {isMinor && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4" aria-live="polite">
          <div className="flex items-center gap-2 text-amber-950"><ShieldCheck className="h-5 w-5" /><h2 className="font-semibold">Responsable légal obligatoire</h2></div>
          <p className="mt-2 text-xs leading-5 text-amber-900">Dans le cadre de la sécurité des mineurs, le responsable légal renseigné pourra être contacté afin de confirmer son autorisation si nécessaire.</p>
          <div className="mt-4 space-y-4">
            <label className="block text-sm font-medium text-amber-950">Nom et prénom du responsable<input name="guardian_full_name" required={isMinor} autoComplete="name" className={fieldClass} /></label>
            <label className="block text-sm font-medium text-amber-950">E-mail du responsable<input name="guardian_email" type="email" required={isMinor} autoComplete="email" className={fieldClass} /></label>
          </div>
        </section>
      )}

      <label className="block text-sm font-medium text-ink-800">Adresse e-mail
        <input name="email" type="email" autoComplete="email" required className={fieldClass} />
      </label>
      <label className="block text-sm font-medium text-ink-800">Mot de passe
        <input name="password" type="password" minLength={8} autoComplete="new-password" required className={fieldClass} />
        <span className="mt-1 block text-xs text-ink-400">8 caractères minimum, avec au moins une lettre et un chiffre.</span>
      </label>
      <button className="w-full rounded-xl bg-ink-950 px-5 py-3.5 font-medium text-white transition hover:bg-ink-800">Créer mon compte</button>
    </form>
  );
}
