'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Building2, Users, Stethoscope, Pill, CalendarDays,
  Activity, TrendingUp, ChevronRight, Globe,
  DollarSign, AlertCircle, Ban, Clock, CheckCircle2,
  ShieldCheck, Database, Mail, RefreshCw,
  TrendingDown, Sliders, BarChart3
} from 'lucide-react';

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  BASIC: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-350 border-blue-100 dark:border-blue-900/20',
  PRO: 'bg-teal-50 text-teal-755 dark:bg-teal-950/30 dark:text-teal-350 border-teal-100 dark:border-teal-900/20',
  ENTERPRISE: 'bg-purple-50 text-purple-755 dark:bg-purple-950/30 dark:text-purple-300 border-purple-100 dark:border-purple-900/20',
};

const PLAN_COLOR_AR: Record<string, string> = {
  FREE: 'مبادرة مجانية',
  BASIC: 'الباقة الأساسية',
  PRO: 'الباقة الاحترافية',
  ENTERPRISE: 'باقة المؤسسات',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-50/50 text-emerald-700 border-emerald-150/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30',
  SUSPENDED: 'bg-rose-50/50 text-rose-700 border-rose-150/30 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30',
  TRIAL: 'bg-amber-50/50 text-amber-700 border-amber-150/30 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
};

const STATUS_COLOR_AR: Record<string, string> = {
  ACTIVE: 'نشط ومفعل',
  SUSPENDED: 'موقوف مؤقتاً',
  TRIAL: 'فترة تجريبية',
};

interface SubscriptionAlert {
  clinicName: string;
  plan: string;
  daysRemaining: number;
  clinicId: string;
}

interface OverdueInvoice {
  clinicName: string;
  plan: string;
  daysOverdue: number;
  amount: number;
}

interface WeeklyTrendItem {
  dayIdx: number;
  appointments: number;
}

interface TopMedication {
  id: string;
  name: string;
  prescribedCount: number;
  category: string;
}

interface ActiveClinic {
  id: string;
  name: string;
  governorate: string;
  city: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  appointmentsCount: number;
}

interface RecentClinic {
  id: string;
  name: string;
  governorate: string;
  city: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
}

interface AdminDashboardStats {
  clinicsCount: number;
  doctors: number;
  patients: number;
  appointments: Record<string, number>;
  platformSaaSRevenue: { mrr: number; arr: number; totalCollected: number };
  subscriptionAlerts: SubscriptionAlert[];
  overdueInvoices: OverdueInvoice[];
  weeklyTrend: WeeklyTrendItem[];
  mostActiveClinics: ActiveClinic[];
  recentClinics: RecentClinic[];
  pharmaAnalytics: { topMedications: TopMedication[] };
  medicationsCount: number;
}

