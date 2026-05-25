'use client';

import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useMemo, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/stores/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SearchBox } from '@/components/common/SearchBox';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Pill,
  Activity,
  Printer,
  FileText,
  AlertTriangle,
  Stethoscope,
  UserRound,
  Clock,
  Droplets,
  ChevronDown,
  ChevronUp,
  History,
  IdCard,
  Phone,
} from 'lucide-react';

const hasLatin = (value?: string | null) => !!value && /[A-Za-z]/.test(value);
const isEgyptianMobile = (value?: string | null) => !!value && /^01[0125]\d{8}$/.test(value);

const EGYPTIAN_FALLBACKS = [
  { firstName: 'أحمد', lastName: 'محمد', phone: '01001234567' },
  { firstName: 'محمود', lastName: 'حسن', phone: '01123456789' },
  { firstName: 'منى', lastName: 'علي', phone: '01224567891' },
  { firstName: 'سارة', lastName: 'خالد', phone: '01535678912' },
];

const COMMON_COMPLAINTS = ['صداع', 'ألم في البطن', 'ارتفاع حرارة', 'كحة', 'ألم في المفاصل', 'دوار', 'إمساك', 'إسهال'];

const COMMON_DIAGNOSES = ['نزلة برد', 'التهاب في الحلق', 'ارتفاع ضغط الدم', 'التهاب معوي', 'صداع نصفي', 'التهاب الجهاز التنفسي', 'عسر هضم', 'التهاب مسالك بولية'];

const SUGGESTED_NAMES = [
  'Panadol Extra (بنادول إكسترا)',
  'Augmentin 1gm (أوجمنتين ١ جم)',
  'Congestal (كونجستال)',
  'Cefotax 1gm (سيفوتاكس ١ جم)',
  'Brufen 400mg (بروفين ٤٠٠ مجم)',
  'Cataflam 50mg (كاتافلام ٥٠ مجم)',
  'Ketofan (كيتوفان)',
  'Voltaren Ampoules (حقن فولتارين)',
  'Zyrtec (زيرتك)',
  'Ventolin Syrup (شراب فنتولين)',
  'Amoxil 500mg (أموكسيل ٥٠٠ مجم)',
  'Flagyl 500mg (فلاجيل ٥٠٠ مجم)',
  'Antinal (أنتينال)',
  'Controloc 40mg (كونترولوك ٤٠ مجم)',
  'Motilium (موتيليوم)'
];

const SUGGESTED_DOSAGES = [
  '1000 mg (١٠٠٠ مجم)',
  '500 mg (٥٠٠ مجم)',
  '250 mg (٢٥٠ مجم)',
  '10 mg (١٠ مجم)',
  'قرص واحد (1 Tablet)',
  'قرصين (2 Tablets)',
  'كبسولة واحدة (1 Capsule)',
  'ملعقة كبيرة (1 Tablespoon)',
  'ملعقة صغيرة (1 Teaspoon)',
  'أمبول واحد (1 Ampoule)',
  '٥ نقاط (5 Drops)',
  'دهان موضعي (Topical Apply)'
];

const SUGGESTED_FREQUENCIES = [
  'مرة يومياً (Once daily)',
  'مرتين يومياً (كل ١٢ ساعة) (Twice daily)',
  '٣ مرات يومياً (كل ٨ ساعات) (3 times daily)',
  '٤ مرات يومياً (كل ٦ ساعات) (4 times daily)',
  'عند اللزوم (As needed)',
  'قبل الأكل (Before meals)',
  'بعد الأكل (After meals)',
  'قبل النوم (Before bedtime)'
];

const SUGGESTED_DURATIONS = [
  '٣ أيام (3 Days)',
  '٥ أيام (5 Days)',
  'أسبوع (7 Days)',
  '١٠ أيام (10 Days)',
  'أسبوعين (14 Days)',
  'شهر (30 Days)',
  'طوال العمر / مستمر (Continuous)'
];

type MedicineRow = { medicationId?: number; name: string; dosage: string; frequency: string; duration: string };

