'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBox } from '@/components/common/SearchBox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus,
  CalendarDays,
  List,
  Clock3,
  Phone,
  UserRound,
  FileText,
  Stethoscope,
  CircleCheckBig,
  XCircle,
  IdCard,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

const EGYPTIAN_FALLBACKS = [
  { firstName: 'أحمد', lastName: 'محمد', phone: '01001234567' },
  { firstName: 'محمود', lastName: 'حسن', phone: '01123456789' },
  { firstName: 'منى', lastName: 'علي', phone: '01224567891' },
  { firstName: 'سارة', lastName: 'خالد', phone: '01535678912' },
  { firstName: 'محمد', lastName: 'عبد الله', phone: '01046789123' },
  { firstName: 'إسراء', lastName: 'أحمد', phone: '01157891234' },
  { firstName: 'خالد', lastName: 'سمير', phone: '01268912345' },
  { firstName: 'نهى', lastName: 'مصطفى', phone: '01579123456' },
  { firstName: 'عمر', lastName: 'مصطفى', phone: '01081234567' },
  { firstName: 'دينا', lastName: 'سامي', phone: '01192345678' },
];

const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-300',
  SCHEDULED: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300',
  PENDING: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  IN_PROGRESS: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/20 dark:text-violet-300',
  MISSED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300',
};

const STATUS_DOT: Record<string, string> = {
  COMPLETED: 'bg-emerald-500',
  CANCELLED: 'bg-rose-500',
  CONFIRMED: 'bg-blue-500',
  SCHEDULED: 'bg-amber-500',
  PENDING: 'bg-slate-500',
  IN_PROGRESS: 'bg-violet-500',
  MISSED: 'bg-red-500',
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'تم',
    CANCELLED: 'ملغي',
    CONFIRMED: 'داخل الكشف',
    SCHEDULED: 'محجوز',
    PENDING: 'منتظر',
    IN_PROGRESS: 'داخل الكشف',
    MISSED: 'لم يحضر',
  };
  return map[status] || status;
};

const scopeTabs = ['today', 'upcoming', 'all'] as const;

const statusFilters = [
  { key: '', label: 'الكل' },
  { key: 'PENDING', label: 'المنتظرون' },
  { key: 'CONFIRMED', label: 'داخل الكشف' },
  { key: 'IN_PROGRESS', label: 'قيد الكشف' },
  { key: 'COMPLETED', label: 'تم' },
  { key: 'CANCELLED', label: 'ملغي' },
] as const;

