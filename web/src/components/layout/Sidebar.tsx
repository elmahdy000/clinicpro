'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CalendarRange, Stethoscope, Pill, FileText,
  ClipboardList, BarChart3, Settings, UserCircle, LogOut, ChevronRight, X,
  Building2, ScrollText, CreditCard, Sparkles, Receipt, TrendingUp, UserCog
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useSidebar } from '@/stores/sidebar';

// ── Clinic staff navigation ──────────────────────────────────────────────────
const CLINIC_NAV = [
  { href: '/dashboard',     label: { ar: 'الرئيسية',       en: 'Dashboard'      }, icon: LayoutDashboard },
  { href: '/queue',         label: { ar: 'الانتظار',       en: 'Queue'          }, icon: ClipboardList },
  { href: '/patients',      label: { ar: 'المرضى',         en: 'Patients'       }, icon: Users },
  { href: '/appointments',  label: { ar: 'المواعيد',       en: 'Appointments'   }, icon: CalendarRange },
  { href: '/visits/new',    label: { ar: 'كشف جديد',      en: 'New Consultation'}, icon: Stethoscope },
  { href: '/prescriptions', label: { ar: 'الروشتات',       en: 'Prescriptions'  }, icon: ScrollText },
  { href: '/files',         label: { ar: 'الملفات',        en: 'Files'          }, icon: FileText },
  { href: '/staff',         label: { ar: 'الطاقم الطبي',    en: 'Medical Staff'  }, icon: UserCog },
  { href: '/reports',       label: { ar: 'التقارير',       en: 'Reports'        }, icon: BarChart3 },
];

// ── Platform Owner navigation ─────────────────────────────────────────────────
const ADMIN_NAV = [
  { href: '/dashboard',     label: { ar: 'لوحة التحكم',       en: 'Dashboard'      }, icon: LayoutDashboard },
  { href: '/clinics',       label: { ar: 'العيادات',          en: 'Clinics'        }, icon: Building2 },
  { href: '/subscriptions', label: { ar: 'الاشتراكات',        en: 'Subscriptions'  }, icon: CreditCard },
  { href: '/plans',         label: { ar: 'الخطط',            en: 'Plans'          }, icon: Sparkles },
  { href: '/invoices',      label: { ar: 'الفواتير',          en: 'Invoices'       }, icon: Receipt },
  { href: '/medications',   label: { ar: 'قاموس الأدوية العام', en: 'Medicine Dict'  }, icon: Pill },
  { href: '/pharma-insights', label: { ar: 'تحليلات سوق الأدوية', en: 'Pharma Insights' }, icon: TrendingUp },
  { href: '/reports',       label: { ar: 'تقارير المنصة',     en: 'Platform Reports'}, icon: BarChart3 },
  { href: '/settings',      label: { ar: 'الإعدادات',         en: 'Settings'       }, icon: Settings },
];

const BOTTOM_NAV = [
  { href: '/settings', label: { ar: 'الإعدادات', en: 'Settings' }, icon: Settings },
  { href: '/profile',  label: { ar: 'الملف الشخصي', en: 'Profile' }, icon: UserCircle },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, logout } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();

  const isAdmin = user?.role === 'PLATFORM_OWNER';
  const navItems = isAdmin ? ADMIN_NAV : CLINIC_NAV;
  const bottomItems = isAdmin ? BOTTOM_NAV.filter(item => item.href !== '/settings') : BOTTOM_NAV;

  const isActive = (href: string) => {
    const seg = href.split('/')[1];
    return pathname.includes(`/${seg}`);
  };

  const label = (item: typeof CLINIC_NAV[0]) =>
    isRtl ? item.label.ar : item.label.en;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-3 border-b border-gray-200 dark:border-gray-800">
        <div className={cn('flex items-center gap-2.5 w-full', collapsed && 'lg:justify-center')}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-sm">
            C
          </div>
          {!collapsed && (
            <div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white tracking-tight block">ClinicPro</span>
              {isAdmin && (
                <span className="text-[9px] text-teal-600 dark:text-teal-400 font-medium uppercase tracking-widest">Platform Admin</span>
              )}
            </div>
          )}
          <button onClick={onNavigate} aria-label="Close navigation menu" className="lg:hidden ms-auto p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300',
                collapsed && 'lg:justify-center px-2',
              )}
            >
              <Icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0 transition-transform duration-150',
                active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500',
              )} />
              {!collapsed && <span>{label(item)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-200 dark:border-gray-800 py-2 px-2 space-y-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                active
                  ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-700 dark:hover:text-gray-300',
                collapsed && 'lg:justify-center px-2',
              )}
            >
              <Icon className={cn(
                'w-[18px] h-[18px] flex-shrink-0',
                active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500',
              )} />
              {!collapsed && <span>{isRtl ? item.label.ar : item.label.en}</span>}
            </Link>
          );
        })}

        <button
          onClick={() => { logout(); onNavigate?.(); }}
          className={cn(
            'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 w-full transition-all duration-150 group',
            collapsed && 'lg:justify-center px-2',
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform text-gray-400" />
          {!collapsed && <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'hidden lg:flex absolute top-20 w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm hover:shadow transition-all duration-200 hover:scale-110 z-10',
          'inset-inline-end-[-12px]',
        )}
      >
        <ChevronRight className={cn('w-3.5 h-3.5 transition-transform duration-200', collapsed ? '' : 'rotate-180')} />
      </button>
    </>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex fixed right-0 top-0 h-screen z-30 flex-col bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800',
          collapsed ? 'w-[84px]' : 'w-[248px]',
        )}
      >
        <SidebarContent />
      </aside>

      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 inset-inline-end-0 z-40 bg-white dark:bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out shadow-xl border-s border-slate-200 dark:border-slate-800',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
          'w-[280px]',
        )}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
