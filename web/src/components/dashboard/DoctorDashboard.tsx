'use client';

import { useLocale } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Clock, Users, Stethoscope, Pill, FileText,
  CheckCircle2, Play, Sparkles, DollarSign, ClipboardList,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { toast } from 'sonner';

interface DoctorDashboardStats {
  doctorId: number;
  todayAppointments: { total: number; byStatus: Record<string, number> };
  upcomingAppointments: number;
  patientsSeen: number;
  prescriptionsThisMonth: number;
  visitsThisMonth: number;
  revenueThisMonth: number;
  nextInQueue: ScheduleItem | null;
  generatedAt: string;
}

interface ScheduleItem {
  id: number;
  appointmentDate: string;
  status: string;
  reason?: string;
  queuePosition?: number | null;
  patient?: { id: number; firstName: string; lastName: string };
}

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    CONFIRMED: 'badge-confirmed', IN_PROGRESS: 'badge-confirmed',
    PENDING: 'badge-waiting', WAITING: 'badge-waiting',
  };
  return m[s] || 'badge-pending';
};

export default function DoctorDashboard() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery<DoctorDashboardStats>({
    queryKey: ['doctor-dash-stats'],
    queryFn: () => api.get('/doctors/me/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: schedule, isLoading: scheduleLoading } = useQuery<ScheduleItem[]>({
    queryKey: ['doctor-dash-schedule'],
    queryFn: () => api.get('/doctors/me/schedule').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const callPatient = useMutation({
    mutationFn: (id: number) => api.put(`/appointments/${id}/call`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-dash-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['doctor-dash-stats'] });
    },
    onError: () => {
      toast.error(isRtl ? 'تعذّر نداء المريض. حاول مرة أخرى.' : 'Could not call the patient. Please try again.');
    },
  });

  const today = new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const nextPatient = stats?.nextInQueue;

  const kpis = [
    { label: isRtl ? 'مواعيد اليوم' : "Today's appointments", value: stats?.todayAppointments?.total ?? 0, sub: `${stats?.todayAppointments?.byStatus?.CONFIRMED ?? 0} ${isRtl ? 'مؤكد' : 'confirmed'}`, icon: CalendarDays, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: isRtl ? 'في الانتظار' : 'Waiting', value: (stats?.todayAppointments?.byStatus?.CONFIRMED ?? 0) + (stats?.todayAppointments?.byStatus?.IN_PROGRESS ?? 0), sub: isRtl ? 'في قائمة الانتظار' : 'In queue', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: isRtl ? 'مكتمل اليوم' : 'Completed today', value: stats?.todayAppointments?.byStatus?.COMPLETED ?? 0, sub: isRtl ? 'اليوم' : 'Today', icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: isRtl ? 'مرضاي' : 'My patients', value: stats?.patientsSeen ?? 0, sub: isRtl ? 'كل الأوقات' : 'All time', icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: isRtl ? 'روشتات هذا الشهر' : 'Prescriptions (month)', value: stats?.prescriptionsThisMonth ?? 0, sub: isRtl ? 'هذا الشهر' : 'This month', icon: Pill, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: isRtl ? 'كشوفات هذا الشهر' : 'Visits (month)', value: stats?.visitsThisMonth ?? 0, sub: isRtl ? 'هذا الشهر' : 'This month', icon: ClipboardList, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30' },
  ];

  return (
    <div className="space-y-5 md:space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in-down">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {isRtl ? `مرحباً، د. ${user?.name?.split(' ')[0]} 👋` : `Welcome, Dr. ${user?.name?.split(' ')[0]} 👋`}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{today}</p>
        </div>
        <Link href={`/${locale}/visits/new`}>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1.5 shadow-md shadow-teal-500/25 transition-all">
            <Stethoscope className="w-4 h-4" />
            {isRtl ? 'كشف جديد' : 'New Consultation'}
          </Button>
        </Link>
      </div>

      {/* ── Next Patient banner ── */}
      {nextPatient && (
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 dark:border-teal-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                <Sparkles className="w-3 h-3 text-teal-500" />
                {isRtl ? 'المريض التالي في قائمة الانتظار' : 'Next Patient in Queue'}
              </span>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mt-1">
                {nextPatient.patient?.firstName} {nextPatient.patient?.lastName}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isRtl ? 'السبب:' : 'Reason:'} {nextPatient.reason || (isRtl ? 'كشف طبي' : 'Checkup')} &middot; {formatTime(nextPatient.appointmentDate, locale)}
              </p>
            </div>
          </div>
          <Link href={`/${locale}/visits/new?patientId=${nextPatient.patient?.id}&appointmentId=${nextPatient.id}`} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700 text-white gap-2 px-5 py-5 rounded-xl shadow-lg shadow-teal-500/20 text-xs font-bold transition-all hover:scale-[1.02]">
              <Play className="w-4 h-4 fill-white" />
              {isRtl ? 'دخول المريض وبدء الكشف' : 'Call Patient & Start Visit'}
            </Button>
          </Link>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="dashboard-card animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-right">
                    <p className="stat-label">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-7 w-14 mt-1" /> : <p className="stat-value mt-0.5">{kpi.value}</p>}
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 line-clamp-1 leading-normal" dir="auto">{kpi.sub}</p>
                  </div>
                  <div className={`p-2 rounded-xl ${kpi.bg} flex-shrink-0`}>
                    <Icon className={`w-[18px] h-[18px] ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Today's schedule + side column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* My schedule today */}
        <Card className="dashboard-card lg:col-span-2 animate-fade-in-up delay-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600" />
              {isRtl ? 'جدول اليوم' : "Today's Schedule"}
              {(schedule?.length ?? 0) > 0 && (
                <span className="ms-auto text-xs font-normal bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                  {schedule!.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduleLoading ? (
              <div className="space-y-2.5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : schedule?.length ? (
              <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
                {schedule.map((apt, i) => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    {apt.queuePosition != null && (
                      <div className="w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center flex-shrink-0 text-xs font-bold text-teal-700 dark:text-teal-300">
                        {apt.queuePosition}
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-teal-700 dark:text-teal-300">
                      {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{apt.reason || (isRtl ? 'كشف طبي' : 'Checkup')} &middot; {formatTime(apt.appointmentDate, locale)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={statusBadgeClass(apt.status)}>
                        {apt.status === 'IN_PROGRESS' ? (isRtl ? 'جارٍ' : 'In progress') : apt.status === 'CONFIRMED' ? (isRtl ? 'مؤكد' : 'Confirmed') : apt.status}
                      </span>
                      {apt.status === 'CONFIRMED' && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-[11px] gap-1 hover:border-teal-400"
                          disabled={callPatient.isPending}
                          onClick={() => callPatient.mutate(apt.id)}>
                          <Play className="w-3 h-3" />
                          {isRtl ? 'نداء' : 'Call'}
                        </Button>
                      )}
                      <Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}&appointmentId=${apt.id}`}>
                        <Button size="sm" className="h-7 px-2 text-[11px] bg-teal-600 hover:bg-teal-700">
                          {isRtl ? 'بدء' : 'Start'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{isRtl ? 'لا توجد مواعيد اليوم' : 'No appointments today'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side: quick actions + month summary */}
        <div className="space-y-5">
          <Card className="dashboard-card animate-fade-in-up delay-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{isRtl ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: isRtl ? 'كشف جديد' : 'New visit', icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', href: `/${locale}/visits/new` },
                { label: isRtl ? 'طابور الانتظار' : 'Queue', icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', href: `/${locale}/queue` },
                { label: isRtl ? 'مرضاي' : 'My patients', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', href: `/${locale}/patients?mine=1` },
                { label: isRtl ? 'روشتاتي' : 'My prescriptions', icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', href: `/${locale}/prescriptions?mine=1` },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Button variant="outline" className="h-auto py-3 flex-col gap-1.5 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-teal-400 w-full transition-all">
                      <div className={`p-1.5 rounded-lg ${action.bg}`}><Icon className={`w-4 h-4 ${action.color}`} /></div>
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
                <FileText className="w-4 h-4 text-blue-600" />
                {isRtl ? 'ملخص الشهر' : 'Month Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2.5">
                {[
                  { label: isRtl ? 'مواعيد قادمة' : 'Upcoming appointments', value: stats?.upcomingAppointments ?? 0, icon: CalendarDays, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
                  { label: isRtl ? 'كشوفات هذا الشهر' : 'Visits (month)', value: stats?.visitsThisMonth ?? 0, icon: ClipboardList, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
                  { label: isRtl ? 'روشتات هذا الشهر' : 'Prescriptions (month)', value: stats?.prescriptionsThisMonth ?? 0, icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                  { label: isRtl ? 'إيراد هذا الشهر' : 'Revenue (month)', value: `${(stats?.revenueThisMonth ?? 0).toLocaleString()} ${isRtl ? 'ج.م' : 'EGP'}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/60 dark:bg-gray-900/30">
                      <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 text-right">{item.label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white text-left">{isLoading ? '…' : item.value}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
