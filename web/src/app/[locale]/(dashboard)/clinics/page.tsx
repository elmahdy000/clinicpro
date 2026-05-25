'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2, Users, FileText, Banknote, UserRound, Stethoscope,
  CalendarDays, ChevronRight, Plus, Edit, Trash2, MapPin, Loader2, Phone, X, Check, Search
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDate, cn } from '@/lib/utils';
import { toast } from 'sonner';

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

export default function ClinicsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClinic, setEditingClinic] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('FREE');
  const [subscriptionStatus, setSubscriptionStatus] = useState('ACTIVE');

  // Clinic owner user states
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('General Medicine');

  // Load Clinics List
  const { data: clinics, isLoading } = useQuery({
    queryKey: ['clinics'],
    queryFn: async () => {
      const { data } = await api.get('/clinics');
      return data;
    },
  });

  // Dynamic Cities list based on selected Governorate
  const govObj = EGYPT_GOVERNORATES.find(g => g.id === selectedGovernorate);
  const citiesList = govObj ? govObj.cities : [];

  // Open modal for Create Clinic
  const openCreateModal = () => {
    setEditingClinic(null);
    setName('');
    setPhone('');
    setSelectedGovernorate('');
    setSelectedCity('');
    setStreetAddress('');
    setSubscriptionPlan('FREE');
    setSubscriptionStatus('ACTIVE');
    setOwnerName('');
    setEmail('');
    setPassword('');
    setSpecialization('General Medicine');
    setIsModalOpen(true);
  };

  // Open modal for Edit Clinic
  const openEditModal = (clinic: any) => {
    setEditingClinic(clinic);
    setName(clinic.name);
    setPhone(clinic.phone || '');
    setSubscriptionPlan(clinic.subscriptionPlan);
    setSubscriptionStatus(clinic.subscriptionStatus);

    // Parse Egypt address to pre-fill select fields
    const addressParts = (clinic.address || '').split('،');
    if (addressParts.length >= 3) {
      const parsedStreet = addressParts[0].trim();
      const parsedCity = addressParts[1].trim();
      const parsedGov = addressParts[2].trim().replace('محافظة ', '');

      setStreetAddress(parsedStreet);
      
      const foundGov = EGYPT_GOVERNORATES.find(g => g.nameAr === parsedGov || g.nameEn === parsedGov);
      if (foundGov) {
        setSelectedGovernorate(foundGov.id);
        setSelectedCity(parsedCity);
      } else {
        setSelectedGovernorate('');
        setSelectedCity('');
      }
    } else {
      setStreetAddress(clinic.address || '');
      setSelectedGovernorate('');
      setSelectedCity('');
    }

    setIsModalOpen(true);
  };

  // Handle Form Submission (Create & Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(isRtl ? 'الرجاء إدخال اسم العيادة.' : 'Please input clinic name.');
      return;
    }

    setIsSubmitting(true);

    const governorateObj = EGYPT_GOVERNORATES.find(g => g.id === selectedGovernorate);
    const govName = isRtl ? governorateObj?.nameAr : governorateObj?.nameEn;
    const fullAddress = `${streetAddress || ''}، ${selectedCity || ''}، محافظة ${govName || ''}`;

    const payload = {
      name,
      phone,
      address: fullAddress,
      subscriptionPlan,
      subscriptionStatus,
      ...(!editingClinic && {
        ownerName,
        email,
        password,
        specialization,
      })
    };

    try {
      if (editingClinic) {
        await api.put(`/clinics/${editingClinic.id}`, payload);
        toast.success(isRtl ? `تم تعديل عيادة "${name}" بنجاح!` : `Clinic "${name}" updated successfully!`);
      } else {
        await api.post('/clinics', payload);
        toast.success(isRtl ? `تم إضافة عيادة "${name}" بنجاح وتأسيس حساب الطبيب!` : `Clinic "${name}" and owner account created successfully!`);
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || '';
      if (errMsg.includes('already in use')) {
        toast.error(isRtl ? 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.' : 'Email is already registered.');
      } else {
        toast.error(isRtl ? 'حدث خطأ أثناء حفظ البيانات.' : 'An error occurred while saving.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Clinic Deletion
  const handleDelete = async (id: number, clinicName: string) => {
    const confirmMsg = isRtl
      ? `هل أنت متأكد تماماً من حذف عيادة "${clinicName}" نهائياً من النظام؟\nسيؤدي هذا إلى حذف كافة الإحصائيات والأطباء والروشتات والزيارات والملفات المرفقة بها!`
      : `Are you sure you want to permanently delete clinic "${clinicName}"?\nAll associated doctors, patients, prescriptions, and data will be erased!`;

    if (confirm(confirmMsg)) {
      try {
        await api.delete(`/clinics/${id}`);
        toast.success(isRtl ? 'تم حذف العيادة وكافة متعلقاتها بنجاح!' : 'Clinic deleted successfully!');
        queryClient.invalidateQueries({ queryKey: ['clinics'] });
      } catch (error) {
        toast.error(isRtl ? 'حدث خطأ أثناء محاولة الحذف.' : 'Failed to delete clinic.');
      }
    }
  };

  // Status Badge Color Helper
  const statusColor = (s: string) =>
    s === 'ACTIVE'
      ? 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 border border-green-200 dark:border-green-900/50'
      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/50';

  // Filter clinics based on search query
  const filteredClinics = clinics?.filter((clinic: any) =>
    clinic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (clinic.address && clinic.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 justify-start">
            <Building2 className="w-6 h-6 text-teal-600" />
            {isRtl ? 'لوحة إدارة عيادات المنصة' : 'Subscribed Clinics Platform Control'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'إضافة وتعديل وحذف العيادات، التحكم بالباقات، ونظام تغطية محافظات مصر.' : 'Manage subscriptions, plans, states, and regional distribution in Egypt.'}
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            onClick={openCreateModal}
            className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 font-bold h-10 px-4 rounded-xl shadow-md transition-all text-xs"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? 'إضافة عيادة جديدة' : 'Add New Clinic'}
          </Button>
        </div>
      </div>

      {/* ── SEARCH & QUICK METRICS ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Input
              type="text"
              placeholder={isRtl ? 'البحث عن عيادة بالاسم أو المحافظة...' : 'Search clinics...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 pr-9 text-xs font-semibold"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-gray-400" />
          </div>
          <div className="flex gap-4 text-xs font-semibold text-gray-500 justify-start">
            <span>{isRtl ? `إجمالي العيادات: ${clinics?.length || 0}` : `Total Clinics: ${clinics?.length || 0}`}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5" />
            <span>{isRtl ? `النشطة: ${clinics?.filter((c: any) => c.subscriptionStatus === 'ACTIVE').length || 0}` : `Active: ${clinics?.filter((c: any) => c.subscriptionStatus === 'ACTIVE').length || 0}`}</span>
          </div>
        </CardContent>
      </Card>

      {/* ── CLINICS GRID SECTION ── */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[270px] rounded-2xl" />)}
        </div>
      ) : filteredClinics?.length === 0 ? (
        <div className="text-center p-12 bg-gray-50/50 dark:bg-gray-900/10 border border-dashed rounded-2xl">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-bold text-sm">{isRtl ? 'لا يوجد عيادات مطابقة للبحث' : 'No clinics match the search criteria'}</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClinics?.map((clinic: any) => (
            <Card key={clinic.id} className="hover:shadow-xl hover:border-teal-400 dark:hover:border-teal-600 transition-all duration-200 cursor-pointer group flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-right">
                      <CardTitle className="text-base leading-tight font-bold">{clinic.name}</CardTitle>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[180px]">{clinic.address || (isRtl ? 'بدون عنوان' : 'No address')}</span>
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-3 justify-start">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusColor(clinic.subscriptionStatus)}`}>
                    {clinic.subscriptionStatus === 'ACTIVE' ? (isRtl ? 'نشط' : 'ACTIVE') : (isRtl ? 'موقوف' : 'SUSPENDED')}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200">
                    {clinic.subscriptionPlan}
                  </Badge>
                  {clinic.phone && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <Phone className="w-2.5 h-2.5" />
                      {clinic.phone}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: UserRound, value: clinic.stats.users, label: isRtl ? 'مستخدم' : 'Users', color: 'text-teal-600 bg-teal-500/5' },
                    { icon: Users, value: clinic.stats.patients, label: isRtl ? 'مريض' : 'Patients', color: 'text-blue-600 bg-blue-500/5' },
                    { icon: Stethoscope, value: clinic.stats.doctors, label: isRtl ? 'طبيب' : 'Doctors', color: 'text-purple-600 bg-purple-500/5' },
                    { icon: CalendarDays, value: clinic.stats.appointments, label: isRtl ? 'موعد' : 'Appts', color: 'text-amber-600 bg-amber-500/5' },
                    { icon: FileText, value: clinic.stats.prescriptions ?? 0, label: isRtl ? 'روشتة' : 'Rxs', color: 'text-pink-600 bg-pink-500/5' },
                    { icon: Banknote, value: clinic.stats.invoices, label: isRtl ? 'فاتورة' : 'Invoices', color: 'text-green-600 bg-green-500/5' },
                  ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div key={i} className="flex flex-col items-center p-2 rounded-xl bg-gray-50/80 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800">
                        <Icon className={`w-3.5 h-3.5 ${stat.color} p-0.5 rounded mb-1`} />
                        <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{stat.value}</p>
                        <p className="text-[9px] text-gray-400 font-bold">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t pt-3 mt-1 gap-2">
                  <div className="text-[10px] text-gray-400">
                    {isRtl ? 'منذ:' : 'Since:'} {formatDate(clinic.createdAt, locale)}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openEditModal(clinic);
                      }}
                      className="h-7 w-7 p-0 text-gray-500 hover:text-teal-600 hover:bg-teal-50 border-gray-200"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDelete(clinic.id, clinic.name);
                      }}
                      className="h-7 w-7 p-0 text-red-500 hover:text-white hover:bg-red-600 border-red-100 hover:border-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>

                    <Link href={`/${locale}/clinics/${clinic.id}`} className="block">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[10px] gap-0.5 border-teal-600/30 text-teal-600 hover:bg-teal-50"
                      >
                        {isRtl ? 'زيارة' : 'Visit'}
                        <ChevronRight className={`w-3 h-3 ${isRtl ? 'rotate-180' : ''}`} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── HIGH FIDELITY EDIT/ADD DIALOG MODAL (Egyptian Governorate Coverage) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="w-full max-w-lg bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden transition-all transform scale-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                  {editingClinic 
                    ? (isRtl ? 'تعديل بيانات العيادة المشتركة' : 'Edit Clinic Details')
                    : (isRtl ? 'إضافة عيادة جديدة للمنصة' : 'Register New Clinic')}
                </h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                
                {/* Clinic Name */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'اسم العيادة / المركز الطبي *' : 'Clinic / Center Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isRtl ? 'مثال: عيادة الشروق التخصصية' : 'e.g. Al-Shorouk Clinic'}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white"
                  />
                </div>

                {/* Clinic Phone */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'رقم الهاتف للتواصل *' : 'Contact Phone *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isRtl ? 'مثال: 01012345678' : 'e.g. 01012345678'}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white font-mono"
                  />
                </div>

                {/* Egypt Governorate Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'المحافظة بمصر *' : 'Governorate in Egypt *'}
                  </label>
                  <select
                    required
                    value={selectedGovernorate}
                    onChange={(e) => {
                      setSelectedGovernorate(e.target.value);
                      setSelectedCity(''); // Reset city
                    }}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  >
                    <option value="">{isRtl ? '-- اختر المحافظة --' : '-- Select Governorate --'}</option>
                    {EGYPT_GOVERNORATES.map((gov) => (
                      <option key={gov.id} value={gov.id}>
                        {isRtl ? gov.nameAr : gov.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Egypt City Dropdown (Dynamic) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'المدينة / المنطقة *' : 'City / Area *'}
                  </label>
                  <select
                    required
                    disabled={!selectedGovernorate}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{isRtl ? '-- اختر المدينة --' : '-- Select City --'}</option>
                    {citiesList.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'العنوان التفصيلي (الشارع، المبنى، الدور) *' : 'Detailed Address (Street, Building, Floor) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder={isRtl ? 'مثال: شارع مصطفى النحاس، أمام محطة بنزين، الدور الأول' : 'e.g. Mostafa El-Nahas St, in front of gas station, 1st floor'}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white"
                  />
                </div>

                {/* Clinic Owner / Doctor Account details - Only when creating a clinic */}
                {!editingClinic && (
                  <>
                    <div className="col-span-2 border-t pt-3 mt-2 text-right">
                      <h4 className="text-xs font-extrabold text-teal-600 flex items-center gap-1.5 justify-start">
                        <UserRound className="w-4 h-4" />
                        {isRtl ? 'بيانات حساب الطبيب المالك للعيادة' : 'Owner Doctor Account Details'}
                      </h4>
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {isRtl ? 'اسم الطبيب المالك *' : 'Doctor Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={ownerName}
                        onChange={(e) => setOwnerName(e.target.value)}
                        placeholder={isRtl ? 'مثال: د. أحمد سليم' : 'e.g. Dr. Ahmed Selim'}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5 text-right">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {isRtl ? 'التخصص الطبي *' : 'Specialization *'}
                      </label>
                      <select
                        required
                        value={specialization}
                        onChange={(e) => setSpecialization(e.target.value)}
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                      >
                        <option value="General Medicine">{isRtl ? 'طب عام وباطني' : 'General Medicine'}</option>
                        <option value="Pediatrics">{isRtl ? 'طب الأطفال وحديثي الولادة' : 'Pediatrics'}</option>
                        <option value="Cardiology">{isRtl ? 'أمراض القلب والأوعية الدموية' : 'Cardiology'}</option>
                        <option value="Dentistry">{isRtl ? 'طب وجراحة الفم والأسنان' : 'Dentistry'}</option>
                        <option value="Orthopedics">{isRtl ? 'جراحة العظام والمفاصل' : 'Orthopedics'}</option>
                        <option value="Ophthalmology">{isRtl ? 'طب وجراحة العيون' : 'Ophthalmology'}</option>
                        <option value="Gynecology & Obstetrics">{isRtl ? 'طب النساء والتوليد' : 'Gynecology & Obstetrics'}</option>
                        <option value="Dermatology & Venereology">{isRtl ? 'الأمراض الجلدية والتناسلية' : 'Dermatology & Venereology'}</option>
                        <option value="Psychiatry & Neurology">{isRtl ? 'الطب النفسي والأعصاب' : 'Psychiatry & Neurology'}</option>
                        <option value="ENT">{isRtl ? 'طب وجراحة الأنف والأذن والحنجرة' : 'ENT (Ear, Nose & Throat)'}</option>
                        <option value="Gastroenterology">{isRtl ? 'أمراض الجهاز الهضمي والكبد' : 'Gastroenterology & Hepatology'}</option>
                        <option value="Urology">{isRtl ? 'طب وجراحة المسالك البولية' : 'Urology'}</option>
                        <option value="Nephrology">{isRtl ? 'أمراض الكلى' : 'Nephrology'}</option>
                        <option value="Pulmonology">{isRtl ? 'الأمراض الصدرية والجهاز التنفسي' : 'Pulmonology / Chest'}</option>
                        <option value="Rheumatology">{isRtl ? 'الروماتيزم وأمراض المفاصل' : 'Rheumatology'}</option>
                        <option value="General Surgery">{isRtl ? 'الجراحة العامة' : 'General Surgery'}</option>
                        <option value="Plastic Surgery">{isRtl ? 'جراحة التجميل والحروق' : 'Plastic Surgery'}</option>
                        <option value="Neurosurgery">{isRtl ? 'جراحة المخ والأعصاب' : 'Neurosurgery'}</option>
                        <option value="Oncology">{isRtl ? 'أمراض الأورام وجراحتها' : 'Oncology'}</option>
                        <option value="Endocrinology & Diabetes">{isRtl ? 'الغدد الصماء والسكري' : 'Endocrinology & Diabetes'}</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1 text-right">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {isRtl ? 'البريد الإلكتروني للعيادة (الدخول) *' : 'Login Email *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@example.com"
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white font-mono text-left"
                      />
                    </div>

                    <div className="space-y-1.5 col-span-2 sm:col-span-1 text-right">
                      <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                        {isRtl ? 'كلمة المرور الافتراضية *' : 'Initial Password *'}
                      </label>
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-transparent text-gray-900 dark:text-white font-mono text-left"
                      />
                    </div>
                  </>
                )}

                {/* Subscription Plan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'باقة الاشتراك *' : 'Subscription Plan *'}
                  </label>
                  <select
                    required
                    value={subscriptionPlan}
                    onChange={(e) => setSubscriptionPlan(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  >
                    <option value="FREE">{isRtl ? 'المجانية (FREE)' : 'FREE'}</option>
                    <option value="BASIC">{isRtl ? 'الأساسية (BASIC)' : 'BASIC'}</option>
                    <option value="PREMIUM">{isRtl ? 'الممتازة (PREMIUM)' : 'PREMIUM'}</option>
                    <option value="ENTERPRISE">{isRtl ? 'المؤسسات (ENTERPRISE)' : 'ENTERPRISE'}</option>
                  </select>
                </div>

                {/* Subscription Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {isRtl ? 'حالة الاشتراك *' : 'Subscription Status *'}
                  </label>
                  <select
                    required
                    value={subscriptionStatus}
                    onChange={(e) => setSubscriptionStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white dark:bg-gray-950 text-gray-900 dark:text-white"
                  >
                    <option value="ACTIVE">{isRtl ? 'نشط (ACTIVE)' : 'ACTIVE'}</option>
                    <option value="SUSPENDED">{isRtl ? 'موقوف (SUSPENDED)' : 'SUSPENDED'}</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-900 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 text-xs"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs gap-1"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isRtl ? 'حفظ البيانات' : 'Save Details'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
