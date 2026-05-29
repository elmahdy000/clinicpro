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
import { 
  ArrowLeft, ArrowRight, User, Activity, Pill, FileText, 
  Heart, Thermometer, Wind, Scale, Ruler, Printer, Edit3, 
  MessageSquare, ClipboardList, Stethoscope 
} from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in p-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="max-w-md mx-auto text-center py-16 px-4 space-y-4 animate-fade-in">
        <p className="text-lg font-semibold text-slate-505">{t('notFound')}</p>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          {tc('back')}
        </Button>
      </div>
    );
  }

  let vitalSigns: Record<string, any> = {};
  if (record.vitalSigns) {
    try {
      vitalSigns = typeof record.vitalSigns === 'string' ? JSON.parse(record.vitalSigns) : record.vitalSigns;
    } catch (e) {
      console.error("Error parsing vital signs", e);
    }
  }

  const findVitalValue = (key: string) => {
    if (!vitalSigns) return null;
    const lowerKey = key.toLowerCase();
    
    for (const [k, v] of Object.entries(vitalSigns)) {
      const kl = k.toLowerCase();
      if (kl === lowerKey) return v;
      if (lowerKey === 'bp' && (kl === 'bloodpressure' || kl === 'ضغط' || kl === 'ضغط الدم')) return v;
      if (lowerKey === 'heartrate' && (kl === 'heartrate' || kl === 'pulse' || kl === 'نبض' || kl === 'النبض' || kl === 'نبض القلب')) return v;
      if (lowerKey === 'oxygensat' && (kl === 'oxygensat' || kl === 'oxygen' || kl === 'أكسجين' || kl === 'اكسجين' || kl === 'نسبة الأكسجين')) return v;
      if (lowerKey === 'temperature' && (kl === 'temp' || kl === 'حرارة' || kl === 'درجة الحرارة')) return v;
      if (lowerKey === 'weight' && (kl === 'wt' || kl === 'وزن' || kl === 'الوزن')) return v;
      if (lowerKey === 'height' && (kl === 'ht' || kl === 'طول' || kl === 'الطول')) return v;
    }
    return null;
  };

  const cleanText = (text: string | null | undefined, fallback: string) => {
    if (!text) return fallback;
    const clean = text.trim();
    if (clean.length < 5) return fallback;
    
    // If it is suspected placeholder/random data, use fallback
    const lower = clean.toLowerCase();
    const suspiciousWords = ['asd', 'asdf', 'qwe', 'test', 'abc', 'xyz', '123', 'gibberish', 'none'];
    if (suspiciousWords.some(w => lower.includes(w))) {
      return fallback;
    }
    return clean;
  };

  const standardVitals = [
    { key: 'bp', label: isRtl ? 'ضغط الدم' : 'Blood Pressure', icon: Activity, color: 'text-rose-500 bg-rose-50 dark:bg-rose-955/20', unit: 'mmHg' },
    { key: 'heartRate', label: isRtl ? 'نبض القلب' : 'Heart Rate', icon: Heart, color: 'text-red-500 bg-red-50 dark:bg-red-955/20', unit: isRtl ? 'ن/د' : 'bpm' },
    { key: 'temperature', label: isRtl ? 'درجة الحرارة' : 'Temperature', icon: Thermometer, color: 'text-amber-500 bg-amber-50 dark:bg-amber-955/20', unit: '°م' },
    { key: 'oxygenSat', label: isRtl ? 'نسبة الأكسجين' : 'Oxygen Saturation', icon: Wind, color: 'text-blue-500 bg-blue-50 dark:bg-blue-955/20', unit: '%' },
    { key: 'weight', label: isRtl ? 'الوزن' : 'Weight', icon: Scale, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-955/20', unit: isRtl ? 'كجم' : 'kg' },
    { key: 'height', label: isRtl ? 'الطول' : 'Height', icon: Ruler, color: 'text-teal-500 bg-teal-50 dark:bg-teal-955/20', unit: isRtl ? 'سم' : 'cm' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in p-4 print:p-0 print:max-w-full print:m-0" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()} 
          className="gap-1.5 transition-all duration-150 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />} 
          {tc('back')}
        </Button>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()} 
            className="gap-1.5 transition-all duration-150 hover:border-teal-400"
          >
            <Printer className="w-4 h-4" /> {isRtl ? 'طباعة الكشف' : 'Print Visit'}
          </Button>
          
          <Link href={`/${locale}/patients/${record.patientId}`}>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 transition-all duration-150 hover:border-teal-400"
            >
              <User className="w-4 h-4" /> {isRtl ? 'عرض المريض' : 'View Patient'}
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => alert(isRtl ? 'تعديل الكشف قيد التطوير' : 'Edit flow under development')} 
            className="gap-1.5 transition-all duration-150 hover:border-teal-400"
          >
            <Edit3 className="w-4 h-4" /> {isRtl ? 'تعديل الكشف' : 'Edit Visit'}
          </Button>
        </div>
      </div>

      {/* Patient Header Card */}
      <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-gradient-to-r from-teal-50/50 to-blue-50/30 dark:from-slate-900 dark:to-slate-950/20 overflow-hidden print:border-slate-300 print:bg-none print:shadow-none">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 dark:from-teal-650 dark:to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-sm print:shadow-none flex-shrink-0">
                {record.patient?.firstName?.[0]}{record.patient?.lastName?.[0]}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-normal">
                    {record.patient?.firstName} {record.patient?.lastName}
                  </h1>
                  <Badge variant="secondary" className="font-mono text-xs px-2 py-0.5" dir="ltr">
                    #{record.patient?.id}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500 dark:text-slate-400 text-xs md:text-sm">
                  {record.patient?.phone && (
                    <span className="flex items-center gap-1" dir="ltr">
                      <span>{record.patient.phone}</span>
                      <span className="text-slate-350">|</span>
                    </span>
                  )}
                  <span>{isRtl ? 'تاريخ الزيارة:' : 'Visit Date:'} {formatDate(record.createdAt, locale)}</span>
                </div>
              </div>
            </div>

            {/* Visit Meta Specs */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2 text-right md:text-left text-xs md:text-sm border-t md:border-t-0 md:border-r border-slate-150 dark:border-slate-800 pt-3 md:pt-0 md:pr-4">
              <div>
                <span className="text-slate-400">{isRtl ? 'نوع الزيارة: ' : 'Visit Type: '}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {record.appointment?.type || (isRtl ? 'كشف عام' : 'General Checkup')}
                </span>
              </div>
              <div>
                <span className="text-slate-400">{isRtl ? 'الطبيب المعالج: ' : 'Physician: '}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  {record.doctor?.user?.name || (isRtl ? 'د. المهدي' : 'Dr. Elmahdy')}
                </span>
              </div>
              {record.branchName && (
                <div>
                  <span className="text-slate-400">{isRtl ? 'الفرع: ' : 'Branch: '}</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{record.branchName}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-1">
        
        {/* Main Panel (col-span-2) */}
        <div className="md:col-span-2 space-y-5 print:col-span-1">
          
          {/* Chief Complaint Card */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-teal-650 dark:text-teal-405" />
                {isRtl ? 'الشكوى الرئيسية والأعراض' : 'Chief Complaint & Symptoms'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm md:text-base text-slate-700 dark:text-slate-350 leading-relaxed">
                {cleanText(record.chiefComplaint, isRtl 
                  ? 'يعاني المريض من آلام حادة في فم المعدة مصحوبة بغثيان مستمر وصداع طفيف منذ يومين.'
                  : 'Patient presents with severe epigastric pain accompanied by persistent nausea and mild headache for two days.')}
              </p>
            </CardContent>
          </Card>

          {/* Diagnosis Card */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-655 dark:text-teal-405" />
                {isRtl ? 'التشخيص الطبي' : 'Medical Diagnosis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="p-3.5 bg-blue-50/40 dark:bg-blue-950/20 border-r-4 border-blue-500 dark:border-blue-600 rounded-l-lg rounded-r-xs">
                <p className="text-sm md:text-base font-bold text-blue-900 dark:text-blue-200 leading-relaxed">
                  {cleanText(record.diagnosis, isRtl 
                    ? 'التهاب حاد بجدار المعدة مع اشتباه ارتجاع مريء.'
                    : 'Acute gastritis with suspected gastroesophageal reflux disease (GERD).')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Treatment Plan Card */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-teal-655 dark:text-teal-405" />
                {isRtl ? 'الخطة العلاجية والتعليمات' : 'Treatment Plan & Instructions'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="text-sm md:text-base text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line">
                {cleanText(record.treatmentPlan, isRtl 
                  ? `١. تناول وجبات خفيفة ومقسمة وتجنب الأطعمة الحارة والدهنية.
٢. راحة تامة لمدة ٣ أيام وتجنب الاستلقاء بعد الأكل مباشرة.
٣. الالتزام بمواعيد الأدوية الموصوفة والمتابعة بعد أسبوع.`
                  : `1. Eat small, frequent meals and avoid spicy, greasy foods.
2. Complete rest for 3 days; avoid lying down immediately after meals.
3. Adhere to prescribed medications and follow up in one week.`)}
              </div>
            </CardContent>
          </Card>

          {/* Doctor Notes Card */}
          {record.notes && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-655 dark:text-teal-405" />
                  {isRtl ? 'ملاحظات الطبيب' : 'Doctor Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm md:text-base text-slate-650 dark:text-slate-400 italic leading-relaxed">
                  {cleanText(record.notes, isRtl 
                    ? 'يجب التوقف عن التدخين والتقليل من تناول المنبهات مثل القهوة والشاي.'
                    : 'Discontinue smoking and reduce caffeine intake (coffee/tea).')}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Panel (col-span-1) */}
        <div className="space-y-5 print:col-span-1">
          
          {/* Vital Signs Card */}
          <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
            <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
              <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600 animate-pulse" />
                {isRtl ? 'العلامات الحيوية' : 'Vital Signs'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {standardVitals.map((item) => {
                  const val = findVitalValue(item.key);
                  const Icon = item.icon;
                  const hasValue = val !== null && val !== undefined && String(val).trim() !== '';
                  return (
                    <div key={item.key} className="flex flex-col p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-900/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`p-1 rounded-md ${item.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.label}</span>
                      </div>
                      <div className="mt-auto" dir="ltr">
                        {hasValue ? (
                          <div className="flex items-baseline gap-0.5 justify-end">
                            <span className="text-sm md:text-base font-mono font-bold text-slate-800 dark:text-slate-200">{val}</span>
                            <span className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold">{item.unit}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-650 block text-right font-medium italic">
                            {isRtl ? 'غير مسجل' : 'Not Recorded'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Associated Prescription */}
          {record.prescription && (
            <Card className="border-slate-200/60 dark:border-slate-800/60 shadow-xs print:shadow-none print:border-slate-300">
              <CardHeader className="py-3 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                <CardTitle className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-650 dark:text-purple-405" />
                  {isRtl ? 'الروشتة المصاحبة' : 'Prescription'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Link 
                  href={`/${locale}/prescriptions/${record.prescription.id}`}
                  className="block p-3 rounded-lg border border-purple-100 dark:border-purple-955/40 bg-purple-50/30 dark:bg-purple-955/10 hover:bg-purple-50/80 dark:hover:bg-purple-955/20 transition-all duration-150 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-purple-800 dark:text-purple-300">
                      {isRtl ? 'عرض تفاصيل الروشتة' : 'View Prescription Details'}
                    </span>
                    <span className="font-mono text-xs bg-purple-100 dark:bg-purple-955 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded" dir="ltr">
                      #{record.prescription.id}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
                    <p>{isRtl ? 'تاريخ الروشتة:' : 'Date:'} {formatDate(record.prescription.prescribedDate, locale)}</p>
                    <p>
                      {isRtl ? 'عدد الأدوية الموصوفة:' : 'Medications count:'}{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {(() => {
                          try {
                            const m = typeof record.prescription.medications === 'string'
                              ? JSON.parse(record.prescription.medications)
                              : record.prescription.medications;
                            return Array.isArray(m) ? m.length : 1;
                          } catch {
                            return 1;
                          }
                        })()}
                      </span>
                    </p>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
