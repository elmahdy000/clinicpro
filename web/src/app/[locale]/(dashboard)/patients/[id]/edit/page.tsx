'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { ArrowLeft, Save, Lock } from 'lucide-react';
import { LocationFields } from '@/components/common/location/LocationFields';

export default function EditPatientPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', params.id],
    queryFn: () => api.get(`/patients/${params.id}`).then((r) => r.data),
  });

  const form = useForm({
    defaultValues: {
      firstName: '', lastName: '', phone: '', gender: '', dateOfBirth: '',
      address: '', allergies: '', medicalHistory: '',
    },
  });

  useEffect(() => {
    if (patient) {
      form.reset({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        phone: patient.phone || '',
        gender: patient.gender || '',
        dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
        address: patient.address || '',
        allergies: patient.allergies || '',
        medicalHistory: patient.medicalHistory || '',
      });
      if (patient.governorateId) {
        setSelectedGovernorate(patient.governorateId);
      }
      if (patient.cityId) {
        setSelectedCity(patient.cityId);
      }
    }
  }, [patient, form]);

  const mutation = useMutation({
    mutationFn: (data: any) => api.put(`/patients/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient', params.id] });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(tc('save'));
      router.push(`/${locale}/patients/${params.id}`);
    },
    onError: (e) => console.error(e),
  });

  const onSubmit = form.handleSubmit((data) => {
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (dob > new Date()) {
        toast.error('تاريخ الميلاد لا يمكن أن يكون في المستقبل');
        return;
      }
    }

    const finalData = {
      ...data,
      governorateId: selectedGovernorate || null,
      cityId: selectedCity || null,
    };
    mutation.mutate(finalData);
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-64 w-full" /></div>;
  if (!patient) return <p className="text-center py-12 text-gray-400 animate-fade-in">{t('notFound')}</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-4 h-4" /></Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('editPatient')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      {patient.isImported && (
        <div className="bg-indigo-50/80 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/50 rounded-2xl p-4 flex gap-3 items-start animate-slide-up shadow-sm">
          <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
              سجل طبي مستورد (EMR) - للقراءة فقط
            </h4>
            <p className="text-xs text-indigo-700/90 dark:text-indigo-300/80 leading-relaxed">
              تم استيراد بيانات هذا المريض من السجل الطبي المشترك للشبكة. البيانات الأساسية للهوية (الاسم، الهاتف، تاريخ الميلاد، النوع، العنوان) مقفلة وغير قابلة للتعديل لضمان سلامة الهوية الرقمية الموحدة. يمكنك إضافة وتعديل السجل المرضي والحساسية بحرية.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
          <CardHeader><CardTitle className="text-base">البيانات الأساسية</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">الاسم الأول</Label>
              <Input
                {...form.register('firstName')}
                readOnly={patient.isImported}
                className={`h-11 rounded-xl border-slate-200 transition-all duration-200 ${
                  patient.isImported
                    ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed select-all border-slate-200/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200/60'
                    : 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">اسم العائلة</Label>
              <Input
                {...form.register('lastName')}
                readOnly={patient.isImported}
                className={`h-11 rounded-xl border-slate-200 transition-all duration-200 ${
                  patient.isImported
                    ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed select-all border-slate-200/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200/60'
                    : 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">رقم الهاتف</Label>
              <Input
                {...form.register('phone')}
                readOnly={patient.isImported}
                className={`h-11 rounded-xl border-slate-200 transition-all duration-200 ${
                  patient.isImported
                    ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed select-all border-slate-200/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200/60'
                    : 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">تاريخ الميلاد</Label>
              <Input
                type="date"
                {...form.register('dateOfBirth')}
                readOnly={patient.isImported}
                className={`h-11 rounded-xl border-slate-200 transition-all duration-200 ${
                  patient.isImported
                    ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed border-slate-200/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200/60'
                    : 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                }`}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">النوع</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={patient.isImported}
                  onClick={() => form.setValue('gender', 'MALE')}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                    form.watch('gender') === 'MALE'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  } ${patient.isImported ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  disabled={patient.isImported}
                  onClick={() => form.setValue('gender', 'FEMALE')}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                    form.watch('gender') === 'FEMALE'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  } ${patient.isImported ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  أنثى
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">الحساسية</Label>
              <Input {...form.register('allergies')} className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
            </div>
            <div className="md:col-span-2">
              <LocationFields
                governorateId={selectedGovernorate}
                cityId={selectedCity}
                disabled={patient.isImported}
                onGovernorateChange={(govId) => {
                  setSelectedGovernorate(govId || '');
                  setSelectedCity('');
                }}
                onCityChange={(cityId) => {
                  setSelectedCity(cityId || '');
                }}
                showLabels={true}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">العنوان التفصيلي</Label>
              <Input
                {...form.register('address')}
                readOnly={patient.isImported}
                placeholder={patient.isImported ? '' : "اكتب الشارع أو المنطقة أو أقرب علامة مميزة"}
                className={`h-11 rounded-xl border-slate-200 transition-all duration-200 ${
                  patient.isImported
                    ? 'bg-slate-50/80 text-slate-500 cursor-not-allowed select-all border-slate-200/60 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-slate-200/60'
                    : 'focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100'
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader><CardTitle className="text-base">السجل الطبي</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold text-slate-600">التاريخ المرضي</Label>
              <Textarea {...form.register('medicalHistory')} rows={3} className="rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end animate-fade-in-up delay-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="transition-all duration-150">{tc('cancel')}</Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 gap-2 transition-all duration-150 hover:shadow-lg hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30" disabled={mutation.isPending}>
            <Save className="w-4 h-4" />
            {mutation.isPending ? tc('saving') : tc('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
