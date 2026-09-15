'use client';

import { useState } from 'react';
import { ChevronDown, UserRoundPlus } from 'lucide-react';

type Props = {
  tournamentId: string;
  action: (formData: FormData) => void | Promise<void>;
  defaultEmail?: string;
  defaultFirstName?: string;
  defaultLastName?: string;
};

export default function RegistrationForm({ tournamentId, action, defaultEmail = '', defaultFirstName = '', defaultLastName = '' }: Props) {
  const [players, setPlayers] = useState(2);
  const [minors, setMinors] = useState<boolean[]>(Array(8).fill(false));

  return (
    <details className="group rounded-3xl border border-reunion-blue/20 bg-reunion-blue/[0.04] p-5 sm:p-7">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
        <span><span className="flex items-center gap-2 font-display text-xl font-semibold"><UserRoundPlus className="h-5 w-5 text-reunion-blue" /> Inscrire mon équipe</span><span className="mt-1 block text-sm text-ink-500">Inscription officielle transmise à l’association.</span></span>
        <ChevronDown className="h-5 w-5 transition group-open:rotate-180" />
      </summary>
      <form action={action} className="mt-6 space-y-6 border-t border-reunion-blue/10 pt-6">
        <input type="hidden" name="tournament_id" value={tournamentId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">Nom de l’équipe<input name="team_name" required maxLength={100} className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
          <label className="text-sm font-medium">Nombre de joueurs<select value={players} onChange={(event) => setPlayers(Number(event.target.value))} className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3">{Array.from({ length: 8 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count}</option>)}</select></label>
          <label className="text-sm font-medium">E-mail du référent<input name="referent_email" type="email" required defaultValue={defaultEmail} className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
          <label className="text-sm font-medium">Téléphone du référent<input name="referent_phone" type="tel" required className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
          <label className="text-sm font-medium">Catégorie<input name="category" className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
          <label className="text-sm font-medium">Niveau<input name="level" className="mt-2 w-full rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
        </div>
        <fieldset className="space-y-4">
          <legend className="font-display text-lg font-semibold">Composition de l’équipe</legend>
          {Array.from({ length: players }, (_, index) => <div key={index} className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">Joueur {index + 1}</p>
            <div className="grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Prénom<input name={`player_${index}_first_name`} required defaultValue={index === 0 ? defaultFirstName : ''} className="mt-1.5 w-full rounded-xl border border-ink-200 px-3.5 py-2.5" /></label><label className="text-sm font-medium">Nom<input name={`player_${index}_last_name`} required defaultValue={index === 0 ? defaultLastName : ''} className="mt-1.5 w-full rounded-xl border border-ink-200 px-3.5 py-2.5" /></label></div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-600"><input name={`player_${index}_is_minor`} type="checkbox" checked={minors[index]} onChange={(event) => setMinors((current) => current.map((value, position) => position === index ? event.target.checked : value))} /> Ce joueur est mineur</label>
            {minors[index] && <div className="mt-3 grid gap-3 rounded-xl bg-amber-50 p-3 sm:grid-cols-2"><label className="text-xs font-medium text-amber-950">Nom du responsable<input name={`player_${index}_guardian_name`} required className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm" /></label><label className="text-xs font-medium text-amber-950">E-mail du responsable<input name={`player_${index}_guardian_email`} type="email" required className="mt-1.5 w-full rounded-lg border border-amber-200 bg-white px-3 py-2.5 text-sm" /></label><p className="sm:col-span-2 text-xs leading-5 text-amber-800">Une confirmation sera demandée au responsable majeur.</p></div>}
          </div>)}
        </fieldset>
        <label className="block text-sm font-medium">Informations complémentaires<textarea name="notes" rows={3} maxLength={1000} className="mt-2 w-full resize-none rounded-xl border border-ink-200 bg-white px-4 py-3" /></label>
        <button className="w-full rounded-xl bg-reunion-blue px-5 py-3 font-semibold text-white">Envoyer l’inscription</button>
      </form>
    </details>
  );
}
