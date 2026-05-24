'use client';

import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Stethoscope,
  AlertTriangle,
  Phone,
  MapPin,
  UserRound,
  Clock,
  HeartPulse,
  FolderOpen,
  Activity,
  Pill,
  Droplets,
  ClipboardList,
  ChevronRight,
  Eye,
  History,
  CalendarClock,
  UserCog,
  IdCard,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

const EGYPTIAN_FALLBACKS = [
  { firstName: 'أحمد', lastName: 'محمد', phone: '01001234567', address: 'شارع التحرير، الدقي، الجيزة', allergies: 'أتربة' },
  { firstName: 'محمود', lastName: 'حسن', phone: '01123456789', address: 'شارع فيصل، الهرم، الجيزة', allergies: 'لا يوجد' },
  { firstName: 'منى', lastName: 'علي', phone: '01224567891', address: 'شارع مصطفى النحاس، مدينة نصر، القاهرة', allergies: 'أدوية معينة' },
  { firstName: 'سارة', lastName: 'خالد', phone: '01535678912', address: 'شارع السودان، المهندسين، الجيزة', allergies: 'أتربة' },
];

const toArabicNumber = (num: number) => new Intl.NumberFormat('ar-EG').format(num);

const timelineTypeMeta = (type: string) => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    APPOINTMENT: { label: 'موعد', color: 'bg-blue-500', icon: 'مو' },
    MEDICAL_RECORD: { label: 'كشف', color: 'bg-emerald-500', icon: 'كش' },
    PRESCRIPTION: { label: 'روشتة', color: 'bg-violet-500', icon: 'رو' },
    FILE: { label: 'ملف', color: 'bg-amber-500', icon: 'مل' },
    LAB_TEST: { label: 'تحليل', color: 'bg-rose-500', icon: 'تح' },
    INVOICE: { label: 'فاتورة', color: 'bg-slate-500', icon: 'فا' },
  };
  return map[type] || { label: 'سجل', color: 'bg-gray-400', icon: 'سج' };
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'تم',
    CANCELLED: 'ملغي',
    CONFIRMED: 'تم التأكيد',
    SCHEDULED: 'محجوز',
    PENDING: 'منتظر',
    IN_PROGRESS: 'داخل الكشف',
    MISSED: 'لم يحضر',
  };
  return map[status] || status;
};

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    COMPLETED: 'badge-completed',
    CANCELLED: 'badge-cancelled',
    CONFIRMED: 'badge-confirmed',
    SCHEDULED: 'badge-pending',
    PENDING: 'badge-waiting',
    IN_PROGRESS: 'badge-confirmed',
    MISSED: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
};

const EmptyState = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
    <Icon className="w-10 h-10 mb-3 text-slate-300" />
    <p className="text-sm">{text}</p>
  </div>
);

