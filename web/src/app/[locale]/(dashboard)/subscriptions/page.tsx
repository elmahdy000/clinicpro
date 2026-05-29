'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';
import {
  CreditCard, Building2, RefreshCw, TrendingUp,
  Users, CalendarDays, CheckCircle2, XCircle, Search, SlidersHorizontal, MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLAN_LABEL: Record<string, string> = {
  FREE: 'مجاني / Free',
  BASIC: 'أساسي / Basic',
  PRO: 'محترف / Pro',
  ENTERPRISE: 'مؤسسات / Enterprise',
};

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  BASIC: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-355 border-blue-100 dark:border-blue-900/20',
  PRO: 'bg-teal-50 text-teal-755 dark:bg-teal-950/30 dark:text-teal-300 border-teal-100 dark:border-teal-900/20',
  ENTERPRISE: 'bg-purple-50 text-purple-755 dark:bg-purple-950/30 dark:text-purple-300 border-purple-100 dark:border-purple-900/20',
};

const PLAN_COLOR_AR: Record<string, string> = {
  FREE: 'مبادرة مجانية',
  BASIC: 'الباقة الأساسية',
  PRO: 'الباقة الاحترافية',
  ENTERPRISE: 'باقة المؤسسات',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-50/50 text-emerald-700 border-emerald-150/30 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30',
  SUSPENDED: 'bg-rose-50/50 text-rose-700 border-rose-150/30 dark:bg-rose-950/20 dark:text-rose-455 dark:border-rose-900/30',
  TRIAL: 'bg-amber-50/50 text-amber-700 border-amber-150/30 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30',
};

const STATUS_COLOR_AR: Record<string, string> = {
  ACTIVE: 'نشط ومفعل',
  SUSPENDED: 'موقوف مؤقتاً',
  TRIAL: 'فترة تجريبية',
};

const BILLING_COLOR: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900',
};

const BILLING_COLOR_AR: Record<string, string> = {
  PAID: 'مسددة بالكامل',
  PENDING: 'بانتظار السداد',
  OVERDUE: 'متأخرة السداد',
};

const getBillingStatus = (c: any) => {
  if (c.billingStatus) return c.billingStatus;
  
  if (c.subscriptionPlan === 'FREE') return 'PAID';
  if (c.subscriptionStatus === 'ACTIVE') return 'PAID';
  if (c.subscriptionStatus === 'TRIAL') return 'PENDING';
  if (c.subscriptionStatus === 'SUSPENDED') return 'OVERDUE';
  return 'PENDING';
};

