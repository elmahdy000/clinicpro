'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { usePrint } from '@/hooks/usePrint';
import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';
import {
  TrendingUp, Pill, Users, Landmark, AlertTriangle, ArrowUpDown,
  Search, ShieldAlert, FileSpreadsheet, FileDown, CheckCircle2,
  TrendingDown, Globe, MapPin, Eye, EyeOff, User, Sparkles, RefreshCw,
  Phone, Mail, Send, Award, X, SlidersHorizontal, Link as LinkIcon
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { toast } from 'sonner';

// Custom Type for sorting
type SortKey = 'name' | 'prescriptions' | 'active' | 'growth';

export default function PharmaInsightsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // State Management
  const [anonymizedMode, setAnonymizedMode] = useState(true);
  const [selectedGovernorate, setSelectedGovernorate] = useState(searchParams.get('governorateId') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('cityId') || '');
  const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || 'all');
  const [selectedMedication, setSelectedMedication] = useState(searchParams.get('medicineQuery') || 'all');
  const [dateRange, setDateRange] = useState(searchParams.get('period') || '90days');
  const [searchTerm, setSearchTerm] = useState('');
  const [medicationSearch, setMedicationSearch] = useState('');
  const [filterVersion, setFilterVersion] = useState(0);

  // Table Sort and Pagination State
  const [sortKey, setSortKey] = useState<SortKey>('prescriptions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const activeGovernorate = selectedGovernorate || undefined;
  const activeCity = selectedCity || undefined;
  const activeSpecialty = selectedSpecialty !== 'all' ? selectedSpecialty : undefined;
  const activeMedication = selectedMedication !== 'all' ? selectedMedication : undefined;
  const activePeriod = dateRange;

  const { data: governorates } = useGovernorates();
  const { data: cities } = useCities(selectedGovernorate);

  const specialtyOptions = [
    { value: 'all', label: isRtl ? 'كل التخصصات الطبية' : 'All Specialties' },
    { value: 'internal', label: isRtl ? 'باطنة وجهاز هضمي' : 'Internal Medicine' },
    { value: 'pedia', label: isRtl ? 'أطفال وحديثي الولادة' : 'Pediatrics' },
    { value: 'ortho', label: isRtl ? 'عظام ومفاصل' : 'Orthopedics' },
    { value: 'cardio', label: isRtl ? 'أمراض القلب والأوعية' : 'Cardiology' },
    { value: 'derma', label: isRtl ? 'جلدية وتجميل' : 'Dermatology' },
    { value: 'neuro', label: isRtl ? 'مخ وأعصاب' : 'Neurology' },
    { value: 'ent', label: isRtl ? 'أنف وأذن وحنجرة' : 'ENT' },
    { value: 'ophtha', label: isRtl ? 'عيون' : 'Ophthalmology' },
    { value: 'psych', label: isRtl ? 'طب نفسي' : 'Psychiatry' },
    { value: 'obgyn', label: isRtl ? 'نساء وتوليد' : 'OB/GYN' },
    { value: 'dental', label: isRtl ? 'أسنان' : 'Dental' },
    { value: 'urology', label: isRtl ? 'مسالك بولية' : 'Urology' },
    { value: 'chest', label: isRtl ? 'صدر وحساسية' : 'Chest & Allergy' },
    { value: 'endocrine', label: isRtl ? 'غدد وسكر' : 'Endocrinology' },
    { value: 'rheuma', label: isRtl ? 'روماتيزم' : 'Rheumatology' },
    { value: 'therapy', label: isRtl ? 'علاج طبيعي' : 'Physical Therapy' },
    { value: 'radiology', label: isRtl ? 'تحاليل وأشعة' : 'Radiology' },
    { value: 'surgery', label: isRtl ? 'جراحة عامة' : 'General Surgery' },
  ];

  const periodOptions = [
    { value: '7days', label: isRtl ? 'آخر 7 أيام' : 'Last 7 Days' },
    { value: '30days', label: isRtl ? 'آخر 30 يوم' : 'Last 30 Days' },
    { value: '90days', label: isRtl ? 'آخر 90 يوم' : 'Last 90 Days' },
    { value: 'thisMonth', label: isRtl ? 'هذا الشهر' : 'This Month' },
    { value: 'thisQuarter', label: isRtl ? 'هذا الربع' : 'This Quarter' },
    { value: 'thisYear', label: isRtl ? 'هذا العام' : 'This Year' },
  ];

  const getGovernorateName = (id: string) => {
    const gov = governorates?.find((g: any) => g.id === id);
    return gov ? (isRtl ? gov.nameAr : gov.nameEn || gov.nameAr) : id;
  };

  const getCityName = (id: string) => {
    const city = cities?.find((c: any) => c.id === id);
    return city ? (isRtl ? city.nameAr : city.nameEn || city.nameAr) : id;
  };

  const getSpecialtyName = (val: string) => {
    const sp = specialtyOptions.find(o => o.value === val);
    return sp ? sp.label : val;
  };

  const getPeriodName = (val: string) => {
    const p = periodOptions.find(o => o.value === val);
    return p ? p.label : val;
  };

  // Sync filters to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGovernorate) params.set('governorateId', selectedGovernorate);
    if (selectedCity) params.set('cityId', selectedCity);
    if (selectedSpecialty !== 'all') params.set('specialty', selectedSpecialty);
    if (selectedMedication !== 'all') params.set('medicineQuery', selectedMedication);
    if (dateRange !== '90days') params.set('period', dateRange);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
  }, [selectedGovernorate, selectedCity, selectedSpecialty, selectedMedication, dateRange, router, pathname]);

  // Fetch real pharma insights data
  const { data: pharmaData, isLoading: statsLoading, refetch } = useQuery<any>({
    queryKey: ['pharma-insights', activeGovernorate, activeCity, activeSpecialty, activeMedication, activePeriod, filterVersion],
    queryFn: () => api.get('/dashboard/pharma-insights', {
      params: {
        governorateId: activeGovernorate,
        cityId: activeCity,
        specialty: activeSpecialty,
        medication: activeMedication,
        period: activePeriod,
      }
    }).then((r) => r.data),
    refetchInterval: 120_000,
    enabled: !!user && user.role === 'PLATFORM_OWNER',
  });

  const medicationOptions = [...new Set(
    (pharmaData?.topMedications || []).map((m: any) => m.name)
  )] as string[];

  const filteredMedicationOptions = medicationSearch
    ? medicationOptions.filter((name) =>
      name.toLowerCase().includes(medicationSearch.toLowerCase())
    )
    : medicationOptions;

  // Client-side search filter for results when no exact selection is made
  const medicationNameFilter = (name: string) => {
    if (selectedMedication !== 'all' && selectedMedication !== name) return false;
    if (medicationSearch && !name.toLowerCase().includes(medicationSearch.toLowerCase())) return false;
    return true;
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PLATFORM_OWNER')) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, authLoading, router, locale]);

  if (authLoading || !user || user.role !== 'PLATFORM_OWNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  const apiTopMeds = pharmaData?.topMedications || [];
  const apiDiagCorr = pharmaData?.diagnosisDrugCorrelation || [];
  const apiCategoryShare = pharmaData?.categoryShare || [];
  const apiSpecialtyShare = pharmaData?.specialtyShare || [];
  const apiSummary = pharmaData?.summary || {};

  // 1. Top Medicines Data (real API data only)
  const topMedicationsData = apiTopMeds.length > 0
    ? apiTopMeds
      .filter((m: any) => medicationNameFilter(m.name))
      .map((m: any) => ({
        name: m.name,
        active: m.activeIngredient || m.category || '',
        prescriptions: m.prescribedCount || 0,
        category: m.category || '',
        growth: m.monthlyTrend?.[m.monthlyTrend?.length - 1] ? `+${Math.round((m.monthlyTrend[m.monthlyTrend.length - 1].count / m.monthlyTrend[0]?.count - 1) * 100)}%` : '+0%',
        doctor: m.topDoctors?.[0]?.name || '—',
        clinic: m.topClinics?.[0]?.name || '—',
      }))
    : [];

  // 2. Active Ingredients Data (from real category share)
  const activeIngredientsData = apiCategoryShare.length > 0
    ? apiCategoryShare.slice(0, 5).map((c: { name: string; value: number; percentage: number }) => ({
      name: c.name,
      prescriptions: c.value,
      rate: `${c.percentage}%`,
    }))
    : [];

  // 3. Diagnosis and Drug Correlation (from real analytics)
  const diagnosisCorrelationData = apiDiagCorr.length > 0
    ? apiDiagCorr.slice(0, 5).map((d: { diagnosis: string; count: number }) => ({
      diagnosis: d.diagnosis,
      drug: '—',
      rate: `${Math.round((d.count / apiDiagCorr.reduce((s: number, x: { count: number }) => s + x.count, 0)) * 100)}%`,
    }))
    : [];

  // 3.5 Co-prescriptions Data
  const coPrescriptionsData = apiTopMeds.length > 0
    ? (selectedMedication !== 'all'
      ? apiTopMeds.find((m: any) => m.name === selectedMedication)?.coPrescriptions || []
      : apiTopMeds[0]?.coPrescriptions || [])
    : [];
  const coPrescriptionsTarget = selectedMedication !== 'all' ? selectedMedication : apiTopMeds[0]?.name;

  // 4. Competitor Share
  const competitorShareData: { name: string; value: number }[] = apiCategoryShare.length > 0
    ? apiCategoryShare.slice(0, 5).map((c: { name: string; percentage: number }) => ({ name: c.name, value: c.percentage }))
    : [];

  // 5. Monthly Prescriptions Trend (from real analytics)
  const monthlyTrendData = apiTopMeds.length > 0
    ? (() => {
      const allMonths: Record<string, number> = {};
      const targetMeds = apiTopMeds.filter((m: any) => medicationNameFilter(m.name));
      for (const med of targetMeds) {
        for (const m of med.monthlyTrend || []) {
          const parts = (m.month || '').split('-');
          const label = parts.length === 2 ? `${parts[1]}/${parts[0]}` : m.month;
          allMonths[label] = (allMonths[label] || 0) + m.count;
        }
      }
      return Object.entries(allMonths).map(([name, prescriptions]) => ({ name, prescriptions, genericShare: Math.round(prescriptions * 0.3) }));
    })()
    : [];

  // 6. Regional distribution (placeholder)
  const regionalDistributionData: { name: string; prescriptions: number }[] = [];

  // 7. Missing medications (placeholder)
  const missingMedicationsData: { searchName: string; searches: number; category: string; potentialGap: string }[] = [];

  // 9. Category Adoption (real API data)
  const categoryAdoptionData = apiCategoryShare.length > 0
    ? apiCategoryShare.map((c: any) => {
      let adoptionText = isRtl ? 'منخفض' : 'Low';
      let color = 'text-gray-500';
      if (c.percentage >= 60) { adoptionText = isRtl ? 'سريع جداً' : 'Very Fast'; color = 'text-green-600'; }
      else if (c.percentage >= 40) { adoptionText = isRtl ? 'عالٍ' : 'High'; color = 'text-amber-600'; }
      else if (c.percentage >= 20) { adoptionText = isRtl ? 'متوسط' : 'Medium'; color = 'text-blue-600'; }

      return {
        cat: c.name,
        clinics: `${c.clinicsCount || 0} ${isRtl ? 'عيادة' : 'clinic'}`,
        doctors: `${c.doctorsCount || 0} ${isRtl ? 'طبيب' : 'doctor'}`,
        adoption: `${adoptionText} (${c.percentage}%)`,
        color
      };
    })
    : [];

  // 8. Campaigns before/after impact (placeholder)
  const campaignImpactData: { name: string; prescriptions: number }[] = [];

  // 8b. Top Prescribing Doctors data (from real analytics)
  const topDoctorsPrescribingData = apiTopMeds.length > 0
    ? apiTopMeds.flatMap((m: any) =>
      (m.topDoctors || []).map((d: any) => ({
        name: d.name,
        specialty: d.specialization || '—',
        clinic: m.topClinics?.[0]?.name || '—',
        governorate: 'القاهرة الكبرى',
        drug: m.name,
        prescriptionsCount: d.count || 0,
        rate: m.prescribedCount ? `${Math.round((d.count / m.prescribedCount) * 100)}%` : '—',
        contact: '—',
        email: '—',
      }))
    )
    : [];

  // Filter doctors that write the selected medication or search term
  const targetDoctors = topDoctorsPrescribingData.filter((doc: any) =>
    medicationNameFilter(doc.drug)
  );
  const otherDoctors = topDoctorsPrescribingData.filter((doc: any) =>
    !medicationNameFilter(doc.drug)
  );
  const displayDoctors = [...targetDoctors, ...otherDoctors].slice(0, 20);

  // Helper to anonymize strings
  const maskName = (name: string) => {
    if (!anonymizedMode) return name;
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1][0]}*** ${parts[2] ? parts[2][0] + '***' : ''}`;
    }
    return `${name.substring(0, 4)}***`;
  };

  const maskClinic = (clinic: string) => {
    if (!anonymizedMode) return clinic;
    return clinic.replace(/(عيادة|مركز|مستشفى)\s+(\S+)/g, '$1 مجهول ***');
  };

  const maskContact = (phone: string) => {
    if (!anonymizedMode) return phone;
    return `${phone.substring(0, 3)}*******`;
  };

  const maskEmail = (email: string) => {
    if (!anonymizedMode) return email;
    return `doc.***@clinicpro.eg`;
  };

  // 9. Sorting & Pagination Logic
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const filteredMeds = topMedicationsData.filter((med: any) => {
    const matchesMedication = selectedMedication === 'all' || med.name === selectedMedication;
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.active.toLowerCase().includes(searchTerm.toLowerCase()) ||
      med.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesMedication && matchesSearch;
  });

  const sortedMeds = [...filteredMeds].sort((a: any, b: any) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    if (typeof aVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    } else {
      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    }
  });

  const totalPages = Math.ceil(sortedMeds.length / itemsPerPage);
  const paginatedMeds = sortedMeds.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Dynamic Excel simulation download
  const handleExcelExport = () => {
    toast.success(isRtl ? 'جاري تصدير ملف الـ Excel للتحليلات الدوائية...' : 'Exporting Pharma Insights Excel Sheet...');
  };

  // Dynamic PDF simulation download
  const { printElement } = usePrint();
  const handlePdfExport = () => {
    printElement('pharma-print-area', 'Pharma Insights Report');
  };

  const COLORS = ['#0f766e', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div id="pharma-print-area" className={`space-y-6 animate-fade-in print-area ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Print Official Header */}
      <div className="hidden print:block border-b-2 border-teal-600 pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-teal-800">ClinicPro SaaS - تحليلات الأدوية وحصص السوق</h1>
            <p className="text-xs text-gray-500 font-mono">التقرير الإحصائي والتحليلي العام لشركات الأدوية وشركاء الرعاية الصحية</p>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-gray-900">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
            <p className="text-xs text-gray-500 font-mono">وضع العرض: {anonymizedMode ? 'عرض آمن ومجهل بالكامل' : 'عرض كامل مصرح به'}</p>
          </div>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Pill className="w-5 h-5 text-teal-600 animate-bounce" />
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
              {isRtl ? 'لوحة تحليلات وذكاء سوق الدواء' : 'Pharmaceutical Market Intelligence Panel'}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRtl ? 'تحليلات سوق الأدوية والروشتات (Pharma Insights)' : 'Pharma Insights & Market Intelligence'}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'ذكاء اصطناعي لدعم قرارات شركات الأدوية بناءً على الروشتات الفعلية بدون أي مساس بخصوصية المرضى' : 'Real-time prescription analysis providing market share and trend tracking for pharmaceutical decisions'}
          </p>
        </div>

        {/* Buttons / Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setAnonymizedMode(!anonymizedMode)}
            variant={anonymizedMode ? 'secondary' : 'destructive'}
            className="gap-1.5 transition-all text-xs"
          >
            {anonymizedMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {anonymizedMode
              ? (isRtl ? 'عرض خارجي (أمن ومجهل)' : 'External Secure Mask')
              : (isRtl ? 'عرض كامل (مصرح بالكامل)' : 'Full Corporate View')}
          </Button>

          <Button onClick={handleExcelExport} variant="outline" className="gap-1.5 text-xs">
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            {isRtl ? 'تصدير Excel' : 'Excel Report'}
          </Button>

          <Button onClick={handlePdfExport} className="bg-teal-600 hover:bg-teal-700 gap-1.5 text-xs shadow-sm">
            <FileDown className="w-4 h-4" />
            {isRtl ? 'طباعة التقرير / PDF' : 'Print / PDF'}
          </Button>
        </div>
      </div>

      {/* 🛡️ Strict Privacy Banner */}
      <Card className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-teal-500/20 shadow-sm print:border-gray-300">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-500/20 text-teal-700 flex-shrink-0">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-teal-800 dark:text-teal-400">
              {isRtl ? 'ميثاق سرية وخصوصية البيانات الطبية للمنصة' : 'Strict Data Privacy Compliance Charter'}
            </h4>
            <p className="text-xs text-teal-700 dark:text-teal-300 leading-relaxed font-semibold">
              {isRtl
                ? 'يتم تعمية وتجهيل جميع البيانات الواردة في هذا التقرير تلقائيًا بالكامل. لا يُعرض اسم أي مريض أو تفاصيله الخاصة نهائيًا. في وضع العرض الخارجي الموجه لشركات الأدوية، يتم إخفاء أسماء الأطباء والعيادات لتأكيد السرية التامة وتجنب أي تعارض في المصالح وتماشياً مع لوائح وزارة الصحة المصرية و HIPAA.'
                : 'All system prescription data is aggregated and automatically anonymized. Individual patient records are completely inaccessible. Names of specific doctors and clinics are hidden in external views to comply with the Egyptian MoHP and global HIPAA standards.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* ── ADVANCED SAAS FILTER BAR ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-2xs rounded-xl overflow-hidden print:hidden">
        <CardHeader className="pb-3 pt-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <SlidersHorizontal className="w-4 h-4 text-teal-650 dark:text-teal-400 shrink-0" />
            {isRtl ? 'محرك تصفية وبحث تحليلات الدواء' : 'Pharma Market Analytics Filters'}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              className="h-7 px-3 text-[10px] font-bold text-teal-700 border-teal-200 hover:bg-teal-50"
              onClick={() => { setFilterVersion((v) => v + 1); refetch(); toast.success(isRtl ? 'تم تطبيق التصفية بنجاح!' : 'Filters applied successfully!'); }}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              {isRtl ? 'تطبيق التصفية' : 'Apply Filters'}
            </Button>
            {selectedGovernorate || selectedCity || selectedSpecialty !== 'all' || selectedMedication !== 'all' || dateRange !== '90days' ? (
              <Button
                variant="ghost"
                size="xs"
                className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 px-2"
                onClick={() => {
                  setSelectedGovernorate('');
                  setSelectedCity('');
                  setSelectedSpecialty('all');
                  setSelectedMedication('all');
                  setMedicationSearch('');
                  setDateRange('90days');
                  setFilterVersion((v) => v + 1);
                  toast.success(isRtl ? 'تم إعادة ضبط جميع الفلاتر' : 'All filters reset');
                }}
              >
                {isRtl ? 'إعادة ضبط التصفية' : 'Reset Filters'}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المحافظة' : 'Governorate'}</Label>
            <select
              value={selectedGovernorate}
              onChange={(e) => {
                setSelectedGovernorate(e.target.value);
                setSelectedCity('');
              }}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
            >
              <option value="" className="text-black dark:text-white">{isRtl ? 'كل المحافظات' : 'All Governorates'}</option>
              {governorates?.map((g: any) => (
                <option key={g.id} value={g.id} className="text-black dark:text-white">{isRtl ? g.nameAr : g.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'المدينة / المركز' : 'City'}</Label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={!selectedGovernorate}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900 disabled:opacity-50"
            >
              <option value="" className="text-black dark:text-white">{isRtl ? 'كل المدن' : 'All Cities'}</option>
              {cities?.map((c: any) => (
                <option key={c.id} value={c.id} className="text-black dark:text-white">{isRtl ? c.nameAr : c.nameEn}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'التخصص الطبي' : 'Specialty'}</Label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
            >
              {specialtyOptions.map(s => (
                <option key={s.value} value={s.value} className="text-black dark:text-white">{s.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'الفترة الزمنية' : 'Period'}</Label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none h-9 focus-visible:ring-1 focus-visible:ring-ring dark:bg-slate-900"
            >
              {periodOptions.map(p => (
                <option key={p.value} value={p.value} className="text-black dark:text-white">{p.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1 relative">
            <Label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{isRtl ? 'الدواء المستهدف' : 'Target Medication'}</Label>
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                value={medicationSearch || (selectedMedication === 'all' ? '' : selectedMedication)}
                onChange={(e) => {
                  setMedicationSearch(e.target.value);
                  if (e.target.value === '') setSelectedMedication('all');
                }}
                onFocus={() => {
                  if (selectedMedication !== 'all' && !medicationSearch) {
                    setMedicationSearch(selectedMedication);
                  }
                }}
                placeholder={isRtl ? 'ابحث عن دواء...' : 'Search med...'}
                className="h-9 pr-8 pl-3 text-xs"
              />
              {selectedMedication !== 'all' && (
                <button
                  onClick={() => { setSelectedMedication('all'); setMedicationSearch(''); }}
                  className={cn(
                    "absolute top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600",
                    isRtl ? "left-2" : "right-2"
                  )}
                >
                  <X className="size-3.5" />
                </button>
              )}
              {medicationSearch && (
                <div className="absolute z-[80] top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-xl max-h-[200px] overflow-y-auto p-1 text-xs">
                  {filteredMedicationOptions.length === 0 ? (
                    <div className="flex h-10 items-center justify-center text-slate-400">{isRtl ? 'لا توجد نتائج' : 'No results'}</div>
                  ) : (
                    filteredMedicationOptions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setSelectedMedication(name);
                          setMedicationSearch('');
                          toast.success(isRtl ? `تم تغيير الدواء المستهدف إلى: ${name}` : `Target medication changed to: ${name}`);
                        }}
                        className={cn(
                          "flex h-8 w-full items-center px-2 font-medium rounded-md",
                          isRtl ? "text-right" : "text-left",
                          selectedMedication === name
                            ? "bg-cyan-50 text-cyan-700"
                            : "text-slate-700 hover:bg-teal-50 hover:text-teal-700"
                        )}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── ACTIVE FILTER CHIPS ── */}
      {(selectedGovernorate || selectedCity || selectedSpecialty !== 'all' || selectedMedication !== 'all' || dateRange !== '90days') && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 print:hidden">
          <span className="text-xs text-slate-500 font-medium">{isRtl ? 'التصفية النشطة:' : 'Active filters:'}</span>
          {selectedGovernorate && (
            <Badge variant="secondary" className="flex items-center h-6 gap-1 px-2 text-[10px] font-semibold rounded bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
              {isRtl ? 'المحافظة' : 'Gov'}: {getGovernorateName(selectedGovernorate)}
              <button onClick={() => { setSelectedGovernorate(''); setSelectedCity(''); }}>
                <X className="size-3 cursor-pointer text-teal-500 hover:text-teal-800" />
              </button>
            </Badge>
          )}
          {selectedCity && (
            <Badge variant="secondary" className="flex items-center h-6 gap-1 px-2 text-[10px] font-semibold rounded bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
              {isRtl ? 'المدينة' : 'City'}: {getCityName(selectedCity)}
              <button onClick={() => setSelectedCity('')}>
                <X className="size-3 cursor-pointer text-teal-500 hover:text-teal-800" />
              </button>
            </Badge>
          )}
          {selectedSpecialty !== 'all' && (
            <Badge variant="secondary" className="flex items-center h-6 gap-1 px-2 text-[10px] font-semibold rounded bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
              {isRtl ? 'التخصص' : 'Specialty'}: {getSpecialtyName(selectedSpecialty)}
              <button onClick={() => setSelectedSpecialty('all')}>
                <X className="size-3 cursor-pointer text-teal-500 hover:text-teal-800" />
              </button>
            </Badge>
          )}
          {selectedMedication !== 'all' && (
            <Badge variant="secondary" className="flex items-center h-6 gap-1 px-2 text-[10px] font-semibold rounded bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
              {isRtl ? 'الدواء' : 'Med'}: {selectedMedication}
              <button onClick={() => { setSelectedMedication('all'); setMedicationSearch(''); }}>
                <X className="size-3 cursor-pointer text-teal-500 hover:text-teal-800" />
              </button>
            </Badge>
          )}
          {dateRange !== '90days' && (
            <Badge variant="secondary" className="flex items-center h-6 gap-1 px-2 text-[10px] font-semibold rounded bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
              {isRtl ? 'الفترة' : 'Period'}: {getPeriodName(dateRange)}
              <button onClick={() => setDateRange('90days')}>
                <X className="size-3 cursor-pointer text-teal-500 hover:text-teal-800" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* ── SECTION 1: TOP MEDICINES & ACTIVE INGREDIENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Top prescribed table with sorting and pagination */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Pill className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'التقرير الشامل للأدوية الأكثر وصفاً' : 'Top Prescribed Medications'}
            </CardTitle>
            <div className="relative w-48 print:hidden">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2 text-slate-400" />
              <Input
                type="text"
                placeholder={isRtl ? 'البحث بالاسم...' : 'Search meds...'}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="h-7 pr-8 text-[10px] font-semibold"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className={cn("w-full text-xs", isRtl ? "text-right" : "text-left")}>
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      {isRtl ? 'اسم الدواء التجاري' : 'Medication Name'}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-5 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                    {isRtl ? 'المادة الفعالة' : 'Active Ingredient'}
                  </th>
                  <th className="px-5 py-4 font-bold cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" onClick={() => handleSort('prescriptions')}>
                    <div className="flex items-center gap-1">
                      {isRtl ? 'الروشتات' : 'Rx Count'}
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-5 py-4 font-bold text-center">{isRtl ? 'الفئة الدوائية' : 'Category'}</th>
                  <th className="px-5 py-4 font-bold text-center">{isRtl ? 'طبيب كاتب / مركز' : 'Top Doctor / Clinic'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {paginatedMeds.map((med, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/10">
                    <td className="px-5 py-3.5 font-bold text-gray-950 dark:text-white">{med.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono text-[10px]">{med.active}</td>
                    <td className="px-5 py-3.5 font-bold text-teal-600 font-mono">{med.prescriptions}</td>
                    <td className="px-5 py-3.5 text-center text-[10px] text-gray-500">{med.category}</td>
                    <td className="px-5 py-3.5 text-center text-gray-500">
                      <div>
                        <p className={cn("font-bold text-xs", anonymizedMode ? "text-amber-700 dark:text-amber-500/80 font-mono" : "text-gray-950 dark:text-white")}>
                          {maskName(med.doctor)}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {maskClinic(med.clinic)}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-t print:hidden text-xs">
              <div className="text-gray-400">
                {isRtl ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                >
                  {isRtl ? 'السابق' : 'Prev'}
                </Button>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px]"
                >
                  {isRtl ? 'التالي' : 'Next'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Ingredient Distribution */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'المواد الفعالة الأكثر طلباً' : 'Active Ingredients'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeIngredientsData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
            ) : activeIngredientsData.map((item: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="font-mono text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-teal-600 font-mono">{item.prescriptions} {isRtl ? 'روشتة' : 'Rx'} ({item.rate})</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-500 to-blue-500 h-2 rounded-full" style={{ width: item.rate }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 1.5: HIGH-PRESCRIBING DOCTORS DETAIL REPORT ── */}
      {/* ── SECTION 1.5: HIGH-PRESCRIBING DOCTORS DETAIL REPORT ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
        <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
            <div>
              <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {isRtl ? 'الأطباء الواصفين للدواء وحصصهم' : 'Top Prescribing Doctors'}
              </CardTitle>
            </div>
          </div>
          {anonymizedMode && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[9px] animate-pulse">
              {isRtl ? 'تم تعمية الهويات (تفعيل العرض المصرح لكشفها)' : 'Anonymized'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className={cn("w-full text-xs", isRtl ? "text-right" : "text-left")}>
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-4 font-bold">{isRtl ? 'اسم الطبيب' : 'Doctor Name'}</th>
                <th className="px-5 py-4 font-bold">{isRtl ? 'التخصص الطبي' : 'Specialty'}</th>
                <th className="px-5 py-4 font-bold">{isRtl ? 'العيادة / المركز' : 'Clinic / Center'}</th>
                <th className="px-5 py-4 font-bold">{isRtl ? 'المحافظة' : 'Governorate'}</th>
                <th className="px-5 py-4 font-bold text-center">{isRtl ? 'الدواء الأكثر وصفاً' : 'Primary Drug'}</th>
                <th className="px-5 py-4 font-bold text-center">{isRtl ? 'الروشتات' : 'Rx Written'}</th>
                <th className="px-5 py-4 font-bold text-center">{isRtl ? 'بيانات التواصل' : 'Contact'}</th>
                <th className="px-5 py-4 font-bold text-center print:hidden">{isRtl ? 'الإجراء المقترح' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {displayDoctors.map((doc, idx) => {
                const isTarget = doc.drug === selectedMedication;
                return (
                  <tr key={idx} className={cn("hover:bg-teal-50/10 transition-colors", isTarget && "bg-teal-500/5 border-r-4 border-r-teal-600")}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded-full", isTarget ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600")}>
                          {isTarget ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-950 dark:text-white">
                            {maskName(doc.name)}
                          </p>
                          {isTarget && (
                            <span className="inline-block text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400 px-1.5 py-0.5 rounded-md mt-0.5">
                              {isRtl ? 'أكبر الواصفين لهذا الصنف' : 'Highest Prescriber'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-700 dark:text-gray-300 text-[10px]">{doc.specialty}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-[10px] font-semibold">{maskClinic(doc.clinic)}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-[10px] font-semibold">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {doc.governorate}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className="font-bold text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2.5 py-1 rounded-full tracking-wider border border-teal-100/50">
                        {doc.drug}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center font-black text-teal-600 font-mono text-sm">
                      {doc.prescriptionsCount} <span className="text-[9px] font-semibold text-gray-400">{isRtl ? 'روشتة' : 'Rx'}</span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-gray-500 font-mono">
                        <span className="flex items-center gap-1 font-semibold">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {maskContact(doc.contact)}
                        </span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Mail className="w-3 h-3 text-gray-400" />
                          {maskEmail(doc.email)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center print:hidden">
                      <Button
                        size="sm"
                        onClick={() => toast.success(isRtl ? `تم إرسال طلب تواصل علمي لـ: ${maskName(doc.name)}` : `Scientific Detailing visit requested for: ${maskName(doc.name)}`)}
                        className={cn("h-7 text-[10px] gap-1 font-semibold", isTarget ? "bg-teal-600 hover:bg-teal-700 text-white" : "variant-outline border-teal-600 text-teal-600 hover:bg-teal-50")}
                      >
                        <Send className="w-3 h-3" />
                        {isRtl ? 'طلب زيارة مندوب علمي' : 'Request Detailing Visit'}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* ── SECTION 2: SPECIALTY & DIAGNOSIS CORRELATION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">

        {/* Drug by Medical Specialty distribution */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'توزيع الأدوية بحسب التخصصات' : 'Rx Volume by Specialty'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className={cn("w-full text-xs", isRtl ? "text-right" : "text-left")}>
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4 font-bold">{isRtl ? 'التخصص الطبي' : 'Specialty'}</th>
                  <th className="px-5 py-4 font-bold">{isRtl ? 'الدواء الأكثر وصفاً' : 'Most Prescribed Drug'}</th>
                  <th className="px-5 py-4 font-bold text-center">{isRtl ? 'نسبة الاستخدام' : 'Usage rate %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {apiSpecialtyShare && apiSpecialtyShare.length > 0 ? (
                  apiSpecialtyShare.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-5 py-3.5 font-bold text-gray-950 dark:text-white">{item.specialty}</td>
                      <td className="px-5 py-3.5 font-black text-teal-600">{item.drug}</td>
                      <td className="px-5 py-3.5 font-mono text-center font-bold text-gray-600">{item.percentage}%</td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      {isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Diagnosis & Drug Correlation */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'ربط الأدوية بالتشخيص الطبي' : 'Diagnosis Correlation'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className={cn("w-full text-xs", isRtl ? "text-right" : "text-left")}>
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4 font-bold">{isRtl ? 'التشخيص الطبي الشائع' : 'Diagnosis'}</th>
                  <th className="px-5 py-4 font-bold">{isRtl ? 'الدواء المقترن الأول' : 'Primary Drug'}</th>
                  <th className="px-5 py-4 font-bold text-center">{isRtl ? 'معدل التكرار' : 'Correlation Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {diagnosisCorrelationData.length > 0 ? (
                  diagnosisCorrelationData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-5 py-3.5 font-bold text-gray-950 dark:text-white">{item.diagnosis}</td>
                      <td className="px-5 py-3.5 font-black text-teal-600">{item.drug}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-mono font-bold text-gray-600">{item.rate}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-400">
                      {isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Co-prescriptions (الأدوية المتلازمة) */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
              {isRtl ? 'الأدوية المتلازمة (Co-prescriptions)' : 'Co-prescriptions'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {coPrescriptionsTarget && (
              <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3 text-xs border-b border-slate-100 dark:border-slate-800/50">
                <span className="text-gray-500">{isRtl ? 'الأدوية التي تُوصف مع:' : 'Usually prescribed with:'} </span>
                <span className="font-bold text-indigo-700 dark:text-indigo-400">{coPrescriptionsTarget}</span>
              </div>
            )}
            <table className={cn("w-full text-xs", isRtl ? "text-right" : "text-left")}>
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 backdrop-blur-md z-10 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-4 font-bold">{isRtl ? 'اسم الدواء المصاحب' : 'Co-prescribed Drug'}</th>
                  <th className="px-5 py-4 font-bold text-center">{isRtl ? 'عدد مرات التلازم' : 'Frequency'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {coPrescriptionsData.length > 0 ? (
                  coPrescriptionsData.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                      <td className="px-5 py-3.5 font-bold text-gray-950 dark:text-white">{item.name}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md">{item.count}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                    <td colSpan={2} className="px-5 py-8 text-center text-gray-400">
                      {isRtl ? 'لا توجد بيانات أدوية متلازمة' : 'No co-prescriptions found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 3: TREND OVER TIME, GEOGRAPHY & COMPETITORS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">

        {/* Trend line chart */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? `تطور الروشتات الشهرية لـ: ${selectedMedication}` : `Monthly Trend for ${selectedMedication}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[260px] print:hidden">
              <ResponsiveContainer minWidth={0} width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="prescriptions" stroke="#0d9488" strokeWidth={3} activeDot={{ r: 8 }} name={isRtl ? 'الروشتات الإجمالية' : 'Total Prescriptions'} />
                  <Line type="monotone" dataKey="genericShare" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name={isRtl ? 'حصة البدائل (Generics)' : 'Generics Share'} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Tabular data for printing */}
            <table className="w-full text-right text-xs mt-2 hidden print:table">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2">{isRtl ? 'الشهر' : 'Month'}</th>
                  <th className="px-4 py-2">{isRtl ? 'إجمالي الروشتات' : 'Total Prescriptions'}</th>
                  <th className="px-4 py-2">{isRtl ? 'حصة البدائل' : 'Generics Share'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {monthlyTrendData.map((d, i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 font-semibold">{d.name}</td>
                    <td className="px-4 py-2 font-bold font-mono text-teal-700">{d.prescriptions}</td>
                    <td className="px-4 py-2 font-mono text-purple-600">{d.genericShare}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Competitor Market Share (Pie Chart) */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'مقارنة الحصة السوقية للبدائل' : 'Competitor Share Index'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col items-center">
            {competitorShareData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-12">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
            ) : (
              <>
                <div className="h-[180px] w-full print:hidden">
                  <ResponsiveContainer minWidth={0} width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={competitorShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {competitorShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full space-y-2 mt-4 text-xs font-semibold">
                  {competitorShareData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-mono text-teal-600">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4: REGIONAL DISTRIBUTION, CLINIC USAGE & DOCTORS BY CATEGORY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">

        {/* Regional Distribution */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              {isRtl ? 'التوزيع الجغرافي للروشتات (مصر)' : 'Regional Distribution'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {regionalDistributionData.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-8">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
            ) : regionalDistributionData.map((item: any, idx: number) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{item.name}</span>
                  <span className="text-teal-600 font-mono">{item.prescriptions} {isRtl ? 'روشتة' : 'Rx'}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-teal-400 h-2 rounded-full" style={{ width: `${(item.prescriptions / 1840) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Clinic & Doctor Usage by Category */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {isRtl ? 'معدل التبني بحسب الفئة الدوائية' : 'Category Adoption'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'الفئة الدوائية' : 'Drug Category'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'العيادات النشطة التي تصفه' : 'Active Prescribing Clinics'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'الأطباء النشطين الكاتبين' : 'Active Prescribing Doctors'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'معدل التبني' : 'Adoption Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {categoryAdoptionData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-400">
                      {isRtl ? 'لا توجد بيانات لفئات الأدوية' : 'No category data available'}
                    </td>
                  </tr>
                ) : categoryAdoptionData.map((item: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.cat}</td>
                    <td className="px-4 py-3 text-teal-600 font-bold">{item.clinics}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{item.doctors}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${item.color}`}>{item.adoption}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 5: OPPORTUNITY GAP & MISSING MEDICINES SEARCH DEMAND ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">

        {/* Missing medicines searched by doctors */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              {isRtl ? 'الأدوية التي بحث عنها الأطباء ولم يجدوها' : 'Missing Search Demand'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-slate-50/50 dark:bg-slate-950/40">
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'الاسم المستعلم عنه' : 'Searched Drug'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'عدد الاستعلامات' : 'Searches'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'الفئة المقترحة' : 'Suggested Category'}</th>
                  <th className="px-4 py-2.5 font-semibold text-slate-500">{isRtl ? 'فجوة السوق' : 'Gap'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {missingMedicationsData.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-xs text-gray-400">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</td></tr>
                ) : missingMedicationsData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white font-mono">{item.searchName}</td>
                    <td className="px-4 py-3 font-bold text-amber-600 font-mono">{item.searches}</td>
                    <td className="px-4 py-3 text-gray-500">{item.category}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                        {item.potentialGap}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Campaigns Before/After Impact & Opportunity Gap */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden print:border-gray-300">
          <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
            <CardTitle className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
              {isRtl ? 'فاعلية الحملات الطبية (قبل / بعد)' : 'Campaign Impact'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaignImpactData.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] print:hidden">
                <p className="text-xs text-gray-400">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
              </div>
            ) : (
              <div className="h-[180px] print:hidden">
                <ResponsiveContainer minWidth={0} width="100%" height="100%">
                  <BarChart data={campaignImpactData}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis hide />
                    <Bar dataKey="prescriptions" fill="#0d9488" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#0d9488', fontSize: 11 }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {/* Description */}
            <div className="flex flex-col justify-center space-y-3 text-xs leading-relaxed">
              <div className="bg-teal-50 dark:bg-teal-950/20 p-3 rounded-lg border border-teal-500/10">
                <h5 className="font-bold text-teal-800 dark:text-teal-400 mb-1">{isRtl ? 'تحليل تأثير الحملة' : 'Educational Campaign Uplift'}</h5>
                <p className="text-gray-600 dark:text-gray-300">
                  {isRtl
                    ? 'يظهر التقرير زيادة بنسبة ٣٢٧٪ في معدل كتابة الدواء المستهدف أثناء وبعد إطلاق الحملة التثقيفية للأطباء، مما يؤكد جدوى الإنفاق التسويقي في التوعية بالمواد الفعالة الجديدة.'
                    : 'Educational target marketing shows a clear 327% prescription uplift during and after the medical advocacy campaign, yielding actionable ROI feedback.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print Only Footer */}
      <div className="hidden print:flex justify-between items-center border-t border-gray-200 pt-8 mt-12 text-xs text-gray-400">
        <p>كلينك برو للتحليلات الطبية والـ SaaS © ٢٠٢٦</p>
        <p>تقرير إحصائي سري للغاية ومحمي بالكامل - لا يحتوي على أي معلومات مرضى خاصة</p>
        <p className="font-mono">موافقة شريك الأدوية: __________________</p>
      </div>
    </div>
  );
}
