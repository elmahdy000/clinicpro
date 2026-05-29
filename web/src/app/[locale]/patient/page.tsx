'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import {
  Bell,
  Building2,
  CalendarDays,
  ChevronLeft,
  FileText,
  HeartPulse,
  Stethoscope,
  UserCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

const statusMap: Record<string, string> = {
  SCHEDULED: 'مؤكد',
  WAITING: 'في الانتظار',
  COMPLETED: 'مكتمل',
  CANCELLED: 'ملغي',
};

function displayName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function PatientDashboardPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const basePath = `/${locale}/patient`;

  const { data: overview } = useQuery({
    queryKey: ['patient-overview'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/overview').then((r) => r.data),
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-dashboard-appointments'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/appointments').then((r) => r.data),
  });

  const { data: prescriptions = [] } = useQuery({
    queryKey: ['patient-dashboard-prescriptions'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/prescriptions').then((r) => r.data),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['patient-dashboard-visits'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/visits').then((r) => r.data),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['patient-dashboard-notifications'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/notifications').then((r) => r.data),
  });

  const { data: clinics = [] } = useQuery({
    queryKey: ['patient-dashboard-clinics'],
    queryFn: () => api.get('/patient-portal/patient/dashboard/clinics').then((r) => r.data),
  });

  const nextAppointment = useMemo(
    () => appointments.find((a: any) => new Date(a.date) >= new Date() && a.status !== 'CANCELLED'),
    [appointments],
  );

  const latestRx = prescriptions[0];
  const recentVisits = visits.slice(0, 3);
  const patientName = displayName(overview?.patient?.fullName || 'المريض');

  const kpis = [
    {
      title: 'المواعيد القادمة',
      value: overview?.counts?.upcomingAppointments ?? 0,
      subtitle: (overview?.counts?.upcomingAppointments ?? 0) > 0 ? 'موعد قادم' : 'لا توجد',
      icon: CalendarDays,
      href: `${basePath}/appointments`,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'الروشتات المتاحة',
      value: overview?.counts?.availablePrescriptions ?? 0,
      subtitle: (overview?.counts?.availablePrescriptions ?? 0) > 0 ? 'روشتة متاحة' : 'لا توجد',
      icon: FileText,
      href: `${basePath}/prescriptions`,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'الزيارات السابقة',
      value: overview?.counts?.previousVisits ?? 0,
      subtitle: (overview?.counts?.previousVisits ?? 0) > 0 ? 'زيارة سابقة' : 'لا توجد',
      icon: Stethoscope,
      href: `${basePath}/medical-records`,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'الإشعارات غير المقروءة',
      value: overview?.counts?.unreadNotifications ?? 0,
      subtitle: (overview?.counts?.unreadNotifications ?? 0) > 0 ? 'إشعار جديد' : 'لا توجد',
      icon: Bell,
      href: `${basePath}/notifications`,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-l from-teal-500 to-teal-600 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="text-white">
          <h1 className="text-xl font-bold">مرحبًا، {patientName}</h1>
          <p className="text-sm text-teal-100 mt-0.5">تابع مواعيدك وروشتاتك وتاريخك الطبي من مكان واحد</p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <HeartPulse className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.title} href={kpi.href} className="block">
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm min-h-[120px] hover:shadow-md transition-shadow">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">{kpi.title}</span>
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{kpi.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                الموعد القادم
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {nextAppointment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                      {statusMap[nextAppointment.status] || nextAppointment.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {formatDate(nextAppointment.date, locale)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{nextAppointment.clinicName} — {nextAppointment.doctorName}</p>
                  <Link href={`${basePath}/appointments`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                    عرض التفاصيل <ChevronLeft className="w-3 h-3" />
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-slate-500 space-y-2">
                  <p className="font-medium text-slate-700">لا توجد مواعيد قادمة</p>
                  <p>ستظهر هنا مواعيدك القادمة بعد حجزها من العيادة.</p>
                  <p className="text-xs text-slate-400">للحجز، تواصل مع العيادة.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                آخر الروشتات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {latestRx ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(latestRx.date, locale)}</span>
                    <span className="text-xs text-slate-500">{latestRx.medicinesCount} أدوية</span>
                  </div>
                  <p className="text-sm text-slate-600">{latestRx.clinicName} — {latestRx.doctorName}</p>
                  <div className="flex gap-2 pt-1">
                    <Link href={`${basePath}/prescriptions`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">عرض الروشتة</Button>
                    </Link>
                    {latestRx.canDownloadPdf && (
                      <Button size="sm" className="text-xs h-8">تحميل PDF</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">لا توجد روشتات بعد</p>
                  <p>ستظهر الروشتات هنا بعد أن يضيفها الطبيب.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-amber-600" />
                آخر الزيارات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {recentVisits.length > 0 ? (
                recentVisits.map((visit: any) => (
                  <div key={visit.id} className="border border-slate-100 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{formatDate(visit.date, locale)}</span>
                    </div>
                    <p className="text-slate-700 text-sm">{visit.clinicName} — {visit.doctorName}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {visit.isVisibleToPatient
                        ? visit.diagnosisPreview || 'لا توجد تفاصيل إضافية'
                        : 'تفاصيل الزيارة متاحة من خلال العيادة'}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 space-y-1">
                  <p className="font-medium text-slate-700">لا توجد زيارات سابقة</p>
                  <p>ستظهر الزيارات هنا بعد تسجيلها من العيادة.</p>
                </div>
              )}
              {recentVisits.length > 0 && (
                <Link href={`${basePath}/medical-records`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-teal-600" />
                بيانات المريض
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-900 font-medium">{displayName(overview?.patient?.fullName || '')}</span>
                  <span className="text-slate-400 text-xs">الاسم</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-900" dir="ltr">{overview?.patient?.phone || '-'}</span>
                  <span className="text-slate-400 text-xs">رقم الهاتف</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-900">{overview?.patient?.code || '-'}</span>
                  <span className="text-slate-400 text-xs">كود المريض</span>
                </div>
              </div>
              <Link href={`${basePath}/settings`}>
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-9">تحديث بيانات الدخول</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                العيادات المرتبطة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {clinics.length > 0 ? (
                clinics.slice(0, 3).map((clinic: any) => (
                  <div key={clinic.id} className="border border-slate-100 rounded-xl p-3">
                    <p className="font-medium text-sm text-slate-900">{clinic.name}</p>
                    {(clinic.phone || clinic.address) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[clinic.phone, clinic.address].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">لا توجد عيادات مرتبطة</p>
              )}
              {clinics.length > 0 && (
                <Link href={`${basePath}/clinics`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                الإشعارات
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((n: any) => (
                  <div key={n.id} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-slate-800">{n.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">لا توجد إشعارات جديدة</p>
              )}
              {notifications.length > 0 && (
                <Link href={`${basePath}/notifications`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  عرض الكل <ChevronLeft className="w-3 h-3" />
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
