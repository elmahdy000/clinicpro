'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchBox } from '@/components/common/SearchBox';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Plus, CalendarDays, List, Clock3, Phone, FileText,
  Stethoscope, CircleCheckBig, XCircle, IdCard, ChevronLeft, ChevronRight,
  X, Sparkles, MessageSquare, Calendar, Check
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);



const dateKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const isSameDay = (a: Date, b: Date) => dateKey(a) === dateKey(b);

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-950/40 dark:bg-emerald-950/20 dark:text-emerald-300',
  CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-950/40 dark:bg-rose-950/20 dark:text-rose-300',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-950/40 dark:bg-blue-950/20 dark:text-blue-300',
  SCHEDULED: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-950/40 dark:bg-amber-950/20 dark:text-amber-300',
  PENDING: 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  IN_PROGRESS: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-950/40 dark:bg-violet-950/20 dark:text-violet-300',
  MISSED: 'border-red-200 bg-red-50 text-red-700 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-300',
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

const statusFilters = [
  { key: '', label: 'الكل' },
  { key: 'PENDING', label: 'المنتظرون' },
  { key: 'CONFIRMED', label: 'مؤكد حضورهم' },
  { key: 'COMPLETED', label: 'تم الكشف' },
  { key: 'CANCELLED', label: 'ملغي' },
] as const;

// Dynamic Arabic hours for timeline scheduling
const WORKING_HOURS = Array.from({ length: 13 }).map((_, i) => {
  const h = i + 9; // starts at 9:00 AM
  const displayHour = h > 12 ? h - 12 : h;
  const amPm = h >= 12 ? 'م' : 'ص';
  return { key: `${String(h).padStart(2, '0')}:00`, label: `${displayHour}:00 ${amPm}`, hourVal: h };
});

