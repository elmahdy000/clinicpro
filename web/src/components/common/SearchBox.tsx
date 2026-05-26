'use client';

import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

export function SearchBox({
  value,
  onChange,
  placeholder = 'ابحث...',
  className = '',
  inputClassName = '',
}: SearchBoxProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className={cn('relative', className)}>
      <Search
        className={cn(
          'pointer-events-none absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors',
          isRtl ? 'right-3.5' : 'left-3.5',
        )}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'h-10 w-full rounded-xl border border-slate-200 bg-white py-2 text-sm leading-normal text-slate-900 shadow-sm transition-all',
          'placeholder:text-slate-500',
          'focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100',
          'focus-visible:outline-none focus-visible:border-teal-400 focus-visible:ring-2 focus-visible:ring-teal-100',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-teal-900/30 dark:focus-visible:ring-teal-900/30',
          isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left',
          inputClassName,
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
            isRtl ? 'left-2.5' : 'right-2.5',
          )}
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
