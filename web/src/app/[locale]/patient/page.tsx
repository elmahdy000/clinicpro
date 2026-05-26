'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, FileText, Stethoscope, Bell, ChevronLeft, Clock, Building2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function PatientDashboard() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const basePath = `/${locale}/patient`;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-dashboard'],
    queryFn: () => api.get('/patient-portal/dashboard').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Stethoscope className="w-12 h-12 opacity-20 mb-3" />
        <p className="text-sm font-semibold">{isRtl ? 'تعذر تحميل البيانات' : 'Failed to load dashboard'}</p>
        <p className="text-xs mt-1">{isRtl ? 'يرجى المحاولة مرة أخرى' : 'Please try again later'}</p>
      </div>
    );
  }

  const stats = [
    { label: isRtl ? 'المواعيد القادمة' : 'Upcoming', value: data?.upcomingAppointments?.length || 0, icon: CalendarDays, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', href: `${basePath}/appointments` },
    { label: isRtl ? 'الروشتات' : 'Prescriptions', value: data?.recentPrescriptions?.length || 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', href: `${basePath}/prescriptions` },
    { label: isRtl ? 'زيارات سابقة' : 'Visits', value: data?.recentVisits?.length || 0, icon: Stethoscope, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', href: `${basePath}/medical-records` },
    { label: isRtl ? 'إشعارات غير مقروءة' : 'Unread', value: data?.unreadNotifications || 0, icon: Bell, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', href: `${basePath}/notifications` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          {isRtl ? `مرحباً، ${data?.patient?.firstName || data?.patient?.lastName || 'مريضنا العزيز'}` : `Welcome, ${data?.patient?.firstName || data?.patient?.lastName || 'Patient'}`}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {isRtl ? 'نظرة عامة على نشاطك الطبي في العيادات' : 'Overview of your medical activity'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                      <Icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                      <p className="text-xs text-slate-500">{stat.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Appointments */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                {isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments'}
              </h3>
              <Link href={`${basePath}/appointments`} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
                {isRtl ? 'عرض الكل' : 'View all'} <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            {data?.upcomingAppointments?.length > 0 ? (
              <div className="space-y-2">
                {data.upcomingAppointments.map((apt: any) => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                    <div className="w-9 h-9 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatDate(apt.appointmentDate, locale)}</p>
                      <p className="text-xs text-slate-500">{apt.doctor?.user?.name} - {apt.clinic?.name}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 font-semibold">{apt.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">{isRtl ? 'لا توجد مواعيد قادمة' : 'No upcoming appointments'}</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Prescriptions */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                {isRtl ? 'آخر الروشتات' : 'Recent Prescriptions'}
              </h3>
              <Link href={`${basePath}/prescriptions`} className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-0.5">
                {isRtl ? 'عرض الكل' : 'View all'} <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            {data?.recentPrescriptions?.length > 0 ? (
              <div className="space-y-2">
                {data.recentPrescriptions.map((rx: any) => (
                  <div key={rx.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                    <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">روشتة #{rx.id}</p>
                      <p className="text-xs text-slate-500">{formatDate(rx.prescribedDate, locale)} - {rx.doctor?.user?.name}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{rx.clinic?.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">{isRtl ? 'لا توجد روشتات بعد' : 'No prescriptions yet'}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Clinics */}
      {data?.clinics?.length > 0 && (
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
              <Building2 className="w-4 h-4 text-teal-600" />
              {isRtl ? 'العيادات المسجل بها' : 'Your Clinics'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.clinics.map((clinic: any) => (
                <span key={clinic.id} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {clinic.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
