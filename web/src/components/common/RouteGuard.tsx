'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/stores/auth';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';

const DASHBOARD_ALLOWED_ROLES = ['PLATFORM_OWNER', 'CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace(`/${locale}/login`);
      } else if (!DASHBOARD_ALLOWED_ROLES.includes(user.role)) {
        router.replace(`/${locale}/login`);
      }
    }
  }, [user, isLoading, router, locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user || !DASHBOARD_ALLOWED_ROLES.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
