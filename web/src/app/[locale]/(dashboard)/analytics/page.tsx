'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, CalendarDays, Receipt,
  Pill, Stethoscope, RefreshCw, Award, Clock, CheckCircle2,
  XCircle, AlertCircle, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────
interface DashStats {
  todayAppointments: Record<string, number>;
  weekAppointmentsCount: number;
  newPatients: number;
  newPatientsThisWeek: number;
  totalPatients: number;
  prescriptions: { thisMonth: number; total: number };
  revenue: {
    thisMonth: number;
    total: number;
    byStatus: Record<string, { count: number; total: number }>;
  };
  pharmaAnalytics: { topMedications: Array<{ name: string; prescribedCount: number; category: string }> };
  weeklyTrend: Array<{ dayIdx: number; appointments: number; revenue: number }>;
  doctors: number;
}

interface TopMedResp {
  success: boolean;
  data: {
    period: string;
    totalPrescriptions: number;
    items: Array<{ medicineName: string; prescriptionsCount: number; category: string | null; activeIngredient: string | null }>;
  };
}

type Period = 'week' | 'month' | 'today';

const DAY_AR = ['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const DAY_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const PIE_COLORS = ['#0d9488','#0ea5e9','#8b5cf6','#f59e0b','#ef4444','#10b981'];

const PERIOD_OPTIONS: Array<{ key: Period; labelAr: string; labelEn: string }> = [
  { key: 'today', labelAr: 'اليوم',        labelEn: 'Today'      },
  { key: 'week',  labelAr: 'هذا الأسبوع', labelEn: 'This Week'  },
  { key: 'month', labelAr: 'هذا الشهر',   labelEn: 'This Month' },
];

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isRtl }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-lg text-xs" dir={isRtl ? 'rtl' : 'ltr'}>
      <p className="font-bold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((item: any, i: number) => (
        <p key={i} style={{ color: item.color }} className="font-medium">
          {item.name}: {typeof item.value === 'number' && item.value > 1000
            ? `${item.value.toLocaleString()} ${isRtl ? 'ج.م' : 'EGP'}`
            : item.value}
        </p>
      ))}
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon: Icon, color, bg, trend, isLoading }: {
  label: string; value: string | number; sub?: string;
  icon: any; color: string; bg: string; trend?: 'up' | 'down' | null; isLoading?: boolean;
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
      <CardContent className="p-4 flex flex-col justify-between min-h-[110px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
          <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
        </div>
        <div>
          {isLoading ? <Skeleton className="h-7 w-20 mt-1" /> : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              {trend === 'up'   && <TrendingUp   className="w-4 h-4 text-emerald-500" />}
              {trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500"    />}
            </div>
          )}
          {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const locale  = useLocale();
  const isRtl   = locale === 'ar';
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('month');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const { data: stats, isLoading, refetch } = useQuery<DashStats>({
    queryKey: ['analytics-stats'],
    queryFn:  () => api.get('/dashboard/stats').then(r => r.data),
    refetchInterval: 60_000,
  });

  const { data: topMeds } = useQuery<TopMedResp>({
    queryKey: ['analytics-top-meds', period],
    queryFn:  () => api.get(`/dashboard/top-medicines?period=${period}`).then(r => r.data),
    refetchInterval: 60_000,
  });

  // ── Derived data ─────────────────────────────────────────────────────────────
  const weeklyData = useMemo(() => (stats?.weeklyTrend ?? []).map(d => ({
    day:          isRtl ? DAY_AR[d.dayIdx] : DAY_EN[d.dayIdx],
    appointments: d.appointments,
    revenue:      d.revenue,
  })), [stats, isRtl]);

  const aptStatusData = useMemo(() => {
    const s = stats?.todayAppointments ?? {};
    return Object.entries(s)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => ({
        name: k === 'COMPLETED' ? (isRtl ? 'مكتمل' : 'Completed')
            : k === 'CANCELLED' ? (isRtl ? 'ملغي'   : 'Cancelled')
            : k === 'PENDING'   ? (isRtl ? 'انتظار' : 'Pending')
            : k === 'CONFIRMED' ? (isRtl ? 'مؤكد'   : 'Confirmed')
            : k,
        value: v as number,
      }));
  }, [stats, isRtl]);

  const totalToday = Object.values(stats?.todayAppointments ?? {}).reduce((a, b) => a + (b as number), 0);
  const pendingRevenue = stats?.revenue?.byStatus?.PENDING?.total ?? 0;
  const paidRevenue    = stats?.revenue?.byStatus?.PAID?.total    ?? 0;

  const t = (ar: string, en: string) => isRtl ? ar : en;

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            {t('تحليلات العيادة', 'Clinic Analytics')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('إحصائيات تفصيلية عن المواعيد والإيرادات والأدوية', 'Detailed statistics on appointments, revenue & medications')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period filter */}
          <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
            {PERIOD_OPTIONS.map(opt => (
              <button key={opt.key} onClick={() => setPeriod(opt.key)}
                className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
                  period === opt.key
                    ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')}>
                {isRtl ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}
            className="h-9 rounded-xl border-slate-200 dark:border-slate-700 gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" />
            {t('تحديث', 'Refresh')}
          </Button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label={t('مواعيد اليوم', "Today's Appointments")} value={totalToday}
          sub={t(`${stats?.todayAppointments?.PENDING ?? 0} انتظار`, `${stats?.todayAppointments?.PENDING ?? 0} waiting`)}
          icon={CalendarDays} color="text-teal-600" bg="bg-teal-50 dark:bg-teal-950/20" isLoading={isLoading} />
        <KpiCard label={t('مرضى جدد هذا الشهر', 'New Patients (Month)')} value={stats?.newPatients ?? 0}
          sub={t(`${stats?.newPatientsThisWeek ?? 0} هذا الأسبوع`, `${stats?.newPatientsThisWeek ?? 0} this week`)}
          icon={Users} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-950/20" trend="up" isLoading={isLoading} />
        <KpiCard label={t('إيراد هذا الشهر', 'Revenue (Month)')}
          value={`${(stats?.revenue?.thisMonth ?? 0).toLocaleString()} ${t('ج.م','EGP')}`}
          sub={t(`${stats?.revenue?.byStatus?.PENDING?.count ?? 0} فاتورة معلقة`, `${stats?.revenue?.byStatus?.PENDING?.count ?? 0} pending`)}
          icon={Receipt} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" isLoading={isLoading} />
        <KpiCard label={t('روشتات هذا الشهر', 'Prescriptions (Month)')} value={stats?.prescriptions?.thisMonth ?? 0}
          sub={t(`${stats?.prescriptions?.total ?? 0} إجمالي`, `${stats?.prescriptions?.total ?? 0} total`)}
          icon={Pill} color="text-purple-600" bg="bg-purple-50 dark:bg-purple-950/20" isLoading={isLoading} />
      </div>

      {/* ── Row 2: Weekly Area Chart + Appointment Status Pie ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Weekly Trend Area Chart */}
        <Card className="lg:col-span-2 rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              {t('تدفق المواعيد والإيراد (7 أيام)', 'Appointments & Revenue (7 days)')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? <Skeleton className="h-52 w-full rounded-xl" /> : (
              <div className="h-52">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aptGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.01}/>
                        </linearGradient>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                      <Tooltip content={<ChartTooltip isRtl={isRtl} />} />
                      <Area type="monotone" dataKey="appointments" name={t('مواعيد','Appointments')} stroke="#0d9488" strokeWidth={2.5} fill="url(#aptGrad)" />
                      <Area type="monotone" dataKey="revenue"      name={t('إيراد','Revenue')}      stroke="#10b981" strokeWidth={2}   fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Pie */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              {t('حالات مواعيد اليوم', "Today's Status Breakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? <Skeleton className="h-52 w-full rounded-xl" /> : aptStatusData.length > 0 ? (
              <div className="h-52">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={aptStatusData} dataKey="value" nameKey="name" cx="50%" cy="45%"
                        outerRadius={70} innerRadius={40} paddingAngle={3}>
                        {aptStatusData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, name) => [v as number, name as string]} />
                      <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400">
                <CalendarDays className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs">{t('لا توجد مواعيد اليوم', 'No appointments today')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Row 3: Revenue Breakdown Bar + Top Doctors ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Revenue Breakdown Bar Chart */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              {t('توزيع الإيرادات', 'Revenue Breakdown')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {isLoading ? <Skeleton className="h-40 w-full rounded-xl" /> : (
              <>
                {/* Bar Chart */}
                <div className="h-40">
                  {mounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: t('محصّل','Collected'), value: paidRevenue,    fill: '#10b981' },
                        { name: t('معلق','Pending'),   value: pendingRevenue, fill: '#f59e0b' },
                      ]} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip content={<ChartTooltip isRtl={isRtl} />} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {[{ fill: '#10b981' }, { fill: '#f59e0b' }].map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
                {/* Summary rows */}
                <div className="space-y-2">
                  {[
                    { label: t('إجمالي محصّل', 'Total Collected'), value: paidRevenue,    color: 'text-emerald-600', icon: CheckCircle2 },
                    { label: t('معلق',          'Pending'),         value: pendingRevenue, color: 'text-amber-600',  icon: Clock        },
                    { label: t('ملغي/مسترجع',  'Cancelled/Refund'),
                      value: stats?.revenue?.byStatus?.CANCELLED?.total ?? 0,
                      color: 'text-rose-600', icon: XCircle },
                  ].map((row, i) => {
                    const Icon = row.icon;
                    return (
                      <div key={i} className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/40 rounded-lg px-3 py-2">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Icon className={`w-3.5 h-3.5 ${row.color}`} />
                          {row.label}
                        </span>
                        <span className={`font-mono font-bold ${row.color}`}>
                          {row.value.toLocaleString()} {t('ج.م','EGP')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Top Doctors (by appointment count from stats + prescriptions count) */}
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              {t('أكثر الأطباء نشاطاً', 'Most Active Doctors')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DoctorsLeaderboard isRtl={isRtl} period={period} />
          </CardContent>
        </Card>
      </div>

      {/* ── Row 4: Top Medications Bar Chart ── */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Pill className="w-4 h-4 text-purple-600" />
            {t('الأدوية الأكثر وصفاً', 'Top Prescribed Medications')}
            <span className="ms-auto text-[10px] font-normal text-slate-400">
              {isRtl
                ? PERIOD_OPTIONS.find(p => p.key === period)?.labelAr
                : PERIOD_OPTIONS.find(p => p.key === period)?.labelEn}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {!topMeds?.success ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Pill className="w-8 h-8 opacity-30 mx-auto mb-2" />
                <p className="text-xs">{t('لا توجد بيانات أدوية', 'No medication data')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bar chart */}
              <div className="h-52">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={(topMeds.data.items ?? []).map(m => ({
                        name: m.medicineName.length > 18 ? m.medicineName.slice(0, 18) + '…' : m.medicineName,
                        count: m.prescriptionsCount,
                      }))}
                      layout="vertical"
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.15)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip content={<ChartTooltip isRtl={isRtl} />} />
                      <Bar dataKey="count" name={t('روشتة', 'Prescriptions')} radius={[0, 6, 6, 0]} fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              {/* Ranked list */}
              <div className="space-y-2">
                {(topMeds.data.items ?? []).map((med, i) => {
                  const pct = Math.round((med.prescriptionsCount / (topMeds.data.items[0]?.prescriptionsCount || 1)) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 text-white',
                        i === 0 ? 'bg-gradient-to-br from-teal-500 to-emerald-500'
                          : i === 1 ? 'bg-gradient-to-br from-blue-500 to-sky-500'
                          : i === 2 ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                          : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-white'
                      )}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{med.medicineName}</span>
                          <span className="text-slate-400 flex-shrink-0 ms-2">{med.prescriptionsCount}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

// ── Doctors Leaderboard sub-component ────────────────────────────────────────
function DoctorsLeaderboard({ isRtl, period }: { isRtl: boolean; period: Period }) {
  const { data: recentActivity = [] } = useQuery<any[]>({
    queryKey: ['analytics-activity'],
    queryFn:  () => api.get('/dashboard/recent-activity?limit=100').then(r => r.data),
    refetchInterval: 60_000,
  });

  const doctors = useMemo(() => {
    const map: Record<string, { name: string; count: number; specialization: string }> = {};
    for (const apt of recentActivity) {
      const id   = String(apt.doctor?.id ?? apt.doctorId ?? '');
      const name = apt.doctor?.user?.name ?? apt.doctor?.name ?? '—';
      const spec = apt.doctor?.specialization ?? '';
      if (!id) continue;
      if (!map[id]) map[id] = { name, count: 0, specialization: spec };
      map[id].count++;
    }
    return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 6);
  }, [recentActivity]);

  if (doctors.length === 0) {
    return (
      <div className="h-40 flex flex-col items-center justify-center text-slate-400">
        <Stethoscope className="w-8 h-8 opacity-30 mb-2" />
        <p className="text-xs">{isRtl ? 'لا توجد بيانات أطباء اليوم' : 'No doctor activity today'}</p>
      </div>
    );
  }

  const max = doctors[0]?.count || 1;

  return (
    <div className="space-y-3">
      {doctors.map((doc, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn(
            'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold',
            i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500'
              : i === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500'
              : i === 2 ? 'bg-gradient-to-br from-orange-700 to-orange-800'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-white'
          )}>
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {isRtl ? 'د.' : 'Dr.'} {doc.name}
              </span>
              <span className="text-teal-600 dark:text-teal-400 font-mono font-bold flex-shrink-0 ms-2">
                {doc.count} {isRtl ? 'موعد' : 'apts'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((doc.count / max) * 100)}%` }}
                />
              </div>
              {doc.specialization && (
                <span className="text-[10px] text-slate-400 flex-shrink-0">{doc.specialization}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
