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

export default function PatientAppointmentsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const basePath = `/${locale}/patient`;
  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const statusMap: Record<string, string> = {
    SCHEDULED: isRtl ? 'مؤكد' : 'Confirmed',
    WAITING: isRtl ? 'في الانتظار' : 'Waiting',
    COMPLETED: isRtl ? 'مكتمل' : 'Completed',
    CANCELLED: isRtl ? 'ملغي' : 'Cancelled',
  };

  const tabs = [
    { key: 'upcoming', label: isRtl ? 'القادمة' : 'Upcoming' },
    { key: 'past', label: isRtl ? 'السابقة' : 'Past' },
    { key: 'cancelled', label: isRtl ? 'الملغية' : 'Cancelled' },
    { key: 'all', label: isRtl ? 'الكل' : 'All' },
  ];

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
      title: isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments',
      value: counts.upcoming,
      subtitle: counts.upcoming > 0 ? (isRtl ? 'موعد قادم' : 'upcoming appointment(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: CalendarDays,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: isRtl ? 'مكتملة' : 'Completed',
      value: counts.completed,
      subtitle: counts.completed > 0 ? (isRtl ? 'موعد مكتمل' : 'completed appointment(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: CalendarCheck,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: isRtl ? 'ملغية' : 'Cancelled',
      value: counts.cancelled,
      subtitle: counts.cancelled > 0 ? (isRtl ? 'موعد ملغي' : 'cancelled appointment(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: CalendarX,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      title: isRtl ? 'آخر موعد' : 'Last Appointment',
      value: counts.lastDate ? formatDate(counts.lastDate, locale) : '—',
      subtitle: counts.lastDate ? (isRtl ? 'تاريخ آخر موعد' : 'Date of last appointment') : (isRtl ? 'لا يوجد' : 'None'),
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'مواعيدي' : 'My Appointments'}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {isRtl
            ? 'تابع مواعيدك السابقة والقادمة داخل العيادات المرتبطة بحسابك'
            : 'Track your upcoming and past appointments at your linked clinics'}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
              <CardContent className="p-4 flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                activeTab === tab.key
                  ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-850 dark:text-teal-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-350',
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
            placeholder={isRtl ? 'بحث باسم العيادة أو الطبيب' : 'Search by clinic or doctor'}
            className="h-9 pr-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((apt: any) => (
            <Card key={apt.id} className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                        {formatDate(apt.date, locale)}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(apt.time).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-450">
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
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {isRtl ? 'سبب الزيارة: ' : 'Reason for visit: '}
                        {apt.reason}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-[10px] font-semibold',
                        apt.status === 'SCHEDULED' || apt.status === 'CONFIRMED'
                          ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400'
                          : apt.status === 'COMPLETED'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                            : apt.status === 'CANCELLED'
                              ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400',
                      )}
                    >
                      {statusMap[apt.status] || apt.status}
                    </span>
                    <Link href={`${basePath}/appointments`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg">
                        {isRtl ? 'عرض التفاصيل' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-350 text-sm">
              {isRtl ? 'لا توجد مواعيد مسجلة' : 'No appointments registered'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">
              {isRtl ? 'ستظهر هنا مواعيدك بعد تسجيلها من العيادة.' : 'Your appointments will appear here once registered by the clinic.'}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-550 mt-3">
              {isRtl ? 'للحجز، تواصل مع العيادة المرتبطة بحسابك.' : 'To book an appointment, please contact your clinic.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
