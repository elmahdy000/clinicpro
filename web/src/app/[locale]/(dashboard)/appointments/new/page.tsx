'use client';

import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchBox } from '@/components/common/SearchBox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Clock3, Save, UserRound } from 'lucide-react';

export default function NewAppointmentPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';
  const patientIdFromQuery = searchParams.get('patientId');

  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const durationOptions = [15, 30, 45, 60];

  const appointmentLabels = {
    newAppointment: 'موعد جديد',
    pageDescription: 'إضافة موعد جديد للمريض',
    selectPatient: 'اختيار المريض',
    patientSearch: 'ابحث عن مريض بالاسم أو رقم الهاتف أو الكود',
    details: 'تفاصيل الموعد',
    date: 'تاريخ الموعد',
    time: 'وقت الموعد',
    duration: 'مدة الموعد',
    durationMinutes: 'مدة الموعد بالدقائق',
    endTime: 'وقت الانتهاء',
    status: 'حالة الموعد',
    reason: 'سبب الزيارة',
    notes: 'ملاحظات',
    save: 'حفظ',
    saving: 'جارٍ الحفظ...',
    cancel: 'إلغاء',
    conflictWarning: 'هذا الموعد يتعارض مع موعد آخر. اختر وقتًا أو مدة مختلفة.',
    scheduled: 'محجوز',
    confirmed: 'تأكيد الحضور',
  };

  const { data: patients } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: () => api.get('/patients', { params: { search: patientSearch, limit: 10 } }).then((r) => r.data),
    enabled: patientSearch.length > 1,
  });
  const { data: doctors } = useQuery({
    queryKey: ['doctors-for-appointment'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data),
    enabled: !!user,
    retry: 1,
  });
  const { data: patientFromQuery } = useQuery({
    queryKey: ['appointment-patient', patientIdFromQuery],
    queryFn: () => api.get(`/patients/${patientIdFromQuery}`).then((r) => r.data),
    enabled: !!patientIdFromQuery,
  });
  const { data: allAppointments } = useQuery({
    queryKey: ['appointments-for-conflicts'],
    queryFn: () => api.get('/appointments', { params: { limit: 100 } }).then((r) => r.data),
  });

  useEffect(() => {
    if (patientFromQuery && !selectedPatient) {
      setSelectedPatient(patientFromQuery);
      setPatientSearch(`${patientFromQuery.firstName || ''} ${patientFromQuery.lastName || ''}`.trim());
    }
  }, [patientFromQuery, selectedPatient]);

  const form = useForm({
    defaultValues: {
      appointmentDate: '',
      appointmentTime: '',
      durationMinutes: 30,
      reason: '',
      notes: '',
      status: 'SCHEDULED',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/appointments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('تم حفظ الموعد');
      router.push(`/${locale}/appointments`);
    },
    onError: () => toast.error('حدث خطأ أثناء حفظ الموعد'),
  });

  const appointmentDate = form.watch('appointmentDate');
  const appointmentTime = form.watch('appointmentTime');
  const durationMinutes = form.watch('durationMinutes');
  const doctorId = useMemo(() => {
    const allDoctors = doctors?.data || [];
    const matchedDoctor = allDoctors.find((d: any) => d?.user?.id === user?.id);
    const fallbackDoctor = allDoctors[0];
    return matchedDoctor?.id || fallbackDoctor?.id || null;
  }, [doctors, user?.id]);

  const endTime = useMemo(() => {
    if (!appointmentDate || !appointmentTime || !durationMinutes) return '-';
    const start = new Date(`${appointmentDate}T${appointmentTime}:00`);
    if (Number.isNaN(start.getTime())) return '-';
    const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
    return end.toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  }, [appointmentDate, appointmentTime, durationMinutes, locale]);

  const hasConflict = useMemo(() => {
    if (!appointmentDate || !appointmentTime || !durationMinutes) return false;
    const start = new Date(`${appointmentDate}T${appointmentTime}:00`);
    const end = new Date(start.getTime() + Number(durationMinutes) * 60000);
    const list = allAppointments?.data || [];
    return list.some((a: any) => {
      if (a.status === 'CANCELLED' || a.status === 'COMPLETED') return false;
      const aStart = new Date(a.appointmentDate);
      const aEnd = a.appointmentEndDate ? new Date(a.appointmentEndDate) : new Date(aStart.getTime() + Number(a.durationMinutes || 30) * 60000);
      return start < aEnd && end > aStart;
    });
  }, [appointmentDate, appointmentTime, durationMinutes, allAppointments]);

  const handleSubmit = form.handleSubmit((data) => {
    if (!selectedPatient) {
      toast.error(appointmentLabels.selectPatient);
      return;
    }
    if (!doctorId) {
      toast.error('بيانات الطبيب غير مكتملة');
      return;
    }

    mutation.mutate({
      patientId: selectedPatient.id,
      doctorId,
      appointmentDate: `${data.appointmentDate}T${data.appointmentTime}:00`,
      durationMinutes: data.durationMinutes,
      reason: data.reason,
      notes: data.notes,
      status: data.status,
    });
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="medical-panel p-3 md:p-4 animate-fade-in-down">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft className="w-4 h-4" /></Button>
            <div className="min-w-0">
              <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">{appointmentLabels.newAppointment}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{appointmentLabels.pageDescription}</p>
            </div>
          </div>
          <Button type="submit" form="appointment-form" className="bg-teal-600 hover:bg-teal-700 rounded-lg gap-2" disabled={mutation.isPending || !doctorId}>
            <Save className="w-4 h-4" />
            {mutation.isPending ? appointmentLabels.saving : appointmentLabels.save}
          </Button>
        </div>
      </div>

      <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
        <Card className="medical-panel animate-fade-in-up delay-1">
          <CardHeader><CardTitle className="text-base">{appointmentLabels.selectPatient}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{appointmentLabels.patientSearch}</Label>
              <div className="mt-1.5">
                <SearchBox value={patientSearch} onChange={setPatientSearch} placeholder={appointmentLabels.patientSearch} />
              </div>
            </div>
            {selectedPatient && (
              <div className="rounded-lg border border-teal-200/80 dark:border-teal-900/60 bg-teal-50/70 dark:bg-teal-950/20 p-2.5 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-semibold">
                  {selectedPatient.firstName?.[0]}{selectedPatient.lastName?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="text-xs text-slate-500 truncate">{selectedPatient.phone || '-'}</p>
                </div>
                <UserRound className="w-4 h-4 text-teal-600" />
              </div>
            )}
            {patients?.data?.length > 0 && (
              <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                {patients.data.map((p: any) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedPatient(p); setPatientSearch(`${p.firstName} ${p.lastName}`); }}
                    className={`w-full text-start p-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors duration-150 ${selectedPatient?.id === p.id ? 'bg-teal-50 dark:bg-teal-950/30' : ''}`}
                  >
                    {p.firstName} {p.lastName} - {p.phone}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="medical-panel animate-fade-in-up delay-2">
          <CardHeader><CardTitle className="text-base">{appointmentLabels.details}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{appointmentLabels.date}</Label>
              <Input type="date" {...form.register('appointmentDate')} required className="medical-input" />
            </div>
            <div className="space-y-2">
              <Label>{appointmentLabels.time}</Label>
              <Input
                type="time"
                {...form.register('appointmentTime')}
                required
                dir="ltr"
                lang="en-GB"
                className="medical-input time-input-fix"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{appointmentLabels.durationMinutes}</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {durationOptions.map((d) => (
                  <Button key={d} type="button" variant={Number(durationMinutes) === d ? 'default' : 'outline'} className={`h-8 rounded-lg text-xs ${Number(durationMinutes) === d ? 'bg-teal-600 hover:bg-teal-700' : ''}`} onClick={() => form.setValue('durationMinutes', d)}>
                    {d} دقيقة
                  </Button>
                ))}
              </div>
              <Input type="number" {...form.register('durationMinutes', { valueAsNumber: true })} defaultValue={30} className="medical-input" />
            </div>
            <div className="space-y-2">
              <Label>{appointmentLabels.status}</Label>
              <Select defaultValue="SCHEDULED" onValueChange={(v) => form.setValue('status', String(v ?? 'SCHEDULED'))}>
                <SelectTrigger className="medical-input"><SelectValue placeholder={appointmentLabels.scheduled} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHEDULED">{appointmentLabels.scheduled}</SelectItem>
                  <SelectItem value="CONFIRMED">{appointmentLabels.confirmed}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{appointmentLabels.endTime}</Label>
              <div className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <Clock3 className="w-4 h-4 text-slate-400" />
                <span>{endTime}</span>
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{appointmentLabels.reason}</Label>
              <Input {...form.register('reason')} className="medical-input" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{appointmentLabels.notes}</Label>
              <Textarea {...form.register('notes')} rows={3} className="medical-input" />
            </div>
            {hasConflict && (
              <div className="md:col-span-2 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <span>{appointmentLabels.conflictWarning}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-lg">{appointmentLabels.cancel}</Button>
        </div>
      </form>
    </div>
  );
}
