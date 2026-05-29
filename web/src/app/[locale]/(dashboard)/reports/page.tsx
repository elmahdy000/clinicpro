'use client';

import { useRouter } from 'next/navigation';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  BarChart3, CalendarDays, Users, Activity, XCircle, TrendingUp,
  Printer, Funnel, RefreshCw, Calendar, Download, Building2,
  FileText, Shield, Award, Landmark, Stethoscope, CheckCircle2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { formatDate } from '@/lib/utils';
import { usePrint } from '@/hooks/usePrint';
import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';

const allSpecializations = [
  'GENERAL', 'DENTISTRY', 'PEDIATRICS', 'DERMATOLOGY', 'CARDIOLOGY',
  'ORTHOPEDICS', 'GYNECOLOGY', 'OPHTHALMOLOGY', 'PSYCHIATRY', 'NEUROLOGY'
];

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useAuth();
  const isAdmin = user?.role === 'PLATFORM_OWNER';
  const { printElement } = usePrint();

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Filters State
  const [dateRange, setDateRange] = useState('all'); // today, yesterday, 7days, 30days, thismonth, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clinicFilter, setClinicFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [govFilter, setGovFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [specialtyFilter, setSpecialtyFilter] = useState('all');

  const { data: governorates = [], isLoading: loadingGov } = useGovernorates();
  const { data: cities = [], isLoading: loadingCities } = useCities(govFilter === 'all' ? null : govFilter);

  const { data: stats, isLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats-reports', dateRange, startDate, endDate, clinicFilter, planFilter],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: pharmaInsights } = useQuery({
    queryKey: ['reports-pharma-insights', govFilter, cityFilter, specialtyFilter, dateRange],
    queryFn: () => api.get('/dashboard/pharma-insights', {
      params: {
        governorateId: govFilter === 'all' ? undefined : govFilter,
        cityId: cityFilter === 'all' ? undefined : cityFilter,
        specialty: specialtyFilter === 'all' ? undefined : specialtyFilter,
        period: dateRange,
      }
    }).then(r => r.data),
    enabled: isAdmin,
    refetchInterval: 10_000,
  });

  const { data: clinics } = useQuery<any[]>({
    queryKey: ['reports-clinics'],
    queryFn: () => api.get('/clinics').then((r) => r.data?.data || r.data),
    enabled: isAdmin,
    refetchInterval: 10_000,
  });

  // Calculate filtered stats dynamically for local demonstration
  const filteredClinics = clinics?.filter(c => {
    if (planFilter !== 'all' && c.subscriptionPlan !== planFilter) return false;
    if (statusFilter !== 'all' && c.subscriptionStatus !== statusFilter) return false;
    if (govFilter !== 'all' && String(c.governorateId) !== String(govFilter) && String(c.governorate?.id) !== String(govFilter)) return false;
    if (cityFilter !== 'all' && String(c.cityId) !== String(cityFilter) && String(c.city?.id) !== String(cityFilter)) return false;
    if (specialtyFilter !== 'all' && !c.specializations?.includes(specialtyFilter)) return false;

    // Time Period Filter
    if (dateRange !== 'all') {
      const createdAt = new Date(c.createdAt);
      const now = new Date();
      if (dateRange === 'today') {
        if (createdAt.toDateString() !== now.toDateString()) return false;
      } else if (dateRange === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (createdAt.toDateString() !== yesterday.toDateString()) return false;
      } else if (dateRange === '7days') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (createdAt < sevenDaysAgo) return false;
      } else if (dateRange === '30days') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (createdAt < thirtyDaysAgo) return false;
      } else if (dateRange === 'thismonth') {
        if (createdAt.getMonth() !== now.getMonth() || createdAt.getFullYear() !== now.getFullYear()) return false;
      } else if (dateRange === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (createdAt < start || createdAt > end) return false;
      }
    }
    return true;
  }) || [];

  const filteredTotalClinics = filteredClinics.length;
  const filteredTotalPrescriptions = filteredClinics.reduce((sum, c) => sum + (c.stats?.prescriptions || 0), 0);
  const filteredTotalPatients = filteredClinics.reduce((sum, c) => sum + (c.stats?.patients || 0), 0);
  const filteredTotalRevenue = filteredClinics.reduce((sum, c) => sum + (c.revenue || 0), 0);


  const router = useRouter();

  const handlePrint = () => {
    printElement('report-print-area', 'ClinicPro Report');
  };

  const resetFilters = () => {
    setDateRange('all');
    setStartDate('');
    setEndDate('');
    setClinicFilter('all');
    setPlanFilter('all');
    setGovFilter('all');
    setCityFilter('all');
    setStatusFilter('all');
    setSpecialtyFilter('all');
  };

  // Preset Date range labels
  const getFilterLabel = () => {
    if (dateRange === 'today') return isRtl ? 'اليوم' : 'Today';
    if (dateRange === 'yesterday') return isRtl ? 'أمس' : 'Yesterday';
    if (dateRange === '7days') return isRtl ? 'آخر 7 أيام' : 'Last 7 Days';
    if (dateRange === '30days') return isRtl ? 'آخر 30 يوم' : 'Last 30 Days';
    if (dateRange === 'thismonth') return isRtl ? 'الشهر الحالي' : 'This Month';
    return isRtl ? 'فترة مخصصة' : 'Custom Period';
  };

  const reportCards = [
    { label: t('totalVisits'), value: stats?.appointments?.COMPLETED ?? 0, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: t('newPatients'), value: stats?.patients ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: t('completedAppointments'), value: stats?.appointments?.COMPLETED ?? 0, icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: t('cancelledAppointments'), value: stats?.appointments?.CANCELLED ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ];

  const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const chartData = stats?.weeklyTrend?.map((item: any) => ({
    name: isRtl ? dayNamesAr[item.dayIdx] : dayNamesEn[item.dayIdx],
    visits: item.appointments,
    revenue: item.revenue,
  })) || [
      { name: isRtl ? 'السبت' : 'Sat', visits: 0, revenue: 0 },
      { name: isRtl ? 'الأحد' : 'Sun', visits: 0, revenue: 0 },
      { name: isRtl ? 'الإثنين' : 'Mon', visits: 0, revenue: 0 },
      { name: isRtl ? 'الثلاثاء' : 'Tue', visits: 0, revenue: 0 },
      { name: isRtl ? 'الأربعاء' : 'Wed', visits: 0, revenue: 0 },
      { name: isRtl ? 'الخميس' : 'Thu', visits: 0, revenue: 0 },
      { name: isRtl ? 'الجمعة' : 'Fri', visits: 0, revenue: 0 },
    ];

  if (isAdmin) {
    const pharmaData = pharmaInsights?.topMedications?.map((m: any) => ({
      name: m.name,
      prescriptions: m.prescribedCount,
      category: m.category || 'عام',
    })) || stats?.pharmaAnalytics?.topMedications?.map((m: any) => ({
      name: m.name,
      prescriptions: m.prescribedCount,
      category: m.category,
    })) || [];

    return (
      <div id="report-print-area" className={`space-y-6 animate-fade-in print-area ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Print Only Header (Hidden on screen) */}
        <div className="hidden print:block border-b-2 border-teal-600 pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-teal-800">ClinicPro SaaS - بوابة الإدارة العامة</h1>
              <p className="text-xs text-gray-500 font-mono">التقرير الإداري والتحليلي العام للمنصة</p>
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-gray-900">تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
              <p className="text-xs text-gray-500 font-mono">تصفية التقرير: {getFilterLabel()}</p>
            </div>
          </div>
        </div>

        {/* Header (Screen only) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-teal-600 animate-pulse" />
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                {isRtl ? 'التقارير التحليلية العامة' : 'SaaS Analytics Engine'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRtl ? 'تقارير المنصة وتحليلات الأدوية' : 'Management & Pharma Reports'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isRtl ? 'تحليل شامل لنشاط العيادات، إيرادات الاشتراكات، وحصص الأدوية السوقية' : 'Comprehensive insights on clinic signups, subscription revenues, and market share of prescribed medications'}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 gap-1.5 shadow-sm">
              <Printer className="w-4 h-4" />
              {isRtl ? 'طباعة التقرير' : 'Print Report'}
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm" className="w-9 h-9 p-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* ── ADVANCED FILTER PANEL ── */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:hidden">
          <CardHeader className="pb-3 flex-row items-center gap-2">
            <Funnel className="w-4 h-4 text-teal-600" />
            <CardTitle className="text-sm font-semibold">{isRtl ? 'نظام الفلاتر والبحث المتقدم' : 'Advanced Report Filtering'}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Period preset */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'الفترة الزمنية' : 'Time Period'}</Label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{isRtl ? 'كل الأوقات' : 'All Time'}</option>
                <option value="today">{isRtl ? 'اليوم' : 'Today'}</option>
                <option value="yesterday">{isRtl ? 'أمس' : 'Yesterday'}</option>
                <option value="7days">{isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                <option value="30days">{isRtl ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                <option value="thismonth">{isRtl ? 'الشهر الحالي' : 'This Month'}</option>
                <option value="custom">{isRtl ? 'فترة مخصصة...' : 'Custom Period...'}</option>
              </select>
            </div>

            {/* Custom date range fields */}
            {dateRange === 'custom' && (
              <>
                <div className="space-y-2">
                  <Label className="text-xs">{isRtl ? 'من تاريخ' : 'From Date'}</Label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{isRtl ? 'إلى تاريخ' : 'To Date'}</Label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-right"
                  />
                </div>
              </>
            )}

            {/* Filter by Plan */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'باقة الاشتراك' : 'Subscription Plan'}</Label>
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{isRtl ? 'كل الباقات' : 'All Plans'}</option>
                <option value="FREE">{isRtl ? 'مجاني' : 'Free'}</option>
                <option value="BASIC">{isRtl ? 'الأساسي' : 'Basic'}</option>
                <option value="PRO">{isRtl ? 'المحترف' : 'Pro'}</option>
                <option value="ENTERPRISE">{isRtl ? 'المؤسسات' : 'Enterprise'}</option>
              </select>
            </div>

            {/* Governorate Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'المحافظة' : 'Governorate'}</Label>
              <select
                value={govFilter}
                onChange={(e) => {
                  setGovFilter(e.target.value);
                  setCityFilter('all');
                }}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
                disabled={loadingGov}
              >
                <option value="all">{isRtl ? 'كل المحافظات' : 'All Governorates'}</option>
                {governorates.map((gov: any) => (
                  <option key={gov.id} value={gov.id}>{isRtl ? gov.nameAr : (gov.nameEn || gov.nameAr)}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'المدينة' : 'City'}</Label>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
                disabled={govFilter === 'all' || loadingCities}
              >
                <option value="all">{isRtl ? 'كل المدن' : 'All Cities'}</option>
                {cities.map((city: any) => (
                  <option key={city.id} value={city.id}>{isRtl ? city.nameAr : (city.nameEn || city.nameAr)}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'حالة الحساب' : 'Account Status'}</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
                <option value="ACTIVE">{isRtl ? 'نشط' : 'Active'}</option>
                <option value="DISABLED">{isRtl ? 'معطل' : 'Disabled'}</option>
                <option value="TRIAL">{isRtl ? 'فترة تجريبية' : 'Trial'}</option>
                <option value="OVERDUE">{isRtl ? 'متأخر السداد' : 'Overdue'}</option>
              </select>
            </div>

            {/* Specialty Filter */}
            <div className="space-y-2">
              <Label className="text-xs">{isRtl ? 'التخصص الطبي' : 'Specialty'}</Label>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value)}
                className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">{isRtl ? 'كل التخصصات' : 'All Specialties'}</option>
                {['باطنة', 'قلب', 'أطفال', 'أسنان', 'جلدية', 'نساء وتوليد', 'عظام', 'عيون', 'أنف وأذن وحنجرة', 'جراحة عامة', 'أعصاب', 'نفسية'].map((spec: any) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>

            {/* Reset actions */}
            <div className="flex items-end gap-2 lg:col-span-4 mt-2">
              <Button onClick={resetFilters} variant="ghost" className="w-full h-9 text-xs gap-1 border border-gray-200 dark:border-gray-800">
                <RefreshCw className="w-3 h-3" />
                {isRtl ? 'إعادة تعيين الفلاتر' : 'Reset All Filters'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── 1. PLATFORM SUMMARY STATS ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRtl ? 'إجمالي الاشتراكات' : 'Total Subscriptions', value: filteredTotalClinics, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
            { label: isRtl ? 'إجمالي الروشتات' : 'Total Prescriptions', value: filteredTotalPrescriptions, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
            { label: isRtl ? 'إجمالي المرضى' : 'Total Patients', value: filteredTotalPatients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: isRtl ? 'عائدات المنصة المحصلة' : 'Revenue Collected', value: `${filteredTotalRevenue.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${card.bg} print:bg-gray-100 flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      {isLoading ? <Skeleton className="h-6 w-12" /> : <div className="text-lg md:text-xl font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</div>}
                      <p className="text-xs text-gray-500 font-semibold">{card.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── 2. CHARTS & DETAILED ANALYSIS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
          {/* Top prescribed meds */}
          <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-600" /> {isRtl ? 'الأدوية الأكثر وصفاً (المنصة)' : 'Pharma Prescriptions'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-teal-600 text-xs h-8 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                onClick={() => router.push(`/${locale}/pharma-insights`)}
              >
                {isRtl ? 'عرض الكل' : 'View All'}
              </Button>
            </CardHeader>
            <CardContent>
              {pharmaData.length > 0 ? (
                <div className="space-y-4">
                  {pharmaData.slice(0, 5).map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{item.name} <span className="text-gray-400 font-normal">({item.category})</span></span>
                        <span className="text-teal-600 font-mono">{item.prescriptions} {isRtl ? 'روشتة' : 'Rx'}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-teal-500 h-2.5 rounded-full" style={{ width: `${Math.min((item.prescriptions / (stats?.pharmaAnalytics?.totalPrescriptions || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400 text-sm">
                  {isRtl ? 'لا توجد بيانات أدوية' : 'No prescription records'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinics details table */}
          <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300 lg:col-span-1">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Building2 className="w-4 h-4 text-teal-600" /> {isRtl ? 'بيانات العيادات المصدرة' : 'Subscribed Clinics Data'}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-4 py-2 font-bold text-gray-500">{isRtl ? 'العيادة' : 'Clinic'}</th>
                    <th className="px-4 py-2 font-bold text-gray-500">{isRtl ? 'الخطة' : 'Plan'}</th>
                    <th className="px-4 py-2 font-bold text-gray-500">{isRtl ? 'المرضى' : 'Patients'}</th>
                    <th className="px-4 py-2 font-bold text-gray-500">{isRtl ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredClinics.slice(0, 5).map((clinic) => (
                    <tr
                      key={clinic.id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors group"
                      onClick={() => router.push(`/${locale}/clinics/${clinic.id}`)}
                    >
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{clinic.name}</td>
                      <td className="px-4 py-3 font-mono">{clinic.subscriptionPlan}</td>
                      <td className="px-4 py-3 font-bold text-teal-600">{clinic.stats?.patients}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${clinic.subscriptionStatus === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {clinic.subscriptionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* Print Only Footer (Hidden on screen) */}
        <div className="hidden print:flex justify-between items-center border-t border-gray-200 pt-8 mt-12 text-xs text-gray-400">
          <p>تطبيق كلينك برو لإدارة العيادات والـ SaaS © ٢٠٢٦</p>
          <p>صفحة الإدارة العامة - تقرير سري للغاية</p>
          <p className="font-mono">توقيع المسؤول: __________________</p>
        </div>
      </div>
    );
  }

  // ── CLINIC USER REPORTS VIEW (Original preserved + styled beautifully for print) ──
  return (
    <div id="report-print-area" className={`space-y-6 animate-fade-in print-area ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Print Only Header */}
      <div className="hidden print:block border-b-2 border-teal-600 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-teal-800">ClinicPro - تقارير العيادة اليومية</h1>
            <p className="text-xs text-gray-500 font-mono">التقرير الدوري للأداء الطبي والزيارات</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
            <p className="text-xs text-gray-500 font-mono">تصفية التقرير: {getFilterLabel()}</p>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-down">{t('title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700 gap-1.5 shadow-sm">
            <Printer className="w-4 h-4" />
            {isRtl ? 'طباعة التقرير' : 'Print Report'}
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm" className="w-9 h-9 p-0">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* New clinic empty state */}
      {stats?.isNewClinic ? (
        <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm print:hidden">
          <CardContent className="p-8 md:p-12">
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-teal-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isRtl ? 'العيادة جديدة — لا توجد تقارير بعد' : 'New Clinic — No Reports Yet'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {isRtl
                    ? 'بمجرد أن تبدأ في استقبال المرضى وتسجيل الزيارات ووصف الروشتات، ستبدأ التحليلات والتقارير في الظهور هنا تلقائياً.'
                    : 'Once you start seeing patients, recording visits, and writing prescriptions, analytics and reports will appear here automatically.'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Users, label: isRtl ? 'سجل مرضاك' : 'Register Patients' },
                  { icon: CalendarDays, label: isRtl ? 'أنشئ مواعيد' : 'Create Appointments' },
                  { icon: FileText, label: isRtl ? 'اكتب روشتات' : 'Write Prescriptions' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 space-y-1.5">
                      <Icon className="w-5 h-5 mx-auto text-teal-500" />
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400">
                {isRtl ? 'التقارير تظهر تلقائياً — لا حاجة لتفعيل أي شيء' : 'Reports appear automatically — no setup required'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filters (Screen only) */}
          <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:hidden">
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-xs">{isRtl ? 'الفترة الزمنية للتقرير' : 'Report Period'}</Label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500"
                >
                  <option value="today">{isRtl ? 'اليوم' : 'Today'}</option>
                  <option value="yesterday">{isRtl ? 'أمس' : 'Yesterday'}</option>
                  <option value="7days">{isRtl ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
                  <option value="30days">{isRtl ? 'آخر 30 يوم' : 'Last 30 Days'}</option>
                  <option value="thismonth">{isRtl ? 'الشهر الحالي' : 'This Month'}</option>
                </select>
              </div>

              <Button onClick={resetFilters} variant="outline" size="sm" className="h-9 text-xs">
                {isRtl ? 'إعادة تعيين الفلاتر' : 'Reset'}
              </Button>
            </CardContent>
          </Card>

          {/* Cards stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${card.bg} print:bg-gray-100 flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${card.color}`} />
                      </div>
                      <div>
                        {isLoading ? <Skeleton className="h-6 w-12" /> : <div className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</div>}
                        <p className="text-xs text-gray-500 font-semibold">{card.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
            {/* Visit growth */}
            <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
              <CardHeader><CardTitle className="text-base">{t('patientGrowth')}</CardTitle></CardHeader>
              <CardContent className="print:hidden">
                <div className="h-[300px] w-full">
                  {isMounted && (
                    <ResponsiveContainer minWidth={0} width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                        <Bar dataKey="visits" fill="#0d9488" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
              {/* Printable tabular representation of charts */}
              <CardContent className="hidden print:block p-0">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="px-4 py-2">{isRtl ? 'اليوم' : 'Day'}</th>
                      <th className="px-4 py-2">{isRtl ? 'عدد الزيارات' : 'Visits'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {chartData.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-semibold">{d.name}</td>
                        <td className="px-4 py-2 font-mono font-bold text-teal-700">{d.visits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Visit Reasons */}
            <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
              <CardHeader><CardTitle className="text-base">{t('commonReasons')}</CardTitle></CardHeader>
              <CardContent>
                {(stats?.appointments?.COMPLETED ?? 0) > 0 ? (
                  <div className="space-y-3">
                    {[
                      { reason: isRtl ? 'كشف دوري' : 'Checkup', count: 45, pct: 40 },
                      { reason: isRtl ? 'متابعة كشف' : 'Follow-up', count: 28, pct: 25 },
                      { reason: isRtl ? 'كشف طارئ' : 'Emergency', count: 15, pct: 13 },
                      { reason: isRtl ? 'استشارة طبية' : 'Consultation', count: 12, pct: 11 },
                      { reason: isRtl ? 'تطعيمات' : 'Vaccination', count: 10, pct: 9 },
                    ].map((item) => (
                      <div key={item.reason} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-700 dark:text-gray-300">{item.reason}</span>
                          <span className="text-teal-600 font-mono">{item.count} {isRtl ? 'كشف' : 'visit'}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                          <div className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full" style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">
                    {isRtl ? 'لا توجد بيانات كافية — تظهر الأسباب بعد توفر الزيارات' : 'Not enough data — reasons appear after visits are recorded'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Print Only Footer */}
      <div className="hidden print:flex justify-between items-center border-t border-gray-200 pt-8 mt-12 text-xs text-gray-400">
        <p>تطبيق كلينك برو لإدارة العيادات والـ SaaS © ٢٠٢٦</p>
        <p>{isRtl ? 'تقرير سري وخاص بالعيادة' : 'Confidential Clinic Report'}</p>
        <p className="font-mono">{isRtl ? 'توقيع الطبيب المعالج: __________________' : 'Physician Signature: __________________'}</p>
      </div>
    </div>
  );
}
