'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TrendingUp, Users, Activity, Star, UserCheck, Flame,
  Stethoscope, BarChart3, Pill, Globe, Building2, HelpCircle
} from 'lucide-react';

interface AnalyticsDoctor {
  name: string;
  specialization: string;
  count: number;
}

interface AnalyticsClinic {
  name: string;
  count: number;
}

interface AnalyticsMonthlyTrend {
  month: string;
  count: number;
}

interface AnalyticsMedication {
  id: number;
  name: string;
  prescribedCount: number;
  activeIngredient?: string;
  form?: string;
  strength?: string;
  category?: string;
  manufacturer?: string;
  demographics: {
    genders: { MALE: number; FEMALE: number };
    ageGroups: Record<string, number>;
  };
  topDoctors: AnalyticsDoctor[];
  topClinics: AnalyticsClinic[];
  monthlyTrend: AnalyticsMonthlyTrend[];
}

interface CategoryShare {
  name: string;
  value: number;
  percentage: number;
}

interface FormShare {
  name: string;
  value: number;
  percentage: number;
}

interface MedicationAnalytics {
  summary: {
    totalPrescribedItems: number;
    totalMedsInDict: number;
    globalMedsCount: number;
    clinicCustomCount: number;
  };
  categoryShare: CategoryShare[];
  formShare: FormShare[];
  topMedications: AnalyticsMedication[];
}

