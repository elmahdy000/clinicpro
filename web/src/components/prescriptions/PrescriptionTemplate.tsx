'use client';

import Image from 'next/image';
import { useLocale } from 'next-intl';
import { formatDate, cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';


const toArabicNumber = (num: number | string | null | undefined) => {
  if (num === null || num === undefined) return '';
  return new Intl.NumberFormat('ar-EG').format(Number(num));
};

const parseParenthesis = (text: string) => {
  if (!text) return { main: '', subs: [] };
  const rx = /\(([^)]+)\)/g;
  const subs: string[] = [];
  let match;
  while ((match = rx.exec(text)) !== null) {
    if (match[1]) {
      subs.push(match[1].trim());
    }
  }
  const main = text.replace(/\(([^)]+)\)/g, '').replace(/\s+/g, ' ').trim();
  return { main, subs };
};

const renderCellContent = (text: string, isMainName: boolean = false) => {
  const { main, subs } = parseParenthesis(text);
  if (subs.length === 0) return <span>{text}</span>;
  
  return (
    <div className="space-y-0.5">
      <span className={cn(
        "block",
        isMainName ? "text-slate-800 dark:text-slate-200 font-bold text-sm" : "text-slate-700 dark:text-slate-300 font-semibold text-xs"
      )}>
        {main}
      </span>
      {subs.map((sub, idx) => (
        <span 
          key={idx} 
          className="block text-[10.5px] text-slate-400 dark:text-slate-500 font-normal leading-normal"
        >
          ({sub})
        </span>
      ))}
    </div>
  );
};

function MedicalLogo() {
  return (
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#007A78] to-[#009C99] flex flex-col items-center justify-center shadow-sm print:shadow-none shrink-0 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent pointer-events-none" />
      <svg viewBox="0 0 24 24" className="w-9 h-9 text-white relative z-10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 8v8M9 12h6" />
      </svg>
    </div>
  );
}

function ClinicStamp({ name, isRtl }: { name: string; isRtl: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center shrink-0 select-none transform -rotate-6 print:-rotate-6 mt-3 transition-transform duration-300 hover:rotate-0">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-[#007A78]/60 flex items-center justify-center p-0.5 bg-teal-50/5 relative shadow-sm shadow-teal-700/5 print:shadow-none">
        <div className="w-full h-full rounded-full border-2 border-double border-[#007A78] flex flex-col items-center justify-center text-center p-1.5 bg-white relative">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#007A78] mb-0.5 opacity-90" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M12 8v8M9 12h6" />
          </svg>
          <span className="text-[7.5px] font-extrabold text-[#007A78] leading-normal tracking-tight max-w-[70px] truncate">{name}</span>
          <span className="text-[5.5px] font-bold text-[#007A78]/70 mt-0.5 tracking-wider scale-95">{isRtl ? 'مُعـتَمَد' : 'APPROVED'}</span>
        </div>
      </div>
    </div>
  );
}

interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  notes?: string;
}

