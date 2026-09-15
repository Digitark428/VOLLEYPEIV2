'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyConsentLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    setCopied(true); window.setTimeout(() => setCopied(false), 1800);
  }
  return <button type="button" onClick={copy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-950 px-5 py-3 text-sm font-semibold text-white">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{copied ? 'Lien copié' : 'Copier le lien à envoyer'}</button>;
}
