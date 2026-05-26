'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, User, CalendarDays, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PatientPrescriptions() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient-prescriptions'],
    queryFn: () => api.get('/patient-portal/prescriptions').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'الروشتات' : 'Prescriptions'}</h1>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : prescriptions?.length > 0 ? (
        <div className="space-y-3">
          {prescriptions.map((rx: any) => (
            <Card key={rx.id} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{isRtl ? 'روشتة' : 'Rx'} #{rx.id}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <CalendarDays className="w-3 h-3" />
                      {formatDate(rx.prescribedDate, locale)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      {rx.doctor?.user?.name} - {rx.clinic?.name}
                    </div>
                  </div>
                </div>
                {rx.medicalRecord?.diagnosis && (
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500 mb-0.5">{isRtl ? 'التشخيص' : 'Diagnosis'}</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{rx.medicalRecord.diagnosis}</p>
                  </div>
                )}
                {Array.isArray(rx.medications) && rx.medications.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">{isRtl ? 'الأدوية' : 'Medications'}</p>
                    <div className="space-y-1">
                      {rx.medications.slice(0, 5).map((med: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{med.name}</span>
                          <span className="text-xs text-slate-400">{med.dosage} - {med.frequency}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rx.items?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5">{isRtl ? 'الأدوية (مسجلة)' : 'Medications (structured)'}</p>
                    <div className="space-y-1">
                      {rx.items.map((item: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-sm bg-white dark:bg-slate-900 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{item.medication?.name}</span>
                          <span className="text-xs text-slate-400">{item.dosage} - {item.frequency} - {item.duration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rx.instructions && (
                  <div className="text-xs text-slate-500 bg-amber-50 dark:bg-amber-950/20 rounded-lg px-3 py-2">
                    <span className="font-semibold">{isRtl ? 'تعليمات: ' : 'Instructions: '}</span>
                    {rx.instructions}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center text-sm text-slate-400">{isRtl ? 'لا توجد روشتات بعد' : 'No prescriptions yet'}</CardContent>
        </Card>
      )}
    </div>
  );
}
