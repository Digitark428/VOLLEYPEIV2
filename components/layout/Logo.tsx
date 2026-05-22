'use client';

interface LogoProps {
  variant?: 'default' | 'splash' | 'compact';
  className?: string;
}

export default function Logo({ variant = 'default', className = '' }: LogoProps) {
  const isDark = variant === 'splash';

  return (
    <svg
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full ${className}`}
      aria-label="Volley Péi"
    >
      <defs>
        <linearGradient id="vGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isDark ? '#F4F4F5' : '#52525B'} />
          <stop offset="50%" stopColor={isDark ? '#A1A1AA' : '#27272A'} />
          <stop offset="100%" stopColor={isDark ? '#71717A' : '#09090B'} />
        </linearGradient>
        <radialGradient id="ballGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={isDark ? '#52525B' : '#3F3F46'} />
          <stop offset="100%" stopColor={isDark ? '#09090B' : '#18181B'} />
        </radialGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" />
          <feOffset dx="0" dy="1" result="offsetblur" />
          <feComponentTransfer><feFuncA type="linear" slope="0.3" /></feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* V majuscule stylisé */}
      <g filter="url(#softShadow)">
        <path
          d="M 22 28 L 38 28 L 54 78 L 70 28 L 86 28 L 64 92 L 44 92 Z"
          fill="url(#vGrad)"
        />
      </g>

      {/* Ballon de volley */}
      <g transform="translate(72, 22)">
        <circle cx="14" cy="14" r="14" fill="url(#ballGrad)" />
        <path
          d="M 4 14 Q 14 6 24 14 M 4 14 Q 14 22 24 14 M 14 2 Q 8 14 14 26 M 14 2 Q 20 14 14 26"
          stroke={isDark ? '#71717A' : '#52525B'}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Traits couleurs Réunion */}
      <g transform="translate(78, 56)">
        <path d="M 0 0 L 28 -8" stroke="#1E40AF" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 0 6 L 30 -2" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 0 12 L 28 4" stroke="#DC2626" strokeWidth="3.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}
