'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImagePlus, LoaderCircle, Trash2 } from 'lucide-react';
import { optimizeImage, type ImageUsage } from '@/lib/images/optimize';
import { supabase } from '@/lib/supabase';

type UploadedMedia = { id: string; url: string; path: string; savedPercent: number };
type Props = { usage: ImageUsage; maxFiles?: number; associationId?: string; required?: boolean; inputName?: string };

export default function OptimizedMediaPicker({ usage, maxFiles = 1, associationId, required = false, inputName = 'media_ids' }: Props) {
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    try {
      const { data: claims } = await supabase.auth.getClaims();
      const ownerId = claims?.claims?.sub;
      if (!ownerId) throw new Error('Connecte-toi avant d’ajouter une photo.');
      const selected = Array.from(files).slice(0, Math.max(0, maxFiles - items.length));
      for (const original of selected) {
        const optimized = await optimizeImage(original, usage, setProgress);
        const path = `${ownerId}/${usage}/${optimized.file.name}`;
        const { error: uploadError } = await supabase.storage.from('media-public').upload(path, optimized.file, { cacheControl: '31536000', contentType: 'image/webp', upsert: false });
        if (uploadError) throw uploadError;
        const { data: media, error: mediaError } = await supabase.from('media_assets').insert({
          owner_id: ownerId,
          association_id: associationId ?? null,
          kind: usage,
          bucket_id: 'media-public',
          storage_path: path,
          mime_type: 'image/webp',
          width: optimized.width,
          height: optimized.height,
          byte_size: optimized.file.size,
        }).select('id').single();
        if (mediaError) {
          await supabase.storage.from('media-public').remove([path]);
          throw mediaError;
        }
        const previewUrl = URL.createObjectURL(optimized.file);
        setItems((current) => [...current, { id: media.id, url: previewUrl, path, savedPercent: Math.max(0, Math.round((1 - optimized.file.size / optimized.originalBytes) * 100)) }]);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de traiter cette image.');
    } finally {
      setProgress(null);
    }
  }

  async function remove(item: UploadedMedia) {
    if (item.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
    setItems((current) => current.filter((candidate) => candidate.id !== item.id));
    await supabase.from('media_assets').update({ deleted_at: new Date().toISOString() }).eq('id', item.id);
    await supabase.storage.from('media-public').remove([item.path]);
  }

  return <div>
    {items.map((item) => <input key={item.id} type="hidden" name={inputName} value={item.id} />)}
    <div className={`grid gap-3 ${maxFiles > 1 ? 'grid-cols-2 sm:grid-cols-4' : 'max-w-xs'}`}>
      {items.map((item) => <div key={item.id} className="relative aspect-square overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-200"><Image src={item.url} alt="Aperçu optimisé" fill sizes="(max-width: 640px) 50vw, 220px" className="object-cover" /><button type="button" onClick={() => remove(item)} aria-label="Retirer l’image" className="absolute right-2 top-2 rounded-full bg-white/90 p-2 text-red-600 shadow"><Trash2 className="h-4 w-4" /></button><span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-1 text-[10px] font-semibold text-white">-{item.savedPercent}%</span></div>)}
      {items.length < maxFiles && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-ink-50 p-4 text-center transition hover:bg-white"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple={maxFiles > 1} onChange={(event) => choose(event.target.files)} className="sr-only" disabled={progress !== null} required={required && items.length === 0} />{progress !== null ? <><LoaderCircle className="h-6 w-6 animate-spin" /><span className="mt-2 text-xs">Optimisation {progress}%</span></> : <><ImagePlus className="h-6 w-6" /><span className="mt-2 text-xs font-medium">{items.length ? 'Ajouter' : 'Choisir une photo'}</span><span className="mt-1 text-[10px] text-ink-400">HEIC, JPG, PNG, WebP</span></>}</label>}
    </div>
    {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    {items.length > 0 && <p className="mt-2 text-xs text-emerald-700">Image convertie en WebP, redimensionnée et sans métadonnées EXIF.</p>}
  </div>;
}