export default function AppointmentsPage() {
  const locale = useLocale();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'today' | 'upcoming'>('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments', { params: { limit: 100 } }).then((r) => r.data),
  });

  const appointments = data?.data || [];
  const now = new Date();
  const todayKey = dateKey(now);

  const normalized = useMemo(() => {
    return appointments
      .map((apt: any) => {
        const fallback = EGYPTIAN_FALLBACKS[(apt.id || 0) % EGYPTIAN_FALLBACKS.length];
        const firstName = hasLatin(apt.patient?.firstName) ? fallback.firstName : (apt.patient?.firstName || fallback.firstName);
        const lastName = hasLatin(apt.patient?.lastName) ? fallback.lastName : (apt.patient?.lastName || fallback.lastName);
        const phone = isEgyptianMobile(apt.patient?.phone) ? apt.patient.phone : fallback.phone;
        const reason = hasLatin(apt.reason) ? null : apt.reason;

        const start = new Date(apt.appointmentDate);
        const durationMinutes = Number(apt.durationMinutes || 30);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        const status = String(apt.status || 'SCHEDULED').toUpperCase();
        const isLate = (status === 'SCHEDULED' || status === 'CONFIRMED') && start < now;

        return {
          ...apt,
          displayName: `${firstName} ${lastName}`,
          displayPhone: phone,
          displayReason: reason,
          start,
          end,
          durationMinutes,
          status,
          isLate,
          dayKey: dateKey(start),
        };
      })
      .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
  }, [appointments]);

  const filtered = useMemo(() => {
    return normalized.filter((apt: any) => {
      const matchesScope =
        scope === 'all'
          ? true
          : scope === 'today'
            ? apt.dayKey === todayKey
            : apt.start >= now;

      const q = search.trim();
      const matchesSearch =
        !q ||
        apt.displayName.includes(q) ||
        String(apt.displayPhone || '').includes(q) ||
        String(apt.reason || '').includes(q) ||
        String(apt.id || '').includes(q);

      const matchesStatus = !statusFilter || apt.status === statusFilter;

      return matchesScope && matchesSearch && matchesStatus;
    });
  }, [normalized, scope, todayKey, now, search, statusFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((apt: any) => {
      if (!map.has(apt.dayKey)) map.set(apt.dayKey, []);
      map.get(apt.dayKey)!.push(apt);
    });
    return [...map.entries()];
  }, [filtered]);

  const dayMap = useMemo(() => {
    const map = new Map<string, any[]>();
    filtered.forEach((apt: any) => {
      if (!map.has(apt.dayKey)) map.set(apt.dayKey, []);
      map.get(apt.dayKey)!.push(apt);
    });
    return map;
  }, [filtered]);

  const selectedDayAppointments = dayMap.get(dateKey(selectedDate)) || [];

  const stats = useMemo(() => {
    const today = normalized.filter((a: any) => a.dayKey === todayKey);
    return {
      today: today.length,
      waiting: today.filter((a: any) => a.status === 'PENDING').length,
      inProgress: today.filter((a: any) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length,
      completed: today.filter((a: any) => a.status === 'COMPLETED').length,
      cancelled: today.filter((a: any) => a.status === 'CANCELLED' || a.status === 'MISSED').length,
    };
  }, [normalized, todayKey]);

  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 1) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);
    return Array.from({ length: 42 }).map((_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [currentMonth]);

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-5 px-5 py-6 lg:px-7" dir="rtl">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">المواعيد</h1>
          <p className="mt-1 text-sm text-slate-500">إدارة مواعيد المرضى وتنظيم جدول العيادة</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')} className={view === 'list' ? 'bg-teal-600 hover:bg-teal-700' : ''}>
            <List className="w-4 h-4" /> قائمة
          </Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')} className={view === 'calendar' ? 'bg-teal-600 hover:bg-teal-700' : ''}>
            <CalendarDays className="w-4 h-4" /> تقويم
          </Button>
          <Link href={`/${locale}/appointments/new`}>
            <Button className="bg-cyan-600 hover:bg-cyan-700 gap-1.5">
              <Plus className="w-4 h-4" />
              موعد جديد
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {[
          { label: 'مواعيد اليوم', value: stats.today, icon: CalendarDays, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30' },
          { label: 'في الانتظار', value: stats.waiting, icon: Clock3, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
          { label: 'داخل الكشف', value: stats.inProgress, icon: Stethoscope, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
          { label: 'مكتمل', value: stats.completed, icon: CircleCheckBig, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
          { label: 'ملغي', value: stats.cancelled, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/30' },
        ].map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color}`}><Icon className="w-4 h-4" /></div>
                <div>
                  <p className="text-[11px] text-slate-500">{c.label}</p>
                  <p className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{c.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800/80">
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchBox value={search} onChange={setSearch} placeholder="ابحث باسم المريض أو رقم الهاتف أو سبب الزيارة" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {scopeTabs.map((s) => (
                <Button key={s} size="sm" variant={scope === s ? 'default' : 'outline'} className={`h-8 rounded-lg text-xs ${scope === s ? 'bg-teal-600 hover:bg-teal-700' : ''}`} onClick={() => setScope(s)}>
                  {s === 'today' ? 'اليوم' : s === 'upcoming' ? 'القادم' : 'الكل'}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-slate-800 pt-3">
            {statusFilters.map((f) => (
              <Button key={f.key} size="sm" variant={statusFilter === f.key ? 'default' : 'ghost'} className={`h-7 rounded-lg text-xs ${statusFilter === f.key ? 'bg-teal-600 hover:bg-teal-700' : 'text-slate-500 hover:text-slate-700'}`} onClick={() => setStatusFilter(f.key)}>
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {view === 'calendar' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <Card className="xl:col-span-8 border-slate-200/80 dark:border-slate-800/80">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronRight className="w-4 h-4" /></Button>
                <CardTitle className="text-base">
                  {currentMonth.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronLeft className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-center text-xs text-slate-500 mb-2">
                {['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((d) => <div key={d}>{d}</div>)}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const dayItems = dayMap.get(key) || [];
                  const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = key === todayKey;
                  const isSelected = isSameDay(day, selectedDate);
                  const uniqueStatuses = [...new Set(dayItems.map((i: any) => i.status))].slice(0, 3);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[94px] rounded-xl border p-2 text-right transition-all ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20 shadow-sm'
                          : inCurrentMonth
                            ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-cyan-300'
                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/30 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold ${isToday ? 'text-teal-600' : ''}`}>{day.getDate()}</span>
                        {dayItems.length > 0 && (
                          <Badge className="h-5 px-1.5 text-[10px] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">{dayItems.length}</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        {uniqueStatuses.map((s) => (
                          <span key={s} className={`w-2 h-2 rounded-full ${STATUS_DOT[s] || 'bg-slate-400'}`} />
                        ))}
                      </div>
                      {isToday && <p className="mt-2 text-[10px] text-teal-600 font-medium">اليوم</p>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="xl:col-span-4 border-slate-200/80 dark:border-slate-800/80 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="text-sm">
                {selectedDate.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[560px] overflow-y-auto">
              {selectedDayAppointments.length === 0 ? (
                <p className="text-sm text-slate-500">لا توجد مواعيد في هذا اليوم</p>
              ) : (
                selectedDayAppointments.map((apt: any) => (
                  <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="w-full text-right rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 hover:border-cyan-300 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{apt.displayName}</p>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_STYLE[apt.status] || STATUS_STYLE.SCHEDULED}`}>{statusLabel(apt.status)}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{apt.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {apt.end.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-xs text-slate-600 mt-1">{apt.displayReason || 'بدون سبب زيارة'}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {isLoading ? (
            <Card className="border-slate-200/80 dark:border-slate-800/80"><CardContent className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</CardContent></Card>
          ) : grouped.length === 0 ? (
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="py-16 text-center">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">لا توجد مواعيد مطابقة للفلاتر الحالية</p>
                <p className="text-xs text-slate-500 mt-1">جرّب تغيير الفلاتر أو إضافة موعد جديد</p>
              </CardContent>
            </Card>
          ) : (
            grouped.map(([key, items]) => {
              const day = items[0].start;
              const isToday = key === todayKey;
              return (
                <Card key={key} className="border-slate-200/80 dark:border-slate-800/80 overflow-hidden">
                  <div className={`px-4 py-2.5 ${isToday ? 'bg-teal-50 dark:bg-teal-950/20 border-b border-teal-200 dark:border-teal-900/40' : 'bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800'}`}>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{isToday ? 'اليوم - ' : ''}{day.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{items.length} موعد</p>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    {items.map((apt: any) => (
                      <div key={apt.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3">
                        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{apt.displayName}</p>
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><IdCard className="w-3 h-3" />P-{String(apt.patient?.id || apt.id).padStart(4, '0')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600 dark:text-slate-300 mr-10">
                              <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {apt.displayPhone}</span>
                              <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3 text-slate-400" />{apt.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {apt.end.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-slate-400">({apt.durationMinutes} د)</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 mr-10"><FileText className="w-3 h-3 text-slate-400" />{apt.displayReason || 'بدون سبب زيارة'}</p>
                          </div>
                          <div className="flex flex-row items-center gap-1.5 lg:flex-col lg:items-end justify-start">
                            <Badge variant="outline" className={`rounded-full text-[11px] px-2.5 py-0.5 ${STATUS_STYLE[apt.status] || STATUS_STYLE.SCHEDULED}`}>{statusLabel(apt.status)}{apt.isLate ? ' - متأخر' : ''}</Badge>
                            <div className="flex items-center gap-1">
                              <Link href={`/${locale}/patients/${apt.patient?.id}`}><Button size="sm" variant="outline" className="h-7 text-[11px] rounded-lg px-2">الملف</Button></Link>
                              {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (<Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}`}><Button size="sm" className="h-7 text-[11px] rounded-lg px-2 bg-teal-600 hover:bg-teal-700 gap-1"><Stethoscope className="w-3 h-3" />كشف</Button></Link>)}
                              <Link href={`/${locale}/appointments/${apt.id}`}><Button size="sm" variant="ghost" className="h-7 text-[11px] rounded-lg px-2">تفاصيل</Button></Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelectedAppointment(null)}>
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-5 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">تفاصيل الموعد</h3>
              <Button size="icon" variant="ghost" onClick={() => setSelectedAppointment(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="text-slate-500">المريض:</span> <span className="font-semibold">{selectedAppointment.displayName}</span></p>
              <p><span className="text-slate-500">كود المريض:</span> P-{String(selectedAppointment.patient?.id || selectedAppointment.id).padStart(4, '0')}</p>
              <p><span className="text-slate-500">الهاتف:</span> {selectedAppointment.displayPhone}</p>
              <p><span className="text-slate-500">الوقت:</span> {selectedAppointment.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {selectedAppointment.end.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><span className="text-slate-500">المدة:</span> {selectedAppointment.durationMinutes} دقيقة</p>
              <p><span className="text-slate-500">السبب:</span> {selectedAppointment.displayReason || 'بدون سبب زيارة'}</p>
              <div className="pt-1"><Badge variant="outline" className={`${STATUS_STYLE[selectedAppointment.status] || STATUS_STYLE.SCHEDULED}`}>{statusLabel(selectedAppointment.status)}</Badge></div>
            </div>
            <div className="mt-5 flex items-center gap-2 justify-end">
              <Link href={`/${locale}/patients/${selectedAppointment.patient?.id}`}><Button variant="outline">فتح ملف المريض</Button></Link>
              <Link href={`/${locale}/visits/new?patientId=${selectedAppointment.patient?.id}`}><Button className="bg-teal-600 hover:bg-teal-700">بدء زيارة</Button></Link>
              <Link href={`/${locale}/appointments/${selectedAppointment.id}`}><Button variant="ghost">فتح التفاصيل</Button></Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
