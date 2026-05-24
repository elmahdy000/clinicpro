'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 -translate-y-1/2 end-3.5 h-4 w-4 text-slate-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        dir="rtl"
        className={cn(
          'h-11 w-full rounded-xl border border-slate-200 bg-white ps-4 pe-11 text-right text-sm leading-5 text-slate-900',
          'placeholder:text-slate-400',
          'outline-none ring-0 ring-offset-0',
          'focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-0 focus:border-cyan-500',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-0 focus-visible:border-cyan-500',
          'shadow-sm transition',
          'dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-cyan-900/30 dark:focus-visible:ring-cyan-900/30',
          inputClassName,
        )}
      />
    </div>
  );
}
