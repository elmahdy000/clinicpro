'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HeartPulse, Eye, EyeOff, Building2, User, Phone, MapPin, Stethoscope, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Egypt Governorates & Cities for Registration
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


export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { login, user } = useAuth();
  const isRtl = locale === 'ar';

  // Toggle state between Login and Register
  const [isRegister, setIsRegister] = useState(false);

  // Shared form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register form states
  const [doctorName, setDoctorName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [specialization, setSpecialization] = useState('General Medicine');
  const [selectedGov, setSelectedGov] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  useEffect(() => {
    if (user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, locale, router]);

  if (user) return null;

  // Handle standard Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(isRtl ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');
      router.push(`/${locale}/dashboard`);
    } catch {
      toast.error(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Clinic Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorName.trim() || !email.trim() || !password.trim() || !clinicName.trim()) {
      toast.error(isRtl ? 'الرجاء ملء جميع الحقول الإجبارية.' : 'Please fill all required fields.');
      return;
    }

    if (password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل.' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const govObj = EGYPT_GOVERNORATES.find(g => g.id === selectedGov);
    const govName = isRtl ? govObj?.nameAr : govObj?.nameEn;
    const fullAddress = `${streetAddress || ''}، ${selectedCity || ''}، محافظة ${govName || ''}`;

    const payload = {
      name: doctorName,
      email,
      password,
      clinicName,
      clinicPhone,
      clinicAddress: fullAddress,
      specialization,
    };

    try {
      // Call endpoint to register new clinic
      await api.post('/auth/register-clinic', payload);
      toast.success(isRtl ? 'تم تسجيل عيادتك بنجاح! جاري تسجيل الدخول تلقائياً...' : 'Clinic registered successfully! Logging you in...');
      
      // Auto login on success
      await login(email, password);
      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || '';
      if (errMsg.includes('already in use')) {
        toast.error(isRtl ? 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.' : 'This email is already registered.');
      } else {
        toast.error(isRtl ? 'حدث خطأ أثناء تسجيل العيادة.' : 'Failed to register clinic.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Dynamic cities based on governorate
  const activeGov = EGYPT_GOVERNORATES.find(g => g.id === selectedGov);
  const citiesList = activeGov ? activeGov.cities : [];

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 overflow-y-auto py-12"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -end-40 w-80 h-80 rounded-full bg-teal-100/40 dark:bg-teal-900/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      <Card className="w-full max-w-lg relative shadow-xl border-gray-200/50 dark:border-gray-800/50 animate-scale-in z-10 my-auto">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4 animate-fade-in-down">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 transition-transform duration-300 hover:scale-105">
              <HeartPulse className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isRegister 
              ? (isRtl ? 'تسجيل عيادة جديدة على المنصة' : 'Register a New Clinic')
              : t('loginTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isRegister 
              ? (isRtl ? 'ابنِ عيادتك الرقمية وابدأ استقبال المرضى وطباعة الروشتات الآن!' : 'Build your digital clinic & start issuing prescriptions today!')
              : t('loginSubtitle')}
          </p>
        </CardHeader>

        <CardContent className="pb-8 px-8">
          
          {/* LOGIN FORM */}
          {!isRegister ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2 text-right">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@clinicpro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-left font-mono"
                />
              </div>

              <div className="space-y-2 text-right">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pe-10 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 text-left font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox id="remember" />
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    {t('rememberMe')}
                  </span>
                </label>
                <button type="button" className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 font-medium transition-colors duration-150 whitespace-nowrap">
                  {t('forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 transition-all duration-200 hover:shadow-xl hover:shadow-teal-200/60 dark:hover:shadow-teal-900/40 active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="animate-spin h-4 w-4" />
                    {tc('loading')}
                  </span>
                ) : t('login')}
              </Button>

              <div className="text-center pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-sm font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1 mx-auto"
                >
                  <Building2 className="w-4 h-4" />
                  {isRtl ? 'تسجيل عيادة جديدة على المنصة' : 'Register a New Clinic'}
                </button>
              </div>
            </form>
          ) : (
            
            // REGISTRATION FORM
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
                
                {/* Doctor's Name */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="doctorName" className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-600" />
                    {isRtl ? 'اسم الطبيب المالك *' : 'Doctor / Owner Name *'}
                  </Label>
                  <Input
                    id="doctorName"
                    required
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder={isRtl ? 'مثال: أ.د. شريف علوان' : 'e.g. Dr. Sherif Alwan'}
                    className="h-10 text-xs font-semibold"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="regEmail">
                    {isRtl ? 'البريد الإلكتروني للعيادة (لتسجيل الدخول) *' : 'Clinic Email (For Login) *'}
                  </Label>
                  <Input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@example.com"
                    className="h-10 text-xs font-mono text-left"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="regPassword">{isRtl ? 'كلمة المرور *' : 'Password *'}</Label>
                  <Input
                    id="regPassword"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-10 text-xs font-mono text-left"
                  />
                </div>

                {/* Clinic Name */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="regClinicName" className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    {isRtl ? 'اسم العيادة أو المركز الطبي *' : 'Clinic / Center Name *'}
                  </Label>
                  <Input
                    id="regClinicName"
                    required
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    placeholder={isRtl ? 'مثال: عيادة تبارك للأطفال' : 'e.g. Tabarak Clinic'}
                    className="h-10 text-xs font-semibold"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="regPhone" className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    {isRtl ? 'تليفون العيادة *' : 'Clinic Contact Phone *'}
                  </Label>
                  <Input
                    id="regPhone"
                    required
                    value={clinicPhone}
                    onChange={(e) => setClinicPhone(e.target.value)}
                    placeholder="01012345678"
                    className="h-10 text-xs font-mono"
                  />
                </div>

                {/* Specialization */}
                <div className="space-y-1.5">
                  <Label htmlFor="regSpec" className="flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    {isRtl ? 'التخصص الطبي *' : 'Specialization *'}
                  </Label>
                  <select
                    id="regSpec"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
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

                {/* Egypt Governorate Dropdown */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-600" />
                    {isRtl ? 'المحافظة بمصر *' : 'Governorate *'}
                  </Label>
                  <select
                    required
                    value={selectedGov}
                    onChange={(e) => {
                      setSelectedGov(e.target.value);
                      setSelectedCity('');
                    }}
                    className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                  >
                    <option value="">{isRtl ? '-- اختر المحافظة --' : '-- Select Gov --'}</option>
                    {EGYPT_GOVERNORATES.map(g => (
                      <option key={g.id} value={g.id}>{isRtl ? g.nameAr : g.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* Egypt City Dropdown */}
                <div className="space-y-1.5">
                  <Label>{isRtl ? 'المدينة / المنطقة *' : 'City / Area *'}</Label>
                  <select
                    required
                    disabled={!selectedGov}
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">{isRtl ? '-- اختر المدينة --' : '-- Select City --'}</option>
                    {citiesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* Street Address */}
                <div className="space-y-1.5 col-span-2">
                  <Label htmlFor="regStreet">{isRtl ? 'العنوان التفصيلي (الشارع، المبنى، الدور) *' : 'Detailed Address *'}</Label>
                  <Input
                    id="regStreet"
                    required
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder={isRtl ? 'مثال: شارع عباس العقاد، بجوار البنك الأهلي، الدور الثالث' : 'e.g. Abbas El-Akkad St, next to National Bank'}
                    className="h-10 text-xs font-semibold"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 transition-all duration-200 hover:shadow-xl hover:shadow-teal-200/60 dark:hover:shadow-teal-900/40 active:scale-[0.98] mt-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="animate-spin h-4 w-4" />
                    {isRtl ? 'جاري بناء بيئة العيادة...' : 'Provisioning clinic...'}
                  </span>
                ) : (isRtl ? 'تأسيس العيادة والبدء فوراً' : 'Register Clinic & Start Now')}
              </Button>

              <div className="text-center pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                  {isRtl ? 'العودة لتسجيل الدخول للعيادة' : 'Back to Login'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                const newLocale = locale === 'en' ? 'ar' : 'en';
                window.location.href = `/${newLocale}/login`;
              }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 font-bold"
            >
              {locale === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
