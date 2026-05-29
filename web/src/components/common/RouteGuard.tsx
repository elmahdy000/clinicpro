'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Clock, LogOut, RefreshCw, AlertTriangle } from 'lucide-react';

const DASHBOARD_ALLOWED_ROLES = ['PLATFORM_OWNER', 'CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  const { data: clinicSettings, isLoading: isClinicLoading, refetch } = useQuery({
    queryKey: ['clinic-settings', user?.clinicId],
    queryFn: () => api.get(`/clinics/${user?.clinicId}/settings`).then((r) => r.data),
    enabled: !!user?.clinicId && user?.role !== 'PLATFORM_OWNER',
  });

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace(`/${locale}/login`);
      } else if (!DASHBOARD_ALLOWED_ROLES.includes(user.role)) {
        router.replace(`/${locale}/login`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading || (isClinicLoading && !!user?.clinicId && user?.role !== 'PLATFORM_OWNER')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !DASHBOARD_ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  if (clinicSettings && clinicSettings.subscriptionStatus === 'PENDING') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 md:p-8 space-y-6 text-center transition-all duration-300 transform hover:scale-[1.01]">
          {/* Animated Central Icon with gorgeous blue/teal glow */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 shadow-inner">
            <Clock className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" />
            <div className="absolute inset-0 rounded-2xl border border-blue-400/30 dark:border-blue-400/20 animate-ping opacity-75" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight font-heading">
              {locale === 'ar' ? 'حساب عيادتك قيد المراجعة والتدقيق حالياً' : 'Your Clinic Account is Under Review'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {locale === 'ar' 
                ? 'نشكرك على الانضمام إلى ClinicPro. لمزيد من الأمان وموثوقية المنصة، نقوم بمراجعة كافة طلبات التسجيل يدوياً. سيتم تفعيل حسابك والبدء في استخدامه فور التحقق من البيانات بواسطة إدارة المنصة.'
                : 'Thank you for joining ClinicPro. To ensure platform security and compliance, all new registrations are manually reviewed. Your account will be activated and ready for use as soon as it is vetted by the platform administration.'}
            </p>
          </div>

          {/* Details Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-right text-xs font-semibold space-y-2">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider text-center mb-1">
              {locale === 'ar' ? 'بيانات التسجيل المرسلة' : 'Submitted Registration Info'}
            </span>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/30">
              <span className="text-slate-400">{locale === 'ar' ? 'اسم العيادة:' : 'Clinic Name:'}</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{clinicSettings.name}</span>
            </div>
            {clinicSettings.phone && (
              <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/30">
                <span className="text-slate-400">{locale === 'ar' ? 'رقم الهاتف:' : 'Phone Number:'}</span>
                <span className="text-slate-800 dark:text-slate-200 font-mono font-bold">{clinicSettings.phone}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{locale === 'ar' ? 'حالة الترخيص:' : 'License Status:'}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-150 dark:border-blue-900 text-[10px] font-bold">
                {locale === 'ar' ? 'بانتظار الموافقة' : 'Awaiting Approval'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={() => refetch()} 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-2 py-5.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {locale === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => logout()} 
              className="rounded-xl text-xs font-bold gap-2 py-5.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/15"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (clinicSettings && clinicSettings.subscriptionStatus === 'SUSPENDED') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-6 md:p-8 space-y-6 text-center transition-all duration-300 transform hover:scale-[1.01]">
          {/* Animated Central Icon with red warning glow */}
          <div className="relative w-20 h-20 mx-auto flex items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/50 shadow-inner">
            <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400 animate-bounce" />
            <div className="absolute inset-0 rounded-2xl border border-rose-400/30 dark:border-rose-400/20 animate-pulse" />
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight font-heading">
              {locale === 'ar' ? 'تم إيقاف ترخيص عيادتكم مؤقتاً' : 'Your Clinic License is Suspended'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
              {locale === 'ar' 
                ? 'نأسف لإبلاغكم بأنه تم إيقاف نشاط ترخيص العيادة على المنصة من قبل الإدارة. قد يكون هذا بسبب انتهاء فترة تجديد الاشتراك، فواتير مستحقة، أو لمخالفة معايير الاستخدام. يرجى التواصل مع الدعم الفني لإعادة التنشيط.'
                : 'We regret to inform you that your clinic license has been suspended by the platform administration. This might be due to an overdue subscription payment or terms violation. Please contact platform support for reactivation.'}
            </p>
          </div>

          {/* Details Box */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-right text-xs font-semibold space-y-2">
            <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider text-center mb-1">
              {locale === 'ar' ? 'تفاصيل حالة الترخيص' : 'License Details'}
            </span>
            <div className="flex justify-between items-center py-1 border-b border-slate-100 dark:border-slate-800/30">
              <span className="text-slate-400">{locale === 'ar' ? 'اسم العيادة:' : 'Clinic Name:'}</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold">{clinicSettings.name}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">{locale === 'ar' ? 'حالة الحساب:' : 'Account Status:'}</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-150 dark:border-rose-900 text-[10px] font-bold">
                {locale === 'ar' ? 'موقوف / معطل' : 'Suspended'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button 
              onClick={() => refetch()} 
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold gap-2 py-5.5 shadow-sm transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              {locale === 'ar' ? 'تحديث الحالة' : 'Refresh Status'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => logout()} 
              className="rounded-xl text-xs font-bold gap-2 py-5.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50/50 border-rose-200 dark:border-rose-900/50 dark:hover:bg-rose-950/15"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
