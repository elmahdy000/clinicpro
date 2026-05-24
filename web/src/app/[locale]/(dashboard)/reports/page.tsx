'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3, CalendarDays, Users, Activity, XCircle, TrendingUp,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ReportsPage() {
  const t = useTranslations('reports');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then((r) => r.data),
  });

  const reportCards = [
    { label: t('totalVisits'), value: stats?.appointments?.COMPLETED ?? 0, icon: Activity, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: t('newPatients'), value: stats?.patients ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: t('completedAppointments'), value: stats?.appointments?.COMPLETED ?? 0, icon: CalendarDays, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: t('cancelledAppointments'), value: stats?.appointments?.CANCELLED ?? 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30' },
  ];

  const chartData = [
    { name: 'Jan', visits: 12 },
    { name: 'Feb', visits: 18 },
    { name: 'Mar', visits: 15 },
    { name: 'Apr', visits: 22 },
    { name: 'May', visits: 28 },
    { name: 'Jun', visits: 20 },
  ];

  return (
    <div className="space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-down">{t('title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {reportCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm card-hover animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${card.bg} transition-transform duration-150`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                  <div>
                    {isLoading ? <Skeleton className="h-6 w-12" /> : <p className="text-xl font-bold text-gray-900 dark:text-white tabular-nums">{card.value}</p>}
                    <p className="text-xs text-gray-500">{card.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader><CardTitle className="text-base">{t('patientGrowth')}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
                <Bar dataKey="visits" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-3">
          <CardHeader><CardTitle className="text-base">{t('commonReasons')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { reason: 'Checkup', count: 45, pct: 40 },
                { reason: 'Follow-up', count: 28, pct: 25 },
                { reason: 'Emergency', count: 15, pct: 13 },
                { reason: 'Consultation', count: 12, pct: 11 },
                { reason: 'Vaccination', count: 10, pct: 9 },
              ].map((item) => (
                <div key={item.reason}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{item.reason}</span>
                    <span className="text-gray-500 tabular-nums">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
