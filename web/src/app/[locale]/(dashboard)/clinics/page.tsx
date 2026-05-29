'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
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
  User, Mail, Phone, MapPin,
  Users, CalendarDays, CircleDollarSign, LayoutGrid, LayoutList,
  MoreHorizontal, SlidersHorizontal, AlertCircle, Trash2
} from 'lucide-react';
import { formatDate, getInitials } from '@/lib/utils';
import { GovernorateSelect } from '@/components/common/location/GovernorateSelect';
import { CitySelect } from '@/components/common/location/CitySelect';
import { LocationFields } from '@/components/common/location/LocationFields';
import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';

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

interface GovObject {
  id: string;
  nameAr: string;
  nameEn?: string;
}

interface CityObject {
  id: string;
  nameAr: string;
  nameEn?: string;
}

interface ClinicOwner {
  name: string;
  email: string;
}

interface ClinicStats {
  patients: number;
  doctors: number;
  appointments: number;
}

interface Clinic {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  governorateId?: string;
  cityId?: string;
  governorate?: GovObject;
  city?: CityObject;
  owner?: ClinicOwner;
  subscriptionPlan: string;
  subscriptionStatus: string;
  specializations?: string[];
  stats?: ClinicStats;
  revenue?: number;
  hasPendingInvoices?: boolean;
  lastActivity?: string;
  createdAt?: string;
  currency?: string;
  trialEndsAt?: string;
  billingStatus?: string;
}

interface CreateClinicData {
  name: string;
  phone?: string;
  address?: string;
  governorateId?: string;
  cityId?: string;
  ownerName: string;
  email: string;
  password: string;
  specialization?: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
}

interface ErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
  };
}

