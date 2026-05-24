'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/stores/auth';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function ProfilePage() {
  const t = useTranslations('profile');
  const locale = useLocale();
  const { user } = useAuth();
  const isRtl = locale === 'ar';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePassword = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      api.put('/auth/me', payload),
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('passwordChanged'));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t('changePassword'));
    },
  });

  if (!user) return null;

  const onSubmit = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-down">{t('title')}</h2>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-1">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold shadow-md transition-transform duration-200 hover:scale-105">
            {user.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.name}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
            <Badge className="mt-1 bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300 border-0">{user.role}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm animate-fade-in-up delay-2">
        <CardHeader><CardTitle className="text-base">{t('changePassword')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>{t('currentPassword')}</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('newPassword')}</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <div className="space-y-2"><Label>{t('confirmPassword')}</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20" /></div>
          <Button onClick={onSubmit} disabled={changePassword.isPending} className="bg-teal-600 hover:bg-teal-700 gap-2 transition-all duration-150 hover:shadow-lg hover:shadow-teal-200/50 dark:hover:shadow-teal-900/30">
            <Save className="w-4 h-4" /> {t('changePassword')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
