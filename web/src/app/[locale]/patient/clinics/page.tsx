'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2, Phone, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Clinic {
  id: number;
  name: string;
  address?: string;
  phone?: string;
}

export default function PatientClinics() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const { data: clinics, isLoading } = useQuery({
    queryKey: ['patient-clinics'],
    queryFn: () => api.get('/patient-portal/clinics').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-650 transition-colors">
          <BackIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'العيادات' : 'Clinics'}</h1>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : clinics?.length > 0 ? (
        <div className="space-y-3">
          {clinics.map((clinic: Clinic) => (
            <Card key={clinic.id} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm dark:bg-slate-950">
              <CardContent className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">{clinic.name}</h3>
                  </div>
                </div>
                {clinic.address && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {clinic.address}
                  </div>
                )}
                {clinic.phone && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {clinic.phone}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-8 text-center text-sm text-slate-450">{isRtl ? 'غير مسجل في أي عيادة' : 'Not registered at any clinic'}</CardContent>
        </Card>
      )}
    </div>
  );
}
