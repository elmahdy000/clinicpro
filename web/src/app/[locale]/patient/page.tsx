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
  ChevronRight,
  FileText,
  HeartPulse,
  Stethoscope,
  UserCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

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

  const statusMap: Record<string, string> = {
    SCHEDULED: isRtl ? 'مؤكد' : 'Confirmed',
    WAITING: isRtl ? 'في الانتظار' : 'Waiting',
    COMPLETED: isRtl ? 'مكتمل' : 'Completed',
    CANCELLED: isRtl ? 'ملغي' : 'Cancelled',
  };

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
  const patientName = displayName(overview?.patient?.fullName || (isRtl ? 'المريض' : 'Patient'));

  const kpis = [
    {
      title: isRtl ? 'المواعيد القادمة' : 'Upcoming Appointments',
      value: overview?.counts?.upcomingAppointments ?? 0,
      subtitle: (overview?.counts?.upcomingAppointments ?? 0) > 0 ? (isRtl ? 'موعد قادم' : 'upcoming appointment(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: CalendarDays,
      href: `${basePath}/appointments`,
      color: 'text-teal-600',
      bg: 'bg-teal-50 dark:bg-teal-950/20',
    },
    {
      title: isRtl ? 'الروشتات المتاحة' : 'Available Prescriptions',
      value: overview?.counts?.availablePrescriptions ?? 0,
      subtitle: (overview?.counts?.availablePrescriptions ?? 0) > 0 ? (isRtl ? 'روشتة متاحة' : 'available prescription(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: FileText,
      href: `${basePath}/prescriptions`,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      title: isRtl ? 'الزيارات السابقة' : 'Previous Visits',
      value: overview?.counts?.previousVisits ?? 0,
      subtitle: (overview?.counts?.previousVisits ?? 0) > 0 ? (isRtl ? 'زيارة سابقة' : 'previous visit(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: Stethoscope,
      href: `${basePath}/medical-records`,
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/20',
    },
    {
      title: isRtl ? 'الإشعارات غير المقروءة' : 'Unread Notifications',
      value: overview?.counts?.unreadNotifications ?? 0,
      subtitle: (overview?.counts?.unreadNotifications ?? 0) > 0 ? (isRtl ? 'إشعار جديد' : 'new notification(s)') : (isRtl ? 'لا توجد' : 'None'),
      icon: Bell,
      href: `${basePath}/notifications`,
      color: 'text-rose-600',
      bg: 'bg-rose-50 dark:bg-rose-950/20',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-gradient-to-l from-teal-500 to-teal-600 rounded-2xl p-5 flex items-center justify-between shadow-sm">
        <div className="text-white">
          <h1 className="text-xl font-bold">{isRtl ? `مرحبًا، ${patientName}` : `Welcome, ${patientName}`}</h1>
          <p className="text-sm text-teal-100 mt-0.5">
            {isRtl ? 'تابع مواعيدك وروشتاتك وتاريخك الطبي من مكان واحد' : 'Track your appointments, prescriptions, and medical history all in one place'}
          </p>
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
              <Card className="rounded-2xl border-slate-200 bg-white shadow-sm min-h-[120px] hover:shadow-md transition-shadow dark:bg-slate-950 dark:border-slate-800">
                <CardContent className="p-4 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{kpi.title}</span>
                    <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${kpi.color}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{kpi.value}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{kpi.subtitle}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-teal-600" />
                {isRtl ? 'الموعد القادم' : 'Next Appointment'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {nextAppointment ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg dark:bg-slate-900 dark:text-slate-400">
                      {statusMap[nextAppointment.status] || nextAppointment.status}
                    </span>
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {formatDate(nextAppointment.date, locale)}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-350">{nextAppointment.clinicName} — {nextAppointment.doctorName}</p>
                  <Link href={`${basePath}/appointments`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                    {isRtl ? 'عرض التفاصيل' : 'View Details'} {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  </Link>
                </div>
              ) : (
                <div className="text-sm text-slate-500 space-y-2 dark:text-slate-400">
                  <p className="font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'لا توجد مواعيد قادمة' : 'No upcoming appointments'}</p>
                  <p>{isRtl ? 'ستظهر هنا مواعيدك القادمة بعد حجزها من العيادة.' : 'Your upcoming appointments will appear here once booked by the clinic.'}</p>
                  <p className="text-xs text-slate-400">{isRtl ? 'للحجز، تواصل مع العيادة.' : 'To book, please contact the clinic.'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                {isRtl ? 'آخر الروشتات' : 'Latest Prescriptions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              {latestRx ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{formatDate(latestRx.date, locale)}</span>
                    <span className="text-xs text-slate-500">{latestRx.medicinesCount} {isRtl ? 'أدوية' : 'medicines'}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-350">{latestRx.clinicName} — {latestRx.doctorName}</p>
                  <div className="flex gap-2 pt-1">
                    <Link href={`${basePath}/prescriptions`}>
                      <Button variant="outline" size="sm" className="text-xs h-8">{isRtl ? 'عرض الروشتة' : 'View Prescription'}</Button>
                    </Link>
                    {latestRx.canDownloadPdf && (
                      <Button size="sm" className="text-xs h-8">{isRtl ? 'تحميل PDF' : 'Download PDF'}</Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500 space-y-1 dark:text-slate-450">
                  <p className="font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'لا توجد روشتات بعد' : 'No prescriptions yet'}</p>
                  <p>{isRtl ? 'ستظهر الروشتات هنا بعد أن يضيفها الطبيب.' : 'Prescriptions will appear here once added by the doctor.'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-amber-600" />
                {isRtl ? 'آخر الزيارات' : 'Recent Visits'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {recentVisits.length > 0 ? (
                recentVisits.map((visit: any) => (
                  <div key={visit.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{formatDate(visit.date, locale)}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-sm">{visit.clinicName} — {visit.doctorName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-450 mt-1">
                      {visit.isVisibleToPatient
                        ? visit.diagnosisPreview || (isRtl ? 'لا توجد تفاصيل إضافية' : 'No additional details')
                        : (isRtl ? 'تفاصيل الزيارة متاحة من خلال العيادة' : 'Visit details are available through the clinic')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500 space-y-1 dark:text-slate-450">
                  <p className="font-medium text-slate-700 dark:text-slate-300">{isRtl ? 'لا توجد زيارات سابقة' : 'No previous visits'}</p>
                  <p>{isRtl ? 'ستظهر الزيارات هنا بعد تسجيلها من العيادة.' : 'Visits will appear here once registered by the clinic.'}</p>
                </div>
              )}
              {recentVisits.length > 0 && (
                <Link href={`${basePath}/medical-records`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  {isRtl ? 'عرض الكل' : 'View All'} {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <UserCircle2 className="w-4 h-4 text-teal-600" />
                {isRtl ? 'بيانات المريض' : 'Patient Info'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2 text-sm">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-900 font-medium dark:text-slate-100">{displayName(overview?.patient?.fullName || '')}</span>
                  <span className="text-slate-400 text-xs">{isRtl ? 'الاسم' : 'Name'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-900 dark:text-slate-100" dir="ltr">{overview?.patient?.phone || '-'}</span>
                  <span className="text-slate-400 text-xs">{isRtl ? 'رقم الهاتف' : 'Phone'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-900 dark:text-slate-100">{overview?.patient?.code || '-'}</span>
                  <span className="text-slate-400 text-xs">{isRtl ? 'كود المريض' : 'Patient Code'}</span>
                </div>
              </div>
              <Link href={`${basePath}/settings`}>
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-9">{isRtl ? 'تحديث بيانات الدخول' : 'Update Credentials'}</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                {isRtl ? 'العيادات المرتبطة' : 'Linked Clinics'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {clinics.length > 0 ? (
                clinics.slice(0, 3).map((clinic: any) => (
                  <div key={clinic.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-3">
                    <p className="font-medium text-sm text-slate-900 dark:text-slate-100">{clinic.name}</p>
                    {(clinic.phone || clinic.address) && (
                      <p className="text-xs text-slate-500 dark:text-slate-450 mt-0.5">
                        {[clinic.phone, clinic.address].filter(Boolean).join(' - ')}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-450">{isRtl ? 'لا توجد عيادات مرتبطة' : 'No linked clinics'}</p>
              )}
              {clinics.length > 0 && (
                <Link href={`${basePath}/clinics`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  {isRtl ? 'عرض الكل' : 'View All'} {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-600" />
                {isRtl ? 'الإشعارات' : 'Notifications'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              {notifications.length > 0 ? (
                notifications.slice(0, 3).map((n: any) => (
                  <div key={n.id} className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-450">{isRtl ? 'لا توجد إشعارات جديدة' : 'No new notifications'}</p>
              )}
              {notifications.length > 0 && (
                <Link href={`${basePath}/notifications`} className="text-xs text-teal-700 inline-flex items-center gap-1">
                  {isRtl ? 'عرض الكل' : 'View All'} {isRtl ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
