'use client';

import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Printer, Download } from 'lucide-react';
import { PrescriptionTemplate } from '@/components/prescriptions/PrescriptionTemplate';

export default function PrescriptionDetailPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const router = useRouter();

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', params.id],
    queryFn: () => api.get(`/prescriptions/${params.id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!rx) return <p className="text-center py-12 text-slate-400 animate-fade-in">لم يتم العثور على الروشتة</p>;

  return (
    <>
      {/* Toolbar (no-print) */}
      <div className="max-w-[210mm] mx-auto space-y-4 animate-fade-in no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-slate-500 hover:text-slate-700 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              {isRtl ? 'العودة' : 'Back'}
            </Button>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isRtl ? 'طباعة الروشتة' : 'Print Prescription'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.print()} className="h-9 rounded-lg bg-teal-600 text-white hover:bg-teal-700 gap-1.5 px-3">
              <Printer className="w-3.5 h-3.5" />
              {isRtl ? 'طباعة' : 'Print'}
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg gap-1.5 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Prescription Template */}
      <div className="max-w-[210mm] mx-auto mt-4 print:mt-0">
        <PrescriptionTemplate prescription={rx} />
      </div>
    </>
  );
}
