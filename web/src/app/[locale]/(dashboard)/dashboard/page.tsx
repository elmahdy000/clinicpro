'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Clock, Users, UserPlus, Stethoscope, Pill, XCircle, Activity,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

const KPI_COLORS = [
  { bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600 dark:text-teal-400', icon: CalendarDays },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
  { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', icon: Activity },
  { bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600 dark:text-blue-400', icon: UserPlus },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', icon: Users },
  { bg: 'bg-red-50 dark:bg-red-950/30', text: 'text-red-600 dark:text-red-400', icon: XCircle },
];

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    CONFIRMED: 'badge-confirmed',
    SCHEDULED: 'badge-pending',
    PENDING: 'badge-waiting',
    WAITING: 'badge-waiting',
  };
  return map[status] || 'badge-pending';
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const tc = useTranslations('common');
  const locale = useLocale();
  const { user } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: () => api.get('/dashboard/recent-activity').then((r) => r.data),
  });

  const kpis = [
    { label: t('todayAppointments'), value: stats?.appointments?.CONFIRMED ?? stats?.appointments?.SCHEDULED ?? 0, sub: `${stats?.appointments?.PENDING ?? 0} ${t('waiting')}` },
    { label: t('waitingPatients'), value: stats?.appointments?.WAITING ?? 0, sub: t('waitingQueue') },
    { label: t('completedToday'), value: stats?.appointments?.COMPLETED ?? 0, sub: tc('today') },
    { label: t('newPatients'), value: stats?.newPatients ?? 0, sub: tc('thisMonth') },
    { label: t('totalPatients'), value: stats?.totalPatients ?? 0, sub: 'All time' },
    { label: t('cancelled'), value: stats?.appointments?.CANCELLED ?? 0, sub: tc('today') },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {t('title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
          <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = KPI_COLORS[i].icon;
          return (
            <Card key={i} className="dashboard-card animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="stat-label">{kpi.label}</p>
                    {isLoading ? (
                      <Skeleton className="h-7 w-14 mt-1" />
                    ) : (
                      <p className="stat-value mt-0.5">{kpi.value}</p>
                    )}
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 truncate">{kpi.sub}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${KPI_COLORS[i].bg} flex-shrink-0`}>
                    <Icon className={`w-[18px] h-[18px] ${KPI_COLORS[i].text}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 md:gap-6">
        <Card className="dashboard-card lg:col-span-2 animate-fade-in-up delay-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600" />
              {t('todaySchedule')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2.5">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : recentActivity?.length ? (
              <div className="space-y-1.5">
                {recentActivity.slice(0, 5).map((apt: any, i: number) => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-150 animate-fade-in-up" style={{ animationDelay: `${i * 50 + 200}ms` }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <Users className="w-[18px] h-[18px] text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {apt.reason || t('checkup')}
                      </p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatTime(apt.appointmentDate, locale)}
                      </p>
                      <span className={statusBadgeClass(apt.status)}>
                        {apt.status === 'COMPLETED' ? t('completed') :
                         apt.status === 'CANCELLED' ? t('cancelled') :
                         apt.status === 'CONFIRMED' ? t('confirmed') :
                         apt.status === 'PENDING' ? t('waiting') : apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('noAppointments')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="dashboard-card animate-fade-in-up delay-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: t('addPatient'), icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', href: `/${locale}/patients/new` },
                { label: t('bookAppointment'), icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', href: `/${locale}/appointments/new` },
                { label: t('startVisit'), icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', href: `/${locale}/visits/new` },
                { label: t('createPrescription'), icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', href: `/${locale}/prescriptions/new` },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href}>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-teal-400 dark:hover:border-teal-500 w-full">
                      <div className={`p-1.5 rounded-lg ${action.bg}`}>
                        <Icon className={`w-4 h-4 ${action.color}`} />
                      </div>
                      <span className="text-[11px] font-medium leading-tight text-center">{action.label}</span>
                    </Button>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="dashboard-card animate-fade-in-up delay-5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                {t('waitingQueue')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivity?.filter((a: any) => a.status === 'PENDING').slice(0, 3).length ? (
                <div className="space-y-1.5">
                  {recentActivity.filter((a: any) => a.status === 'PENDING').slice(0, 3).map((apt: any, i: number) => (
                    <div key={apt.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 animate-fade-in-up" style={{ animationDelay: `${i * 80 + 300}ms` }}>
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {apt.patient?.firstName} {apt.patient?.lastName}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {apt.reason || t('checkup')} &middot; {formatTime(apt.appointmentDate, locale)}
                        </p>
                      </div>
                      <span className="badge-waiting text-[10px]">{t('waiting')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-gray-400">
                  <Clock className="w-5 h-5 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">{t('noAppointments')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
