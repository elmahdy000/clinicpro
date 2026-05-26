'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill, User, CalendarDays, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PatientMedications() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: medications, isLoading } = useQuery({
    queryKey: ['patient-medications'],
    queryFn: () => api.get('/patient-portal/medications').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'أدويتي' : 'My Medications'}</h1>
      </div>
      <p className="text-xs text-slate-400">{isRtl ? 'الأدوية الموصوفة خلال آخر 30 يوماً' : 'Medications prescribed in the last 30 days'}</p>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : medications?.length > 0 ? (
        <div className="space-y-2">
          {medications.map((med: any, i: number) => (
            <Card key={i} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <CardContent className="p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
                  <Pill className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{med.medicationName}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                    {med.dosage && <span>{med.dosage}</span>}
                    {med.frequency && <span>{med.frequency}</span>}
                    {med.duration && <span>{med.duration}</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                    {med.prescribedDate && (
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-2.5 h-2.5" />
                        {formatDate(med.prescribedDate, locale)}
                      </span>
                    )}
                    {med.doctorName && (
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5" />
                        {med.doctorName}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center text-sm text-slate-400">{isRtl ? 'لا توجد أدوية موصوفة حالياً' : 'No current medications'}</CardContent>
        </Card>
      )}
    </div>
  );
}
