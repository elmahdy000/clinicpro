'use client';

import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import {
  ChevronRight, Users, Stethoscope, CalendarDays,
  FileText, Activity, AlertCircle, Phone, MapPin, User, Mail,
  Calendar, CreditCard, ShieldAlert, Power, PowerOff, Sparkles,
  CircleDollarSign, Clock, CheckCircle2, AlertTriangle, ArrowLeft,
  Settings2, ClipboardList
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  PRO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  TRIAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
};

const INVOICE_STATUS_COLOR: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400',
  CANCELLED: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
};

interface ScheduleAppointment {
  patient?: { firstName?: string; lastName?: string };
  doctor?: { user?: { name?: string } };
  status: string;
}

interface RecentPatient {
  firstName: string;
  lastName: string;
  phone?: string;
  createdAt: string;
}

interface TopMedication {
  name: string;
  count: number;
}

interface Doctor {
  user?: { name?: string; email?: string };
  specialization: string;
  consultationFee: number;
  _count?: { appointments?: number };
  status: string;
}

interface Invoice {
  invoiceNumber: string;
  patient?: { firstName: string; lastName: string };
  subtotal: number;
  total: number;
  status: string;
  paymentMethod?: string;
  createdAt: string;
}

interface AuditLog {
  createdAt: string;
  user?: { email?: string };
  action: string;
  details?: string;
}

interface ClinicDetail {
  id?: number;
  name: string;
  phone?: string;
  address?: string;
  governorate?: { nameAr?: string; nameEn?: string };
  city?: { nameAr?: string; nameEn?: string };
  owner?: { name: string; email: string; role?: string };
  subscriptionPlan: string;
  subscriptionStatus: string;
  createdAt: string;
  lastActivity?: string;
  currency?: string;
  counts?: {
    patients: number;
    doctors: number;
    appointments: number;
    prescriptions: number;
    invoices: number;
  };
  today?: {
    schedule?: ScheduleAppointment[];
  };
  recentPatients?: RecentPatient[];
  topMedications?: TopMedication[];
  doctors?: Doctor[];
  invoices?: Invoice[];
  auditLogs?: AuditLog[];
}

