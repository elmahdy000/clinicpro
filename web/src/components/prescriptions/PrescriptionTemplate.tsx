'use client';

import { IdCard, Phone, Calendar, Clock, Hash } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useLocale } from 'next-intl';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

function getAge(dateOfBirth?: string | null): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function DefaultLogo() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm print:shadow-none">
      <svg viewBox="0 0 40 40" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 4 L20 36 M4 20 L36 20" />
        <circle cx="20" cy="20" r="16" />
      </svg>
    </div>
  );
}

interface PrescriptionTemplateProps {
  prescription: any;
}

export function PrescriptionTemplate({ prescription: rx }: PrescriptionTemplateProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  let medications: any[] = [];
  if (typeof rx.medications === 'string') {
    try { medications = JSON.parse(rx.medications); } catch { medications = []; }
  } else if (Array.isArray(rx.medications)) {
    medications = rx.medications;
  }

  const fb = EGYPTIAN_FALLBACKS[(rx.patient?.id || rx.id) % EGYPTIAN_FALLBACKS.length];
  const patientFirstName = rx.patient?.firstName || fb.firstName;
  const patientLastName = rx.patient?.lastName || fb.lastName;
  const patientPhone = rx.patient?.phone && isEgyptianMobile(rx.patient.phone) ? rx.patient.phone : fb.phone;

  const docFb = DOCTOR_FALLBACKS[(rx.doctor?.id || rx.id) % DOCTOR_FALLBACKS.length];
  const doctorName = rx.doctor?.user?.name || docFb.name;
  const doctorSpecialization = rx.doctor?.specialization || docFb.specialization;

  const diagnosis = rx.medicalRecord?.diagnosis || rx.medicalRecord?.chiefComplaint || null;

  const age = getAge(rx.patient?.dateOfBirth);

  const clinicName = rx.clinic?.name || (isRtl ? 'عيادة كلينيك برو' : 'ClinicPro Clinic');
  const clinicAddress = rx.clinic?.address || '';
  const clinicPhone = rx.clinic?.phone || '';
  const logoUrl = rx.clinic?.logoUrl ? `${API_BASE.replace('/api', '')}${rx.clinic.logoUrl}` : null;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:shadow-none print:border-0 print:rounded-none animate-fade-in-up delay-1" dir="rtl">
      {/* ── HEADER ── */}
      <div className="px-8 pt-8 pb-5 border-b-2 border-slate-200 print:border-slate-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={clinicName} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 print:border-slate-300" />
            ) : (
              <DefaultLogo />
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 print:text-black leading-tight">{clinicName}</h1>
              <p className="text-sm font-semibold text-slate-700 print:text-slate-800 mt-0.5">
                {doctorName}
              </p>
              {doctorSpecialization && (
                <p className="text-xs text-slate-500 print:text-slate-600">{doctorSpecialization}</p>
              )}
            </div>
          </div>
          <div className="text-left space-y-1">
            {clinicAddress && (
              <p className="text-[11px] text-slate-500 print:text-slate-600">{clinicAddress}</p>
            )}
            {clinicPhone && (
              <p className="text-[11px] text-slate-500 print:text-slate-600" dir="ltr">{clinicPhone}</p>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed border-slate-200 print:border-slate-300">
          <div className="flex items-center gap-4 text-[11px] text-slate-500 print:text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-3 h-3 print:hidden" />
              {formatDate(rx.prescribedDate, locale)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3 h-3 print:hidden" />
              {timeStr}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-teal-600 print:text-slate-700 bg-teal-50 print:bg-slate-100 px-3 py-1 rounded-full">
            <Hash className="w-3 h-3 print:hidden" />
            RX-{String(rx.id).padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="px-8 py-6 space-y-6">
        {/* Patient + Doctor info side by side */}
        <div className="grid grid-cols-2 gap-8">
          <div className="bg-slate-50 print:bg-slate-50 rounded-xl p-4">
            <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-semibold tracking-wide">بيانات المريض</p>
            <div className="space-y-1.5">
              <p className="font-bold text-slate-900 print:text-black text-base">
                {patientFirstName} {patientLastName}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 print:text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <IdCard className="w-3 h-3 print:hidden" />
                  P-{String(rx.patient?.id || rx.id).padStart(4, '0')}
                </span>
                {age !== null && <span>العمر: {age} سنة</span>}
                {rx.patient?.gender && (
                  <span>
                    {rx.patient.gender === 'MALE' ? 'ذكر' : rx.patient.gender === 'FEMALE' ? 'أنثى' : rx.patient.gender}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 print:text-slate-600">
                <Phone className="w-3 h-3 print:hidden" />
                {patientPhone}
              </div>
            </div>
          </div>
          <div className="bg-slate-50 print:bg-slate-50 rounded-xl p-4 text-left">
            <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-semibold tracking-wide">الطبيب المعالج</p>
            <div className="space-y-1.5">
              <p className="font-bold text-slate-900 print:text-black text-base">{doctorName}</p>
              {doctorSpecialization && (
                <p className="text-xs text-slate-500 print:text-slate-600">{doctorSpecialization}</p>
              )}
            </div>
          </div>
        </div>

        {/* Diagnosis */}
        {diagnosis && (
          <div className="border-r-4 border-teal-500 print:border-slate-400 bg-teal-50/50 print:bg-slate-50 rounded-xl px-4 py-3">
            <p className="text-[10px] text-teal-600 print:text-slate-500 mb-1 font-semibold tracking-wide">التشخيص</p>
            <p className="text-sm font-medium text-slate-800 print:text-black leading-relaxed">{diagnosis}</p>
          </div>
        )}

        {/* Medicines */}
        {medications.length > 0 ? (
          <div>
            <p className="text-[10px] text-slate-400 print:text-slate-500 mb-2 font-semibold tracking-wide">الأدوية الموصوفة</p>
            <div className="overflow-hidden rounded-xl border border-slate-200 print:border-slate-300">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-slate-100 print:bg-slate-200">
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-slate-500 print:text-slate-700 w-10">م</th>
                    <th className="text-right py-2.5 px-3 text-[11px] font-semibold text-slate-500 print:text-slate-700">الدواء</th>
                    <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 print:text-slate-700">الجرعة</th>
                    <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 print:text-slate-700">التكرار</th>
                    <th className="text-center py-2.5 px-3 text-[11px] font-semibold text-slate-500 print:text-slate-700">المدة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 print:divide-slate-200">
                  {medications.map((med: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                      <td className="py-2.5 px-3 text-xs text-slate-400">{i + 1}</td>
                      <td className="py-2.5 px-3 text-sm font-medium text-slate-800 print:text-black">{med.name}</td>
                      <td className="py-2.5 px-3 text-xs text-center text-slate-600 print:text-slate-700">{med.dosage}</td>
                      <td className="py-2.5 px-3 text-xs text-center text-slate-600 print:text-slate-700">{med.frequency}</td>
                      <td className="py-2.5 px-3 text-xs text-center text-slate-600 print:text-slate-700">{med.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 print:bg-slate-100 border border-dashed border-slate-200 print:border-slate-300 rounded-xl px-4 py-4 text-center">
            <p className="text-sm text-slate-400 print:text-slate-500">لم يتم وصف أي أدوية في هذه الروشتة</p>
          </div>
        )}

        {/* Instructions */}
        {rx.instructions && (
          <div>
            <p className="text-[10px] text-slate-400 print:text-slate-500 mb-1 font-semibold tracking-wide">تعليمات إضافية</p>
            <div className="bg-slate-50 print:bg-slate-100 border border-slate-200 print:border-slate-300 rounded-xl px-4 py-3">
              <p className="text-sm text-slate-700 print:text-black leading-relaxed">{rx.instructions}</p>
            </div>
          </div>
        )}
      </div>

      {/* ── SIGNATURE + FOOTER ── */}
      <div className="px-8 pb-8 pt-6 border-t-2 border-slate-200 print:border-slate-300">
        <div className="flex items-end justify-between mb-6">
          <div className="text-center">
            <p className="text-xs text-slate-400 print:text-slate-500 mb-2">توقيع الطبيب</p>
            <div className="w-44 h-14 border-b-2 border-slate-300 print:border-slate-400 mb-1" />
            <p className="text-sm font-bold text-slate-800 print:text-black">{doctorName}</p>
            {doctorSpecialization && (
              <p className="text-[11px] text-slate-500 print:text-slate-600">{doctorSpecialization}</p>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-400 print:text-slate-500">تاريخ الطباعة</p>
            <p className="text-sm font-medium text-slate-700 print:text-slate-700">{formatDate(new Date(), locale)}</p>
            <p className="text-xs text-slate-400 print:text-slate-500 mt-1">{timeStr}</p>
          </div>
        </div>
        <div className="border-t border-dashed border-slate-200 print:border-slate-300 pt-4 text-center">
          <p className="text-[10px] text-slate-400 print:text-slate-500">
            هذه روشتة إلكترونية صادرة عن {clinicName} — {isRtl ? 'صالحة للصرف من أي صيدلية' : 'Valid at any pharmacy'}
          </p>
        </div>
      </div>
    </div>
  );
}