interface PrescriptionItem {
  medication?: { name: string };
  name?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionData {
  id: number;
  patient?: {
    id: number;
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    gender?: string;
  };
  doctor?: {
    id: number;
    user?: { name?: string };
    specialization?: string;
  };
  clinic?: {
    id: number;
    name?: string;
    address?: string;
    phone?: string;
    logoUrl?: string;
  };
  medications?: string | PrescriptionMedication[];
  items?: PrescriptionItem[];
  prescribedDate?: string;
  medicalRecord?: {
    diagnosis?: string;
    chiefComplaint?: string;
  };
  instructions?: string;
  branchId?: string;
  branchName?: string;
}

interface PrescriptionTemplateProps {
  prescription: PrescriptionData;
  onSubstituteClick?: (index: number, med: any) => void;
}

export function PrescriptionTemplate({ prescription: rx, onSubstituteClick }: PrescriptionTemplateProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  let medications: any[] = [];
  if (Array.isArray(rx.items) && rx.items.length > 0) {
    medications = rx.items.map((item: any) => ({
      ...item,
      id: item.id,
      medicationId: item.medicationId,
      name: item.medication?.name || item.name || '',
      dosage: item.dosage || '',
      frequency: item.frequency || '',
      duration: item.duration || '',
      instructions: item.instructions || '',
    }));
  } else if (typeof rx.medications === 'string') {
    try {
      const parsed = JSON.parse(rx.medications);
      medications = parsed.map((med: PrescriptionMedication) => ({
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.instructions || med.notes || '',
      }));
    } catch {
      medications = [];
    }
  } else if (Array.isArray(rx.medications) && rx.medications.length > 0) {
    medications = rx.medications.map((med: PrescriptionMedication) => ({
      name: med.name || '',
      dosage: med.dosage || '',
      frequency: med.frequency || '',
      duration: med.duration || '',
      instructions: med.instructions || med.notes || '',
    }));
  }

  const patientFirstName = rx.patient?.firstName || 'مريض';
  const patientLastName = rx.patient?.lastName || '';
  const patientFullName = `${patientFirstName} ${patientLastName}`.trim();
  
  const doctorName = rx.doctor?.user?.name || 'طبيب';
  const doctorSpecialization = rx.doctor?.specialization || '';

  const diagnosis = rx.medicalRecord?.diagnosis || rx.medicalRecord?.chiefComplaint || null;

  // Age calculations
  let age = null;
  if (rx.patient?.dateOfBirth) {
    const birth = new Date(rx.patient.dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  } else {
    age = null;
  }

  const isMale = rx.patient?.gender === 'MALE' || rx.patient?.gender === 'Male' || !rx.patient?.gender;

  const clinicName = rx.clinic?.name || '';
  let fullAddress = rx.clinic?.address || '';
  let clinicPhone = rx.clinic?.phone || '';
  const logoUrl = rx.clinic?.logoUrl ? `${API_BASE.replace('/api', '')}${rx.clinic.logoUrl}` : null;

  // Split address to Branch and Street
  let branchName = rx.branchName || (isRtl ? 'الفرع الرئيسي' : 'Main Branch');
  let addressLine = fullAddress;

  if (!rx.branchName && (fullAddress.includes('،') || fullAddress.includes(','))) {
    const parts = fullAddress.split(/[،,]/);
    branchName = parts[0]?.trim();
    addressLine = parts.slice(1).join('، ')?.trim();
  } else if (!rx.branchName && fullAddress.includes('-')) {
    const parts = fullAddress.split('-');
    branchName = parts[0]?.trim();
    addressLine = parts.slice(1).join('-')?.trim();
  }

  // Formatting prescribed time & date from the record
  const prescribedDateObj = rx.prescribedDate ? new Date(rx.prescribedDate) : new Date();
  const timeStr = prescribedDateObj.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const instructionsList = rx.instructions
    ? rx.instructions.split('\n').filter((line: string) => line.trim().length > 0)
    : isRtl
      ? [
          'الراحة التامة والالتزام بالجرعات المحددة في مواعيدها.',
          'شرب كميات كافية من السوائل الدافئة والماء.',
          'العودة للاستشارة الطبية في حال عدم تحسن الأعراض خلال ٣ أيام.',
        ]
      : [
          'Complete rest and strict adherence to the prescribed dosages.',
          'Drink sufficient amounts of warm fluids and water.',
          'Follow up with the clinic if symptoms do not improve within 3 days.',
        ];

  return (
    <div 
      className="prescription-print-container bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl print:shadow-none print:border-0 print:rounded-none animate-fade-in-up p-8 md:p-10 select-text relative max-w-[210mm] mx-auto overflow-hidden" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      
      {/* Calligraphy Font & Printing CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&family=Aref+Ruqaa:wght@700&display=swap');

        .signature-font {
          font-family: 'Aref Ruqaa', 'Alex Brush', cursive, serif !important;
        }

        @media print {
          /* Hide NestJS dashboard sidebars, headers, and standard layout wrappers */
          aside, 
          header, 
          .no-print,
          [role="navigation"], 
          nav {
            display: none !important;
          }

          /* Force body and html to take full white canvas without margins or scroll bars */
          html, body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Blow up main container and override dashboard spacing constraints */
          main, 
          .mx-auto,
          [class*="SidebarSync"], 
          [class*="DashboardLayout"] {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            min-width: 100% !important;
          }

          /* Make prescription template take full page width and hide borders/shadows */
          .prescription-print-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* Enable colors and background-colors print styling */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-shadow: none !important;
          }

          @page {
            size: A4;
            margin: 10mm 12mm 10mm 12mm;
          }

          .print-border-teal {
            border-color: #007A78 !important;
          }
          .print-bg-teal {
            background-color: #007A78 !important;
          }
        }
      `}} />

      {/* ── HEADER SECTION ── */}
      <div className="grid grid-cols-12 gap-4 pb-6 border-b border-[#007A78]/30 print-border-teal">
        
        {/* Left Header Column (Clinic & Date Details) */}
        <div className={cn(
          "col-span-7 space-y-2",
          isRtl ? "border-l border-slate-100 pl-4" : "border-r border-slate-100 pr-4"
        )}>
          
          {/* Clinic Branch */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'فرع العيادة:' : 'Clinic Branch:'}
              </span>{' '}
              {branchName}
            </div>
          </div>

          {/* Clinic Address */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'العنوان:' : 'Address:'}
              </span>{' '}
              {addressLine}
            </div>
          </div>

          {/* Clinic Phone */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'الهاتف:' : 'Phone:'}
              </span>{' '}
              {clinicPhone}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'التاريخ:' : 'Date:'}
              </span>{' '}
              {formatDate(rx.prescribedDate || prescribedDateObj, locale)}
            </div>
          </div>

          {/* Time */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'الوقت:' : 'Time:'}
              </span>{' '}
              {timeStr}
            </div>
          </div>

          {/* Prescription Number */}
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">
                {isRtl ? 'رقم الروشتة:' : 'Prescription No:'}
              </span>{' '}
              <span className="font-mono text-teal-700 font-bold">RX-{prescribedDateObj.getFullYear()}-{String(rx.id).padStart(3, '0')}</span>
            </div>
          </div>

        </div>

        {/* Right Header Column (Clinic Logo & Names) */}
        <div className="col-span-5 flex flex-col items-center text-center justify-center">
          {logoUrl ? (
            <Image src={logoUrl} alt={clinicName} width={64} height={64} className="w-16 h-16 rounded-2xl object-cover border border-slate-100 print:border-slate-300" />
          ) : (
            <MedicalLogo />
          )}
          
          <h2 className="text-2xl font-bold text-[#007A78] mt-2.5 leading-tight">{clinicName}</h2>
          <h3 className="text-lg font-bold text-slate-800 mt-1">{doctorName}</h3>
          {doctorSpecialization && (
            <p className="text-xs font-semibold text-[#009C99] mt-0.5">{doctorSpecialization}</p>
          )}

          {!logoUrl && (
            <p className="text-[8px] text-slate-400 print:text-slate-500 mt-2 leading-normal max-w-[180px]">
              {isRtl 
                ? 'إذا لم يتوفر شعار العيادة يتم استخدام ClinicPro' 
                : 'If no clinic logo is provided, ClinicPro is used'}
            </p>
          )}
        </div>

      </div>

      {/* ── PATIENT BOX ── */}
      <div className="mt-6 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 grid grid-cols-4 gap-2 text-center text-xs relative overflow-hidden">
        
        {/* Patient Name */}
        <div className={cn(
          "flex flex-col items-center justify-center last:border-0 px-2",
          isRtl ? "border-l border-slate-200" : "border-r border-slate-200"
        )}>
          <div className="flex items-center gap-1 text-slate-400 mb-1 font-semibold">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>
              {isRtl ? 'اسم المريض:' : 'Patient Name:'}
            </span>
          </div>
          <span className="font-bold text-sm text-slate-800 leading-tight">{patientFullName}</span>
        </div>

        {/* Patient Code */}
        <div className={cn(
          "flex flex-col items-center justify-center last:border-0 px-2",
          isRtl ? "border-l border-slate-200" : "border-r border-slate-200"
        )}>
          <div className="flex items-center gap-1 text-slate-400 mb-1 font-semibold">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
              <line x1="7" y1="8" x2="17" y2="8" />
              <line x1="7" y1="12" x2="17" y2="12" />
              <line x1="7" y1="16" x2="13" y2="16" />
            </svg>
            <span>
              {isRtl ? 'كود المريض:' : 'Patient Code:'}
            </span>
          </div>
          <span className="font-bold text-sm text-slate-800 leading-tight">P-{String(rx.patient?.id || rx.id).padStart(4, '0')}</span>
        </div>

        {/* Patient Age */}
        <div className={cn(
          "flex flex-col items-center justify-center last:border-0 px-2",
          isRtl ? "border-l border-slate-200" : "border-r border-slate-200"
        )}>
          <div className="flex items-center gap-1 text-slate-400 mb-1 font-semibold">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>
              {isRtl ? 'العمر:' : 'Age:'}
            </span>
          </div>
          <span className="font-bold text-sm text-slate-800 leading-tight">
            {age !== null 
              ? (isRtl ? `${toArabicNumber(age)} سنة` : `${age} Years`) 
              : (isRtl ? 'غير محدد' : 'Not Specified')}
          </span>
        </div>

        {/* Patient Gender */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="flex items-center gap-1 text-slate-400 mb-1 font-semibold">
            {isMale ? (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="14" r="5" />
                <path d="M19 5L14 10M14 5h5v5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="9" r="5" />
                <path d="M12 14v7M9 18h6" />
              </svg>
            )}
            <span>
              {isRtl ? 'النوع:' : 'Gender:'}
            </span>
          </div>
          <span className="font-bold text-sm text-slate-800 leading-tight">
            {isMale 
              ? (isRtl ? 'ذكر' : 'Male') 
              : (isRtl ? 'أنثى' : 'Female')}
          </span>
        </div>

      </div>

      {/* ── DIAGNOSIS SECTION ── */}
      {diagnosis && (
        <div className="mt-5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center shrink-0 mt-0.5 print:bg-slate-50">
            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <circle cx="12" cy="11" r="3" />
            </svg>
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {isRtl ? 'التشخيص' : 'Diagnosis'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {diagnosis}
            </p>
          </div>
        </div>
      )}

      {/* ── THE PRESCRIPTION TITLE ── */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-[#007A78]/35" />
        </div>
        <div className="relative px-6 bg-white dark:bg-slate-950 text-base font-extrabold text-[#007A78] tracking-widest scale-105 select-none">
          {isRtl ? '• الروشتة •' : '• Prescription •'}
        </div>
      </div>

      {/* ── MEDICINES TABLE ── */}
      {medications.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 shadow-sm print:shadow-none">
          <table className="w-full border-collapse text-center">
            <thead>
              <tr className="bg-[#007A78] print-bg-teal text-white">
                <th className={cn("py-3 px-3 text-xs font-bold w-12", isRtl ? "border-l border-[#007a78]/10" : "border-r border-[#007a78]/10")}>
                  {isRtl ? 'م' : 'No.'}
                </th>
                <th className={cn("py-3 px-4 text-xs font-bold", isRtl ? "text-right border-l border-[#007a78]/10" : "text-left border-r border-[#007a78]/10")}>
                  {isRtl ? 'اسم الدواء' : 'Medication'}
                </th>
                <th className={cn("py-3 px-3 text-xs font-bold", isRtl ? "border-l border-[#007a78]/10" : "border-r border-[#007a78]/10")}>
                  {isRtl ? 'الجرعة' : 'Dosage'}
                </th>
                <th className={cn("py-3 px-3 text-xs font-bold", isRtl ? "border-l border-[#007a78]/10" : "border-r border-[#007a78]/10")}>
                  {isRtl ? 'التكرار' : 'Frequency'}
                </th>
                <th className={cn("py-3 px-3 text-xs font-bold", isRtl ? "border-l border-[#007a78]/10" : "border-r border-[#007a78]/10")}>
                  {isRtl ? 'المدة' : 'Duration'}
                </th>
                <th className="py-3 px-4 text-xs font-bold">
                  {isRtl ? 'ملاحظات' : 'Instructions / Notes'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {medications.map((med: PrescriptionMedication, i: number) => (
                <tr key={i} className="hover:bg-slate-50/50 print:hover:bg-transparent transition-colors">
                  <td className={cn("py-3 px-3 text-xs text-slate-400 font-semibold", isRtl ? "border-l border-slate-200" : "border-r border-slate-200")}>
                    {isRtl ? toArabicNumber(i + 1) : i + 1}
                  </td>
                  <td dir="auto" className={cn("py-3 px-4 text-sm border-l border-slate-200", isRtl ? "text-right" : "text-left")}>
                    {renderCellContent(med.name, true)}
                  </td>
                  <td dir="auto" className={cn("py-3 px-3 text-xs", isRtl ? "border-l border-slate-200" : "border-r border-slate-200")}>
                    {renderCellContent(med.dosage)}
                  </td>
                  <td dir="auto" className={cn("py-3 px-3 text-xs", isRtl ? "border-l border-slate-200" : "border-r border-slate-200")}>
                    {renderCellContent(med.frequency)}
                  </td>
                  <td dir="auto" className={cn("py-3 px-3 text-xs", isRtl ? "border-l border-slate-200" : "border-r border-slate-200")}>
                    {renderCellContent(med.duration)}
                  </td>
                  <td dir="auto" className={cn("py-3 px-4 text-xs text-slate-500 print:text-black leading-relaxed max-w-[180px] break-words whitespace-pre-wrap relative group", isRtl ? "text-right" : "text-left")}>
                    {med.instructions || '—'}
                    {onSubstituteClick && (
                      <button
                        type="button"
                        onClick={() => onSubstituteClick(i, med)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 no-print text-[10px] bg-teal-50 text-teal-600 hover:bg-teal-100 px-2 py-1 rounded transition-opacity"
                      >
                        {isRtl ? 'استبدال' : 'Substitute'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-slate-50 print:bg-slate-100 border border-dashed border-slate-200 print:border-slate-300 rounded-2xl px-4 py-6 text-center">
          <p className="text-sm text-slate-400 print:text-slate-500 font-semibold">
            {isRtl 
              ? 'لم يتم وصف أي أدوية في هذه الروشتة' 
              : 'No medications prescribed in this prescription'}
          </p>
        </div>
      )}

      {/* ── INSTRUCTIONS & SIGNATURE GRID ── */}
      <div className="mt-8 grid grid-cols-12 gap-6 items-end">
        
        {/* Left Side (Instructions Bullets) */}
        <div className="col-span-7 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-teal-50 flex items-center justify-center shrink-0 print:bg-slate-50">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#007A78]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {isRtl ? 'تعليمات' : 'Instructions / Care Plan'}
            </h4>
          </div>
          <ul className={cn("space-y-1.5", isRtl ? "pl-0 pr-2" : "pr-0 pl-2")}>
            {instructionsList.map((inst: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-600 leading-relaxed font-semibold flex items-start gap-1.5">
                <span className="text-[#007A78] text-sm shrink-0 mt-0.5">•</span>
                <span>{inst}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Side (Signature & Stamp Combined) */}
        <div className="col-span-5 flex flex-col items-center justify-center space-y-3 shrink-0">
          
          {/* Doctor Signature */}
          <div className="flex flex-col items-center justify-center shrink-0 w-full max-w-[180px]">
            <p className="text-[10px] text-slate-400 mb-1 font-semibold">
              {isRtl ? 'توقيع الطبيب' : "Doctor's Signature"}
            </p>
            <div className="relative flex flex-col items-center select-none w-full">
              <div className={cn("text-teal-700 my-1 font-bold relative z-10 leading-none truncate w-full text-center", doctorName.includes('@') ? 'text-lg tracking-normal scale-100' : 'signature-font text-3xl scale-x-110 tracking-widest')}>
                {doctorName.replace('د. ', '').replace('Dr. ', '')}
              </div>
              <div className="w-40 h-0.5 bg-[#007A78]/70 print:bg-slate-400 mt-1" />
            </div>
          </div>

          {/* Clinic Stamp Under Signature */}
          <ClinicStamp name={clinicName} isRtl={isRtl} />

        </div>

      </div>

      {/* ── FOOTER WISH ── */}
      <div className="relative flex items-center justify-center my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#007A78]/30 print-border-teal" />
        </div>
        <div className="relative px-6 bg-white dark:bg-slate-950 text-xs font-bold text-[#007A78] tracking-widest select-none">
          {isRtl ? 'مع تمنياتنا بالشفاء العاجل' : 'Wishing You A Speedy Recovery'}
        </div>
      </div>

      {/* ── BOTTOM META BAR ── */}
      <div className="text-center pt-2 border-t border-slate-100 mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold select-none px-4">
        <span>{clinicName}</span>
        {branchName && branchName !== clinicName && (
          <><span>—</span><span className="text-[#007A78]">{branchName}</span></>
        )}
        {addressLine && addressLine !== branchName && (
          <><span>—</span><span className="truncate max-w-[250px]">{addressLine}</span></>
        )}
        <span>—</span>
        <span dir="ltr">{clinicPhone}</span>
      </div>

    </div>
  );
}
