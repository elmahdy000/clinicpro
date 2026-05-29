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
import { LocationFields } from '@/components/common/location/LocationFields';
import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';


export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { login, user } = useAuth();
  const isRtl = locale === 'ar';

  // Toggle state between Login, Register, and Patient Login
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'patient'>('login');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientPassword, setPatientPassword] = useState('');

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

  // Load dynamic locations from DB
  const { data: dbGovernorates } = useGovernorates();
  const { data: dbCities } = useCities(selectedGov);

  useEffect(() => {
    if (user) {
      if (user.role === 'PATIENT') {
        router.push(`/${locale}/patient`);
      } else {
        router.push(`/${locale}/dashboard`);
      }
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

    const govObj = dbGovernorates?.find((g: { id: string; nameAr: string; nameEn?: string }) => g.id === selectedGov);
    const govName = govObj ? (isRtl ? govObj.nameAr : govObj.nameEn || govObj.nameAr) : '';
    const cityObj = dbCities?.find((c: { id: string; nameAr: string; nameEn?: string }) => c.id === selectedCity);
    const cityName = cityObj ? (isRtl ? cityObj.nameAr : cityObj.nameEn || cityObj.nameAr) : '';
    const fullAddress = `${streetAddress || ''}، ${cityName}، محافظة ${govName}`;

    const payload = {
      name: doctorName,
      email,
      password,
      clinicName,
      clinicPhone,
      clinicAddress: fullAddress,
      governorateId: selectedGov || undefined,
      cityId: selectedCity || undefined,
      specialization,
    };

    try {
      // Call endpoint to register new clinic
      await api.post('/auth/register-clinic', payload);
      toast.success(isRtl ? 'تم تسجيل عيادتك بنجاح! جاري تسجيل الدخول تلقائياً...' : 'Clinic registered successfully! Logging you in...');
      
      // Auto login on success
      await login(email, password);
    } catch (error: unknown) {
      const errMsg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (errMsg.includes('already in use')) {
        toast.error(isRtl ? 'هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر.' : 'This email is already registered.');
      } else {
        toast.error(isRtl ? 'حدث خطأ أثناء تسجيل العيادة.' : 'Failed to register clinic.');
      }
    } finally {
      setLoading(false);
    }
  };

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
            {activeTab === 'register' 
              ? (isRtl ? 'تسجيل عيادة جديدة على المنصة' : 'Register a New Clinic')
              : activeTab === 'patient'
                ? (isRtl ? 'بوابة المريض' : 'Patient Portal')
                : t('loginTitle')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {activeTab === 'register'
              ? (isRtl ? 'ابنِ عيادتك الرقمية وابدأ استقبال المرضى وطباعة الروشتات الآن!' : 'Build your digital clinic & start issuing prescriptions today!')
              : activeTab === 'patient'
                ? (isRtl ? 'تابع مواعيدك وروشتاتك وتقاريرك الطبية' : 'Track your appointments, prescriptions & medical records')
                : t('loginSubtitle')}
          </p>
        </CardHeader>

        <CardContent className="pb-8 px-8">
          
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { key: 'login' as const, label: isRtl ? 'دخول العيادة' : 'Clinic Login' },
              { key: 'register' as const, label: isRtl ? 'تسجيل عيادة' : 'Register Clinic' },
              { key: 'patient' as const, label: isRtl ? 'بوابة المريض' : 'Patient Portal' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* CLINIC LOGIN FORM */}
          {activeTab === 'login' && (
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
                  className={`h-11 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'} font-mono`}
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
                    className={`h-11 pe-10 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'} font-mono`}
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
            </form>
          )}

          {/* CLINIC REGISTRATION FORM */}
          {activeTab === 'register' && (
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
                    className={`h-10 text-xs font-mono ${isRtl ? 'text-right' : 'text-left'}`}
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
                    className={`h-10 text-xs font-mono ${isRtl ? 'text-right' : 'text-left'}`}
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
                    className={`h-10 text-xs font-mono ${isRtl ? 'text-right' : 'text-left'}`}
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

                {/* Egypt Governorate & City Dropdowns */}
                <div className="col-span-2">
                  <LocationFields
                    governorateId={selectedGov}
                    cityId={selectedCity}
                    onGovernorateChange={(govId) => setSelectedGov(govId || '')}
                    onCityChange={(cityId) => setSelectedCity(cityId || '')}
                    showLabels={true}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700 dark:text-slate-350 font-semibold"
                  />
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
            </form>
          )}

          {/* PATIENT LOGIN / REGISTER FORM */}
          {activeTab === 'patient' && (
            <PatientPortalForm
              locale={locale}
              isRtl={isRtl}
              api={api}
              router={router}
              tc={tc}
            />
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

// ── Patient Portal Login/Register Sub-Component ──
function PatientPortalForm({
  locale, isRtl, api: axiosApi, router, tc,
}: {
  locale: string;
  isRtl: boolean;
  api: typeof import('@/lib/api').default;
  router: ReturnType<typeof import('next/navigation').useRouter>;
  tc: ReturnType<typeof import('next-intl').useTranslations>;
}) {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axiosApi.post('/auth/patient-login', { identifier: phone, password });
      localStorage.setItem('access_token', data.access_token);
      window.location.href = `/${locale}/patient`;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('غير مسجل') || msg.includes('غير موجود') || msg.includes('not registered') || msg.includes('not found')) {
        toast.error(isRtl ? 'رقم الهاتف غير مسجل. الرجاء التسجيل أولاً.' : 'Phone not registered. Please register first.');
        setMode('register');
      } else if (msg.includes('غير صحيحة') || msg.includes('Wrong password') || msg.includes('Incorrect')) {
        toast.error(isRtl ? 'كلمة المرور غير صحيحة' : 'Wrong password');
      } else {
        toast.error(isRtl ? 'فشل تسجيل الدخول' : 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePatientRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim() || !name.trim()) {
      toast.error(isRtl ? 'الرجاء ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    if (password.length < 6) {
      toast.error(isRtl ? 'كلمة المرور يجب أن تكون ٦ أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await axiosApi.post('/auth/patient-register', { phone, password, fullName: name });
      localStorage.setItem('access_token', data.access_token);
      window.location.href = `/${locale}/patient`;
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '';
      if (msg.includes('مسجل') || msg.includes('already')) {
        toast.error(isRtl ? 'هذا الرقم مسجل بالفعل. الرجاء تسجيل الدخول.' : 'Already registered. Please login.');
        setMode('login');
      } else {
        toast.error(isRtl ? 'فشل التسجيل' : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Login / Register toggle */}
      <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'login' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'
          }`}
        >
          {isRtl ? 'تسجيل دخول' : 'Login'}
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
            mode === 'register' ? 'bg-white dark:bg-slate-700 text-teal-600 dark:text-teal-400 shadow-sm' : 'text-slate-500'
          }`}
        >
          {isRtl ? 'مريض جديد؟ سجل الآن' : 'New Patient? Register'}
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={handlePatientLogin} className="space-y-4">
          <div className="space-y-2 text-right">
            <Label>{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
            <Input
              id="patientLoginPhone"
              name="patientLoginPhone"
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              className={`h-11 font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'}`}
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>{isRtl ? 'كلمة المرور' : 'Password'}</Label>
            <div className="relative">
              <Input
                id="patientLoginPassword"
                name="patientLoginPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`h-11 pe-10 font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600 transition-colors`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 bg-teal-600 hover:bg-teal-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRtl ? 'دخول' : 'Login')}
          </Button>
        </form>
      ) : (
        <form onSubmit={handlePatientRegister} className="space-y-4">
          <div className="space-y-2 text-right">
            <Label>{isRtl ? 'الاسم بالكامل' : 'Full Name'}</Label>
            <Input
              id="patientRegisterName"
              name="patientRegisterName"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRtl ? 'مثال: أحمد محمد' : 'e.g. Ahmed Mohamed'}
              className="h-11 transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
            <Input
              id="patientRegisterPhone"
              name="patientRegisterPhone"
              type="text"
              inputMode="numeric"
              autoComplete="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01012345678"
              className={`h-11 font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'}`}
            />
          </div>
          <div className="space-y-2 text-right">
            <Label>{isRtl ? 'كلمة المرور' : 'Password'}</Label>
            <div className="relative">
              <Input
                id="patientRegisterPassword"
                name="patientRegisterPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`h-11 pe-10 font-mono transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 ${isRtl ? 'text-right' : 'text-left'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-3' : 'right-3'} text-gray-400 hover:text-gray-600 transition-colors`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full h-11 bg-teal-600 hover:bg-teal-700" disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : (isRtl ? 'تسجيل والدخول' : 'Register & Login')}
          </Button>
        </form>
      )}
    </div>
  );
}
