'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useEffect, ReactNode } from 'react';
import {
  LayoutDashboard, CalendarDays, FileText, Stethoscope, Pill,
  Bell, Building2, LogOut, HeartPulse, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS: { href: string; labelAr: string; labelEn: string; icon: any }[] = [
  { href: '/patient', labelAr: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard },
  { href: '/patient/appointments', labelAr: 'مواعيدي', labelEn: 'My Appointments', icon: CalendarDays },
  { href: '/patient/prescriptions', labelAr: 'الروشتات', labelEn: 'Prescriptions', icon: FileText },
  { href: '/patient/medical-records', labelAr: 'الكشف الطبي', labelEn: 'Medical Records', icon: Stethoscope },
  { href: '/patient/medications', labelAr: 'أدويتي', labelEn: 'My Medications', icon: Pill },
  { href: '/patient/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
  { href: '/patient/clinics', labelAr: 'العيادات', labelEn: 'Clinics', icon: Building2 },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const isRtl = locale === 'ar';

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(`/${locale}/login`);
    }
  }, [user, isLoading, locale, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center animate-pulse">
          <HeartPulse className="w-4 h-4 text-white" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const basePath = `/${locale}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-950 dark:to-slate-900" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`${basePath}/patient`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{isRtl ? 'بوابة المريض' : 'Patient Portal'}</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">{user.name}</span>
            <button
              onClick={() => { logout(); }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              title={isRtl ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === `${basePath}${item.href}` || (item.href !== '/patient' && pathname.startsWith(`${basePath}${item.href}`));
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-900/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {isRtl ? item.labelAr : item.labelEn}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800 px-2 pb-1 pt-1.5 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {NAV_ITEMS.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === `${basePath}${item.href}` || (item.href !== '/patient' && pathname.startsWith(`${basePath}${item.href}`));
            return (
              <Link
                key={item.href}
                href={`${basePath}${item.href}`}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
                  isActive ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500',
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{isRtl ? item.labelAr : item.labelEn}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom padding for mobile nav */}
      <div className="lg:hidden h-20" />
    </div>
  );
}
