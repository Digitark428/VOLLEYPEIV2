'use client';

import { LoaderCircle } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export default function PendingSubmitButton({ children, pendingLabel = 'Envoi…', className = '' }: { children: React.ReactNode; pendingLabel?: string; className?: string }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-disabled={pending} className={className}>{pending ? <span className="inline-flex items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />{pendingLabel}</span> : children}</button>;
}
