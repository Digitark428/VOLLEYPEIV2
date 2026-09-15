'use client';

import imageCompression from 'browser-image-compression';

export type ImageUsage = 'avatar' | 'logo' | 'poster' | 'post' | 'gallery';

const PRESETS: Record<ImageUsage, { maxSizeMB: number; maxWidthOrHeight: number; quality: number }> = {
  avatar: { maxSizeMB: 0.18, maxWidthOrHeight: 512, quality: 0.82 },
  logo: { maxSizeMB: 0.3, maxWidthOrHeight: 800, quality: 0.86 },
  poster: { maxSizeMB: 0.75, maxWidthOrHeight: 1800, quality: 0.86 },
  post: { maxSizeMB: 0.8, maxWidthOrHeight: 1920, quality: 0.84 },
  gallery: { maxSizeMB: 0.8, maxWidthOrHeight: 1920, quality: 0.84 },
};

export type OptimizedImage = {
  file: File;
  width: number;
  height: number;
  originalBytes: number;
};

async function prepareInput(file: File) {
  const looksHeic = /\.(heic|heif)$/i.test(file.name) || ['image/heic', 'image/heif'].includes(file.type.toLowerCase());
  if (!looksHeic) return file;
  const { heicTo, isHeic } = await import('heic-to/csp');
  if (!(await isHeic(file))) throw new Error('Ce fichier porte une extension HEIC mais son contenu est invalide.');
  const jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 });
  return new File([jpeg], file.name.replace(/\.(heic|heif)$/i, '.jpg'), { type: 'image/jpeg', lastModified: file.lastModified });
}

async function dimensions(file: File) {
  const bitmap = await createImageBitmap(file);
  const result = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return result;
}

export async function optimizeImage(file: File, usage: ImageUsage, onProgress?: (progress: number) => void): Promise<OptimizedImage> {
  if (file.size > 25 * 1024 * 1024) throw new Error('La photo dépasse 25 Mo. Choisis une image plus légère.');
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('Le fichier sélectionné n’est pas une image reconnue.');
  onProgress?.(5);
  const prepared = await prepareInput(file);
  onProgress?.(22);
  const preset = PRESETS[usage];
  const compressed = await imageCompression(prepared, {
    maxSizeMB: preset.maxSizeMB,
    maxWidthOrHeight: preset.maxWidthOrHeight,
    initialQuality: preset.quality,
    fileType: 'image/webp',
    preserveExif: false,
    useWebWorker: false,
    onProgress: (progress) => onProgress?.(22 + Math.round(progress * 0.68)),
  });
  const output = new File([compressed], `${crypto.randomUUID()}.webp`, { type: 'image/webp', lastModified: Date.now() });
  const size = await dimensions(output);
  onProgress?.(92);
  return { file: output, ...size, originalBytes: file.size };
}
