'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard, Building2, RefreshCw, TrendingUp,
  Users, CalendarDays, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const PLAN_LABEL: Record<string, string> = {
  FREE: 'مجاني / Free',
  BASIC: 'أساسي / Basic',
  PRO: 'محترف / Pro',
  ENTERPRISE: 'مؤسسات / Enterprise',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  TRIAL: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function SubscriptionsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: clinics, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['subscriptions-data'],
    queryFn: () => api.get('/clinics').then((r) => r.data),
  });

  const summary = {
    total: clinics?.length || 0,
    active: clinics?.filter((c: any) => c.subscriptionStatus === 'ACTIVE').length || 0,
    trial: clinics?.filter((c: any) => c.subscriptionStatus === 'TRIAL').length || 0,
    suspended: clinics?.filter((c: any) => c.subscriptionStatus === 'SUSPENDED').length || 0,
  };

  const planBreakdown = (clinics || []).reduce((acc: Record<string, number>, c: any) => {
    acc[c.subscriptionPlan] = (acc[c.subscriptionPlan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-teal-600" />
            {isRtl ? 'إدارة الاشتراكات' : 'Subscriptions'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'حالة اشتراكات جميع العيادات في المنصة' : 'Subscription status for all clinics'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-4 h-4" />
          {isRtl ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: isRtl ? 'الإجمالي' : 'Total', value: summary.total, icon: Building2, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
              { label: isRtl ? 'نشط' : 'Active', value: summary.active, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
              { label: isRtl ? 'تجريبي' : 'Trial', value: summary.trial, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
              { label: isRtl ? 'موقوف' : 'Suspended', value: summary.suspended, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${s.bg} flex-shrink-0`}><Icon className={`w-5 h-5 ${s.color}`} /></div>
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                        <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-bold">{isRtl ? 'توزيع الخطط' : 'Plan Distribution'}</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(planBreakdown).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">{PLAN_LABEL[plan] || plan}</span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-3 rounded-full transition-all" style={{ width: `${(count / summary.total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold text-teal-600 font-mono w-16 text-end">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm font-bold">{isRtl ? 'جميع الاشتراكات' : 'All Subscriptions'}</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'العيادة' : 'Clinic'}</th>
                    <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الخطة' : 'Plan'}</th>
                    <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الحالة' : 'Status'}</th>
                    <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'المرضى' : 'Patients'}</th>
                    <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'تاريخ التسجيل' : 'Registered'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(clinics || []).map((c: any) => (
                    <tr key={c.id} className="hover:bg-teal-50/10">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{c.name}</td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${c.subscriptionPlan === 'FREE' ? 'bg-gray-100 text-gray-600' : c.subscriptionPlan === 'BASIC' ? 'bg-blue-100 text-blue-700' : c.subscriptionPlan === 'PRO' ? 'bg-teal-100 text-teal-700' : 'bg-purple-100 text-purple-700'}`}>{c.subscriptionPlan}</span></td>
                      <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[c.subscriptionStatus] || ''}`}>{c.subscriptionStatus}</span></td>
                      <td className="px-4 py-3 font-bold text-teal-600">{c.stats?.patients || 0}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(c.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}