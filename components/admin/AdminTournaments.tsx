'use client';

import { useEffect, useState } from 'react';
import { Trash2, Edit3, Search, MapPin } from 'lucide-react';
import { supabase, type Tournament, type TournamentType } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import TypeBadge from '@/components/ui/TypeBadge';
import { TOURNAMENT_TYPES, formatDate, formatTime } from '@/lib/utils';

export default function AdminTournaments() {
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editTarget, setEditTarget] = useState<Tournament | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Tournament | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: true });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const remove = async () => {
    if (!confirmDelete) return;
    await supabase.from('tournaments').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    fetchAll();
  };

  const filtered = items.filter((t) =>
    [t.name, t.city, t.location, t.type]
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <Input
            placeholder="Rechercher par nom, ville, type…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-ink-500 hidden sm:block">
          {filtered.length} tournoi{filtered.length > 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-white rounded-2xl border border-ink-200/60 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-200/60 p-10 text-center text-ink-500">
          Aucun tournoi.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-white rounded-2xl border border-ink-200/60 p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-soft transition-shadow"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.poster_url}
                  alt={t.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-ink-900 text-[15px] truncate">
                    {t.name}
                  </span>
                  <TypeBadge type={t.type} size="sm" />
                </div>
                <div className="text-xs text-ink-500 truncate">
                  {formatDate(t.date, { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                  {formatTime(t.time)} ·{' '}
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {t.city}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditTarget(t)}
                  className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors"
                  aria-label="Éditer"
                >
                  <Edit3 className="w-4 h-4 text-ink-600" />
                </button>
                <button
                  onClick={() => setConfirmDelete(t)}
                  className="w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                  aria-label="Supprimer"
                >
                  <Trash2 className="w-4 h-4 text-reunion-red" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal édition */}
      {editTarget && (
        <EditTournamentModal
          tournament={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => {
            setEditTarget(null);
            fetchAll();
          }}
        />
      )}

      {/* Confirm suppression */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer ce tournoi ?"
        description="Cette action est irréversible."
        maxWidth="sm"
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-ink-50 p-3 text-sm">
            <p className="font-medium text-ink-900">{confirmDelete?.name}</p>
            <p className="text-ink-500 text-xs mt-1">
              {confirmDelete && formatDate(confirmDelete.date)} · {confirmDelete?.city}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button variant="danger" onClick={remove} className="flex-1">
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function EditTournamentModal({
  tournament,
  onClose,
  onSaved,
}: {
  tournament: Tournament;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: tournament.name,
    date: tournament.date,
    time: tournament.time.slice(0, 5),
    city: tournament.city,
    type: tournament.type,
    location: tournament.location,
    players_count: String(tournament.players_count),
    description: tournament.description,
    phone: tournament.phone ?? '',
    email: tournament.email ?? '',
    latitude: tournament.latitude?.toString() ?? '',
    longitude: tournament.longitude?.toString() ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from('tournaments')
      .update({
        name: form.name,
        date: form.date,
        time: form.time,
        city: form.city,
        type: form.type as TournamentType,
        location: form.location,
        players_count: parseInt(form.players_count, 10),
        description: form.description,
        phone: form.phone || null,
        email: form.email || null,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      })
      .eq('id', tournament.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    onSaved();
  };

  return (
    <Modal open onClose={onClose} title="Éditer le tournoi" maxWidth="xl">
      <div className="flex flex-col gap-4">
        <Field label="Nom" required>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" required>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Heure" required>
            <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ville" required>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </Field>
          <Field label="Type" required>
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as TournamentType })}
            >
              {TOURNAMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Lieu précis" required>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </Field>
        <Field label="Nombre d'équipes maximum" required>
          <Input
            type="number"
            value={form.players_count}
            onChange={(e) => setForm({ ...form, players_count: e.target.value })}
          />
        </Field>
        <Field label="Description" required>
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Téléphone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude" hint="Pour afficher sur la carte">
            <Input
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              placeholder="-21.115141"
            />
          </Field>
          <Field label="Longitude">
            <Input
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              placeholder="55.536384"
            />
          </Field>
        </div>

        {error && (
          <div className="rounded-xl bg-reunion-red/5 border border-reunion-red/20 px-4 py-2 text-sm text-reunion-red">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button onClick={save} loading={saving} className="flex-1">
            Enregistrer
          </Button>
        </div>
      </div>
    </Modal>
  );
}
