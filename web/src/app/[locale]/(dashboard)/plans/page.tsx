'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sparkles, CheckCircle2, XCircle, Users, Building2,
  Stethoscope, HardDrive, Plus, Edit3, Award, FileText,
  ShieldCheck, Flame, Zap, HelpCircle, ToggleLeft, ArrowRightLeft,
  Activity, Star, Layers
} from 'lucide-react';
import { toast } from 'sonner';

// Curated SaaS-tier visual configurations for each package
interface PlanTheme {
  border: string;
  bg: string;
  glow: string;
  badge: string;
  button: string;
  iconBg: string;
  iconColor: string;
}

const PLAN_THEMES: Record<string, PlanTheme> = {
  FREE: {
    border: 'border-slate-200 dark:border-slate-800 hover:border-slate-350',
    bg: 'bg-white/60 dark:bg-slate-900/30',
    glow: 'from-slate-500/5 to-zinc-500/5',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    button: 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/60',
    iconBg: 'bg-slate-50 dark:bg-slate-800/80',
    iconColor: 'text-slate-500 dark:text-slate-400'
  },
  BASIC: {
    border: 'border-blue-200 dark:border-blue-950/60 hover:border-blue-400/50',
    bg: 'bg-white/60 dark:bg-slate-900/30',
    glow: 'from-blue-500/5 to-cyan-500/5',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50',
    button: 'border-blue-250 dark:border-blue-900/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20',
    iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    iconColor: 'text-blue-500 dark:text-blue-400'
  },
  PRO: {
    border: 'border-teal-200 dark:border-teal-950/60 hover:border-teal-400/50',
    bg: 'bg-white/80 dark:bg-slate-900/40',
    glow: 'from-teal-500/10 to-emerald-500/5',
    badge: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-355 border-teal-200 dark:border-teal-900/50',
    button: 'bg-gradient-to-r from-teal-500/10 to-emerald-500/10 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-900/40 hover:from-teal-500/20 hover:to-emerald-500/20',
    iconBg: 'bg-teal-50 dark:bg-teal-950/40',
    iconColor: 'text-teal-600 dark:text-teal-400'
  },
  ENTERPRISE: {
    border: 'border-purple-200 dark:border-purple-950/60 hover:border-purple-400/50',
    bg: 'bg-white/60 dark:bg-slate-900/30',
    glow: 'from-purple-500/5 to-fuchsia-500/5',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50',
    button: 'border-purple-250 dark:border-purple-900/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/20',
    iconBg: 'bg-purple-50 dark:bg-purple-950/40',
    iconColor: 'text-purple-600 dark:text-purple-400'
  }
};

const PLAN_MAP_AR: Record<string, string> = {
  FREE: 'الباقة المجانية',
  BASIC: 'الباقة الأساسية',
  PRO: 'الباقة الاحترافية',
  ENTERPRISE: 'باقة المؤسسات',
};

