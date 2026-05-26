'use client';

import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, ChevronLeft, Info, CalendarCheck, FileText, Stethoscope } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

const TYPE_ICONS: Record<string, any> = {
  INFO: Info,
  APPOINTMENT: CalendarCheck,
  PRESCRIPTION: FileText,
  MEDICAL_RECORD: Stethoscope,
};

const TYPE_COLORS: Record<string, string> = {
  INFO: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
  APPOINTMENT: 'text-teal-600 bg-teal-50 dark:bg-teal-950/30',
  PRESCRIPTION: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
  MEDICAL_RECORD: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
};

export default function PatientNotifications() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['patient-notifications'],
    queryFn: () => api.get('/patient-portal/notifications').then((r) => r.data),
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Link href={`/${locale}/patient`} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></Link>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'الإشعارات' : 'Notifications'}</h1>
      </div>
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : notifications?.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((n: any) => {
            const Icon = TYPE_ICONS[n.type] || Info;
            const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.INFO;
            return (
              <Card key={n.id} className={`border-slate-200/60 dark:border-slate-800/60 shadow-sm ${!n.isRead ? 'border-teal-200/80 dark:border-teal-900/60' : ''}`}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDate(n.createdAt, locale)}</p>
                  </div>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-1" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 text-center text-sm text-slate-400">{isRtl ? 'لا توجد إشعارات' : 'No notifications'}</CardContent>
        </Card>
      )}
    </div>
  );
}
