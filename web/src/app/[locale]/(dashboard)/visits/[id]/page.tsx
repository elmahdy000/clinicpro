'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Activity, Pill, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function VisitDetailPage() {
  const t = useTranslations('visits');
  const tc = useTranslations('common');
  const tp = useTranslations('prescriptions');
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();
  const isRtl = locale === 'ar';

  const { data: record, isLoading } = useQuery({
    queryKey: ['medical-record', params.id],
    queryFn: () => api.get(`/medical-records/${params.id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (!record) return <p className="text-center py-12 text-gray-400 animate-fade-in">{t('notFound')}</p>;

  let vitalSigns: Record<string, string> = {};
  if (record.vitalSigns) {
    try { vitalSigns = typeof record.vitalSigns === 'string' ? JSON.parse(record.vitalSigns) : record.vitalSigns; } catch {}
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" /> {tc('back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1 transition-all duration-150 hover:border-teal-400">
            <FileText className="w-4 h-4" /> {tc('print')}
          </Button>
          <Link href={`/${locale}/patients/${record.patientId}`}>
            <Button variant="outline" size="sm" className="gap-1 transition-all duration-150 hover:border-teal-400">
              <User className="w-4 h-4" /> {tc('view')}
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {record.patient?.firstName?.[0]}{record.patient?.lastName?.[0]}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {record.patient?.firstName} {record.patient?.lastName}
              </p>
              <p className="text-sm text-gray-500">{formatDate(record.createdAt, locale)}</p>
            </div>
          </div>

          <Separator className="mb-6" />

          {Object.keys(vitalSigns).length > 0 && (
            <>
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" /> {t('vitalSigns')}
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(vitalSigns).map(([key, value], i) => (
                    <div key={key} className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <p className="text-xs text-gray-500">{key}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Separator className="mb-6" />
            </>
          )}

          <div className="space-y-6">
            {record.chiefComplaint && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('chiefComplaint')}</p>
                <p className="text-sm text-gray-900 dark:text-white">{record.chiefComplaint}</p>
              </div>
            )}
            {record.diagnosis && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('diagnosis')}</p>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900/50">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{record.diagnosis}</p>
                </div>
              </div>
            )}
            {record.treatmentPlan && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('treatmentPlan')}</p>
                <p className="text-sm text-gray-900 dark:text-white">{record.treatmentPlan}</p>
              </div>
            )}
            {record.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-1">{t('doctorNotes')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 italic">{record.notes}</p>
              </div>
            )}
          </div>

          {record.prescription && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" /> {tp('title')}
                </h3>
                <Link href={`/${locale}/prescriptions/${record.prescription.id}`}
                  className="block p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-all duration-150">
                  <p className="text-sm font-medium">{formatDate(record.prescription.prescribedDate, locale)}</p>
                  <p className="text-xs text-gray-500">
                    {(() => { try { const m = typeof record.prescription.medications === 'string' ? JSON.parse(record.prescription.medications) : record.prescription.medications; return Array.isArray(m) ? `${m.length} ${tp('medicines')}` : `1 ${tp('medicines')}`; } catch { return `1 ${tp('medicines')}`; } })()}
                  </p>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
