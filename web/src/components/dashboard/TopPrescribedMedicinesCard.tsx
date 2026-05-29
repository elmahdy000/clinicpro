'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pill, AlertCircle, RefreshCw, Star, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { arEG, enUS } from 'date-fns/locale';

interface TopMedicineItem {
  medicineId: string | null;
  medicineName: string;
  prescriptionsCount: number;
  lastPrescribedAt: string | null;
  category: string | null;
  activeIngredient: string | null;
}

interface TopMedicinesResponse {
  success: boolean;
  data: {
    period: 'today' | 'week' | 'month';
    totalPrescriptions: number;
    totalDistinctMedicines: number;
    items: TopMedicineItem[];
  };
  message?: string;
}

interface TopPrescribedMedicinesCardProps {
  locale: string;
  isRtl: boolean;
}

export default function TopPrescribedMedicinesCard({ locale, isRtl }: TopPrescribedMedicinesCardProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');

  const { data, isLoading, isError, refetch, isRefetching } = useQuery<TopMedicinesResponse>({
    queryKey: ['top-prescribed-medicines', period],
    queryFn: () => api.get(`/dashboard/top-medicines?period=${period}`).then((r) => r.data),
    refetchInterval: 45_000, // auto-refresh stats periodically
  });

  const getRelativeTime = (dateString: string | null) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: isRtl ? arEG : enUS,
      });
    } catch {
      return '';
    }
  };

  const periodOptions = [
    { value: 'today', label: isRtl ? 'اليوم' : 'Today' },
    { value: 'week', label: isRtl ? 'هذا الأسبوع' : 'This Week' },
    { value: 'month', label: isRtl ? 'هذا الشهر' : 'This Month' },
  ] as const;

  const responseData = data?.success ? data.data : null;
  const items = responseData?.items || [];
  const maxCount = items[0]?.prescriptionsCount || 1;

  // Rank Styling Helper
  const getRankStyle = (index: number) => {
    switch (index) {
      case 0:
        return {
          bg: 'bg-gradient-to-br from-teal-500 to-emerald-500 shadow-md shadow-teal-500/20',
          text: 'text-white font-bold',
          border: 'border-2 border-amber-300 dark:border-amber-400',
          hasStar: true,
        };
      case 1:
        return {
          bg: 'bg-gradient-to-br from-sky-500 to-blue-500 shadow-md shadow-blue-500/20',
          text: 'text-white font-bold',
          border: 'border border-sky-300',
          hasStar: false,
        };
      case 2:
        return {
          bg: 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20',
          text: 'text-white font-bold',
          border: 'border border-indigo-300',
          hasStar: false,
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
          text: 'text-slate-600 dark:text-slate-300 font-semibold',
          border: '',
          hasStar: false,
        };
    }
  };

  return (
    <Card className="dashboard-card border border-teal-100/50 dark:border-teal-950/30 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg animate-fade-in-up delay-2">
      {/* Visual Accent Header decoration */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />

      <CardHeader className="pb-3 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
              <Pill className="w-4 h-4" />
            </div>
            <span className="text-slate-800 dark:text-slate-200 font-bold tracking-tight">
              {isRtl ? 'الأدوية الأكثر وصفاً بالعيادة' : 'Top Prescribed Medications'}
            </span>
            {isRefetching && (
              <RefreshCw className="w-3.5 h-3.5 text-teal-500 animate-spin" />
            )}
          </CardTitle>

          {/* Segmented Filter Pills */}
          <div className="bg-slate-100 dark:bg-slate-900/60 p-0.5 rounded-lg flex items-center self-start sm:self-auto" dir={isRtl ? 'rtl' : 'ltr'}>
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                  period === opt.value
                    ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Period Stats Sub-header */}
        {!isLoading && !isError && responseData && items.length > 0 && (
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 px-2 py-1 rounded-md" dir={isRtl ? 'rtl' : 'ltr'}>
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>
              {isRtl
                ? `إجمالي الروشتات: ${responseData.totalPrescriptions} روشتة`
                : `Total Prescriptions: ${responseData.totalPrescriptions}`}
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              {isRtl
                ? `أدوية مختلفة: ${responseData.totalDistinctMedicines}`
                : `Distinct Medications: ${responseData.totalDistinctMedicines}`}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-1">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-3.5 py-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-2 w-full rounded" />
                </div>
                <Skeleton className="h-4 w-10 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-8 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-xs font-semibold text-red-600 dark:text-red-400">
              {isRtl ? 'تعذر تحميل بيانات الأدوية حالياً' : 'Could not load medications analysis'}
            </p>
            <Button
              size="xs"
              variant="outline"
              onClick={() => refetch()}
              className="mt-3 gap-1.5 border-teal-500/30 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 text-[11px]"
            >
              <RefreshCw className="w-3 h-3" />
              {isRtl ? 'إعادة المحاولة' : 'Retry'}
            </Button>
          </div>
        )}

        {/* Success & Empty State */}
        {!isLoading && !isError && (
          items.length > 0 ? (
            <div className="space-y-3 py-1" dir={isRtl ? 'rtl' : 'ltr'}>
              {items.map((item, index) => {
                const rank = getRankStyle(index);
                const percentage = Math.round((item.prescriptionsCount / maxCount) * 100);

                return (
                  <div
                    key={item.medicineId || index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/50 dark:bg-slate-900/20 border border-slate-100/50 dark:border-slate-800/30 transition-all hover:bg-teal-50/30 dark:hover:bg-teal-950/10 group"
                  >
                    {/* Rank Badge Indicator */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative ${rank.bg} ${rank.border}`}>
                      {rank.hasStar && (
                        <Star className="w-2.5 h-2.5 text-amber-300 fill-amber-300 absolute -top-1 -right-0.5 rotate-12" />
                      )}
                      <span className={`text-xs ${rank.text}`}>
                        {index + 1}
                      </span>
                    </div>

                    {/* Middle: Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                          {item.medicineName}
                        </p>
                        {item.category && (
                          <span className="text-[9px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {item.activeIngredient && (
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate" dir="ltr">
                          {item.activeIngredient}
                        </p>
                      )}
                    </div>

                    {/* Right: Quantity count & relative percentage pill */}
                    <div className="text-left flex flex-col items-end flex-shrink-0 gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {/* Premium relative percentage pill */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          index === 0
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                            : index === 1
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}>
                          {percentage}%
                        </span>

                        <div className="flex items-baseline gap-0.5 text-teal-600 dark:text-teal-400">
                          <span className="text-sm font-black tracking-tight">{item.prescriptionsCount}</span>
                          <span className="text-[10px] font-semibold">
                            {isRtl ? 'وصفة' : 'presc.'}
                          </span>
                        </div>
                      </div>
                      
                      {item.lastPrescribedAt && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 italic">
                          {getRelativeTime(item.lastPrescribedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Beautiful Empty State with Prescription CTA
            <div className="flex flex-col items-center justify-center py-9 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="w-12 h-12 rounded-full bg-teal-50 dark:bg-teal-950/30 flex items-center justify-center mb-3">
                <Pill className="w-6 h-6 text-teal-400 dark:text-teal-500 animate-pulse" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isRtl ? 'لا توجد أدوية موصوفة بعد' : 'No prescribed medications yet'}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] leading-relaxed">
                {isRtl
                  ? 'ستظهر هنا الأدوية الأكثر استخداماً فور كتابة أول روشتة للمرضى'
                  : 'Clinic-scoped medications will show here once you write your first prescription'}
              </p>
              <Link href={`/${locale}/visits/new`} className="mt-4">
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-xs font-semibold gap-1.5 shadow-sm">
                  {isRtl ? 'كتابة روشتة جديدة' : 'Create Prescription'}
                </Button>
              </Link>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