// Address Parser: E.g., "طنطا، الغربية" -> City: "طنطا", Gov: "الغربية"
const parseAddress = (address: string, isRtl: boolean) => {
  if (!address) return { city: isRtl ? 'غير مححدد' : 'N/A', gov: isRtl ? 'غير محدد' : 'N/A' };
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

const getLastActivityString = (dateStr: string, isRtl: boolean, locale: string) => {
  if (!dateStr) return isRtl ? 'لا يوجد نشاط مؤخراً' : 'No recent activity';
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return isRtl ? 'نشط اليوم' : 'Active today';
  if (diffDays === 1) return isRtl ? 'نشط بالأمس' : 'Active yesterday';
  if (diffDays < 7) return isRtl ? `منذ ${diffDays} أيام` : `${diffDays} days ago`;
  
  return formatDate(dateStr, locale);
};

export default function ClinicsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

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
  const { data: clinics, isLoading, refetch } = useQuery<Clinic[]>({
    queryKey: ['admin-clinics'],
    queryFn: () => api.get('/clinics').then((r) => r.data),
    refetchInterval: 10_000,
  });

  const { data: dbGovernorates } = useGovernorates();
  const { data: dbCities } = useCities(selectedNewGov);

  // Mutators
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => api.put(`/clinics/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clinics'] });
      toast.success(isRtl ? 'تم تحديث بيانات العيادة بنجاح' : 'Clinic settings updated successfully');
    },
    onError: () => {
      toast.error(isRtl ? 'فشل تحديث العيادة' : 'Failed to update clinic');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateClinicData) => api.post('/clinics', data),
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
    onError: (err: ErrorResponse) => {
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
    new Set((clinics || []).flatMap((c: Clinic) => c.specializations || []))
  ).filter(Boolean) as string[];

  // Filtering Logic
  const filteredClinics = (clinics || []).filter((c: Clinic) => {
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
    const addressParsed = parseAddress(c.address ?? '', isRtl);
    
    const cGovNameAr = c.governorate?.nameAr || '';
    const cGovNameEn = c.governorate?.nameEn || '';
    const cGovId = c.governorateId || c.governorate?.id || '';
    
    const cCityNameAr = c.city?.nameAr || '';
    const cCityNameEn = c.city?.nameEn || '';
    const cCityId = c.cityId || c.city?.id || '';

    let matchesGov = true;
    if (govFilter !== 'ALL' && govFilter !== '') {
      const matchesDbGov = cGovId === govFilter;
      const cGovText = (addressParsed.gov || '').trim();
      const matchesTextGov = cGovText === govFilter || cGovNameAr === govFilter || cGovNameEn === govFilter;
      matchesGov = matchesDbGov || matchesTextGov;
    }

    let matchesCity = true;
    if (cityFilter !== 'ALL' && cityFilter !== '') {
      const matchesDbCity = cCityId === cityFilter;
      const cCityText = (addressParsed.city || '').trim();
      const matchesTextCity = cCityText === cityFilter || cCityNameAr === cityFilter || cCityNameEn === cityFilter;
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
      const cActivity = new Date(c.lastActivity ?? c.createdAt ?? Date.now());
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
  const activeClinics = clinics?.filter((c: Clinic) => c.subscriptionStatus === 'ACTIVE').length || 0;
  const totalRevenue = clinics?.reduce((sum: number, c: Clinic) => sum + (c.revenue || 0), 0) || 0;
  const totalPatients = clinics?.reduce((sum: number, c: Clinic) => sum + (c.stats?.patients || 0), 0) || 0;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
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
                <div className="md:col-span-2">
                  <LocationFields
                    governorateId={selectedNewGov}
                    cityId={selectedNewCity}
                    onGovernorateChange={(govId) => setSelectedNewGov(govId || '')}
                    onCityChange={(cityId) => setSelectedNewCity(cityId || '')}
                    showLabels={true}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  />
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
                  const govObj = dbGovernorates?.find((g: GovObject) => g.id === selectedNewGov);
                  const govName = govObj ? (isRtl ? govObj.nameAr : govObj.nameEn || govObj.nameAr) : '';
                  const cityObj = dbCities?.find((c: CityObject) => c.id === selectedNewCity);
                  const cityName = cityObj ? (isRtl ? cityObj.nameAr : cityObj.nameEn || cityObj.nameAr) : '';
                  const finalAddress = selectedNewGov
                    ? `${newStreetAddress || ''}، ${cityName}، محافظة ${govName}`
                    : newAddress;

                  createMutation.mutate({
                    name: newName,
                    phone: newPhone || undefined,
                    address: finalAddress || undefined,
                    governorateId: selectedNewGov || undefined,
                    cityId: selectedNewCity || undefined,
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
            value: (clinics?.reduce((sum: number, c: Clinic) => sum + (c.stats?.appointments || 0), 0) || 0).toLocaleString(),
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
                  <span className="text-2xl font-semibold font-mono text-gray-900 dark:text-white block">{isLoading ? <Skeleton className="h-7 w-16" /> : stat.value}</span>
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
                  <SheetTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-heading text-lg font-bold">
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
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
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
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
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
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
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
                        <GovernorateSelect
                          value={govFilter === 'ALL' ? '' : govFilter}
                          onChange={(val) => {
                            setGovFilter(val || 'ALL');
                            setCityFilter('ALL');
                          }}
                          placeholder={isRtl ? 'جميع المحافظات' : 'All Governorates'}
                          className="h-10 text-xs shadow-xs border-gray-250 dark:border-gray-800 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-medium"
                        />
                      </div>

                      {/* Dynamic Egyptian City Filter */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5">{isRtl ? 'المدينة:' : 'City:'}</Label>
                        <CitySelect
                          governorateId={govFilter === 'ALL' ? null : govFilter}
                          value={cityFilter === 'ALL' ? '' : cityFilter}
                          onChange={(val) => setCityFilter(val || 'ALL')}
                          placeholder={isRtl ? 'جميع المدن' : 'All Cities'}
                          className="h-10 text-xs shadow-xs border-gray-250 dark:border-gray-800 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 font-medium"
                        />
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
                    <span className="text-xs text-teal-700 dark:text-teal-400 font-bold uppercase tracking-wider block border-b pb-2 mb-3 border-gray-100 dark:border-gray-850/60">
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
                      {isRtl ? 'تم - إغلاق اللوحة' : 'Done - Close Panel'}
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

              <Button variant="ghost" onClick={handleResetAll} className="h-7 px-2 text-[10px] text-rose-500 hover:text-rose-600 font-semibold gap-1 rounded-lg">
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
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60 text-gray-500 font-bold tracking-wider uppercase select-none">
                      <th className="px-6 py-4 text-right">{isRtl ? 'معلومات العيادة' : 'Clinic Info'}</th>
                      <th className="px-6 py-4 text-right">{isRtl ? 'المالك المسؤول' : 'Responsible Owner'}</th>
                      <th className="px-6 py-4 text-right">{isRtl ? 'الخطة والحالة' : 'Plan & Status'}</th>
                      <th className="px-6 py-4 text-right">{isRtl ? 'الاستخدام' : 'Usage'}</th>
                      <th className="px-6 py-4 text-right">{isRtl ? 'اشتراكات المنصة' : 'Platform Subscriptions'}</th>
                      <th className="px-6 py-4 text-right">{isRtl ? 'آخر نشاط' : 'Last Activity'}</th>
                      <th className="px-6 py-4 text-center">{isRtl ? 'الإجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-semibold text-slate-700 dark:text-slate-350">
                    {filteredClinics.map((c: Clinic) => {
                      const isSuspended = c.subscriptionStatus === 'SUSPENDED';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                          
                          {/* Column 1: Clinic Info (Clinic Name, Spec & Location) */}
                          <td className="px-6 py-4.5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs shadow-3xs flex-shrink-0">
                                {c.name ? getInitials(c.name) : 'C'}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-950 dark:text-white block truncate">{c.name}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                                  <span className="bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded text-[9px] font-bold text-slate-600 dark:text-slate-300 uppercase shrink-0">
                                    {c.specializations?.[0] || (isRtl ? 'طب عام' : 'General')}
                                  </span>
                                  <span className="flex items-center gap-0.5 text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                                    <MapPin className="w-3 h-3 text-slate-450 shrink-0" />
                                    {c.city ? (isRtl ? c.city.nameAr : c.city.nameEn) : ''}
                                    {c.city && c.governorate ? '، ' : ''}
                                    {c.governorate ? (isRtl ? c.governorate.nameAr : c.governorate.nameEn) : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Column 2: Responsible Owner */}
                          <td className="px-6 py-4.5">
                            {c.owner ? (
                              <div className="space-y-0.5">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                                  {c.owner.name}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1.5 truncate max-w-[160px]">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  {c.owner.email}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{isRtl ? 'غير محدد' : 'Not assigned'}</span>
                            )}
                          </td>

                          {/* Column 3: Plan & Status */}
                          <td className="px-6 py-4.5">
                            <div className="flex flex-col gap-1.5 items-start">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${PLAN_COLOR[c.subscriptionPlan]}`}>
                                {isRtl ? (PLAN_MAP_AR[c.subscriptionPlan] || c.subscriptionPlan) : c.subscriptionPlan}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border gap-1 w-max ${STATUS_COLOR[c.subscriptionStatus]}`}>
                                {isRtl ? (STATUS_MAP_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                                {c.subscriptionStatus === 'TRIAL' && c.trialEndsAt && (() => {
                                  const daysLeft = Math.ceil((new Date(c.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                  if (daysLeft > 0) return <span className="opacity-80 ms-0.5 font-mono">({daysLeft} {isRtl ? 'يوم' : 'd'})</span>;
                                  return null;
                                })()}
                              </span>
                            </div>
                          </td>

                          {/* Column 4: Usage (Clean High-Density Numbers) */}
                          <td className="px-6 py-4.5">
                            <div className="space-y-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-3 justify-between max-w-[110px]">
                                <span>{isRtl ? 'المرضى:' : 'Patients:'}</span>
                                <span className="text-slate-900 dark:text-white font-mono">{c.stats?.patients || 0}</span>
                              </div>
                              <div className="flex items-center gap-3 justify-between max-w-[110px]">
                                <span>{isRtl ? 'الأطباء:' : 'Doctors:'}</span>
                                <span className="text-slate-900 dark:text-white font-mono">{c.stats?.doctors || 0}</span>
                              </div>
                              <div className="flex items-center gap-3 justify-between max-w-[110px]">
                                <span>{isRtl ? 'المواعيد:' : 'Appts:'}</span>
                                <span className="text-slate-900 dark:text-white font-mono">{c.stats?.appointments || 0}</span>
                              </div>
                            </div>
                          </td>

                          {/* Column 5: Platform Subscription Payments */}
                          <td className="px-6 py-4.5">
                            <div className="space-y-1">
                              <div className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                                {(c.revenue || 0).toLocaleString()} {isRtl ? 'ج.م' : 'EGP'}
                              </div>
                              <div className="text-[9px] text-slate-400 dark:text-slate-500 font-bold leading-normal">
                                {isRtl ? 'إجمالي الاشتراكات المحصلة' : 'SaaS Fees Collected'}
                              </div>
                              {c.hasPendingInvoices && (
                                <div className="pt-1 select-none">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 text-[9px] font-bold">
                                    <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                                    {isRtl ? 'متأخرات مالية' : 'Overdue Invoices'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Column 6: Last Activity */}
                          <td className="px-6 py-4.5">
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                {getLastActivityString(c.lastActivity ?? '', isRtl, locale)}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono block">
                                {c.lastActivity ? formatDate(c.lastActivity, locale) : formatDate(c.createdAt ?? '', locale)}
                              </span>
                            </div>
                          </td>

                          {/* Column 7: Administrative Actions (Consolidated Dropdown) */}
                          <td className="px-6 py-4.5 text-center">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  render={
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex items-center justify-center shadow-3xs rounded-lg border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                      <MoreHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-450" />
                                    </Button>
                                  }
                                />
                                <DropdownMenuContent align="end" className="text-xs font-bold w-52 p-1.5" dir={isRtl ? 'rtl' : 'ltr'}>
                                  <Link href={`/${locale}/clinics/${c.id}`} className="block w-full">
                                    <DropdownMenuItem className="cursor-pointer font-bold gap-2 focus:bg-slate-50 dark:focus:bg-slate-900">
                                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                                      {isRtl ? 'سجلات وتقارير العيادة' : 'View Admin Logs'}
                                    </DropdownMenuItem>
                                  </Link>

                                  <DropdownMenuSeparator className="my-1" />

                                  <DropdownMenuItem
                                    onClick={() => handleToggleStatus(c.id, c.subscriptionStatus)}
                                    className={`cursor-pointer font-bold gap-2 ${isSuspended ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                                  >
                                    {isSuspended ? (
                                      <>
                                        <Power className="w-3.5 h-3.5 shrink-0" />
                                        {isRtl ? 'تفعيل ترخيص العيادة' : 'Activate License'}
                                      </>
                                    ) : (
                                      <>
                                        <PowerOff className="w-3.5 h-3.5 shrink-0" />
                                        {isRtl ? 'إيقاف / تعطيل العيادة' : 'Suspend License'}
                                      </>
                                    )}
                                  </DropdownMenuItem>

                                  <DropdownMenuSeparator className="my-1" />
                                  <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                    {isRtl ? 'تعديل باقة الاشتراك' : 'Modify SaaS Plan'}
                                  </div>
                                  
                                  {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map((plan) => {
                                    const isActive = c.subscriptionPlan === plan;
                                    return (
                                      <DropdownMenuItem
                                        key={plan}
                                        onClick={() => handleChangePlan(c.id, c.subscriptionPlan, plan)}
                                        className={`cursor-pointer text-[10px] font-bold rounded-md py-1 px-2.5 transition-colors ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                      >
                                        <div className="flex items-center justify-between w-full">
                                          <span>{isRtl ? PLAN_MAP_AR[plan] : plan}</span>
                                          {isActive && <span className="text-[10px]">✓</span>}
                                        </div>
                                      </DropdownMenuItem>
                                    );
                                  })}
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
                {filteredClinics.map((c: Clinic) => {
                  const isSuspended = c.subscriptionStatus === 'SUSPENDED';
                  return (
                    <Card key={c.id} className="relative border border-gray-200/80 dark:border-gray-800/80 shadow-xs overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between group bg-white dark:bg-slate-900/50 rounded-2xl">
                      <div className="p-5 space-y-4">
                        {/* Top Header Row of the Card */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-sm shadow-xs flex-shrink-0">
                              {c.name ? getInitials(c.name) : 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-gray-950 dark:text-white block group-hover:text-teal-600 truncate">{c.name}</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 font-semibold">
                                <span className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[8px] font-bold text-slate-500 shrink-0">
                                  {c.specializations?.[0] || (isRtl ? 'طب عام' : 'General')}
                                </span>
                                {(c.city || c.governorate) ? (
                                  <span className="text-[10px] text-gray-400 font-semibold block truncate flex items-center gap-1" title={isRtl ? `${c.city?.nameAr}، ${c.governorate?.nameAr}` : `${c.city?.nameEn}, ${c.governorate?.nameEn}`}>
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    {c.city ? (isRtl ? c.city.nameAr : c.city.nameEn) : ''}
                                    {c.city && c.governorate ? '، ' : ''}
                                    {c.governorate ? (isRtl ? c.governorate.nameAr : c.governorate.nameEn) : ''}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-gray-400 font-semibold block truncate flex items-center gap-1" title={c.address}>
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                    {c.address || (isRtl ? 'لا يوجد عنوان' : 'No address')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-1.5 items-end shrink-0">
                            <Badge variant="outline" className={`text-[9px] px-2 py-0.5 font-bold border rounded-md ${PLAN_COLOR[c.subscriptionPlan]}`}>
                              {isRtl ? (PLAN_MAP_AR[c.subscriptionPlan] || c.subscriptionPlan) : c.subscriptionPlan}
                            </Badge>
                            <Badge variant="outline" className={`text-[9px] px-2 py-0.5 font-bold border rounded-md gap-1 w-max ${STATUS_COLOR[c.subscriptionStatus] || ''}`}>
                              {isRtl ? (STATUS_MAP_AR[c.subscriptionStatus] || c.subscriptionStatus) : c.subscriptionStatus}
                              {c.subscriptionStatus === 'TRIAL' && c.trialEndsAt && (() => {
                                const daysLeft = Math.ceil((new Date(c.trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                if (daysLeft > 0) return <span className="opacity-80 ms-0.5 font-mono">({daysLeft} {isRtl ? 'يوم' : 'd'})</span>;
                                return null;
                              })()}
                            </Badge>
                          </div>
                        </div>

                        {/* Owner Section */}
                        <div className="p-3 bg-gray-50/80 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800/60 space-y-1.5 text-xs font-semibold">
                          <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{isRtl ? 'المالك الطبي / المسؤول' : 'Primary Clinic Owner'}</span>
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
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5 block font-mono">{c.stats?.patients || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">{isRtl ? 'الأطباء' : 'Doctors'}</span>
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5 block font-mono">{c.stats?.doctors || 0}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block font-semibold">{isRtl ? 'المواعيد' : 'Appts'}</span>
                            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5 block font-mono">{c.stats?.appointments || 0}</span>
                          </div>
                        </div>

                        {/* Revenue & Last Activity */}
                        <div className="flex items-center justify-between text-xs pt-1">
                          <div className="flex flex-col">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{isRtl ? 'اشتراكات المنصة' : 'SaaS Invoices'}</span>
                            <span className="font-extrabold text-slate-900 dark:text-white font-mono mt-0.5 flex items-center gap-1.5">
                              {(c.revenue || 0).toLocaleString()} {isRtl ? 'ج.م' : (c.currency || 'EGP')}
                              {c.hasPendingInvoices && (
                                <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[8px] px-1 py-0 font-bold shadow-3xs shrink-0 select-none">
                                  {isRtl ? 'متأخر' : 'Overdue'}
                                </Badge>
                              )}
                            </span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] text-gray-400 font-bold uppercase">{isRtl ? 'آخر نشاط' : 'Last Activity'}</span>
                            <span className="text-[10px] text-gray-505 font-semibold flex items-center gap-1 mt-0.5">
                              {getLastActivityString(c.lastActivity ?? '', isRtl, locale)}
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
                          <DropdownMenuContent align="end" className="text-xs font-bold w-52 p-1.5" dir={isRtl ? 'rtl' : 'ltr'}>
                            <DropdownMenuItem onClick={() => handleToggleStatus(c.id, c.subscriptionStatus)} className={`cursor-pointer font-bold gap-2 ${isSuspended ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {isSuspended ? (
                                <>
                                  <Power className="w-3.5 h-3.5 shrink-0" />
                                  {isRtl ? 'تفعيل ترخيص العيادة' : 'Activate License'}
                                </>
                              ) : (
                                <>
                                  <PowerOff className="w-3.5 h-3.5 shrink-0" />
                                  {isRtl ? 'إيقاف / تعطيل العيادة' : 'Suspend License'}
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-1" />
                            <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              {isRtl ? 'تعديل باقة الاشتراك' : 'Modify SaaS Plan'}
                            </div>

                            {['FREE', 'BASIC', 'PRO', 'ENTERPRISE'].map((plan) => {
                              const isActive = c.subscriptionPlan === plan;
                              return (
                                <DropdownMenuItem
                                  key={plan}
                                  onClick={() => handleChangePlan(c.id, c.subscriptionPlan, plan)}
                                  className={`cursor-pointer text-[10px] font-bold rounded-md py-1 px-2.5 transition-colors ${isActive ? 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-extrabold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span>{isRtl ? PLAN_MAP_AR[plan] : plan}</span>
                                    {isActive && <span className="text-[10px]">✓</span>}
                                  </div>
                                </DropdownMenuItem>
                              );
                            })}
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