'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Users, Stethoscope, Pill, CalendarDays,
  Activity, TrendingUp, ChevronRight, Globe,
} from 'lucide-react';

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PRO: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  ENTERPRISE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  TRIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function AdminDashboard() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['admin-dash-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 60_000,
  });

  const { data: clinics, isLoading: clinicsLoading } = useQuery<any[]>({
    queryKey: ['admin-dash-clinics'],
    queryFn: () => api.get('/clinics').then((r) => r.data),
    refetchInterval: 120_000,
  });

  const topKpis = [
    {
      label: isRtl ? 'عدد العيادات' : 'Total Clinics',
      value: stats?.clinicsCount ?? 0,
      sub: isRtl ? 'مشتركة في المنصة' : 'Subscribed',
      icon: Building2, bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600',
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'إجمالي المرضى' : 'Total Patients',
      value: stats?.patients ?? 0,
      sub: isRtl ? 'في كل العيادات' : 'Across all clinics',
      icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/30', text: 'text-blue-600',
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'إجمالي الأطباء' : 'Total Doctors',
      value: stats?.doctors ?? 0,
      sub: isRtl ? 'مسجلون بالمنصة' : 'Registered',
      icon: Stethoscope, bg: 'bg-purple-50 dark:bg-purple-950/30', text: 'text-purple-600',
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'إجمالي المواعيد' : 'Total Appointments',
      value: Object.values(stats?.appointments ?? {}).reduce((a: any, b: any) => a + b, 0) as number,
      sub: isRtl ? 'كل الأوقات' : 'All time',
      icon: CalendarDays, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600',
      href: `/${locale}/reports`,
    },
    {
      label: isRtl ? 'قاموس الأدوية' : 'Medicine Dictionary',
      value: isRtl ? 'إدارة' : 'Manage',
      sub: isRtl ? 'أدوية الروشتات' : 'Prescription medicines',
      icon: Pill, bg: 'bg-pink-50 dark:bg-pink-950/30', text: 'text-pink-600',
      href: `/${locale}/medications`,
    },
    {
      label: isRtl ? 'إيرادات المنصة' : 'Platform Revenue',
      value: `${(stats?.revenue?.total ?? 0).toLocaleString()} ج.م`,
      sub: isRtl ? 'الإجمالي المحصّل' : 'Total collected',
      icon: Activity, bg: 'bg-green-50 dark:bg-green-950/30', text: 'text-green-600',
      href: `/${locale}/reports`,
    },
  ];

  const avgRevenuePerClinic = stats?.clinicsCount
    ? Math.round((stats?.revenue?.total || 0) / stats.clinicsCount)
    : 0;
  const avgPatientsPerClinic = stats?.clinicsCount
    ? Math.round((stats?.patients || 0) / stats.clinicsCount)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
              {isRtl ? 'لوحة إدارة المنصة' : 'Platform Admin Dashboard'}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'نظرة عامة على المنصة' : 'Platform Overview'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link href={`/${locale}/clinics`}>
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1.5 hidden sm:flex">
            <Building2 className="w-4 h-4" />
            {isRtl ? 'إدارة العيادات' : 'Manage Clinics'}
          </Button>
        </Link>
      </div>

      {/* ── Platform KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {topKpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link key={i} href={kpi.href}>
              <Card className="dashboard-card hover:shadow-md hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer animate-fade-in-up group" style={{ animationDelay: `${i * 60}ms` }}>
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="stat-label">{kpi.label}</p>
                      {isLoading ? <Skeleton className="h-7 w-14 mt-1" /> : <p className="stat-value mt-0.5">{kpi.value}</p>}
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{kpi.sub}</p>
                    </div>
                    <div className={`p-2 rounded-xl ${kpi.bg} flex-shrink-0`}>
                      <Icon className={`w-[18px] h-[18px] ${kpi.text}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Row 2: Platform Averages + Top Medications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Platform Health */}
        <Card className="dashboard-card animate-fade-in-up delay-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {isRtl ? 'صحة المنصة' : 'Platform Health'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/30">
                <h4 className="text-xs font-medium text-blue-600 mb-1">{isRtl ? 'متوسط إيراد العيادة' : 'Avg Clinic Revenue'}</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? <Skeleton className="h-7 w-20 inline-block" /> : `${avgRevenuePerClinic.toLocaleString()}`}
                  <span className="text-sm text-gray-500 font-normal"> ج.م</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border border-teal-100/50 dark:border-teal-900/30">
                <h4 className="text-xs font-medium text-teal-600 mb-1">{isRtl ? 'متوسط مرضى العيادة' : 'Avg Patients/Clinic'}</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? <Skeleton className="h-7 w-16 inline-block" /> : avgPatientsPerClinic.toLocaleString()}
                  <span className="text-sm text-gray-500 font-normal"> {isRtl ? 'مريض' : 'patients'}</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-100/50 dark:border-purple-900/30">
                <h4 className="text-xs font-medium text-purple-600 mb-1">{isRtl ? 'إيراد هذا الشهر' : 'This Month Revenue'}</h4>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isLoading ? <Skeleton className="h-7 w-24 inline-block" /> : `${(stats?.revenue?.thisMonth ?? 0).toLocaleString()}`}
                  <span className="text-sm text-gray-500 font-normal"> ج.م</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Medications — Pharma Analytics */}
        <Card className="dashboard-card lg:col-span-2 animate-fade-in-up delay-4">
          <CardHeader className="pb-2 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4 text-purple-600" />
              {isRtl ? 'الأدوية الأكثر وصفاً (كل المنصة)' : 'Top Prescribed Medications (Platform-wide)'}
            </CardTitle>
            <Link href={`/${locale}/medications`}>
              <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">{isRtl ? 'قاموس الأدوية' : 'Medicine Dict'}</span>
            </Link>
          </CardHeader>
          <CardContent>
            {stats?.pharmaAnalytics?.topMedications?.length ? (
              <div className="space-y-2.5">
                {stats.pharmaAnalytics.topMedications.map((med: any, i: number) => (
                  <div key={med.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-600 font-bold text-xs">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-xs text-gray-500">{med.category || (isRtl ? 'غير مصنف' : 'Uncategorized')}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-sm font-bold text-teal-600">{med.prescribedCount}</p>
                      <p className="text-[10px] text-gray-400">{isRtl ? 'روشتة' : 'Rx'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Pill className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{isRtl ? 'لا توجد بيانات أدوية بعد' : 'No medication data yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Row 3: Clinics List ── */}
      <Card className="dashboard-card animate-fade-in-up delay-5">
        <CardHeader className="pb-2 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            {isRtl ? 'العيادات المشتركة' : 'Subscribed Clinics'}
            {clinics && (
              <span className="text-xs font-normal bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full ms-1">
                {clinics.length}
              </span>
            )}
          </CardTitle>
          <Link href={`/${locale}/clinics`}>
            <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">{isRtl ? 'عرض الكل' : 'View all'}</span>
          </Link>
        </CardHeader>
        <CardContent>
          {clinicsLoading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : clinics?.length ? (
            <div className="space-y-2">
              {clinics.slice(0, 6).map((c) => (
                <Link key={c.id} href={`/${locale}/clinics/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_COLOR[c.subscriptionStatus] || 'bg-gray-100 text-gray-600'}`}>
                          {c.subscriptionStatus}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${PLAN_COLOR[c.subscriptionPlan] || 'bg-gray-100 text-gray-600'}`}>
                          {c.subscriptionPlan}
                        </span>
                        <span className="text-[10px] text-gray-400">{c.stats?.patients} {isRtl ? 'مريض' : 'patients'}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{isRtl ? 'لا توجد عيادات بعد' : 'No clinics yet'}</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
