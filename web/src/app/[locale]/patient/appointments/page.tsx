'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, Clock, Building2, User, ChevronLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function PatientAppointments() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patient-appointments'],
    queryFn: () => api.get('/patient-portal/appointments').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'مواعيدي' : 'My Appointments'}</h1>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : appointments?.length > 0 ? (
        <div className="space-y-3">
          {appointments.map((apt: any) => (
            <Card key={apt.id} className="border-slate-200/60 dark:border-slate-800/60 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-teal-600" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDate(apt.appointmentDate, locale)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(apt.appointmentDate).toLocaleTimeString(locale === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <User className="w-3 h-3" />
                      <span>{apt.doctor?.user?.name} - {apt.doctor?.specialization}</span>
                    </div>
                    {apt.clinic && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Building2 className="w-3 h-3" />
                        <span>{apt.clinic.name}{apt.clinic.address ? ` - ${apt.clinic.address}` : ''}</span>
                      </div>
                    )}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                    apt.status === 'CONFIRMED' ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400' :
                    apt.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                    apt.status === 'CANCELLED' ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'
                  }`}>
                    {apt.status === 'CONFIRMED' ? (isRtl ? 'مؤكد' : 'Confirmed') :
                     apt.status === 'COMPLETED' ? (isRtl ? 'تم الكشف' : 'Completed') :
                     apt.status === 'CANCELLED' ? (isRtl ? 'ملغي' : 'Cancelled') :
                     apt.status === 'PENDING' ? (isRtl ? 'قيد الانتظار' : 'Pending') : apt.status}
                  </span>
                </div>
                {apt.reason && <p className="text-xs text-slate-400 mt-2">{apt.reason}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center text-sm text-slate-400">{isRtl ? 'لا توجد مواعيد مسجلة' : 'No appointments found'}</CardContent>
        </Card>
      )}
    </div>
  );
}
