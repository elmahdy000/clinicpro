'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/stores/auth';
import api from '@/lib/api';
import {
  Save, Upload, Shield, Landmark, MessageSquare, AlertTriangle,
  Globe, Database, Bell, RefreshCw, Mail, HelpCircle, HardDrive, Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === 'ar';
  const ct = useTranslations('common');
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clinicName, setClinicName] = useState('');
  const [clinicPhone, setClinicPhone] = useState('');
  const [clinicAddress, setClinicAddress] = useState('');
  const [doctorName, setDoctorName] = useState(user?.name || '');
  const [workingHoursFrom, setWorkingHoursFrom] = useState('09:00 AM');
  const [workingHoursTo, setWorkingHoursTo] = useState('05:00 PM');
  const [workingDays, setWorkingDays] = useState<string[]>(['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu']);
  const [branches, setBranches] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALL_DAYS = [
    { id: 'Sat', en: 'Sat', ar: 'السبت' },
    { id: 'Sun', en: 'Sun', ar: 'الأحد' },
    { id: 'Mon', en: 'Mon', ar: 'الاثنين' },
    { id: 'Tue', en: 'Tue', ar: 'الثلاثاء' },
    { id: 'Wed', en: 'Wed', ar: 'الأربعاء' },
    { id: 'Thu', en: 'Thu', ar: 'الخميس' },
    { id: 'Fri', en: 'Fri', ar: 'الجمعة' },
  ];

  const toggleDay = (dayId: string) => {
    setWorkingDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const addBranch = () => {
    setBranches([...branches, { id: Date.now().toString(), name: '', address: '', phone: '', workingDays: ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu'], workingHoursFrom: '09:00 AM', workingHoursTo: '05:00 PM' }]);
  };
  
  const updateBranch = (id: string, field: string, value: any) => {
    setBranches(branches.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  
  const removeBranch = (id: string) => {
    setBranches(branches.filter(b => b.id !== id));
  };

  const timeOptions: string[] = [];
  for (let h = 1; h <= 12; h++) {
    for (let m of ['00', '30']) {
      const formattedH = h.toString().padStart(2, '0');
      timeOptions.push(`${formattedH}:${m} AM`);
      timeOptions.push(`${formattedH}:${m} PM`);
    }
  }
  // Sort them intuitively
  timeOptions.sort((a, b) => {
    const isPm1 = a.includes('PM');
    const isPm2 = b.includes('PM');
    if (isPm1 && !isPm2) return 1;
    if (!isPm1 && isPm2) return -1;
    let [h1, m1] = a.split(' ')[0].split(':');
    let [h2, m2] = b.split(' ')[0].split(':');
    if (h1 === '12') h1 = '00';
    if (h2 === '12') h2 = '00';
    return Number(h1) * 60 + Number(m1) - (Number(h2) * 60 + Number(m2));
  });

  useEffect(() => {
    if (!user?.clinicId) return;
    api.get(`/clinics/${user.clinicId}`).then((r) => {
      if (r.data) {
        setClinicName(r.data.name || '');
        setClinicPhone(r.data.phone || '');
        setClinicAddress(r.data.address || '');
        if (r.data.logoUrl) {
          setLogoPreview(`${API_BASE.replace('/api', '')}${r.data.logoUrl}`);
        }
      }
    }).catch(() => {});
    
    api.get(`/clinics/${user.clinicId}/settings`).then((r) => {
      if (r.data) {
        setWorkingHoursFrom(r.data.workingHoursFrom || '09:00 AM');
        setWorkingHoursTo(r.data.workingHoursTo || '05:00 PM');
        if (r.data.workingDays) {
          try {
            setWorkingDays(typeof r.data.workingDays === 'string' ? JSON.parse(r.data.workingDays) : r.data.workingDays);
          } catch {
            setWorkingDays(r.data.workingDays.split(','));
          }
        }
        if (r.data.branches) {
          try {
            setBranches(typeof r.data.branches === 'string' ? JSON.parse(r.data.branches) : r.data.branches);
          } catch {
            setBranches([]);
          }
        }
      }
    }).catch(() => {});
  }, [user?.clinicId]);

  const switchLocale = (targetLocale: 'en' | 'ar') => {
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '');
    router.replace(`/${targetLocale}${pathWithoutLocale || '/settings'}`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user?.role === 'PLATFORM_OWNER') {
        // SaaS settings - no dedicated backend endpoint yet
        await new Promise((resolve) => setTimeout(resolve, 300));
        toast.success(isRtl ? 'تم حفظ إعدادات المنصة (محاكاة)' : 'Platform settings saved (simulated)');
      } else {
        // Clinic settings - save via API
        const payload: any = {};
        if (clinicName) payload.name = clinicName;
        if (clinicPhone !== undefined) payload.phone = clinicPhone;
        if (clinicAddress !== undefined) payload.address = clinicAddress;

        if (user?.clinicId) {
          await api.put(`/clinics/${user.clinicId}`, payload);
          await api.put(`/clinics/${user.clinicId}/settings`, {
            workingHoursFrom,
            workingHoursTo,
            workingDays: JSON.stringify(workingDays),
            branches: JSON.stringify(branches),
          });
        }
        if (doctorName) {
          await api.put('/auth/me', { name: doctorName });
        }
        toast.success(ct('save'));
      }
    } catch {
      toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Error saving settings');
    } finally {
      setSaving(false);
    }
  };

  // If the user is PLATFORM_OWNER, show SaaS Platform Settings
  if (user?.role === 'PLATFORM_OWNER') {
    return (
      <div className={`max-w-4xl mx-auto space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-teal-600 animate-pulse" />
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                {isRtl ? 'لوحة تحكم مدير النظام' : 'SaaS Control Settings'}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isRtl ? 'إعدادات المنصة العامة' : 'Platform System Settings'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {isRtl ? 'تهيئة إعدادات بوابات الدفع، خيارات الاشتراك، وتنبيهات النظام للمنصة بالكامل' : 'Configure platform-wide billing integrations, subscription preferences, and backup settings'}
            </p>
          </div>
        </div>

        {/* 1. General SaaS Settings */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-teal-600" />
              {isRtl ? 'الإعدادات العامة للـ SaaS' : 'General SaaS Options'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRtl ? 'اسم المنصة' : 'SaaS Platform Name'}</Label>
              <Input defaultValue="ClinicPro SaaS" className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'بريد الدعم الفني' : 'Technical Support Email'}</Label>
              <Input type="email" defaultValue="support@clinicpro.com" className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'العملة الافتراضية' : 'Default Currency'}</Label>
              <Input defaultValue="EGP (ج.م)" className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'فترة التجربة المجانية (أيام)' : 'Free Trial Period (days)'}</Label>
              <Input type="number" defaultValue={14} className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </CardContent>
        </Card>

        {/* 2. Billing & Payments Integrations */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Landmark className="w-4 h-4 text-teal-600" />
              {isRtl ? 'بوابات الدفع الإلكتروني (مصر)' : 'Egyptian Payment Gateways'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRtl ? 'معرف تاجر فوري (Fawry Merchant ID)' : 'Fawry Merchant ID'}</Label>
              <Input type="password" defaultValue="FWRY_98124_EG" className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'مفتاح الربط لبي موب (Paymob Secret Key)' : 'Paymob Secret Key'}</Label>
              <Input type="password" defaultValue="SEC_KEY_851b23aa..." className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 font-mono" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT / Tax Rate (%)'}</Label>
              <Input type="number" defaultValue={14} className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'بروتوكول الفاتورة الإلكترونية المصرية' : 'ETA E-Invoicing Protocol'}</Label>
              <select defaultValue="v2.0" className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-sm focus:ring-2 focus:ring-teal-500">
                <option value="v1.0">{isRtl ? 'الإصدار الأول (v1.0)' : 'ETA Sandbox v1.0'}</option>
                <option value="v2.0">{isRtl ? 'الإصدار التجاري النشط (v2.0)' : 'ETA Production v2.0'}</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* 3. Alerts & Backups */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600" />
              {isRtl ? 'النسخ الاحتياطي وتنبيهات النظام' : 'Backups & System Alerts'}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isRtl ? 'توقيت النسخ الاحتياطي التلقائي' : 'Database Backup Frequency'}</Label>
              <select defaultValue="DAILY" className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-sm focus:ring-2 focus:ring-teal-500">
                <option value="HOURLY">{isRtl ? 'كل ساعة' : 'Hourly'}</option>
                <option value="DAILY">{isRtl ? 'يومياً (منتصف الليل)' : 'Daily at Midnight'}</option>
                <option value="WEEKLY">{isRtl ? 'أسبوعياً' : 'Weekly'}</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>{isRtl ? 'البريد للإشعارات الطارئة' : 'Emergency Alert Email'}</Label>
              <Input type="email" defaultValue="admin@clinicpro.com" className="transition-all focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" />
            </div>
          </CardContent>
        </Card>

        {/* 4. Language Settings */}
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="w-4 h-4 text-teal-600" />
              {isRtl ? 'لغة النظام' : 'System Language'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button variant={locale === 'en' ? 'default' : 'outline'} onClick={() => switchLocale('en')} className="transition-all">
                {t('english')}
              </Button>
              <Button variant={locale === 'ar' ? 'default' : 'outline'} onClick={() => switchLocale('ar')} className="transition-all">
                {t('arabic')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="flex justify-end animate-fade-in-up delay-4">
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2 transition-all hover:shadow-lg hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30">
            <Save className="w-4 h-4" /> {saving ? ct('saving') : ct('save')}
          </Button>
        </div>
      </div>
    );
  }

  // Clinic User Settings View
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.clinicId) return;

    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await api.put(`/clinics/${user.clinicId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = `${API_BASE.replace('/api', '')}${res.data.logoUrl}`;
      setLogoPreview(newUrl);
      toast.success(isRtl ? 'تم رفع الشعار بنجاح' : 'Logo uploaded successfully');
    } catch {
      toast.error(isRtl ? 'فشل رفع الشعار' : 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={`max-w-4xl mx-auto space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-down">{t('title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
        <CardHeader><CardTitle className="text-base">{t('clinicInfo')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('clinicName')}</Label><Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('doctorName')}</Label><Input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('specialty')}</Label><Input defaultValue="Cardiology" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('phone')}</Label><Input value={clinicPhone} onChange={(e) => setClinicPhone(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2 md:col-span-2"><Label>{t('address')}</Label><Textarea value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} rows={2} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t('logo')}</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                {logoPreview ? (
                  <img src={logoPreview} alt="Clinic logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                    <svg viewBox="0 0 40 40" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6 L20 34 M6 20 L34 20" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={logoUploading} className="gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  {logoUploading ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'اختيار شعار' : 'Choose Logo')}
                </Button>
                {logoPreview && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleRemoveLogo} className="gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                    <Trash2 className="w-3.5 h-3.5" />
                    {isRtl ? 'إزالة' : 'Remove'}
                  </Button>
                )}
                <p className="text-[10px] text-slate-400">{isRtl ? 'يفضل صورة مربعة، PNG أو JPG، حتى 2MB' : 'Square image preferred, PNG or JPG, up to 2MB'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
        <CardHeader><CardTitle className="text-base">{t('appointmentSettings')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('defaultDuration')}</Label><Input type="number" defaultValue={30} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2 md:col-span-2">
            <Label>{isRtl ? 'أيام العمل' : 'Working Days'}</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {ALL_DAYS.map(day => {
                const isSelected = workingDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDay(day.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 border ${
                      isSelected 
                        ? 'bg-teal-500 text-white border-teal-500 shadow-md shadow-teal-500/20 dark:bg-teal-600 dark:border-teal-600' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                    }`}
                  >
                    {isRtl ? day.ar : day.en}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? 'من الساعة' : 'From'}</Label>
            <select
              value={workingHoursFrom}
              onChange={(e) => setWorkingHoursFrom(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {timeOptions.map((t) => (
                <option key={`from-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{isRtl ? 'إلى الساعة' : 'To'}</Label>
            <select
              value={workingHoursTo}
              onChange={(e) => setWorkingHoursTo(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {timeOptions.map((t) => (
                <option key={`to-${t}`} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <CardTitle className="text-base">{isRtl ? 'الفروع الإضافية' : 'Additional Branches'}</CardTitle>
          <Button type="button" onClick={addBranch} variant="outline" size="sm" className="gap-2 text-teal-600 border-teal-200 hover:bg-teal-50 dark:border-teal-800 dark:hover:bg-teal-900/30">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            {isRtl ? 'إضافة فرع' : 'Add Branch'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          {branches.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">{isRtl ? 'لا يوجد فروع إضافية' : 'No additional branches'}</p>
          ) : (
            branches.map((b, idx) => (
              <div key={b.id} className="relative p-4 rounded-xl border border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/50 space-y-4">
                <div className="absolute top-4 right-4">
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeBranch(b.id)} className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                  <div className="space-y-2">
                    <Label>{isRtl ? 'اسم الفرع' : 'Branch Name'}</Label>
                    <Input value={b.name} onChange={(e) => updateBranch(b.id, 'name', e.target.value)} placeholder={isRtl ? 'مثال: فرع المعادي' : 'e.g. Maadi Branch'} />
                  </div>
                  <div className="space-y-2">
                    <Label>{isRtl ? 'رقم الهاتف' : 'Phone Number'}</Label>
                    <Input value={b.phone} onChange={(e) => updateBranch(b.id, 'phone', e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{isRtl ? 'العنوان' : 'Address'}</Label>
                    <Input value={b.address} onChange={(e) => updateBranch(b.id, 'address', e.target.value)} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>{isRtl ? 'أيام العمل' : 'Working Days'}</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {ALL_DAYS.map(day => {
                        const isSelected = b.workingDays?.includes(day.id);
                        return (
                          <button
                            key={day.id}
                            type="button"
                            onClick={() => {
                              const currentDays = b.workingDays || [];
                              const newDays = isSelected ? currentDays.filter((d: string) => d !== day.id) : [...currentDays, day.id];
                              updateBranch(b.id, 'workingDays', newDays);
                            }}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border ${
                              isSelected 
                                ? 'bg-teal-500 text-white border-teal-500 shadow-sm dark:bg-teal-600 dark:border-teal-600' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                            }`}
                          >
                            {isRtl ? day.ar : day.en}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{isRtl ? 'من الساعة' : 'From'}</Label>
                    <select
                      value={b.workingHoursFrom}
                      onChange={(e) => updateBranch(b.id, 'workingHoursFrom', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {timeOptions.map((t) => <option key={`from-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>{isRtl ? 'إلى الساعة' : 'To'}</Label>
                    <select
                      value={b.workingHoursTo}
                      onChange={(e) => updateBranch(b.id, 'workingHoursTo', e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {timeOptions.map((t) => <option key={`to-${t}`} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-3">
        <CardHeader><CardTitle className="text-base">{t('prescriptionSettings')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>{t('header')}</Label><Input defaultValue="ClinicPro Medical Center" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('footerNotes')}</Label><Textarea defaultValue="Follow up in 2 weeks if symptoms persist" rows={2} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-4">
        <CardHeader><CardTitle className="text-base">{t('language')}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button variant={locale === 'en' ? 'default' : 'outline'} onClick={() => switchLocale('en')} className="transition-all duration-150">{t('english')}</Button>
            <Button variant={locale === 'ar' ? 'default' : 'outline'} onClick={() => switchLocale('ar')} className="transition-all duration-150">{t('arabic')}</Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end animate-fade-in-up delay-4">
        <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 gap-2 transition-all duration-150 hover:shadow-lg hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30">
          <Save className="w-4 h-4" /> {saving ? ct('saving') : ct('save')}
        </Button>
      </div>
    </div>
  );
}
