'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Edit3, ImageIcon, X, Globe, Phone, Award } from 'lucide-react';
import { supabase, type Sponsor, type SponsorCategory } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Field, Input, Textarea, Select } from '@/components/ui/Input';
import { classNames } from '@/lib/utils';

const CATEGORIES: { value: SponsorCategory; label: string; max: number; accent: string }[] = [
  { value: 'gold', label: 'Gold', max: 1, accent: 'from-amber-300 to-yellow-500' },
  { value: 'silver', label: 'Silver', max: 6, accent: 'from-slate-300 to-slate-500' },
  { value: 'bronze', label: 'Bronze', max: 8, accent: 'from-orange-300 to-orange-600' },
];

export default function AdminSponsors() {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<Sponsor | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Sponsor | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    setItems((data as Sponsor[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const remove = async () => {
    if (!confirmDelete) return;
    await supabase.from('sponsors').delete().eq('id', confirmDelete.id);
    setConfirmDelete(null);
    fetchAll();
  };

  const groupedByCategory = (cat: SponsorCategory) =>
    items.filter((s) => s.category === cat);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-semibold tracking-tight text-ink-900">
            Gestion des sponsors
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Les sponsors ajoutés apparaissent automatiquement dans les emplacements partenaires.
          </p>
        </div>
        <Button onClick={() => setCreating(true)} variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau sponsor
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-ink-400 text-sm">Chargement…</div>
      ) : (
        <div className="space-y-10">
          {CATEGORIES.map((cat) => {
            const list = groupedByCategory(cat.value);
            return (
              <section key={cat.value}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={classNames(
                      'inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r text-white text-xs font-medium tracking-wide uppercase shadow-soft',
                      cat.accent
                    )}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {cat.label}
                  </div>
                  <div className="text-xs text-ink-400">
                    {list.length} / {cat.max} emplacement{cat.max > 1 ? 's' : ''}
                  </div>
                  <div className="flex-1 h-px bg-ink-100" />
                </div>

                {list.length === 0 ? (
                  <div className="border border-dashed border-ink-200 rounded-2xl p-8 text-center text-sm text-ink-400">
                    Aucun sponsor {cat.label} pour l'instant
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {list.map((s) => (
                      <div
                        key={s.id}
                        className="group bg-white border border-ink-100 rounded-2xl p-4 hover:shadow-card transition-all"
                      >
                        <div className="aspect-video rounded-xl bg-ink-50 overflow-hidden mb-3">
                          {s.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={s.image_url}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-ink-300">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-medium text-ink-900 truncate">{s.name}</h3>
                            {s.slogan && (
                              <p className="text-xs text-ink-500 italic truncate mt-0.5">
                                {s.slogan}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-400">
                              {s.website && <Globe className="w-3 h-3" />}
                              {s.phone && <Phone className="w-3 h-3" />}
                              {s.gallery?.length > 0 && (
                                <span>{s.gallery.length} photos</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <button
                              onClick={() => setEditTarget(s)}
                              className="p-2 rounded-lg hover:bg-ink-100 text-ink-500 transition-colors"
                              aria-label="Modifier"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDelete(s)}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                              aria-label="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {(creating || editTarget) && (
        <SponsorEditor
          target={editTarget}
          onClose={() => {
            setCreating(false);
            setEditTarget(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditTarget(null);
            fetchAll();
          }}
        />
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Supprimer ce sponsor ?"
        maxWidth="sm"
      >
        <p className="text-sm text-ink-600 mb-6">
          Cette action est irréversible. Le sponsor sera retiré de tous les emplacements.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
            Annuler
          </Button>
          <Button variant="danger" onClick={remove}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ------------------------------------------------------------------
// Editor (create + edit)
// ------------------------------------------------------------------

function SponsorEditor({
  target,
  onClose,
  onSaved,
}: {
  target: Sponsor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!target;

  const [name, setName] = useState(target?.name ?? '');
  const [category, setCategory] = useState<SponsorCategory>(target?.category ?? 'silver');
  const [slogan, setSlogan] = useState(target?.slogan ?? '');
  const [website, setWebsite] = useState(target?.website ?? '');
  const [phone, setPhone] = useState(target?.phone ?? '');
  const [description, setDescription] = useState(target?.description ?? '');
  const [imageUrl, setImageUrl] = useState(target?.image_url ?? '');
  const [gallery, setGallery] = useState<string[]>(target?.gallery ?? []);
  const [displayOrder, setDisplayOrder] = useState<number>(target?.display_order ?? 0);

  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mainInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('sponsors')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) {
      setError(upErr.message);
      return null;
    }
    const { data } = supabase.storage.from('sponsors').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleMainUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("L'image doit faire moins de 5 Mo");
      return;
    }
    setError(null);
    setUploadingMain(true);
    const url = await uploadFile(file);
    if (url) setImageUrl(url);
    setUploadingMain(false);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    if (gallery.length + files.length > 10) {
      setError('Galerie limitée à 10 photos');
      return;
    }
    setError(null);
    setUploadingGallery(true);
    const uploaded: string[] = [];
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) continue;
      const url = await uploadFile(f);
      if (url) uploaded.push(url);
    }
    setGallery((g) => [...g, ...uploaded]);
    setUploadingGallery(false);
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const removeGalleryItem = (idx: number) => {
    setGallery((g) => g.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    setError(null);

    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }
    if (!imageUrl) {
      setError('Une image principale est requise');
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      category,
      slogan: slogan.trim() || null,
      website: website.trim() || null,
      phone: phone.trim() || null,
      description: description.trim() || null,
      image_url: imageUrl,
      gallery,
      display_order: displayOrder,
    };

    let res;
    if (isEdit && target) {
      res = await supabase.from('sponsors').update(payload).eq('id', target.id);
    } else {
      res = await supabase.from('sponsors').insert(payload);
    }

    setSaving(false);

    if (res.error) {
      setError(res.error.message);
      return;
    }

    onSaved();
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Modifier le sponsor' : 'Nouveau sponsor'} maxWidth="2xl">
      <div className="space-y-5">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Image principale */}
        <Field label="Image principale" required>
          <div className="flex items-start gap-4">
            <div className="w-32 h-32 rounded-2xl bg-ink-50 border border-ink-100 overflow-hidden flex-shrink-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ink-300">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={mainInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleMainUpload}
                className="hidden"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={() => mainInputRef.current?.click()}
                loading={uploadingMain}
              >
                {imageUrl ? 'Changer l\'image' : 'Téléverser une image'}
              </Button>
              <p className="text-xs text-ink-400 mt-2">
                JPG, PNG ou WEBP — max 5 Mo. Format paysage recommandé.
              </p>
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nom du sponsor" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Réunion Sport" />
          </Field>

          <Field label="Catégorie" required>
            <Select value={category} onChange={(e) => setCategory(e.target.value as SponsorCategory)}>
              <option value="gold">Gold (1 emplacement)</option>
              <option value="silver">Silver (6 emplacements)</option>
              <option value="bronze">Bronze (8 emplacements)</option>
            </Select>
          </Field>
        </div>

        <Field label="Slogan">
          <Input
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="Une phrase d'accroche"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Site web">
            <Input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://…"
              type="url"
            />
          </Field>

          <Field label="Téléphone">
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0692 …"
              type="tel"
            />
          </Field>
        </div>

        <Field label="Description complète">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Présentation du sponsor, valeurs, offres…"
            rows={4}
          />
        </Field>

        <Field label={`Ordre d'affichage`}>
          <Input
            type="number"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(parseInt(e.target.value || '0', 10))}
            placeholder="0"
          />
          <p className="text-xs text-ink-400 mt-1.5">
            Les sponsors avec un ordre plus petit s'affichent en premier.
          </p>
        </Field>

        {/* Galerie */}
        <Field label={`Galerie photos (${gallery.length}/10)`}>
          <div className="space-y-3">
            {gallery.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {gallery.map((url, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-ink-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeGalleryItem(idx)}
                      className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Retirer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleGalleryUpload}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => galleryInputRef.current?.click()}
              loading={uploadingGallery}
              disabled={gallery.length >= 10}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Ajouter des photos
            </Button>
          </div>
        </Field>

        <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={submit} loading={saving}>
            {isEdit ? 'Enregistrer' : 'Créer le sponsor'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
