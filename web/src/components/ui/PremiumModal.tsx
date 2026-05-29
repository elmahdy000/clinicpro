'use client';

/**
 * PremiumModal — Unified Modal System for ClinicPro
 * 
 * Usage:
 * <PremiumModal
 *   open={open}
 *   onClose={() => setOpen(false)}
 *   title="عنوان النافذة"
 *   description="وصف اختياري"
 *   icon={<Pill className="w-5 h-5 text-white" />}
 *   headerColor="teal"     // "teal" | "blue" | "rose" | "amber" | "violet" | "slate"
 *   size="md"              // "sm" | "md" | "lg" | "xl"
 *   footer={<Button>حفظ</Button>}
 * >
 *   {content}
 * </PremiumModal>
 */

import { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type HeaderColor = 'teal' | 'blue' | 'rose' | 'amber' | 'violet' | 'slate' | 'emerald';
type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

const COLOR_MAP: Record<HeaderColor, string> = {
  teal:    'from-teal-600 to-teal-700',
  blue:    'from-blue-600 to-blue-700',
  rose:    'from-rose-600 to-rose-700',
  amber:   'from-amber-500 to-amber-600',
  violet:  'from-violet-600 to-violet-700',
  slate:   'from-slate-700 to-slate-800',
  emerald: 'from-emerald-600 to-emerald-700',
};

const SIZE_MAP: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-xl',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  headerColor?: HeaderColor;
  size?: ModalSize;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra content inside the header (e.g. alert banners) */
  headerExtra?: ReactNode;
  /** If true, clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
  dir?: 'rtl' | 'ltr';
}

export function PremiumModal({
  open,
  onClose,
  title,
  description,
  icon,
  headerColor = 'teal',
  size = 'md',
  children,
  footer,
  headerExtra,
  closeOnBackdrop = true,
  dir = 'rtl',
}: PremiumModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={closeOnBackdrop ? onClose : undefined}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl',
          'flex flex-col max-h-[90vh] overflow-hidden',
          'animate-in zoom-in-95 fade-in-0 duration-200',
          SIZE_MAP[size]
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className={cn(
          'relative bg-gradient-to-l px-6 py-5 shrink-0',
          COLOR_MAP[headerColor]
        )}>
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title Row */}
          <div className="flex items-start gap-3 pr-2">
            {icon && (
              <div className="p-2.5 bg-white/20 rounded-xl shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-white font-bold text-base leading-tight">{title}</h2>
              {description && (
                <p className="text-white/75 text-xs mt-1 leading-relaxed">{description}</p>
              )}
            </div>
          </div>

          {/* Extra header content (alerts etc.) */}
          {headerExtra && <div className="mt-3">{headerExtra}</div>}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>

        {/* ── Footer ── */}
        {footer && (
          <div className="shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-5 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
