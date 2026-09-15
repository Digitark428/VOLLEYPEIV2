'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export type LightboxImage = { src: string; alt: string };

export default function PhotoLightbox({ images, initialIndex, onClose }: { images: LightboxImage[]; initialIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const previous = () => setIndex((value) => (value - 1 + images.length) % images.length);
  const next = () => setIndex((value) => (value + 1) % images.length);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setIndex((value) => (value - 1 + images.length) % images.length);
      if (event.key === 'ArrowRight') setIndex((value) => (value + 1) % images.length);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('no-scroll'); window.removeEventListener('keydown', onKey); };
  }, [images.length, onClose]);

  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-3 sm:p-8" role="dialog" aria-modal="true" aria-label="Photo agrandie" onClick={onClose} onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)} onTouchEnd={(event) => { if (touchStart === null) return; const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart; if (Math.abs(delta) > 45) { if (delta > 0) previous(); else next(); } setTouchStart(null); }}>
    <button onClick={onClose} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] rounded-full bg-white/10 p-3 text-white" aria-label="Fermer"><X className="h-6 w-6" /></button>
    {images.length > 1 && <><button onClick={(event) => { event.stopPropagation(); previous(); }} className="absolute left-2 rounded-full bg-white/10 p-3 text-white sm:left-6" aria-label="Photo précédente"><ChevronLeft className="h-7 w-7" /></button><button onClick={(event) => { event.stopPropagation(); next(); }} className="absolute right-2 rounded-full bg-white/10 p-3 text-white sm:right-6" aria-label="Photo suivante"><ChevronRight className="h-7 w-7" /></button></>}
    <img src={images[index].src} alt={images[index].alt} onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full select-none object-contain" draggable={false} />
    {images.length > 1 && <div className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] rounded-full bg-black/50 px-3 py-1 text-xs text-white">{index + 1} / {images.length}</div>}
  </div>;
}
