'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Clock, Users, UserPlus, Stethoscope, Pill,
  XCircle, Activity, FileText, TrendingUp, Receipt,
  CheckCircle2, AlertCircle, Play, Sparkles
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import TopPrescribedMedicinesCard from './TopPrescribedMedicinesCard';

const statusBadgeClass = (s: string) => {
  const m: Record<string, string> = {
    COMPLETED: 'badge-completed', CANCELLED: 'badge-cancelled',
    CONFIRMED: 'badge-confirmed', SCHEDULED: 'badge-pending',
    PENDING: 'badge-waiting', WAITING: 'badge-waiting',
  };
  return m[s] || 'badge-pending';
};

const KPI_COLORS = [
  { bg: 'bg-teal-50 dark:bg-teal-950/30',   text: 'text-teal-600 dark:text-teal-400',   icon: CalendarDays },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600 dark:text-amber-400', icon: Clock },
  { bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600 dark:text-green-400', icon: CheckCircle2 },
  { bg: 'bg-blue-50 dark:bg-blue-950/30',   text: 'text-blue-600 dark:text-blue-400',   icon: UserPlus },
  { bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600 dark:text-purple-400', icon: Users },
  { bg: 'bg-red-50 dark:bg-red-950/30',     text: 'text-red-600 dark:text-red-400',     icon: XCircle },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; unit?: string }>;
  label?: string;
  isRtl: boolean;
}

interface WeeklyTrendItem {
  dayIdx: number;
  appointments: number;
  revenue: number;
}

interface TopMedication {
  name: string;
  prescribedCount: number;
}

interface ActivityItem {
  id: string;
  patient?: { firstName: string; lastName: string; id?: string };
  doctor?: { user: { name: string } };
  appointmentDate: string;
  reason?: string;
  status: string;
}

interface PrescriptionItem {
  id: string;
  patient?: { firstName: string; lastName: string; id?: string };
  items?: Array<{ medication?: { name: string } }>;
  prescribedDate: string;
}

interface InvoiceItem {
  id: string;
  patient?: { firstName: string; lastName: string; id?: string };
  invoiceNumber: string;
  total: number;
  status: string;
  createdAt: string;
}

interface ClinicDashboardStats {
  todayAppointments: Record<string, number>;
  newPatients: number;
  totalPatients: number;
  weekAppointmentsCount: number;
  newPatientsThisWeek: number;
  prescriptions: { thisMonth: number };
  revenue: { thisMonth: number; byStatus: { PENDING: { count: number } } };
  pharmaAnalytics: { topMedications: TopMedication[] };
  weeklyTrend: WeeklyTrendItem[];
}

function CustomTooltip({ active, payload, label, isRtl }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shadow-lg text-right" dir={isRtl ? 'rtl' : 'ltr'}>
        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</p>
        {payload.map((item, i: number) => (
          <p key={i} className="text-[11px] font-semibold mt-1" style={{ color: item.color }}>
            {item.name}: {item.value.toLocaleString()} {item.unit || ''}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function ClinicDashboard() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useAuth();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: stats, isLoading } = useQuery<ClinicDashboardStats>({
    queryKey: ['clinic-dash-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: recentActivity } = useQuery<ActivityItem[]>({
    queryKey: ['clinic-dash-recent'],
    queryFn: () => api.get('/dashboard/recent-activity').then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: recentPrescriptions } = useQuery<PrescriptionItem[]>({
    queryKey: ['clinic-dash-rx'],
    queryFn: () => api.get('/dashboard/recent-prescriptions').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: recentInvoices } = useQuery<InvoiceItem[]>({
    queryKey: ['clinic-dash-inv'],
    queryFn: () => api.get('/dashboard/recent-invoices').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const totalToday = Object.values(stats?.todayAppointments ?? {}).reduce((a: number, b: number) => a + b, 0);
  const pendingQueue = (recentActivity ?? []).filter((a) => a.status === 'PENDING' || a.status === 'WAITING');
  
  // Call Next Patient banner calculation
  const nextPatient = pendingQueue[0];

  const kpis = [
    { label: t('todayAppointments'), value: totalToday, sub: `${stats?.todayAppointments?.PENDING ?? 0} ${t('waiting')}` },
    { label: t('waitingPatients'), value: (stats?.todayAppointments?.PENDING ?? 0) + (stats?.todayAppointments?.WAITING ?? 0), sub: t('waitingQueue') },
    { label: t('completedToday'), value: stats?.todayAppointments?.COMPLETED ?? 0, sub: isRtl ? 'اليوم' : 'Today' },
    { label: t('newPatients'), value: stats?.newPatients ?? 0, sub: isRtl ? 'هذا الشهر' : 'This month' },
    { label: t('totalPatients'), value: stats?.totalPatients ?? 0, sub: isRtl ? 'كل الأوقات' : 'All time' },
    { label: t('cancelled'), value: stats?.todayAppointments?.CANCELLED ?? 0, sub: isRtl ? 'اليوم' : 'Today' },
  ];

  const today = new Date().toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Dynamic weekly trend data aggregated from backend (representing patient load & revenue growth)
  const weeklyTrendData = stats?.weeklyTrend?.map((item: WeeklyTrendItem) => ({
    day: isRtl ? dayNamesAr[item.dayIdx] : dayNamesEn[item.dayIdx],
    appointments: item.appointments,
    revenue: item.revenue,
  })) || [
    { day: isRtl ? 'السبت' : 'Sat', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الأحد' : 'Sun', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الإثنين' : 'Mon', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الثلاثاء' : 'Tue', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الأربعاء' : 'Wed', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الخميس' : 'Thu', appointments: 0, revenue: 0 },
    { day: isRtl ? 'الجمعة' : 'Fri', appointments: 0, revenue: 0 },
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
        <Link href={`/${locale}/appointments/new`}>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1.5 shadow-md shadow-teal-500/25 transition-all">
            <CalendarDays className="w-4 h-4" />
            {isRtl ? 'موعد جديد' : 'New Appointment'}
          </Button>
        </Link>
      </div>

      {/* ── Glowing Next Patient banner (Instant Call-to-action) ── */}
      {nextPatient && (
        <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent border border-teal-500/20 dark:border-teal-400/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse-subtle">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center flex-shrink-0 animate-bounce-subtle">
              <Stethoscope className="w-6 h-6 animate-pulse" />
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
              <Play className="w-4 h-4 fill-white animate-pulse" />
              {isRtl ? 'دخول المريض وبدء الكشف' : 'Call Patient & Start Visit'}
            </Button>
          </Link>
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi, i) => {
          const Icon = KPI_COLORS[i].icon;
          return (
            <Card key={i} className="dashboard-card animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-right">
                    <p className="stat-label">{kpi.label}</p>
                    {isLoading ? <Skeleton className="h-7 w-14 mt-1" /> : <p className="stat-value mt-0.5">{kpi.value}</p>}
                    <p className="text-[10px] md:text-xs text-gray-400 mt-0.5 line-clamp-1 leading-normal" dir="auto">{kpi.sub}</p>
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

      {/* ── Visual Analytics Section (WOW Factor Interactive Charts) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart 1: Appointments & Patients Flow (Area Chart) */}
        <Card className="dashboard-card lg:col-span-2 animate-fade-in-up delay-2">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" />
                {isRtl ? 'تدفق المرضى والنشاط الأسبوعي' : 'Weekly Patient Load & Activity'}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {isRtl ? 'محدث تلقائياً' : 'Live updates'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[220px] w-full">
              {isMounted && (
                <ResponsiveContainer minWidth={0} width="100%" height="100%">
                  <AreaChart data={weeklyTrendData} margin={{ top: 10, right: 15, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01}/>
                      </linearGradient>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip content={<CustomTooltip isRtl={isRtl} />} />
                    <Area type="monotone" dataKey="appointments" name={isRtl ? 'عدد الحالات' : 'Total Cases'} stroke="#0d9488" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisits)" />
                    <Area type="monotone" dataKey="revenue" name={isRtl ? 'النشاط التقديري (ج.م)' : 'Activity (EGP)'} stroke="#16a34a" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Top Prescribed Medications (Ranked Medical Insight Card) */}
        <TopPrescribedMedicinesCard locale={locale} isRtl={isRtl} />

      </div>

      {/* ── Row 4: Schedule + Quick Actions + Queue ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Today Schedule */}
        <Card className="dashboard-card lg:col-span-2 animate-fade-in-up delay-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-teal-600" />
              {t('todaySchedule')}
              {(recentActivity?.length ?? 0) > 0 && (
                <span className="ms-auto text-xs font-normal bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                  {recentActivity!.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2.5">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
            ) : recentActivity?.length ? (
              <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
                {recentActivity.map((apt, i) => (
                  <div key={apt.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-100 to-blue-100 dark:from-teal-900/30 dark:to-blue-900/30 flex items-center justify-center flex-shrink-0 text-sm font-bold text-teal-700 dark:text-teal-300">
                      {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {apt.doctor?.user?.name ? `${isRtl ? 'د.' : 'Dr.'} ${apt.doctor.user.name}` : apt.reason || t('checkup')}
                      </p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatTime(apt.appointmentDate, locale)}</p>
                      <span className={statusBadgeClass(apt.status)}>
                        {apt.status === 'COMPLETED' ? t('completed') : apt.status === 'CANCELLED' ? t('cancelled') : apt.status === 'CONFIRMED' ? t('confirmed') : apt.status === 'PENDING' ? t('waiting') : apt.status}
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

        {/* Quick Actions + Queue */}
        <div className="space-y-5">
          <Card className="dashboard-card animate-fade-in-up delay-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{t('quickActions')}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {[
                { label: t('addPatient'), icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', href: `/${locale}/patients/new` },
                { label: t('bookAppointment'), icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', href: `/${locale}/appointments/new` },
                { label: t('startVisit'), icon: Stethoscope, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', href: `/${locale}/visits/new` },
                { label: t('createPrescription'), icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30', href: `/${locale}/visits/new` },
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
                <Clock className="w-4 h-4 text-amber-600" />
                {t('waitingQueue')}
                {pendingQueue.length > 0 && (
                  <span className="ms-auto text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">{pendingQueue.length}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingQueue.slice(0, 5).length ? (
                <div className="space-y-1.5">
                  {pendingQueue.slice(0, 5).map((apt, i) => (
                    <div key={apt.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-amber-700">{apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                        <p className="text-[10px] text-gray-500 truncate">{apt.reason || t('checkup')} &middot; {formatTime(apt.appointmentDate, locale)}</p>
                      </div>
                      <span className="badge-waiting text-[10px]">{t('waiting')}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-gray-400">
                  <Clock className="w-5 h-5 mx-auto mb-1 opacity-40" />
                  <p className="text-xs">{isRtl ? 'لا يوجد انتظار الآن' : 'No queue right now'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Row 5: Prescriptions + Invoices + Weekly Summary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Prescriptions — "الروشتات" */}
        <Card className="dashboard-card animate-fade-in-up delay-5">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              {isRtl ? 'آخر الروشتات' : 'Recent Prescriptions'}
            </CardTitle>
            <Link href={`/${locale}/prescriptions`}>
              <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">{isRtl ? 'الكل' : 'View all'}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentPrescriptions ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentPrescriptions.length ? (
              <div className="space-y-2">
                {recentPrescriptions.map((rx) => (
                  <Link key={rx.id} href={`/${locale}/prescriptions/${rx.id}`}>
                    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-purple-700">
                        {rx.patient?.firstName?.[0]}{rx.patient?.lastName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{rx.patient?.firstName} {rx.patient?.lastName}</p>
                        <p className="text-[10px] text-gray-500 line-clamp-1 leading-normal" dir="auto">
                          {rx.items?.slice(0, 2).map((it) => it.medication?.name).filter(Boolean).join('، ') || (isRtl ? 'روشتة طبية' : 'Prescription')}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(rx.prescribedDate, locale)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <FileText className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد روشتات بعد' : 'No prescriptions yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="dashboard-card animate-fade-in-up delay-5">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-green-600" />
              {isRtl ? 'آخر الفواتير' : 'Recent Invoices'}
            </CardTitle>
            <Link href={`/${locale}/reports`}>
              <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">{isRtl ? 'الكل' : 'View all'}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {!recentInvoices ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : recentInvoices.length ? (
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${inv.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/40' : 'bg-amber-100 dark:bg-amber-900/40'}`}>
                      {inv.status === 'PAID' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{inv.patient?.firstName} {inv.patient?.lastName}</p>
                      <p className="text-[10px] text-gray-500">#{inv.invoiceNumber}</p>
                    </div>
                    <div className="text-left flex-shrink-0">
                      <p className="text-xs font-bold text-green-600">{inv.total?.toLocaleString()} ج.م</p>
                      <p className="text-[10px] text-gray-400">{formatDate(inv.createdAt, locale)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Receipt className="w-6 h-6 mx-auto mb-1 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد فواتير بعد' : 'No invoices yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card className="dashboard-card animate-fade-in-up delay-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {isRtl ? 'ملخص الفترة' : 'Period Summary'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5">
              {[
                { label: isRtl ? 'مواعيد هذا الأسبوع' : 'Appointments (week)', value: stats?.weekAppointmentsCount ?? 0, icon: CalendarDays, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
                { label: isRtl ? 'مرضى جدد هذا الأسبوع' : 'New patients (week)', value: stats?.newPatientsThisWeek ?? 0, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                { label: isRtl ? 'روشتات هذا الشهر' : 'Prescriptions (month)', value: stats?.prescriptions?.thisMonth ?? 0, icon: Pill, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
                { label: isRtl ? 'إيراد هذا الشهر' : 'Revenue (month)', value: `${(stats?.revenue?.thisMonth ?? 0).toLocaleString()} ج.م`, icon: Activity, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
                { label: isRtl ? 'فواتير معلقة' : 'Pending invoices', value: stats?.revenue?.byStatus?.PENDING?.count ?? 0, icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
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
  );
}
