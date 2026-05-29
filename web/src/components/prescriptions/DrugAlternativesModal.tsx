'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle, CheckCircle, Info, ArrowLeftRight,
  TrendingUp, Sparkles, ShieldAlert, Package, X, Pill,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrugAlternativesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicationId: number | null;
  patientId: string | null;
  currentName: string;
  onSubstitute: (newMed: any, reason: string) => void;
}

export function DrugAlternativesModal({
  open, onOpenChange, medicationId, patientId, currentName, onSubstitute
}: DrugAlternativesModalProps) {
  const [selectedAlt, setSelectedAlt] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [includeCheaper, setIncludeCheaper] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['medicine-alternatives', medicationId, patientId, includeCheaper],
    queryFn: () => api.get(`/medications/${medicationId}/alternatives`, {
      params: { patientId, includeCheaper }
    }).then(r => r.data),
    enabled: open && !!medicationId,
  });

  const handleConfirm = () => {
    if (selectedAlt && reason.trim()) {
      onSubstitute(selectedAlt, reason);
      onOpenChange(false);
      setSelectedAlt(null);
      setReason('');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedAlt(null);
    setReason('');
  };

  if (!open) return null;

  const suggestions = data?.data?.suggestions || [];
  const topSuggestion = suggestions.find((s: any) => s.isTopRecommendation);
  const originalMed = data?.data?.originalMedicine;

  const getSafetyConfig = (level: string) => {
    switch (level) {
      case 'SAFE': return { label: 'آمن', icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CAUTION': return { label: 'بحذر', icon: Info, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'NOT_RECOMMENDED': return { label: 'ممنوع', icon: ShieldAlert, cls: 'bg-rose-50 text-rose-700 border-rose-200' };
      default: return { label: '', icon: Info, cls: '' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="relative bg-gradient-to-l from-teal-600 to-teal-700 px-6 py-5">
          <button
            onClick={handleClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl">
              <ArrowLeftRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">
                تحليل البدائل والتحويل الدوائي
              </h2>
              <p className="text-teal-100 text-xs mt-1 leading-relaxed">
                البدائل الذكية لـ
                <span className="font-bold text-white mx-1">{currentName}</span>
                بناءً على مخزن عيادتك وتاريخ المنصة
              </p>
            </div>
          </div>

          {/* Shortage Alert inside header */}
          {!isLoading && originalMed?.isMarketShortage && (
            <div className="mt-4 flex items-start gap-2 bg-rose-500/30 border border-rose-300/40 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-100 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">هذا الدواء غير متوفر في السوق حالياً</p>
                {originalMed.shortageNote && (
                  <p className="text-[11px] text-rose-100 mt-0.5">{originalMed.shortageNote}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Top Recommendation */}
        {!isLoading && topSuggestion && (
          <div
            className={cn(
              "mx-4 mt-4 p-3.5 rounded-xl border-2 cursor-pointer transition-all",
              selectedAlt?.medicineId === topSuggestion.medicineId
                ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30"
                : "border-teal-200 bg-teal-50/60 dark:bg-teal-950/20 hover:border-teal-400"
            )}
            onClick={() => setSelectedAlt(topSuggestion)}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wide">توصية الذكاء الاصطناعي</span>
              <Badge className="bg-teal-600 text-white text-[9px] px-1.5 h-4 mr-auto gap-0.5">
                <TrendingUp className="w-2.5 h-2.5" /> الأعلى استخداماً
              </Badge>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-bold text-slate-800 dark:text-white text-sm">{topSuggestion.tradeName}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {topSuggestion.activeIngredient} • استُخدم {topSuggestion.historicalScore}× كبديل
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] gap-0.5">
                  <CheckCircle className="w-3 h-3" /> آمن
                </Badge>
                {topSuggestion.price && (
                  <span className="text-sm font-bold text-teal-700">{topSuggestion.price} ج.م</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Divider + Filter */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="text-xs font-semibold text-slate-500">جميع البدائل المتاحة</span>
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <div className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              includeCheaper ? "bg-teal-500" : "bg-slate-300"
            )}>
              <div className={cn(
                "absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all",
                includeCheaper ? "right-0.5" : "left-0.5"
              )} />
            </div>
            <input
              type="checkbox"
              className="hidden"
              checked={includeCheaper}
              onChange={e => setIncludeCheaper(e.target.checked)}
            />
            <span className="text-[11px] text-slate-600">الأرخص فقط</span>
          </label>
        </div>

        {/* Suggestions List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2.5 pt-1">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
          ) : !suggestions.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-3">
                <Pill className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-500">لا توجد بدائل مسجلة</p>
              <p className="text-xs text-slate-400 mt-1">لم يتم تسجيل بدائل لهذا الدواء في قاعدة البيانات بعد</p>
            </div>
          ) : (
            suggestions.map((alt: any) => {
              const safety = getSafetyConfig(alt.safetyLevel);
              const SafetyIcon = safety.icon;
              const isSelected = selectedAlt?.medicineId === alt.medicineId;
              const isBlocked = alt.safetyLevel === 'NOT_RECOMMENDED';

              return (
                <div
                  key={alt.medicineId}
                  onClick={() => !isBlocked && setSelectedAlt(alt)}
                  className={cn(
                    "relative p-3.5 rounded-xl border transition-all",
                    isSelected
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/20 shadow-sm"
                      : isBlocked
                        ? "border-rose-100 bg-rose-50/50 dark:bg-rose-950/10 cursor-not-allowed opacity-60"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-teal-300 hover:shadow-sm cursor-pointer"
                  )}
                >
                  {/* AI badge */}
                  {alt.isTopRecommendation && (
                    <div className="absolute -top-2.5 right-3">
                      <span className="inline-flex items-center gap-1 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                        <Sparkles className="w-2.5 h-2.5" /> AI
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-sm text-slate-800 dark:text-white">{alt.tradeName}</span>
                        {alt.isInClinicStock && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                            <Package className="w-2.5 h-2.5" /> في المخزن
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {alt.activeIngredient || '—'} · {alt.dosageForm || '—'}
                        {alt.strength && ` · ${alt.strength}`}
                      </p>

                      {/* Tags */}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {alt.reasons?.slice(0, 3).map((r: string, i: number) => (
                          <span key={i} className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full border",
                            r === 'متوفر في مخزن العيادة'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : r === 'البديل الأكثر استخداماً'
                                ? "bg-teal-50 text-teal-700 border-teal-200"
                                : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600"
                          )}>
                            {r}
                          </span>
                        ))}
                        {alt.historicalScore > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-violet-50 text-violet-600 border-violet-200">
                            {alt.historicalScore}× استبدال
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg border", safety.cls)}>
                        <SafetyIcon className="w-3 h-3" /> {safety.label}
                      </span>
                      {alt.price && (
                        <span className="text-sm font-bold text-teal-700">{alt.price}<span className="text-[10px] font-normal text-slate-400 mr-0.5">ج.م</span></span>
                      )}
                      {isSelected && <ChevronRight className="w-3 h-3 text-teal-500 rotate-180" />}
                    </div>
                  </div>

                  {/* Warnings */}
                  {alt.warnings?.length > 0 && (
                    <div className="mt-2.5 flex flex-col gap-1">
                      {alt.warnings.map((w: string, i: number) => (
                        <div key={i} className="flex items-center gap-1.5 text-[10px] text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-2 py-1.5">
                          <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Reason + Footer */}
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 px-5 py-4 space-y-3">
          {selectedAlt ? (
            <>
              <div className="flex items-center gap-2 text-xs text-teal-700 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                اخترت: <span className="font-bold">{selectedAlt.tradeName}</span>
              </div>
              <Textarea
                placeholder="سبب التحويل (مثال: ناقص في السوق، سعر أفضل، حساسية...)"
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={2}
                className="text-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl resize-none focus-visible:ring-teal-500"
              />
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                يُحفظ هذا السبب في السجل الطبي ويُحسّن توصيات الذكاء الاصطناعي
              </p>
            </>
          ) : (
            <p className="text-xs text-slate-400 text-center py-1">اختر بديلاً من القائمة أعلاه لتأكيد التحويل</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700"
            >
              إلغاء
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!selectedAlt || !reason.trim()}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white gap-1.5 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              تأكيد التحويل الدوائي
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
