'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, Clock, User, Stethoscope, CheckCircle, XCircle } from 'lucide-react';
import { formatDate, formatTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function AppointmentDetailPage() {
  const t = useTranslations('appointments');
  const tc = useTranslations('common');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const { data: apt, isLoading } = useQuery({
    queryKey: ['appointment', params.id],
    queryFn: () => api.get(`/appointments/${params.id}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ status }: { status: string }) =>
      api.put(`/appointments/${params.id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', params.id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated');
    },
    onError: (e) => console.error(e),
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-48 w-full" /><Skeleton className="h-32 w-full" /></div>;
  if (!apt) return <p className="text-center py-12 text-gray-400 animate-fade-in">{t('notFound')}</p>;

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      COMPLETED: t('completed'), CANCELLED: t('cancelled'), CONFIRMED: t('confirmed'),
      SCHEDULED: t('scheduled'), PENDING: t('waiting'),
    };
    return map[s] || s;
  };

  const statusVariant: Record<string, string> = {
    COMPLETED: 'secondary', CANCELLED: 'destructive', CONFIRMED: 'default',
    SCHEDULED: 'outline', PENDING: 'outline',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" /> {tc('back')}
        </Button>
        <div className="flex gap-2">
          {apt.status === 'SCHEDULED' || apt.status === 'PENDING' ? (
            <>
              <Button size="sm" variant="outline" className="gap-1 transition-all duration-150 hover:border-teal-400"
                onClick={() => updateMutation.mutate({ status: 'CONFIRMED' })}>
                <CheckCircle className="w-4 h-4" /> {t('checkIn')}
              </Button>
              <Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}`}>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1 transition-all duration-150 hover:shadow-lg">
                  <Stethoscope className="w-4 h-4" /> {t('startVisit')}
                </Button>
              </Link>
              <Button size="sm" variant="ghost" className="text-red-500 gap-1 transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => updateMutation.mutate({ status: 'CANCELLED' })}>
                <XCircle className="w-4 h-4" /> {tc('cancel')}
              </Button>
            </>
          ) : apt.status === 'CONFIRMED' ? (
            <>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 gap-1 transition-all duration-150 hover:shadow-lg"
                onClick={() => updateMutation.mutate({ status: 'COMPLETED' })}>
                <CheckCircle className="w-4 h-4" /> {t('completed')}
              </Button>
              <Link href={`/${locale}/visits/new?patientId=${apt.patient?.id}`}>
                <Button size="sm" variant="outline" className="gap-1 transition-all duration-150 hover:border-teal-400">
                  <Stethoscope className="w-4 h-4" /> {t('startVisit')}
                </Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {apt.patient?.firstName?.[0]}{apt.patient?.lastName?.[0]}
            </div>
            <div className="flex-1">
              <Link href={`/${locale}/patients/${apt.patient?.id}`} className="text-lg font-semibold text-gray-900 dark:text-white hover:text-teal-600 transition-colors duration-150">
                {apt.patient?.firstName} {apt.patient?.lastName}
              </Link>
              <p className="text-sm text-gray-500">{apt.patient?.phone}</p>
            </div>
            <Badge variant={(statusVariant[apt.status] || 'outline') as 'default' | 'secondary' | 'destructive' | 'outline'} className="text-sm px-3 py-1">
              {statusLabel(apt.status)}
            </Badge>
          </div>

          <Separator className="mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-500">{t('date')}</p>
                  <p className="text-sm font-medium">{formatDate(apt.appointmentDate, locale)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-500">{t('time')}</p>
                  <p className="text-sm font-medium">{formatTime(apt.appointmentDate, locale)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-teal-600" />
                <div>
                  <p className="text-xs text-gray-500">{tc('duration')}</p>
                  <p className="text-sm font-medium">{apt.durationMinutes} min</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500">{t('reason')}</p>
                <p className="text-sm font-medium">{apt.reason || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{tc('notes')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{apt.notes || '-'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
