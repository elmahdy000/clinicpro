'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/common/SearchBox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';
import {
  Clock3,
  CircleCheckBig,
  ClipboardList,
  Plus,
  RefreshCw,
  Stethoscope,
  UserRound,
  UserRoundCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

const statusTabs = ['all', 'waiting', 'inProgress', 'completed', 'cancelled'] as const;
type StatusTab = typeof statusTabs[number];

const STYLE_MAP: Record<string, string> = {
  PENDING: 'badge-waiting',
  CONFIRMED: 'badge-confirmed',
  IN_PROGRESS: 'badge-in-progress',
  COMPLETED: 'badge-completed',
  CANCELLED: 'badge-cancelled',
  MISSED: 'badge-missed',
};

export default function QueuePage() {
  const t = useTranslations('queue');
  const tc = useTranslations('common');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [search, setSearch] = useState('');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: () => api.get('/appointments').then((r) => r.data),
  });

    const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.put(`/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
      toast.success('تم تحديث الحالة');
    },
    onError: () => toast.error('فشل تحديث الحالة'),
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['today-appointments'] });
    toast.success('تم تحديث القائمة');
  };

  const all = appointments?.data || [];

  const today = useMemo(
    () =>
      all
        .filter((a: any) => {
          const d = new Date(a.appointmentDate);
          const now = new Date();
          return d.toDateString() === now.toDateString();
        })
        .sort((a: any, b: any) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()),
    [all],
  );

  const counts = useMemo(
    () => ({
      all: today.length,
      waiting: today.filter((a: any) => a.status === 'PENDING').length,
      inProgress: today.filter((a: any) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length,
      completed: today.filter((a: any) => a.status === 'COMPLETED').length,
      cancelled: today.filter((a: any) => a.status === 'CANCELLED' || a.status === 'MISSED').length,
    }),
    [today],
  );

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      PENDING: t('waiting'),
      CONFIRMED: t('inProgress'),
      IN_PROGRESS: t('inProgress'),
      COMPLETED: t('completed'),
      CANCELLED: t('cancelled'),
      MISSED: 'ماحضرش',
    };
    return map[status] || status;
  };

  const filteredBase = useMemo(() => {
    if (activeTab === 'all') return today;
    const map: Record<string, string[]> = {
      waiting: ['PENDING'],
      inProgress: ['CONFIRMED', 'IN_PROGRESS'],
      completed: ['COMPLETED'],
      cancelled: ['CANCELLED', 'MISSED'],
    };
    return today.filter((a: any) => map[activeTab].includes(a.status));
  }, [today, activeTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredBase;
    return filteredBase.filter((a: any) => {
      const name = `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.toLowerCase();
      const phone = (a.patient?.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || String(a.id).includes(q);
    });
  }, [filteredBase, search]);

  const nextPatient = filtered.find((a: any) => a.status === 'PENDING');
  const waitingList = filtered.filter((a: any) => a.status === 'PENDING');
  const inProgressList = filtered.filter((a: any) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS');
  const doneList = filtered.filter((a: any) => a.status === 'COMPLETED' || a.status === 'CANCELLED' || a.status === 'MISSED');

  const queueItem = (apt: any, compact = false) => (
    <div key={apt.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3 hover:shadow-sm transition-all">
      <div className="flex items-start gap-2.5">
        <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold">
          {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
          {apt.queuePosition && (
            <span className="absolute -top-1.5 -end-1.5 w-4 h-4 rounded-full bg-amber-500 text-white text-[8px] font-bold flex items-center justify-center shadow-sm">
              {apt.queuePosition}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
          <p className="text-xs text-slate-500 truncate">{formatTime(apt.appointmentDate, locale)} • {apt.patient?.phone || '-'}</p>
          {!compact && <p className="text-xs text-slate-500 mt-1 truncate">{apt.reason || '-'}</p>}
        </div>
        <Badge className={STYLE_MAP[apt.status] || 'badge-pending'}>{statusLabel(apt.status)}</Badge>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link href={`/${locale}/patients/${apt.patient?.id}`}>
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">
            <UserRound className="w-3.5 h-3.5 me-1" />
            ملف المريض
          </Button>
        </Link>
        <Link href={`/${locale}/appointments/${apt.id}`}>
          <Button size="sm" variant="outline" className="h-8 text-xs rounded-lg">الموعد</Button>
        </Link>
        {apt.status === 'PENDING' && (
          <Button size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 rounded-lg" onClick={() => updateMutation.mutate({ id: apt.id, status: 'CONFIRMED' })}>
            <UserRoundCheck className="w-3.5 h-3.5 me-1" />
            {t('checkIn')}
          </Button>
        )}
        {(apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS') && (
          <Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}`}>
            <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 rounded-lg">
              <Stethoscope className="w-3.5 h-3.5 me-1" />
              {t('startVisit')}
            </Button>
          </Link>
        )}
        {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && apt.status !== 'MISSED' && (
          <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg" onClick={() => updateMutation.mutate({ id: apt.id, status: 'CANCELLED' })}>
            <XCircle className="w-3.5 h-3.5 me-1" />
            {t('cancel')}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 px-5 py-6 lg:px-7" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">قائمة اليوم</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">إدارة حركة المرضى اليومية داخل العيادة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-9 rounded-lg text-xs gap-1.5" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
          <Link href={`/${locale}/appointments/new`}>
            <Button size="sm" className="h-9 rounded-lg text-xs gap-1.5 bg-cyan-600 hover:bg-cyan-700">
              <Plus className="w-4 h-4" />
              إضافة للقائمة
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { key: 'all', label: tc('all'), value: counts.all, icon: ClipboardList },
          { key: 'waiting', label: t('waiting'), value: counts.waiting, icon: Clock3 },
          { key: 'inProgress', label: t('inProgress'), value: counts.inProgress, icon: Stethoscope },
          { key: 'completed', label: t('completed'), value: counts.completed, icon: CircleCheckBig },
          { key: 'cancelled', label: t('cancelled'), value: counts.cancelled, icon: XCircle },
        ].map((c) => {
          const Icon = c.icon;
          const active = activeTab === c.key;
          return (
            <button key={c.key} onClick={() => setActiveTab(c.key as StatusTab)} className={`text-start rounded-xl border p-3 transition-all ${active ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/30 shadow-sm' : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 hover:border-slate-300'}`}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{c.label}</p>
                <Icon className={`w-4 h-4 ${active ? 'text-teal-600' : 'text-slate-400'}`} />
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{c.value}</p>
            </button>
          );
        })}
      </div>

      <Card className="medical-panel">
        <CardContent className="p-3 md:p-4 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <SearchBox value={search} onChange={setSearch} placeholder="بحث بالاسم أو الهاتف أو رقم الموعد" />
          </div>
          <div className="flex gap-1.5">
            {statusTabs.map((tab) => (
              <Button key={tab} size="sm" variant={activeTab === tab ? 'default' : 'outline'} className={`h-8 rounded-lg text-xs ${activeTab === tab ? 'bg-teal-600 hover:bg-teal-700' : ''}`} onClick={() => setActiveTab(tab)}>
                {tab === 'all' ? tc('all') : t(tab)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="medical-panel">
          <CardContent className="p-8 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">لا يوجد مرضى في قائمة اليوم</p>
            <p className="text-xs text-slate-500 mt-1">ابدأ بإضافة موعد جديد لليوم أو عدّل الفلاتر.</p>
            <Link href={`/${locale}/appointments/new`} className="inline-block mt-4">
              <Button className="bg-teal-600 hover:bg-teal-700 rounded-lg text-xs">
                <Plus className="w-4 h-4 me-1" />
                إضافة أول مريض
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Card className="medical-panel xl:col-span-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">المريض التالي</CardTitle></CardHeader>
            <CardContent>{nextPatient ? queueItem(nextPatient) : <p className="text-xs text-slate-500">لا يوجد مريض قادم الآن</p>}</CardContent>
          </Card>

          <div className="xl:col-span-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="medical-panel">
              <CardHeader className="pb-2"><CardTitle className="text-sm">في الانتظار</CardTitle></CardHeader>
              <CardContent className="space-y-2">{waitingList.length ? waitingList.map((a: any) => queueItem(a, true)) : <p className="text-xs text-slate-500">لا يوجد</p>}</CardContent>
            </Card>
            <Card className="medical-panel">
              <CardHeader className="pb-2"><CardTitle className="text-sm">داخل الكشف</CardTitle></CardHeader>
              <CardContent className="space-y-2">{inProgressList.length ? inProgressList.map((a: any) => queueItem(a, true)) : <p className="text-xs text-slate-500">لا يوجد</p>}</CardContent>
            </Card>
            <Card className="medical-panel">
              <CardHeader className="pb-2"><CardTitle className="text-sm">منتهي / ملغي</CardTitle></CardHeader>
              <CardContent className="space-y-2">{doneList.length ? doneList.map((a: any) => queueItem(a, true)) : <p className="text-xs text-slate-500">لا يوجد</p>}</CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
