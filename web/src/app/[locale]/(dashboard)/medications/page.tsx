'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { useState, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { MedicationModal } from '@/components/medications/MedicationModal';
import { PharmaInsights } from '@/components/medications/PharmaInsights';
import {
  Pill, Plus, Search, Globe, Building2, Pencil, Trash2,
  ChevronRight, ChevronLeft, X, SlidersHorizontal, FlaskConical, BarChart3
} from 'lucide-react';

const CATEGORY_COLORS: Record<string, string> = {
  'مضادات حيوية': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'مسكنات ألم': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  'خافضات حرارة': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  'أدوية قلب وأوعية': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  'أدوية سكري': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  'أدوية ضغط': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'أدوية جهاز هضمي': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'أدوية جهاز تنفسي': 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  'فيتامينات ومكملات': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  'أدوية جلدية': 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
};
const defaultCategoryColor = 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
const categoryColor = (cat?: string) => (cat && CATEGORY_COLORS[cat]) || defaultCategoryColor;

export default function MedicationsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useAuth();
  const isAdmin = user?.role === 'PLATFORM_OWNER';
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<'dictionary' | 'insights'>('dictionary');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [formFilter, setFormFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'' | 'global' | 'clinic'>('');
  const [showFilters, setShowFilters] = useState(false);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['medications', search, page, catFilter, formFilter, sourceFilter],
    queryFn: () =>
      api.get('/medications/table', {
        params: { search, page, limit, category: catFilter, form: formFilter, source: sourceFilter },
      }).then((r) => r.data),
  });

  const medications: any[] = data?.data || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };
  const filterOptions = data?.filters || { categories: [], forms: [] };


  const refetch = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['medications'] });
  }, [qc]);

  const handleDelete = async (id: number) => {
    if (!confirm(isRtl ? 'هل تريد حذف هذا الدواء من القاموس؟' : 'Delete this medicine?')) return;
    setDeleting(id);
    try { await api.delete(`/medications/${id}`); refetch(); }
    finally { setDeleting(null); }
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m: any) => { setEditing(m); setModalOpen(true); };

  const hasActiveFilter = catFilter || formFilter || sourceFilter;

  const clearFilters = () => {
    setCatFilter(''); setFormFilter(''); setSourceFilter(''); setPage(1);
  };

  const BackPager = isRtl ? ChevronRight : ChevronLeft;
  const NextPager = isRtl ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-4 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Pill className="w-6 h-6 text-teal-600" />
            {isRtl ? 'قاموس الأدوية' : 'Medicine Dictionary'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isRtl
              ? 'أدوية الروشتات — قاموس مشترك بين كل عيادات المنصة'
              : 'Medicines used in prescriptions — shared across all clinics'}
          </p>
        </div>
        <Button onClick={openAdd} className="h-9 bg-teal-600 hover:bg-teal-700 gap-1.5 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          {isRtl ? 'إضافة دواء' : 'Add Medicine'}
        </Button>
      </div>

      {/* ── Tabs Selector ── */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 mb-2">
        <button
          onClick={() => setActiveTab('dictionary')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'dictionary'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Pill className="w-4 h-4" />
          {isRtl ? 'قاموس الأدوية' : 'Medication Dictionary'}
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'insights'
              ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          {isRtl ? 'تحليلات الأدوية والشركات' : 'Pharma & Demographics Insights'}
        </button>
      </div>

      {activeTab === 'insights' ? (
        <PharmaInsights />
      ) : (
        <>
          {/* ── Stats Banner ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: isRtl ? 'إجمالي الأدوية' : 'Total Medicines',
                value: meta.total,
                icon: Pill,
                color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30',
              },
              {
                label: isRtl ? 'أدوية عامة' : 'Global Medicines',
                value: isRtl ? 'عام' : 'Global',
                icon: Globe,
                color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30',
              },
              {
                label: isRtl ? 'أدوية العيادة' : 'Clinic Custom',
                value: isRtl ? 'خاص' : 'Custom',
                icon: Building2,
                color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30',
              },
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
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{i === 0 ? meta.total : s.value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Search + Filters bar ── */}
          <Card className="border-gray-200/80 dark:border-gray-800/80">
            <CardContent className="p-3 space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
                  <Input
                    placeholder={isRtl ? 'ابحث بالاسم أو المادة الفعّالة أو التصنيف...' : 'Search by name, ingredient, or category...'}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className={isRtl ? 'pr-9 text-right' : 'pl-9'}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`gap-1.5 h-9 ${hasActiveFilter ? 'border-teal-500 text-teal-600 bg-teal-50 dark:bg-teal-950/20' : ''}`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  {isRtl ? 'فلاتر' : 'Filters'}
                  {hasActiveFilter && <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />}
                </Button>
                {hasActiveFilter && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-gray-400 hover:text-red-500 gap-1">
                    <X className="w-3.5 h-3.5" />
                    {isRtl ? 'مسح' : 'Clear'}
                  </Button>
                )}
              </div>

              {showFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t">
                  {/* Source Filter */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{isRtl ? 'المصدر' : 'Source'}</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {[
                        { v: '', label: isRtl ? 'الكل' : 'All' },
                        { v: 'global', label: isRtl ? 'عام' : 'Global', icon: Globe },
                        { v: 'clinic', label: isRtl ? 'خاص' : 'Clinic', icon: Building2 },
                      ].map((opt) => (
                        <button
                          key={opt.v}
                          onClick={() => { setSourceFilter(opt.v as any); setPage(1); }}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            sourceFilter === opt.v ? 'bg-teal-500 text-white border-teal-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {opt.icon && <opt.icon className="w-3 h-3" />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{isRtl ? 'التصنيف' : 'Category'}</p>
                    <select
                      value={catFilter}
                      onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">{isRtl ? '-- كل التصنيفات --' : '-- All Categories --'}</option>
                      {filterOptions.categories.map((c: string) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Form Filter */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">{isRtl ? 'الشكل الدوائي' : 'Form'}</p>
                    <select
                      value={formFilter}
                      onChange={(e) => { setFormFilter(e.target.value); setPage(1); }}
                      className="w-full h-8 rounded-md border border-input bg-background px-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="">{isRtl ? '-- كل الأشكال --' : '-- All Forms --'}</option>
                      {filterOptions.forms.map((f: string) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Table ── */}
          <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                </div>
              ) : medications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <FlaskConical className="w-14 h-14 opacity-20 mb-4" />
                  <p className="text-base font-semibold text-gray-500">{isRtl ? 'لا توجد أدوية' : 'No medicines found'}</p>
                  <p className="text-sm mt-1">
                    {search || hasActiveFilter
                      ? (isRtl ? 'جرّب تغيير الفلتر أو البحث' : 'Try changing filters or search')
                      : (isRtl ? 'ابدأ بإضافة أول دواء في القاموس' : 'Start by adding the first medicine')}
                  </p>
                  {!search && !hasActiveFilter && (
                    <Button onClick={openAdd} className="mt-4 bg-teal-600 hover:bg-teal-700 gap-1.5">
                      <Plus className="w-4 h-4" /> {isRtl ? 'إضافة دواء' : 'Add Medicine'}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px]">
                    <thead>
                      <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60 text-right">
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase w-[36px]">#</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'اسم الدواء' : 'Medicine'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'المادة الفعّالة' : 'Active Ingredient'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'التصنيف' : 'Category'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{isRtl ? 'الشكل' : 'Form'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{isRtl ? 'استخدام' : 'Usage'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{isRtl ? 'المصدر' : 'Source'}</th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {medications.map((m: any, idx: number) => (
                        <tr
                          key={m.id}
                          className="hover:bg-teal-50/40 dark:hover:bg-teal-950/10 transition-colors group"
                        >
                          <td className="px-4 py-3 text-xs text-gray-400 font-mono">
                            {(page - 1) * limit + idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{m.name}</p>
                              {m.strength && (
                                <p className="text-[11px] text-gray-400">{m.strength}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {m.activeIngredient || <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {m.category ? (
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${categoryColor(m.category)}`}>
                                {m.category}
                              </span>
                            ) : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {m.form ? (
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {m.form}
                              </span>
                            ) : <span className="text-gray-300 text-sm">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`text-sm font-bold ${(m.usageCount ?? 0) > 0 ? 'text-teal-600' : 'text-gray-300'}`}>
                              {m.usageCount ?? 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {m.isGlobal ? (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium">
                                <Globe className="w-3 h-3" />
                                {isRtl ? 'عام' : 'Global'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 font-medium">
                                <Building2 className="w-3 h-3" />
                                {isRtl ? 'عيادة' : 'Clinic'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost" size="sm"
                                onClick={() => openEdit(m)}
                                className="h-7 w-7 p-0 hover:bg-teal-100 hover:text-teal-700 dark:hover:bg-teal-900/30"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              {isAdmin && (
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => handleDelete(m.id)}
                                  disabled={deleting === m.id}
                                  className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="border-t px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {isRtl
                    ? `${(page - 1) * limit + 1}–${Math.min(page * limit, meta.total)} من ${meta.total} دواء`
                    : `${(page - 1) * limit + 1}–${Math.min(page * limit, meta.total)} of ${meta.total}`}
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
        </>
      )}

      <MedicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        medication={editing}
        onSaved={refetch}
        isAdmin={isAdmin}
      />
    </div>
  );
}
