import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarProvider } from '@/stores/sidebar';
import { SidebarSync } from '@/components/layout/SidebarSync';
import { RouteGuard } from '@/components/common/RouteGuard';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <RouteGuard>
      <div className="min-h-screen bg-gray-50/60 dark:bg-gray-950">
        <Sidebar />
        <SidebarSync>
          <Header />
          <main className="px-3 py-4 md:px-4 md:py-5 lg:px-5 lg:py-6">
            <div className="mx-auto max-w-[1320px]">
              {children}
            </div>
          </main>
        </SidebarSync>
      </div>
      </RouteGuard>
    </SidebarProvider>
  );
}
