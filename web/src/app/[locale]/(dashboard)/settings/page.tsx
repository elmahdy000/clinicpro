'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === 'ar';
  const ct = useTranslations('common');
  const [saving, setSaving] = useState(false);

  const switchLocale = (targetLocale: 'en' | 'ar') => {
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '');
    router.replace(`/${targetLocale}${pathWithoutLocale || '/settings'}`);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success(ct('save'));
    setSaving(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-down">{t('title')}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('subtitle')}</p>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
        <CardHeader><CardTitle className="text-base">{t('clinicInfo')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('clinicName')}</Label><Input defaultValue="ClinicPro" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('doctorName')}</Label><Input defaultValue="Dr. Sarah Chen" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('specialty')}</Label><Input defaultValue="Cardiology" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('phone')}</Label><Input defaultValue="+1 555-0100" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2 md:col-span-2"><Label>{t('address')}</Label><Textarea defaultValue="123 Medical Center Dr" rows={2} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2">
            <Label>{t('logo')}</Label>
            <Button variant="outline" className="gap-2 transition-all duration-150 hover:border-teal-400"><Upload className="w-4 h-4" /> Upload</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
        <CardHeader><CardTitle className="text-base">{t('appointmentSettings')}</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>{t('defaultDuration')}</Label><Input type="number" defaultValue={30} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('workingDays')}</Label><Input defaultValue="Mon - Sat" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('workingHours')}</Label><Input defaultValue="09:00 - 17:00" className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
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
