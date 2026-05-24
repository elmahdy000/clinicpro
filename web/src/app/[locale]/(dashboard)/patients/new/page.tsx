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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

const patientSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(6, 'Invalid phone'),
  gender: z.string().min(1, 'Required'),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: PatientForm) => api.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(tc('save'));
      router.push(`/${locale}/patients`);
    },
    onError: () => toast.error(tc('error')),
  });

  const onSubmit = (data: PatientForm) => mutation.mutate(data);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addNew')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
          <CardHeader>
            <CardTitle className="text-base">{t('basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('firstName')}</Label>
              <Input {...form.register('firstName')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('lastName')}</Label>
              <Input {...form.register('lastName')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input {...form.register('phone')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('gender')}</Label>
              <Select onValueChange={(v) => form.setValue('gender', String(v ?? ''))}>
                <SelectTrigger className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"><SelectValue placeholder={tc('select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">{tc('male')}</SelectItem>
                  <SelectItem value="Female">{tc('female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'الرقم القومي' : 'National ID'}</Label>
              <Input {...form.register('nationalId')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('dateOfBirth')}</Label>
              <Input type="date" {...form.register('dateOfBirth')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{tc('address')}</Label>
              <Input {...form.register('address')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader>
            <CardTitle className="text-base">{t('medicalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bloodGroup')}</Label>
              <Select onValueChange={(v) => form.setValue('bloodGroup', String(v ?? ''))}>
                <SelectTrigger className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"><SelectValue placeholder={tc('select')} /></SelectTrigger>
                <SelectContent>
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('allergies')}</Label>
              <Input {...form.register('allergies')} placeholder={tc('none')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>{t('medicalHistory')}</Label>
              <Textarea {...form.register('medicalHistory')} rows={3} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-3">
          <CardHeader>
            <CardTitle className="text-base">{t('emergencyContact')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{tc('phone')}</Label>
              <Input {...form.register('emergencyContact')} placeholder={tc('phone')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
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
