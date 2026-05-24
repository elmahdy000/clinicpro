'use client';

import { ReactNode } from 'react';
import { useSidebar } from '@/stores/sidebar';
import { cn } from '@/lib/utils';

export function SidebarSync({ children }: { children: ReactNode }) {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

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
          collapsed ? 'lg:pr-[84px]' : 'lg:pr-[248px]',
        )}
      >
        {children}
      </div>
    </>
  );
}