export default function AdminDashboard() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: stats, isLoading, refetch } = useQuery<AdminDashboardStats>({
    queryKey: ['admin-dash-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const mrr = stats?.platformSaaSRevenue?.mrr ?? 0;
  const arr = stats?.platformSaaSRevenue?.arr ?? 0;
  const totalCollected = stats?.platformSaaSRevenue?.totalCollected ?? 0;

  const activeClinics = stats?.recentClinics?.filter((c: RecentClinic) => c.subscriptionStatus === 'ACTIVE')?.length ?? 0;
  const trialClinics = stats?.recentClinics?.filter((c: RecentClinic) => c.subscriptionStatus === 'TRIAL')?.length ?? 0;

  const totalAppointmentsCount = Object.values(stats?.appointments ?? {}).reduce((a: number, b: number) => a + b, 0);
  const totalWeeklyAppointments = stats?.weeklyTrend?.reduce((sum, d) => sum + d.appointments, 0) ?? 0;

  const getCategoryLabel = (cat: string) => {
    if (!cat || cat === 'Unknown') return isRtl ? 'بدون تصنيف' : 'Uncategorized';
    return cat;
  };

  const formatMedName = (name: string) => {
    if (!name) return { primary: '', secondary: '' };
    const match = name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
      return {
        primary: match[1].trim(),
        secondary: match[2].trim(),
      };
    }
    return {
      primary: name,
      secondary: '',
    };
  };

  const formatPrescriptionCount = (count: number) => {
    if (count === 1) return isRtl ? 'روشتة واحدة' : '1 prescription';
    if (count === 2) return isRtl ? 'روشتتان' : '2 prescriptions';
    if (count >= 3 && count <= 10) return isRtl ? `${count} روشتات` : `${count} prescriptions`;
    return isRtl ? `${count} روشتة` : `${count} prescriptions`;
  };


  const topKpis = [
    {
      label: isRtl ? 'إجمالي العيادات' : 'Total Clinics',
      rawValue: stats?.clinicsCount ?? 0,
      isCurrency: false,
      sub: isRtl 
        ? `${activeClinics} نشطة | ${trialClinics} تجريبية` 
        : `${activeClinics} Active | ${trialClinics} Trial`,
      icon: Building2,
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'الإيرادات المتكررة شهرياً (MRR)' : 'Monthly Recurring Revenue',
      rawValue: mrr,
      isCurrency: true,
      sub: isRtl 
        ? `السنوي المتوقع: ${arr.toLocaleString()} ج.م` 
        : `ARR Run Rate: ${arr.toLocaleString()} EGP`,
      icon: TrendingUp,
      href: `/${locale}/subscriptions`,
    },
    {
      label: isRtl ? 'الإيرادات المحصلة' : 'Collected SaaS Revenue',
      rawValue: totalCollected,
      isCurrency: true,
      sub: isRtl ? 'الرسوم المحصلة منذ التأسيس' : 'All-time SaaS fees collected',
      icon: DollarSign,
      href: `/${locale}/subscriptions`,
    },
    {
      label: isRtl ? 'أطباء المنصة' : 'Platform Doctors Count',
      rawValue: stats?.doctors ?? 0,
      isCurrency: false,
      sub: isRtl ? 'أطباء مرخصين ومسجلين' : 'Licensed practicing doctors',
      icon: Stethoscope,
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'ملفات المرضى' : 'Total Patient Files',
      rawValue: stats?.patients ?? 0,
      isCurrency: false,
      sub: isRtl ? 'في كافة عيادات المنصة' : 'Unified health records count',
      icon: Users,
      href: `/${locale}/clinics`,
    },
    {
      label: isRtl ? 'الاستشارات والمواعيد' : 'Platform Consultations',
      rawValue: totalAppointmentsCount || 0,
      isCurrency: false,
      sub: isRtl ? 'إجمالي الكشوفات المسجلة' : 'Total appointments booked',
      icon: CalendarDays,
      href: `/${locale}/clinics`,
    },
  ];

  return (
    <div className={`relative space-y-4 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Soft Elegant Medical Blurs */}
      <div className="absolute top-0 right-1/4 w-[380px] h-[380px] rounded-full bg-teal-500/4 dark:bg-teal-500/3 blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 left-1/4 w-[420px] h-[420px] rounded-full bg-blue-500/4 dark:bg-blue-500/3 blur-[120px] pointer-events-none -z-10" />

      {/* ── Balanced Top Header Banner ── */}
      <div className="relative overflow-hidden py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-50/10 to-blue-50/10 dark:from-teal-950/5 dark:to-blue-950/5 pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isRtl ? 'نظرة عامة على المنصة' : 'Platform Overview'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200/20">
              <Globe className="w-3.5 h-3.5" />
              {isRtl ? 'إدارة محرك المنصة' : 'SaaS Engine Portal'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            {isRtl 
              ? 'متابعة أداء ClinicPro والعيادات والاشتراكات والتحليلات الطبية والدوائية العامة' 
              : 'Track ClinicPro performance, active clinic growth, subscription plans, SaaS billing cycle, and clinical metrics'}
          </p>
        </div>

        <div className="flex gap-2 relative z-10 shrink-0">
          <Button variant="outline" size="sm" className="rounded-lg h-8 px-3 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 font-semibold gap-1.5 text-xs text-slate-700 dark:text-slate-300 shadow-3xs" onClick={() => refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
            {isRtl ? 'تحديث البيانات' : 'Sync Data'}
          </Button>
          <Link href={`/${locale}/clinics`}>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white font-semibold gap-1.5 h-8 px-3 rounded-lg border border-teal-600 dark:border-teal-500 shadow-3xs transition-all duration-150 text-xs">
              <Building2 className="w-3.5 h-3.5" />
              {isRtl ? 'إدارة العيادات' : 'Clinics Management'}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Balanced Metrics Grid (Row 1) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {topKpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link key={i} href={kpi.href} className="block group">
              <Card className="relative h-full overflow-hidden transition-all duration-200 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-md hover:border-teal-500/30 dark:hover:border-teal-500/20 shadow-3xs hover:shadow-2xs">
                <CardContent className="p-3.5 flex items-center justify-between h-full gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wide line-clamp-1 leading-normal" dir="auto" title={kpi.label}>
                      {kpi.label}
                    </p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      {isLoading ? (
                        <Skeleton className="h-6 w-16" />
                      ) : kpi.isCurrency ? (
                        <span className="flex items-baseline gap-0.5" dir={isRtl ? 'rtl' : 'ltr'}>
                          <span className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                            {kpi.rawValue.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            {isRtl ? 'ج.م' : 'EGP'}
                          </span>
                        </span>
                      ) : (
                        <span className="text-lg sm:text-xl font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                          {kpi.rawValue.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium line-clamp-1 leading-normal pt-0.5" dir="auto" title={kpi.sub}>{kpi.sub}</p>
                  </div>
                  <div className="p-2 rounded-lg border border-teal-50/50 dark:border-teal-900/30 bg-teal-50/50 dark:bg-teal-950/40 flex-shrink-0">
                    <Icon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* ── Operations Warnings & Alerts (Row 2) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Expiring Subscriptions */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-705 dark:text-slate-300">
              <AlertCircle className="w-4 h-4 text-teal-600" />
              {isRtl ? 'تنبيهات جارية: اشتراكات توشك على الانتهاء' : 'Approaching Tier Expirations'}
            </CardTitle>
            {(stats?.subscriptionAlerts?.length ?? 0) > 0 && (
              <Badge className="bg-teal-600 text-white font-bold text-[9px] px-2 py-0.5 rounded border-0">
                {stats!.subscriptionAlerts!.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-3">
            {(stats?.subscriptionAlerts?.length ?? 0) > 0 ? (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {stats!.subscriptionAlerts!.map((alert: SubscriptionAlert, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-850 hover:border-teal-500/20 transition-all shadow-3xs">
                    <div className="w-7.5 h-7.5 rounded bg-teal-50/50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/30 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{alert.clinicName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {isRtl 
                          ? `الباقة: ${PLAN_COLOR_AR[alert.plan] || alert.plan} | ينتهي خلال ${alert.daysRemaining} أيام`
                          : `Tier: ${alert.plan} | Expires in ${alert.daysRemaining} days`}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <Link href={`/${locale}/clinics/${alert.clinicId}`}>
                        <Button size="sm" variant="outline" className="text-[10px] h-6 px-2.5 rounded border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold hover:bg-teal-50/40 transition-colors">
                          {isRtl ? 'إدارة الاشتراك' : 'Manage'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-550/15 text-emerald-800 dark:text-emerald-450">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-450 shrink-0" />
                <p className="text-xs font-semibold">{isRtl ? 'كافة اشتراكات العيادات مستقرة وجارية ولا توجد أي تنبيهات حالية.' : 'All subscriptions are active and stable. No alerts.'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue SaaS Invoices */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Ban className="w-4 h-4 text-rose-500" />
              {isRtl ? 'فواتير الاشتراك المتأخرة المستحقة' : 'Overdue SaaS Subscription Invoices'}
            </CardTitle>
            {(stats?.overdueInvoices?.length ?? 0) > 0 && (
              <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-250/20 font-bold text-[9px] px-2 py-0.5 rounded">
                {stats!.overdueInvoices!.length}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-3">
            {(stats?.overdueInvoices?.length ?? 0) > 0 ? (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {stats!.overdueInvoices!.map((inv: OverdueInvoice, idx: number) => (
                  <div key={idx} className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-955 border border-slate-205 dark:border-slate-850 hover:border-rose-550/20 transition-all shadow-3xs">
                    <div className="w-7.5 h-7.5 rounded bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center shrink-0">
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{inv.clinicName}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {isRtl
                          ? `الباقة: ${PLAN_COLOR_AR[inv.plan] || inv.plan} | متأخرة منذ ${inv.daysOverdue} أيام`
                          : `Tier: ${inv.plan} | Overdue by ${inv.daysOverdue} days`}
                      </p>
                    </div>
                    <div className="text-end shrink-0 flex flex-col items-end">
                      <span className="text-xs font-mono font-bold text-rose-600" dir="ltr">{inv.amount.toLocaleString()} ج.م</span>
                      <Link href={`/${locale}/invoices`}>
                        <span className="text-[10px] text-slate-450 hover:underline cursor-pointer font-semibold">{isRtl ? 'عرض الفواتير' : 'View Invoices'}</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-550/15 text-emerald-800 dark:text-emerald-450">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-455 shrink-0" />
                <p className="text-xs font-semibold">{isRtl ? 'لا توجد فواتير اشتراك متأخرة الدفع حالياً. السجل المالي مستقر.' : 'No overdue subscription fees outstanding. Financial health is stable.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SaaS Growth Overview & Weekly Activity Chart (Row 3) ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
        <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <TrendingUp className="w-4 h-4 text-teal-655" />
            {isRtl ? 'نظرة عامة على النمو والنشاط الأسبوعي للمنصة' : 'Weekly SaaS Growth & Platform Activity'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* SaaS Metrics Distribution */}
            <div className="space-y-2.5 justify-center flex flex-col">
              <div className="p-3.5 rounded-lg bg-teal-50/10 dark:bg-teal-950/5 border border-teal-500/10 flex items-center justify-between shadow-3xs">
                <div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold block uppercase tracking-wider">{isRtl ? 'نمو الإيرادات المتكررة MRR' : 'MRR Monthly Growth'}</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">+{isRtl ? '١٥.٤٪' : '15.4%'}</span>
                </div>
                <Badge className="bg-teal-600 text-white font-bold text-[9px] px-2 py-0.5 rounded border-0">
                  {isRtl ? 'قوي' : 'Strong'}
                </Badge>
              </div>
              
              <div className="p-3.5 rounded-lg bg-blue-50/10 dark:bg-blue-950/5 border border-blue-500/10 flex items-center justify-between shadow-3xs">
                <div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block uppercase tracking-wider">{isRtl ? 'معدل إلغاء الاشتراكات Churn' : 'Subscription Churn Rate'}</span>
                  <span className="text-lg font-mono font-bold text-slate-900 dark:text-white">0.0%</span>
                </div>
                <Badge className="bg-blue-600 text-white font-bold text-[9px] px-2 py-0.5 rounded border-0">
                  {isRtl ? 'مثالي' : 'Optimal'}
                </Badge>
              </div>
            </div>

            {/* Weekly trend chart */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{isRtl ? 'حجم الاستشارات الموحد (آخر ٧ أيام)' : 'Unified consultations volume (Last 7 days)'}</h4>
              {totalWeeklyAppointments === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-150 dark:border-slate-850 px-4 text-center">
                  <BarChart3 className="w-5 h-5 text-teal-600/60 dark:text-teal-400/60 mb-1.5 animate-pulse" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{isRtl ? 'لا توجد كشوفات أو مواعيد مسجلة خلال هذا الأسبوع' : 'No patient consultations recorded this week'}</p>
                </div>
              ) : (
                <div className="flex items-end justify-between h-32 pt-5 px-2 bg-slate-50/50 dark:bg-slate-950/40 rounded-lg border border-slate-150 dark:border-slate-850">
                  {stats?.weeklyTrend?.map((day: WeeklyTrendItem, idx: number) => {
                    const maxVal = Math.max(...(stats.weeklyTrend.map((d: WeeklyTrendItem) => d.appointments) || [1]));
                    const pct = maxVal > 0 ? (day.appointments / maxVal) * 100 : 0;
                    const daysAr = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
                    const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                    const dayName = isRtl ? daysAr[day.dayIdx] : daysEn[day.dayIdx];

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group gap-1 h-full justify-end">
                        <span className="text-[9px] font-mono font-bold text-teal-650 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-150">{day.appointments}</span>
                        <div 
                          style={{ height: `${Math.max(8, pct)}%` }} 
                          className="w-3.5 sm:w-5.5 bg-gradient-to-t from-teal-650 to-teal-455 dark:from-teal-550 dark:to-teal-350 hover:from-teal-500 hover:to-teal-300 rounded-t transition-all duration-150 relative shadow-3xs hover:shadow-2xs"
                        >
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center z-30">
                            <div className="bg-slate-950 text-white text-[9px] font-semibold py-0.5 px-1.5 rounded shadow-sm whitespace-nowrap">
                              {day.appointments} {isRtl ? 'حجز' : 'Consults'}
                            </div>
                            <div className="w-1 h-1 bg-slate-950 rotate-45 -mt-0.5" />
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold mb-1">{dayName}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ── Bento Grid: Health status, Performance & Activity lists (Row 4) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Health Status Dashboard */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-4 h-4 text-teal-655" />
              {isRtl ? 'مؤشرات استقرار وصحة المنصة' : 'Platform Health & Stability'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2">
            
            {/* Database */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <Database className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{isRtl ? 'قاعدة البيانات الرئيسية' : 'Core Database'}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{isRtl ? 'متصلة بكفاءة عالية' : 'Online & Connected'}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 shrink-0">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                {isRtl ? 'نشط' : 'Active'}
              </span>
            </div>

            {/* Cache */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <RefreshCw className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{isRtl ? 'نظام التخزين المؤقت' : 'Cache Layer'}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{isRtl ? 'تخزين مؤقت نشط' : 'Memory caching active'}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 shrink-0">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                {isRtl ? 'متصل' : 'Connected'}
              </span>
            </div>

            {/* SMTP */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{isRtl ? 'خدمة البريد الإلكتروني' : 'Email Notification'}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{isRtl ? 'نظام الرسائل مستقر' : 'Ready to push transactions'}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 shrink-0">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                {isRtl ? 'جاهز' : 'Ready'}
              </span>
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between p-2 rounded bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{isRtl ? 'معدل استقرار الخدمة' : 'Core API & Stability'}</h4>
                  <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{isRtl ? 'بوابة الطلبات OK' : '100% API stability'}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-450 shrink-0">
                <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                99.9%
              </span>
            </div>

          </CardContent>
        </Card>

        {/* Most Active Clinics */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-705 dark:text-slate-300">
              <Activity className="w-4 h-4 text-teal-650" />
              {isRtl ? 'العيادات الأكثر نشاطاً وتفاعلاً' : 'Top Performing Clinics'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {(stats?.mostActiveClinics?.length ?? 0) > 0 ? (
              stats!.mostActiveClinics!.map((c: ActiveClinic, idx: number) => (
                <Link key={c.id} href={`/${locale}/clinics/${c.id}`} className="block group">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 hover:border-teal-500/25 group-hover:bg-white dark:group-hover:bg-slate-900/40 transition-all duration-150 shadow-3xs">
                    <div className="w-7 h-7 rounded bg-gradient-to-br from-teal-500 to-teal-600 text-white font-mono flex items-center justify-center shrink-0 border border-teal-500/20">
                      <span className="text-[10px] font-bold">#{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600 transition-colors">{c.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={`text-[8px] font-semibold px-1 rounded ${PLAN_COLOR[c.subscriptionPlan] || 'bg-gray-150'}`}>
                          {isRtl ? (PLAN_COLOR_AR[c.subscriptionPlan] || c.subscriptionPlan) : c.subscriptionPlan}
                        </Badge>
                        <Badge variant="outline" className={`text-[8px] font-semibold px-1 rounded ${STATUS_COLOR[c.subscriptionStatus] || 'bg-gray-150'}`}>
                          {isRtl ? (STATUS_COLOR_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-end shrink-0 flex flex-col justify-center items-end">
                      <span className="text-xs font-mono font-bold text-teal-600">{c.appointmentsCount}</span>
                      <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{isRtl ? 'كشف' : 'Bookings'}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-slate-405 dark:text-slate-500">
                <Building2 className="w-5 h-5 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد بيانات تفاعل بعد' : 'No performance analytics yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Clinic Registrations */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Building2 className="w-4 h-4 text-teal-650" />
              {isRtl ? 'أحدث العيادات المسجلة بالمنصة' : 'Recently Registered Clinics'}
            </CardTitle>
            <Link href={`/${locale}/clinics`}>
              <span className="text-[10px] text-teal-655 hover:underline font-semibold cursor-pointer">{isRtl ? 'الكل' : 'All'}</span>
            </Link>
          </CardHeader>
          <CardContent className="p-3 space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {(stats?.recentClinics?.length ?? 0) > 0 ? (
              stats!.recentClinics!.slice(0, 5).map((c: RecentClinic) => (
                <Link key={c.id} href={`/${locale}/clinics/${c.id}`} className="block group">
                  <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 hover:border-teal-500/20 group-hover:bg-white dark:group-hover:bg-slate-900/40 transition-all duration-150 shadow-3xs">
                    <div className="w-7.5 h-7.5 rounded bg-teal-50 dark:bg-teal-900/40 border border-teal-100 dark:border-teal-900/30 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5 text-teal-650 dark:text-teal-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-teal-600">{c.name}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isRtl ? `${c.governorate}، ${c.city}` : `${c.governorate}, ${c.city}`}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {isRtl ? 'تسجيل: ' : 'Reg: '}
                        {new Date(c.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1 items-end">
                      <Badge variant="outline" className={`text-[8px] font-semibold px-1 rounded ${PLAN_COLOR[c.subscriptionPlan] || 'bg-gray-150'}`}>
                        {isRtl ? (PLAN_COLOR_AR[c.subscriptionPlan] || c.subscriptionPlan) : c.subscriptionPlan}
                      </Badge>
                      <Badge variant="outline" className={`text-[8px] font-semibold px-1 rounded ${STATUS_COLOR[c.subscriptionStatus] || 'bg-gray-150'}`}>
                        {isRtl ? (STATUS_COLOR_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-slate-405 dark:text-slate-500">
                <Building2 className="w-5 h-5 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد عيادات مسجلة بعد' : 'No clinics registered yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* ── Row 5: Drug Analytics & Egyptian Medical Dictionary ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Egyptian Medical Dictionary Widget */}
        <Card className="lg:col-span-1 border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md flex flex-col justify-between p-4 shadow-3xs">
          <div className="space-y-2">
            <span className="text-[10px] text-teal-605 dark:text-teal-400 font-extrabold block uppercase tracking-wider">
              {isRtl ? 'سجل الأدوية المصري' : 'Egyptian Drug Registry'}
            </span>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              {isRtl ? 'الفهرس الموحد للأدوية والمستحضرات الطبية المسجلة بجمهورية مصر العربية' : 'Unified index of all registered medical drugs and compounds'}
            </h3>
            <div className="py-2.5">
              <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
                {isLoading ? <Skeleton className="h-8 w-14" /> : (stats?.medicationsCount || 0)}
                <span className="text-xs text-teal-650 dark:text-teal-400 font-bold">{isRtl ? 'أدوية مسجلة' : 'drugs listed'}</span>
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Link href={`/${locale}/medications`} className="w-full block">
              <Button size="sm" variant="outline" className="w-full text-xs text-teal-700 dark:text-teal-300 border-teal-200/60 dark:border-teal-900/30 bg-teal-50/20 dark:bg-teal-950/20 hover:bg-teal-50/40 h-8 rounded-lg font-bold gap-1 justify-center transition-all duration-150 shadow-3xs">
                {isRtl ? 'إدارة سجل الأدوية' : 'Manage Drug Registry'}
                <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
              </Button>
            </Link>
          </div>
        </Card>

        {/* Top Prescribed Medications Card */}
        <Card className="lg:col-span-3 border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/10 rounded-xl backdrop-blur-md">
          <CardHeader className="py-2.5 px-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Pill className="w-4 h-4 text-teal-650" />
              {isRtl ? 'تحليلات الدواء: الأدوية الأكثر صرفاً في الروشتات' : 'Pharma Analytics: Global Top Prescribed Medications'}
            </CardTitle>
            <Link href={`/${locale}/medications`}>
              <span className="text-[10px] text-teal-650 hover:underline font-semibold cursor-pointer">{isRtl ? 'عرض سجل الأدوية بالكامل' : 'View Full Registry'}</span>
            </Link>
          </CardHeader>
          <CardContent className="p-3">
            {stats?.pharmaAnalytics?.topMedications?.length ? (
              (() => {
                const topMeds = stats.pharmaAnalytics.topMedications.slice(0, 5);
                const totalMedsDisplayed = topMeds.length;
                const totalAppearances = topMeds.reduce((sum, med) => sum + (med.prescribedCount || 0), 0);
                const mostUsedDrug = topMeds[0];

                return (
                  <div className="space-y-3.5">
                    {/* Compact Summary Row */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pb-2.5 border-b border-slate-150 dark:border-slate-800/80 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span>{isRtl ? 'إجمالي الأدوية المعروضة:' : 'Total Displayed Drugs:'}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{totalMedsDisplayed}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                        <span>{isRtl ? 'إجمالي مرات الظهور:' : 'Total Appearances:'}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{totalAppearances}</span>
                      </div>
                      {mostUsedDrug && (
                        <div className="flex items-center gap-1.5 max-w-[280px] min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                          <span>{isRtl ? 'الدواء الأكثر استخدامًا:' : 'Most Used Drug:'}</span>
                          <span className="font-bold text-teal-600 dark:text-teal-400 truncate" title={mostUsedDrug.name}>
                            {formatMedName(mostUsedDrug.name).primary}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Cards Container: scroll on mobile/tablet, grid on desktop */}
                    <div className="flex lg:grid lg:grid-cols-5 overflow-x-auto lg:overflow-x-visible pb-2.5 lg:pb-0 gap-3 snap-x scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                      {topMeds.map((med: TopMedication, i: number) => {
                        const { primary, secondary } = formatMedName(med.name);
                        const category = getCategoryLabel(med.category);

                        return (
                          <div
                            key={med.id}
                            className="relative overflow-hidden p-3 rounded-xl bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850 hover:border-teal-500/20 transition-all flex flex-col justify-between min-w-[170px] lg:min-w-0 flex-1 lg:flex-initial snap-start shadow-3xs hover:shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-1.5 mb-2">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-teal-650 dark:text-teal-400 border border-teal-100/50 dark:border-teal-900/30 font-mono">
                                #{i + 1}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold font-mono">
                                {formatPrescriptionCount(med.prescribedCount)}
                              </span>
                            </div>

                            <div className="space-y-0.5 flex-1 flex flex-col justify-center my-1.5">
                              <h4
                                className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug break-words"
                                dir="ltr"
                                style={{ unicodeBidi: 'plaintext', textAlign: isRtl ? 'right' : 'left' }}
                                title={med.name}
                              >
                                {primary}
                              </h4>
                              {secondary && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-normal" title={med.name}>
                                  {secondary}
                                </p>
                              )}
                            </div>

                            {category && category !== 'Uncategorized' && category !== 'بدون تصنيف' && (
                              <div className="mt-2 pt-2 border-t border-slate-150 dark:border-slate-800/60">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold block truncate" title={category}>
                                  {category}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                <Pill className="w-7 h-7 mx-auto mb-2 opacity-20" />
                <p className="text-xs">{isRtl ? 'لا توجد تحليلات دوائية مسجلة بعد' : 'No pharma analytics loaded yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
