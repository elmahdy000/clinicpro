'use client';

import { ReactNode } from 'react';
import { useSidebar } from '@/stores/sidebar';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';

export function SidebarSync({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div
        className={cn(
          'transition-all duration-300',
          isRtl
            ? (collapsed ? 'lg:pr-[68px] lg:pl-0' : 'lg:pr-[220px] lg:pl-0')
            : (collapsed ? 'lg:pl-[68px] lg:pr-0' : 'lg:pl-[220px] lg:pr-0'),
        )}
      >
        {children}
      </div>
    </>
  );
}
