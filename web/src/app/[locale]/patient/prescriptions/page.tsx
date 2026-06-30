'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  FileText, User, CalendarDays, ChevronLeft, ChevronRight,
  Search, Pill, Building2, Stethoscope, Download, Printer,
  AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MedItem {
  medication?: { name: string; strength?: string; category?: string };
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface Prescription {
  id: number;
  prescribedDate: string;
  doctor?: { user?: { name: string }; specialization?: string };
  clinic?: { name: string; logoUrl?: string };
  medicalRecord?: { diagnosis?: string };
  items?: MedItem[];
  medications?: Array<{ name: string; dosage: string; frequency: string }>;
  instructions?: string;
}

export default function PatientPrescriptions() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const BackIcon = isRtl ? ChevronRight : ChevronLeft;

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'old'>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: prescriptions = [], isLoading } = useQuery<Prescription[]>({
    queryKey: ['patient-prescriptions-full'],
    queryFn: () => api.get('/patient-portal/prescriptions').then((r) => r.data),
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filtered = useMemo(() => {
    let list = prescriptions;

    if (activeTab === 'recent') {
      list = list.filter((rx) => new Date(rx.prescribedDate) >= thirtyDaysAgo);
    } else if (activeTab === 'old') {
      list = list.filter((rx) => new Date(rx.prescribedDate) < thirtyDaysAgo);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (rx) =>
          rx.clinic?.name?.toLowerCase().includes(q) ||
          rx.doctor?.user?.name?.toLowerCase().includes(q) ||
          rx.medicalRecord?.diagnosis?.toLowerCase().includes(q) ||
          rx.items?.some((it) => it.medication?.name?.toLowerCase().includes(q)) ||
          (Array.isArray(rx.medications) && rx.medications.some((m) => m.name?.toLowerCase().includes(q))),
      );
    }

    return list;
  }, [prescriptions, activeTab, search]);

  const stats = useMemo(() => ({
    total: prescriptions.length,
    recent: prescriptions.filter((rx) => new Date(rx.prescribedDate) >= thirtyDaysAgo).length,
    totalMeds: prescriptions.reduce((sum, rx) => sum + (rx.items?.length ?? 0), 0),
    lastDate: prescriptions[0]?.prescribedDate ?? null,
  }), [prescriptions]);

  const tabs = [
    { key: 'all' as const,    label: isRtl ? 'الكل'         : 'All',           count: prescriptions.length },
    { key: 'recent' as const, label: isRtl ? 'آخر 30 يوم'  : 'Last 30 Days',   count: stats.recent },
    { key: 'old' as const,    label: isRtl ? 'أقدم من ذلك' : 'Older',          count: prescriptions.length - stats.recent },
  ];

  const getMedicines = (rx: Prescription): MedItem[] => {
    if (rx.items && rx.items.length > 0) return rx.items;
    if (Array.isArray(rx.medications) && rx.medications.length > 0)
      return rx.medications.map((m) => ({
        medication: { name: m.name },
        dosage: m.dosage,
        frequency: m.frequency,
        duration: '',
      }));
    return [];
  };

  const handlePrint = (rxId: number) => {
    const el = document.getElementById(`rx-print-${rxId}`);
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).map((s) => s.outerHTML).join('\n');
    w.document.write(`<!DOCTYPE html><html dir="${isRtl ? 'rtl' : 'ltr'}"><head><title>Rx #${rxId}</title>${styles}<style>@media print{@page{size:A4;margin:12mm}body{background:white!important}}</style></head><body>${el.outerHTML}<script>window.onload=()=>{setTimeout(()=>{window.print();window.close()},300)}<\/script></body></html>`);
    w.document.close();
  };

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600 transition-colors">
          <BackIcon className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {isRtl ? 'الروشتات الطبية' : 'My Prescriptions'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isRtl ? 'كل الروشتات الصادرة من أطبائك' : 'All prescriptions issued by your doctors'}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الروشتات' : 'Total Prescriptions', value: stats.total, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/20' },
          { label: isRtl ? 'خلال آخر 30 يوم' : 'Last 30 Days', value: stats.recent, icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/20' },
          { label: isRtl ? 'إجمالي الأدوية' : 'Total Medicines', value: stats.totalMeds, icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
          { label: isRtl ? 'آخر روشتة' : 'Latest Prescription', value: stats.lastDate ? formatDate(stats.lastDate, locale) : '—', icon: CalendarDays, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/20', isText: true },
        ].map((card, i) => {
          const Icon = card.icon;
          return (
            <Card key={i} className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800">
              <CardContent className="p-4 flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 leading-tight">{card.label}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div>
                  {isLoading ? <Skeleton className="h-7 w-16 mt-1" /> : (
                    <p className={cn('font-bold text-slate-900 dark:text-white', (card as any).isText ? 'text-base' : 'text-2xl')}>
                      {card.value}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5',
                activeTab === tab.key
                  ? 'bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400',
              )}
            >
              {tab.label}
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isRtl ? 'بحث بالدواء أو الطبيب...' : 'Search by medicine or doctor...'}
            className="h-9 pr-9 text-xs rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((rx) => {
            const meds = getMedicines(rx);
            const isExpanded = expandedId === rx.id;
            const isRecent = new Date(rx.prescribedDate) >= thirtyDaysAgo;

            return (
              <Card
                key={rx.id}
                id={`rx-print-${rx.id}`}
                className="rounded-2xl border-slate-200 bg-white shadow-sm dark:bg-slate-950 dark:border-slate-800 overflow-hidden"
              >
                <CardContent className="p-0">
                  {/* Header row */}
                  <div
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : rx.id)}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {isRtl ? 'روشتة' : 'Rx'} #{rx.id}
                          </span>
                          {isRecent && (
                            <Badge className="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-0 text-[10px] font-semibold px-2 py-0.5">
                              {isRtl ? 'حديثة' : 'Recent'}
                            </Badge>
                          )}
                          <span className="text-xs text-slate-400">{formatDate(rx.prescribedDate, locale)}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {rx.doctor?.user?.name || '—'}
                            {rx.doctor?.specialization && ` (${rx.doctor.specialization})`}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {rx.clinic?.name || '—'}
                          </span>
                        </div>
                        {rx.medicalRecord?.diagnosis && (
                          <div className="flex items-center gap-1 text-xs">
                            <Stethoscope className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-350 truncate">
                              {isRtl ? 'التشخيص: ' : 'Dx: '}{rx.medicalRecord.diagnosis}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Pill className="w-3 h-3 flex-shrink-0" />
                          <span>{meds.length} {isRtl ? 'دواء' : 'medicine(s)'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-teal-600 no-print"
                        onClick={(e) => { e.stopPropagation(); handlePrint(rx.id); }}
                        title={isRtl ? 'طباعة' : 'Print'}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <ChevronLeft
                        className={cn(
                          'w-4 h-4 text-slate-400 transition-transform duration-200',
                          isExpanded ? (isRtl ? 'rotate-90' : '-rotate-90') : (isRtl ? '-rotate-90' : 'rotate-0'),
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded medicines */}
                  {isExpanded && meds.length > 0 && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 p-4 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">
                        {isRtl ? 'الأدوية الموصوفة' : 'Prescribed Medicines'}
                      </p>
                      {meds.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 bg-white dark:bg-slate-900/60 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800"
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Pill className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                              {item.medication?.name || '—'}
                              {item.medication?.strength && (
                                <span className="ms-2 text-xs font-normal text-slate-400">{item.medication.strength}</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {item.dosage && <span>💊 {item.dosage}</span>}
                              {item.frequency && <span>🕐 {item.frequency}</span>}
                              {item.duration && <span>📅 {item.duration}</span>}
                            </div>
                            {item.instructions && (
                              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded px-2 py-1">
                                ⚠️ {item.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                      {rx.instructions && (
                        <div className="mt-2 text-xs text-slate-500 bg-white dark:bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-800">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {isRtl ? 'تعليمات عامة: ' : 'General instructions: '}
                          </span>
                          {rx.instructions}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-950">
          <CardContent className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-7 h-7 text-slate-300 dark:text-slate-600" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'لا توجد روشتات مطابقة' : 'No prescriptions found'}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {search
                ? (isRtl ? 'جرب البحث بكلمات مختلفة' : 'Try different search terms')
                : (isRtl ? 'ستظهر الروشتات هنا بعد أن يضيفها الطبيب' : 'Prescriptions will appear here once added by your doctor')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
