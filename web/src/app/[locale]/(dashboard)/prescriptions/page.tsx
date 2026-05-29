'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SearchBox } from '@/components/common/SearchBox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Eye,
  Printer,
  Pill,
  Phone,
  Stethoscope,
  ClipboardList,
  CalendarDays,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

export default function PrescriptionsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['prescriptions', search],
    queryFn: () => api.get('/prescriptions', { params: { search, limit: 20 } }).then((r) => r.data),
  });

  const prescriptions = data?.data || [];

  const todayCount = useMemo(
    () => prescriptions.filter((rx: any) => {
      const d = new Date(rx.prescribedDate);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length,
    [prescriptions]
  );

  const noDiagCount = useMemo(
    () => prescriptions.filter((rx: any) => !rx.medicalRecord?.diagnosis && !rx.medicalRecord?.chiefComplaint).length,
    [prescriptions]
  );

  const getInitials = (name: string) => {
    if (!name) return 'م';
    const parts = name.trim().split(/\s+/);
    return parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  const getPatientDisplay = (p: any) => {
    const firstName = p?.firstName || 'مريض';
    const lastName = p?.lastName || '';
    const phone = p?.phone || 'لا يوجد رقم';
    return { firstName, lastName, phone, fullName: `${firstName} ${lastName}`.trim() };
  };

  const parseMedications = (rx: any) => {
    if (typeof rx.medications === 'string') {
      try { return JSON.parse(rx.medications); } catch { return []; }
    }
    if (Array.isArray(rx.medications) && rx.medications.length > 0) {
      return rx.medications;
    }
    if (Array.isArray(rx.items) && rx.items.length > 0) {
      return rx.items.map((item: any) => ({
        name: item.medication?.name || item.name || '',
        dosage: item.dosage || '',
        frequency: item.frequency || '',
        duration: item.duration || '',
      }));
    }
    return [];
  };

  return (
    <div className={cn("space-y-5 animate-fade-in", isRtl ? "text-right" : "text-left")} dir={isRtl ? "rtl" : "ltr"}>
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-violet-50 dark:bg-violet-950/30 flex items-center justify-center flex-shrink-0">
              <Pill className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isRtl ? 'إجمالي الروشتات' : 'Total Prescriptions'}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isLoading ? '—' : data?.meta?.total ?? 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isRtl ? 'روشتات اليوم' : "Today's Prescriptions"}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isLoading ? '—' : todayCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 dark:border-slate-800/80">
          <CardContent className="p-3.5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 leading-tight">
                {isRtl ? 'بدون تشخيص' : 'Not Applicable'}
              </p>
              <p className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                {isLoading ? '—' : noDiagCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {isRtl ? 'الروشتات' : 'Prescriptions'}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isRtl ? 'متابعة وإدارة روشتات المرضى وطباعتها' : 'Track, manage and print patient prescriptions'}
          </p>
        </div>
        <Link href={`/${locale}/visits/new`}>
          <Button className="h-11 rounded-xl bg-cyan-600 px-4 text-white hover:bg-cyan-700 gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            {isRtl ? 'روشتة جديدة' : 'New Prescription'}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="w-full sm:w-[420px]">
          <SearchBox
            placeholder={isRtl ? 'ابحث برقم الروشتة أو اسم المريض' : 'Search by prescription number or patient name...'}
            value={search}
            onChange={setSearch}
          />
        </div>
        {search && (
          <Button variant="ghost" size="sm" onClick={() => setSearch('')} className="h-9 text-xs text-slate-400 hover:text-slate-600 rounded-lg">
            {isRtl ? 'إلغاء البحث' : 'Clear search'}
          </Button>
        )}
      </div>

      {/* Prescription cards */}
      <div className="space-y-2.5">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <Card key={i} className="border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : prescriptions.length === 0 ? (
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <CardContent className="py-16 text-center text-slate-400 animate-fade-in">
              <Pill className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="text-sm font-medium text-slate-500 mb-1">
                {isRtl ? 'لا توجد روشتات' : 'No prescriptions found'}
              </p>
              <p className="text-xs text-slate-400">
                {isRtl
                  ? 'لم يتم العثور على روشتات تطابق البحث. استخدم زر "روشتة جديدة" لإضافة روشتة.'
                  : 'No prescriptions matched your search. Use "New Prescription" to create one.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          prescriptions.map((rx: any, i: number) => {
            const pd = getPatientDisplay(rx.patient);
            const meds = parseMedications(rx);
            const diag = rx.medicalRecord?.diagnosis || rx.medicalRecord?.chiefComplaint;
            const diagDisplay = diag;

            return (
              <Card
                key={rx.id}
                className="border-slate-200/80 dark:border-slate-800/80 hover:border-violet-200 dark:hover:border-violet-800/60 hover:shadow-sm transition-all duration-200 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="p-0">
                  <div className="p-3.5">
                    {/* Top row: patient + date */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={cn("flex items-center gap-2.5 min-w-0", isRtl ? "" : "flex-row")}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-950/40 dark:to-purple-900/30 flex items-center justify-center flex-shrink-0 border border-violet-200/50 dark:border-violet-800/50">
                          <span className="text-xs font-bold text-violet-700 dark:text-violet-300">
                            {getInitials(pd.fullName)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {pd.fullName}
                            </p>
                            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono flex-shrink-0 leading-tight">
                              P-{String(rx.patient?.id || rx.id).padStart(4, '0')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {pd.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={cn("flex-shrink-0", isRtl ? "text-left" : "text-right")}>
                        <p className="text-[10px] text-slate-400">
                          {isRtl ? `روشتة #${rx.id}` : `Rx #${rx.id}`}
                        </p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                          {formatDate(rx.prescribedDate, locale)}
                        </p>
                      </div>
                    </div>

                    {/* Middle section: diagnosis + medicines */}
                    <div className="flex flex-wrap items-center gap-2">
                      {diagDisplay ? (
                        <div className="flex items-start gap-1.5 flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-2.5 py-1.5 border border-slate-100 dark:border-slate-800">
                          <Stethoscope className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-700 dark:text-slate-300 line-clamp-1">
                            {diagDisplay}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 flex-1 min-w-0 bg-slate-50/50 dark:bg-slate-900/30 rounded-lg px-2.5 py-1.5 border border-dashed border-slate-200 dark:border-slate-800">
                          <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                          <span className="text-[11px] text-slate-400">
                            {isRtl ? 'لا يوجد تشخيص مسجل لهذه الروشتة' : 'No diagnosis registered for this prescription'}
                          </span>
                        </div>
                      )}

                      <Badge variant="outline" className={`flex-shrink-0 text-[10px] gap-1 px-2 py-0.5 border ${
                        meds.length > 0
                          ? 'border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30'
                          : 'border-slate-200 dark:border-slate-700 text-slate-400 bg-slate-50 dark:bg-slate-900/60'
                      }`}>
                        <Pill className="w-3 h-3" />
                        {meds.length > 0 
                          ? (isRtl ? `${meds.length} دواء` : `${meds.length} Med${meds.length > 1 ? 's' : ''}`)
                          : (isRtl ? 'بدون أدوية' : 'No Medications')}
                      </Badge>

                      {meds.length > 0 && (
                        <p className="text-[11px] text-slate-400 leading-normal flex-shrink-0 max-w-[240px] line-clamp-1" dir="auto" title={meds.map((m: any) => m.name).join('، ')}>
                          {meds.map((m: any) => m.name).join('، ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom bar: actions */}
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 rounded-b-xl">
                    <div className="flex items-center gap-1">
                      {rx.medicalRecord ? (
                        <Link href={`/${locale}/visits/${rx.medicalRecordId}`}>
                          <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-[11px] text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 rounded-lg">
                            <ClipboardList className="w-3 h-3" />
                            {isRtl ? 'عرض الزيارة' : 'View Visit'}
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-300 dark:text-slate-600 px-1">
                          {isRtl ? 'بدون زيارة' : 'No Visit'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Button 
                        onClick={() => window.location.href = `/${locale}/prescriptions/${rx.id}`}
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-3 gap-1.5 text-xs text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg transition-all duration-150"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {isRtl ? 'عرض' : 'View'}
                      </Button>
                      <Button 
                        onClick={() => window.location.href = `/${locale}/prescriptions/${rx.id}`}
                        size="sm" 
                        variant="ghost" 
                        className="h-8 px-3 gap-1.5 text-xs text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/20 rounded-lg transition-all duration-150"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        {isRtl ? 'طباعة' : 'Print'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}


