'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const t = useTranslations('common');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const isRtl = locale === 'ar';

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
  });

  const markAll = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data?.data || [];

  return (
    <div className="space-y-5 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
          {isRtl ? 'الإشعارات الواردة' : 'Notifications'}
        </h2>
        {items.some((n: any) => !n.isRead) && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => markAll.mutate()}
            className="gap-1.5 text-xs font-semibold border-teal-200 hover:bg-teal-50 dark:border-teal-900/40 dark:hover:bg-teal-950/20 text-teal-600 dark:text-teal-400"
            disabled={markAll.isPending}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            {isRtl ? 'تحديد الكل كمقروء' : 'Mark all as read'}
          </Button>
        )}
      </div>
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 opacity-40 text-slate-500" />
              </div>
              <p className="text-sm font-medium">{isRtl ? 'لا توجد إشعارات جديدة حالياً' : 'No new notifications'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((n: any) => (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-4 transition-all duration-150 flex items-start gap-3.5",
                    !n.isRead ? "bg-teal-50/30 dark:bg-teal-950/10 border-s-4 border-teal-500" : "border-s-4 border-transparent"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{n.title}</p>
                      {!n.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
                      {new Date(n.createdAt).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
