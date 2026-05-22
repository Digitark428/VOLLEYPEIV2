'use client';

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Upload, X, Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { TOURNAMENT_TYPES } from '@/lib/utils';
import { supabase, type TournamentType } from '@/lib/supabase';
import { sendNotification, buildNewTournamentNotification } from '@/lib/notifications';

type Step = 'warning' | 'form' | 'confirm' | 'success';

interface Props {
  open: boolean;
  onClose: () => void;
  onPublished?: () => void;
}

interface FormState {
  name: string;
  date: string;
  time: string;
  city: string;
  type: TournamentType | '';
  location: string;
  players_count: string;
  description: string;
  phone: string;
  email: string;
  posterFile: File | null;
  posterPreview: string;
}

const empty: FormState = {
  name: '',
  date: '',
  time: '',
  city: '',
  type: '',
  location: '',
  players_count: '',
  description: '',
  phone: '',
  email: '',
  posterFile: null,
  posterPreview: '',
};

export default function PublishForm({ open, onClose, onPublished }: Props) {
  const [step, setStep] = useState<Step>('warning');
  const [form, setForm] = useState<FormState>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setForm(empty);
    setStep('warning');
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
    setTimeout(reset, 400);
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image trop lourde (max 5 Mo).');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format non supporté (JPG, PNG ou WEBP).');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) =>
      setForm((f) => ({ ...f, posterFile: file, posterPreview: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Nom du tournoi requis.';
    if (!form.date) return 'Date requise.';
    if (!form.time) return 'Heure requise.';
    if (!form.city.trim()) return 'Ville requise.';
    if (!form.type) return 'Type de tournoi requis.';
    if (!form.location.trim()) return 'Lieu précis requis.';
    if (!form.players_count || parseInt(form.players_count) <= 0)
      return "Nombre d'équipes requis.";
    if (!form.description.trim()) return 'Description requise.';
    if (!form.posterFile) return 'Affiche du tournoi requise.';
    return null;
  };

  const submitForm = (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep('confirm');
  };

  const publish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      // 1. Upload image vers Supabase Storage
      const file = form.posterFile!;
      const ext = file.name.split('.').pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('posters')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from('posters').getPublicUrl(path);
      const posterUrl = pub.publicUrl;

      // 2. Insert tournoi
      const { data: created, error: insErr } = await supabase
        .from('tournaments')
        .insert({
          name: form.name.trim(),
          date: form.date,
          time: form.time,
          city: form.city.trim(),
          type: form.type,
          location: form.location.trim(),
          players_count: parseInt(form.players_count, 10),
          description: form.description.trim(),
          poster_url: posterUrl,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      // 3. Notification (stub aujourd'hui, actif quand on activera le module)
      if (created) {
        sendNotification(
          buildNewTournamentNotification({
            tournamentId: created.id,
            name: created.name,
            date: created.date,
            city: created.city,
            type: created.type,
          })
        );
      }

      setStep('success');
      onPublished?.();
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la publication.');
      setStep('form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="xl" hideClose={submitting}>
      <AnimatePresence mode="wait">
        {/* ÉTAPE 1 : avertissement rouge */}
        {step === 'warning' && (
          <motion.div
            key="warning"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center py-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-reunion-red/10 flex items-center justify-center mb-5">
              <AlertTriangle className="w-8 h-8 text-reunion-red" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              Avertissement
            </h2>
            <p className="mt-3 text-[15px] text-ink-600 leading-relaxed max-w-md">
              Nous vérifierons l'authenticité des événements publiés et nous pourrons
              vous contacter en cas de doute.
            </p>
            <div className="mt-6 w-full max-w-sm rounded-2xl bg-reunion-red/5 border border-reunion-red/20 p-4 text-[13px] text-ink-700 leading-relaxed">
              Toute fausse publication pourra entraîner un blocage. Merci de renseigner
              des informations exactes et vérifiables.
            </div>
            <div className="flex gap-3 mt-6 w-full max-w-sm">
              <Button variant="secondary" onClick={handleClose} className="flex-1">
                Annuler
              </Button>
              <Button onClick={() => setStep('form')} className="flex-1">
                J'ai compris
              </Button>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 2 : formulaire */}
        {step === 'form' && (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            onSubmit={submitForm}
            className="flex flex-col gap-5"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
                Publier un tournoi
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Tous les champs avec ● sont obligatoires.
              </p>
            </div>

            {/* Upload affiche */}
            <Field
              label="Affiche du tournoi"
              required
              hint="Format vertical 1080×1350 · JPG/PNG · max 5 Mo · image nette."
            >
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
                {form.posterPreview ? (
                  <div className="relative aspect-[4/5] max-w-[200px] rounded-2xl overflow-hidden bg-ink-100 ring-1 ring-ink-200 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.posterPreview}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setForm((f) => ({ ...f, posterFile: null, posterPreview: '' }));
                      }}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/95 backdrop-blur shadow-soft flex items-center justify-center hover:bg-white transition"
                    >
                      <X className="w-4 h-4 text-ink-700" />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-[4/5] max-w-[200px] rounded-2xl border-2 border-dashed border-ink-300 hover:border-ink-500 hover:bg-ink-50 transition-colors flex flex-col items-center justify-center gap-2 text-ink-500">
                    <Upload className="w-5 h-5" />
                    <span className="text-xs font-medium">Choisir une image</span>
                    <span className="text-[10px] text-ink-400">1080×1350</span>
                  </div>
                )}
              </label>
            </Field>

            <Field label="Nom du tournoi" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tournoi du Sud, beach open Saint-Pierre..."
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Date" required>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </Field>
              <Field label="Heure" required>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Ville" required>
                <Input
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Saint-Denis, Le Tampon..."
                />
              </Field>
              <Field label="Type de tournoi" required>
                <Select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as TournamentType })
                  }
                >
                  <option value="">Choisir un type…</option>
                  {TOURNAMENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Lieu précis" required hint="Adresse ou nom du site complet.">
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Gymnase Champ Fleuri, plage de Boucan…"
              />
            </Field>

            <Field label="Nombre d'équipes maximum" required>
              <Input
                type="number"
                min={2}
                value={form.players_count}
                onChange={(e) => setForm({ ...form, players_count: e.target.value })}
                placeholder="16"
              />
            </Field>

            <Field label="Description" required hint="Format, inscription, dotation, contact…">
              <Textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Détaillez l'événement, le format de jeu, les inscriptions, les prix, etc."
              />
            </Field>

            <div className="border-t border-ink-200/60 pt-5">
              <h3 className="text-sm font-medium text-ink-900 mb-3">
                Coordonnées <span className="text-ink-400 font-normal">(optionnel)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Téléphone">
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="0692 12 34 56"
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="contact@tournoi.re"
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-reunion-red/5 border border-reunion-red/20 px-4 py-3 text-sm text-reunion-red">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={handleClose}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1">
                Valider et publier le tournoi
              </Button>
            </div>
          </motion.form>
        )}

        {/* ÉTAPE 3 : confirmation */}
        {step === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center py-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-ink-100 flex items-center justify-center mb-5">
              <AlertTriangle className="w-7 h-7 text-ink-700" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              Dernière vérification
            </h2>
            <p className="mt-3 text-[15px] text-ink-600 leading-relaxed max-w-md">
              Ce tournoi va être publié officiellement sur le calendrier.
              <br />
              Avez-vous bien vérifié les informations ?
            </p>

            <div className="mt-6 w-full max-w-sm rounded-2xl bg-ink-50 border border-ink-200/60 p-4 text-left">
              <p className="font-medium text-ink-900 text-[15px]">{form.name}</p>
              <p className="text-sm text-ink-500 mt-1">
                {form.date} à {form.time} · {form.city}
              </p>
              <p className="text-sm text-ink-500 mt-0.5">{form.type}</p>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-reunion-red/5 border border-reunion-red/20 px-4 py-3 text-sm text-reunion-red w-full max-w-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-6 w-full max-w-sm">
              <Button
                variant="secondary"
                onClick={() => setStep('form')}
                disabled={submitting}
                className="flex-1"
              >
                Modifier encore
              </Button>
              <Button onClick={publish} loading={submitting} className="flex-1">
                Oui, publier
              </Button>
            </div>
          </motion.div>
        )}

        {/* ÉTAPE 4 : succès */}
        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5"
            >
              <Check className="w-10 h-10 text-green-600" strokeWidth={2.5} />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-900">
              Tournoi publié !
            </h2>
            <p className="mt-3 text-[15px] text-ink-600 leading-relaxed max-w-md">
              Votre tournoi apparaît dès maintenant sur le calendrier public.
              Merci pour votre contribution.
            </p>
            <Button onClick={handleClose} className="mt-6 min-w-[180px]">
              Retour au calendrier
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
