'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Stethoscope, User, CalendarDays, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PatientMedicalRecords() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: records, isLoading } = useQuery({
    queryKey: ['patient-medical-records'],
    queryFn: () => api.get('/patient-portal/medical-records').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'الكشف الطبي' : 'Medical Records'}</h1>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : records?.length > 0 ? (
        <div className="space-y-3">
          {records.map((rec: any) => (
            <Card key={rec.id} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(rec.createdAt, locale)}</span>
                  </div>
                  <span className="text-xs text-slate-400">{rec.clinic?.name}</span>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <User className="w-3 h-3" /> {rec.doctor?.user?.name} - {rec.doctor?.specialization}
                </div>
                {rec.chiefComplaint && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-0.5">{isRtl ? 'الشكوى الرئيسية' : 'Chief Complaint'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.chiefComplaint}</p>
                  </div>
                )}
                {rec.diagnosis && (
                  <div className="bg-teal-50 dark:bg-teal-950/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-teal-600 dark:text-teal-400 font-semibold mb-0.5">{isRtl ? 'التشخيص' : 'Diagnosis'}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{rec.diagnosis}</p>
                  </div>
                )}
                {rec.treatmentPlan && (
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-xs font-semibold text-slate-500">{isRtl ? 'العلاج: ' : 'Treatment: '}</span>
                    {rec.treatmentPlan}
                  </div>
                )}
                {rec.notes && (
                  <div className="text-sm text-slate-500 italic">
                    "{rec.notes}"
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center text-sm text-slate-400">{isRtl ? 'لا توجد سجلات طبية بعد' : 'No medical records yet'}</CardContent>
        </Card>
      )}
    </div>
  );
}