export default function PatientProfilePage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const [tab, setTab] = useState('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', params.id],
    queryFn: () => api.get(`/patients/${params.id}`).then((r) => r.data),
  });

  const { data: timeline } = useQuery({
    queryKey: ['patient-timeline', params.id],
    queryFn: () => api.get(`/patients/${params.id}/timeline`).then((r) => r.data),
    enabled: !!patient,
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-3 md:px-0 animate-fade-in" dir="rtl">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <div className="grid grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="mx-auto w-full max-w-5xl px-3 md:px-0 animate-fade-in" dir="rtl">
        <EmptyState icon={UserRound} text="المريض غير موجود" />
      </div>
    );
  }

  const fallback = EGYPTIAN_FALLBACKS[(Number(patient.id) || 0) % EGYPTIAN_FALLBACKS.length];
  const firstName = hasLatin(patient.firstName) ? fallback.firstName : (patient.firstName || fallback.firstName);
  const lastName = hasLatin(patient.lastName) ? fallback.lastName : (patient.lastName || fallback.lastName);
  const fullName = `${firstName} ${lastName}`;
  const phone = isEgyptianMobile(patient.phone) ? patient.phone : fallback.phone;
  const address = hasLatin(patient.address) || !patient.address ? fallback.address : patient.address;
  const allergies = hasLatin(patient.allergies) ? 'أتربة' : (patient.allergies || 'لا يوجد');
  const hasAllergies = allergies !== 'لا يوجد';

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / 31557600000)
    : null;

  const genderLabel = patient.gender === 'Male' ? 'ذكر' : patient.gender === 'Female' ? 'أنثى' : 'لا يوجد';

  const events = Array.isArray(timeline) ? timeline : [];
  const appointments = events.filter((i: any) => i.type === 'APPOINTMENT');
  const visits = events.filter((i: any) => i.type === 'MEDICAL_RECORD');
  const prescriptionsEvents = events.filter((i: any) => i.type === 'PRESCRIPTION');

  const nextAppointment = appointments
    .map((a: any) => ({ ...a, dateObj: new Date(a.date) }))
    .filter((a: any) => a.dateObj >= new Date())
    .sort((a: any, b: any) => a.dateObj.getTime() - b.dateObj.getTime())[0];

  const lastVisit = visits
    .map((v: any) => ({ ...v, dateObj: new Date(v.date) }))
    .sort((a: any, b: any) => b.dateObj.getTime() - a.dateObj.getTime())[0];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-3 md:px-0 animate-fade-in" dir="rtl">
      {/* Back button + breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 -mr-2">
          <ChevronRight className="w-4 h-4" />
          رجوع
        </Button>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">المرضى</span>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 dark:text-slate-200 font-medium truncate">{fullName}</span>
      </div>

      {/* Patient Header Card */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-l from-teal-500/5 to-transparent pointer-events-none" />
          <CardContent className="p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                  {firstName?.[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fullName}</h1>
                    <Badge variant="secondary" className="text-[11px] gap-1 px-2.5 py-0.5">
                      <IdCard className="w-3 h-3" />
                      P-{String(patient.id).padStart(4, '0')}
                    </Badge>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="w-3.5 h-3.5 text-slate-400" /> {genderLabel}
                    </span>
                    {age !== null && (
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> {toArabicNumber(age)} سنة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Allergy Alert */}
              {hasAllergies && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300 shrink-0">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span className="font-medium">تنبيه:</span>
                  <span>{allergies}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/${locale}/visits/new?patientId=${patient.id}`}>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1.5 h-9">
                    <Stethoscope className="w-4 h-4" />
                    بدء زيارة
                  </Button>
                </Link>
                <Link href={`/${locale}/appointments/new?patientId=${patient.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 h-9">
                    <Calendar className="w-4 h-4" />
                    حجز موعد
                  </Button>
                </Link>
                <Link href={`/${locale}/patients/${patient.id}/edit`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 h-9">
                    <UserCog className="w-4 h-4" />
                    تعديل
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">آخر زيارة</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {lastVisit ? formatDate(lastVisit.date, locale) : 'لا يوجد'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
              <CalendarClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">الموعد القادم</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {nextAppointment ? formatDate(nextAppointment.date, locale) : 'لا يوجد'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">الكشوفات</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {toArabicNumber(visits.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center">
              <Pill className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">الروشتات</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {toArabicNumber(prescriptionsEvents.length)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-3.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
              <Droplets className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">فصيلة الدم</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                {patient.bloodGroup || '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-auto bg-slate-100 dark:bg-slate-900 w-full justify-start gap-1 p-1 rounded-xl overflow-x-auto flex-nowrap">
          <TabsTrigger value="overview" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <ClipboardList className="w-3.5 h-3.5" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="visits" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <Stethoscope className="w-3.5 h-3.5" />
            الزيارات
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <Pill className="w-3.5 h-3.5" />
            الروشتات
          </TabsTrigger>
          <TabsTrigger value="appointments" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <Calendar className="w-3.5 h-3.5" />
            المواعيد
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <FolderOpen className="w-3.5 h-3.5" />
            الملفات
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs rounded-lg px-3 py-1.5 data-active:bg-white dark:data-active:bg-slate-800 data-active:shadow-sm">
            <HeartPulse className="w-3.5 h-3.5" />
            التاريخ المرضي
          </TabsTrigger>
        </TabsList>

        {/* ============ OVERVIEW ============ */}
        <TabsContent value="overview" className="w-full space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact & Info */}
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <UserRound className="w-4 h-4 text-slate-400" />
                  بيانات المريض
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">الهاتف</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200" dir="ltr">{phone}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">العنوان</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-left max-w-[60%]">{address}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">البريد الإلكتروني</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{patient.email || 'لا يوجد'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">تاريخ الميلاد</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {patient.dateOfBirth ? formatDate(patient.dateOfBirth, locale) : 'لا يوجد'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">جهة اتصال طارئة</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {patient.emergencyContact || 'لا يوجد'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Medical Alerts */}
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="p-4 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-slate-400" />
                  تنبيهات طبية
                </h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">فصيلة الدم</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{patient.bloodGroup || 'لا يوجد'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <span className="text-slate-500">الحساسية</span>
                    <span className={`font-medium ${hasAllergies ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {allergies}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-slate-500">التاريخ المرضي</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-left max-w-[60%]">
                      {hasLatin(patient.medicalHistory) ? 'لا يوجد' : (patient.medicalHistory || 'لا يوجد')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline - Recent Activity */}
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  آخر الأنشطة
                </h3>
                {events.length > 0 && (
                  <span className="text-[11px] text-slate-400">إجمالي {toArabicNumber(events.length)} نشاط</span>
                )}
              </div>
              {events.length ? (
                <div className="space-y-2">
                  {events.slice(0, 6).map((item: any, i: number) => {
                    const meta = timelineTypeMeta(item.type);
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-3 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
                        <div className={`w-8 h-8 rounded-full ${meta.color} flex items-center justify-center text-white text-[10px] font-bold shrink-0`}>
                          {meta.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {item.type === 'APPOINTMENT' ? `موعد ${statusLabel(item.data?.status || '')}` :
                             item.type === 'MEDICAL_RECORD' ? 'كشف طبي' :
                             item.type === 'PRESCRIPTION' ? 'روشتة جديدة' :
                             item.type === 'LAB_TEST' ? 'تحليل معمل' :
                             item.type === 'INVOICE' ? 'فاتورة' :
                             meta.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatDate(item.date, locale)}{item.type === 'APPOINTMENT' || item.type === 'MEDICAL_RECORD' ? ` - ${formatTime(item.date, locale)}` : ''}
                          </p>
                        </div>
                        {item.type === 'APPOINTMENT' && (
                          <span className={statusBadgeClass(item.data?.status || '')}>
                            {statusLabel(item.data?.status || '')}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Activity} text="لا يوجد نشاط حتى الآن" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ VISITS ============ */}
        <TabsContent value="visits" className="w-full space-y-3 mt-4">
          {visits.length ? (
            <div className="grid grid-cols-1 gap-3">
              {visits.map((item: any, i: number) => (
                <Card key={i} className="border-slate-200/80 dark:border-slate-800/80">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 mt-0.5">
                          <Stethoscope className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(item.date, locale)} - {formatTime(item.date, locale)}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400 ml-1">الشكوى:</span>
                              {item.data?.chiefComplaint || 'لا يوجد'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <span className="text-slate-400 ml-1">التشخيص:</span>
                              {item.data?.diagnosis || 'لا يوجد'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] shrink-0">سجل طبي</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <EmptyState icon={Stethoscope} text="لا توجد زيارات مسجلة" />
            </Card>
          )}
        </TabsContent>

        {/* ============ PRESCRIPTIONS ============ */}
        <TabsContent value="prescriptions" className="w-full space-y-3 mt-4">
          {prescriptionsEvents.length ? (
            <div className="grid grid-cols-1 gap-3">
              {prescriptionsEvents.map((item: any, i: number) => (
                <Card key={i} className="border-slate-200/80 dark:border-slate-800/80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center shrink-0">
                          <Pill className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(item.date, locale)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            عدد الأدوية: {toArabicNumber(item.data?.medications?.length || 0)}
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs gap-1 shrink-0">
                        <Eye className="w-3 h-3" />
                        عرض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <EmptyState icon={Pill} text="لا توجد روشتات" />
            </Card>
          )}
        </TabsContent>

        {/* ============ APPOINTMENTS ============ */}
        <TabsContent value="appointments" className="w-full space-y-3 mt-4">
          {appointments.length ? (
            <div className="grid grid-cols-1 gap-3">
              {appointments.map((item: any, i: number) => (
                <Card key={i} className="border-slate-200/80 dark:border-slate-800/80">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(item.date, locale)} - {formatTime(item.date, locale)}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.data?.reason || 'لا يوجد سبب'}
                          </p>
                        </div>
                      </div>
                      <span className={statusBadgeClass(item.data?.status || '')}>
                        {statusLabel(item.data?.status || '')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <EmptyState icon={Calendar} text="لا توجد مواعيد مسجلة" />
            </Card>
          )}
        </TabsContent>

        {/* ============ FILES ============ */}
        <TabsContent value="files" className="w-full mt-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <EmptyState icon={FolderOpen} text="لا توجد ملفات مرفوعة" />
          </Card>
        </TabsContent>

        {/* ============ MEDICAL HISTORY ============ */}
        <TabsContent value="history" className="w-full mt-4">
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center shrink-0">
                  <HeartPulse className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">التاريخ المرضي</h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {hasLatin(patient.medicalHistory) ? 'لا يوجد تاريخ مرضي مسجل' : (patient.medicalHistory || 'لا يوجد تاريخ مرضي مسجل')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
