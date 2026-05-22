'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';
import { classNames } from '@/lib/utils';

interface FieldWrapperProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ label, required, hint, error, children }: FieldWrapperProps) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink-800 flex items-center gap-1.5">
        {label}
        {required && <span className="text-reunion-red text-xs">●</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink-400 leading-relaxed">{hint}</span>}
      {error && <span className="text-xs text-reunion-red">{error}</span>}
    </label>
  );
}

const inputBase =
  'w-full px-4 py-3 text-[15px] rounded-xl border border-ink-200 bg-white ' +
  'placeholder:text-ink-400 text-ink-900 ' +
  'transition-all duration-200 ' +
  'focus:border-ink-900 focus:ring-4 focus:ring-ink-900/5 focus:outline-none';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={classNames(inputBase, className)} {...props} />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, rows = 4, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      className={classNames(inputBase, 'resize-none', className)}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={classNames(
        inputBase,
        'appearance-none bg-no-repeat bg-[length:16px] bg-[right_16px_center] pr-10',
        className
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371717A' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';
