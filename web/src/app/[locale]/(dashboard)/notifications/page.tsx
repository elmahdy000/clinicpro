'use client';

import { useTranslations } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  const t = useTranslations('common');
  const queryClient = useQueryClient();

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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()}>
          Mark all as read
        </Button>
      </div>
      <Card className="border-gray-100/80 dark:border-gray-800/80 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('noResults')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((n: any) => (
                <div key={n.id} className="p-3.5">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
