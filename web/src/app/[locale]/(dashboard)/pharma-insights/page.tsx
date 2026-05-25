'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, Pill, Users, Landmark, AlertTriangle, ArrowUpDown,
  Search, ShieldAlert, FileSpreadsheet, FileDown, CheckCircle2,
  TrendingDown, Globe, MapPin, Eye, EyeOff, User, Sparkles, Filter, RefreshCw,
  Phone, Mail, Send, Award
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

  // State Management
  const [anonymizedMode, setAnonymizedMode] = useState(true);
  const [selectedGovernorate, setSelectedGovernorate] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedMedication, setSelectedMedication] = useState('أوجمنتين (Augmentin)');
  const [dateRange, setDateRange] = useState('90days');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Table Sort and Pagination State
  const [sortKey, setSortKey] = useState<SortKey>('prescriptions');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // 1. Top Medicines Mock Data
  const topMedicationsData = [
    { name: 'أوجمنتين (Augmentin)', active: 'Amoxicillin + Clavulanic acid', prescriptions: 840, category: 'مضاد حيوي', growth: '+12%', doctor: 'د. خالد عبد الرحمن', clinic: 'عيادة الشروق التخصصية' },
    { name: 'كونكور (Concor)', active: 'Bisoprolol', prescriptions: 620, category: 'أدوية الضغط والقلب', growth: '+8%', doctor: 'د. سارة المنشاوي', clinic: 'مركز القلب المتكامل' },
    { name: 'بانادول إكسترا (Panadol)', active: 'Paracetamol + Caffeine', prescriptions: 580, category: 'مسكن وخافض حرارة', growth: '+15%', doctor: 'د. أحمد صبري', clinic: 'عيادة الرحاب الطبية' },
    { name: 'جالفوس مت (Galvus Met)', active: 'Vildagliptin + Metformin', prescriptions: 490, category: 'أدوية السكر', growth: '+5%', doctor: 'د. مروة الشافعي', clinic: 'عيادة السكر التخصصية' },
    { name: 'بروفين 400 (Brufen)', active: 'Ibuprofen', prescriptions: 410, category: 'مضاد للالتهابات ومسكن', growth: '-3%', doctor: 'د. عاصم الجوهري', clinic: 'مستشفى السلام الخاص' },
    { name: 'أوميز 20 (Omez)', active: 'Omeprazole', prescriptions: 370, category: 'أدوية المعدة والجهاز الهضمي', growth: '+20%', doctor: 'د. رانيا يوسف', clinic: 'المركز الهضمي الطبي' },
    { name: 'كلاريتين (Clarityne)', active: 'Loratadine', prescriptions: 320, category: 'مضادات الحساسية', growth: '+10%', doctor: 'د. هاني شاكر', clinic: 'عيادة النور لحديثي الولادة' }
  ];

  // 2. Active Ingredients Mock Data
  const activeIngredientsData = [
    { name: 'Paracetamol', prescriptions: 1420, rate: '28%' },
    { name: 'Amoxicillin', prescriptions: 980, rate: '19%' },
    { name: 'Metformin', prescriptions: 820, rate: '16%' },
    { name: 'Bisoprolol', prescriptions: 710, rate: '14%' },
    { name: 'Omeprazole', prescriptions: 650, rate: '13%' }
  ];

  // 3. Diagnosis and Drug Correlation
  const diagnosisCorrelationData = [
    { diagnosis: 'التهاب الشعب الهوائية الحاد', drug: 'أوجمنتين (Augmentin)', rate: '78%' },
    { diagnosis: 'ارتفاع ضغط الدم الأولي', drug: 'كونكور (Concor)', rate: '65%' },
    { diagnosis: 'مرض السكري من النوع الثاني', drug: 'جالفوس مت (Galvus Met)', rate: '72%' },
    { diagnosis: 'التهاب المعدة الحاد', drug: 'أوميز 20 (Omez)', rate: '88%' }
  ];

  // 4. Competitor Share Mock Data
  const competitorShareData = [
    { name: 'بانادول (Panadol)', value: 58 },
    { name: 'أدول (Adol)', value: 25 },
    { name: 'بارامول (Paramol)', value: 17 }
  ];

  // 5. Monthly Prescriptions Trend
  const monthlyTrendData = [
    { name: 'يناير', prescriptions: 410, genericShare: 210 },
    { name: 'فبراير', prescriptions: 490, genericShare: 240 },
    { name: 'مارس', prescriptions: 580, genericShare: 280 },
    { name: 'أبريل', prescriptions: 720, genericShare: 350 },
    { name: 'مايو', prescriptions: 840, genericShare: 410 }
  ];

  // 6. Regional distribution (Egypt Governorates)
  const regionalDistributionData = [
    { name: 'القاهرة الكبرى', prescriptions: 1840 },
    { name: 'الإسكندرية', prescriptions: 1120 },
    { name: 'الدلتا والوجه البحري', prescriptions: 940 },
    { name: 'الجيزة والقناة', prescriptions: 760 },
    { name: 'محافظات الصعيد', prescriptions: 590 }
  ];

  // 7. Missing medications searched by doctors
  const missingMedicationsData = [
    { searchName: 'فوركسيجا 10 (Forxiga)', searches: 145, category: 'أدوية السكر الحديثة', potentialGap: 'عالٍ جداً' },
    { searchName: 'انتريستو (Entresto)', searches: 98, category: 'أدوية فشل القلب الحديثة', potentialGap: 'عالٍ' },
    { searchName: 'ريبيلسوس 3 (Rybelsus)', searches: 84, category: 'أدوية السكر والسمنة', potentialGap: 'متوسط' }
  ];

  // 8. Campaigns before/after impact
  const campaignImpactData = [
    { name: 'قبل الحملة', prescriptions: 180 },
    { name: 'أثناء الحملة', prescriptions: 420 },
    { name: 'بعد الحملة (الاستدامة)', prescriptions: 590 }
  ];

  // 8b. Top Prescribing Doctors data with contact details
  const topDoctorsPrescribingData = [
    { name: 'د. خالد عبد الرحمن', specialty: 'أمراض باطنة وجهاز هضمي', clinic: 'عيادة الشروق التخصصية', governorate: 'القاهرة الكبرى', drug: 'أوجمنتين (Augmentin)', prescriptionsCount: 240, rate: '28.5%', contact: '01012345678', email: 'k.abdelrahman@clinicpro.eg' },
    { name: 'د. سارة المنشاوي', specialty: 'أمراض القلب والأوعية', clinic: 'مركز القلب المتكامل', governorate: 'الإسكندرية', drug: 'كونكور (Concor)', prescriptionsCount: 195, rate: '31.4%', contact: '01123456789', email: 's.almenshawi@clinicpro.eg' },
    { name: 'د. أحمد صبري', specialty: 'أطفال وحديثي الولادة', clinic: 'عيادة الرحاب الطبية', governorate: 'الجيزة والقناة', drug: 'بانادول إكسترا (Panadol)', prescriptionsCount: 180, rate: '31.0%', contact: '01234567890', email: 'a.sabry@clinicpro.eg' },
    { name: 'د. مروة الشافعي', specialty: 'غدد صماء وسكر', clinic: 'عيادة السكر التخصصية', governorate: 'الدلتا والوجه البحري', drug: 'جالفوس مت (Galvus Met)', prescriptionsCount: 155, rate: '31.6%', contact: '01545678901', email: 'm.elshafey@clinicpro.eg' },
    { name: 'د. عاصم الجوهري', specialty: 'عظام ومفاصل', clinic: 'مستشفى السلام الخاص', governorate: 'محافظات الصعيد', drug: 'بروفين 400 (Brufen)', prescriptionsCount: 130, rate: '31.7%', contact: '01098765432', email: 'a.elgohary@clinicpro.eg' },
    { name: 'د. رانيا يوسف', specialty: 'أمراض باطنة وجهاز هضمي', clinic: 'المركز الهضمي الطبي', governorate: 'القاهرة الكبرى', drug: 'أوميز 20 (Omez)', prescriptionsCount: 120, rate: '32.4%', contact: '01198765432', email: 'r.youssef@clinicpro.eg' },
    { name: 'د. هاني شاكر', specialty: 'أطفال وحديثي الولادة', clinic: 'عيادة النور لحديثي الولادة', governorate: 'الدلتا والوجه البحري', drug: 'كلاريتين (Clarityne)', prescriptionsCount: 95, rate: '29.6%', contact: '01298765432', email: 'h.shaker@clinicpro.eg' },
  ];

  // Filter doctors that write the selected medication or show all if none
  const targetDoctors = topDoctorsPrescribingData.filter(doc => doc.drug === selectedMedication);
  const otherDoctors = topDoctorsPrescribingData.filter(doc => doc.drug !== selectedMedication);
  const displayDoctors = [...targetDoctors, ...otherDoctors];

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

  const filteredMeds = topMedicationsData.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          med.active.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          med.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedMeds = [...filteredMeds].sort((a, b) => {
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
  const handlePdfExport = () => {
    window.print();
  };

  const COLORS = ['#0f766e', '#0284c7', '#8b5cf6', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      
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

      {/* ── ADVANCED FILTERS PANEL ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:hidden">
        <CardHeader className="pb-3 flex flex-row items-center gap-2">
          <Filter className="w-4 h-4 text-teal-600" />
          <CardTitle className="text-sm font-bold">{isRtl ? 'لوحة تصفية البيانات والذكاء الإقليمي المشترك' : 'Regional & Medication Filtering Panel'}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">{isRtl ? 'توزيع المحافظات (جغرافي)' : 'Governorate / Region'}</Label>
            <select
              value={selectedGovernorate}
              onChange={(e) => setSelectedGovernorate(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              <option value="all">{isRtl ? 'كل المحافظات (جمهورية مصر العربية)' : 'All Governorates (Egypt)'}</option>
              <option value="cairo">{isRtl ? 'القاهرة الكبرى' : 'Cairo Region'}</option>
              <option value="alex">{isRtl ? 'الإسكندرية والساحل' : 'Alexandria'}</option>
              <option value="delta">{isRtl ? 'الدلتا والوجه البحري' : 'Delta & North'}</option>
              <option value="upper">{isRtl ? 'محافظات الصعيد' : 'Upper Egypt'}</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{isRtl ? 'التخصص الطبي لكتابة الروشتة' : 'Medical Specialty'}</Label>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              <option value="all">{isRtl ? 'كل التخصصات الطبية' : 'All Specialties'}</option>
              <option value="internal">{isRtl ? 'باطنة وجهاز هضمي' : 'Internal Medicine'}</option>
              <option value="pedia">{isRtl ? 'أطفال وحديثي الولادة' : 'Pediatrics'}</option>
              <option value="ortho">{isRtl ? 'عظام ومفاصل' : 'Orthopedics'}</option>
              <option value="cardio">{isRtl ? 'أمراض القلب والأوعية' : 'Cardiology'}</option>
            </select>
          </div>

          <div className="space-y-2 font-semibold">
            <Label className="text-xs">{isRtl ? 'الدواء المستهدف بالتحليلات' : 'Target Medication'}</Label>
            <select
              value={selectedMedication}
              onChange={(e) => {
                setSelectedMedication(e.target.value);
                toast.success(isRtl ? `تم تغيير الدواء المستهدف إلى: ${e.target.value}` : `Target medication changed to: ${e.target.value}`);
              }}
              className="w-full h-9 rounded-lg border border-teal-600/30 dark:border-teal-500/20 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-teal-700 dark:text-teal-400 font-bold"
            >
              <option value="أوجمنتين (Augmentin)">أوجمنتين (Augmentin)</option>
              <option value="كونكور (Concor)">كونكور (Concor)</option>
              <option value="بانادول إكسترا (Panadol)">بانادول إكسترا (Panadol)</option>
              <option value="جالفوس مت (Galvus Met)">جالفوس مت (Galvus Met)</option>
              <option value="بروفين 400 (Brufen)">بروفين 400 (Brufen)</option>
              <option value="أوميز 20 (Omez)">أوميز 20 (Omez)</option>
              <option value="كلاريتين (Clarityne)">كلاريتين (Clarityne)</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{isRtl ? 'الفترة الزمنية للتحليل' : 'Analysis Timeframe'}</Label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 font-semibold"
            >
              <option value="30days">{isRtl ? 'آخر 30 يومًا' : 'Last 30 Days'}</option>
              <option value="90days">{isRtl ? 'آخر 90 يومًا (ربع سنوي)' : 'Last 90 Days (Quarterly)'}</option>
              <option value="180days">{isRtl ? 'آخر 6 أشهر' : 'Last 6 Months'}</option>
              <option value="365days">{isRtl ? 'آخر سنة كاملة' : 'Last Year'}</option>
            </select>
          </div>

          <div className="flex items-end font-semibold">
            <Button onClick={() => toast.success(isRtl ? 'تم تطبيق المعايير الديموغرافية والفلترة بنجاح!' : 'Demographic criteria applied successfully!')} className="bg-teal-600 hover:bg-teal-700 w-full h-9 gap-1 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
              {isRtl ? 'تطبيق التصفية' : 'Apply Filters'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── SECTION 1: TOP MEDICINES & ACTIVE INGREDIENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top prescribed table with sorting and pagination */}
        <Card className="lg:col-span-2 border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" />
              <CardTitle className="text-base">{isRtl ? 'التقرير الشامل للأدوية الأكثر وصفاً' : 'Top Prescribed Medications Report'}</CardTitle>
            </div>
            <div className="relative w-48 print:hidden">
              <Input
                type="text"
                placeholder={isRtl ? 'البحث بالاسم أو الفئة...' : 'Search meds...'}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="h-8 pr-8 text-xs font-semibold"
              />
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                  <th className="px-4 py-2.5 font-bold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">
                      {isRtl ? 'اسم الدواء التجاري' : 'Medication Name'}
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-2.5 font-bold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                    {isRtl ? 'المادة الفعالة' : 'Active Ingredient'}
                  </th>
                  <th className="px-4 py-2.5 font-bold text-gray-600 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('prescriptions')}>
                    <div className="flex items-center gap-1">
                      {isRtl ? 'الروشتات' : 'Rx Count'}
                      <ArrowUpDown className="w-3 h-3 text-gray-400" />
                    </div>
                  </th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الفئة الدوائية' : 'Category'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'طبيب كاتب / مركز' : 'Top Doctor / Clinic'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedMeds.map((med, idx) => (
                  <tr key={idx} className="hover:bg-teal-50/10">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{med.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono">{med.active}</td>
                    <td className="px-4 py-3 font-bold text-teal-600 font-mono">{med.prescriptions}</td>
                    <td className="px-4 py-3">{med.category}</td>
                    <td className="px-4 py-3 text-gray-500">
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
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-teal-600" /> {isRtl ? 'تقرير المواد الفعالة الأكثر طلباً' : 'Active Ingredients Share'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {activeIngredientsData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="font-mono text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-teal-600 font-mono">{item.prescriptions} {isRtl ? 'وصفة' : 'Rx'} ({item.rate})</span>
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
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600 animate-pulse" />
            <div>
              <CardTitle className="text-base">
                {isRtl ? 'كبار الأطباء الواصفين للدواء وحصصهم (High Prescribers & Target Doctors)' : 'Top Prescribing Doctors & Targets'}
              </CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">
                {isRtl 
                  ? `الأطباء الأكثر كتابة وتأثيراً في كتابة الأدوية. الدواء المحدد حالياً: ${selectedMedication}`
                  : `Top influencers and heavy prescribers. Selected: ${selectedMedication}`}
              </p>
            </div>
          </div>
          {anonymizedMode && (
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] animate-pulse">
              {isRtl ? 'تم تعمية الهويات تلقائياً (تفعيل العرض المصرح لكشف الأسماء والأرقام)' : 'Anonymized (Enable Authorized View to see actual details)'}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'اسم الطبيب' : 'Doctor Name'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'التخصص الطبي' : 'Specialty'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'العيادة / المركز' : 'Clinic / Center'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'المحافظة' : 'Governorate'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الدواء الأكثر وصفاً عنده' : 'Primary Prescribed Drug'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600 text-center">{isRtl ? 'الوصفات المكتوبة للدواء' : 'Rx Written'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600 text-center">{isRtl ? 'بيانات التواصل / البريد' : 'Contact / Email'}</th>
                <th className="px-4 py-2.5 font-bold text-gray-600 text-center print:hidden">{isRtl ? 'الإجراء المقترح' : 'Suggested Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {displayDoctors.map((doc, idx) => {
                const isTarget = doc.drug === selectedMedication;
                return (
                  <tr key={idx} className={cn("hover:bg-teal-50/10 transition-colors", isTarget && "bg-teal-500/5 border-r-4 border-r-teal-600")}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded-full", isTarget ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-600")}>
                          {isTarget ? <Award className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {maskName(doc.name)}
                          </p>
                          {isTarget && (
                            <span className="inline-block text-[9px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400 px-1.5 py-0.5 rounded-md mt-0.5 font-semibold">
                              {isRtl ? 'أكبر الواصفين لهذا الصنف' : 'Highest Prescriber'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{doc.specialty}</td>
                    <td className="px-4 py-3 text-gray-500">{maskClinic(doc.clinic)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {doc.governorate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/20 px-2 py-0.5 rounded">
                        {doc.drug}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-teal-600 font-mono text-sm">
                      {doc.prescriptionsCount} {isRtl ? 'روشتة' : 'Rx'}
                    </td>
                    <td className="px-4 py-3 text-center">
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
                    <td className="px-4 py-3 text-center print:hidden">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:break-inside-avoid">
        
        {/* Drug by Medical Specialty distribution */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="w-4 h-4 text-teal-600" /> {isRtl ? 'توزيع الأدوية بحسب التخصصات الطبية' : 'Prescription Volume by Specialty'}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'التخصص الطبي' : 'Specialty'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الدواء الأكثر وصفاً' : 'Most Prescribed Drug'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'نسبة الاستخدام' : 'Usage rate %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { spec: 'أمراض باطنة وجهاز هضمي', drug: 'أوجمنتين (Augmentin)', pct: '48%' },
                  { spec: 'أطفال وحديثي الولادة', drug: 'أوجمنتين شراب (Augmentin susp)', pct: '62%' },
                  { spec: 'أمراض القلب والأوعية', drug: 'كونكور (Concor)', pct: '54%' },
                  { spec: 'عظام ومفاصل', drug: 'بروفين 400 (Brufen)', pct: '38%' }
                ].map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.spec}</td>
                    <td className="px-4 py-3 font-bold text-teal-600">{item.drug}</td>
                    <td className="px-4 py-3 font-mono">{item.pct}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Diagnosis & Drug Correlation */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-600" /> {isRtl ? 'ربط الأدوية بالتشخيص الطبي (Diagnosis Correlation)' : 'Diagnosis & Drug Correlation'}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'التشخيص الطبي الشائع' : 'Diagnosis'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الدواء المقترن الأول' : 'Primary Drug'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'معدل التكرار في الروشتات' : 'Correlation Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {diagnosisCorrelationData.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.diagnosis}</td>
                    <td className="px-4 py-3 font-bold text-teal-700">{item.drug}</td>
                    <td className="px-4 py-3 font-mono font-bold text-teal-600">{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 3: TREND OVER TIME, GEOGRAPHY & COMPETITORS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">
        
        {/* Trend line chart */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300 lg:col-span-2">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-teal-600" /> {isRtl ? `تطور الروشتات الشهرية لـ: ${selectedMedication}` : `Monthly Trend for ${selectedMedication}`}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[260px] print:hidden">
              <ResponsiveContainer width="100%" height="100%">
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
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Landmark className="w-4 h-4 text-teal-600" /> {isRtl ? 'مقارنة الحصة السوقية للبدائل' : 'Competitor Share Index'}</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[180px] w-full print:hidden">
              <ResponsiveContainer width="100%" height="100%">
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
            {/* Custom Legend */}
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
          </CardContent>
        </Card>
      </div>

      {/* ── SECTION 4: REGIONAL DISTRIBUTION, CLINIC USAGE & DOCTORS BY CATEGORY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:break-inside-avoid">
        
        {/* Regional Distribution */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-teal-600" /> {isRtl ? 'التوزيع الجغرافي للوصفات (مصر)' : 'Regional Distribution'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {regionalDistributionData.map((item, idx) => (
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
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">{isRtl ? 'معدل تبني العيادات والأطباء بحسب الفئة الدوائية' : 'Clinic & Doctor Category Adoption'}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الفئة الدوائية' : 'Drug Category'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'العيادات النشطة التي تصفه' : 'Active Prescribing Clinics'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الأطباء النشطين الكاتبين' : 'Active Prescribing Doctors'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'معدل التبني للمنتجات الجديدة' : 'New Medicine Adoption Rate'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { cat: 'مضاد حيوي واسع المدى', clinics: '142 عيادة', doctors: '210 طبيب', adoption: 'عالٍ (84%)' },
                  { cat: 'أدوية القلب والضغط', clinics: '98 عيادة', doctors: '145 طبيب', adoption: 'متوسط (58%)' },
                  { cat: 'أدوية السكر والسمنة الحديثة', clinics: '76 عيادة', doctors: '112 طبيب', adoption: 'سريع جداً (92%)' },
                  { cat: 'مضادات الحساسية والربو', clinics: '115 عيادة', doctors: '168 طبيب', adoption: 'مستقر (70%)' }
                ].map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.cat}</td>
                    <td className="px-4 py-3 text-teal-600 font-bold">{item.clinics}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700">{item.doctors}</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-600">{item.adoption}</td>
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
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {isRtl ? 'الأدوية التي بحث عنها الأطباء ولم يجدوها (Missing Search)' : 'Missing Medicine Search Demand Report'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b bg-gray-50/80">
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الاسم المستعلم عنه' : 'Searched Drug'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'عدد الاستعلامات' : 'Searches'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'الفئة المقترحة' : 'Suggested Category'}</th>
                  <th className="px-4 py-2.5 font-bold text-gray-600">{isRtl ? 'فجوة السوق التقديرية' : 'Opportunity Gap'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {missingMedicationsData.map((item, idx) => (
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
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm print:border-gray-300">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-600" /> {isRtl ? 'تقرير قياس فاعلية الحملات الطبية (قبل / بعد)' : 'Campaign Impact Analysis (Before vs After)'}</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-[180px] print:hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignImpactData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis hide />
                  <Bar dataKey="prescriptions" fill="#0d9488" radius={[4, 4, 0, 0]} label={{ position: 'top', fill: '#0d9488', fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
