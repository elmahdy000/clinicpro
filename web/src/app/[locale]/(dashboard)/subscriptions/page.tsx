'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CreditCard, Search, Calendar, CheckCircle2, AlertTriangle, XCircle, Clock,
  ArrowUpRight, Building2, SlidersHorizontal, RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const PLAN_BADGES: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  BASIC: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/50',
  PRO: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200/50',
  ENTERPRISE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200/50',
};

const STATUS_BADGES: Record<string, { cls: string, icon: any }> = {
  ACTIVE: { cls: 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/50', icon: CheckCircle2 },
  SUSPENDED: { cls: 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200/50', icon: XCircle },
  TRIAL: { cls: 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200/50', icon: Clock },
};

export default function SubscriptionsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  const { data: clinics, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data } = await api.get('/clinics');
      return data;
    },
  });

  const filtered = clinics?.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? c.subscriptionStatus === statusFilter : true;
    const matchesPlan = planFilter ? c.subscriptionPlan === planFilter : true;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const stats = clinics ? {
    total: clinics.length,
    active: clinics.filter((c) => c.subscriptionStatus === 'ACTIVE').length,
    trial: clinics.filter((c) => c.subscriptionStatus === 'TRIAL').length,
    suspended: clinics.filter((c) => c.subscriptionStatus === 'SUSPENDED').length,
  } : { total: 0, active: 0, trial: 0, suspended: 0 };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" />
            {isRtl ? 'إدارة الاشتراكات' : 'Subscription Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'إدارة خطط اشتراكات العيادات، التجديدات، وتواريخ انتهاء الصلاحية' : 'Manage clinic subscription plans, renewals, and expiry dates'}
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="gap-1.5 self-start sm:self-center">
          <RefreshCw className="w-3.5 h-3.5" />
          {isRtl ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الاشتراكات' : 'Total Subscriptions', value: stats.total, color: 'text-teal-600', bg: 'bg-teal-50/50 dark:bg-teal-950/20' },
          { label: isRtl ? 'الاشتراكات النشطة' : 'Active Subs', value: stats.active, color: 'text-green-600', bg: 'bg-green-50/50 dark:bg-green-950/20' },
          { label: isRtl ? 'الفترات التجريبية' : 'Trial Accounts', value: stats.trial, color: 'text-amber-600', bg: 'bg-amber-50/50 dark:bg-amber-950/20' },
          { label: isRtl ? 'الحسابات الموقوفة' : 'Suspended Subs', value: stats.suspended, color: 'text-red-600', bg: 'bg-red-50/50 dark:bg-red-950/20' },
        ].map((s, i) => (
          <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
              <div className={`text-2xl font-bold mt-1 ${s.color}`}>{isLoading ? <Skeleton className="h-8 w-12" /> : s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? 'ابحث باسم العيادة...' : 'Search by clinic name...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="ACTIVE">{isRtl ? 'نشط' : 'Active'}</option>
              <option value="TRIAL">{isRtl ? 'تجريبي' : 'Trial'}</option>
              <option value="SUSPENDED">{isRtl ? 'موقوف' : 'Suspended'}</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{isRtl ? 'كل الخطط' : 'All Plans'}</option>
              <option value="FREE">{isRtl ? 'مجاني' : 'Free'}</option>
              <option value="BASIC">{isRtl ? 'الأساسي' : 'Basic'}</option>
              <option value="PRO">{isRtl ? 'المحترف' : 'Pro'}</option>
              <option value="ENTERPRISE">{isRtl ? 'المؤسسات' : 'Enterprise'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : !filtered || filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <CreditCard className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm font-semibold">{isRtl ? 'لا توجد اشتراكات مطابقة' : 'No subscriptions found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'العيادة' : 'Clinic'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'خطة الاشتراك' : 'Plan'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'حالة الاشتراك' : 'Status'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'تاريخ التجديد' : 'Expiry/Renewal'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-center">{isRtl ? 'الاستخدام' : 'Stats'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-center">{isRtl ? 'التحكم' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((clinic) => {
                    const StatusIcon = STATUS_BADGES[clinic.subscriptionStatus]?.icon || AlertTriangle;
                    return (
                      <tr key={clinic.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors group">
                        <td className="px-5 py-3">
                          <Link href={`/${locale}/clinics/${clinic.id}`} className="flex items-center gap-3 cursor-pointer group">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-4.5 h-4.5 text-teal-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 transition-colors">{clinic.name}</p>
                              <p className="text-[11px] text-gray-400 font-normal">{clinic.address || (isRtl ? 'بدول عنوان' : 'No address')}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${PLAN_BADGES[clinic.subscriptionPlan] || ''}`}>
                            {clinic.subscriptionPlan}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_BADGES[clinic.subscriptionStatus]?.cls || 'bg-gray-100'}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {isRtl
                              ? clinic.subscriptionStatus === 'ACTIVE' ? 'نشط'
                                : clinic.subscriptionStatus === 'TRIAL' ? 'فترة تجريبية'
                                : 'موقف'
                              : clinic.subscriptionStatus}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            {formatDate(clinic.createdAt, locale)} {/* Seed dates are based on createdAt */}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {clinic.stats?.users} {isRtl ? 'مستخدمين' : 'users'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Link href={`/${locale}/clinics/${clinic.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 hover:bg-teal-50 text-teal-600 gap-1">
                              {isRtl ? 'تفاصيل' : 'Details'}
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
