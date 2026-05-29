'use client';

import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { useSidebar } from '@/stores/sidebar';
import { getInitials } from '@/lib/utils';
import { Bell, Plus, Menu, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/common/SearchBox';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

const pathTitles: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/queue': 'queue',
  '/patients': 'patients',
  '/patients/new': 'patients',
  '/patients/[id]': 'patients',
  '/patients/[id]/edit': 'patients',
  '/appointments': 'appointments',
  '/appointments/new': 'appointments',
  '/visits/new': 'visits',
  '/prescriptions': 'prescriptions',
  '/files': 'files',
  '/reports': 'reports',
  '/notifications': 'notifications',
  '/settings': 'settings',
  '/profile': 'profile',
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();
  const { user, activeBranchId, setActiveBranchId } = useAuth();
  const { setMobileOpen } = useSidebar();

  const { data: clinicSettings } = useQuery({
    queryKey: ['clinic-settings', user?.clinicId],
    queryFn: () => api.get(`/clinics/${user?.clinicId}/settings`).then((r) => r.data),
    enabled: !!user?.clinicId && user?.role !== 'PLATFORM_OWNER',
  });

  const branches = clinicSettings?.branches 
    ? (typeof clinicSettings.branches === 'string' ? JSON.parse(clinicSettings.branches) : clinicSettings.branches)
    : [];
  const hasMultipleBranches = branches.length > 0;

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    enabled: !!user,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  const segments = pathname.split('/').slice(2);
  const rawBasePath = '/' + segments.join('/') || '/dashboard';
  const basePath = segments[0] === 'patients' && segments[1] && segments[1] !== 'new'
    ? (segments[2] === 'edit' ? '/patients/[id]/edit' : '/patients/[id]')
    : rawBasePath;
  const hideTitle = ['/patients', '/patients/new'].includes(basePath);
  const titleKey = pathTitles[basePath] || 'dashboard';
  const title = titleKey === 'notifications' ? 'Notifications' : t(`${titleKey}.title`);

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    router.push(`/${locale}/patients${q ? `?search=${encodeURIComponent(q)}` : ''}`);
  };
  const subscriptionStatus = clinicSettings?.subscriptionStatus;
  const billingStatus = clinicSettings?.billingStatus;
  const trialEndsAt = clinicSettings?.trialEndsAt;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm">
      <div className="h-14 md:h-16 px-3 md:px-5 grid grid-cols-3 items-center gap-2 md:gap-4">

        {/* Right zone: hamburger + page title */}
        <div className="flex items-center gap-2 min-w-0 justify-start">
          <Button variant="ghost" size="icon" className="lg:hidden flex-shrink-0 -ms-1.5" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu">
            <Menu className="w-5 h-5" />
          </Button>
          {!hideTitle && (
            <h1 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h1>
          )}
          {user?.role !== 'PLATFORM_OWNER' && (
            <div className="flex items-center gap-1 ms-2 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
              <select
                value={activeBranchId || 'main'}
                onChange={(e) => setActiveBranchId(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 border-none outline-none focus:ring-0 cursor-pointer"
              >
                <option value="main">{locale === 'ar' ? 'الفرع الرئيسي' : 'Main Branch'}</option>
                {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name || 'فرع إضافي'}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Center zone: global patient search */}
        <div className="flex justify-center">
          {user?.role !== 'PLATFORM_OWNER' && (
            <form onSubmit={handleSearchSubmit} className="hidden md:block w-full max-w-sm">
              <SearchBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t('patients.searchPatients')}
              />
            </form>
          )}
        </div>

        {/* Left zone: actions + notifications + user */}
        <div className="flex items-center gap-1 md:gap-2 justify-end">
          {user?.role !== 'PLATFORM_OWNER' && (
            <Link href={`/${locale}/appointments/new`}>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex gap-1.5 h-8 border-slate-200 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 px-2.5 rounded-lg text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{t('appointments.addNew')}</span>
              </Button>
            </Link>
          )}

          <Link href={`/${locale}/notifications`}>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open notifications"
              className="relative text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {user && (
            <Link href={`/${locale}/profile`} className="flex items-center gap-2 group flex-shrink-0 -me-1.5 md:me-0 ps-1 md:ps-1.5 border-s border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold shadow-sm transition-transform duration-150 group-hover:scale-110">
                {getInitials(user.name)}
              </div>
              <div className="hidden lg:block text-xs leading-tight">
                <p className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[120px]">{user.name}</p>
              </div>
            </Link>
          )}
        </div>

      </div>
    </header>
    {user?.role !== 'PLATFORM_OWNER' && (
      <div className="z-10">
        {subscriptionStatus === 'SUSPENDED' && (
          <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-900/50 px-4 py-2 flex flex-wrap items-center justify-center gap-1.5 text-red-700 dark:text-red-400 text-xs font-bold text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{locale === 'ar' ? 'تم تعليق الاشتراك. يرجى تجديد اشتراكك للاستمرار في استخدام النظام.' : 'Subscription suspended. Please renew your subscription to continue using the system.'}</span>
          </div>
        )}
        {subscriptionStatus === 'TRIAL' && trialEndsAt && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/50 px-4 py-2 flex flex-wrap items-center justify-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-bold text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              {locale === 'ar' 
                ? `أنت تستخدم النظام في الفترة التجريبية. تنتهي الفترة في ${new Date(trialEndsAt).toLocaleDateString('ar-EG')}.` 
                : `You are in the trial period. Your trial ends on ${new Date(trialEndsAt).toLocaleDateString('en-US')}.`}
            </span>
          </div>
        )}
        {subscriptionStatus === 'ACTIVE' && billingStatus === 'OVERDUE' && (
          <div className="bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900/50 px-4 py-2 flex flex-wrap items-center justify-center gap-1.5 text-orange-700 dark:text-orange-400 text-xs font-bold text-center">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{locale === 'ar' ? 'يوجد فواتير متأخرة السداد. يرجى سدادها لتجنب تعليق الخدمة.' : 'You have overdue invoices. Please pay them to avoid service suspension.'}</span>
          </div>
        )}
      </div>
    )}
    </>
  );
}