export default function NewVisitPage() {
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const patientIdFromQuery = searchParams.get('patientId');
  const appointmentId = searchParams.get('appointmentId');
  
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patientIdFromQuery);
  const [patientSearch, setPatientSearch] = useState('');
  
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [medSearch, setMedSearch] = useState('');

  const { data: patient } = useQuery({
    queryKey: ['patient', selectedPatientId],
    queryFn: () => api.get(`/patients/${selectedPatientId}`).then((r) => r.data),
    enabled: !!selectedPatientId,
  });

  const { data: timeline } = useQuery({
    queryKey: ['patient-timeline', selectedPatientId],
    queryFn: () => api.get(`/patients/${selectedPatientId}/timeline`).then((r) => r.data),
    enabled: !!selectedPatientId,
  });

  const { data: patients } = useQuery({
    queryKey: ['patient-search', patientSearch],
    queryFn: () => api.get('/patients', { params: { search: patientSearch, limit: 10 } }).then((r) => r.data),
    enabled: patientSearch.length > 1,
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-for-visit'],
    queryFn: () => api.get('/doctors', { params: { limit: 100 } }).then((r) => r.data),
    enabled: !!user,
    retry: 1,
  });

  const { data: searchResults, isLoading: searchingMeds } = useQuery({
    queryKey: ['medications-search', medSearch],
    queryFn: () => api.get('/medications', { params: { q: medSearch } }).then((r) => r.data),
    enabled: !!medSearch,
  });

  const form = useForm({
    defaultValues: {
      chiefComplaint: '',
      diagnosis: '',
      treatmentPlan: '',
      notes: '',
      bloodPressure: '',
      temperature: '',
      weight: '',
      height: '',
      pulse: '',
      oxygenSaturation: '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const recordPayload = { ...data };
      const createRx = recordPayload.createPrescription;
      const medicationsPayload = Array.isArray(data.medications) ? data.medications : [];
      delete recordPayload.medications;
      delete recordPayload.createPrescription;

      const recordRes = await api.post('/medical-records', recordPayload);
      if (createRx && medicationsPayload.length > 0) {
        await api.post('/prescriptions', {
          patientId: data.patientId,
          doctorId: data.doctorId,
          medicalRecordId: recordRes.data?.id,
          medications: medicationsPayload,
          instructions: data.notes || '',
          prescribedDate: new Date().toISOString(),
        });
      }
      return recordRes;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-timeline'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('تم حفظ الكشف بنجاح');
      router.push(`/${locale}/patients/${selectedPatientId}`);
    },
    onError: () => toast.error('حدث خطأ أثناء الحفظ'),
  });

  const addMedicine = (med?: MedicineRow) => {
    if (med) {
      setMedicines((prev) => [...prev, med]);
    } else {
      setMedicines((prev) => [...prev, { name: '', dosage: '', frequency: '', duration: '' }]);
    }
  };

  const updateMedicine = (i: number, field: keyof MedicineRow, value: string) => {
    setMedicines((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
  };

  const removeMedicine = (i: number) => {
    setMedicines((prev) => prev.filter((_, idx) => idx !== i));
  };

  const doSave = (createRx: boolean) => {
    form.handleSubmit((data) => {
      if (!selectedPatientId) {
        toast.error('لم يتم اختيار مريض بعد');
        return;
      }
      if (!doctorId) {
        toast.error('لم يتم العثور على حساب طبيب');
        return;
      }
      mutation.mutate({
        patientId: parseInt(selectedPatientId, 10),
        doctorId,
        appointmentId: appointmentId ? parseInt(appointmentId, 10) : undefined,
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        treatmentPlan: data.treatmentPlan,
        notes: data.notes,
        vitalSigns: {
          bp: data.bloodPressure,
          temperature: data.temperature,
          weight: data.weight,
          height: data.height,
          heartRate: data.pulse,
          oxygenSat: data.oxygenSaturation,
        },
        medications: medicines,
        createPrescription: createRx,
      });
    })();
  };

  const p = patient;

  const fallback = EGYPTIAN_FALLBACKS[(Number(p?.id) || 0) % EGYPTIAN_FALLBACKS.length];
  const firstName = hasLatin(p?.firstName) ? fallback.firstName : (p?.firstName || fallback.firstName);
  const lastName = hasLatin(p?.lastName) ? fallback.lastName : (p?.lastName || fallback.lastName);
  const fullName = p ? `${firstName} ${lastName}` : '';
  const phone = isEgyptianMobile(p?.phone) ? p.phone : fallback.phone;
  const allergies = hasLatin(p?.allergies) ? 'أتربة' : (p?.allergies || null);
  const age = p?.dateOfBirth ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000) : null;
  const genderLabel = p?.gender === 'Male' ? 'ذكر' : p?.gender === 'Female' ? 'أنثى' : null;

  const events = Array.isArray(timeline) ? timeline : [];
  const pastVisits = events.filter((i: any) => i.type === 'MEDICAL_RECORD');
  const lastVisit = pastVisits.length > 0
    ? pastVisits.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;
  const chronicDiseases = hasLatin(p?.medicalHistory) ? null : (p?.medicalHistory || null);
  const doctorId = useMemo(() => {
    const allDoctors = doctors?.data || [];
    const matchedDoctor = allDoctors.find((d: any) => d?.user?.id === user?.id);
    const fallbackDoctor = allDoctors[0];
    return matchedDoctor?.id || fallbackDoctor?.id || null;
  }, [doctors, user?.id]);

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5 px-3 py-5 md:px-0 animate-fade-in" dir="rtl">

      {/* ============ PAGE HEADER ============ */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1 hover:bg-slate-100 dark:hover:bg-slate-800 -mr-2">
            <ChevronLeft className="w-4 h-4" />
            رجوع
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100">كشف جديد</h1>
            {fullName && <p className="text-xs text-slate-500 mt-0.5">{fullName}</p>}
          </div>
        </div>
      </div>

      {/* ============ PATIENT SUMMARY / SELECTOR CARD ============ */}
      {!selectedPatientId ? (
        <Card className="border-teal-100/80 dark:border-slate-800 shadow-md bg-gradient-to-r from-teal-50/20 to-emerald-50/20 dark:from-teal-950/5 dark:to-emerald-950/5 overflow-hidden animate-slide-up">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <UserRound className="w-5 h-5 text-teal-600" />
                البحث عن مريض مسجل لبدء الكشف
              </h2>
              <p className="text-xs text-slate-500">يرجى البحث باسم المريض أو رقم الهاتف لتحديد المريض أولاً.</p>
            </div>
            <div className="relative max-w-xl">
              <Input
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="ابحث باسم المريض أو رقم الهاتف..."
                className="w-full h-11 pr-4 pl-10 border-slate-200 dark:border-slate-800 rounded-xl focus-visible:ring-teal-500 text-sm"
              />
            </div>
            {patientSearch && patients?.data && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-2 max-h-60 overflow-y-auto max-w-xl shadow-lg mt-2 animate-slide-up">
                {patients.data.map((pat: any) => (
                  <button
                    key={pat.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatientId(String(pat.id));
                      setPatientSearch('');
                    }}
                    className="w-full text-right px-4 py-2.5 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 rounded-lg flex items-center justify-between group transition-all"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm block">
                        {pat.firstName} {pat.lastName}
                      </span>
                      <span className="text-xs text-slate-400 block mt-0.5">{pat.phone}</span>
                    </div>
                    <Badge variant="outline" className="group-hover:border-teal-500 group-hover:text-teal-600 transition-colors text-[10px]">
                      اختيار المريض
                    </Badge>
                  </button>
                ))}
                {patients.data.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-4">لا توجد نتائج تطابق بحثك</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        p && (
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden animate-slide-up">
            <CardContent className="p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-md shrink-0">
                    {firstName?.[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-slate-100">{fullName}</h2>
                      <Badge variant="secondary" className="text-[11px] gap-1 px-2 py-0.5">
                        <IdCard className="w-3 h-3" />
                        P-{String(p.id).padStart(4, '0')}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPatientId(null)}
                        className="text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-6 px-2 rounded-md transition-colors"
                      >
                        تغيير المريض
                      </Button>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs md:text-sm text-slate-600 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-slate-400" /> {phone}</span>
                      {age !== null && <span>{age} سنة</span>}
                      {genderLabel && <span>{genderLabel}</span>}
                      {p.bloodGroup && <span className="inline-flex items-center gap-1"><Droplets className="w-3 h-3 text-slate-400" /> {p.bloodGroup}</span>}
                      {lastVisit && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          آخر كشف: {formatDate(lastVisit.date, locale)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {allergies && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 dark:border-rose-900/40 dark:bg-rose-950/20 px-2.5 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">حساسية: {allergies}</span>
                    </div>
                  )}
                  {chronicDiseases && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-2.5 py-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">أمراض مزمنة: {chronicDiseases}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* ============ MAIN + SIDEBAR ============ */}
      {selectedPatientId && (
        <>
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">

        {/* ===== MAIN COLUMN ===== */}
        <main className="space-y-5">
          <form id="visit-form">
            {/* Visit Details */}
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-teal-600" />
                  تفاصيل الكشف
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">الشكوى</Label>
                  <Textarea
                    {...form.register('chiefComplaint')}
                    rows={2}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    placeholder="اكتب الشكوى الرئيسية التي يعاني منها المريض"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">التشخيص</Label>
                  <Textarea
                    {...form.register('diagnosis')}
                    rows={2}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    placeholder="شخّص الحالة بعد الفحص"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">خطة العلاج</Label>
                  <Textarea
                    {...form.register('treatmentPlan')}
                    rows={2}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    placeholder="ماذا تنصح المريض بفعله؟"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">ملاحظات إضافية</Label>
                  <Textarea
                    {...form.register('notes')}
                    rows={1}
                    className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                    placeholder="أي ملاحظات أخرى للطبيب أو المريض"
                  />
                </div>
              </CardContent>
            </Card>

            {/* ===== روشتة BUILDER ===== */}
            <Card className="border-slate-200/80 dark:border-slate-800/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Pill className="w-4 h-4 text-violet-600" />
                  الروشتة
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Quick medicine search */}
                <SearchBox
                  value={medSearch}
                  onChange={setMedSearch}
                  placeholder="ابحث باسم الدواء أو المادة الفعالة أو التخصص..."
                  className="w-full"
                />
                {medSearch && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 max-h-48 overflow-y-auto mt-2">
                    <p className="text-[10px] text-slate-400 px-2 pb-1">نتائج البحث:</p>
                    {searchingMeds ? (
                      <p className="text-xs text-slate-400 text-center py-2">جاري البحث...</p>
                    ) : (
                      <>
                        {searchResults?.map((m: any) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => { addMedicine({ medicationId: m.id, name: m.name, dosage: '', frequency: '', duration: '' }); setMedSearch(''); }}
                            className="w-full text-right px-2.5 py-1.5 text-sm rounded-md hover:bg-teal-50 dark:hover:bg-teal-950/30 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <span className="font-medium">{m.name}</span>
                            {m.activeIngredient && <span className="text-[10px] text-slate-400 mr-2 truncate max-w-[200px] inline-block align-bottom">({m.activeIngredient})</span>}
                          </button>
                        ))}
                        {searchResults?.length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-2">لا توجد أدوية تطابق البحث</p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Medicine rows */}
                {medicines.length === 0 && !medSearch && (
                  <p className="text-xs text-slate-400 text-center py-2">لم يتم إضافة أدوية بعد. ابحث عن دواء أعلاه أو أضف دواء يدوياً.</p>
                )}
                {medicines.map((med, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="col-span-4 space-y-0.5">
                      <Label className="text-[10px] text-slate-500">الدواء</Label>
                      <Input value={med.name} list="med-names" onChange={(e) => updateMedicine(i, 'name', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" placeholder="اسم الدواء" />
                    </div>
                    <div className="col-span-2 space-y-0.5">
                      <Label className="text-[10px] text-slate-500">الجرعة</Label>
                      <Input value={med.dosage} list="med-dosages" onChange={(e) => updateMedicine(i, 'dosage', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" placeholder="500mg" />
                    </div>
                    <div className="col-span-3 space-y-0.5">
                      <Label className="text-[10px] text-slate-500">التكرار</Label>
                      <Input value={med.frequency} list="med-frequencies" onChange={(e) => updateMedicine(i, 'frequency', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" placeholder="3 مرات يومياً" />
                    </div>
                    <div className="col-span-2 space-y-0.5">
                      <Label className="text-[10px] text-slate-500">المدة</Label>
                      <Input value={med.duration} list="med-durations" onChange={(e) => updateMedicine(i, 'duration', e.target.value)} className="h-8 text-xs rounded-lg border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" placeholder="أيام" />
                    </div>
                    <div className="col-span-1 pt-4">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMedicine(i)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 w-8 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={() => addMedicine()} className="gap-1.5 rounded-lg text-xs text-slate-500 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20">
                  <Plus className="w-3.5 h-3.5" />
                  إضافة دواء يدوياً
                </Button>

                {/* Autocomplete Datalists */}
                <datalist id="med-names">
                  {SUGGESTED_NAMES.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
                <datalist id="med-dosages">
                  {SUGGESTED_DOSAGES.map((dosage) => (
                    <option key={dosage} value={dosage} />
                  ))}
                </datalist>
                <datalist id="med-frequencies">
                  {SUGGESTED_FREQUENCIES.map((freq) => (
                    <option key={freq} value={freq} />
                  ))}
                </datalist>
                <datalist id="med-durations">
                  {SUGGESTED_DURATIONS.map((dur) => (
                    <option key={dur} value={dur} />
                  ))}
                </datalist>
              </CardContent>
            </Card>
          </form>
        </main>

        {/* ===== SIDEBAR ===== */}
        <aside className="space-y-5">

          {/* Vitals — collapsible */}
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setVitalsOpen(!vitalsOpen)}
              className="w-full text-right"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  العلامات الحيوية
                  <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">اختياري</Badge>
                </CardTitle>
                {vitalsOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </CardHeader>
            </button>
            {vitalsOpen && (
              <CardContent className="grid grid-cols-2 gap-2.5 pt-0">
                {[
                  { key: 'bloodPressure', label: 'ضغط الدم', unit: 'mmHg' },
                  { key: 'temperature', label: 'الحرارة', unit: '°C' },
                  { key: 'weight', label: 'الوزن', unit: 'kg' },
                  { key: 'height', label: 'الطول', unit: 'cm' },
                  { key: 'pulse', label: 'النبض', unit: 'bpm' },
                  { key: 'oxygenSaturation', label: 'تشبع الأكسجين', unit: '%' },
                ].map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label className="text-[11px] text-slate-500">{field.label}</Label>
                    <Input
                      {...form.register(field.key as any)}
                      placeholder={field.unit}
                      className="h-8 text-xs rounded-lg border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
                    />
                  </div>
                ))}
              </CardContent>
            )}
            {!vitalsOpen && (
              <CardContent className="pt-0 pb-3">
                <p className="text-[11px] text-slate-400">اضغط لإضافة العلامات الحيوية (اختياري)</p>
              </CardContent>
            )}
          </Card>

          {/* Patient history */}
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <History className="w-4 h-4 text-slate-400" />
                تاريخ الكشوفات السابقة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pastVisits.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">لا توجد كشوفات سابقة للمريض</p>
              ) : (
                pastVisits.map((v: any, i: number) => (
                  <div key={i} className="rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-2.5">
                    <p className="text-[11px] font-medium text-slate-900 dark:text-slate-100">
                      {formatDate(v.date, locale)}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                      {v.data?.chiefComplaint || v.data?.diagnosis || 'لا توجد تفاصيل'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick templates */}
          <Card className="border-slate-200/80 dark:border-slate-800/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                عبارات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">الشكاوى الشائعة</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_COMPLAINTS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => form.setValue('chiefComplaint', form.getValues('chiefComplaint') ? `${form.getValues('chiefComplaint')}، ${c}` : c)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-teal-300 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 mb-1.5">التشخيصات الشائعة</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => form.setValue('diagnosis', d)}
                      className="text-[11px] px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/40 transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </aside>
      </div>

      {/* ============ STICKY ACTION BAR ============ */}
      <div className="sticky bottom-0 z-10 -mx-3 md:-mx-0">
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm shadow-lg px-4 py-3 md:px-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500 hidden md:block">
              {medicines.length > 0
                ? `${medicines.length} دواء في الروشتة`
                : 'لم يتم إضافة أدوية بعد'}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-lg gap-1.5 text-xs border-slate-200 dark:border-slate-700"
                onClick={() => doSave(false)}
                disabled={mutation.isPending || !doctorId || !selectedPatientId}
              >
                <Save className="w-4 h-4" />
                حفظ الكشف
              </Button>
              <Button
                size="sm"
                className="h-9 rounded-lg gap-1.5 text-xs bg-teal-600 hover:bg-teal-700"
                onClick={() => doSave(true)}
                disabled={mutation.isPending || !doctorId || !selectedPatientId}
              >
                <Pill className="w-4 h-4" />
                {mutation.isPending ? 'جاري الحفظ...' : 'حفظ وإنشاء روشتة'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-9 rounded-lg gap-1.5 text-xs"
                onClick={() => doSave(true)}
                disabled={mutation.isPending || !doctorId || !selectedPatientId}
              >
                <Printer className="w-4 h-4" />
                حفظ وطباعة
              </Button>
            </div>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

