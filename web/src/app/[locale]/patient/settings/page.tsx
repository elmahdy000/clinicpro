'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function PatientSettingsPage() {
  const t = useTranslations('patientSettings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const switchLocale = (targetLocale: 'en' | 'ar') => {
    // pathname might look like /ar/patient/settings
    // we want to replace the first segment (/ar or /en)
    const pathWithoutLocale = pathname.replace(/^\/(en|ar)/, '');
    router.replace(`/${targetLocale}${pathWithoutLocale || '/patient/settings'}`);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/auth/me', { name: name || undefined, currentPassword: currentPassword || undefined, newPassword: newPassword || undefined });
      toast.success(t('successUpdate'));
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      toast.error(t('errorUpdate'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`max-w-3xl mx-auto space-y-6 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
        <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6">
        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="text-lg">{t('loginInfo')}</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 max-w-md">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('nameOptional')} />
              <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder={t('currentPassword')} />
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPassword')} />
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t('saving') : t('saveChanges')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 bg-white shadow-sm">
          <CardHeader><CardTitle className="text-lg">{t('language')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button 
                variant={locale === 'en' ? 'default' : 'outline'} 
                onClick={() => switchLocale('en')} 
                className="transition-all"
              >
                {t('english')}
              </Button>
              <Button 
                variant={locale === 'ar' ? 'default' : 'outline'} 
                onClick={() => switchLocale('ar')} 
                className="transition-all"
              >
                {t('arabic')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
