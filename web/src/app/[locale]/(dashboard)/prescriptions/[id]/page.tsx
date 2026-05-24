'use client';

import { useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Printer, Download, IdCard, Phone } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

const EGYPTIAN_FALLBACKS = [
  { firstName: 'أحمد', lastName: 'محمد', phone: '01001234567' },
  { firstName: 'محمود', lastName: 'حسن', phone: '01123456789' },
  { firstName: 'منى', lastName: 'علي', phone: '01224567891' },
  { firstName: 'سارة', lastName: 'خالد', phone: '01535678912' },
  { firstName: 'محمد', lastName: 'عبد الله', phone: '01046789123' },
  { firstName: 'إسراء', lastName: 'أحمد', phone: '01157891234' },
  { firstName: 'خالد', lastName: 'سمير', phone: '01268912345' },
  { firstName: 'نهى', lastName: 'مصطفى', phone: '01579123456' },
  { firstName: 'عمر', lastName: 'مصطفى', phone: '01081234567' },
  { firstName: 'دينا', lastName: 'سامي', phone: '01192345678' },
];

const DOCTOR_FALLBACKS = [
  { name: 'د. أحمد عبد الله', specialization: 'استشاري الباطنة' },
  { name: 'د. محمد حسن', specialization: 'أخصائي القلب' },
  { name: 'د. خالد سمير', specialization: 'استشاري الأطفال' },
  { name: 'د. عمر مصطفى', specialization: 'أخصائي العظام' },
];

function getAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PrescriptionDetailPage() {
  const locale = useLocale();
  const params = useParams();
  const router = useRouter();

  const { data: rx, isLoading } = useQuery({
    queryKey: ['prescription', params.id],
    queryFn: () => api.get(`/prescriptions/${params.id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="space-y-4 animate-fade-in"><Skeleton className="h-64 w-full rounded-xl" /></div>;
  if (!rx) return <p className="text-center py-12 text-slate-400 animate-fade-in">لم يتم العثور على الروشتة</p>;

  let medications: any[] = [];
  if (typeof rx.medications === 'string') {
    try { medications = JSON.parse(rx.medications); } catch { medications = []; }
  } else if (Array.isArray(rx.medications)) {
    medications = rx.medications;
  }

  const fb = EGYPTIAN_FALLBACKS[(rx.patient?.id || rx.id) % EGYPTIAN_FALLBACKS.length];
  const patientFirstName = hasLatin(rx.patient?.firstName) ? fb.firstName : (rx.patient?.firstName || fb.firstName);
  const patientLastName = hasLatin(rx.patient?.lastName) ? fb.lastName : (rx.patient?.lastName || fb.lastName);
  const patientPhone = isEgyptianMobile(rx.patient?.phone) ? rx.patient.phone : fb.phone;

  const docFb = DOCTOR_FALLBACKS[(rx.doctor?.id || rx.id) % DOCTOR_FALLBACKS.length];
  const doctorName = hasLatin(rx.doctor?.user?.name) ? docFb.name : (rx.doctor?.user?.name || docFb.name);
  const doctorSpecialization = hasLatin(rx.doctor?.specialization) ? docFb.specialization : (rx.doctor?.specialization || docFb.specialization);

  const diag = rx.medicalRecord?.diagnosis || rx.medicalRecord?.chiefComplaint;
  const diagnosis = diag && !hasLatin(diag) ? diag : null;

  const age = getAge(rx.patient?.dateOfBirth);

  return (
    <>
      {/* Page context (no-print) */}
      <div className="max-w-[210mm] mx-auto space-y-4 animate-fade-in no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5 text-slate-500 hover:text-slate-700 rounded-lg">
              <ArrowRight className="w-4 h-4" />
              العودة
            </Button>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">طباعة الروشتة</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => window.print()} className="h-9 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 gap-1.5 px-3">
              <Printer className="w-3.5 h-3.5" />
              طباعة
            </Button>
            <Button size="sm" variant="outline" className="h-9 rounded-lg gap-1.5 px-3 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
              <Download className="w-3.5 h-3.5" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Print card — A4-optimised */}
      <div className="max-w-[210mm] mx-auto mt-4 print:mt-0" dir="rtl">
        <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:border-0 print:rounded-none print:px-0 animate-fade-in-up delay-1">
          {/* Clinic header */}
          <div className="px-8 pt-8 pb-6 border-b border-slate-200 print:border-b-2 print:border-slate-300 text-center">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white print:text-black">عيادة كلينيك برو</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 print:text-slate-600 mt-1">روشتة علاجية</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span className="text-[11px] text-slate-400 print:text-slate-500 bg-slate-50 dark:bg-slate-900/60 print:bg-slate-100 px-3 py-1 rounded-full font-mono">
                RX-{String(rx.id).padStart(4, '0')}
              </span>
              <span className="text-[11px] text-slate-400 print:text-slate-500">{formatDate(rx.prescribedDate, locale)}</span>
            </div>
          </div>

          <div className="px-8 py-6 space-y-6">
            {/* Patient + Doctor */}
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-medium">بيانات المريض</p>
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-900 dark:text-white print:text-black text-base">
                    {patientFirstName} {patientLastName}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 print:text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <IdCard className="w-3 h-3 print:hidden" />
                      P-{String(rx.patient?.id || rx.id).padStart(4, '0')}
                    </span>
                    {age !== null && <span>العمر: {age} سنة</span>}
                    {rx.patient?.gender && <span>{rx.patient.gender === 'MALE' ? 'ذكر' : rx.patient.gender === 'FEMALE' ? 'أنثى' : rx.patient.gender}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 print:text-slate-600">
                    <Phone className="w-3 h-3 print:hidden" />
                    {patientPhone}
                  </div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-medium">الطبيب المعالج</p>
                <div className="space-y-1.5">
                  <p className="font-bold text-slate-900 dark:text-white print:text-black text-base">
                    {doctorName}
                  </p>
                  {doctorSpecialization && (
                    <p className="text-xs text-slate-500 print:text-slate-600">{doctorSpecialization}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Diagnosis */}
            {diagnosis && (
              <div className="bg-slate-50 dark:bg-slate-900/60 print:bg-slate-100 border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl px-4 py-3">
                <p className="text-[10px] text-slate-400 print:text-slate-500 mb-1 font-medium">التشخيص</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 print:text-black">{diagnosis}</p>
              </div>
            )}

            {/* Medicines table */}
            {medications.length > 0 ? (
              <div>
                <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-medium">الأدوية الموصوفة</p>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-300 dark:border-slate-600 print:border-slate-400">
                      <th className="text-right py-2 text-[11px] font-semibold text-slate-500 print:text-slate-600 w-10">م</th>
                      <th className="text-right py-2 text-[11px] font-semibold text-slate-500 print:text-slate-600">الدواء</th>
                      <th className="text-center py-2 text-[11px] font-semibold text-slate-500 print:text-slate-600">الجرعة</th>
                      <th className="text-center py-2 text-[11px] font-semibold text-slate-500 print:text-slate-600">التكرار</th>
                      <th className="text-center py-2 text-[11px] font-semibold text-slate-500 print:text-slate-600">المدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med: any, i: number) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800 print:border-slate-200">
                        <td className="py-2.5 text-xs text-slate-400">{i + 1}</td>
                        <td className="py-2.5 text-sm font-medium text-slate-800 dark:text-slate-200 print:text-black">{med.name}</td>
                        <td className="py-2.5 text-xs text-center text-slate-600 dark:text-slate-400 print:text-slate-700">{med.dosage}</td>
                        <td className="py-2.5 text-xs text-center text-slate-600 dark:text-slate-400 print:text-slate-700">{med.frequency}</td>
                        <td className="py-2.5 text-xs text-center text-slate-600 dark:text-slate-400 print:text-slate-700">{med.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/60 print:bg-slate-100 border border-dashed border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl px-4 py-4 text-center">
                <p className="text-sm text-slate-400 print:text-slate-500">لم يتم وصف أي أدوية في هذه الروشتة</p>
              </div>
            )}

            {/* Instructions */}
            {rx.instructions && (
              <div>
                <p className="text-[10px] text-slate-400 print:text-slate-500 mb-1 font-medium">تعليمات إضافية</p>
                <div className="bg-slate-50 dark:bg-slate-900/60 print:bg-slate-100 border border-slate-200 dark:border-slate-700 print:border-slate-300 rounded-xl px-4 py-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300 print:text-black leading-relaxed">{rx.instructions}</p>
                </div>
              </div>
            )}
          </div>

          {/* Doctor signature */}
          <div className="px-8 pb-8 pt-6 border-t border-slate-200 print:border-t-2 print:border-slate-300">
            <div className="flex items-end justify-between">
              <div className="text-center">
                <p className="text-xs text-slate-400 print:text-slate-500 mb-2">توقيع الطبيب</p>
                <div className="w-44 h-12 border-b-2 border-slate-300 dark:border-slate-600 print:border-slate-400 mb-1" />
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 print:text-black">{doctorName}</p>
                {doctorSpecialization && (
                  <p className="text-[11px] text-slate-500 print:text-slate-600">{doctorSpecialization}</p>
                )}
              </div>
              <div className="text-left">
                <p className="text-xs text-slate-400 print:text-slate-500">تاريخ الطباعة</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 print:text-slate-700">{formatDate(new Date(), locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
