'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  Clock,
  Building2,
  User,
  Search,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const statusMap: Record<string, string> = {
  SCHEDULED: 'مؤكد',
  WAITING: 'في الانتظار',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

const TABS = [
  { key: 'upcoming', label: 'القادمة' },
  { key: 'past', label: 'السابقة' },
  { key: 'cancelled', label: 'الملغية' },
  { key: 'all', label: 'الكل' },
];

export default function PatientAppointmentsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const basePath = `/${locale}/patient`;
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/patient-portal/appointments').then((r) => r.data),
  });

  const mapped = useMemo(() => {
    const all: any[] = (appointments || []).map((a: any) => ({
      id: a.id,
      date: a.appointmentDate,
      time: a.appointmentDate,
      clinicName: a.clinic?.name || '',
      doctorName: a.doctor?.user?.name || a.doctorName || '',
      reason: a.reason || '',
      status: a.status,
    }));
    return all;
  }, [appointments]);

  const now = new Date();

  const filtered = useMemo(() => {
    let list = mapped;

    if (activeTab === 'upcoming') {
      list = list.filter((a: any) => new Date(a.date) >= now && a.status !== 'CANCELLED');
    } else if (activeTab === 'past') {
      list = list.filter((a: any) => new Date(a.date) < now && a.status !== 'CANCELLED');
    } else if (activeTab === 'cancelled') {
      list = list.filter((a: any) => a.status === 'CANCELLED');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a: any) =>
          a.clinicName.toLowerCase().includes(q) || a.doctorName.toLowerCase().includes(q),
      );
    }

    return list;
  }, [mapped, activeTab, searchQuery, now]);

  const counts = useMemo(() => {
    const upcoming = mapped.filter((a: any) => new Date(a.date) >= now && a.status !== 'CANCELLED').length;
    const completed = mapped.filter((a: any) => a.status === 'COMPLETED').length;
    const cancelled = mapped.filter((a: any) => a.status === 'CANCELLED').length;
    const last = mapped
      .filter((a: any) => a.status !== 'CANCELLED')
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    return { upcoming, completed, cancelled, lastDate: last?.date || null };
  }, [mapped, now]);

  const summaryCards = [
    {
      title: 'المواعيد القادمة',
      value: counts.upcoming,
      subtitle: counts.upcoming > 0 ? 'موعد قادم' : 'لا توجد',
      icon: CalendarDays,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'مكتملة',
      value: counts.completed,
      subtitle: counts.completed > 0 ? 'موعد مكتمل' : 'لا توجد',
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'ملغية',
      value: counts.cancelled,
      subtitle: counts.cancelled > 0 ? 'موعد ملغي' : 'لا توجد',
      icon: CalendarX,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: 'آخر موعد',
      value: counts.lastDate ? formatDate(counts.lastDate, locale) : '—',
      subtitle: counts.lastDate ? 'تاريخ آخر موعد' : 'لا يوجد',
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-xl font-bold text-slate-900">مواعيدي</h1>
        <p className="text-sm text-slate-500 mt-0.5">تابع مواعيدك السابقة والقادمة داخل العيادات المرتبطة بحسابك</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                activeTab === tab.key
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم العيادة أو الطبيب"
            className="h-9 pr-9 text-xs rounded-xl border-slate-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((apt: any) => (
            <Card key={apt.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="font-semibold text-sm text-slate-900">
                        {formatDate(apt.date, locale)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(apt.time).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {apt.clinicName}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {apt.doctorName}
                      </span>
                    </div>
                    {apt.reason && (
                      <p className="text-xs text-slate-500">سبب الزيارة: {apt.reason}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                        apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
                          ? 'bg-teal-50 text-teal-700'
                          : apt.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700'
                            : apt.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-amber-50 text-amber-700',
                      )}
                    >
                      {statusMap[apt.status] || apt.status}
                    </span>
                    <Link href={`${basePath}/appointments`}>
                      <Button variant="outline" size="sm" className="text-xs h-7">عرض التفاصيل</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">لا توجد مواعيد مسجلة</p>
            <p className="text-xs text-slate-500 mt-1">ستظهر هنا مواعيدك بعد تسجيلها من العيادة.</p>
            <p className="text-xs text-slate-400 mt-3">للحجز، تواصل مع العيادة المرتبطة بحسابك.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
