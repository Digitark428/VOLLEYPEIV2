'use client';

import { useLogoUrl } from './LogoProvider';

interface LogoProps {
  variant?: 'default' | 'splash' | 'compact';
  className?: string;
}

export default function Logo({ variant = 'default', className = '' }: LogoProps) {
  const logoUrl = useLogoUrl();
  const sizeClass = {
    splash: 'max-h-64 w-auto max-w-[80vw] sm:max-h-80',
    default: 'h-11 w-auto max-w-36',
    compact: 'h-8 w-auto max-w-28',
  }[variant];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt="Volley Péi"
      className={`block object-contain ${sizeClass} ${className}`}
    />
  );
}
