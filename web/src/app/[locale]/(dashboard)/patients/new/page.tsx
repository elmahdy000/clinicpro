'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';
import { LocationFields } from '@/components/common/location/LocationFields';

const phoneRegex = /^(?:\+?20|0)?1[0-2,5]\d{8}$/;

const patientSchema = z.object({
  firstName: z.string().min(1, 'الاسم الأول مطلوب'),
  lastName: z.string().min(1, 'اسم العائلة مطلوب'),
  phone: z.string().min(6, 'رقم الهاتف غير صحيح'),
  gender: z.string().min(1, 'النوع مطلوب'),
  dateOfBirth: z.string().optional().refine((val) => {
    if (!val) return true;
    const d = new Date(val);
    if (isNaN(d.getTime())) return false;
    return d <= new Date();
  }, { message: 'تاريخ الميلاد لا يمكن أن يكون في المستقبل' }),
  address: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [continuousMedications, setContinuousMedications] = useState('');

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
      allergies: '',
      medicalHistory: '',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(tc('save'));
      router.push(`/${locale}/patients`);
    },
    onError: (e) => console.error(e),
  });

  const onSubmit = (data: PatientForm) => {
    const historyParts: string[] = [];
    if (chronicDiseases.length > 0) {
      historyParts.push(`الأمراض المزمنة: ${chronicDiseases.join('، ')}`);
    }
    if (surgeries.trim() !== '') {
      historyParts.push(`العمليات السابقة: ${surgeries}`);
    }
    if (familyHistory.trim() !== '') {
      historyParts.push(`التاريخ العائلي: ${familyHistory}`);
    }
    if (continuousMedications.trim() !== '') {
      historyParts.push(`الأدوية المستمرة: ${continuousMedications}`);
    }

    const finalData = {
      ...data,
      governorateId: selectedGovernorate || null,
      cityId: selectedCity || null,
      medicalHistory: historyParts.join(' | ') || data.medicalHistory || '',
    };
    mutation.mutate(finalData);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addNew')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
        const firstError = Object.values(errors)[0];
        toast.error(firstError?.message || 'يرجى التحقق من الحقول المطلوبة');
      })} className="space-y-6">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
          <CardHeader>
            <CardTitle className="text-base">البيانات الأساسية</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">الاسم الأول</Label>
              <Input {...form.register('firstName')} placeholder="الاسم الأول" className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
              {form.formState.errors.firstName && <p className="text-xs text-rose-500">{form.formState.errors.firstName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">اسم العائلة</Label>
              <Input {...form.register('lastName')} placeholder="اسم العائلة" className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
              {form.formState.errors.lastName && <p className="text-xs text-rose-500">{form.formState.errors.lastName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">رقم الهاتف</Label>
              <Input {...form.register('phone')} placeholder="رقم الهاتف" className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
              {form.formState.errors.phone && <p className="text-xs text-rose-500">{form.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">تاريخ الميلاد</Label>
              <Input type="date" {...form.register('dateOfBirth')} className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
              {form.formState.errors.dateOfBirth && <p className="text-xs text-rose-500">{form.formState.errors.dateOfBirth.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">النوع</Label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => form.setValue('gender', 'MALE', { shouldValidate: true })}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                    form.watch('gender') === 'MALE'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  ذكر
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('gender', 'FEMALE', { shouldValidate: true })}
                  className={`flex-1 h-11 rounded-xl border text-sm font-medium transition-all ${
                    form.watch('gender') === 'FEMALE'
                      ? 'border-cyan-500 bg-cyan-50 text-cyan-700 ring-2 ring-cyan-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  أنثى
                </button>
              </div>
              {form.formState.errors.gender && <p className="text-xs text-rose-500">{form.formState.errors.gender.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">الحساسية</Label>
              <Input {...form.register('allergies')} placeholder="الحساسية" className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
            </div>
            <div className="md:col-span-2">
              <LocationFields
                governorateId={selectedGovernorate}
                cityId={selectedCity}
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
              <Input {...form.register('address')} placeholder="اكتب الشارع أو المنطقة أو أقرب علامة مميزة" className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader>
            <CardTitle className="text-base">السجل الطبي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">الأمراض المزمنة (اختر ما ينطبق)</Label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'diabetes', ar: 'السكري' },
                    { id: 'hypertension', ar: 'ضغط الدم المرتفع' },
                    { id: 'cardiac', ar: 'أمراض القلب' },
                    { id: 'asthma', ar: 'الربو / حساسية الصدر' },
                    { id: 'thyroid', ar: 'اضطرابات الغدة الدرقية' },
                    { id: 'liver', ar: 'أمراض الكبد' },
                    { id: 'kidney', ar: 'الفشل الكلوي / أمراض الكلى' },
                  ].map((disease) => {
                    const isChecked = chronicDiseases.includes(disease.ar);
                    return (
                      <button
                        key={disease.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setChronicDiseases(chronicDiseases.filter(d => d !== disease.ar));
                          } else {
                            setChronicDiseases([...chronicDiseases, disease.ar]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
                          isChecked
                            ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {disease.ar}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">العمليات الجراحية السابقة</Label>
                  <Input
                    value={surgeries}
                    onChange={(e) => setSurgeries(e.target.value)}
                    placeholder="مثال: استئصال الزائدة، غضروف"
                    className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">التاريخ العائلي المرضي</Label>
                  <Input
                    value={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.value)}
                    placeholder="مثال: ضغط، سكري وراثي"
                    className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600">الأدوية المستمرة</Label>
                  <Input
                    value={continuousMedications}
                    onChange={(e) => setContinuousMedications(e.target.value)}
                    placeholder="مثال: أسبرين يومياً، كونكور"
                    className="h-11 rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">التاريخ المرضي</Label>
              <Textarea {...form.register('medicalHistory')} rows={3} placeholder="ملاحظات إضافية عن التاريخ المرضي" className="rounded-xl border-slate-200 transition-all duration-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100" />
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
