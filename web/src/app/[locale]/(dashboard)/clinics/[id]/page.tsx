'use client';

import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Building2, Phone, MapPin, ArrowRight, ArrowLeft,
  Users, Stethoscope, CalendarDays, Banknote, FileText,
  Pill, Clock, CheckCircle2, XCircle, AlertCircle,
  Activity, UserPlus, FolderOpen, Receipt,
} from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';

export default function ClinicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const id = params?.id as string;

  const { data: clinic, isLoading, isError } = useQuery({
    queryKey: ['clinic', id],
    queryFn: async () => { const { data } = await api.get(`/clinics/${id}`); return data; },
    enabled: !!id,
  });

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      CANCELLED: 'bg-red-100 text-red-700',
      CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      SCHEDULED: 'bg-gray-100 text-gray-600',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const subStatusColor = (s: string) =>
    s === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    : 'bg-red-100 text-red-700';

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !clinic) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500">{isRtl ? 'العيادة غير موجودة' : 'Clinic not found'}</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          {isRtl ? 'رجوع' : 'Go back'}
        </Button>
      </div>
    );
  }

  const kpis = [
    { label: isRtl ? 'المرضى' : 'Patients', value: clinic.counts.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
    { label: isRtl ? 'الأطباء' : 'Doctors', value: clinic.counts.doctors, icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
    { label: isRtl ? 'المستخدمون' : 'Users', value: clinic.counts.users, icon: UserPlus, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
    { label: isRtl ? 'المواعيد' : 'Appointments', value: clinic.counts.appointments, icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
    { label: isRtl ? 'الوصفات' : 'Prescriptions', value: clinic.counts.prescriptions, icon: Pill, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-950/30' },
    { label: isRtl ? 'الفواتير' : 'Invoices', value: clinic.counts.invoices, icon: Receipt, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
    { label: isRtl ? 'الملفات الطبية' : 'Med. Records', value: clinic.counts.medicalRecords, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
    { label: isRtl ? 'الملفات المرفوعة' : 'Files', value: clinic.counts.files, icon: FolderOpen, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-900/40' },
  ];

  const totalAppts = Object.values(clinic.appointmentsByStatus as Record<string, number>).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <BackIcon className="w-4 h-4" />
          {isRtl ? 'رجوع' : 'Back'}
        </Button>
      </div>

      {/* Clinic Identity Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-teal-500 to-blue-600 text-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{clinic.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-sm text-white/80">
                {clinic.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{clinic.phone}</span>
                )}
                {clinic.address && (
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{clinic.address}</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur`}>
                  {clinic.subscriptionPlan}
                </span>
                <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${clinic.subscriptionStatus === 'ACTIVE' ? 'bg-green-400/30' : 'bg-red-400/30'}`}>
                  {clinic.subscriptionStatus}
                </span>
                <span className="text-[11px] text-white/60 ms-auto">
                  {isRtl ? 'منذ' : 'Since'} {formatDate(clinic.createdAt, locale)}
                </span>
              </div>
            </div>
          </div>

          {/* Revenue Summary */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">{(clinic.revenue.total ?? 0).toLocaleString()}</p>
              <p className="text-xs text-white/70">{isRtl ? 'إجمالي الإيراد (ج.م)' : 'Total Revenue (EGP)'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{(clinic.month.revenue ?? 0).toLocaleString()}</p>
              <p className="text-xs text-white/70">{isRtl ? 'إيراد هذا الشهر' : 'This Month Revenue'}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-300">{(clinic.revenue.pending?.amount ?? 0).toLocaleString()}</p>
              <p className="text-xs text-white/70">{isRtl ? 'فواتير معلقة' : 'Pending Invoices'} ({clinic.revenue.pending?.count ?? 0})</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Card key={i} className="dashboard-card">
              <CardContent className="p-3 flex flex-col items-center text-center">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                <p className="text-[10px] text-gray-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Row 2: Appointment Stats + Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Appointment Breakdown */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              {isRtl ? 'إحصائيات المواعيد' : 'Appointment Breakdown'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(clinic.appointmentsByStatus as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge(status)}`}>{status}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-teal-500 rounded-full"
                      style={{ width: totalAppts ? `${(count / totalAppts) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white w-8 text-end">{count}</span>
                </div>
              ))}
              <div className="pt-2 mt-1 border-t">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{isRtl ? 'مواعيد اليوم' : "Today's appts"}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{clinic.today.appointments}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  <span>{isRtl ? 'مواعيد هذا الشهر' : 'This month'}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{clinic.month.appointments}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="dashboard-card lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              {isRtl ? 'جدول اليوم' : "Today's Schedule"}
              {clinic.today.schedule?.length > 0 && (
                <span className="ms-auto text-xs bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                  {clinic.today.schedule.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinic.today.schedule?.length ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {clinic.today.schedule.map((apt: any) => (
                  <div key={apt.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                    <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-teal-700">
                      {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{apt.patient?.firstName} {apt.patient?.lastName}</p>
                      <p className="text-[10px] text-gray-500 truncate">{apt.doctor?.user?.name ? `${isRtl ? 'د.' : 'Dr.'} ${apt.doctor.user.name}` : apt.reason}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-xs font-medium">{formatTime(apt.appointmentDate, locale)}</p>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusBadge(apt.status)}`}>{apt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد مواعيد اليوم' : 'No appointments today'}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Row 3: Doctors + Recent Patients + Top Medications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Doctors */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-purple-600" />
              {isRtl ? 'الأطباء' : 'Doctors'} ({clinic.doctors?.length ?? 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinic.doctors?.length ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clinic.doctors.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-purple-700">
                      {doc.user?.name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{doc.user?.name}</p>
                      <p className="text-[10px] text-gray-500">{doc.specialization}</p>
                    </div>
                    <div className="text-end flex-shrink-0">
                      <p className="text-xs font-bold text-teal-600">{doc.consultationFee} {clinic.currency || 'ج.م'}</p>
                      <p className="text-[9px] text-gray-400">{doc._count?.appointments} {isRtl ? 'موعد' : 'appts'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Stethoscope className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا يوجد أطباء' : 'No doctors yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              {isRtl ? 'آخر المرضى المسجلين' : 'Recent Patients'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinic.recentPatients?.length ? (
              <div className="space-y-2">
                {clinic.recentPatients.map((pt: any) => (
                  <div key={pt.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-blue-700">
                      {pt.firstName?.[0]}{pt.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{pt.firstName} {pt.lastName}</p>
                      <p className="text-[10px] text-gray-500">{pt.phone}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 flex-shrink-0">{formatDate(pt.createdAt, locale)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا يوجد مرضى بعد' : 'No patients yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Medications */}
        <Card className="dashboard-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pill className="w-4 h-4 text-pink-600" />
              {isRtl ? 'الأدوية الأكثر وصفاً' : 'Top Medications'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {clinic.topMedications?.length ? (
              <div className="space-y-2">
                {clinic.topMedications.map((med: any, i: number) => (
                  <div key={med.id} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                    <div className="w-6 h-6 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-pink-700">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{med.name}</p>
                      <p className="text-[10px] text-gray-500">{med.category}</p>
                    </div>
                    <p className="text-sm font-bold text-pink-600">{med.count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Pill className="w-7 h-7 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد وصفات بعد' : 'No prescription data yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
