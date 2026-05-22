'use client';

import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { classNames } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  hideClose?: boolean;
}

const widths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  hideClose = false,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('no-scroll');
      const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onEsc);
      return () => {
        document.body.classList.remove('no-scroll');
        window.removeEventListener('keydown', onEsc);
      };
    }
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={classNames(
              'relative w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-lift overflow-hidden',
              'border border-ink-200/60',
              'max-h-[92vh] flex flex-col',
              widths[maxWidth]
            )}
          >
            {(title || !hideClose) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
                <div>
                  {title && (
                    <h2 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-ink-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1.5 text-sm text-ink-500 leading-relaxed">
                      {description}
                    </p>
                  )}
                </div>
                {!hideClose && (
                  <button
                    onClick={onClose}
                    className="flex-shrink-0 w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center transition-colors -mr-2 -mt-1"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5 text-ink-500" />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto px-6 pb-6 pt-3 flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
