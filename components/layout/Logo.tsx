'use client';

interface LogoProps {
  variant?: 'default' | 'splash' | 'compact';
  className?: string;
}

export default function Logo({ variant = 'default', className = '' }: LogoProps) {
  const sizeClass = {
    splash: 'w-48 h-48 sm:w-56 sm:h-56',
    default: 'w-10 h-10',
    compact: 'w-8 h-8',
  }[variant];

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Volley Péi"
      className={`object-contain ${sizeClass} ${className}`}
    />
  );
}