interface PatientInfo {
  id?: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface AppointmentRaw {
  id: string | number;
  patient?: PatientInfo;
  appointmentDate: string;
  appointmentEndDate?: string;
  durationMinutes?: number | string;
  status?: string;
  reason?: string;
  notes?: string;
  doctorId?: number;
}

interface AppointmentNormalized extends AppointmentRaw {
  displayName: string;
  displayPhone: string;
  displayReason: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  status: string;
  isLate: boolean;
  dayKey: string;
  timeKey: string;
}

export default function AppointmentsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'month' | 'day' | 'list'>('month');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState<'all' | 'today' | 'upcoming'>('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentNormalized | null>(null);

  const { data, isLoading } = useQuery<{ data: AppointmentRaw[] }>({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments', { params: { limit: 100 } }).then((r) => r.data),
  });

  const appointments = useMemo(() => data?.data || [], [data]);
  const now = useMemo(() => new Date(), []);
  const todayKey = dateKey(now);

  // Status Labels in Arabic/English
  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      COMPLETED: isRtl ? 'تم الكشف' : 'Completed',
      CANCELLED: isRtl ? 'ملغي' : 'Cancelled',
      CONFIRMED: isRtl ? 'حاضر / مؤكد' : 'Confirmed',
      SCHEDULED: isRtl ? 'محجوز' : 'Scheduled',
      PENDING: isRtl ? 'منتظر' : 'Waiting',
      IN_PROGRESS: isRtl ? 'داخل الكشف' : 'In Progress',
      MISSED: isRtl ? 'لم يحضر' : 'Missed',
    };
    return map[status] || status;
  };

  // WhatsApp Reminder Message Builder
  const getWhatsAppReminderLink = (apt: AppointmentNormalized) => {
    const phone = apt.displayPhone || '';
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '20' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('20') && cleanPhone.length === 10) {
      cleanPhone = '20' + cleanPhone;
    }
    const timeStr = apt.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const msg = `مرحباً أ/ ${apt.displayName}، نود تذكيرك بموعد زيارتك اليوم في عيادة كلينك برو الساعة ${timeStr}. يسعدنا حضورك.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  // Status Change Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/appointments/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(isRtl ? 'تم تحديث حالة الموعد بنجاح!' : 'Appointment status updated successfully!');
      setSelectedAppointment(null);
    },
    onError: () => {
      toast.error(isRtl ? 'فشل تحديث حالة الموعد.' : 'Failed to update status.');
    }
  });

  const normalized = useMemo(() => {
    return appointments
      .map((apt: AppointmentRaw) => {
        const firstName = apt.patient?.firstName || 'مريض';
        const lastName = apt.patient?.lastName || '';
        const phone = apt.patient?.phone || 'لا يوجد رقم';
        const reason = apt.reason;

        const start = new Date(apt.appointmentDate);
        const durationMinutes = Number(apt.durationMinutes || 30);
        const end = new Date(start.getTime() + durationMinutes * 60000);
        const status = String(apt.status || 'SCHEDULED').toUpperCase();
        const isLate = (status === 'SCHEDULED' || status === 'CONFIRMED') && start < now;

        return {
          ...apt,
          displayName: `${firstName} ${lastName}`,
          displayPhone: phone,
          displayReason: reason || (isRtl ? 'استشارة طبية عامة' : 'General medical consultation'),
          start,
          end,
          durationMinutes,
          status,
          isLate,
          dayKey: dateKey(start),
          timeKey: `${String(start.getHours()).padStart(2, '0')}:00`,
        };
      })
      .sort((a: AppointmentNormalized, b: AppointmentNormalized) => a.start.getTime() - b.start.getTime());
  }, [appointments, isRtl, now]);

  const filtered = useMemo(() => {
    return normalized.filter((apt: AppointmentNormalized) => {
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
        String(apt.displayReason || '').includes(q) ||
        String(apt.id || '').includes(q);

      const matchesStatus = !statusFilter || apt.status === statusFilter;

      return matchesScope && matchesSearch && matchesStatus;
    });
  }, [normalized, scope, todayKey, now, search, statusFilter]);

  const dayMap = useMemo(() => {
    const map = new Map<string, AppointmentNormalized[]>();
    filtered.forEach((apt: AppointmentNormalized) => {
      if (!map.has(apt.dayKey)) map.set(apt.dayKey, []);
      map.get(apt.dayKey)!.push(apt);
    });
    return map;
  }, [filtered]);

  const grouped = useMemo(() => {
    return [...dayMap.entries()];
  }, [dayMap]);

  const selectedDayAppointments = dayMap.get(dateKey(selectedDate)) || [];

  const stats = useMemo(() => {
    const todayAppointmentsList = normalized.filter((a: AppointmentNormalized) => a.dayKey === todayKey);
    return {
      today: todayAppointmentsList.length,
      waiting: todayAppointmentsList.filter((a: AppointmentNormalized) => a.status === 'PENDING').length,
      inProgress: todayAppointmentsList.filter((a: AppointmentNormalized) => a.status === 'CONFIRMED' || a.status === 'IN_PROGRESS').length,
      completed: todayAppointmentsList.filter((a: AppointmentNormalized) => a.status === 'COMPLETED').length,
      cancelled: todayAppointmentsList.filter((a: AppointmentNormalized) => a.status === 'CANCELLED' || a.status === 'MISSED').length,
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

  // Navigate day scheduler selected date
  const changeSelectedDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
  };

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-6 px-4 py-6 md:px-6" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Top Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in-down">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-teal-600 animate-pulse" />
            {isRtl ? 'تقويم المواعيد التفاعلي' : 'Interactive Appointment Calendar'}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {isRtl ? 'تنظيم أوقات الكشف، وجدولة المواعيد وحركة المرضى اليومية بذكاء.' : 'Manage consultation timing and patient schedules elegantly.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1">
            <Button variant={view === 'month' ? 'default' : 'ghost'} size="sm" onClick={() => setView('month')} className={`h-8 rounded-lg text-xs font-semibold ${view === 'month' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}>
              <CalendarDays className="w-3.5 h-3.5 me-1" /> {isRtl ? 'الشهري' : 'Month'}
            </Button>
            <Button variant={view === 'day' ? 'default' : 'ghost'} size="sm" onClick={() => setView('day')} className={`h-8 rounded-lg text-xs font-semibold ${view === 'day' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}>
              <Clock3 className="w-3.5 h-3.5 me-1" /> {isRtl ? 'الجدول اليومي' : 'Hourly Timeline'}
            </Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setView('list')} className={`h-8 rounded-lg text-xs font-semibold ${view === 'list' ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}>
              <List className="w-3.5 h-3.5 me-1" /> {isRtl ? 'قائمة الجدولة' : 'Grouped List'}
            </Button>
          </div>
          <Link href={`/${locale}/appointments/new`}>
            <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5 shadow-md shadow-teal-500/20 text-xs font-bold py-4 rounded-xl">
              <Plus className="w-4 h-4" />
              {isRtl ? 'موعد جديد' : 'New Appointment'}
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Visual Metric Stats ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5 animate-fade-in-up">
        {[
          { label: isRtl ? 'مواعيد اليوم' : "Today's Total", value: stats.today, icon: CalendarDays, color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/40' },
          { label: isRtl ? 'بالانتظار' : 'Waiting Queue', value: stats.waiting, icon: Clock3, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-100 dark:border-amber-900/40' },
          { label: isRtl ? 'داخل الكشف' : 'Consulting', value: stats.inProgress, icon: Stethoscope, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40' },
          { label: isRtl ? 'مكتمل اليوم' : 'Completed', value: stats.completed, icon: CircleCheckBig, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-100 dark:border-emerald-900/40' },
          { label: isRtl ? 'ملغي / غائب' : 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-100 dark:border-rose-900/40' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`rounded-xl border ${c.color} p-3.5 shadow-sm hover:scale-[1.02] transition-transform`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] md:text-xs text-gray-500 font-semibold">{c.label}</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{c.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search & Advanced Filtering Panel ── */}
      <Card className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-200 animate-fade-in-up">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchBox value={search} onChange={setSearch} placeholder={isRtl ? 'ابحث باسم المريض، رقم الهاتف، أو كود المريض...' : 'Search by patient name, phone number, or code...'} />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['today', 'upcoming', 'all'] as const).map((s) => (
                <Button key={s} size="sm" variant={scope === s ? 'default' : 'outline'} className={`h-9 px-4 rounded-xl text-xs font-semibold ${scope === s ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`} onClick={() => setScope(s)}>
                  {s === 'today' ? (isRtl ? 'اليوم' : 'Today') : s === 'upcoming' ? (isRtl ? 'القادم' : 'Upcoming') : (isRtl ? 'الكل' : 'All')}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <span className="text-xs text-gray-400 font-medium me-2">{isRtl ? 'تصنيف حسب الحالة:' : 'Filter Status:'}</span>
            {statusFilters.map((f) => (
              <Button key={f.key} size="sm" variant={statusFilter === f.key ? 'default' : 'ghost'} className={`h-8 rounded-lg text-xs px-3 font-semibold ${statusFilter === f.key ? 'bg-teal-500 hover:bg-teal-600 text-white' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`} onClick={() => setStatusFilter(f.key)}>
                {f.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── View Renderers ── */}

      {/* 1. Monthly Calendar View */}
      {view === 'month' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 animate-fade-in">
          
          {/* Main Month Grid Grid */}
          <Card className="xl:col-span-8 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-200">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>
                  {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </Button>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  {currentMonth.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}
                </CardTitle>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>
                  {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 mb-3">
                {isRtl 
                  ? ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'].map((d) => <div key={d}>{d}</div>)
                  : ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => <div key={d}>{d}</div>)
                }
              </div>

              <div className="grid grid-cols-7 gap-2">
                {monthDays.map((day) => {
                  const key = dateKey(day);
                  const dayItems = dayMap.get(key) || [];
                  const inCurrentMonth = day.getMonth() === currentMonth.getMonth();
                  const isToday = key === todayKey;
                  const isSelected = isSameDay(day, selectedDate);
                  const uniqueStatuses = [...new Set(dayItems.map((i: AppointmentNormalized) => i.status))].slice(0, 3);

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDate(day)}
                      className={`min-h-[105px] rounded-xl border p-2 text-right transition-all flex flex-col justify-between hover:scale-[1.02] cursor-pointer ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500'
                          : isToday
                            ? 'border-amber-400 bg-amber-50/20 dark:bg-amber-950/10'
                            : inCurrentMonth
                              ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-teal-300 dark:hover:border-teal-700'
                              : 'border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/10 text-slate-400 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-xs font-black ${isToday ? 'bg-amber-400 text-slate-900 w-5 h-5 rounded-full flex items-center justify-center' : isSelected ? 'text-teal-600' : 'text-slate-700 dark:text-slate-300'}`}>{day.getDate()}</span>
                        {dayItems.length > 0 && (
                          <Badge className="h-5 px-1.5 text-[9px] bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-lg">{dayItems.length}</Badge>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {uniqueStatuses.map((s) => (
                          <span key={s} className={`w-2 h-2 rounded-full ${STATUS_DOT[s] || 'bg-slate-400'}`} />
                        ))}
                      </div>
                      {isToday && <p className="text-[9px] text-amber-600 font-bold mt-1 bg-amber-500/10 px-1.5 py-0.5 rounded w-fit">{isRtl ? 'اليوم' : 'Today'}</p>}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Right Selected Day Sidebar Preview */}
          <Card className="xl:col-span-4 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm transition-all duration-200 animate-fade-in-up">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-teal-600 animate-bounce-subtle" />
                  {selectedDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <span className="text-xs text-gray-400">({selectedDayAppointments.length} {isRtl ? 'حالات' : 'Appointments'})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5 max-h-[570px] overflow-y-auto pr-1">
              {selectedDayAppointments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs font-semibold">{isRtl ? 'لا توجد مواعيد محجوزة في هذا اليوم' : 'No appointments scheduled today'}</p>
                </div>
              ) : (
                selectedDayAppointments.map((apt: AppointmentNormalized, idx) => (
                  <button key={apt.id} onClick={() => setSelectedAppointment(apt)} className="w-full text-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:border-teal-500 hover:shadow-md transition-all cursor-pointer animate-fade-in-up" style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{apt.displayName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{apt.displayReason}</p>
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-bold rounded-lg px-2 shrink-0 ${STATUS_STYLE[apt.status] || STATUS_STYLE.SCHEDULED}`}>{statusLabel(apt.status)}</Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 border-t border-slate-50 dark:border-slate-800/80 pt-2">
                      <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5" />{formatTime(apt.appointmentDate, locale)}</span>
                      <span className="inline-flex items-center gap-1 font-bold text-teal-600 hover:underline"><Sparkles className="w-3 h-3" />{isRtl ? 'التفاصيل والخيارات' : 'Details'} &larr;</span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Visual Day Hourly Scheduler (Hourly Grid View) */}
      {view === 'day' && (
        <div className="animate-fade-in space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-3 rounded-2xl shadow-sm">
            <Button variant="outline" size="sm" onClick={() => changeSelectedDate(isRtl ? 1 : -1)} className="rounded-xl px-3 gap-1">
              {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {isRtl ? 'اليوم السابق' : 'Previous Day'}
            </Button>
            <div className="text-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {selectedDate.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-[10px] text-teal-600 font-bold mt-0.5">
                {isSameDay(selectedDate, now) ? (isRtl ? 'مواعيد اليوم' : "Today's Agenda") : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => changeSelectedDate(isRtl ? -1 : 1)} className="rounded-xl px-3 gap-1">
              {isRtl ? 'اليوم التالي' : 'Next Day'}
              {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-12 space-y-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-sm">
              <div className="relative border-l border-slate-100 dark:border-slate-850 pl-3 md:pl-6 space-y-4">
                {WORKING_HOURS.map((wh) => {
                  const hourApts = selectedDayAppointments.filter((a: AppointmentNormalized) => a.timeKey === wh.key);
                  return (
                    <div key={wh.key} className="flex gap-4 items-start relative animate-fade-in-up">
                      {/* Left Hour Tag */}
                      <div className="w-16 shrink-0 text-left text-xs font-bold text-gray-400 pt-1">
                        {wh.label}
                      </div>
                      
                      {/* Grid Line */}
                      <div className="flex-1 border-t border-slate-100 dark:border-slate-800/80 pt-2 min-h-[75px] relative">
                        {hourApts.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                            {hourApts.map((apt: AppointmentNormalized) => (
                              <div
                                key={apt.id}
                                onClick={() => setSelectedAppointment(apt)}
                                className={`rounded-xl border p-3 cursor-pointer hover:shadow-md transition-all text-right relative overflow-hidden group ${STATUS_STYLE[apt.status] || STATUS_STYLE.SCHEDULED}`}
                              >
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-current opacity-70" />
                                <div className="flex items-start justify-between gap-3 mr-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-black truncate">{apt.displayName}</p>
                                    <p className="text-[10px] opacity-80 mt-0.5 truncate">{apt.displayReason}</p>
                                  </div>
                                  <span className="text-[9px] font-black shrink-0 bg-white/60 dark:bg-black/20 px-2 py-0.5 rounded-lg border border-current">
                                    {statusLabel(apt.status)}
                                  </span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[9px] opacity-75 mr-2 pt-2 border-t border-black/5 dark:border-white/5">
                                  <span>{apt.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} ({apt.durationMinutes} د)</span>
                                  <span className="text-teal-700 dark:text-teal-300 font-bold group-hover:underline">{isRtl ? 'خيارات سريعة' : 'Quick Actions'} &larr;</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-300 font-normal italic pt-1 pl-2">
                            {isRtl ? 'لا توجد مواعيد مجدولة' : 'No appointments scheduled'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Grouped Chronological List View */}
      {view === 'list' && (
        <div className="space-y-4 animate-fade-in">
          {isLoading ? (
            <Card className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm"><CardContent className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</CardContent></Card>
          ) : grouped.length === 0 ? (
            <Card className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <CardContent className="py-16 text-center">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-bold text-slate-800 dark:text-white">{isRtl ? 'لا توجد مواعيد مطابقة للفلاتر الحالية' : 'No matching appointments found'}</p>
                <p className="text-xs text-gray-400 mt-1">{isRtl ? 'يرجى تجربة البحث بكلمات أخرى أو تغيير إعدادات الفلترة.' : 'Try changing filters or searching another keyword.'}</p>
              </CardContent>
            </Card>
          ) : (
            grouped.map(([key, items], groupIdx) => {
              const day = items[0].start;
              const isToday = key === todayKey;
              return (
                <Card key={key} className="bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: `${groupIdx * 60}ms` }}>
                  <div className={`px-4 py-3 flex items-center justify-between border-b ${
                    isToday 
                      ? 'bg-teal-500/10 border-teal-200/80 dark:border-teal-900/40 text-teal-800 dark:text-teal-200' 
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800'
                  }`}>
                    <div>
                      <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                        {isToday && <Sparkles className="w-4 h-4 text-teal-600 animate-bounce-subtle" />}
                        {isToday ? (isRtl ? 'اليوم - ' : 'Today - ') : ''}
                        {day.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                    </div>
                    <Badge className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-extrabold px-2.5 py-0.5 rounded-lg text-[10px]">
                      {items.length} {isRtl ? 'مواعيد' : 'Appointments'}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    {items.map((apt: AppointmentNormalized) => (
                      <div key={apt.id} className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-950 p-4 hover:shadow-md transition-all">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2.5 min-w-0 flex-1">
                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                                {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                              </div>
                              <div className="min-w-0 text-right">
                                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{apt.displayName}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 mt-0.5"><IdCard className="w-3.5 h-3.5" />P-{String(apt.patient?.id || apt.id).padStart(4, '0')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap text-xs text-gray-600 dark:text-slate-300 mr-12">
                              <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {apt.displayPhone}</span>
                              <span className="inline-flex items-center gap-1"><Clock3 className="w-3.5 h-3.5 text-slate-400" />{apt.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} - {apt.end.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-slate-400">({apt.durationMinutes} دقيقة)</span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 mr-12"><FileText className="w-3.5 h-3.5 text-slate-400" />{apt.displayReason}</p>
                          </div>
                          
                          {/* Chronological Action Pills */}
                          <div className="flex flex-row items-center gap-2 lg:flex-col lg:items-end justify-start border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                            <Badge variant="outline" className={`rounded-lg text-[10px] font-bold px-3 py-1 ${STATUS_STYLE[apt.status] || STATUS_STYLE.SCHEDULED}`}>{statusLabel(apt.status)}{apt.isLate ? ` - ${isRtl ? 'متأخر' : 'Late'}` : ''}</Badge>
                            <div className="flex items-center gap-1.5 flex-wrap mt-2">
                              <a href={getWhatsAppReminderLink(apt)} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold rounded-xl border-green-200 hover:border-green-400 dark:border-green-950 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 gap-1 px-2.5">
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  {isRtl ? 'تذكير واتساب' : 'Remind'}
                                </Button>
                              </a>
                              <Link href={`/${locale}/patients/${apt.patient?.id}`}><Button size="sm" variant="outline" className="h-8 text-[11px] font-semibold rounded-xl px-2.5">{isRtl ? 'الملف الطبي' : 'Profile'}</Button></Link>
                              {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                                <Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}&appointmentId=${apt.id}`}>
                                  <Button size="sm" className="h-8 text-[11px] font-bold rounded-xl px-3 bg-teal-600 hover:bg-teal-700 gap-1"><Stethoscope className="w-3.5 h-3.5" />{isRtl ? 'بدء كشف' : 'Consult'}</Button>
                                </Link>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => setSelectedAppointment(apt)} className="h-8 text-[11px] rounded-xl px-2">{isRtl ? 'المزيد' : 'More'}</Button>
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

      {/* ── Visual Detailed Appointment Modal/Drawer ── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4" onClick={() => setSelectedAppointment(null)}>
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 md:p-6 animate-fade-in-up text-right" dir={isRtl ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Title */}
            <div className="flex items-center justify-between mb-5 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600 animate-bounce-subtle" />
                {isRtl ? 'إدارة تفاصيل الموعد' : 'Manage Appointment Details'}
              </h3>
              <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => setSelectedAppointment(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Modal Content Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white text-sm font-black shadow-sm shrink-0">
                  {selectedAppointment.displayName?.[0]}
                </div>
                <div className="min-w-0 text-right">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{selectedAppointment.displayName}</h4>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><IdCard className="w-3.5 h-3.5" />P-{String(selectedAppointment.patient?.id || selectedAppointment.id).padStart(4, '0')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 dark:text-slate-300">
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">{isRtl ? 'رقم الهاتف:' : 'Phone Number:'}</p>
                  <p className="text-slate-950 dark:text-white flex items-center gap-1 mt-0.5"><Phone className="w-3.5 h-3.5 text-teal-600" /> {selectedAppointment.displayPhone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-gray-400">{isRtl ? 'وقت الحجز:' : 'Appointment Time:'}</p>
                  <p className="text-slate-950 dark:text-white flex items-center gap-1 mt-0.5"><Clock3 className="w-3.5 h-3.5 text-teal-600" /> {selectedAppointment.start.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] text-gray-400">{isRtl ? 'سبب الزيارة أو الكشف:' : 'Consultation Reason:'}</p>
                  <p className="text-slate-950 dark:text-white flex items-center gap-1 mt-0.5"><FileText className="w-3.5 h-3.5 text-teal-600" /> {selectedAppointment.displayReason}</p>
                </div>
              </div>

              {/* Status Update Options */}
              <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 mt-3">
                <p className="text-[10px] text-gray-400 mb-2 font-bold">{isRtl ? 'تحديث حالة الموعد الحالية:' : 'Update Booking Status:'}</p>
                <div className="flex gap-2 flex-wrap justify-start">
                  {[
                    { key: 'PENDING', label: isRtl ? 'في الانتظار' : 'Waiting', style: 'border-slate-300 hover:bg-slate-50' },
                    { key: 'CONFIRMED', label: isRtl ? 'تأكيد الحضور' : 'Attend', style: 'border-blue-300 text-blue-600 hover:bg-blue-50/50' },
                    { key: 'COMPLETED', label: isRtl ? 'تم الكشف' : 'Complete', style: 'border-emerald-300 text-emerald-600 hover:bg-emerald-50/50' },
                    { key: 'CANCELLED', label: isRtl ? 'إلغاء الموعد' : 'Cancel', style: 'border-rose-300 text-rose-600 hover:bg-rose-50/50' },
                  ].map((st) => (
                    <Button
                      key={st.key}
                      variant="outline"
                      size="sm"
                      disabled={updateStatusMutation.isPending}
                      className={`h-8 text-[11px] font-bold rounded-xl ${st.style} ${selectedAppointment.status === st.key ? 'bg-slate-100 dark:bg-slate-800 border-current font-black' : ''}`}
                      onClick={() => updateStatusMutation.mutate({ id: String(selectedAppointment.id), status: st.key })}
                    >
                      {selectedAppointment.status === st.key && <Check className="w-3.5 h-3.5 me-1" />}
                      {st.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Modal Actions */}
            <div className="mt-6 flex flex-wrap items-center gap-2 justify-end border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <a href={getWhatsAppReminderLink(selectedAppointment)} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="outline" className="h-9 text-[11px] font-bold rounded-xl border-green-300 text-green-600 hover:bg-green-50/50 gap-1.5 px-3">
                  <MessageSquare className="w-4 h-4" />
                  {isRtl ? 'إرسال تذكير بالواتساب' : 'WhatsApp'}
                </Button>
              </a>
              <Link href={`/${locale}/patients/${selectedAppointment.patient?.id}`} onClick={() => setSelectedAppointment(null)}>
                <Button size="sm" variant="outline" className="h-9 text-[11px] font-bold rounded-xl px-3">{isRtl ? 'الملف الطبي الكامل' : 'Patient File'}</Button>
              </Link>
              {selectedAppointment.status !== 'COMPLETED' && selectedAppointment.status !== 'CANCELLED' && (
                <Link href={`/${locale}/visits/new?patientId=${selectedAppointment.patient?.id}&appointmentId=${selectedAppointment.id}`} onClick={() => setSelectedAppointment(null)}>
                  <Button size="sm" className="h-9 text-[11px] font-bold rounded-xl bg-teal-600 hover:bg-teal-700 px-3 gap-1"><Stethoscope className="w-4 h-4" />{isRtl ? 'بدء كشف فوري' : 'Start Visit'}</Button>
                </Link>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
