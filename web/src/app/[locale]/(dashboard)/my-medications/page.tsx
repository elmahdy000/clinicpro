'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@/stores/auth';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Pill, Plus, Search, Heart, Star, Pencil, Trash2,
  ChevronRight, ChevronLeft, FlaskConical, HeartOff, FilePlus,
  ClipboardList, ArrowRightLeft, Stethoscope, Syringe, Loader2,
  CheckIcon, XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { toast } from 'sonner';

const SOURCE_LABELS: Record<string, { ar: string; en: string }> = {
  MANUAL: { ar: 'يدوي', en: 'Manual' },
  FROM_GLOBAL_DICTIONARY: { ar: 'من سجل الأدوية', en: 'From Medication Registry' },
  FROM_PRESCRIPTION_USAGE: { ar: 'من الوصفات الطبية', en: 'From Prescriptions' },
};

const SOURCE_COLORS: Record<string, string> = {
  MANUAL: 'bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-300 border-purple-100 dark:border-purple-900',
  FROM_GLOBAL_DICTIONARY: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300 border-blue-100 dark:border-blue-900',
  FROM_PRESCRIPTION_USAGE: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-100 dark:border-amber-900',
};

export default function MyMedicationsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useAuth();
  const canManage = user?.role === 'DOCTOR';
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterSource, setFilterSource] = useState('');
  const limit = 20;

  const [showAddModal, setShowAddModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['my-medicines', search, page, filterFavorites, filterSource],
    queryFn: () =>
      api.get('/my-medicines', {
        params: { search, page, limit, favorite: filterFavorites || undefined, source: filterSource || undefined },
      }).then((r) => r.data),
    enabled: !!user && (user.role === 'DOCTOR' || user.role === 'CLINIC_ADMIN'),
  });

  const medicines: any[] = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const stats = data?.stats || { total: 0, favorites: 0, manualCount: 0, totalUsageCount: 0 };

  const refetch = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['my-medicines'] });
  }, [qc]);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? 'هل أنت متأكد من إزالة هذا الدواء من أدويتي الخاصة؟' : 'Remove this medicine from your list?')) return;
    setDeleting(id);
    try { await api.delete(`/my-medicines/${id}`); refetch(); }
    finally { setDeleting(null); }
  };

  const toggleFavorite = async (id: number) => {
    try { await api.put(`/my-medicines/${id}/favorite`); refetch(); }
    catch { }
  };

  const openAdd = () => { setEditing(null); setShowAddModal(true); };
  const openEdit = (m: any) => { setEditing(m); setShowAddModal(true); };

  const BackPager = isRtl ? ChevronRight : ChevronLeft;
  const NextPager = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>

      {/*  Header  */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            {isRtl ? 'أدويتي الخاصة' : 'My Private Medicines'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isRtl
              ? 'الأدوية المحفوظة للاستخدام السريع داخل الوصفات'
              : 'Medicines saved for quick use in prescriptions'}
          </p>
        </div>
        <Button onClick={openAdd} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          {isRtl ? 'إضافة دواء خاص' : 'Add Private Medicine'}
        </Button>
      </div>

      {/*  Stats Banner  */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: isRtl ? 'إجمالي الأدوية' : 'Total', value: stats.total, icon: Pill, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30' },
          { label: isRtl ? 'المفضلة' : 'Favorites', value: stats.favorites, icon: Star, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
          { label: isRtl ? 'يدوي' : 'Manual', value: stats.manualCount, icon: FilePlus, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          { label: isRtl ? 'الأكثر استخداماً' : 'Most Used', value: stats.totalUsageCount, icon: Syringe, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="dashboard-card">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/*  Search + Filters  */}
      <Card className="border-gray-200/80 dark:border-gray-800/80">
        <CardContent className="p-3 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={isRtl ? 'ابحث في أدويتي الخاصة بالاسم أو المادة الفعالة' : 'Search in your private medicines...'}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className={isRtl ? 'pr-9 text-right' : 'pl-9'}
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center border-t pt-2">
            <button
              onClick={() => { setFilterFavorites(!filterFavorites); setPage(1); }}
              className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-colors ${filterFavorites
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
                }`}
            >
              <Star className="w-3 h-3" />
              {isRtl ? 'المفضلة فقط' : 'Favorites only'}
            </button>

            {['', 'MANUAL', 'FROM_GLOBAL_DICTIONARY', 'FROM_PRESCRIPTION_USAGE'].map((src) => {
              const label = !src
                ? (isRtl ? 'الكل' : 'All')
                : (isRtl ? SOURCE_LABELS[src]?.ar : SOURCE_LABELS[src]?.en) || src;
              return (
                <button
                  key={src}
                  onClick={() => { setFilterSource(src); setPage(1); }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${filterSource === src
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/*  Table  */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : medicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FlaskConical className="w-14 h-14 opacity-20 mb-4" />
              <p className="text-base font-semibold text-gray-500">
                {isRtl ? 'لا توجد أدوية خاصة بعد' : 'No private medicines yet'}
              </p>
              <p className="text-sm mt-1 text-gray-400 max-w-sm text-center">
                {isRtl
                  ? 'أضف الأدوية التي تستخدمها بكثرة لتظهر هنا أثناء كتابة الوصفة'
                  : 'Add medicines you frequently use so they appear here when writing a prescription'}
              </p>
              <Button onClick={openAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 gap-1.5">
                <Plus className="w-4 h-4" /> {isRtl ? 'إضافة أول دواء' : 'Add First Medicine'}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60 text-right">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-[36px]">#</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'اسم الدواء' : 'Medicine'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'المادة الفعالة' : 'Ingredient'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'التصنيف' : 'Category'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'الشكل' : 'Form'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'الجرعة الافتراضية' : 'Default Dose'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{isRtl ? 'المصدر' : 'Source'}</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {medicines.map((m: any, idx: number) => (
                    <tr key={m.id} className="hover:bg-teal-50/40 dark:hover:bg-teal-950/10 transition-colors group">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {m.tradeName}
                              {m.isFavorite && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </p>
                            {m.strength && (
                              <p className="text-[11px] text-gray-400">{m.strength}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {m.activeIngredient || <span className="text-gray-300"></span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.therapeuticClass ? (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            {m.therapeuticClass}
                          </span>
                        ) : <span className="text-gray-300 text-sm"></span>}
                      </td>
                      <td className="px-4 py-3">
                        {m.dosageForm ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                            {m.dosageForm}
                          </span>
                        ) : <span className="text-gray-300 text-sm"></span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {[m.defaultDose, m.defaultFrequency, m.defaultDuration].filter(Boolean).join(' / ') || <span className="text-gray-300"></span>}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className={`text-[10px] font-medium border ${SOURCE_COLORS[m.source] || ''}`}>
                          {isRtl
                            ? (SOURCE_LABELS[m.source]?.ar || m.source)
                            : (SOURCE_LABELS[m.source]?.en || m.source)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" onClick={() => toggleFavorite(m.id)}
                            className="h-7 w-7 p-0 hover:text-amber-500"
                            title={isRtl ? (m.isFavorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة') : (m.isFavorite ? 'Remove from favorites' : 'Add to favorites')}>
                            {m.isFavorite ? <HeartOff className="w-3.5 h-3.5" /> : <Heart className="w-3.5 h-3.5" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(m)}
                            className="h-7 w-7 p-0 hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/30">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(m.id)} disabled={deleting === m.id}
                            className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {meta.totalPages > 1 && (
          <div className="border-t px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {isRtl
                ? `${(page - 1) * limit + 1} - ${Math.min(page * limit, meta.total)} من ${meta.total}`
                : `${(page - 1) * limit + 1} - ${Math.min(page * limit, meta.total)} of ${meta.total}`}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <BackPager className="w-4 h-4" />
              </Button>
              <span className="flex items-center px-3 text-sm text-gray-600">{page} / {meta.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}>
                <NextPager className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/*  Add/Edit Modal  */}
      <MedicationFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        medication={editing}
        onSaved={refetch}
        isRtl={isRtl}
      />
    </div>
  );
}

function normalizeDedup(text: string): string {
  return (text || '')
    .trim()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[ًٌٍَُِّْ]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

const STRENGTH_SUGGESTIONS = ['125mg', '250mg', '400mg', '500mg', '625mg', '1g', '5mg', '10mg', '20mg', '100mg/ml', '250mg/5ml'];

const DOSAGE_FORM_OPTIONS = [
  'أقراص', 'كبسولات', 'شراب', 'نقط', 'حقن', 'كريم', 'مرهم', 'جل',
  'بخاخ', 'لبوس', 'أكياس', 'محلول', 'قطرة عين', 'قطرة أذن',
  'محلول وريدي', 'لصقة', 'غسول', 'استنشاق'
].map(l => ({ value: l, label: l }));

const ROUTE_OPTIONS = [
  'بالفم', 'حقن عضل', 'حقن وريد', 'تحت الجلد', 'موضعي',
  'قطرة عين', 'قطرة أذن', 'استنشاق', 'شرجي', 'مهبلي', 'أنفي',
  'وريدي', 'حسب تعليمات الطبيب'
].map(l => ({ value: l, label: l }));

const THERAPEUTIC_CLASS_OPTIONS = [
  'Antibiotic', 'Analgesic / Anti-inflammatory', 'Antihistamine',
  'Cardiovascular', 'Gastrointestinal', 'Respiratory', 'Dermatology',
  'Diabetes', 'Hypertension', 'Neurology', 'Psychiatry',
  'Vitamins & Supplements', 'Ophthalmology', 'ENT', 'Gynecology',
  'Urology', 'Hormones', 'Antifungal', 'Antiviral', 'Other'
].map(l => ({ value: l, label: l }));

const FREQUENCY_OPTIONS = [
  'مرة يوميًا', 'مرتين يوميًا', '3 مرات يوميًا', 'كل 6 ساعات',
  'كل 8 ساعات', 'كل 12 ساعة', 'قبل الأكل', 'بعد الأكل',
  'عند اللزوم', 'قبل النوم', 'صباحًا', 'مساءً', 'أسبوعيًا',
  'حسب تعليمات الطبيب'
].map(l => ({ value: l, label: l }));

const DURATION_SUGGESTIONS = ['3 أيام', '5 أيام', '7 أيام', '10 أيام', '14 يوم', 'شهر', 'عند اللزوم', 'حسب تعليمات الطبيب'];

const DOSE_SUGGESTIONS_BY_FORM: Record<string, string[]> = {
  'أقراص': ['قرص', 'قرصين', 'نصف قرص', 'قرص و نصف'],
  'كبسولات': ['كبسولة', 'كبسولتين', 'كيس'],
  'شراب': ['5 مل', '10 مل', 'ملعقة صغيرة', 'ملعقة كبيرة'],
  'نقط': ['نقطة', 'نقطتين', '3 نقط', '5 نقط'],
  'حقن': ['أمبول', 'حقنة', 'فيال'],
  'كريم': ['دهان طبقة خفيفة', 'دهان موضعي'],
  'مرهم': ['دهان طبقة خفيفة', 'دهان موضعي'],
  'جل': ['دهان طبقة خفيفة', 'دهان موضعي'],
  'بخاخ': ['بخة', 'بختين'],
  'قطرة عين': ['قطرة', 'قطرتين'],
  'قطرة أذن': ['قطرة', 'قطرتين'],
  'لبوس': ['لبوسة', 'لبوسة واحدة'],
};

const ROUTE_BY_FORM: Record<string, string> = {
  'أقراص': 'بالفم',
  'كبسولات': 'بالفم',
  'شراب': 'بالفم',
  'نقط': 'بالفم',
  'حقن': 'حقن عضل',
  'كريم': 'موضعي',
  'مرهم': 'موضعي',
  'جل': 'موضعي',
  'قطرة عين': 'قطرة عين',
  'قطرة أذن': 'قطرة أذن',
  'بخاخ': 'استنشاق',
  'لبوس': 'شرجي',
  'أكياس': 'بالفم',
  'محلول وريدي': 'وريدي',
};

const INSTRUCTION_CHIPS = [
  'بعد الأكل', 'قبل الأكل', 'مع كوب ماء', 'قبل النوم', 'عند اللزوم',
  'لا يستخدم على معدة فارغة', 'إيقاف الدواء عند ظهور حساسية',
  'تجنب القيادة بعد الاستخدام', 'رج العبوة جيدًا قبل الاستخدام',
  'يستخدم موضعيًا فقط', 'يحفظ بعيدًا عن متناول الأطفال',
  'حسب تعليمات الطبيب'
];

const ACTIVE_INGREDIENT_CLASS_MAP: Record<string, string> = {
  'ibuprofen': 'Analgesic / Anti-inflammatory',
  'paracetamol': 'Analgesic / Anti-inflammatory',
  'diclofenac': 'Analgesic / Anti-inflammatory',
  'amoxicillin': 'Antibiotic',
  'azithromycin': 'Antibiotic',
  'cefixime': 'Antibiotic',
  'metformin': 'Diabetes',
  'insulin': 'Diabetes',
  'omeprazole': 'Gastrointestinal',
  'ranitidine': 'Gastrointestinal',
  'atorvastatin': 'Cardiovascular',
  'enalapril': 'Hypertension',
  'amlodipine': 'Hypertension',
  'losartan': 'Hypertension',
  'cetirizine': 'Antihistamine',
  'loratadine': 'Antihistamine',
  'fluoxetine': 'Psychiatry',
};

function AutocompleteInput({ value, onChange, placeholder, disabled, fetchFn, renderOption, onSelect, isRtl }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  fetchFn: (q: string) => Promise<any[]>;
  renderOption: (item: any, select: (item: any) => void) => React.ReactNode;
  onSelect: (item: any) => void;
  isRtl: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!value.trim() || !open) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setResults(await fetchFn(value)); } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const t = e.target as Element;
      if (!t.closest('[data-autocomplete]')) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div className="relative" data-autocomplete>
      <input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)} placeholder={placeholder} disabled={disabled}
        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed transition-all" />
      {loading && (
        <Loader2 className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin ${isRtl ? 'left-3' : 'right-3'}`} />
      )}
      {open && value.trim() && !loading && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1.5 rounded-2xl bg-white border border-slate-200 shadow-xl max-h-[260px] overflow-y-auto p-1.5 space-y-0.5">
          {results.map((item, i) => (
            <div key={i}>{renderOption(item, (sel) => { onSelect(sel); setOpen(false); })}</div>
          ))}
        </div>
      )}
      {open && value.trim() && !loading && results.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-1.5 rounded-2xl bg-white border border-slate-200 shadow-xl p-4 text-center text-sm text-slate-400">
          {isRtl ? 'لا توجد نتائج مطابقة، يمكنك إدخال الدواء يدويًا.' : 'No matching results, you can enter manually.'}
        </div>
      )}
    </div>
  );
}

