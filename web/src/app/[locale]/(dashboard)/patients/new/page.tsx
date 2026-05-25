'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';
import { useState } from 'react';

// Egyptian Governorates & Cities Database
const EGYPT_GOVERNORATES = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', cities: ['مدينة نصر', 'مصر الجديدة', 'المعادي', 'التجمع الخامس', 'وسط البلد', 'حلوان', 'شبرا', 'الزيتون', 'حدائق القبة', 'مصر القديمة'] },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', cities: ['الدقي', 'المهندسين', 'الهرم', 'فيصل', '6 أكتوبر', 'الشيخ زايد', 'العمرانية', 'الوراق', 'العجوزة', 'البدرشين'] },
  { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', cities: ['سموحة', 'ميامي', 'سيدي بشر', 'العجمي', 'المنشية', 'المنتزة', 'لوران', 'جليم', 'العصافرة', 'باكوس'] },
  { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia', cities: ['بنها', 'شبرا الخيمة', 'العبور', 'قليوب', 'طوخ', 'القناطر الخيرية', 'الخانكة', 'شبين القناطر'] },
  { id: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia', cities: ['المنصورة', 'ميت غمر', 'السنبلاوين', 'طلخا', 'دكرنس', 'بلقاس', 'شربين', 'الجمالية'] },
  { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia', cities: ['الزقازيق', 'العاشر من رمضان', 'بلبيس', 'منيا القمح', 'أبو حماد', 'فاقوس', 'ديرب نجم', 'مشتول السوق'] },
  { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia', cities: ['طنطا', 'المحلة الكبرى', 'كفر الزيات', 'زفتى', 'بسيون', 'السنطة', 'قطور', 'سمنود'] },
  { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira', cities: ['دمنهور', 'كفر الدوار', 'كوم حمادة', 'رشيد', 'إيتاي البارود', 'أبو المطامير', 'أبو حمص', 'حوش عيسى'] },
  { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia', cities: ['شبين الكوم', 'مدينة السادات', 'منوف', 'أشمون', 'تلا', 'قويسنا', 'الشهداء', 'بركة السبع'] },
  { id: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta', cities: ['دمياط القديمة', 'رأس البر', 'دمياط الجديدة', 'فارسكور', 'الزرقا', 'كفر البطيخ'] },
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', cities: ['الإسماعيلية', 'التل الكبير', 'فايد', 'القنطرة شرق', 'القنطرة غرب', 'القصاصين'] },
  { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said', cities: ['بورسعيد', 'بورفؤاد'] },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez', cities: ['السويس', 'حي الأربعين', 'حي الجناين', 'حي فيصل', 'حي عتاقة'] },
  { id: 'fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum', cities: ['الفيوم', 'سنورس', 'إبشواي', 'إطسا', 'طامية', 'يوسف الصديق'] },
  { id: 'beni_suef', nameAr: 'بني سويف', nameEn: 'Beni Suef', cities: ['بني سويف', 'ناصر', 'ببا', 'سمسطا', 'الفشن', 'اهناسيا', 'الواسطى'] },
  { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya', cities: ['المنيا', 'ملوي', 'مغاغة', 'بني مزار', 'أبو قرقاص', 'سمالوط', 'دير مواس', 'مطاي'] },
  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut', cities: ['أسيوط', 'ديروط', 'منفلوط', 'أبو تيج', 'صدفا', 'القوصية', 'ساحل سليم', 'أبنوب'] },
  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag', cities: ['سوهاج', 'طهطا', 'جرجا', 'البلينا', 'أخميم', 'المراغة', 'المنشأة', 'ساقلتة'] },
  { id: 'qena', nameAr: 'قنا', nameEn: 'Qena', cities: ['قنا', 'نجع حمادي', 'دشنا', 'قوص', 'أبو تشت', 'قفط', 'نقادة', 'فرشوط'] },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', cities: ['الأقصر', 'إسنا', 'أرمنت', 'القرنة', 'البياضية', 'الطود'] },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', cities: ['أسوان', 'كوم أمبو', 'إدفو', 'نصر النوبة', 'دراو'] },
  { id: 'red_sea', nameAr: 'البحر الأحمر', nameEn: 'Red Sea', cities: ['الغردقة', 'سفاجا', 'القصير', 'مرسى علم', 'شلاتين', 'حلايب', 'رأس غارب'] },
  { id: 'new_valley', nameAr: 'الوادي الجديد', nameEn: 'New Valley', cities: ['الخارجة', 'الداخلة', 'الفرافرة', 'باريس', 'بلاط'] },
  { id: 'matrouh', nameAr: 'مطروح', nameEn: 'Matrouh', cities: ['مرسى مطروح', 'السلوم', 'سيوة', 'الضبعة', 'العلمين', 'الحمام', 'النجيلة'] },
  { id: 'north_sinai', nameAr: 'شمال سيناء', nameEn: 'North Sinai', cities: ['العريش', 'بئر العبد', 'الشيخ زويد', 'رفح', 'الحسنة'] },
  { id: 'south_sinai', nameAr: 'جنوب سيناء', nameEn: 'South Sinai', cities: ['شرم الشيخ', 'دهب', 'طور سيناء', 'نويبع', 'طابا', 'سانت كاترين', 'أبو رديس', 'أبو زنيمة'] }
];

const patientSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phone: z.string().min(6, 'Invalid phone'),
  gender: z.string().min(1, 'Required'),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  governorate: z.string().optional(),
  city: z.string().optional(),
  bloodGroup: z.string().optional(),
  allergies: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContact: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  // Date of Birth 3-scroll selects
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');

  // Structured medical history fields
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([]);
  const [surgeries, setSurgeries] = useState('');
  const [familyHistory, setFamilyHistory] = useState('');
  const [continuousMedications, setContinuousMedications] = useState('');

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      gender: '',
      nationalId: '',
      dateOfBirth: '',
      address: '',
      governorate: '',
      city: '',
      bloodGroup: '',
      allergies: '',
      medicalHistory: '',
      emergencyContact: '',
    }
  });

  const mutation = useMutation({
    mutationFn: (data: PatientForm) => api.post('/patients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      toast.success(tc('save'));
      router.push(`/${locale}/patients`);
    },
    onError: () => toast.error(tc('error')),
  });

  // Sync date of birth value to form
  const updateDob = (day: string, month: string, year: string) => {
    if (day && month && year) {
      form.setValue('dateOfBirth', `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
    } else {
      form.setValue('dateOfBirth', '');
    }
  };

  const onSubmit = (data: PatientForm) => {
    const historyParts = [];
    if (chronicDiseases.length > 0) {
      historyParts.push(`${isRtl ? 'الأمراض المزمنة' : 'Chronic Diseases'}: ${chronicDiseases.join('، ')}`);
    }
    if (surgeries.trim() !== '') {
      historyParts.push(`${isRtl ? 'العمليات السابقة' : 'Surgeries'}: ${surgeries}`);
    }
    if (familyHistory.trim() !== '') {
      historyParts.push(`${isRtl ? 'التاريخ العائلي' : 'Family History'}: ${familyHistory}`);
    }
    if (continuousMedications.trim() !== '') {
      historyParts.push(`${isRtl ? 'الأدوية المستمرة' : 'Continuous Medications'}: ${continuousMedications}`);
    }

    const finalData = {
      ...data,
      medicalHistory: historyParts.join(' | ') || data.medicalHistory || '',
    };
    mutation.mutate(finalData);
  };

  // Dynamic Cities list based on selected Governorate
  const govObj = EGYPT_GOVERNORATES.find(g => g.id === selectedGovernorate);
  const citiesList = govObj ? govObj.cities : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3 animate-fade-in-down">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="transition-all duration-150 hover:bg-gray-100 dark:hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('addNew')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
          <CardHeader>
            <CardTitle className="text-base">{t('basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('firstName')}</Label>
              <Input {...form.register('firstName')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('lastName')}</Label>
              <Input {...form.register('lastName')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('phone')}</Label>
              <Input {...form.register('phone')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{t('gender')}</Label>
              <Select onValueChange={(v) => form.setValue('gender', String(v ?? ''))}>
                <SelectTrigger className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"><SelectValue placeholder={tc('select')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">{tc('male')}</SelectItem>
                  <SelectItem value="Female">{tc('female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'الرقم القومي' : 'National ID'}</Label>
              <Input {...form.register('nationalId')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>{t('dateOfBirth')}</Label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={dobDay}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDobDay(val);
                    updateDob(val, dobMonth, dobYear);
                  }}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">{isRtl ? 'اليوم' : 'Day'}</option>
                  {Array.from({ length: 31 }, (_, i) => String(i + 1)).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={dobMonth}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDobMonth(val);
                    updateDob(dobDay, val, dobYear);
                  }}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">{isRtl ? 'الشهر' : 'Month'}</option>
                  {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                    <option key={m} value={m}>
                      {m} {isRtl ? `(${[
                        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                      ][Number(m) - 1]})` : ''}
                    </option>
                  ))}
                </select>

                <select
                  value={dobYear}
                  onChange={(e) => {
                    const val = e.target.value;
                    setDobYear(val);
                    updateDob(dobDay, dobMonth, val);
                  }}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-3 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="">{isRtl ? 'السنة' : 'Year'}</option>
                  {Array.from({ length: 110 }, (_, i) => String(new Date().getFullYear() - i)).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'العنوان بالتفصيل' : 'Street Address'}</Label>
              <Input {...form.register('address')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>

            {/* Governorate & City Dropdowns */}
            <div className="space-y-2">
              <Label>{isRtl ? 'المحافظة' : 'Governorate'}</Label>
              <select
                value={selectedGovernorate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedGovernorate(val);
                  form.setValue('governorate', val);
                  setSelectedCity('');
                  form.setValue('city', '');
                }}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              >
                <option value="">{isRtl ? 'اختر المحافظة...' : 'Select Governorate...'}</option>
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov.id} value={gov.id}>
                    {isRtl ? gov.nameAr : gov.nameEn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>{isRtl ? 'المدينة / المنطقة' : 'City / Region'}</Label>
              <select
                value={selectedCity}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCity(val);
                  form.setValue('city', val);
                }}
                disabled={!selectedGovernorate}
                className="w-full h-12 rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">{isRtl ? 'اختر المدينة...' : 'Select City...'}</option>
                {citiesList.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader>
            <CardTitle className="text-base">{t('medicalInfo')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('bloodGroup')}</Label>
                <Select onValueChange={(v) => form.setValue('bloodGroup', String(v ?? ''))}>
                  <SelectTrigger className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"><SelectValue placeholder={tc('select')} /></SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('allergies')}</Label>
                <Input {...form.register('allergies')} placeholder={tc('none')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
              </div>
            </div>

            {/* Structured Medical History */}
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {isRtl ? 'الأمراض المزمنة (اختر ما ينطبق)' : 'Chronic Diseases (Select all that apply)'}
                </Label>
                <div className="flex flex-wrap gap-2.5">
                  {[
                    { id: 'diabetes', ar: 'السكري', en: 'Diabetes' },
                    { id: 'hypertension', ar: 'ضغط الدم المرتفع', en: 'Hypertension' },
                    { id: 'cardiac', ar: 'أمراض القلب', en: 'Cardiac Disease' },
                    { id: 'asthma', ar: 'الربو / حساسية الصدر', en: 'Asthma / Chest Allergy' },
                    { id: 'thyroid', ar: 'اضطرابات الغدة الدرقية', en: 'Thyroid Disorders' },
                    { id: 'liver', ar: 'أمراض الكبد', en: 'Liver Disease' },
                    { id: 'kidney', ar: 'الفشل الكلوي / أمراض الكلى', en: 'Kidney Disease' },
                  ].map((disease) => {
                    const label = isRtl ? disease.ar : disease.en;
                    const isChecked = chronicDiseases.includes(label);
                    return (
                      <button
                        key={disease.id}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            setChronicDiseases(chronicDiseases.filter(d => d !== label));
                          } else {
                            setChronicDiseases([...chronicDiseases, label]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200 ${
                          isChecked
                            ? 'bg-teal-500 text-white border-teal-500 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{isRtl ? 'العمليات الجراحية السابقة' : 'Previous Surgeries'}</Label>
                  <Input
                    value={surgeries}
                    onChange={(e) => setSurgeries(e.target.value)}
                    placeholder={isRtl ? 'مثال: استئصال الزائدة، غضروف' : 'e.g. Appendectomy'}
                    className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'التاريخ العائلي المرضي' : 'Family Disease History'}</Label>
                  <Input
                    value={familyHistory}
                    onChange={(e) => setFamilyHistory(e.target.value)}
                    placeholder={isRtl ? 'مثال: ضغط، سكري وراثي' : 'e.g. Genetic diabetes'}
                    className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isRtl ? 'الأدوية المستمرة عليها المريض' : 'Continuous Medications'}</Label>
                  <Input
                    value={continuousMedications}
                    onChange={(e) => setContinuousMedications(e.target.value)}
                    placeholder={isRtl ? 'مثال: أسبرين يومياً، كونكور' : 'e.g. Aspirin 81mg daily'}
                    className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-3">
          <CardHeader>
            <CardTitle className="text-base">{t('emergencyContact')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>{tc('phone')}</Label>
              <Input {...form.register('emergencyContact')} placeholder={tc('phone')} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end animate-fade-in-up delay-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="transition-all duration-150">{tc('cancel')}</Button>
          <Button type="submit" className="bg-teal-600 hover:bg-teal-700 gap-2 transition-all duration-150 hover:shadow-lg hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30" disabled={mutation.isPending}>
            <Save className="w-4 h-4" />
            {mutation.isPending ? tc('saving') : tc('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