export function PharmaInsights() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [selectedMedId, setSelectedMedId] = useState<number | null>(null);

  const { data: analytics, isLoading } = useQuery<MedicationAnalytics>({
    queryKey: ['medications-analytics'],
    queryFn: () => api.get('/medications/analytics').then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>
    );
  }

  const { summary, categoryShare = [], formShare = [], topMedications = [] } = analytics || {};

  // Default select the top medication if none is selected
  const activeMedId = selectedMedId || (topMedications.length > 0 ? topMedications[0].id : null);
  const activeMed = topMedications.find((m: AnalyticsMedication) => m.id === activeMedId);

  // Total categories & forms
  const totalPrescribed = summary?.totalPrescribedItems || 0;

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Summary Key Metrics ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: isRtl ? 'إجمالي الأدوية المكتوبة بالروشتات' : 'Total Prescriptions Written',
            value: summary?.totalPrescribedItems || 0,
            subText: isRtl ? 'روشتة تم صرفها' : 'prescriptions dispensed',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            icon: Activity,
          },
          {
            label: isRtl ? 'أكثر دواء تم كتابته' : 'Most Prescribed Medicine',
            value: topMedications[0]?.name || (isRtl ? 'لا يوجد' : 'None'),
            subText: topMedications[0] ? `${topMedications[0].prescribedCount} ${isRtl ? 'مرة تكرار' : 'prescribed'}` : '',
            color: 'text-teal-600 dark:text-teal-400',
            bg: 'bg-teal-50 dark:bg-teal-950/20',
            icon: Flame,
          },
          {
            label: isRtl ? 'أكثر فئة علاجية طلباً' : 'Top Therapeutic Category',
            value: categoryShare[0]?.name || (isRtl ? 'لا يوجد' : 'None'),
            subText: categoryShare[0] ? `${categoryShare[0].percentage}% ${isRtl ? 'من السوق' : 'of market'}` : '',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            icon: Star,
          },
          {
            label: isRtl ? 'حجم سجل الأدوية ومصادره' : 'Registry Sources',
            value: `${summary?.totalMedsInDict || 0}`,
            subText: isRtl
              ? `عام: ${summary?.globalMedsCount || 0} | خاص بالعيادات: ${summary?.clinicCustomCount || 0}`
              : `Global: ${summary?.globalMedsCount || 0} | Clinic Custom: ${summary?.clinicCustomCount || 0}`,
            color: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-950/20',
            icon: Globe,
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Card key={idx} className="dashboard-card border-none bg-white dark:bg-gray-900 shadow-sm relative overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-1">{item.label}</p>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[170px] md:max-w-none">
                    {item.value}
                  </h3>
                  <p className="text-[11px] text-gray-500 mt-1">{item.subText}</p>
                </div>
                <div className={`p-3 rounded-2xl ${item.bg} ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Main Dashboard: List + Interactive Deep Dive ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left/Right Column: Interactive Med List */}
        <Card className="lg:col-span-1 border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              {isRtl ? 'ترتيب الأدوية الأكثر طلباً في السوق' : 'Market Share by Prescription Count'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            {topMedications.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">{isRtl ? 'لا توجد بيانات أدوية مسجلة بالروشتات بعد' : 'No prescription records found yet'}</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {topMedications.map((med: AnalyticsMedication, idx: number) => {
                  const isActive = med.id === activeMedId;
                  const pct = totalPrescribed ? Math.round((med.prescribedCount / totalPrescribed) * 100) : 0;
                  return (
                    <button
                      key={med.id}
                      onClick={() => setSelectedMedId(med.id)}
                      className={`w-full ${isRtl ? 'text-right' : 'text-left'} p-3 rounded-xl transition-all flex items-center justify-between border ${
                        isActive
                          ? 'bg-teal-500 text-white border-teal-500 dark:bg-teal-600 dark:border-teal-600 shadow-md shadow-teal-500/10'
                          : 'bg-transparent text-gray-700 dark:text-gray-300 border-transparent hover:bg-teal-50/50 dark:hover:bg-teal-950/20'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold truncate block">{med.name}</span>
                        </div>
                        <p className={`text-[11px] mt-0.5 truncate ${isActive ? 'text-teal-100' : 'text-gray-400'}`}>
                          {med.activeIngredient || '—'} &bull; {med.form}
                        </p>
                      </div>
                      <div className="text-left flex-shrink-0 ms-2">
                        <p className="text-sm font-bold">{med.prescribedCount}</p>
                        <p className={`text-[10px] ${isActive ? 'text-teal-100' : 'text-gray-400'}`}>{pct}%</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Big Column: Interactive Medication Analysis Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          {activeMed ? (
            <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white dark:bg-gray-900 overflow-hidden">
              {/* Header of Active Med */}
              <div className="p-5 bg-gradient-to-br from-teal-50/80 to-blue-50/80 dark:from-teal-950/20 dark:to-blue-950/20 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{activeMed.name}</h2>
                    {activeMed.strength && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100/60 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">
                        {activeMed.strength}
                      </span>
                    )}
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100/60 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                      {activeMed.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {isRtl ? 'المادة الفعّالة:' : 'Active Ingredient:'} <span className="font-semibold text-gray-700 dark:text-gray-300">{activeMed.activeIngredient || 'غير محدد'}</span>
                    {activeMed.manufacturer && ` • ${isRtl ? 'الشركة المصنعة:' : 'Manufacturer:'} ${activeMed.manufacturer}`}
                  </p>
                </div>
                <div className="text-right md:text-left flex-shrink-0 bg-white dark:bg-gray-900 rounded-xl px-4 py-2 border shadow-sm self-start md:self-center">
                  <p className="text-[10px] text-gray-400 font-medium uppercase">{isRtl ? 'مرات كتابته في الروشتات' : 'Dispensed Volume'}</p>
                  <p className="text-2xl font-black text-teal-600 dark:text-teal-400 mt-0.5">{activeMed.prescribedCount} <span className="text-xs font-normal text-gray-400">{isRtl ? 'روشتة' : 'times'}</span></p>
                </div>
              </div>

              <CardContent className="p-5 space-y-6">
                
                {/* Visual Demographics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Gender Distribution Widget */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border">
                    <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-pink-500" />
                      {isRtl ? 'التوزيع الديموغرافي للمرضى (النوع)' : 'Patient Demographic Share (Gender)'}
                    </h4>
                    
                    {/* Render split bar */}
                    {(() => {
                      const m = activeMed.demographics.genders.MALE || 0;
                      const f = activeMed.demographics.genders.FEMALE || 0;
                      const totalG = m + f || 1;
                      const malePct = Math.round((m / totalG) * 100);
                      const femalePct = Math.round((f / totalG) * 100);

                      return (
                        <div className="space-y-4 pt-2">
                          {/* Split visual bar */}
                          <div className="w-full h-4 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${malePct || 50}%` }}
                              className="bg-blue-500 hover:opacity-90 transition-opacity"
                              title={`Male: ${malePct}%`}
                            />
                            <div
                              style={{ width: `${femalePct || 50}%` }}
                              className="bg-pink-500 hover:opacity-90 transition-opacity"
                              title={`Female: ${femalePct}%`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs font-bold">
                            <div className="flex items-center gap-1.5 text-blue-600">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                              <span>{isRtl ? 'ذكور' : 'Male'} ({malePct}%)</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pink-600">
                              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                              <span>{isRtl ? 'إناث' : 'Female'} ({femalePct}%)</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Age Group Distribution Widget */}
                  <div className="space-y-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border">
                    <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      {isRtl ? 'الفئة العمرية الأكثر طلباً للدواء' : 'Market Share by Age Bracket'}
                    </h4>
                    <div className="space-y-2 pt-1.5">
                      {Object.entries(activeMed.demographics.ageGroups).map(([group, val]) => {
                        const sumG = Object.values(activeMed.demographics.ageGroups).reduce<number>((a: number, b: number) => a + b, 0) || 1;
                        const pct = Math.round((val / sumG) * 100);
                        return (
                          <div key={group} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-600 dark:text-gray-400 font-medium">{group}</span>
                              <span className="font-bold text-gray-900 dark:text-white">{pct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                              <div style={{ width: `${pct}%` }} className="h-full bg-indigo-500 rounded-full" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Physicians and Clinics Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Top Prescribing Doctor */}
                  <div className="space-y-3 p-4 rounded-xl bg-teal-50/20 dark:bg-teal-950/10 border border-teal-100/50 dark:border-teal-900/30">
                    <h4 className="text-xs font-bold text-teal-700 dark:text-teal-300 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-teal-600" />
                      {isRtl ? 'أكثر دكتور كتابةً وصرفاً لهذا الدواء' : 'Top Prescribing Doctor'}
                    </h4>
                    {activeMed.topDoctors.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {activeMed.topDoctors.map((doc: AnalyticsDoctor, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-gray-900 border">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                              {doc.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{doc.name}</p>
                              <p className="text-[10px] text-gray-500 truncate">{doc.specialization}</p>
                            </div>
                            <div className="text-left font-bold text-xs text-teal-600">
                              <span className="text-sm font-extrabold">{doc.count}</span> {isRtl ? 'روشتة' : 'Rx'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-4 text-center">{isRtl ? 'لا توجد بيانات أطباء مسجلة' : 'No doctors record'}</p>
                    )}
                  </div>

                  {/* Top Clinics Demanded */}
                  <div className="space-y-3 p-4 rounded-xl bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/30">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      {isRtl ? 'أكثر العيادات الطبية طلباً للدواء' : 'Top Clinic Distribution'}
                    </h4>
                    {activeMed.topClinics.length > 0 ? (
                      <div className="space-y-3 pt-2">
                        {activeMed.topClinics.map((cl: AnalyticsClinic, i: number) => (
                          <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-gray-900 border">
                            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-700 dark:text-purple-300 font-bold text-xs">
                              {cl.name[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{cl.name}</p>
                            </div>
                            <div className="text-left font-bold text-xs text-purple-600">
                              <span className="text-sm font-extrabold">{cl.count}</span> {isRtl ? 'مرة' : 'times'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 py-4 text-center">{isRtl ? 'لا توجد بيانات عيادات مسجلة' : 'No clinics record'}</p>
                    )}
                  </div>

                </div>

                {/* 6-Month Trend analysis (Simple Visual Columns) */}
                <div className="space-y-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/40 border">
                  <h4 className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-teal-500" />
                    {isRtl ? 'منحنى الطلب والصرف الشهري للدواء (آخر 6 أشهر)' : 'Monthly Demand Trend Analysis (Past 6 Months)'}
                  </h4>
                  {activeMed.monthlyTrend.length > 0 ? (
                    <div className="flex items-end justify-between h-24 pt-4 px-4 gap-4">
                      {activeMed.monthlyTrend.map((t: AnalyticsMonthlyTrend) => {
                        const maxVal = Math.max(...activeMed.monthlyTrend.map((m: AnalyticsMonthlyTrend) => m.count)) || 1;
                        const height = Math.max(10, Math.round((t.count / maxVal) * 100));
                        return (
                          <div key={t.month} className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-teal-600 text-white text-[9px] px-1 py-0.5 rounded font-bold">
                              {t.count}
                            </span>
                            <div className="w-full bg-teal-100 dark:bg-teal-900/30 rounded-t-md hover:bg-teal-500 dark:hover:bg-teal-500 transition-colors" style={{ height: `${height}%` }} />
                            <span className="text-[9px] text-gray-400 font-semibold">{t.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 py-6 text-center">{isRtl ? 'لا يوجد تكرار كافٍ لتقدير المنحنى' : 'Insufficient trend records'}</p>
                  )}
                </div>

              </CardContent>
            </Card>
          ) : (
            <div className="h-full flex items-center justify-center p-10 border rounded-xl border-dashed">
              <p className="text-sm text-gray-400">{isRtl ? 'برجاء اختيار دواء من القائمة لعرض التحليل الكامل له' : 'Select a drug to view market research analysis'}</p>
            </div>
          )}
        </div>

      </div>

      {/* ── Therapeutic Classes and Pharmaceutical Form Analysis (Market Analysis for Pharma Companies) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Therapeutic Categories Market Share */}
        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              {isRtl ? 'حجم الطلب حسب الفئة العلاجية (Therapeutic Category Share)' : 'Therapeutic Category Demand Analysis'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {categoryShare.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">{isRtl ? 'لا توجد بيانات' : 'No data'}</p>
            ) : (
              categoryShare.map((cat: CategoryShare) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{cat.name}</span>
                    </div>
                    <span className="text-gray-400">{cat.value} {isRtl ? 'صرف' : 'Rx'} ({cat.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div style={{ width: `${cat.percentage}%` }} className="h-full bg-blue-500 rounded-full" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pharmaceutical Form share */}
        <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-sm bg-white dark:bg-gray-900">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-purple-600" />
              {isRtl ? 'حصة السوق حسب الشكل الدوائي (أقراص، حقن، شراب)' : 'Pharmaceutical Dosage Form Share'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {formShare.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">{isRtl ? 'لا توجد بيانات' : 'No data'}</p>
            ) : (
              formShare.map((form: FormShare) => (
                <div key={form.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                      <span className="font-bold text-gray-700 dark:text-gray-300">{form.name}</span>
                    </div>
                    <span className="text-gray-400">{form.value} {isRtl ? 'صرف' : 'Rx'} ({form.percentage}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div style={{ width: `${form.percentage}%` }} className="h-full bg-purple-500 rounded-full" />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