export default function SubscriptionsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [govFilter, setGovFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [joinDateFilter, setJoinDateFilter] = useState('ALL');
  const [billingFilter, setBillingFilter] = useState('ALL');

  // Load Governorates & Cities
  const { data: governorates } = useGovernorates();
  const { data: cities } = useCities(govFilter !== 'ALL' ? govFilter : null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PLATFORM_OWNER')) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, authLoading, router, locale]);

  const { data: clinics, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['subscriptions-data'],
    queryFn: () => api.get('/clinics').then((r) => r.data),
    refetchInterval: 10_000,
  });

  if (authLoading || !user || user.role !== 'PLATFORM_OWNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  // Filter Logic
  const filteredClinics = (clinics || []).filter((c: any) => {
    // 1. Search Query
    const matchesSearch = !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Status Filter
    const matchesStatus = statusFilter === 'ALL' || c.subscriptionStatus === statusFilter;
    
    // 3. Plan Filter
    const matchesPlan = planFilter === 'ALL' || c.subscriptionPlan === planFilter;
    
    // 4. Governorate Filter
    const matchesGov = govFilter === 'ALL' || c.governorate?.id === govFilter;
    
    // 5. City Filter
    const matchesCity = cityFilter === 'ALL' || c.city?.id === cityFilter;
    
    // 6. Join Date Filter
    let matchesDate = true;
    if (joinDateFilter !== 'ALL') {
      const createdDate = new Date(c.createdAt);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (joinDateFilter === 'TODAY') {
        matchesDate = createdDate.toDateString() === today.toDateString();
      } else if (joinDateFilter === '7DAYS') {
        matchesDate = diffDays <= 7;
      } else if (joinDateFilter === '30DAYS') {
        matchesDate = diffDays <= 30;
      }
    }
    
    // 7. Billing Status Filter
    const derivedBilling = getBillingStatus(c);
    const matchesBilling = billingFilter === 'ALL' || derivedBilling === billingFilter;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesGov && matchesCity && matchesDate && matchesBilling;
  });

  const summary = {
    total: filteredClinics.length,
    active: filteredClinics.filter((c: any) => c.subscriptionStatus === 'ACTIVE').length,
    trial: filteredClinics.filter((c: any) => c.subscriptionStatus === 'TRIAL').length,
    suspended: filteredClinics.filter((c: any) => c.subscriptionStatus === 'SUSPENDED').length,
  };

  const planBreakdown = filteredClinics.reduce((acc: Record<string, number>, c: any) => {
    acc[c.subscriptionPlan] = (acc[c.subscriptionPlan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
            <CreditCard className="w-5.5 h-5.5 text-teal-650 dark:text-teal-400" />
            {isRtl ? 'إدارة اشتراكات المنصة' : 'SaaS Subscriptions Engine'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isRtl ? 'حالة اشتراكات عيادات ومستشفيات المنصة بالتفصيل' : 'Comprehensive subscription matrices across all registered clinics'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white font-semibold text-xs text-slate-700 dark:text-slate-300">
          <RefreshCw className="w-3.5 h-3.5" />
          {isRtl ? 'تحديث' : 'Sync'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: isRtl ? 'إجمالي العيادات' : 'Total Clinics', value: summary.total, icon: Building2, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50/50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/30' },
              { label: isRtl ? 'نشط ومفعل' : 'Active Tier', value: summary.active, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-450', bg: 'bg-emerald-50/40 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/30' },
              { label: isRtl ? 'فترة تجريبية' : 'Trial Tier', value: summary.trial, icon: TrendingUp, color: 'text-amber-600 dark:text-amber-450', bg: 'bg-amber-50/40 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/30' },
              { label: isRtl ? 'موقوف مؤقتاً' : 'Suspended Tier', value: summary.suspended, icon: XCircle, color: 'text-rose-600 dark:text-rose-455', bg: 'bg-rose-50/40 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/30' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-2xs hover:shadow-xs transition-shadow">
                  <CardContent className="p-4 flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${s.bg} flex-shrink-0`}><Icon className={`w-4.5 h-4.5 ${s.color}`} /></div>
                    <div>
                      <p className="text-lg font-bold font-mono text-slate-900 dark:text-white leading-tight">{s.value}</p>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-wider pt-0.5">{s.label}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── ADVANCED SAAS FILTER BAR ── */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-2xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 pt-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <SlidersHorizontal className="w-4 h-4 text-teal-650 dark:text-teal-400 shrink-0" />
                {isRtl ? 'محرك تصفية وبحث الاشتراكات' : 'SaaS Subscription Engine Filters'}
              </CardTitle>
              {searchQuery || statusFilter !== 'ALL' || planFilter !== 'ALL' || govFilter !== 'ALL' || cityFilter !== 'ALL' || joinDateFilter !== 'ALL' || billingFilter !== 'ALL' ? (
                <Button 
                  variant="ghost" 
                  size="xs" 
                  className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 px-2"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('ALL');
                    setPlanFilter('ALL');
                    setGovFilter('ALL');
                    setCityFilter('ALL');
                    setJoinDateFilter('ALL');
                    setBillingFilter('ALL');
                  }}
                >
                  {isRtl ? 'إعادة ضبط التصفية' : 'Reset Filters'}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5 text-xs">
              
              {/* Search Query */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'بحث' : 'Search'}</Label>
                <div className="relative">
                  <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isRtl ? 'ابحث باسم العيادة...' : 'Search clinic name...'}
                    className="h-9 pr-9 pl-3 text-xs"
                  />
                </div>
              </div>

              {/* Subscription Status */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'حالة الاشتراك' : 'Sub Status'}</Label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                  <option value="ACTIVE" className="text-black dark:text-white">{isRtl ? 'نشط ومفعل' : 'Active'}</option>
                  <option value="TRIAL" className="text-black dark:text-white">{isRtl ? 'فترة تجريبية' : 'Trial'}</option>
                  <option value="SUSPENDED" className="text-black dark:text-white">{isRtl ? 'موقوف مؤقتاً' : 'Suspended'}</option>
                </select>
              </div>

              {/* Subscription Plan */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'خطة الاشتراك' : 'SaaS Plan'}</Label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع الباقات' : 'All Plans'}</option>
                  <option value="FREE" className="text-black dark:text-white">FREE</option>
                  <option value="BASIC" className="text-black dark:text-white">BASIC</option>
                  <option value="PRO" className="text-black dark:text-white">PRO</option>
                  <option value="ENTERPRISE" className="text-black dark:text-white">ENTERPRISE</option>
                </select>
              </div>

              {/* Governorate */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المحافظة' : 'Governorate'}</Label>
                <select
                  value={govFilter}
                  onChange={(e) => {
                    setGovFilter(e.target.value);
                    setCityFilter('ALL');
                  }}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'كل المحافظات' : 'All Governorates'}</option>
                  {governorates?.map((g: any) => (
                    <option key={g.id} value={g.id} className="text-black dark:text-white">{isRtl ? g.nameAr : g.nameEn}</option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المدينة' : 'City'}</Label>
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  disabled={govFilter === 'ALL'}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900 disabled:opacity-50"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'كل المدن' : 'All Cities'}</option>
                  {cities?.map((c: any) => (
                    <option key={c.id} value={c.id} className="text-black dark:text-white">{isRtl ? c.nameAr : c.nameEn}</option>
                  ))}
                </select>
              </div>

              {/* Join Date */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'تاريخ الانضمام' : 'Join Date'}</Label>
                <select
                  value={joinDateFilter}
                  onChange={(e) => setJoinDateFilter(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'كل الأوقات' : 'All Time'}</option>
                  <option value="TODAY" className="text-black dark:text-white">{isRtl ? 'انضم اليوم' : 'Joined Today'}</option>
                  <option value="7DAYS" className="text-black dark:text-white">{isRtl ? 'آخر ٧ أيام' : 'Last 7 Days'}</option>
                  <option value="30DAYS" className="text-black dark:text-white">{isRtl ? 'آخر ٣٠ يوم' : 'Last 30 Days'}</option>
                </select>
              </div>

              {/* Billing Status */}
              <div className="space-y-1">
                <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'حالة الفواتير' : 'Billing Status'}</Label>
                <select
                  value={billingFilter}
                  onChange={(e) => setBillingFilter(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
                >
                  <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع الفواتير' : 'All Billings'}</option>
                  <option value="PAID" className="text-black dark:text-white">{isRtl ? 'مدفوعة بالكامل' : 'Paid in Full'}</option>
                  <option value="PENDING" className="text-black dark:text-white">{isRtl ? 'بانتظار السداد' : 'Pending'}</option>
                  <option value="OVERDUE" className="text-black dark:text-white">{isRtl ? 'متأخرة السداد' : 'Overdue'}</option>
                </select>
              </div>

            </CardContent>
          </Card>

          {/* Plan Distribution Progress */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl">
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80"><CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{isRtl ? 'توزيع خطط وباقات الاشتراكات' : 'SaaS Plan Distribution Matrices'}</CardTitle></CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {Object.entries(planBreakdown).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-32 truncate">{PLAN_LABEL[plan] || plan}</span>
                    <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-200/50 dark:border-slate-900">
                      <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-2.5 rounded-full transition-all" style={{ width: `${(count / (summary.total || 1)) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-teal-600 font-mono w-16 text-end">{count}</span>
                  </div>
                ))}
                {Object.keys(planBreakdown).length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-2">{isRtl ? 'لا توجد بيانات توزيع للباقات تطابق الفلاتر المحددة' : 'No plans data matching active filters'}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80"><CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">{isRtl ? 'تفاصيل الاشتراكات الموحدة' : 'Unified SaaS Subscriptions ledger'}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-slate-50/50 dark:bg-slate-950/40">
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'العيادة الطبية' : 'Registered Clinic'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'خطة الاشتراك' : 'SaaS Package'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'حالة الاشتراك' : 'Subscription Status'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'حالة الفواتير' : 'Billing Status'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'المحافظة والمدينة' : 'Location'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'إجمالي المرضى' : 'Active Patient Records'}</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'تاريخ الانضمام' : 'Onboard Date'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {filteredClinics.map((c: any) => {
                    const billing = getBillingStatus(c);
                    return (
                      <tr key={c.id} className="hover:bg-teal-500/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{c.name}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[8px] font-semibold px-2 py-0.5 rounded ${PLAN_COLOR[c.subscriptionPlan] || ''}`}>
                            {isRtl ? PLAN_COLOR_AR[c.subscriptionPlan] || c.subscriptionPlan : c.subscriptionPlan}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[8px] font-semibold px-2 py-0.5 rounded flex items-center w-max gap-1 ${STATUS_COLOR[c.subscriptionStatus] || ''}`}>
                            {isRtl ? STATUS_COLOR_AR[c.subscriptionStatus] || c.subscriptionStatus : c.subscriptionStatus}
                            {c.subscriptionStatus === 'TRIAL' && c.trialEndsAt && (() => {
                              const daysLeft = Math.ceil((new Date(c.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                              if (daysLeft > 0) return <span className="opacity-80 ms-1 font-mono">({daysLeft} {isRtl ? 'يوم' : 'days'})</span>;
                              return null;
                            })()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={`text-[8px] font-semibold px-2 py-0.5 rounded ${BILLING_COLOR[billing] || ''}`}>
                            {isRtl ? BILLING_COLOR_AR[billing] || billing : billing}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {c.governorate ? `${isRtl ? c.governorate.nameAr : c.governorate.nameEn}${c.city ? `، ${isRtl ? c.city.nameAr : c.city.nameEn}` : ''}` : '—'}
                        </td>
                        <td className="px-4 py-3 font-bold font-mono text-teal-600">{c.stats?.patients || 0}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      </tr>
                    );
                  })}
                  {filteredClinics.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-medium bg-slate-50/20 dark:bg-slate-950/10">
                        {isRtl ? 'لم يتم العثور على أي عيادات أو اشتراكات تطابق شروط التصفية المحددة' : 'No subscription data found matching selected filter criteria.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}