function MedicationFormModal({ isOpen, onClose, medication, onSaved, isRtl }: {
  isOpen: boolean;
  onClose: () => void;
  medication: any;
  onSaved: () => void;
  isRtl: boolean;
}) {
  const initForm = (med?: any) => ({
    medicineId: med?.medicineId || '',
    tradeName: med?.tradeName || '',
    activeIngredient: med?.activeIngredient || '',
    strength: med?.strength || '',
    dosageForm: med?.dosageForm || '',
    route: med?.route || '',
    therapeuticClass: med?.therapeuticClass || '',
    manufacturer: med?.manufacturer || '',
    defaultDose: med?.defaultDose || '',
    defaultFrequency: med?.defaultFrequency || '',
    defaultDuration: med?.defaultDuration || '',
    defaultInstructions: med?.defaultInstructions || '',
    isFavorite: med?.isFavorite || false,
    showInQuickSearch: med?.showInQuickSearch !== false,
    source: 'MANUAL',
  });

  const [form, setForm] = useState<any>(initForm(medication));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'dictionary' | 'manual'>(medication ? 'manual' : 'dictionary');

  useEffect(() => {
    if (isOpen) {
      setForm(initForm(medication));
      setError('');
      setActiveTab(medication ? 'manual' : 'dictionary');
    }
  }, [isOpen, medication]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  // autofill route when dosage form changes
  useEffect(() => {
    const route = ROUTE_BY_FORM[form.dosageForm];
    if (route && !form.route) {
      set('route', route);
    }
  }, [form.dosageForm]);

  const handleSelectMedicine = (med: any) => {
    setForm((f: any) => ({
      ...f,
      medicineId: med.id || '',
      tradeName: med.name || med.tradeName || '',
      activeIngredient: med.activeIngredient || '',
      strength: med.strength || f.strength,
      dosageForm: med.form || med.dosageForm || f.dosageForm,
      route: med.route || ROUTE_BY_FORM[med.form || med.dosageForm] || f.route,
      therapeuticClass: med.therapeuticClass || f.therapeuticClass,
      manufacturer: med.manufacturer || f.manufacturer,
      source: 'FROM_GLOBAL_DICTIONARY',
    }));
  };

  const handleSelectActiveIngredient = (item: any) => {
    setForm((f: any) => ({
      ...f,
      activeIngredient: item.name || item.activeIngredient || '',
      therapeuticClass: item.therapeuticClass || f.therapeuticClass,
    }));
  };

  const handleSubmit = async (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (!form.tradeName.trim()) {
      setError(isRtl ? 'اختر دواء من سجل الأدوية أو اكتب اسم الدواء يدويًا' : 'Select a medicine or type the name manually');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = {
        medicineId: form.medicineId || undefined,
        tradeName: form.tradeName.trim(),
        activeIngredient: form.activeIngredient || undefined,
        strength: form.strength || undefined,
        dosageForm: form.dosageForm || undefined,
        route: form.route || undefined,
        therapeuticClass: form.therapeuticClass || undefined,
        manufacturer: form.manufacturer || undefined,
        defaultDose: form.defaultDose || undefined,
        defaultFrequency: form.defaultFrequency || undefined,
        defaultDuration: form.defaultDuration || undefined,
        defaultInstructions: form.defaultInstructions || undefined,
        isFavorite: form.isFavorite === true,
        showInQuickSearch: form.showInQuickSearch !== false,
        source: form.source || 'MANUAL',
      };
      if (medication) {
        await api.put(`/my-medicines/${medication.id}`, payload);
      } else {
        await api.post('/my-medicines', payload);
      }
      onSaved();
      onClose();
      toast.success(isRtl ? 'تمت إضافة الدواء إلى أدويتك الخاصة' : 'Medicine added to your list');
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isRtl ? 'تعذر إضافة الدواء الآن' : 'Failed to add medicine');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const doseSuggestions = DOSE_SUGGESTIONS_BY_FORM[form.dosageForm] || [];

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px] p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-[720px] max-h-[90vh] flex flex-col overflow-hidden animate-scale-up" onClick={(e) => e.stopPropagation()} dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="shrink-0 bg-white border-b border-slate-100 p-5 pb-4">
          <h3 className="text-lg font-bold text-gray-900">{isRtl ? 'إضافة دواء جديد' : 'Add New Medicine'}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'احفظ دواء تستخدمه كثيرًا ليظهر سريعًا أثناء كتابة الروشتة' : 'Save a medicine you use frequently for quick access in prescriptions'}
          </p>
        </div>

        {/* Tab Switcher - Only shown when creating a new private medicine */}
        {!medication && (
          <div className="shrink-0 px-5 bg-white border-b border-slate-100 flex gap-5">
            <button
              type="button"
              onClick={() => {
                setActiveTab('dictionary');
                setForm(initForm());
              }}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'dictionary'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {isRtl ? 'إضافة سريعة من سجل الأدوية' : 'Quick Add from Registry'}
              {activeTab === 'dictionary' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-600 rounded-full" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('manual');
                setForm(initForm());
              }}
              className={`pb-3 text-sm font-semibold border-b-2 transition-all relative ${
                activeTab === 'manual'
                  ? 'border-teal-600 text-teal-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {isRtl ? 'تركيب دواء يدويًا' : 'Add Custom Manually'}
              {activeTab === 'manual' && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-600 rounded-full" />
              )}
            </button>
          </div>
        )}

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {activeTab === 'dictionary' ? (
            <div className="space-y-4">
              {/* Medicine Name Autocomplete / Preview */}
              {form.medicineId ? (
                <div className="p-4 rounded-2xl bg-teal-50/40 border border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100 uppercase tracking-wider">
                        {isRtl ? 'دواء من سجل الأدوية' : 'From Medication Registry'}
                      </span>
                      {form.manufacturer && (
                        <span className="text-[11px] text-slate-500 font-medium">{form.manufacturer}</span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-slate-800">{form.tradeName}</h4>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 pt-1">
                      {form.activeIngredient && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">{isRtl ? 'المادة:' : 'Active:'}</span>
                          <span>{form.activeIngredient}</span>
                        </div>
                      )}
                      {form.strength && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">{isRtl ? 'التركيز:' : 'Strength:'}</span>
                          <span>{form.strength}</span>
                        </div>
                      )}
                      {form.dosageForm && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">{isRtl ? 'الشكل:' : 'Form:'}</span>
                          <span>{form.dosageForm}</span>
                        </div>
                      )}
                      {form.route && (
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-slate-700">{isRtl ? 'الطريق:' : 'Route:'}</span>
                          <span>{form.route}</span>
                        </div>
                      )}
                      {form.therapeuticClass && (
                        <div className="flex items-center gap-1 col-span-2">
                          <span className="font-semibold text-slate-700">{isRtl ? 'التصنيف:' : 'Class:'}</span>
                          <span className="text-teal-700 font-medium">{form.therapeuticClass}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setForm(initForm())}
                    className="shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all"
                  >
                    {isRtl ? 'تغيير الدواء' : 'Change Medicine'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'ابحث عن اسم الدواء' : 'Search Brand Name'} <span className="text-rose-500">*</span></label>
                    <AutocompleteInput
                      value={form.tradeName}
                      onChange={(v) => setForm((f: any) => ({ ...f, tradeName: v, source: 'MANUAL', medicineId: '' }))}
                      placeholder={isRtl ? 'مثال: Brufen 400mg, Panadol...' : 'e.g. Brufen 400mg, Panadol...'}
                      isRtl={isRtl}
                      fetchFn={async (q) => {
                        const res = await api.get('/medications/search', { params: { q } });
                        return res.data || [];
                      }}
                      onSelect={handleSelectMedicine}
                      renderOption={(item, select) => (
                        <button type="button" onClick={() => select(item)}
                          className="flex w-full items-start gap-3 px-3 py-2.5 rounded-xl text-right hover:bg-cyan-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                              {item.activeIngredient && <span>{item.activeIngredient}</span>}
                              {item.strength && <><span className="text-slate-300">|</span><span>{item.strength}</span></>}
                              {item.form && <><span className="text-slate-300">|</span><span>{item.form}</span></>}
                              {item.manufacturer && <><span className="text-slate-300">|</span><span>{item.manufacturer}</span></>}
                            </div>
                          </div>
                          <CheckIcon className="size-4 shrink-0 mt-0.5 text-cyan-600" />
                        </button>
                      )}
                    />
                  </div>
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 px-6 text-center">
                    <Search className="w-10 h-10 text-teal-600/70 animate-pulse mb-3" />
                    <p className="text-sm font-bold text-slate-700">{isRtl ? 'ابحث في سجل الأدوية الموحد' : 'Search Unified Medication Registry'}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[360px]">
                      {isRtl 
                        ? 'اكتب اسم الدواء التجاري وسنتولى تعبئة كافة التفاصيل العلمية والتركيبية والتصنيف تلقائيًا من سجل الأدوية.' 
                        : 'Search a medicine to instantly auto-populate chemical ingredients, concentrations, forms, and therapeutic classes.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 animate-fade-in">
              {/* Manual Entry Form */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{isRtl ? 'اسم الدواء التجاري' : 'Brand / Trade Name'} <span className="text-rose-500">*</span></label>
                <input value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)}
                  placeholder={isRtl ? 'مثال: Brufen 400mg' : 'e.g. Brufen 400mg'}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all" />
              </div>

              {/* Technical / Scientific data */}
              <div>
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-teal-600" />
                  {isRtl ? 'التركيبة العلمية والبيانات الفنية' : 'Scientific & Technical Data'}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Active Ingredient */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'المادة الفعالة' : 'Active Ingredient'}</label>
                    <AutocompleteInput
                      value={form.activeIngredient}
                      onChange={(v) => set('activeIngredient', v)}
                      placeholder={isRtl ? 'مثال: Ibuprofen' : 'e.g. Ibuprofen'}
                      isRtl={isRtl}
                      fetchFn={async (q) => {
                        const res = await api.get('/medications/active-ingredients', { params: { q } });
                        return res.data || [];
                      }}
                      onSelect={handleSelectActiveIngredient}
                      renderOption={(item, select) => (
                        <button type="button" onClick={() => select(item)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-right hover:bg-cyan-50 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                            {item.therapeuticClass && <p className="text-[11px] text-slate-500">{item.therapeuticClass}</p>}
                          </div>
                          <CheckIcon className="size-4 shrink-0 text-cyan-600" />
                        </button>
                      )}
                    />
                  </div>

                  {/* Strength */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'التركيز' : 'Strength'}</label>
                    <input value={form.strength} onChange={(e) => set('strength', e.target.value)}
                      placeholder={isRtl ? 'مثال: 400mg' : 'e.g. 400mg'}
                      className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all" />
                    {form.strength === '' && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {STRENGTH_SUGGESTIONS.map((s) => (
                          <button type="button" key={s} onClick={() => set('strength', s)}
                            className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Dosage Form */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'الشكل الدوائي' : 'Dosage Form'}</label>
                    <SearchableSelect
                      value={form.dosageForm}
                      options={DOSAGE_FORM_OPTIONS}
                      onChange={(v) => { set('dosageForm', v); }}
                      placeholder={isRtl ? 'مثال: أقراص' : 'e.g. Tablets'}
                      searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
                      noResultsText={isRtl ? 'لا توجد نتائج' : 'No results'}
                      rtl={isRtl}
                    />
                  </div>

                  {/* Route */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'طريق الإعطاء' : 'Route'}</label>
                    <SearchableSelect
                      value={form.route}
                      options={ROUTE_OPTIONS}
                      onChange={(v) => set('route', v)}
                      placeholder={isRtl ? 'مثال: بالفم' : 'e.g. Oral'}
                      searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
                      noResultsText={isRtl ? 'لا توجد نتائج' : 'No results'}
                      rtl={isRtl}
                    />
                  </div>

                  {/* Therapeutic Class */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'التصنيف العلاجي' : 'Therapeutic Class'}</label>
                    <SearchableSelect
                      value={form.therapeuticClass}
                      options={THERAPEUTIC_CLASS_OPTIONS}
                      onChange={(v) => set('therapeuticClass', v)}
                      placeholder={isRtl ? 'مثال: Analgesic' : 'e.g. Analgesic'}
                      searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
                      noResultsText={isRtl ? 'لا توجد نتائج' : 'No results'}
                      rtl={isRtl}
                    />
                  </div>

                  {/* Manufacturer */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">{isRtl ? 'الشركة المصنعة' : 'Manufacturer'}</label>
                    <AutocompleteInput
                      value={form.manufacturer}
                      onChange={(v) => set('manufacturer', v)}
                      placeholder={isRtl ? 'مثال: Abbott' : 'e.g. Abbott'}
                      isRtl={isRtl}
                      fetchFn={async (q) => {
                        const res = await api.get('/medications/manufacturers', { params: { q } });
                        return (res.data || []).map((m: string) => ({ name: m }));
                      }}
                      onSelect={(item) => set('manufacturer', item.name || item)}
                      renderOption={(item, select) => (
                        <button type="button" onClick={() => select(item)}
                          className="flex w-full items-center gap-2 px-3 py-2.5 rounded-xl text-right hover:bg-cyan-50 transition-colors">
                          <span className="text-sm font-medium text-slate-800 flex-1">{item.name}</span>
                          <CheckIcon className="size-4 shrink-0 text-cyan-600" />
                        </button>
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Prescription Defaults */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-teal-600" />
              {isRtl ? 'إعدادات الروشتة الافتراضية' : 'Prescription Defaults'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Default Dose */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{isRtl ? 'الجرعة الافتراضية' : 'Default Dose'}</label>
                <input value={form.defaultDose} onChange={(e) => set('defaultDose', e.target.value)}
                  placeholder={isRtl ? 'مثال: قرص' : 'e.g. 1 tab'}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all" />
                {doseSuggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {doseSuggestions.map((s) => (
                      <button type="button" key={s} onClick={() => set('defaultDose', s)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Frequency */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{isRtl ? 'التكرار الافتراضي' : 'Default Frequency'}</label>
                <SearchableSelect
                  value={form.defaultFrequency}
                  options={FREQUENCY_OPTIONS}
                  onChange={(v) => set('defaultFrequency', v)}
                  placeholder={isRtl ? 'مثال: مرتين يوميًا' : 'e.g. Twice daily'}
                  searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
                  noResultsText={isRtl ? 'لا توجد نتائج' : 'No results'}
                  rtl={isRtl}
                />
              </div>

              {/* Duration */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">{isRtl ? 'المدة الافتراضية' : 'Default Duration'}</label>
                <input value={form.defaultDuration} onChange={(e) => set('defaultDuration', e.target.value)}
                  placeholder={isRtl ? 'مثال: 5 أيام' : 'e.g. 5 days'}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none transition-all" />
                {form.defaultDuration === '' && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {DURATION_SUGGESTIONS.map((s) => (
                      <button type="button" key={s} onClick={() => set('defaultDuration', s)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-1 mt-3">
              <label className="text-sm font-medium text-gray-700">{isRtl ? 'تعليمات إضافية' : 'Instructions'}</label>
              <textarea value={form.defaultInstructions} onChange={(e) => set('defaultInstructions', e.target.value)} rows={2}
                placeholder={isRtl ? 'مثال: بعد الأكل' : 'e.g. After meals'}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 focus:outline-none resize-none transition-all" />
              <div className="flex flex-wrap gap-1.5">
                {INSTRUCTION_CHIPS.map((chip) => (
                  <button type="button" key={chip} onClick={() =>
                    set('defaultInstructions', (form.defaultInstructions ? form.defaultInstructions + ' | ' : '') + chip)
                  }
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-colors whitespace-nowrap">
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Usage Options */}
          <div className="border-t border-slate-100 pt-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-teal-600" />
              {isRtl ? 'خيارات الاستخدام' : 'Usage Options'}
            </h4>
            <div className="space-y-3">
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 text-right transition",
                  form.isFavorite
                    ? "border-cyan-200 bg-cyan-50/40"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{isRtl ? 'مفضّل' : 'Favorite'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'يظهر الدواء في أعلى قائمة الأدوية الخاصة' : 'Medicine appears at the top of your private list'}</p>
                </div>
                <button type="button" role="switch" dir="ltr" aria-checked={form.isFavorite}
                  onClick={() => set('isFavorite', !form.isFavorite)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-1 ${form.isFavorite ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-slate-200'}`}>
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${form.isFavorite ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </label>
              <label
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 text-right transition",
                  form.showInQuickSearch
                    ? "border-cyan-200 bg-cyan-50/40"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                )}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{isRtl ? 'ظهور في البحث السريع' : 'Show in quick search'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{isRtl ? 'يمكن الوصول إليه بسرعة أثناء كتابة روشتة جديدة' : 'Quick access when writing a new prescription'}</p>
                </div>
                <button type="button" role="switch" dir="ltr" aria-checked={form.showInQuickSearch}
                  onClick={() => set('showInQuickSearch', !form.showInQuickSearch)}
                  className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-100 focus:ring-offset-1 ${form.showInQuickSearch ? 'border-teal-600 bg-teal-600' : 'border-slate-300 bg-slate-200'}`}>
                  <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${form.showInQuickSearch ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </label>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2.5 rounded-xl">
              {error}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="shrink-0 bg-white border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}
              className="rounded-xl border-slate-200 text-gray-700 h-11 px-6">
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={loading || !form.tradeName.trim()}
              className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white h-11 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {loading
                ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
                : (isRtl ? 'إضافة إلى أدويتي الخاصة' : 'Add to My Medicines')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}


