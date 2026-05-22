'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { classNames } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-ink-950 text-white hover:bg-ink-800 shadow-[0_1px_2px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.1),0_16px_40px_rgba(0,0,0,0.2)] hover:-translate-y-[1px] active:translate-y-0',
  secondary:
    'bg-white text-ink-900 border border-ink-200 hover:border-ink-300 hover:bg-ink-50 shadow-soft',
  ghost:
    'bg-transparent text-ink-700 hover:bg-ink-100',
  danger:
    'bg-reunion-red text-white hover:bg-red-700 shadow-soft',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-[13px] rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-[15px] rounded-2xl',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={classNames(
          'inline-flex items-center justify-center gap-2 font-medium tracking-tight',
          'transition-all duration-300 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-900 focus-visible:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export default Button;
