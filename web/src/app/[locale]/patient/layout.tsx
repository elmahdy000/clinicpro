'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useEffect, ReactNode } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  Stethoscope,
  Pill,
  Bell,
  Building2,
  LogOut,
  HeartPulse,
  Settings,
  FolderOpen,
  UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const NAV_ITEMS: { href: string; labelAr: string; labelEn: string; icon: React.ComponentType<{ className?: string }>; key: string }[] = [
  { key: 'home', href: '/patient', labelAr: 'الرئيسية', labelEn: 'Dashboard', icon: LayoutDashboard },
  { key: 'appointments', href: '/patient/appointments', labelAr: 'مواعيدي', labelEn: 'My Appointments', icon: CalendarDays },
  { key: 'prescriptions', href: '/patient/prescriptions', labelAr: 'الروشتات', labelEn: 'Prescriptions', icon: FileText },
  { key: 'medical-records', href: '/patient/medical-records', labelAr: 'الكشف الطبي', labelEn: 'Medical History', icon: Stethoscope },
  { key: 'medications', href: '/patient/medications', labelAr: 'أدويتي', labelEn: 'My Medications', icon: Pill },
  { key: 'files', href: '/patient/files', labelAr: 'ملفاتي', labelEn: 'My Files', icon: FolderOpen },
  { key: 'notifications', href: '/patient/notifications', labelAr: 'الإشعارات', labelEn: 'Notifications', icon: Bell },
  { key: 'clinics', href: '/patient/clinics', labelAr: 'العيادات', labelEn: 'Clinics', icon: Building2 },
  { key: 'settings', href: '/patient/settings', labelAr: 'الإعدادات', labelEn: 'Settings', icon: Settings },
];

const MOBILE_NAV_KEYS = ['home', 'appointments', 'prescriptions', 'notifications'];

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

  const { data: overview } = useQuery({
    queryKey: ['patient-overview-layout'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/overview').then((r) => r.data),
    enabled: !!user,
  });

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
  const navItems = NAV_ITEMS.filter((item) => {
    if (item.key === 'files') return Boolean(overview?.clinicAccess?.canViewFiles);
    return true;
  });

  const profileName = overview?.patient?.fullName || user.name;
  const profilePhone = overview?.patient?.phone || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30" dir={isRtl ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`${basePath}/patient`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <HeartPulse className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm text-slate-800">بوابة المريض</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <UserCircle2 className="w-5 h-5 text-teal-600" />
              <div className="leading-tight text-right">
                <p className="text-xs font-semibold text-slate-800">{profileName}</p>
                <p className="text-[11px] text-slate-500">{profilePhone}</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              title={isRtl ? 'تسجيل الخروج' : 'Logout'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
        <nav className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-20 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === `${basePath}${item.href}` || (item.href !== '/patient' && pathname.startsWith(`${basePath}${item.href}`));
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {isRtl ? item.labelAr : item.labelEn}
                </Link>
              );
            })}
          </div>
        </nav>

        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-2 pb-1 pt-1.5 safe-area-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems
            .filter((item) => MOBILE_NAV_KEYS.includes(item.key))
            .map((item) => {
              const Icon = item.icon;
              const isActive = pathname === `${basePath}${item.href}` || (item.href !== '/patient' && pathname.startsWith(`${basePath}${item.href}`));
              return (
                <Link
                  key={item.href}
                  href={`${basePath}${item.href}`}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors',
                    isActive ? 'text-teal-600' : 'text-slate-400',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{isRtl ? item.labelAr : item.labelEn}</span>
                </Link>
              );
            })}
        </div>
      </nav>

      <div className="lg:hidden h-20" />
    </div>
  );
}
