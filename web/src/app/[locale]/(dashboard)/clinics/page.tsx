'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Building2, Search, Plus, RefreshCw, Eye, Power, PowerOff,
  User, Mail, Phone, MapPin, CreditCard, ShieldAlert,
  Users, Stethoscope, CalendarDays, FileText, ChevronRight,
  TrendingUp, CircleDollarSign, Activity, Calendar, LayoutGrid, LayoutList,
  MoreHorizontal, Sparkles, SlidersHorizontal, AlertCircle, FileWarning, Trash2
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900',
  PRO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-900',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900',
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900',
  SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900',
  TRIAL: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900',
};

const STATUS_MAP_AR: Record<string, string> = {
  ACTIVE: 'نشط',
  SUSPENDED: 'موقوف / معطل',
  TRIAL: 'تجريبي',
};

const PLAN_MAP_AR: Record<string, string> = {
  FREE: 'باقة مجانية',
  BASIC: 'باقة أساسية',
  PRO: 'باقة احترافية',
  ENTERPRISE: 'باقة مؤسسات',
};

// Egypt Governorates & Cities for Relational Geolocation Filtering
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

// Address Parser: E.g., "طنطا، الغربية" -> City: "طنطا", Gov: "الغربية"
const parseAddress = (address: string, isRtl: boolean) => {
  if (!address) return { city: isRtl ? 'غير محدد' : 'N/A', gov: isRtl ? 'غير محدد' : 'N/A' };
  const parts = address.split(/[,،]/).map(p => p.trim());
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 2]?.replace(/^محافظة\s+/, '').trim() || parts[0],
      gov: parts[parts.length - 1]?.replace(/^محافظة\s+/, '').trim()
    };
  }
  return {
    city: address,
    gov: address
  };
};

