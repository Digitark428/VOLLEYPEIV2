'use client';

import Modal from '@/components/ui/Modal';
import { Globe, Phone } from 'lucide-react';
import type { Sponsor } from '@/lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
  sponsor: Sponsor | null;
}

export default function SponsorModal({ open, onClose, sponsor }: Props) {
  if (!sponsor) return null;

  return (
    <Modal open={open} onClose={onClose} title={sponsor.name} maxWidth="2xl">
      <div className="flex flex-col gap-5">
        {/* Image principale */}
        <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sponsor.image_url}
            alt={sponsor.name}
            className="w-full h-full object-cover"
          />
        </div>

        {sponsor.slogan && (
          <p className="text-lg font-display font-medium text-ink-800 italic">
            « {sponsor.slogan} »
          </p>
        )}

        {sponsor.description && (
          <p className="text-[15px] text-ink-600 leading-relaxed whitespace-pre-line">
            {sponsor.description}
          </p>
        )}

        {/* Liens */}
        <div className="flex flex-wrap gap-2">
          {sponsor.website && (
            <a
              href={sponsor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-950 text-white text-sm font-medium hover:bg-ink-800 transition-colors"
            >
              <Globe className="w-4 h-4" />
              Visiter le site
            </a>
          )}
          {sponsor.phone && (
            <a
              href={`tel:${sponsor.phone}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-ink-200 text-ink-900 text-sm font-medium hover:bg-ink-50 transition-colors"
            >
              <Phone className="w-4 h-4" />
              {sponsor.phone}
            </a>
          )}
        </div>

        {/* Galerie */}
        {sponsor.gallery && sponsor.gallery.length > 0 && (
          <div>
            <h3 className="font-medium text-ink-900 mb-3">Galerie</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sponsor.gallery.map((url, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden bg-ink-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