export default function PlansPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // Toggle state between monthly and yearly billing
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Modal open states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // Form states for Create/Edit
  const [formId, setFormId] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formNameEn, setFormNameEn] = useState('');
  const [formPriceMonthly, setFormPriceMonthly] = useState(0);
  const [formPriceYearly, setFormPriceYearly] = useState(0);
  const [formMaxPatients, setFormMaxPatients] = useState(0);
  const [formMaxDoctors, setFormMaxDoctors] = useState(0);
  const [formStorageMB, setFormStorageMB] = useState(0);
  const [formRecommended, setFormRecommended] = useState(false);
  const [formFeaturesAr, setFormFeaturesAr] = useState('');
  const [formFeaturesEn, setFormFeaturesEn] = useState('');

  // Plans Database State
  const [plans, setPlans] = useState<any[]>([
    {
      id: 'FREE',
      nameAr: 'الخطة المجانية',
      nameEn: 'Free Tier',
      priceMonthly: 0,
      priceYearly: 0,
      maxPatients: 30,
      maxDoctors: 1,
      storageMB: 100,
      activeClinics: 14,
      status: 'ACTIVE',
      recommended: false,
      featuresAr: ['حتى ٣٠ مريض شهرياً', 'طبيب واحد مرخص بالمنصة', 'إمكانية جدولة مواعيد المرضى', 'تخزين ملفات حتى ١٠٠ ميجابايت'],
      featuresEn: ['Up to 30 patients', '1 licensed doctor', 'Patient scheduler access', '100 MB secure storage'],
    },
    {
      id: 'BASIC',
      nameAr: 'الخطة الأساسية',
      nameEn: 'Basic Plan',
      priceMonthly: 299,
      priceYearly: 2870,
      maxPatients: 200,
      maxDoctors: 3,
      storageMB: 1024,
      activeClinics: 42,
      status: 'ACTIVE',
      recommended: false,
      featuresAr: ['حتى ٢٠٠ مريض شهرياً', 'حتى ٣ أطباء مرخصين للعيادة', 'تقارير مالية وتحليلات أساسية', 'تخزين سحابي حتى ١ جيجابايت'],
      featuresEn: ['Up to 200 patients', 'Up to 3 licensed doctors', 'Basic financial analytics', '1 GB secure cloud storage'],
    },
    {
      id: 'PRO',
      nameAr: 'الخطة الاحترافية',
      nameEn: 'Pro Suite',
      priceMonthly: 599,
      priceYearly: 5750,
      maxPatients: 99999,
      maxDoctors: 999,
      storageMB: 10240,
      activeClinics: 89,
      status: 'ACTIVE',
      recommended: true,
      featuresAr: ['عدد مرضى وأطباء غير محدود', 'تقارير مالية وتنبؤات ذكية', 'تحليلات سوق الأدوية المتكاملة', 'تخزين سحابي حتى ١٠ جيجابايت'],
      featuresEn: ['Unlimited patients & doctors', 'Financial predictive reports', 'Pharma market analytics', '10 GB secure cloud storage'],
    },
    {
      id: 'ENTERPRISE',
      nameAr: 'خطة المؤسسات',
      nameEn: 'Enterprise SLA',
      priceMonthly: 2499,
      priceYearly: 23990,
      maxPatients: 99999,
      maxDoctors: 9999,
      storageMB: 102400,
      activeClinics: 12,
      status: 'ACTIVE',
      recommended: false,
      featuresAr: ['خادم سحابي خاص مستقل', 'ربط خارجي مخصص (API)', 'مدير حساب تقني مخصص', 'عقد خدمة قانوني وضمان SLA'],
      featuresEn: ['Dedicated cloud server', 'Custom API integration', 'Dedicated technical manager', 'Custom legal SLA contract'],
    },
  ]);

  // Handle plan recommendation toggling
  const handleSetRecommended = (id: string) => {
    setPlans(prev => prev.map(p => ({
      ...p,
      recommended: p.id === id
    })));
    toast.success(isRtl ? 'تم تغيير الباقة الموصى بها بنجاح' : 'Recommended plan updated successfully');
  };

  // Toggle Plan Status Active/Disabled
  const handleToggleStatus = (id: string) => {
    setPlans(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        toast.success(isRtl ? `تم تغيير حالة الباقة إلى ${nextStatus === 'ACTIVE' ? 'نشطة' : 'معطلة'}` : `Plan status changed to ${nextStatus}`);
        return { ...p, status: nextStatus };
      }
      return p;
    }));
  };

  // Open Edit Dialog Modal
  const openEditModal = (plan: any) => {
    setSelectedPlan(plan);
    setFormId(plan.id);
    setFormNameAr(plan.nameAr);
    setFormNameEn(plan.nameEn);
    setFormPriceMonthly(plan.priceMonthly);
    setFormPriceYearly(plan.priceYearly);
    setFormMaxPatients(plan.maxPatients);
    setFormMaxDoctors(plan.maxDoctors);
    setFormStorageMB(plan.storageMB);
    setFormRecommended(plan.recommended);
    setFormFeaturesAr(plan.featuresAr.join('\n'));
    setFormFeaturesEn(plan.featuresEn.join('\n'));
    setEditOpen(true);
  };

  // Handle Save Edit Plan
  const handleSaveEdit = () => {
    setPlans(prev => prev.map(p => {
      if (p.id === formId) {
        return {
          ...p,
          nameAr: formNameAr,
          nameEn: formNameEn,
          priceMonthly: Number(formPriceMonthly),
          priceYearly: Number(formPriceYearly),
          maxPatients: Number(formMaxPatients),
          maxDoctors: Number(formMaxDoctors),
          storageMB: Number(formStorageMB),
          recommended: formRecommended,
          featuresAr: formFeaturesAr.split('\n').filter(Boolean),
          featuresEn: formFeaturesEn.split('\n').filter(Boolean),
        };
      }
      return p;
    }));
    if (formRecommended) {
      setPlans(prev => prev.map(p => ({
        ...p,
        recommended: p.id === formId
      })));
    }
    setEditOpen(false);
    toast.success(isRtl ? 'تم حفظ التعديلات على الباقة بنجاح' : 'Plan limits updated successfully');
  };

  // Handle Create New Plan
  const handleCreatePlan = () => {
    if (!formId || !formNameAr || !formNameEn) {
      toast.error(isRtl ? 'يرجى إدخال اسم ومعرف الباقة' : 'Please fill all required fields');
      return;
    }
    const newPlan = {
      id: formId.toUpperCase(),
      nameAr: formNameAr,
      nameEn: formNameEn,
      priceMonthly: Number(formPriceMonthly),
      priceYearly: Number(formPriceYearly),
      maxPatients: Number(formMaxPatients),
      maxDoctors: Number(formMaxDoctors),
      storageMB: Number(formStorageMB),
      activeClinics: 0,
      status: 'ACTIVE',
      recommended: formRecommended,
      featuresAr: formFeaturesAr.split('\n').filter(Boolean),
      featuresEn: formFeaturesEn.split('\n').filter(Boolean),
    };

    setPlans(prev => [...prev, newPlan]);
    if (formRecommended) {
      setPlans(prev => prev.map(p => ({
        ...p,
        recommended: p.id === newPlan.id
      })));
    }

    setCreateOpen(false);
    // Reset Form
    setFormId('');
    setFormNameAr('');
    setFormNameEn('');
    setFormPriceMonthly(0);
    setFormPriceYearly(0);
    setFormMaxPatients(0);
    setFormMaxDoctors(0);
    setFormStorageMB(0);
    setFormRecommended(false);
    setFormFeaturesAr('');
    setFormFeaturesEn('');

    toast.success(isRtl ? 'تم إضافة وتسجيل باقة جديدة للمنصة' : 'New pricing plan registered successfully');
  };

  return (
    <div className={`relative space-y-8 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Decorative Ambient Background Blur Glowing Circles */}
      <div className="absolute top-0 right-1/4 w-[380px] h-[380px] rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[95px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/3 left-1/4 w-[420px] h-[420px] rounded-full bg-purple-500/8 dark:bg-purple-500/4 blur-[110px] pointer-events-none -z-10" />

      {/* ── HIGH-FIDELITY PLATFORM HEADER CONTAINER ── */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-slate-900/20 backdrop-blur-xl shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-purple-500/5 pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 border border-teal-500/20">
            <Sparkles className="w-3 h-3 text-teal-500" />
            {isRtl ? 'لوحة تحكم SaaS المتقدمة' : 'Advanced SaaS Management Engine'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white leading-tight">
            {isRtl ? 'إدارة باقات وخطط الاشتراك' : 'Platform Subscription Plans Directory'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-semibold max-w-2xl leading-relaxed">
            {isRtl ? 'تحكم في الأسعار الدورية للمستشفيات والعيادات، وحدود تخزين البيانات والملفات، وسعة الأطباء والمرضى المسموح بها' : 'Adjust global recurring tiers, database sizes, doctors/patients constraints, and dynamic feature sets'}
          </p>
        </div>

        {/* CREATE NEW PLAN BUTTON MODAL */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger
            render={
              <Button className="relative z-10 bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 text-white text-xs font-black gap-1.5 h-10 px-5 rounded-xl shadow-lg shadow-teal-500/20 border border-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                <Plus className="w-4 h-4 text-white" />
                {isRtl ? 'إنشاء باقة تسعير جديدة' : 'Create Pricing Plan'}
              </Button>
            }
          />
          <DialogContent className="max-w-xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-gray-200/50 dark:border-slate-800/80 rounded-3xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-black text-lg">
                <Sparkles className="w-5 h-5 text-teal-600" />
                {isRtl ? 'إنشاء باقة تسعير سحابية جديدة' : 'Create New Pricing Tier'}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs font-bold" dir={isRtl ? 'rtl' : 'ltr'}>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'معرف الباقة (بالإنجليزي - كود)' : 'Plan Code ID'}</Label>
                <Input value={formId} onChange={(e) => setFormId(e.target.value)} placeholder="e.g. ULTIMATE" className="h-10 rounded-xl focus-visible:ring-teal-500 focus-visible:border-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'الاسم باللغة العربية' : 'Arabic Name'}</Label>
                <Input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} placeholder="الخطة الشاملة" className="h-10 rounded-xl focus-visible:ring-teal-500 focus-visible:border-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'الاسم باللغة الإنجليزية' : 'English Name'}</Label>
                <Input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} placeholder="Ultimate SLA" className="h-10 rounded-xl focus-visible:ring-teal-500 focus-visible:border-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'السعر الشهري (ج.م)' : 'Monthly Price (EGP)'}</Label>
                <Input type="number" value={formPriceMonthly} onChange={(e) => setFormPriceMonthly(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'السعر السنوي (ج.م)' : 'Yearly Price (EGP)'}</Label>
                <Input type="number" value={formPriceYearly} onChange={(e) => setFormPriceYearly(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'الحد الأقصى للمرضى' : 'Max Patients Limit'}</Label>
                <Input type="number" value={formMaxPatients} onChange={(e) => setFormMaxPatients(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'الحد الأقصى للأطباء' : 'Max Doctors Limit'}</Label>
                <Input type="number" value={formMaxDoctors} onChange={(e) => setFormMaxDoctors(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500">{isRtl ? 'مساحة التخزين السحابي (ميجابايت)' : 'Cloud Storage (MB)'}</Label>
                <Input type="number" value={formStorageMB} onChange={(e) => setFormStorageMB(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
              </div>

              <div className="flex items-center gap-2 md:col-span-2 pt-2">
                <input type="checkbox" id="rec-check" checked={formRecommended} onChange={(e) => setFormRecommended(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                <Label htmlFor="rec-check" className="text-xs font-black text-gray-800 dark:text-gray-200 cursor-pointer">{isRtl ? 'تمييز كخيار موصى به رئيسي للمنصة' : 'Mark as recommended plan'}</Label>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-gray-500">{isRtl ? 'مزايا الباقة بالعربية (ميزة واحدة في كل سطر)' : 'Arabic Features (One per line)'}</Label>
                <textarea value={formFeaturesAr} onChange={(e) => setFormFeaturesAr(e.target.value)} rows={3} className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500" placeholder="ميزة ١&#10;ميزة ٢" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-gray-500">{isRtl ? 'مزايا الباقة بالإنجليزية (ميزة واحدة في كل سطر)' : 'English Features (One per line)'}</Label>
                <textarea value={formFeaturesEn} onChange={(e) => setFormFeaturesEn(e.target.value)} rows={3} className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500" placeholder="Feature 1&#10;Feature 2" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="outline" size="sm" className="rounded-xl px-4" onClick={() => setCreateOpen(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
              <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4" onClick={handleCreatePlan}>{isRtl ? 'حفظ وتثبيت' : 'Save & Activate'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── UNIFIED BILLING SWITCH & CARDS WRAPPER ── */}
      <div className="space-y-8 bg-white/20 dark:bg-slate-900/10 p-6 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-md shadow-lg">
        
        {/* BILLING CYCLE SWITCHER WITH PULSING BADGE */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-extrabold uppercase tracking-widest">{isRtl ? 'دورة الفوترة السحابية للمشتركين' : 'Cloud Tenant Billing Cycle'}</span>
          <div className="relative flex items-center gap-1 bg-gray-200/50 dark:bg-slate-950/60 p-1.5 rounded-2xl w-full max-w-xs border border-gray-200/20 dark:border-gray-800/40 shadow-inner">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md scale-[1.02]'
                  : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              {isRtl ? 'الدفع الشهري' : 'Monthly'}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`relative flex-1 py-2 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md scale-[1.02]'
                  : 'text-gray-400 hover:text-gray-500 dark:hover:text-gray-300'
              }`}
            >
              {isRtl ? 'الدفع السنوي' : 'Yearly'}
              <span className="relative flex h-2.5 w-2.5 scale-90">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 px-3 py-1 rounded-full">
            {isRtl ? '💡 وفر ٢٠٪ على الاشتراكات السنوية للمنصة' : '💡 Save 20% by subscribing to the Yearly tier'}
          </div>
        </div>

        {/* ── COMPREHENSIVE CARDS GRID (1 col mobile, 2 col tablet, 4 col desktop) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const isPro = plan.id === 'PRO';
            const isActive = plan.status === 'ACTIVE';
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const theme = PLAN_THEMES[plan.id] || PLAN_THEMES.FREE;
            
            // Cycle suffix formatting (RTL compliant)
            const cycleSuffix = price === 0 
              ? '' 
              : (billingCycle === 'monthly' ? (isRtl ? 'ج.م/شهرياً' : 'EGP/mo') : (isRtl ? 'ج.م/سنوياً' : 'EGP/yr'));

            return (
              <Card key={plan.id} className={`group relative flex flex-col justify-between transition-all duration-500 backdrop-blur-md rounded-3xl overflow-hidden ${theme.bg} ${theme.border} border shadow-lg hover:shadow-2xl hover:-translate-y-1.5 ${
                plan.recommended 
                  ? 'ring-2 ring-teal-500 shadow-teal-500/5 dark:shadow-teal-500/2 shadow-xl' 
                  : ''
              } ${!isActive && 'opacity-55 border-dashed bg-slate-100/50 dark:bg-slate-900/10'}`}>
                
                {/* Visual Glow Ambient Header */}
                <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${theme.glow} pointer-events-none -z-10 opacity-60`} />

                {/* Glowing Ribbon Badges */}
                <div className="absolute -top-3 left-4 right-4 flex justify-between items-center select-none z-20">
                  {plan.recommended ? (
                    <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-[9px] px-3 py-0.5 font-black shadow-lg shadow-teal-500/20 border-0 flex items-center gap-1 animate-pulse">
                      <Star className="w-2.5 h-2.5 fill-white text-white" />
                      {isRtl ? 'الباقة الموصى بها' : 'Best Choice'}
                    </Badge>
                  ) : <span />}

                  {!isActive && (
                    <Badge variant="outline" className="bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-[9px] font-black">
                      {isRtl ? 'معطلة بالمنصة' : 'Disabled'}
                    </Badge>
                  )}
                </div>

                {/* Top Section */}
                <div className="flex flex-col flex-1">
                  <CardHeader className="text-center pt-8 pb-4 space-y-1.5">
                    <div className={`inline-block px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider self-center border ${theme.badge}`}>
                      {isRtl ? (PLAN_MAP_AR[plan.id] || plan.id) : plan.id}
                    </div>
                    
                    <CardTitle className="text-base font-black text-gray-950 dark:text-white pt-1">
                      {isRtl ? plan.nameAr : plan.nameEn}
                    </CardTitle>

                    {/* Symmetric Pricing Panel */}
                    <div className="h-14 flex items-center justify-center gap-1 pt-2" dir={isRtl ? 'rtl' : 'ltr'}>
                      {price === 0 ? (
                        <span className="text-base sm:text-lg font-black text-teal-600 dark:text-teal-400">{isRtl ? 'مجاني بالكامل' : 'Always Free'}</span>
                      ) : (
                        <div className="flex items-baseline justify-center gap-0.5" dir={isRtl ? 'rtl' : 'ltr'}>
                          <span className="text-3xl font-black text-gray-950 dark:text-white font-mono tracking-tight">{price.toLocaleString()}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mx-1">{cycleSuffix}</span>
                        </div>
                      )}
                    </div>

                    {/* Usage Counter */}
                    <div className="flex items-center justify-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 font-extrabold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{plan.activeClinics} {isRtl ? 'عيادة نشطة بالمنصة' : 'clinics active'}</span>
                    </div>
                  </CardHeader>

                  <div className="px-6">
                    <div className="border-t border-gray-150/40 dark:border-gray-800/40" />
                  </div>

                  <CardContent className="px-3.5 pt-4 pb-6 space-y-5 flex-1 flex flex-col justify-between">
                    {/* Database Limits (State-of-the-Art Compact & Symmetric Pills) */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {/* Limit 1: Patients */}
                      <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2 rounded-2xl border border-gray-150 dark:border-slate-800 text-center flex flex-col justify-center items-center min-w-0 group-hover:border-teal-500/30 transition-all duration-300">
                        <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mb-1.5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[8px] text-gray-450 dark:text-gray-500 font-bold block leading-none tracking-tighter uppercase">{isRtl ? 'المرضى' : 'Patients'}</span>
                        <span className="text-[10px] text-gray-900 dark:text-white font-black mt-1.5 truncate max-w-full font-mono">
                          {plan.maxPatients >= 99999 ? (isRtl ? 'مفتوح' : 'Unlim.') : plan.maxPatients.toLocaleString()}
                        </span>
                      </div>
                      
                      {/* Limit 2: Doctors */}
                      <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2 rounded-2xl border border-gray-150 dark:border-slate-800 text-center flex flex-col justify-center items-center min-w-0 group-hover:border-teal-500/30 transition-all duration-300">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mb-1.5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[8px] text-gray-455 dark:text-gray-500 font-bold block leading-none tracking-tighter uppercase">{isRtl ? 'الأطباء' : 'Doctors'}</span>
                        <span className="text-[10px] text-gray-900 dark:text-white font-black mt-1.5 truncate max-w-full font-mono">
                          {plan.maxDoctors >= 999 ? (isRtl ? 'مفتوح' : 'Unlim.') : plan.maxDoctors.toLocaleString()}
                        </span>
                      </div>

                      {/* Limit 3: Storage */}
                      <div className="bg-slate-50/70 dark:bg-slate-900/60 p-2 rounded-2xl border border-gray-150 dark:border-slate-800 text-center flex flex-col justify-center items-center min-w-0 group-hover:border-teal-500/30 transition-all duration-300">
                        <HardDrive className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 mb-1.5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-[8px] text-gray-450 dark:text-gray-500 font-bold block leading-none tracking-tighter uppercase">{isRtl ? 'التخزين' : 'Storage'}</span>
                        <span className="text-[10px] text-gray-900 dark:text-white font-black mt-1.5 font-mono flex items-center justify-center" dir="ltr">
                          {plan.storageMB >= 1024 ? `${(plan.storageMB / 1024).toFixed(0)}GB` : `${plan.storageMB}MB`}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-150/40 dark:border-gray-800/40" />

                    {/* Symmetric Features List (RTL / LTR aligned cleanly) */}
                    <div className="space-y-3 min-h-[120px] flex flex-col justify-start" dir={isRtl ? 'rtl' : 'ltr'}>
                      {(isRtl ? plan.featuresAr : plan.featuresEn).slice(0, 4).map((feat: string, i: number) => (
                        <div key={i} className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300" dir={isRtl ? 'rtl' : 'ltr'}>
                          <div className="p-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          </div>
                          <span className={`leading-tight font-medium flex-1 text-gray-750 dark:text-gray-250 ${isRtl ? 'text-right' : 'text-left'}`}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                {/* Symmetric Admin Actions Console */}
                <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/40 bg-gray-50/60 dark:bg-slate-950/40 space-y-2 rounded-b-3xl shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs font-black h-9 gap-1.5 shadow-xs border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-teal-500 hover:text-white dark:hover:bg-teal-600 transition-all duration-300"
                    onClick={() => openEditModal(plan)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    {isRtl ? 'تعديل الأسعار والحدود' : 'Tweak Pricing & Limits'}
                  </Button>

                  <div className="grid grid-cols-2 gap-2 text-center pt-0.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(plan.id)}
                      className={`text-[10px] font-black h-8 px-1.5 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20' 
                          : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
                      }`}
                    >
                      {isActive ? (isRtl ? 'تعطيل بالمنصة' : 'Disable Plan') : (isRtl ? 'تفعيل للجمهور' : 'Enable Plan')}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={plan.recommended}
                      onClick={() => handleSetRecommended(plan.id)}
                      className="text-[10px] text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/20 font-black h-8 px-1.5 rounded-xl transition-all duration-300"
                    >
                      {plan.recommended ? (isRtl ? '★ الموصى بها' : '★ Recommended') : (isRtl ? 'تمييز الباقة' : 'Mark Rec.')}
                    </Button>
                  </div>
                </div>

              </Card>
            );
          })}
        </div>
      </div>

      {/* ── DETAILED FEATURES COMPARATIVE MATRIX TABLE ── */}
      <Card className="relative overflow-hidden border-gray-200/60 dark:border-gray-800/60 shadow-xl mt-8 bg-white/70 dark:bg-slate-900/30 backdrop-blur-md rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/2 to-purple-500/2 pointer-events-none" />
        <CardHeader className="pb-3 border-b border-gray-150/40 dark:border-gray-800/40 relative z-10">
          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <FileText className="w-4 h-4 text-teal-600" />
            {isRtl ? 'مصفوفة مقارنة المميزات وحدود الحسابات' : 'Detailed SaaS Feature Comparison Matrix'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-150/40 dark:border-gray-800/40 bg-gray-50/60 dark:bg-slate-900/60 text-gray-400 dark:text-gray-550 font-black text-[10px] uppercase select-none">
                  <th className="px-6 py-4 text-right">{isRtl ? 'الميزة أو الحد التشغيلي' : 'Operational Feature / Limit'}</th>
                  {plans.map(p => (
                    <th key={p.id} className="px-6 py-4 text-center font-black">{isRtl ? (PLAN_MAP_AR[p.id] || p.id) : p.id}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150/40 dark:divide-gray-800/40 font-bold text-gray-700 dark:text-gray-300">
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'سقف المرضى كحد أقصى' : 'Max Patient Cap'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center font-mono">{p.maxPatients >= 99999 ? (isRtl ? 'غير محدود' : 'Unlimited') : p.maxPatients.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'عدد الأطباء الأقصى' : 'Max Licensed Doctors'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center font-mono">{p.maxDoctors >= 999 ? (isRtl ? 'غير محدود' : 'Unlimited') : p.maxDoctors.toLocaleString()}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'حجم الملفات المرفقة والتخزين' : 'Attached Files & Storage'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center font-mono" dir="ltr">{p.storageMB >= 1024 ? `${(p.storageMB / 1024).toFixed(0)} GB` : `${p.storageMB} MB`}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'تحليلات أداء وسوق الدواء (Pharma)' : 'Pharma & Market Analytics'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center">
                      {p.id === 'PRO' || p.id === 'ENTERPRISE' ? (
                        <div className="inline-block p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : (
                        <XCircle className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-700" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'تقارير مالية وتوقعات ذكية للمنصة' : 'Advanced Predictive Reporting'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center">
                      {p.id === 'PRO' || p.id === 'ENTERPRISE' ? (
                        <div className="inline-block p-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                      ) : (
                        <XCircle className="w-4 h-4 mx-auto text-gray-300 dark:text-gray-700" />
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20 transition-colors">
                  <td className="px-6 py-3.5 font-extrabold text-gray-950 dark:text-white">{isRtl ? 'الدعم الفني وضمان مستوى الخدمة (SLA)' : 'SLA & Tech Support Assurance'}</td>
                  {plans.map(p => (
                    <td key={p.id} className="px-6 py-3.5 text-center text-[10px] font-black">
                      {p.id === 'FREE' && (isRtl ? 'دعم مجتمعي' : 'Community support')}
                      {p.id === 'BASIC' && (isRtl ? 'عبر البريد' : 'Email support')}
                      {p.id === 'PRO' && (isRtl ? 'على مدار الساعة' : '24/7 Priority')}
                      {p.id === 'ENTERPRISE' && (isRtl ? 'مخصص وضمان 99.9%' : 'Custom Dedicated SLA')}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* EDIT PLAN LIMITS MODAL DIALOG */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-gray-200/50 dark:border-slate-800/80 rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-black text-lg">
              <Edit3 className="w-5 h-5 text-teal-600" />
              {isRtl ? `تعديل باقة: ${formNameAr}` : `Edit Pricing Tier: ${formNameEn}`}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 text-xs font-bold" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'معرف الباقة (غير قابل للتعديل)' : 'Plan ID (ReadOnly)'}</Label>
              <Input value={formId} disabled className="h-10 bg-gray-50/50 dark:bg-slate-900/60 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'الاسم باللغة العربية' : 'Arabic Name'}</Label>
              <Input value={formNameAr} onChange={(e) => setFormNameAr(e.target.value)} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'الاسم باللغة الإنجليزية' : 'English Name'}</Label>
              <Input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'السعر الشهري (ج.م)' : 'Monthly Price (EGP)'}</Label>
              <Input type="number" value={formPriceMonthly} onChange={(e) => setFormPriceMonthly(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'السعر السنوي (ج.م)' : 'Yearly Price (EGP)'}</Label>
              <Input type="number" value={formPriceYearly} onChange={(e) => setFormPriceYearly(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'الحد الأقصى للمرضى' : 'Max Patients Limit'}</Label>
              <Input type="number" value={formMaxPatients} onChange={(e) => setFormMaxPatients(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'الحد الأقصى للأطباء' : 'Max Doctors Limit'}</Label>
              <Input type="number" value={formMaxDoctors} onChange={(e) => setFormMaxDoctors(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-gray-500">{isRtl ? 'مساحة التخزين السحابي (ميجابايت)' : 'Cloud Storage (MB)'}</Label>
              <Input type="number" value={formStorageMB} onChange={(e) => setFormStorageMB(Number(e.target.value))} className="h-10 rounded-xl focus-visible:ring-teal-500" />
            </div>

            <div className="flex items-center gap-2 md:col-span-2 pt-2">
              <input type="checkbox" id="edit-rec-check" checked={formRecommended} onChange={(e) => setFormRecommended(e.target.checked)} className="rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
              <Label htmlFor="edit-rec-check" className="text-xs font-black text-gray-800 dark:text-gray-200 cursor-pointer">{isRtl ? 'تمييز كخيار موصى به رئيسي للمنصة' : 'Mark as recommended plan'}</Label>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-gray-500">{isRtl ? 'مزايا الباقة بالعربية (ميزة واحدة في كل سطر)' : 'Arabic Features (One per line)'}</Label>
              <textarea value={formFeaturesAr} onChange={(e) => setFormFeaturesAr(e.target.value)} rows={4} className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs text-gray-500">{isRtl ? 'مزايا الباقة بالإنجليزية (ميزة واحدة في كل سطر)' : 'English Features (One per line)'}</Label>
              <textarea value={formFeaturesEn} onChange={(e) => setFormFeaturesEn(e.target.value)} rows={4} className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-500 focus-visible:border-teal-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Button variant="outline" size="sm" className="rounded-xl px-4" onClick={() => setEditOpen(false)}>{isRtl ? 'إلغاء' : 'Cancel'}</Button>
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-4" onClick={handleSaveEdit}>{isRtl ? 'حفظ التعديلات' : 'Save Changes'}</Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}