export default function ClinicsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  // Primary Search Box State
  const [search, setSearch] = useState('');

  // Advanced Filters State Management
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [govFilter, setGovFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('ALL');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [healthFilter, setHealthFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [overdueFilter, setOverdueFilter] = useState('ALL');
  const [regDateFilter, setRegDateFilter] = useState('ALL');
  const [lastActivityFilter, setLastActivityFilter] = useState('ALL');

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [addOpen, setAddOpen] = useState(false);

  // Form State for Manual Addition
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [selectedNewGov, setSelectedNewGov] = useState('');
  const [selectedNewCity, setSelectedNewCity] = useState('');
  const [newStreetAddress, setNewStreetAddress] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerPassword, setNewOwnerPassword] = useState('');
  const [newSpecialization, setNewSpecialization] = useState('');
  const [newPlan, setNewPlan] = useState('FREE');
  const [newStatus, setNewStatus] = useState('ACTIVE');

  // Fetch Clinics from Backend
  const { data: clinics, isLoading, refetch } = useQuery<any[]>({
    queryKey: ['admin-clinics'],
    queryFn: () => api.get('/clinics').then((r) => r.data),
  });

  // Mutators
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/clinics/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(isRtl ? 'تم تحديث بيانات العيادة بنجاح' : 'Clinic settings updated successfully');
    },
    onError: () => {
      toast.error(isRtl ? 'فشل تحديث العيادة' : 'Failed to update clinic');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/clinics', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(isRtl ? 'تم تسجيل العيادة بنجاح' : 'Clinic registered successfully');
      setAddOpen(false);
      // Reset Form fields
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setSelectedNewGov('');
      setSelectedNewCity('');
      setNewStreetAddress('');
      setNewOwnerName('');
      setNewOwnerEmail('');
      setNewOwnerPassword('');
      setNewSpecialization('');
      setNewPlan('FREE');
      setNewStatus('ACTIVE');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || '';
      if (msg.includes('Email')) {
        toast.error(isRtl ? 'البريد الإلكتروني مستخدم بالفعل' : 'Email address is already in use');
      } else {
        toast.error(isRtl ? 'فشل تسجيل العيادة' : 'Failed to register clinic');
      }
    },
  });

  const handleToggleStatus = (id: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    updateMutation.mutate({ id, data: { subscriptionStatus: nextStatus } });
  };

  const handleChangePlan = (id: number, currentPlan: string, nextPlan: string) => {
    if (currentPlan === nextPlan) return;
    updateMutation.mutate({ id, data: { subscriptionPlan: nextPlan } });
  };

  const handleResetAll = () => {
    setSearch('');
    setOwnerSearch('');
    setPhoneSearch('');
    setEmailSearch('');
    setPlanFilter('ALL');
    setStatusFilter('ALL');
    setSpecializationFilter('ALL');
    setGovFilter('ALL');
    setCityFilter('ALL');
    setActivityFilter('ALL');
    setHealthFilter('ALL');
    setPriceFilter('ALL');
    setOverdueFilter('ALL');
    setRegDateFilter('ALL');
    setLastActivityFilter('ALL');
    toast.success(isRtl ? 'تم تصفير فلاتر البحث والمقارنة' : 'Filters cleared successfully');
  };

  // Calculations & Dynamic lists for filtering
  const allSpecializations = Array.from(
    new Set((clinics || []).flatMap((c: any) => c.specializations || []))
  ).filter(Boolean) as string[];

  // Complete static lists of all 27 Egypt Governorates for robust regional filtering
  const allGovernorates = EGYPT_GOVERNORATES.map((g) => isRtl ? g.nameAr : g.nameEn);

  // Dynamic Cities Filter: dynamically displays corresponding cities based on the selected governorate
  const selectedGovObj = EGYPT_GOVERNORATES.find(
    (g) => (isRtl ? g.nameAr : g.nameEn) === govFilter
  );
  
  const allCitiesFiltered = govFilter === 'ALL'
    ? Array.from(new Set(EGYPT_GOVERNORATES.flatMap((g) => g.cities)))
    : (selectedGovObj ? selectedGovObj.cities : []);

  // Filtering Logic
  const filteredClinics = (clinics || []).filter((c: any) => {
    const query = search.toLowerCase();
    
    // 1. General Search (Clinic name, phone, address, owner name, owner email)
    const matchesSearch = !search ||
      c.name?.toLowerCase().includes(query) ||
      c.phone?.toLowerCase().includes(query) ||
      c.address?.toLowerCase().includes(query) ||
      c.owner?.name?.toLowerCase().includes(query) ||
      c.owner?.email?.toLowerCase().includes(query);

    // 2. Advanced basic text searches
    const matchesOwner = !ownerSearch || c.owner?.name?.toLowerCase().includes(ownerSearch.toLowerCase());
    const matchesPhone = !phoneSearch || c.phone?.toLowerCase().includes(phoneSearch.toLowerCase());
    const matchesEmail = !emailSearch || c.owner?.email?.toLowerCase().includes(emailSearch.toLowerCase());

    // 3. Plan & Status
    const matchesPlan = planFilter === 'ALL' || c.subscriptionPlan === planFilter;
    const matchesStatus = statusFilter === 'ALL' || c.subscriptionStatus === statusFilter;

    // 4. Specialization
    const matchesSpecialization = specializationFilter === 'ALL' || 
      (c.specializations || []).includes(specializationFilter);

    // 5. Governorate & City (Egyptian Dynamic Address System)
    const addressParsed = parseAddress(c.address, isRtl);
    
    const cGovNameAr = c.governorate?.nameAr || '';
    const cGovNameEn = c.governorate?.nameEn || '';
    const cGovCode = c.governorate?.code || '';
    
    const cCityNameAr = c.city?.nameAr || '';
    const cCityNameEn = c.city?.nameEn || '';
    const cCityCode = c.city?.code || '';

    let matchesGov = true;
    if (govFilter !== 'ALL') {
      const selectedGovObj = EGYPT_GOVERNORATES.find(
        (g) => g.id === govFilter || g.nameAr === govFilter || g.nameEn === govFilter
      );
      if (selectedGovObj) {
        // Relational DB match check
        const matchesDbGov = (cGovNameAr && (cGovNameAr === selectedGovObj.nameAr || cGovNameEn === selectedGovObj.nameEn)) ||
                             (cGovCode && (cGovCode.toLowerCase() === selectedGovObj.id.toLowerCase() || cGovNameEn.toLowerCase() === selectedGovObj.id.toLowerCase()));
        
        // Text parsing fallback check
        const cGovText = (addressParsed.gov || '').trim();
        const matchesTextGov = cGovText === selectedGovObj.id ||
                               cGovText === selectedGovObj.nameAr ||
                               cGovText === selectedGovObj.nameEn ||
                               cGovText.includes(selectedGovObj.nameAr) ||
                               cGovText.includes(selectedGovObj.nameEn) ||
                               selectedGovObj.nameAr.includes(cGovText) ||
                               selectedGovObj.nameEn.includes(cGovText);
                               
        matchesGov = matchesDbGov || matchesTextGov;
      } else {
        matchesGov = addressParsed.gov === govFilter || cGovNameAr === govFilter || cGovNameEn === govFilter;
      }
    }

    let matchesCity = true;
    if (cityFilter !== 'ALL') {
      const cCityText = (addressParsed.city || '').trim();
      const matchesTextCity = cCityText === cityFilter ||
                              cCityText.includes(cityFilter) ||
                              cityFilter.includes(cCityText);
                              
      const matchesDbCity = (cCityNameAr && cCityNameAr === cityFilter) ||
                            (cCityNameEn && cCityNameEn.toLowerCase() === cityFilter.toLowerCase());
                            
      matchesCity = matchesDbCity || matchesTextCity;
    }

    // 6. Activity status
    let matchesActivity = true;
    if (activityFilter === 'ACTIVE') {
      matchesActivity = (c.stats?.appointments || 0) > 0 && c.subscriptionStatus === 'ACTIVE';
    } else if (activityFilter === 'IDLE') {
      matchesActivity = (c.stats?.appointments || 0) === 0 || c.subscriptionStatus === 'SUSPENDED';
    }

    // 7. Performance and growth index
    let matchesHealth = true;
    if (healthFilter === 'TOP_REVENUE') {
      matchesHealth = (c.revenue || 0) >= 10000;
    } else if (healthFilter === 'HIGH_USAGE') {
      matchesHealth = (c.stats?.patients || 0) >= 20;
    } else if (healthFilter === 'DORMANT') {
      matchesHealth = (c.stats?.patients || 0) === 0;
    } else if (healthFilter === 'NEWLY_REGISTERED') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      matchesHealth = new Date(c.createdAt || Date.now()) >= sevenDaysAgo;
    }

    // 8. Presence of Overdue Invoices (from Backend state logic)
    let matchesOverdue = true;
    if (overdueFilter === 'YES') {
      matchesOverdue = c.hasPendingInvoices === true;
    } else if (overdueFilter === 'NO') {
      matchesOverdue = c.hasPendingInvoices === false;
    }

    // 9. Subscription Price Range
    let matchesPrice = true;
    if (priceFilter === 'FREE') {
      matchesPrice = (c.revenue || 0) === 0;
    } else if (priceFilter === 'LOW') {
      matchesPrice = (c.revenue || 0) > 0 && (c.revenue || 0) < 500;
    } else if (priceFilter === 'MEDIUM') {
      matchesPrice = (c.revenue || 0) >= 500 && (c.revenue || 0) <= 2000;
    } else if (priceFilter === 'HIGH') {
      matchesPrice = (c.revenue || 0) > 2000;
    }

    // 10. Registration Date
    let matchesRegDate = true;
    if (regDateFilter !== 'ALL') {
      const now = new Date();
      const dateLimit = new Date();
      if (regDateFilter === 'TODAY') dateLimit.setHours(0, 0, 0, 0);
      else if (regDateFilter === 'WEEK') dateLimit.setDate(now.getDate() - 7);
      else if (regDateFilter === 'MONTH') dateLimit.setMonth(now.getMonth() - 1);
      else if (regDateFilter === 'YEAR') dateLimit.setFullYear(now.getFullYear() - 1);

      matchesRegDate = new Date(c.createdAt || Date.now()) >= dateLimit;
    }

    // 11. Last Activity Date
    let matchesLastActivity = true;
    if (lastActivityFilter !== 'ALL') {
      const now = new Date();
      const cActivity = new Date(c.lastActivity || c.createdAt);
      if (lastActivityFilter === 'TODAY') {
        const todayLimit = new Date(); todayLimit.setHours(0, 0, 0, 0);
        matchesLastActivity = cActivity >= todayLimit;
      } else if (lastActivityFilter === 'WEEK') {
        const weekLimit = new Date(); weekLimit.setDate(now.getDate() - 7);
        matchesLastActivity = cActivity >= weekLimit;
      } else if (lastActivityFilter === 'MONTH') {
        const monthLimit = new Date(); monthLimit.setMonth(now.getMonth() - 1);
        matchesLastActivity = cActivity >= monthLimit;
      } else if (lastActivityFilter === 'IDLE_30_DAYS') {
        const limit30 = new Date(); limit30.setDate(now.getDate() - 30);
        matchesLastActivity = cActivity < limit30;
      }
    }

    return matchesSearch && matchesOwner && matchesPhone && matchesEmail &&
      matchesPlan && matchesStatus && matchesSpecialization &&
      matchesGov && matchesCity && matchesActivity && matchesHealth &&
      matchesOverdue && matchesPrice && matchesRegDate && matchesLastActivity;
  });

  const totalClinics = clinics?.length || 0;
  const activeClinics = clinics?.filter((c: any) => c.subscriptionStatus === 'ACTIVE').length || 0;
  const totalRevenue = clinics?.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0) || 0;
  const totalPatients = clinics?.reduce((sum: number, c: any) => sum + (c.stats?.patients || 0), 0) || 0;

  // Active filters helper count
  const hasActiveFilters = search || ownerSearch || phoneSearch || emailSearch ||
    planFilter !== 'ALL' || statusFilter !== 'ALL' || specializationFilter !== 'ALL' ||
    govFilter !== 'ALL' || cityFilter !== 'ALL' || activityFilter !== 'ALL' ||
    healthFilter !== 'ALL' || priceFilter !== 'ALL' || overdueFilter !== 'ALL' ||
    regDateFilter !== 'ALL' || lastActivityFilter !== 'ALL';

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600" />
            {isRtl ? 'إدارة العيادات' : 'Clinics Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl ? 'مراقبة تراخيص العيادات وخطط الاشتراك وإحصاءات الأداء العام للمنصة' : 'Monitor registered clinics, subscription plans, and platform-wide performance metrics'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* View Mode Toggle Switch */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200/60 dark:border-gray-800/80 h-9">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('table')}
              className={`h-8 px-2.5 text-xs gap-1.5 rounded-md transition-all ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRtl ? 'جدول' : 'Table'}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('cards')}
              className={`h-8 px-2.5 text-xs gap-1.5 rounded-md transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-xs font-bold' 
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isRtl ? 'كروت' : 'Cards'}</span>
            </Button>
          </div>

          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 h-9">
            <RefreshCw className="w-4 h-4 text-gray-500" />
            {isRtl ? 'تحديث' : 'Refresh'}
          </Button>

          {/* ADD CLINIC MODAL */}
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger
              render={
                <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5 h-9 shadow-xs font-bold text-xs">
                  <Plus className="w-4 h-4" />
                  {isRtl ? 'تسجيل عيادة جديدة' : 'Register New Clinic'}
                </Button>
              }
            />
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Building2 className="w-5 h-5" />
                  {isRtl ? 'تسجيل عيادة جديدة على المنصة' : 'Register New Clinic on Platform'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">{isRtl ? 'اسم العيادة (بالكامل)' : 'Clinic Name'}</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={isRtl ? 'مثال: عيادة النور التخصصية' : 'e.g. Al Noor Specialized Clinic'} className="h-9" />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="01xxxxxxxxx" className="h-9" />
                </div>
                {/* Relational Egypt Geolocation Dropdowns for Consistent Seeding & Relational Integrity */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'المحافظة بمصر *' : 'Governorate *'}</Label>
                  <select
                    value={selectedNewGov}
                    onChange={(e) => {
                      setSelectedNewGov(e.target.value);
                      setSelectedNewCity('');
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">{isRtl ? '-- اختر المحافظة --' : '-- Select Governorate --'}</option>
                    {EGYPT_GOVERNORATES.map((g) => (
                      <option key={g.id} value={g.id}>{isRtl ? g.nameAr : g.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'المدينة / المنطقة *' : 'City / Area *'}</Label>
                  <select
                    disabled={!selectedNewGov}
                    value={selectedNewCity}
                    onChange={(e) => setSelectedNewCity(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <option value="">{isRtl ? '-- اختر المدينة --' : '-- Select City --'}</option>
                    {(EGYPT_GOVERNORATES.find(g => g.id === selectedNewGov)?.cities || []).map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-semibold">{isRtl ? 'العنوان التفصيلي (الشارع، المبنى)' : 'Detailed Address (Street, Building)'}</Label>
                  <Input
                    value={newStreetAddress}
                    onChange={(e) => setNewStreetAddress(e.target.value)}
                    placeholder={isRtl ? 'مثال: شارع الجلاء، برج الأطباء' : 'e.g. Al-Galaa St, Doctors Tower'}
                    className="h-9"
                  />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 md:col-span-2 my-1" />
                
                <div className="space-y-1.5 md:col-span-2">
                  <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block mb-1">{isRtl ? 'بيانات طبيب الإدارة / مالك العيادة' : 'Clinic Manager / Doctor Owner Credentials'}</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'اسم الطبيب المالك' : 'Owner Doctor Name'}</Label>
                  <Input value={newOwnerName} onChange={(e) => setNewOwnerName(e.target.value)} placeholder={isRtl ? 'د. محمد علي' : 'Dr. Mohamed Ali'} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'التخصص الطبي' : 'Specialization'}</Label>
                  <Input value={newSpecialization} onChange={(e) => setNewSpecialization(e.target.value)} placeholder={isRtl ? 'مثال: طب الأطفال' : 'e.g. Pediatrics'} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'البريد الإلكتروني لتسجيل الدخول' : 'Login Email'}</Label>
                  <Input type="email" value={newOwnerEmail} onChange={(e) => setNewOwnerEmail(e.target.value)} placeholder="doctor@clinic.com" className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'كلمة المرور' : 'Password'}</Label>
                  <Input type="password" value={newOwnerPassword} onChange={(e) => setNewOwnerPassword(e.target.value)} placeholder={isRtl ? 'افترضي: 123456' : 'Default: 123456'} className="h-9" />
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 md:col-span-2 my-1" />

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'باقة الاشتراك' : 'Subscription Plan'}</Label>
                  <select value={newPlan} onChange={(e) => setNewPlan(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="FREE">{isRtl ? 'مجانية (FREE)' : 'FREE'}</option>
                    <option value="BASIC">{isRtl ? 'أساسية (BASIC)' : 'BASIC'}</option>
                    <option value="PRO">{isRtl ? 'احترافية (PRO)' : 'PRO'}</option>
                    <option value="ENTERPRISE">{isRtl ? 'مؤسسات (ENTERPRISE)' : 'ENTERPRISE'}</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{isRtl ? 'حالة الحساب' : 'Account Status'}</Label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                    <option value="ACTIVE">{isRtl ? 'نشط (ACTIVE)' : 'ACTIVE'}</option>
                    <option value="TRIAL">{isRtl ? 'فترة تجريبية (TRIAL)' : 'TRIAL'}</option>
                    <option value="SUSPENDED">{isRtl ? 'معطل (SUSPENDED)' : 'SUSPENDED'}</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
                <Button size="sm" className="bg-teal-600 hover:bg-teal-700" disabled={createMutation.isPending} onClick={() => {
                  if (!newName || !newOwnerName || !newOwnerEmail) {
                    toast.error(isRtl ? 'يرجى إدخال اسم العيادة واسم المالك والبريد الإلكتروني' : 'Please fill clinic name, owner name and login email');
                    return;
                  }

                  // Standardize address format for perfect parsing: streetAddress، city، محافظة governorate
                  const govObj = EGYPT_GOVERNORATES.find((g) => g.id === selectedNewGov);
                  const govName = isRtl ? govObj?.nameAr : govObj?.nameEn;
                  const finalAddress = selectedNewGov
                    ? `${newStreetAddress || ''}، ${selectedNewCity || ''}، محافظة ${govName || ''}`
                    : newAddress;

                  createMutation.mutate({
                    name: newName,
                    phone: newPhone || undefined,
                    address: finalAddress || undefined,
                    ownerName: newOwnerName,
                    email: newOwnerEmail,
                    password: newOwnerPassword || '123456',
                    specialization: newSpecialization || undefined,
                    subscriptionPlan: newPlan,
                    subscriptionStatus: newStatus,
                  });
                }}>
                  {createMutation.isPending ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : (isRtl ? 'حفظ وتسجيل' : 'Save & Register')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── BENTO SUMMARY STATS GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: isRtl ? 'إجمالي العيادات المسجلة' : 'Total Clinics Registered',
            value: totalClinics,
            sub: isRtl ? `${activeClinics} عيادة نشطة حالياً` : `${activeClinics} active currently`,
            icon: Building2,
            gradient: 'border-l-4 border-l-teal-600',
            bg: 'bg-teal-50/10 dark:bg-teal-950/5',
          },
          {
            title: isRtl ? 'العوائد الإجمالية للمنصة' : 'Total Platform Revenues',
            value: isRtl ? `${totalRevenue.toLocaleString()} ج.م` : `${totalRevenue.toLocaleString()} EGP`,
            sub: isRtl ? 'الاشتراكات والفواتير المحصلة' : 'From fully paid invoices',
            icon: CircleDollarSign,
            gradient: 'border-l-4 border-l-emerald-500',
            bg: 'bg-emerald-50/10 dark:bg-emerald-950/5',
          },
          {
            title: isRtl ? 'إجمالي مرضى المنصة' : 'Cumulative Platform Patients',
            value: totalPatients.toLocaleString(),
            sub: isRtl ? 'عبر جميع عيادات المنصة' : 'Across all tenant clinics',
            icon: Users,
            gradient: 'border-l-4 border-l-blue-500',
            bg: 'bg-blue-50/10 dark:bg-blue-950/5',
          },
          {
            title: isRtl ? 'المواعيد والزيارات المسجلة' : 'Platform Appointments',
            value: (clinics?.reduce((sum: number, c: any) => sum + (c.stats?.appointments || 0), 0) || 0).toLocaleString(),
            sub: isRtl ? 'إجمالي الحجوزات الطبية' : 'Total medical engagements',
            icon: CalendarDays,
            gradient: 'border-l-4 border-l-purple-500',
            bg: 'bg-purple-50/10 dark:bg-purple-950/5',
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card key={idx} className={`border border-gray-200/60 dark:border-gray-800/60 shadow-xs ${stat.gradient} ${stat.bg}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 font-semibold block">{stat.title}</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white block">{isLoading ? <Skeleton className="h-7 w-16" /> : stat.value}</span>
                  <span className="text-[10px] text-gray-500 block font-bold">{stat.sub}</span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-gray-800/60 flex items-center justify-center shadow-xs">
                  <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── TOOLBAR: PREMIUM MODAL SEARCHBOX & FILTERS TRIGGER ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-xs bg-white dark:bg-slate-900/30">
        <CardContent className="p-4 space-y-3">
          
          {/* Integrated Search Box & Advanced Modal Trigger */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-gray-400" />
              </span>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isRtl ? 'ابحث فورياً باسم العيادة، الهاتف، أو الطبيب المالك...' : 'Instant search by clinic, phone, or owner...'}
                className="h-10 pr-10 pl-4 text-xs w-full bg-slate-50/50 dark:bg-slate-950/40 border-gray-200 dark:border-gray-800 focus:ring-teal-500 rounded-xl font-medium"
              />
            </div>

            {/* ADVANCED FILTERS DRAWER (RTL RIGHT-SIDE DRAWER) */}
            <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
              <SheetTrigger
                render={
                  <Button variant="outline" className="h-10 gap-1.5 px-4 font-bold text-xs border-gray-200 dark:border-gray-800 rounded-xl shrink-0 flex items-center shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-900">
                    <SlidersHorizontal className="w-4 h-4 text-teal-600 shrink-0" />
                    {isRtl ? 'تصفية متقدمة' : 'Advanced Filters'}
                    {hasActiveFilters && (
                      <Badge className="bg-teal-600 hover:bg-teal-600 text-white rounded-full text-[9px] w-4.5 h-4.5 p-0 flex items-center justify-center shadow-xs">
                        !
                      </Badge>
                    )}
                  </Button>
                }
              />
              <SheetContent side="right" className="w-full sm:max-w-[520px] md:max-w-[580px] lg:max-w-[640px] p-0 flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-100 dark:border-slate-800">
                <SheetHeader className="p-6 border-b border-gray-150/80 dark:border-gray-800/80 bg-slate-50/40 dark:bg-slate-900/10">
                  <SheetTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-heading text-lg font-black">
                    <SlidersHorizontal className="w-5 h-5 text-teal-600" />
                    {isRtl ? 'تصفية وبحث متقدم للعيادات' : 'Advanced Search & Filter Suite'}
                  </SheetTitle>
                  <span className="text-xs text-gray-500 font-semibold mt-1 block">
                    {isRtl 
                      ? 'قم بتحديد معايير التصفية والفرز أدناه للوصول السريع للبيانات المطلوبة' 
                      : 'Specify filter criteria below to quickly locate the targeted clinic records.'}
                  </span>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
                  
                  {/* Category 1: Basic Identity Information */}
                  <div className="space-y-4 bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4.5">
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-black uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
                      {isRtl ? '👤 بيانات المالك والاتصال' : '👤 Owner & Identity'}
                    </span>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'اسم المالك الطبي:' : 'Owner Name:'}</Label>
                        <Input value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} placeholder={isRtl ? 'مثال: د. محمد' : 'e.g. Dr. Mohamed'} className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 focus:border-teal-500 focus:ring-teal-500 text-gray-800 dark:text-gray-200 font-medium" />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'رقم الهاتف:' : 'Phone Number:'}</Label>
                        <Input value={phoneSearch} onChange={(e) => setPhoneSearch(e.target.value)} placeholder="01xxxxxxxxx" className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 focus:border-teal-500 focus:ring-teal-500 text-gray-800 dark:text-gray-200 font-medium" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'البريد الإلكتروني للعيادة:' : 'Email Address:'}</Label>
                      <Input value={emailSearch} onChange={(e) => setEmailSearch(e.target.value)} placeholder="doctor@clinic.com" className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-gray-200 dark:border-gray-800 focus:border-teal-500 focus:ring-teal-500 text-gray-800 dark:text-gray-200 font-medium" />
                    </div>
                  </div>

                  {/* Category 2: Plan & Subscription limits */}
                  <div className="space-y-4 bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4.5">
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-black uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
                      {isRtl ? '💼 باقة الاشتراك والترخيص' : '💼 SaaS Billing & License'}
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'باقة الاشتراك السحابية:' : 'SaaS Plan:'}</Label>
                        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع باقات التسعير' : 'All SaaS Plans'}</option>
                          <option value="FREE">{isRtl ? 'الباقة المجانية' : 'FREE'}</option>
                          <option value="BASIC">{isRtl ? 'الباقة الأساسية' : 'BASIC'}</option>
                          <option value="PRO">{isRtl ? 'الباقة الاحترافية' : 'PRO'}</option>
                          <option value="ENTERPRISE">{isRtl ? 'باقة المؤسسات' : 'ENTERPRISE'}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'حالة الترخيص بالمنصة:' : 'License Status:'}</Label>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع الحالات' : 'All Statuses'}</option>
                          <option value="ACTIVE">{isRtl ? 'نشط (ACTIVE)' : 'ACTIVE'}</option>
                          <option value="TRIAL">{isRtl ? 'فترة تجريبية (TRIAL)' : 'TRIAL'}</option>
                          <option value="SUSPENDED">{isRtl ? 'موقوف / معطل' : 'SUSPENDED'}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'قيمة الاشتراك المحصل:' : 'Subscription Price:'}</Label>
                        <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع القيم' : 'All prices'}</option>
                          <option value="FREE">{isRtl ? 'مجاني (0 ج.م)' : 'Free (0 EGP)'}</option>
                          <option value="LOW">{isRtl ? 'منخفض (< 500 ج.م)' : 'Low (< 500 EGP)'}</option>
                          <option value="MEDIUM">{isRtl ? 'متوسط (500 - 2,000 ج.م)' : 'Medium (500 - 2,000 EGP)'}</option>
                          <option value="HIGH">{isRtl ? 'مرتفع (> 2,000 ج.م)' : 'High (> 2,000 EGP)'}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'المستحقات المتأخرة:' : 'Overdue Invoices:'}</Label>
                        <select value={overdueFilter} onChange={(e) => setOverdueFilter(e.target.value)} className={`flex h-10 w-full rounded-xl border ${overdueFilter === 'YES' ? 'border-rose-300 text-rose-600 bg-rose-50/20' : 'border-gray-200 dark:border-gray-800'} bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 outline-none font-bold`}>
                          <option value="ALL">{isRtl ? 'الجميع' : 'All'}</option>
                          <option value="YES">{isRtl ? '⚠️ يمتلك فواتير متأخرة' : '⚠️ Has Pending Invoices'}</option>
                          <option value="NO">{isRtl ? '✓ لا يوجد متأخرات' : '✓ No Pending Invoices'}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Category 3: Region & Geography & Clinical Activity */}
                  <div className="space-y-4 bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4.5">
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-black uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
                      {isRtl ? '📍 الموقع الجغرافي والتخصص' : '📍 Clinical Specialty & Location'}
                    </span>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'التخصص الطبي العام:' : 'Medical Specialty:'}</Label>
                        <select value={specializationFilter} onChange={(e) => setSpecializationFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع التخصصات' : 'All Specialties'}</option>
                          {allSpecializations.map((spec) => (
                            <option key={spec} value={spec}>{spec}</option>
                          ))}
                        </select>
                      </div>

                      {/* Governorate Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'المحافظة:' : 'Governorate:'}</Label>
                        <select value={govFilter} onChange={(e) => {
                          setGovFilter(e.target.value);
                          setCityFilter('ALL'); // Reset city when gov changes
                        }} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
                          {allGovernorates.map((gov) => (
                            <option key={gov} value={gov}>{gov}</option>
                          ))}
                        </select>
                      </div>

                      {/* Dynamic Egyptian City Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'المدينة:' : 'City:'}</Label>
                        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع المدن' : 'All Cities'}</option>
                          {allCitiesFiltered.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'حالة نشاط العيادة:' : 'Engagement Activity:'}</Label>
                        <select value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع العيادات' : 'All Activity'}</option>
                          <option value="ACTIVE">{isRtl ? 'نشطة (تمتلك مواعيد)' : 'Active (Has Appts)'}</option>
                          <option value="IDLE">{isRtl ? 'خاملة (0 مواعيد)' : 'Idle (0 Appts)'}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Category 4: Performance, Registration and Timeline */}
                  <div className="space-y-4 bg-slate-50/40 dark:bg-slate-900/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl p-4.5">
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-black uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
                      {isRtl ? '📈 مؤشرات النمو والأداء والجدول الزمنـي' : '📈 Growth Performance & Timelines'}
                    </span>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-teal-700 dark:text-teal-400 block mb-1.5">{isRtl ? 'مؤشر النمو والأداء العام:' : 'Performance Growth Index:'}</Label>
                      <select value={healthFilter} onChange={(e) => setHealthFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-teal-200 dark:border-teal-850 bg-teal-50/5 dark:bg-teal-950/10 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 outline-none text-teal-600 dark:text-teal-400 font-bold">
                        <option value="ALL">{isRtl ? 'جميع مؤشرات الأداء' : 'All Performance'}</option>
                        <option value="TOP_REVENUE">{isRtl ? '⭐ الأعلى إيراداً (>= 10,000 ج.م)' : '⭐ Top Earners (>= 10,000 EGP)'}</option>
                        <option value="HIGH_USAGE">{isRtl ? '🚀 الأكثر استخداماً (>= 20 مريض)' : '🚀 High Usage (>= 20 Patients)'}</option>
                        <option value="DORMANT">{isRtl ? '⚠️ خاملة (بلا أي مرضى)' : '⚠️ Dormant (0 Patients)'}</option>
                        <option value="NEWLY_REGISTERED">{isRtl ? '📅 مسجلة حديثاً (آخر 7 أيام)' : '📅 Newly Registered'}</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'تاريخ التسجيل بالمنصة:' : 'Registration Date:'}</Label>
                        <select value={regDateFilter} onChange={(e) => setRegDateFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'جميع الأوقات' : 'All time'}</option>
                          <option value="TODAY">{isRtl ? 'اليوم فقط' : 'Today only'}</option>
                          <option value="WEEK">{isRtl ? 'آخر 7 أيام' : 'Last 7 days'}</option>
                          <option value="MONTH">{isRtl ? 'آخر 30 يوم' : 'Last 30 days'}</option>
                          <option value="YEAR">{isRtl ? 'هذا العام' : 'This year'}</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'آخر نشاط إكلينيكي للعيادة:' : 'Last Activity:'}</Label>
                        <select value={lastActivityFilter} onChange={(e) => setLastActivityFilter(e.target.value)} className="flex h-10 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs shadow-xs focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none text-gray-800 dark:text-gray-200 font-medium">
                          <option value="ALL">{isRtl ? 'الكل' : 'All'}</option>
                          <option value="TODAY">{isRtl ? 'اليوم' : 'Today'}</option>
                          <option value="WEEK">{isRtl ? 'هذا الأسبوع' : 'This week'}</option>
                          <option value="MONTH">{isRtl ? 'هذا الشهر' : 'This month'}</option>
                          <option value="IDLE_30_DAYS">{isRtl ? '⚠️ خاملة منذ 30 يوم' : '⚠️ Idle > 30 Days'}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="sticky bottom-0 border-t border-gray-150 dark:border-gray-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shadow-lg">
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setFilterModalOpen(false)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold px-5 h-9.5 shadow-sm">
                      {isRtl ? 'تطبيق معايير الفرز' : 'Apply Multi-Filters'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setFilterModalOpen(false)} className="rounded-xl text-xs h-9.5 px-4">{isRtl ? 'إلغاء' : 'Cancel'}</Button>
                  </div>

                  <Button variant="ghost" onClick={handleResetAll} className="text-xs font-bold text-gray-400 hover:text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/10 gap-1.5 rounded-xl h-9.5 px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                    {isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Dynamic Algolia-Style Clickable Filter Badges (Visible ONLY if filters are active) */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800 pt-3">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">{isRtl ? 'التصفيات النشطة:' : 'Active Filters:'}</span>
              
              {planFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setPlanFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `الباقة: ${PLAN_MAP_AR[planFilter] || planFilter}` : `Plan: ${planFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {statusFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setStatusFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `الحالة: ${STATUS_MAP_AR[statusFilter] || statusFilter}` : `Status: ${statusFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {specializationFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setSpecializationFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `التخصص: ${specializationFilter}` : `Specialty: ${specializationFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {govFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setGovFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `المحافظة: ${govFilter}` : `Gov: ${govFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {cityFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setCityFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `المدينة: ${cityFilter}` : `City: ${cityFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {activityFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setActivityFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `النشاط: ${activityFilter === 'ACTIVE' ? 'نشطة' : 'خاملة'}` : `Activity: ${activityFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {healthFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setHealthFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `الأداء: ${healthFilter}` : `Performance: ${healthFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {overdueFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setOverdueFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `فواتير متأخرة: ${overdueFilter === 'YES' ? 'نعم' : 'لا'}` : `Overdue: ${overdueFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {priceFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setPriceFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `قيمة الاشتراك: ${priceFilter}` : `Price: ${priceFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {regDateFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setRegDateFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `تاريخ التسجيل: ${regDateFilter}` : `Reg Date: ${regDateFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {lastActivityFilter !== 'ALL' && (
                <Badge variant="secondary" onClick={() => setLastActivityFilter('ALL')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `آخر نشاط: ${lastActivityFilter}` : `Last Act: ${lastActivityFilter}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {ownerSearch && (
                <Badge variant="secondary" onClick={() => setOwnerSearch('')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `المالك: ${ownerSearch}` : `Owner: ${ownerSearch}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {phoneSearch && (
                <Badge variant="secondary" onClick={() => setPhoneSearch('')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `الهاتف: ${phoneSearch}` : `Phone: ${phoneSearch}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}
              {emailSearch && (
                <Badge variant="secondary" onClick={() => setEmailSearch('')} className="text-[10px] font-bold gap-1 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg py-1 px-2.5">
                  {isRtl ? `البريد: ${emailSearch}` : `Email: ${emailSearch}`}
                  <span className="text-[9px] text-gray-400">✕</span>
                </Badge>
              )}

              <Button variant="ghost" onClick={handleResetAll} className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-600 font-black gap-1 rounded-lg">
                {isRtl ? 'مسح الكل' : 'Clear All'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── HIGH-DENSITY ADMINISTRATIVE CLINICS TABLE & GRID CARDS ── */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 shadow-xs overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
            </div>
          ) : filteredClinics.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              <Building2 className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-semibold">{isRtl ? 'لا توجد عيادات مطابقة لمعايير البحث والفرز المحددة' : 'No clinics match the advanced search or filter criteria'}</p>
            </div>
          ) : (
            viewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60 text-gray-500 font-black tracking-wider uppercase select-none">
                      <th className="px-5 py-3 text-right">{isRtl ? 'معلومات الهوية والاتصال للعيادة' : 'Clinic Identity & Contact'}</th>
                      <th className="px-5 py-3 text-right">{isRtl ? 'المالك الطبي المسؤول' : 'Primary Owner / Administrator'}</th>
                      <th className="px-5 py-3 text-right">{isRtl ? 'باقة الاشتراك والحالة' : 'SaaS Plan & License Status'}</th>
                      <th className="px-5 py-3 text-right">{isRtl ? 'أحجام الاستخدام' : 'Tenant Utilization'}</th>
                      <th className="px-5 py-3 text-right">{isRtl ? 'المدفوعات' : 'Paid Revenue'}</th>
                      <th className="px-5 py-3 text-right">{isRtl ? 'آخر نشاط' : 'Last Activity'}</th>
                      <th className="px-5 py-3 text-center">{isRtl ? 'إجراءات لوحة التحكم' : 'Administrative Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-semibold text-gray-700 dark:text-gray-300">
                    {filteredClinics.map((c: any) => {
                      const isSuspended = c.subscriptionStatus === 'SUSPENDED';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          
                          {/* Column 1: Clinic Name & Info */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0">
                                {c.name ? getInitials(c.name) : 'C'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-950 dark:text-white block truncate">{c.name}</span>
                                  {c.hasPendingInvoices && (
                                    <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[8px] px-1 py-0 font-bold flex items-center gap-0.5 shadow-3xs shrink-0 select-none">
                                      <FileWarning className="w-2.5 h-2.5" />
                                      {isRtl ? 'متأخرات مالية' : 'Pending Invoices'}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400 font-medium">
                                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</span>}
                                  {(c.city || c.governorate) ? (
                                    <span className="flex items-center gap-1 font-mono text-[9px] truncate max-w-[150px]" title={isRtl ? `${c.city?.nameAr}، ${c.governorate?.nameAr}` : `${c.city?.nameEn}, ${c.governorate?.nameEn}`}>
                                      <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                      {c.city ? (isRtl ? c.city.nameAr : c.city.nameEn) : ''}
                                      {c.city && c.governorate ? '، ' : ''}
                                      {c.governorate ? (isRtl ? c.governorate.nameAr : c.governorate.nameEn) : ''}
                                    </span>
                                  ) : c.address ? (
                                    <span className="flex items-center gap-1 font-mono text-[9px] truncate max-w-[150px]" title={c.address}>
                                      <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                      {c.address}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Owner/Contact */}
                          <td className="px-5 py-3.5">
                            {c.owner ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-gray-950 dark:text-white flex items-center gap-1">
                                  <User className="w-3 h-3 text-teal-600 shrink-0" />
                                  {c.owner.name}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1 truncate max-w-[160px]">
                                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                                  {c.owner.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 font-semibold">{isRtl ? 'غير محدد' : 'Not assigned'}</span>
                            )}
                          </td>

                          {/* Column 3: Plan & Subscription status */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 items-start">
                              {/* Plan Switcher */}
                              <select
                                value={c.subscriptionPlan}
                                onChange={(e) => handleChangePlan(c.id, c.subscriptionPlan, e.target.value)}
                                className="h-7 w-28 rounded-md border border-gray-200 dark:border-gray-800 bg-background px-1 py-0.5 text-[10px] font-black shadow-2xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500"
                              >
                                <option value="FREE">{isRtl ? 'باقة مجانية' : 'FREE'}</option>
                                <option value="BASIC">{isRtl ? 'باقة أساسية' : 'BASIC'}</option>
                                <option value="PRO">{isRtl ? 'باقة احترافية' : 'PRO'}</option>
                                <option value="ENTERPRISE">{isRtl ? 'باقة مؤسسات' : 'ENTERPRISE'}</option>
                              </select>
                              
                              <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-bold border rounded-sm select-none ${STATUS_COLOR[c.subscriptionStatus] || ''}`}>
                                {isRtl ? (STATUS_MAP_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                              </Badge>
                            </div>
                          </td>

                          {/* Column 4: Usage Metrics */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3 text-gray-500 font-bold">
                              <span className="flex items-center gap-1.5" title={isRtl ? 'المرضى' : 'Patients'}>
                                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <strong className="text-gray-950 dark:text-white font-mono">{c.stats?.patients || 0}</strong>
                              </span>
                              <span className="flex items-center gap-1.5" title={isRtl ? 'الأطباء' : 'Doctors'}>
                                <Stethoscope className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                <strong className="text-gray-950 dark:text-white font-mono">{c.stats?.doctors || 0}</strong>
                              </span>
                              <span className="flex items-center gap-1.5" title={isRtl ? 'المواعيد' : 'Appointments'}>
                                <CalendarDays className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <strong className="text-gray-950 dark:text-white font-mono">{c.stats?.appointments || 0}</strong>
                              </span>
                            </div>
                          </td>

                          {/* Column 5: Payments/Revenue */}
                          <td className="px-5 py-3.5">
                            <span className="text-xs font-black text-emerald-600 font-mono">
                              {(c.revenue || 0).toLocaleString()} {isRtl ? 'ج.م' : (c.currency || 'EGP')}
                            </span>
                          </td>

                          {/* Column 6: Last Activity */}
                          <td className="px-5 py-3.5 font-mono text-gray-400 font-bold">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                              {c.lastActivity ? formatDate(c.lastActivity, locale) : formatDate(c.createdAt, locale)}
                            </span>
                          </td>

                          {/* Column 7: Administrative Actions (Protected Dropdown) */}
                          <td className="px-5 py-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <Link href={`/${locale}/clinics/${c.id}`} passHref>
                                <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 hover:text-teal-600 font-bold shadow-2xs" title={isRtl ? 'عرض ملف العيادة بالكامل' : 'View full log dashboard'}>
                                  <Eye className="w-3.5 h-3.5" />
                                  {isRtl ? 'التفاصيل' : 'Details'}
                                </Button>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button size="sm" variant="outline" className="h-7 w-7 p-0 flex items-center justify-center shadow-2xs">
                                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-400" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="text-xs font-bold w-48" dir={isRtl ? 'rtl' : 'ltr'}>
                                  <DropdownMenuItem disabled className="text-gray-400 text-[10px] py-1 text-center">
                                    {isRtl ? 'إجراءات ترخيص العيادة' : 'Licensing Operations'}
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(c.id, c.subscriptionStatus)}
                                    className={`cursor-pointer ${isSuspended ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-bold'}`}
                                  >
                                    {isSuspended ? (
                                      <>
                                        <Power className="w-3.5 h-3.5 ml-1 text-emerald-600 shrink-0" />
                                        {isRtl ? 'تفعيل ترخيص العيادة' : 'Activate License'}
                                      </>
                                    ) : (
                                      <>
                                        <PowerOff className="w-3.5 h-3.5 ml-1 text-rose-600 shrink-0" />
                                        {isRtl ? 'إيقاف / تعطيل العيادة' : 'Suspend License'}
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator />

                                  <DropdownMenuItem disabled className="text-[10px]">
                                    <CreditCard className="w-3.5 h-3.5 ml-1 shrink-0" />
                                    {isRtl ? 'الباقة: ' : 'Plan: '}{PLAN_MAP_AR[c.subscriptionPlan] || c.subscriptionPlan}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
                {filteredClinics.map((c: any) => {
                  const isSuspended = c.subscriptionStatus === 'SUSPENDED';
                  return (
                    <Card key={c.id} className="relative border border-gray-200/80 dark:border-gray-800/80 shadow-xs overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between group bg-white dark:bg-slate-900/50 rounded-2xl">
                      <div className="p-5 space-y-4">
                        {/* Top Header Row of the Card */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                              {c.name ? getInitials(c.name) : 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-950 dark:text-white block group-hover:text-teal-600 truncate">{c.name}</span>
                                {c.hasPendingInvoices && (
                                  <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[8px] px-1 py-0 font-bold shadow-3xs shrink-0 select-none">
                                    {isRtl ? 'متأخرات مالية' : 'Pending'}
                                  </Badge>
                                )}
                              </div>
                              {(c.city || c.governorate) ? (
                                <span className="text-[10px] text-gray-400 font-semibold block truncate flex items-center gap-1" title={isRtl ? `${c.city?.nameAr}، ${c.governorate?.nameAr}` : `${c.city?.nameEn}, ${c.governorate?.nameEn}`}>
                                  <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                                  {c.city ? (isRtl ? c.city.nameAr : c.city.nameEn) : ''}
                                  {c.city && c.governorate ? '، ' : ''}
                                  {c.governorate ? (isRtl ? c.governorate.nameAr : c.governorate.nameEn) : ''}
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-400 font-semibold block truncate flex items-center gap-1" title={c.address}>
                                  <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                  {c.address || (isRtl ? 'لا يوجد عنوان' : 'No address')}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[9px] px-2 py-0.5 font-bold border rounded-md shrink-0 ${STATUS_COLOR[c.subscriptionStatus] || ''}`}>
                            {isRtl ? (STATUS_MAP_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                          </Badge>
                        </div>

                        {/* Owner Section */}
                        <div className="p-3 bg-gray-50/80 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-1.5 text-xs font-semibold">
                          <span className="text-[10px] text-gray-400 font-black block uppercase tracking-wider">{isRtl ? 'المالك الطبي / المسؤول' : 'Primary Clinic Owner'}</span>
                          {c.owner ? (
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-gray-850 dark:text-white flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 text-teal-600" />
                                {c.owner.name}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 truncate mt-0.5">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                {c.owner.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-semibold block">{isRtl ? 'غير محدد' : 'Not assigned'}</span>
                          )}
                          {c.phone && (
                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-gray-400" />
                              {c.phone}
                            </span>
                          )}
                        </div>

                        {/* Stats Section */}
                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 dark:border-gray-800/60 text-center">
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">{isRtl ? 'المرضى' : 'Patients'}</span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 mt-0.5 block font-mono">{c.stats?.patients || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">{isRtl ? 'الأطباء' : 'Doctors'}</span>
                            <span className="text-xs font-black text-purple-600 dark:text-purple-400 mt-0.5 block font-mono">{c.stats?.doctors || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">{isRtl ? 'المواعيد' : 'Appts'}</span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5 block font-mono">{c.stats?.appointments || 0}</span>
                          </div>
                        </div>

                        {/* Plan Modification Area */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span className="text-xs font-semibold text-gray-500">{isRtl ? 'تعديل الباقة:' : 'Modify Plan:'}</span>
                          <select
                            value={c.subscriptionPlan}
                            onChange={(e) => handleChangePlan(c.id, c.subscriptionPlan, e.target.value)}
                            className="h-7 w-28 rounded-md border border-gray-200 dark:border-gray-800 bg-background px-1 py-0.5 text-[10px] font-bold shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="FREE">{isRtl ? 'باقة مجانية' : 'FREE'}</option>
                            <option value="BASIC">{isRtl ? 'باقة أساسية' : 'BASIC'}</option>
                            <option value="PRO">{isRtl ? 'باقة احترافية' : 'PRO'}</option>
                            <option value="ENTERPRISE">{isRtl ? 'باقة مؤسسات' : 'ENTERPRISE'}</option>
                          </select>
                        </div>

                        {/* Revenue & Last Activity */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{isRtl ? 'إجمالي المدفوعات' : 'Paid Revenue'}</span>
                            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                              {(c.revenue || 0).toLocaleString()} {isRtl ? 'ج.م' : (c.currency || 'EGP')}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{isRtl ? 'آخر نشاط' : 'Last Activity'}</span>
                            <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              {c.lastActivity ? formatDate(c.lastActivity, locale) : formatDate(c.createdAt, locale)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Bottom Row */}
                      <div className="bg-gray-50/85 dark:bg-gray-900/60 p-3 border-t border-gray-100 dark:border-gray-800/60 flex items-center gap-2 mt-auto">
                        <Link href={`/${locale}/clinics/${c.id}`} passHref className="flex-1">
                          <Button size="sm" variant="outline" className="w-full h-8 text-[11px] gap-1 hover:text-teal-600 font-bold shadow-2xs" title={isRtl ? 'عرض السجلات والتقارير' : 'View full logs'}>
                            <Eye className="w-3.5 h-3.5" />
                            {isRtl ? 'كامل التفاصيل' : 'Full Details'}
                          </Button>
                        </Link>

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex items-center justify-center shadow-2xs">
                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="text-xs font-bold w-48" dir={isRtl ? 'rtl' : 'ltr'}>
                            <DropdownMenuItem onClick={() => handleToggleStatus(c.id, c.subscriptionStatus)} className={isSuspended ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                              {isSuspended ? (
                                <>
                                  <Power className="w-3.5 h-3.5 ml-1 text-emerald-600 shrink-0" />
                                  {isRtl ? 'تفعيل العيادة' : 'Activate Clinic'}
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 ml-1 text-rose-600 shrink-0" />
                                  {isRtl ? 'تعطيل العيادة' : 'Suspend Clinic'}
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}