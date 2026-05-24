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
import { HeartPulse, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRtl = locale === 'ar';

  useEffect(() => {
    if (user) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, locale, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success(t('loginTitle'));
      router.push(`/${locale}/dashboard`);
    } catch {
      toast.error(t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 overflow-hidden"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -end-40 w-80 h-80 rounded-full bg-teal-100/40 dark:bg-teal-900/20 blur-3xl animate-float" />
        <div className="absolute -bottom-40 -start-40 w-80 h-80 rounded-full bg-blue-100/40 dark:bg-blue-900/20 blur-3xl animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/3 -start-20 w-60 h-60 rounded-full bg-teal-100/20 dark:bg-teal-900/10 blur-3xl animate-float" style={{ animationDelay: '5s' }} />
        <div className="absolute bottom-1/4 inset-x-1/4 w-40 h-40 rounded-full bg-blue-100/30 dark:bg-blue-900/15 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <Card className="w-full max-w-md relative shadow-xl border-gray-200/50 dark:border-gray-800/50 animate-scale-in">
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4 animate-fade-in-down">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-200/50 dark:shadow-teal-900/30 transition-transform duration-300 hover:scale-105">
              <HeartPulse className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-in-up">{t('loginTitle')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 animate-fade-in-up delay-1">{t('loginSubtitle')}</p>
        </CardHeader>

        <CardContent className="pb-8 px-8">
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in-up delay-2">
            <div className="space-y-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@clinicpro.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pe-10 transition-all duration-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20"
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
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {tc('loading')}
                </span>
              ) : t('login')}
            </Button>
          </form>

          <div className="mt-6 text-center animate-fade-in-up delay-3">
            <button
              onClick={() => {
                const newLocale = locale === 'en' ? 'ar' : 'en';
                window.location.href = `/${newLocale}/login`;
              }}
              className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
            >
              {locale === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
