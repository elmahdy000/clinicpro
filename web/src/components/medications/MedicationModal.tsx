'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PremiumModal } from '@/components/ui/PremiumModal';
import { Pill, Globe, Building2, AlertCircle } from 'lucide-react';
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

interface MedicationForm {
  name: string;
  activeIngredient: string;
  manufacturer: string;
  category: string;
  strength: string;
  form: string;
  isGlobal: boolean;
}

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  medication?: MedicationForm & { id: number };
  onSaved: () => void;
  isAdmin?: boolean;
}

const EMPTY: MedicationForm = {
  name: '', activeIngredient: '', manufacturer: '',
  category: '', strength: '', form: '', isGlobal: false
};

const SELECT_CLS = "w-full h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-slate-200";

export function MedicationModal({ isOpen, onClose, medication, onSaved, isAdmin }: MedicationModalProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const key = medication?.id ?? '__create';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<MedicationForm>(medication || EMPTY);

  const set = (k: keyof MedicationForm, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(isRtl ? 'اسم الدواء مطلوب' : 'Name is required');
      return;
    }
    setLoading(true);
    try {
      if (medication) {
        await api.put(`/medications/${medication.id}`, form);
      } else {
        await api.post('/medications', form);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } } | null;
      setError(e?.response?.data?.message || (isRtl ? 'حدث خطأ' : 'Error occurred'));
    } finally {
      setLoading(false);
    }
  };

  const isEdit = !!medication;
  const title = isEdit
    ? (isRtl ? 'تعديل الدواء' : 'Edit Medicine')
    : (isRtl ? 'إضافة دواء جديد' : 'Add New Medicine');

  return (
    <PremiumModal
      key={key}
      open={isOpen}
      onClose={onClose}
      title={title}
      description={isRtl ? 'أدخل بيانات الدواء بدقة لضمان سلامة المريض' : 'Enter accurate medicine details for patient safety'}
      icon={<Pill className="w-5 h-5 text-white" />}
      headerColor="teal"
      size="md"
      footer={
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}
            className="rounded-xl border-slate-200 dark:border-slate-700">
            {isRtl ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            form="medication-form"
            disabled={loading}
            className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
          >
            {loading
              ? (isRtl ? 'جارٍ الحفظ...' : 'Saving...')
              : (isEdit ? (isRtl ? 'حفظ التعديلات' : 'Save Changes') : (isRtl ? 'إضافة الدواء' : 'Add Medicine'))}
          </Button>
        </div>
      }
    >
      <form id="medication-form" onSubmit={handleSubmit} className="p-5 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="med-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isRtl ? 'اسم الدواء (التجاري)' : 'Brand Name'} <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="med-name"
            placeholder={isRtl ? 'مثال: أموكسيل 500' : 'e.g. Amoxil 500'}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-right h-10"
            required
          />
        </div>

        {/* Active Ingredient + Strength */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="med-ingredient" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'المادة الفعّالة' : 'Active Ingredient'}
            </Label>
            <Input
              id="med-ingredient"
              placeholder={isRtl ? 'مثال: أموكسيسيلين' : 'e.g. Amoxicillin'}
              value={form.activeIngredient}
              onChange={e => set('activeIngredient', e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 text-right h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="med-strength" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'التركيز / الجرعة' : 'Strength'}
            </Label>
            <Input
              id="med-strength"
              placeholder={isRtl ? 'مثال: 500mg' : 'e.g. 500mg'}
              value={form.strength}
              onChange={e => set('strength', e.target.value)}
              className="rounded-xl border-slate-200 dark:border-slate-700 text-right h-10"
            />
          </div>
        </div>

        {/* Category + Form */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="med-category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'التصنيف' : 'Category'}
            </Label>
            <select id="med-category" value={form.category}
              onChange={e => set('category', e.target.value)} className={SELECT_CLS}>
              <option value="">{isRtl ? '-- اختر تصنيف --' : '-- Select --'}</option>
              {AR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="med-form" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isRtl ? 'الشكل الدوائي' : 'Dosage Form'}
            </Label>
            <select id="med-form" value={form.form}
              onChange={e => set('form', e.target.value)} className={SELECT_CLS}>
              <option value="">{isRtl ? '-- اختر شكل --' : '-- Select --'}</option>
              {AR_FORMS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        {/* Manufacturer */}
        <div className="space-y-1.5">
          <Label htmlFor="med-manufacturer" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {isRtl ? 'الشركة المصنّعة' : 'Manufacturer'}
          </Label>
          <Input
            id="med-manufacturer"
            placeholder={isRtl ? 'مثال: ابن سينا فارما' : 'e.g. Ibn Sina Pharma'}
            value={form.manufacturer}
            onChange={e => set('manufacturer', e.target.value)}
            className="rounded-xl border-slate-200 dark:border-slate-700 text-right h-10"
          />
        </div>

        {/* Source Toggle — admin only */}
        {isAdmin && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2 bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {isRtl ? 'مصدر الدواء' : 'Medicine Source'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set('isGlobal', true)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.isGlobal
                    ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/30 dark:border-blue-400 dark:text-blue-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                <Globe className="w-4 h-4" />
                {isRtl ? 'دواء عام (كل العيادات)' : 'Global (All Clinics)'}
              </button>
              <button type="button" onClick={() => set('isGlobal', false)}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  !form.isGlobal
                    ? 'bg-teal-50 border-teal-500 text-teal-700 dark:bg-teal-950/30 dark:border-teal-400 dark:text-teal-300'
                    : 'border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}>
                <Building2 className="w-4 h-4" />
                {isRtl ? 'دواء العيادة' : 'Clinic Specific'}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900 px-3 py-2.5 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </form>
    </PremiumModal>
  );
}
