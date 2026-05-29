import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { Providers } from '@/components/layout/Providers';
import Script from 'next/script';
import type { Metadata, Viewport } from 'next';
import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export const metadata: Metadata = {
  title: { default: 'ClinicPro — نظام إدارة العيادات الطبية المتكامل', template: '%s — ClinicPro' },
  description: 'منصة ClinicPro لإدارة العيادات والمراكز الطبية: تنظيم المواعيد، السجلات الطبية الإلكترونية للرعاية الصحية، الفواتير، الصيدلية وإدارة شؤون المرضى بكل سهولة.',
  keywords: [
    'إدارة العيادات', 'برنامج عيادة طبية', 'سجلات طبية إلكترونية', 'حجز مواعيد أطباء', 
    'برنامج عيادات طبية', 'EHR', 'Clinic Management System', 'ClinicPro', 'نظام عيادات متكامل'
  ],
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'ClinicPro',
  },
  formatDetection: { telephone: false },
  alternates: {
    canonical: 'https://clinicpro.online',
    languages: {
      'ar': 'https://clinicpro.online/ar',
      'en': 'https://clinicpro.online/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    url: 'https://clinicpro.online',
    title: 'ClinicPro — نظام إدارة العيادات الطبية المتكامل',
    description: 'نظام إدارة العيادات والمراكز الطبية المتطور للأطباء والمرضى. إدارة السجلات الطبية والملفات الإلكترونية وحجز المواعيد.',
    siteName: 'ClinicPro',
    images: [
      {
        url: 'https://clinicpro.online/icon-512.png',
        width: 512,
        height: 512,
        alt: 'ClinicPro Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ClinicPro — نظام إدارة العيادات الطبية المتكامل',
    description: 'إدارة متكاملة لعيادتك الطبية من أي مكان. تنظيم ملفات المرضى، المواعيد، والفواتير.',
    images: ['https://clinicpro.online/icon-512.png'],
  },
  other: {
    'msapplication-TileColor': '#0d9488',
    'msapplication-TileImage': '/icon-144.png',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0d9488' },
    { media: '(prefers-color-scheme: dark)', color: '#0f766e' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icon-96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ClinicPro" />
        <meta name="msapplication-TileColor" content="#0d9488" />
        <meta name="msapplication-TileImage" content="/icon-144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="application-name" content="ClinicPro" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              'name': 'ClinicPro',
              'operatingSystem': 'All',
              'applicationCategory': 'MedicalBusinessApplication',
              'url': 'https://clinicpro.online',
              'description': 'نظام إدارة العيادات الطبية المتكامل للأطباء والمرضى - تنظيم المواعيد، السجلات الطبية الإلكترونية، والفواتير.',
              'offers': {
                '@type': 'Offer',
                'price': '0.00',
                'priceCurrency': 'EGP'
              },
              'aggregateRating': {
                '@type': 'AggregateRating',
                'ratingValue': '4.9',
                'ratingCount': '150'
              }
            })
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <Providers locale={locale} messages={messages}>
          {children}
        </Providers>

        {/* Service Worker Registration v2 — scope covers ALL role paths */}
        <Script id="sw-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
                  .then(function(reg) {
                    console.log('[ClinicPro SW] Registered v2, scope:', reg.scope);
                    setInterval(function() { reg.update(); }, 60000);
                  })
                  .catch(function(err) {
                    console.warn('[ClinicPro SW] Registration failed:', err);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
