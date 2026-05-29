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

type MetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const isAr = locale === 'ar';

  return {
    title: {
      default: isAr 
        ? 'ClinicPro — أفضل سيستم إدارة عيادات ومراكز طبية متكامل' 
        : 'ClinicPro — Best Clinic Management System & EHR Software',
      template: '%s — ClinicPro'
    },
    description: isAr
      ? 'منصة ClinicPro هي أفضل سيستم إدارة عيادات ومراكز طبية في مصر والشرق الأوسط. تنظيم حجز المواعيد، سجلات المرضى الإلكترونية، الروشتة الذكية، وإدارة الفواتير والحسابات بكل سهولة.'
      : 'ClinicPro is the best clinic management system and medical software in Egypt & Middle East. Organize appointments, electronic medical records (EMR/EHR), smart prescriptions, and billing with ease.',
    keywords: isAr
      ? [
          'أفضل سيستم إدارة عيادات', 'أفضل برنامج إدارة عيادات', 'إدارة العيادات الطبية', 'برنامج عيادة طبية', 
          'سجلات طبية إلكترونية', 'حجز مواعيد أطباء', 'سستم إدارة عيادات ومراكز طبية', 'EHR', 'Clinic Management System', 'ClinicPro'
        ]
      : [
          'best clinic management system', 'best clinic software', 'ehr software', 'medical records program', 
          'doctor appointment scheduling', 'emr system', 'integrated medical software', 'clinicpro'
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
      locale: isAr ? 'ar_EG' : 'en_US',
      url: 'https://clinicpro.online',
      title: isAr 
        ? 'ClinicPro — أفضل سيستم إدارة عيادات ومراكز طبية متكامل' 
        : 'ClinicPro — Best Clinic Management System & EHR Software',
      description: isAr
        ? 'منصة ClinicPro هي أفضل سيستم إدارة عيادات ومراكز طبية في مصر والشرق الأوسط. تنظيم حجز المواعيد، سجلات المرضى الإلكترونية، الروشتة الذكية، وإدارة الفواتير والحسابات بكل سهولة.'
        : 'ClinicPro is the best clinic management system and medical software in Egypt & Middle East. Organize appointments, EMR/EHR, and billing.',
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
      title: isAr 
        ? 'ClinicPro — أفضل سيستم إدارة عيادات ومراكز طبية متكامل' 
        : 'ClinicPro — Best Clinic Management System & EHR Software',
      description: isAr
        ? 'أفضل نظام متكامل لإدارة العيادات الطبية من أي مكان. تنظيم ملفات المرضى، المواعيد، الفواتير والروشتات.'
        : 'Best complete clinic management software. Organize patient EMR, appointment slots, invoices, and smart prescriptions.',
      images: ['https://clinicpro.online/icon-512.png'],
    },
    other: {
      'msapplication-TileColor': '#0d9488',
      'msapplication-TileImage': '/icon-144.png',
      'msapplication-config': '/browserconfig.xml',
    },
  };
}

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
            __html: JSON.stringify([
              {
                '@context': 'https://schema.org',
                '@type': 'SoftwareApplication',
                'name': 'ClinicPro',
                'operatingSystem': 'All',
                'applicationCategory': 'MedicalBusinessApplication',
                'url': 'https://clinicpro.online',
                'description': locale === 'ar'
                  ? 'منصة ClinicPro هي أفضل سيستم متكامل لإدارة العيادات والمراكز الطبية في مصر والشرق الأوسط: المواعيد، السجلات الطبية الإلكترونية، الروشتات، والفوترة.'
                  : 'ClinicPro is the best clinic management system and medical software in Egypt & Middle East: EMR, appointments, prescriptions, and billing.',
                'offers': {
                  '@type': 'Offer',
                  'price': '0.00',
                  'priceCurrency': 'EGP'
                },
                'aggregateRating': {
                  '@type': 'AggregateRating',
                  'ratingValue': '4.9',
                  'ratingCount': '210'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'WebSite',
                'name': 'ClinicPro',
                'url': 'https://clinicpro.online',
                'potentialAction': {
                  '@type': 'SearchAction',
                  'target': 'https://clinicpro.online/search?q={search_term_string}',
                  'query-input': 'required name=search_term_string'
                }
              },
              {
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                'mainEntity': locale === 'ar' ? [
                  {
                    '@type': 'Question',
                    'name': 'ما هو أفضل سيستم لإدارة العيادات والمراكز الطبية؟',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'سيستم ClinicPro هو أفضل برنامج متكامل لإدارة العيادات والمراكز الطبية في مصر والوطن العربي؛ حيث يوفر لوحة تحكم ذكية لتنظيم حجز مواعيد الأطباء، والسجلات الطبية الإلكترونية للرعاية الصحية، وطباعة الروشتات الاحترافية، والفوترة والحسابات مع دعم كامل للغتين العربية والإنجليزية.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'هل يدعم برنامج ClinicPro طباعة الروشتات وحسابات المرضى؟',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'نعم، يدعم سيستم ClinicPro طباعة روشتات طبية احترافية تتطابق مع المعايير الطبية، بالإضافة لنظام حسابات مالي متكامل لتسجيل ومتابعة إيصالات الدفع والإيرادات اليومية وتسهيل الفوترة.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'هل يمكنني تجربة برنامج ClinicPro مجاناً؟',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'نعم، يمكنك تسجيل حساب عيادتك وتجربة برنامج ClinicPro مجاناً بالكامل دون أي التزامات لتجربة كافة الميزات وتسهيل شؤون المرضى والمواعيد.'
                    }
                  }
                ] : [
                  {
                    '@type': 'Question',
                    'name': 'What is the best clinic management system?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'ClinicPro is the best clinic management system and EHR software in the Middle East. It offers smart scheduling, electronic medical records (EMR), professional prescription printing, and advanced billing.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'Does ClinicPro support prescription printing and patient billing?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'Yes, ClinicPro fully supports issuing and printing professional medical prescriptions and invoices, tracking payments, daily revenues, and clinic financial reports.'
                    }
                  },
                  {
                    '@type': 'Question',
                    'name': 'Can I try ClinicPro for free?',
                    'acceptedAnswer': {
                      '@type': 'Answer',
                      'text': 'Yes! You can register your clinic and start a completely free trial with no commitment, allowing you to explore all scheduling, medical records, and billing features.'
                    }
                  }
                ]
              }
            ])
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