export default function ClinicDetailPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'doctors' | 'invoices' | 'audit' | 'settings'>('overview');

  // Query Clinic Data (must be before early return for hooks rule)
  const { data: clinic, isLoading, refetch } = useQuery<ClinicDetail>({
    queryKey: ['clinic', params.id],
    queryFn: () => api.get(`/clinics/${params.id}`).then((r) => r.data),
    enabled: !!params.id,
  });

  // Mutator for Admin Actions
  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.put(`/clinics/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', params.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(isRtl ? 'تم تحديث ترخيص العيادة بنجاح' : 'Clinic license updated successfully');
      refetch();
    },
    onError: () => {
      toast.error(isRtl ? 'فشل تحديث ترخيص العيادة' : 'Failed to update clinic license');
    },
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PLATFORM_OWNER')) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, authLoading, router, locale]);

  if (authLoading || !user || user.role !== 'PLATFORM_OWNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const handleToggleStatus = (currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateMutation.mutate({ subscriptionStatus: nextStatus });
  };

  const handleChangePlan = (nextPlan: string) => {
    updateMutation.mutate({ subscriptionPlan: nextPlan });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded-md" />
        <div className="h-28 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          ))}
        </div>
        <div className="h-64 w-full bg-gray-200 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <Card className="border-rose-100 dark:border-rose-950/40">
        <CardContent className="py-20 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-rose-500 opacity-80" />
          <h2 className="text-lg font-black text-gray-900 dark:text-white mb-2">{isRtl ? 'العيادة غير موجودة' : 'Clinic Not Found'}</h2>
          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-6">
            {isRtl ? 'المعرف المحدد لا يطابق أي عيادة مسجلة على خوادم المنصة حالياً.' : 'The selected ID does not match any clinic registered on the platform.'}
          </p>
          <Link href={`/${locale}/clinics`} passHref>
            <Button size="sm" variant="outline" className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              {isRtl ? 'العودة لقائمة العيادات' : 'Back to Clinics List'}
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isSuspended = clinic.subscriptionStatus === 'SUSPENDED';

  // Stats Counters mapping
  const statsCards = [
    { label: isRtl ? 'المرضى المسجلين' : 'Registered Patients', value: clinic.counts?.patients || 0, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20' },
    { label: isRtl ? 'الأطباء المرخصين' : 'Licensed Doctors', value: clinic.counts?.doctors || 0, icon: Stethoscope, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20' },
    { label: isRtl ? 'إجمالي المواعيد' : 'Total Appointments', value: clinic.counts?.appointments || 0, icon: CalendarDays, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20' },
    { label: isRtl ? 'الروشتات المصدرة' : 'Prescriptions Issued', value: clinic.counts?.prescriptions || 0, icon: ClipboardList, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/20' },
    { label: isRtl ? 'الفواتير التشغيلية' : 'Total Invoices', value: clinic.counts?.invoices || 0, icon: FileText, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/20' },
  ];

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Navigation Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-500 mb-2">
        <div className="flex items-center gap-1.5">
          <Link href={`/${locale}/clinics`} className="hover:text-teal-600 font-bold transition-colors">{isRtl ? 'العيادات المسجلة' : 'Registered Clinics'}</Link>
          <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''} text-gray-400`} />
          <span className="text-gray-900 dark:text-white font-extrabold">{clinic.name}</span>
        </div>

        <Link href={`/${locale}/clinics`} passHref>
          <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px] font-bold">
            <ArrowLeft className={`w-3.5 h-3.5 ${isRtl ? 'rotate-180' : ''}`} />
            {isRtl ? 'العودة للقائمة' : 'Back to List'}
          </Button>
        </Link>
      </div>

      {/* 1. Glassmorphic Clinic Identity Header */}
      <Card className="relative overflow-hidden border-teal-500/20 bg-gradient-to-br from-slate-50 via-white to-teal-50/20 dark:from-slate-900/60 dark:via-slate-950 dark:to-teal-950/10 shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl" />
        <CardContent className="p-6 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Clinic Info Left */}
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-extrabold text-2xl flex-shrink-0 shadow-lg select-none ring-2 ring-teal-500/20">
                {clinic.name ? getInitials(clinic.name) : 'C'}
              </div>
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white truncate">{clinic.name}</h1>
                  <Badge variant="outline" className={`text-[10px] px-2.5 py-0.5 font-bold border ${STATUS_COLOR[clinic.subscriptionStatus] || ''}`}>
                    {isRtl 
                      ? (clinic.subscriptionStatus === 'ACTIVE' ? 'نشط' : clinic.subscriptionStatus === 'SUSPENDED' ? 'موقوف' : 'تجريبي') 
                      : clinic.subscriptionStatus}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] px-2.5 py-0.5 font-bold border ${PLAN_COLOR[clinic.subscriptionPlan] || ''}`}>
                    {clinic.subscriptionPlan}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 font-semibold">
                  {clinic.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-teal-600" /> {clinic.phone}</span>}
                  {(clinic.city || clinic.governorate) ? (
                    <span className="flex items-center gap-1 font-mono text-[11px]" title={clinic.address}>
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      {clinic.city ? (isRtl ? clinic.city.nameAr : clinic.city.nameEn) : ''}
                      {clinic.city && clinic.governorate ? '، ' : ''}
                      {clinic.governorate ? (isRtl ? clinic.governorate.nameAr : clinic.governorate.nameEn) : ''}
                    </span>
                  ) : clinic.address ? (
                    <span className="flex items-center gap-1 font-mono text-[11px]" title={clinic.address}>
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      {clinic.address}
                    </span>
                  ) : null}
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {isRtl ? 'تاريخ التسجيل:' : 'Registered:'} {formatDate(clinic.createdAt, locale)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center flex-wrap gap-2.5 bg-white/60 dark:bg-slate-900/40 p-3 rounded-2xl border border-gray-200/40 dark:border-gray-800/40 backdrop-blur-sm self-start lg:self-center">
              <div className="flex flex-col text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'حالة الحساب والترخيص' : 'Licencing Status'}</span>
                <span className="text-xs font-black text-gray-800 dark:text-white mt-0.5">
                  {isSuspended ? (isRtl ? 'الخدمة متوقفة حالياً' : 'Service Suspended') : (isRtl ? 'الخدمة تعمل بشكل كامل' : 'Fully Operational')}
                </span>
              </div>
              <div className="w-px h-8 bg-gray-200 dark:bg-gray-800 mx-1.5 hidden sm:block" />
              
              <Button
                size="sm"
                variant={isSuspended ? 'default' : 'outline'}
                onClick={() => handleToggleStatus(clinic.subscriptionStatus)}
                className={`h-9 text-xs font-bold gap-1.5 transition-colors shadow-xs ${
                  isSuspended 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent' 
                    : 'text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 dark:hover:bg-rose-950/20'
                }`}
                title={isSuspended ? (isRtl ? 'إعادة ترخيص العيادة للعمل' : 'Reactivate license') : (isRtl ? 'تعطيل ترخيص العيادة' : 'Suspend license')}
              >
                {isSuspended ? (
                  <>
                    <Power className="w-4 h-4" />
                    {isRtl ? 'تفعيل ترخيص العيادة' : 'Activate'}
                  </>
                ) : (
                  <>
                    <PowerOff className="w-4 h-4" />
                    {isRtl ? 'إيقاف الترخيص' : 'Suspend'}
                  </>
                )}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* 2. KPI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="border-gray-200/80 dark:border-gray-800/80 shadow-xs hover:border-teal-500/20 transition-all select-none bg-white dark:bg-slate-900/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${s.bg} flex-shrink-0`}>
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl font-black text-gray-900 dark:text-white font-mono leading-none">{s.value.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1.5 leading-normal truncate uppercase tracking-wider">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 3. Custom Tab Switches */}
      <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-gray-800 pb-px overflow-x-auto whitespace-nowrap scrollbar-none">
        {[
          { id: 'overview', label: isRtl ? 'نظرة عامة والتشغيل' : 'Overview & Performance', icon: Sparkles },
          { id: 'doctors', label: isRtl ? 'الكوادر والأطباء' : 'Doctors & Users', icon: Stethoscope },
          { id: 'invoices', label: isRtl ? 'السجل المالي والفواتير' : 'Invoices & Payments', icon: CircleDollarSign },
          { id: 'audit', label: isRtl ? 'سجلات تدقيق الأمان' : 'Security Audit logs', icon: ClipboardList },
          { id: 'settings', label: isRtl ? 'ترقية الاشتراك والإدارة' : 'Subscription Plan', icon: Settings2 },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'doctors' | 'invoices' | 'audit' | 'settings')}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                isActive
                  ? 'border-teal-600 text-teal-600 dark:border-teal-400 dark:text-teal-400'
                  : 'border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200 dark:hover:text-gray-300'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Primary Owner Information */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 lg:col-span-1 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <User className="w-4 h-4" />
                  {isRtl ? 'بيانات المالك والمسؤول الرئيسي' : 'Primary Owner Account'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {clinic.owner ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-teal-50 dark:bg-teal-950 flex items-center justify-center text-teal-600 dark:text-teal-400 font-extrabold text-sm border border-teal-100 dark:border-teal-900">
                        {clinic.owner.name ? getInitials(clinic.owner.name) : 'O'}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-gray-900 dark:text-white block">{clinic.owner.name}</span>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">{isRtl ? 'المشرف الرئيسي للتينانت' : 'Tenant Admin'}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                        <span className="text-gray-400 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {isRtl ? 'البريد الإلكتروني' : 'Email Address'}</span>
                        <span className="text-gray-800 dark:text-white font-mono">{clinic.owner.email}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50/80 dark:bg-gray-900/40">
                        <span className="text-gray-400 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-gray-400" /> {isRtl ? 'صلاحيات الحساب' : 'Role Privileges'}</span>
                        <span className="text-purple-600 font-bold uppercase">{clinic.owner.role}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">{isRtl ? 'لم يتم تعيين مالك رئيسي للعيادة' : 'No primary owner assigned yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today Appointments schedule */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 lg:col-span-2 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <CalendarDays className="w-4 h-4 animate-pulse" />
                  {isRtl ? 'جدول المواعيد والتشغيل اليومي' : "Today's Clinic Operations"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {clinic.today?.schedule?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {clinic.today.schedule.map((apt: ScheduleAppointment, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100/60 dark:border-gray-800/60">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold text-xs select-none">
                            {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{apt.patient?.firstName} {apt.patient?.lastName}</span>
                            <span className="text-[10px] text-gray-400 font-semibold block truncate">{apt.doctor?.user?.name}</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[8px] font-bold border border-teal-200 text-teal-600 bg-teal-50 px-1.5 py-0">
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <p className="text-xs font-bold">{isRtl ? 'لا توجد مواعيد تشغيل اليوم' : 'No appointments scheduled for today'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{isRtl ? 'سيظهر جدول المواعيد بمجرد حجز مواعيد جديدة.' : 'Today\'s operational schedule is clear.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Patients */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 lg:col-span-1 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Users className="w-4 h-4" />
                  {isRtl ? 'المرضى المسجلين حديثاً' : 'Recent Patient Onboardings'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {clinic.recentPatients?.length ? (
                  <div className="space-y-2.5">
                    {clinic.recentPatients.map((p: RecentPatient, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 dark:bg-gray-900/20 border border-gray-100 dark:border-gray-800/40">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">{p.firstName} {p.lastName}</span>
                          <span className="text-[9px] text-gray-400 font-mono block mt-0.5">{p.phone || (isRtl ? 'لا يوجد هاتف' : 'No phone')}</span>
                        </div>
                        <span className="text-[9px] font-mono text-gray-500">
                          {formatDate(p.createdAt, locale)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-xs">{isRtl ? 'لا يوجد مرضى مسجلين حتى الآن' : 'No patients onboarded yet'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Prescribed Medications chart list */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 lg:col-span-2 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Activity className="w-4 h-4" />
                  {isRtl ? 'الأدوية الأكثر صرفاً في العيادة' : 'Most Prescribed Medications'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {clinic.topMedications?.length ? (
                  <div className="space-y-3">
                    {clinic.topMedications.map((med: TopMedication, i: number) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-900 dark:text-white font-mono">{med.name}</span>
                          <span className="text-teal-600 font-extrabold">{med.count} {isRtl ? 'روشتة' : 'prescriptions'}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          <div
                            className="h-full bg-teal-500 dark:bg-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((med.count / (clinic.counts?.prescriptions || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Activity className="w-10 h-10 mx-auto mb-2 text-purple-400 opacity-60" />
                    <p className="text-xs font-bold">{isRtl ? 'لا تتوفر إحصائيات دوائية حالياً' : 'No prescription metrics available'}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{isRtl ? 'ستظهر التحليلات الدوائية فور صرف أول روشتة طبية متكاملة.' : 'Prescribed medicine charts will populate with activity.'}</p>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        )}

        {/* TAB 2: DOCTORS & USERS */}
        {activeTab === 'doctors' && (
          <Card className="border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-slate-900/30">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <Stethoscope className="w-4 h-4" />
                {isRtl ? 'قائمة الكوادر الطبية والأطباء المسجلين' : 'Registered Licensed Staff'}
              </CardTitle>
              <span className="text-xs font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                {clinic.doctors?.length || 0} {isRtl ? 'طبيب' : 'doctors'}
              </span>
            </CardHeader>
            <CardContent className="p-0">
              {clinic.doctors?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 dark:bg-gray-900/40 text-gray-400 font-bold text-[10px] uppercase select-none">
                        <th className="px-5 py-3 text-right">{isRtl ? 'اسم الطبيب والبيانات' : 'Doctor Credentials'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'التخصص الطبي الرئيسي' : 'Medical Specialization'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'قيمة كشف العيادة' : 'Consultation Fee'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'النشاط التشغيلي' : 'Active Appointments'}</th>
                        <th className="px-5 py-3 text-center">{isRtl ? 'حالة التفعيل' : 'Operational Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {clinic.doctors.map((doc: Doctor, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-700 dark:text-purple-300 font-extrabold text-xs">
                                {doc.user?.name ? getInitials(doc.user.name) : 'Dr'}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-extrabold text-gray-950 dark:text-white block">{doc.user?.name}</span>
                                <span className="text-[10px] text-gray-500 block truncate">{doc.user?.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-gray-800 dark:text-white">
                            {doc.specialization}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {doc.consultationFee.toLocaleString()} {clinic.currency || 'EGP'}
                          </td>
                          <td className="px-5 py-3 text-xs text-gray-500 font-semibold">
                            {doc._count?.appointments || 0} {isRtl ? 'موعد حجز' : 'appointments'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="outline" className={`text-[9px] font-bold border rounded-md ${doc.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {doc.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold">{isRtl ? 'لا يوجد أطباء مسجلين' : 'No clinical doctors registered'}</p>
                  <p className="text-xs text-gray-400 mt-1">{isRtl ? 'سيظهر الأطباء بقائمة الموظفين بمجرد إضافتهم للعيادة.' : 'Clinical staff will display once manually registered.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 3: INVOICES & PAYMENTS */}
        {activeTab === 'invoices' && (
          <Card className="border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-slate-900/30">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <CircleDollarSign className="w-4 h-4" />
                {isRtl ? 'سجل الفواتير والمعاملات المالية للعيادة' : 'Clinic Financial Records & Invoices'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {clinic.invoices?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50/60 dark:bg-gray-900/40 text-gray-400 font-bold text-[10px] uppercase select-none">
                        <th className="px-5 py-3 text-right">{isRtl ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'المريض المستفيد' : 'Beneficiary Patient'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'إجمالي المدفوع' : 'Total Invoice'}</th>
                        <th className="px-5 py-3 text-center">{isRtl ? 'حالة السداد' : 'Payment Status'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'طريقة الدفع' : 'Method'}</th>
                        <th className="px-5 py-3 text-right">{isRtl ? 'تاريخ المعاملة' : 'Issued Date'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {clinic.invoices.map((inv: Invoice, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-gray-800 dark:text-white">
                            {inv.patient ? `${inv.patient.firstName} ${inv.patient.lastName}` : (isRtl ? 'مريض عام' : 'General Patient')}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-gray-500">
                            {inv.subtotal.toLocaleString()} {clinic.currency || 'EGP'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {inv.total.toLocaleString()} {clinic.currency || 'EGP'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <Badge variant="outline" className={`text-[9px] font-bold border rounded-md ${INVOICE_STATUS_COLOR[inv.status] || ''}`}>
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
                            {inv.paymentMethod || 'CASH'}
                          </td>
                          <td className="px-5 py-3 text-xs font-mono text-gray-500">
                            {formatDate(inv.createdAt, locale)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold">{isRtl ? 'لا توجد فواتير تشغيلية حالياً' : 'No financial invoices found'}</p>
                  <p className="text-xs text-gray-400 mt-1">{isRtl ? 'تظهر السجلات هنا فور قيام موظفي الاستقبال بسداد كشف مريض.' : 'Financial statements will display upon patient check-out.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 4: SECURITY AUDIT LOGS */}
        {activeTab === 'audit' && (
          <Card className="border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-slate-900/30">
            <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
              <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <Clock className="w-4 h-4 text-purple-600" />
                {isRtl ? 'سجل التدقيق التشغيلي والأمني للعيادة (Audit Trail)' : 'Security Audit & Tenant Activity Logs'}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {clinic.auditLogs?.length ? (
                <div className="relative border-r dark:border-gray-800 mr-4 pr-6 space-y-4">
                  {clinic.auditLogs.map((log: AuditLog, i: number) => (
                    <div key={i} className="relative space-y-1">
                      {/* Timeline Dot Indicator */}
                      <span className="absolute -right-[29px] top-1.5 w-2.5 h-2.5 rounded-full bg-teal-500 dark:bg-teal-400 ring-4 ring-white dark:ring-slate-950" />
                      
                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                        <span className="font-mono">{formatDate(log.createdAt, locale)}</span>
                        <span>•</span>
                        <span className="text-purple-600 uppercase font-mono">{log.user?.email || 'SYSTEM'}</span>
                      </div>
                      
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{log.action}</p>
                      {log.details && (
                        <p className="text-[10px] text-gray-500 font-mono bg-gray-50 dark:bg-gray-900/60 p-2 rounded-lg border border-gray-100 dark:border-gray-800 mt-1 max-w-xl">
                          {log.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm font-bold">{isRtl ? 'لا توجد سجلات تدقيق أمني حالياً' : 'Audit trails are empty'}</p>
                  <p className="text-xs text-gray-400 mt-1">{isRtl ? 'سيقوم النظام بتدوين أي عملية تعديل على إعدادات التينانت أوتوماتيكياً.' : 'System setting changes will auto-populate timeline logs.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 5: SUBSCRIPTION PLAN SETTINGS */}
        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Plan Modification and Pricing Tier Controls */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {isRtl ? 'ترقية وتعديل خطة الاشتراك للمستأجر' : 'Modify Tenant Pricing Tier'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-gray-400 uppercase">{isRtl ? 'الباقة الحالية المفعلة' : 'Currently Active Tier'}</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white block font-mono">{clinic.subscriptionPlan}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-gray-500 block">{isRtl ? 'اختر الباقة الجديدة للعيادة:' : 'Select New Pricing Plan:'}</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map((plan) => {
                      const isSelected = clinic.subscriptionPlan === plan;
                      return (
                        <button
                          key={plan}
                          onClick={() => handleChangePlan(plan)}
                          disabled={updateMutation.isPending}
                          className={`p-3 text-xs font-black font-mono border rounded-xl transition-all ${
                            isSelected
                              ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/20 dark:border-teal-400 dark:text-teal-400'
                              : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {plan}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-teal-50/50 dark:bg-teal-950/10 rounded-xl border border-teal-100 dark:border-teal-900 text-[10px] text-teal-700 dark:text-teal-400 flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">{isRtl ? 'تنبيه أمان الترقية:' : 'License Upgrades Info:'}</span>
                    {isRtl 
                      ? 'تغيير خطة الاشتراك يعدل فوراً صلاحيات الحساب وعدد الأطباء الأقصى وقدرات استيعاب الملفات.' 
                      : 'Modifying pricing plans immediately scales maximum doctor limits and secure cloud storage limits.'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status / Disabling operations */}
            <Card className="border-gray-200/80 dark:border-gray-800/80 bg-white dark:bg-slate-900/30">
              <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-rose-600">
                  <ShieldAlert className="w-4 h-4" />
                  {isRtl ? 'تعليق حساب العيادة وإلغاء التفعيل' : 'Platform Emergency Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  {isRtl 
                    ? 'تعطيل ترخيص العيادة يمنع جميع موظفي العيادة والمرضى التابعين لها من تسجيل الدخول فوراً ويجمد العمليات الفندقية والمالية.' 
                    : 'Suspending this clinic\'s license immediately rejects all active login tokens and stops all operations.'}
                </p>

                <div className="flex items-center gap-3 p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block">{isRtl ? 'منطقة الخطورة القصوى' : 'Danger Area'}</span>
                    <span className="text-[10px] text-rose-600 dark:text-rose-500 font-semibold block mt-0.5">
                      {isRtl ? 'لا تقم بتعليق الخدمة إلا لوجود مستحقات مالية متأخرة أو مخالفات قانونية.' : 'Only suspend on contract violation or non-payments.'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleStatus(clinic.subscriptionStatus)}
                  disabled={updateMutation.isPending}
                  className={`w-full text-xs font-bold py-2.5 h-auto transition-colors ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isSuspended ? (
                    <>
                      <Power className="w-4 h-4 ml-1.5" />
                      {isRtl ? 'إلغاء تجميد الخدمة وإعادة التفعيل' : 'Reactivate Clinic Access'}
                    </>
                  ) : (
                    <>
                      <PowerOff className="w-4 h-4 ml-1.5" />
                      {isRtl ? 'تجميد الخدمة وإيقاف العيادة فوراً' : 'Suspend Clinic operations'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

          </div>
        )}

      </div>

    </div>
  );
}