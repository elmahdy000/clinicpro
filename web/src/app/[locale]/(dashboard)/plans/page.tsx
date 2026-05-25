'use client';

import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Sparkles, Check, Users, ShieldAlert, Award, Landmark,
  Settings, PenSquare, Eye, Plus, ArrowUpRight, HelpCircle
} from 'lucide-react';

export default function PlansPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: clinics } = useQuery<any[]>({
    queryKey: ['admin-subscriptions-plans'],
    queryFn: async () => {
      const { data } = await api.get('/clinics');
      return data;
    },
  });

  const getSubCount = (plan: string) => {
    return clinics?.filter((c) => c.subscriptionPlan === plan).length || 0;
  };

  const PLANS = [
    {
      id: 'FREE',
      name: isRtl ? 'الخطة المجانية' : 'Free Trial Plan',
      price: '0',
      activeSubs: getSubCount('FREE'),
      icon: HelpCircle,
      color: 'from-gray-500 to-slate-600',
      textColor: 'text-gray-600 dark:text-gray-400',
      bgLight: 'bg-gray-50 dark:bg-gray-900/40',
      badge: isRtl ? 'مجاني' : 'Free',
      features: isRtl ? [
        'طبيب واحد فقط (1 Doctor)',
        'بحد أقصى 100 مريض',
        'جدول مواعيد مبسط',
        'دعم فني عبر البريد الإلكتروني',
      ] : [
        '1 Doctor limit',
        'Max 100 Patients',
        'Basic scheduling',
        'Email-only support',
      ]
    },
    {
      id: 'BASIC',
      name: isRtl ? 'الخطة الأساسية' : 'Basic Plan',
      price: '499',
      activeSubs: getSubCount('BASIC'),
      icon: Landmark,
      color: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600 dark:text-blue-400',
      bgLight: 'bg-blue-50/50 dark:bg-blue-950/20',
      badge: isRtl ? 'الأكثر نمواً' : 'Popular',
      features: isRtl ? [
        'طبيبين (2 Doctors)',
        'بحد أقصى 1000 مريض',
        'إدارة الطوابير والانتظار بالكامل',
        'طباعة روشتات مبسطة',
        'دعم فني خلال 24 ساعة',
      ] : [
        'Up to 2 Doctors',
        'Max 1000 Patients',
        'Full queue management',
        'Basic prescription printing',
        '24h tech support response',
      ]
    },
    {
      id: 'PRO',
      name: isRtl ? 'الخطة الاحترافية' : 'Pro Plan',
      price: '999',
      activeSubs: getSubCount('PRO'),
      icon: Award,
      color: 'from-teal-500 to-emerald-600',
      textColor: 'text-teal-600 dark:text-teal-400',
      bgLight: 'bg-teal-50/50 dark:bg-teal-950/20',
      badge: isRtl ? 'الأكثر مبيعاً' : 'Best Seller',
      features: isRtl ? [
        'أطباء غير محدودين (Unlimited)',
        'مرضى غير محدودين',
        'منظومة الروشتات الإلكترونية والقاموس المتقدم',
        'تحليلات العيادة والأرباح بالتفصيل',
        'دعم فني فوري عبر الواتساب والمنصة',
        'نسخ احتياطي تلقائي كل ساعة',
      ] : [
        'Unlimited Doctors',
        'Unlimited Patients',
        'Premium Prescriptions module',
        'Advanced Clinic Analytics',
        'Instant WhatsApp & portal support',
        'Hourly automatic backup',
      ]
    },
    {
      id: 'ENTERPRISE',
      name: isRtl ? 'خطة المؤسسات / المراكز' : 'Enterprise Plan',
      price: '2,499',
      activeSubs: getSubCount('ENTERPRISE'),
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-600',
      textColor: 'text-purple-600 dark:text-purple-400',
      bgLight: 'bg-purple-50/50 dark:bg-purple-950/20',
      badge: isRtl ? 'مخصصة للمراكز' : 'Customizable',
      features: isRtl ? [
        'مراكز طبية متعددة الفروع (Multi-branch)',
        'ربط بنظام معامل وبصريات خارجي',
        'استضافة خاصة للمركز (Dedicated Server Option)',
        'لوحة تحليلات مخصصة لشركات الأدوية والشركاء',
        'مدير حساب مخصص للدعم والتدريب',
        'عقد اتفاقية مستوى الخدمة SLA 99.9%',
      ] : [
        'Multi-branch Medical Centers',
        'External Labs & Optics integrations',
        'Dedicated Server hosting option',
        'Custom pharma analytics access',
        'Dedicated support manager',
        '99.9% SLA agreement',
      ]
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-teal-600 animate-pulse" />
            {isRtl ? 'خطط الاشتراك والأسعار' : 'SaaS Subscription Plans'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'إدارة هياكل تسعير الخطط والميزات وعرض عدد المشتركين في كل خطة' : 'Configure pricing plans, feature access levels, and monitor subscribers count'}
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5 self-start sm:self-center">
          <Plus className="w-4 h-4" />
          {isRtl ? 'إنشاء خطة جديدة' : 'Create New Plan'}
        </Button>
      </div>

      {/* Grid of Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {PLANS.map((plan, i) => {
          const PlanIcon = plan.icon;
          return (
            <Card key={plan.id} className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm flex flex-col group h-full">
              {/* Card top banner with color gradient */}
              <div className={`h-2.5 bg-gradient-to-r ${plan.color}`} />
              
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start gap-2">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <PlanIcon className="w-5 h-5" />
                  </div>
                  <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full ${plan.textColor} border-current/25 bg-current/5`}>
                    {plan.badge}
                  </Badge>
                </div>
                
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white mt-4">{plan.name}</CardTitle>
                
                <div className="flex items-baseline gap-1 mt-3">
                  <span className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-xs text-gray-400 font-normal">
                    {isRtl ? 'ج.م / شهرياً' : 'EGP / month'}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-6 pt-0">
                {/* Active Subscriptions Stat */}
                <div className={`p-3 rounded-xl ${plan.bgLight} border border-gray-100/50 dark:border-gray-800/50 flex justify-between items-center`}>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">{isRtl ? 'العيادات المشتركة' : 'Active Clinics'}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">{plan.activeSubs}</span>
                </div>

                {/* Features list */}
                <div className="flex-1 space-y-2.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{isRtl ? 'ميزات الخطة' : 'Plan Features'}</p>
                  <ul className="space-y-2">
                    {plan.features.map((f, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <Check className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span className="leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Admin controls */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
                    <PenSquare className="w-3 h-3" />
                    {isRtl ? 'تعديل' : 'Edit'}
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Eye className="w-3 h-3" />
                    {isRtl ? 'المشتركون' : 'Clinics'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
