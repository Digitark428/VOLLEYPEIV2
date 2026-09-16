'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, Camera, Send, UsersRound } from 'lucide-react';
import { createPost } from '@/app/actualite/actions';
import OptimizedMediaPicker from '@/components/media/OptimizedMediaPicker';
import PendingSubmitButton from '@/components/forms/PendingSubmitButton';
import ProfileAvatar from '@/components/profile/ProfileAvatar';

type TournamentOption = { id: string; name: string; date: string };
type AssociationOption = { id: string; name: string };
type Mention = { id: string; username: string; first_name: string | null; last_name: string | null };

export default function FeedComposer({ username, avatarPath, tournaments, associations }: { username: string; avatarPath: string | null; tournaments: TournamentOption[]; associations: AssociationOption[] }) {
  const [body, setBody] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [panel, setPanel] = useState<'photo' | 'tournament' | 'identity' | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mentionQuery === null || mentionQuery.length < 1) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(mentionQuery)}`, { signal: controller.signal });
      if (response.ok) setMentions(((await response.json()) as { users: Mention[] }).users);
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [mentionQuery]);

  function updateBody(value: string, cursor: number | null) {
    setBody(value); setExpanded(true);
    const beforeCursor = value.slice(0, cursor ?? value.length);
    const match = beforeCursor.match(/(?:^|\s)@([A-Za-z0-9._-]{1,30})$/);
    setMentionQuery(match?.[1] ?? null);
    if (!match) setMentions([]);
  }

  function chooseMention(user: Mention) {
    const textarea = textareaRef.current;
    const cursor = textarea?.selectionStart ?? body.length;
    const before = body.slice(0, cursor).replace(/@([A-Za-z0-9._-]{1,30})$/, `@${user.username} `);
    const next = before + body.slice(cursor);
    setBody(next); setMentionQuery(null); setMentions([]);
    requestAnimationFrame(() => { textarea?.focus(); textarea?.setSelectionRange(before.length, before.length); });
  }

  return <form action={createPost} className="mb-6 rounded-2xl border border-ink-200 bg-white p-3 shadow-soft sm:p-4">
    <div className="flex items-start gap-3"><ProfileAvatar username={username} avatarPath={avatarPath} /><div className="relative min-w-0 flex-1">
      <label htmlFor="post-body" className="sr-only">Ta publication</label><textarea ref={textareaRef} id="post-body" name="body" required maxLength={5000} rows={expanded ? 3 : 1} value={body} onFocus={() => setExpanded(true)} onChange={(event) => updateBody(event.target.value, event.target.selectionStart)} placeholder="Quoi de neuf ? Utilise @ pour mentionner." className="min-h-11 w-full resize-none rounded-xl border-0 bg-ink-50 px-4 py-3 text-base outline-none ring-1 ring-ink-100 transition focus:bg-white focus:ring-ink-300" />
      {mentions.length > 0 && <div className="absolute z-30 mt-1 w-full max-w-sm rounded-2xl border border-ink-200 bg-white p-1 shadow-lift">{mentions.map((user) => <button key={user.id} type="button" onClick={() => chooseMention(user)} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-ink-50"><strong>@{user.username}</strong>{(user.first_name || user.last_name) && <span className="ml-2 text-ink-400">{[user.first_name, user.last_name].filter(Boolean).join(' ')}</span>}</button>)}</div>}
    </div></div>
    {expanded && <>
      {panel === 'photo' && <div className="mt-3 border-t border-ink-100 pt-3"><OptimizedMediaPicker usage="post" maxFiles={4} /></div>}
      {panel === 'tournament' && <label className="mt-3 block border-t border-ink-100 pt-3 text-xs font-medium text-ink-500">Lier à un tournoi<select name="tournament_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">Aucun tournoi</option>{tournaments.map((tournament) => <option key={tournament.id} value={tournament.id}>{tournament.name} · {new Intl.DateTimeFormat('fr-FR').format(new Date(tournament.date))}</option>)}</select></label>}
      {panel === 'identity' && associations.length > 0 && <label className="mt-3 block border-t border-ink-100 pt-3 text-xs font-medium text-ink-500">Publier en tant que<select name="association_id" className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm"><option value="">@{username}</option>{associations.map((association) => <option key={association.id} value={association.id}>{association.name}</option>)}</select></label>}
      <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-ink-100 pt-3"><button type="button" onClick={() => setPanel((current) => current === 'photo' ? null : 'photo')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50"><Camera className="h-4 w-4" />Photo</button><button type="button" onClick={() => setPanel((current) => current === 'tournament' ? null : 'tournament')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50"><CalendarDays className="h-4 w-4" />Lier un tournoi</button>{associations.length > 0 && <button type="button" onClick={() => setPanel((current) => current === 'identity' ? null : 'identity')} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50"><UsersRound className="h-4 w-4" />Publier en tant que</button>}<PendingSubmitButton pendingLabel="Publication…" className="ml-auto inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Send className="h-4 w-4" />Publier</PendingSubmitButton></div>
    </>}
  </form>;
}
