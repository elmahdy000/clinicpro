'use client';

import { ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/stores/auth';
import { SocketProvider } from '@/contexts/SocketContext';
import { Toaster } from 'sonner';
import { NextIntlClientProvider } from 'next-intl';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, any>;
}

export function Providers({ children, locale, messages }: ProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Riyadh">
        <AuthProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
          <Toaster position={locale === 'ar' ? 'top-left' : 'top-right'} richColors />
        </AuthProvider>
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
