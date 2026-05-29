'use client';

import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Printer, Download } from 'lucide-react';
import { PrescriptionTemplate } from '@/components/prescriptions/PrescriptionTemplate';
import { DrugAlternativesModal } from '@/components/prescriptions/DrugAlternativesModal';
import { usePrint } from '@/hooks/usePrint';
import { toast } from 'sonner';

export default function PrescriptionDetailPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { printElement } = usePrint();

  const [altModalOpen, setAltModalOpen] = useState(false);
  const [currentMedIndex, setCurrentMedIndex] = useState<number | null>(null);
  const [currentMedData, setCurrentMedData] = useState<any>(null);

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', params.id],
    queryFn: () => api.get(`/prescriptions/${params.id}`).then((r) => r.data),
  });

  const substituteMutation = useMutation({
    mutationFn: (data: { lineId: number; alternativeId: number; reason: string }) =>
      api.post(`/prescriptions/${params.id}/medicines/${data.lineId}/substitute`, {
        alternativeId: data.alternativeId,
        reason: data.reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescription', params.id] });
      toast.success(isRtl ? 'تم استبدال الدواء بنجاح' : 'Medicine substituted successfully');
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'حدث خطأ أثناء الاستبدال');
    },
  });

  const handleSubstituteClick = (index: number, med: any) => {
    setCurrentMedIndex(index);
    // Try to extract ID if it's a known medicine, otherwise it might just be text
    const medicationId = med.medicationId || rx?.items?.[index]?.medicationId;
    setCurrentMedData({ ...med, medicationId });
    setAltModalOpen(true);
  };

  const handleSubstitute = (newMed: any, reason: string) => {
    if (currentMedIndex !== null && currentMedData?.medicationId) {
      if (!currentMedData.id) {
        toast.error('لا يمكن استبدال هذا الدواء لعدم وجود معرّف العنصر (Line ID).');
        return;
      }
      substituteMutation.mutate({
        lineId: currentMedData.id, // ID of the PrescriptionItem
        alternativeId: newMed.medicineId,
        reason,
      });
    } else {
      toast.error('لا يمكن استبدال هذا الدواء لعدم وجود بيانات طبية كافية.');
    }
  };

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
            <Button size="sm" onClick={() => printElement('prescription-print-area', 'Prescription')} className="h-9 rounded-lg bg-teal-600 text-white hover:bg-teal-700 gap-1.5 px-3">
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
      <div id="prescription-print-area" className="max-w-[210mm] mx-auto mt-4 print-area print:mt-0 bg-white">
        <PrescriptionTemplate prescription={rx} onSubstituteClick={handleSubstituteClick} />
      </div>

      <DrugAlternativesModal
        open={altModalOpen}
        onOpenChange={setAltModalOpen}
        medicationId={currentMedData?.medicationId || null}
        patientId={rx?.patientId || rx?.patient?.id || null}
        currentName={currentMedData?.name || ''}
        onSubstitute={handleSubstitute}
      />
    </>
  );
}
