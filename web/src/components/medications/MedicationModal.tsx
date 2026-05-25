'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pill, Globe, Building2 } from 'lucide-react';
import api from '@/lib/api';

const AR_CATEGORIES = [
  'مضادات حيوية', 'مسكنات ألم', 'خافضات حرارة', 'أدوية قلب وأوعية',
  'أدوية سكري', 'أدوية ضغط', 'أدوية جهاز هضمي', 'أدوية جهاز تنفسي',
  'أدوية جهاز عصبي', 'أدوية نفسية', 'فيتامينات ومكملات', 'أدوية جلدية',
  'أدوية عيون وأنف وأذن', 'هرمونات', 'أدوية مناعة', 'أدوية أورام',
  'أدوية كلى ومسالك', 'أدوية دم', 'أخرى',
];

const AR_FORMS = [
  'أقراص', 'كبسولات', 'شراب', 'قطرات', 'حقن', 'تحاميل', 'مرهم',
  'كريم', 'جل', 'بخاخ أنفي', 'بخاخ رئوي', 'لصقات', 'محلول وريدي',
  'مسحوق', 'أمبول', 'أخرى',
];

const EMPTY = { name: '', activeIngredient: '', manufacturer: '', category: '', strength: '', form: '', isGlobal: false };

export function MedicationModal({ isOpen, onClose, medication, onSaved, isAdmin }: any) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setForm(medication ? {
        name: medication.name || '',
        activeIngredient: medication.activeIngredient || '',
        manufacturer: medication.manufacturer || '',
        category: medication.category || '',
        strength: medication.strength || '',
        form: medication.form || '',
        isGlobal: medication.isGlobal ?? false,
      } : EMPTY);
    }
  }, [medication, isOpen]);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError(isRtl ? 'اسم الدواء مطلوب' : 'Name is required'); return; }
    setLoading(true);
    try {
      if (medication) {
        await api.put(`/medications/${medication.id}`, form);
      } else {
        await api.post('/medications', form);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || (isRtl ? 'حدث خطأ' : 'Error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!medication;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px]" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Pill className="w-4 h-4 text-teal-600" />
            {isEdit ? (isRtl ? 'تعديل الدواء' : 'Edit Medicine') : (isRtl ? 'إضافة دواء جديد' : 'Add Medicine')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="med-name" className="text-sm font-medium">
              {isRtl ? 'اسم الدواء (التجاري)' : 'Brand Name'} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="med-name"
              placeholder={isRtl ? 'مثال: أموكسيل 500' : 'e.g. Amoxil 500'}
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="text-right"
              required
            />
          </div>

          {/* Active Ingredient + Strength in a row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="med-ingredient" className="text-sm font-medium">
                {isRtl ? 'المادة الفعّالة' : 'Active Ingredient'}
              </Label>
              <Input
                id="med-ingredient"
                placeholder={isRtl ? 'مثال: أموكسيسيلين' : 'e.g. Amoxicillin'}
                value={form.activeIngredient}
                onChange={(e) => set('activeIngredient', e.target.value)}
                className="text-right"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-strength" className="text-sm font-medium">
                {isRtl ? 'التركيز / الجرعة' : 'Strength'}
              </Label>
              <Input
                id="med-strength"
                placeholder={isRtl ? 'مثال: 500mg' : 'e.g. 500mg'}
                value={form.strength}
                onChange={(e) => set('strength', e.target.value)}
                className="text-right"
              />
            </div>
          </div>

          {/* Category + Form dropdowns */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="med-category" className="text-sm font-medium">
                {isRtl ? 'التصنيف' : 'Category'}
              </Label>
              <select
                id="med-category"
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{isRtl ? '-- اختر تصنيف --' : '-- Select --'}</option>
                {AR_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="med-form" className="text-sm font-medium">
                {isRtl ? 'الشكل الدوائي' : 'Dosage Form'}
              </Label>
              <select
                id="med-form"
                value={form.form}
                onChange={(e) => set('form', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{isRtl ? '-- اختر شكل --' : '-- Select --'}</option>
                {AR_FORMS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Manufacturer */}
          <div className="space-y-1.5">
            <Label htmlFor="med-manufacturer" className="text-sm font-medium">
              {isRtl ? 'الشركة المصنّعة' : 'Manufacturer'}
            </Label>
            <Input
              id="med-manufacturer"
              placeholder={isRtl ? 'مثال: ابن سينا فارما' : 'e.g. Ibn Sina Pharma'}
              value={form.manufacturer}
              onChange={(e) => set('manufacturer', e.target.value)}
              className="text-right"
            />
          </div>

          {/* Source toggle — only for admins */}
          {isAdmin && (
            <div className="rounded-xl border p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{isRtl ? 'مصدر الدواء' : 'Medicine Source'}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set('isGlobal', true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.isGlobal ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/30' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  {isRtl ? 'دواء عام (كل العيادات)' : 'Global (All Clinics)'}
                </button>
                <button
                  type="button"
                  onClick={() => set('isGlobal', false)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    !form.isGlobal ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/30' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  {isRtl ? 'دواء العيادة' : 'Clinic Specific'}
                </button>
              </div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {isRtl ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700" disabled={loading}>
              {loading ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...') : (isRtl ? 'حفظ الدواء' : 'Save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
