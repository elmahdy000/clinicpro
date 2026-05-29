'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Users, CalendarRange, Stethoscope, Pill, FileText,
  ClipboardList, BarChart3, Settings, UserCircle, LogOut, ChevronRight, X,
  Building2, ScrollText, CreditCard, Receipt, TrendingUp, UserCog, Package
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useSidebar } from '@/stores/sidebar';

// ── Clinic staff navigation ──────────────────────────────────────────────────
const CLINIC_NAV = [
  { href: '/dashboard', label: { ar: 'الرئيسية', en: 'Dashboard' }, icon: LayoutDashboard, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { href: '/queue', label: { ar: 'الانتظار', en: 'Queue' }, icon: ClipboardList, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
  { href: '/patients', label: { ar: 'المرضى', en: 'Patients' }, icon: Users, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { href: '/appointments', label: { ar: 'المواعيد', en: 'Appointments' }, icon: CalendarRange, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'RECEPTIONIST', 'NURSE'] },
  { href: '/visits/new', label: { ar: 'كشف جديد', en: 'New Consultation' }, icon: Stethoscope, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR'] },
  { href: '/my-medications', label: { ar: 'أدويتي الخاصة', en: 'My Medications' }, icon: Pill, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR'] },
  { href: '/prescriptions', label: { ar: 'الروشتات', en: 'Prescriptions' }, icon: ScrollText, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR'] },
  { href: '/inventory', label: { ar: 'المخزون الدوائي', en: 'Inventory' }, icon: Package, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { href: '/files', label: { ar: 'الملفات', en: 'Files' }, icon: FileText, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'] },
  { href: '/staff', label: { ar: 'الطاقم الطبي', en: 'Medical Staff' }, icon: UserCog, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR'] },
  { href: '/reports', label: { ar: 'التقارير', en: 'Reports' }, icon: BarChart3, roles: ['CLINIC_ADMIN', 'ADMIN', 'DOCTOR'] },
];

// ── Platform Owner navigation ─────────────────────────────────────────────────
const ADMIN_NAV = [
  { href: '/dashboard', label: { ar: 'لوحة التحكم', en: 'Dashboard' }, icon: LayoutDashboard },
  { href: '/clinics', label: { ar: 'العيادات', en: 'Clinics' }, icon: Building2 },
  { href: '/subscriptions', label: { ar: 'الاشتراكات', en: 'Subscriptions' }, icon: CreditCard },
  { href: '/invoices', label: { ar: 'الفواتير', en: 'Invoices' }, icon: Receipt },
  { href: '/medications', label: { ar: 'سجل الأدوية العام', en: 'Drug Registry' }, icon: Pill },
  { href: '/pharma-insights', label: { ar: 'تحليلات سوق الأدوية', en: 'Pharma Insights' }, icon: TrendingUp },
  { href: '/reports', label: { ar: 'تقارير المنصة', en: 'Platform Reports' }, icon: BarChart3 },
  { href: '/settings', label: { ar: 'الإعدادات', en: 'Settings' }, icon: Settings },
];

const BOTTOM_NAV = [
  { href: '/settings', label: { ar: 'الإعدادات', en: 'Settings' }, icon: Settings },
  { href: '/profile', label: { ar: 'الملف الشخصي', en: 'Profile' }, icon: UserCircle },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, logout } = useAuth();
  const { collapsed, setCollapsed } = useSidebar();

  const isAdmin = user?.role === 'PLATFORM_OWNER';
  const userRole = user?.role || '';
  const navItems = isAdmin
    ? ADMIN_NAV
    : CLINIC_NAV.filter(item => item.roles.includes(userRole));
  const bottomItems = isAdmin ? BOTTOM_NAV.filter(item => item.href !== '/settings') : BOTTOM_NAV;

  const isActive = (href: string) => {
    const seg = href.split('/')[1];
    return pathname.includes(`/${seg}`);
  };

  const label = (item: { label: { ar: string; en: string } }) =>
    isRtl ? item.label.ar : item.label.en;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-14 px-3 border-b border-gray-150 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 backdrop-blur-md">
        <div className={cn('flex items-center gap-2 w-full', collapsed && 'lg:justify-center')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-sm">
            C
          </div>
          {!collapsed && (
            <div>
              <span className="font-bold text-xs text-gray-900 dark:text-white tracking-tight block">ClinicPro</span>
              {isAdmin && (
                <span className="text-[8px] text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-wider block -mt-0.5">Platform Admin</span>
              )}
            </div>
          )}
          <button onClick={onNavigate} aria-label="Close navigation menu" className="lg:hidden ms-auto p-1 text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll py-2 px-1.5 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 relative group/item',
                active
                  ? 'bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 shadow-3xs'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/40 hover:text-gray-700 dark:hover:text-gray-300',
                collapsed && 'lg:justify-center px-2',
              )}
            >
              {active && (
                <span className={cn(
                  'absolute top-1 bottom-1 w-1 bg-teal-600 dark:bg-teal-400 rounded-full',
                  isRtl ? 'right-0' : 'left-0'
                )} />
              )}
              <Icon className={cn(
                'w-4.5 h-4.5 flex-shrink-0 transition-all duration-150',
                active ? 'text-teal-600 dark:text-teal-400 scale-105' : 'text-gray-400 dark:text-gray-500 group-hover/item:scale-105',
              )} />
              {!collapsed && <span>{label(item)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-150 dark:border-gray-800 py-1.5 px-1.5 space-y-0.5">
        {bottomItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 relative',
                active
                  ? 'bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/40 hover:text-gray-700 dark:hover:text-gray-300',
                collapsed && 'lg:justify-center px-2',
              )}
            >
              {active && (
                <span className={cn(
                  'absolute top-1 bottom-1 w-1 bg-teal-600 dark:bg-teal-400 rounded-full',
                  isRtl ? 'right-0' : 'left-0'
                )} />
              )}
              <Icon className={cn(
                'w-4.5 h-4.5 flex-shrink-0',
                active ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-gray-500',
              )} />
              {!collapsed && <span>{isRtl ? item.label.ar : item.label.en}</span>}
            </Link>
          );
        })}

        <button
          onClick={() => { logout(); onNavigate?.(); }}
          className={cn(
            'flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-gray-500 dark:text-gray-400 hover:bg-red-50/60 dark:hover:bg-red-950/20 hover:text-red-650 dark:hover:text-red-400 w-full transition-all duration-150 group',
            collapsed && 'lg:justify-center px-2',
          )}
        >
          <LogOut className="w-4.5 h-4.5 flex-shrink-0 group-hover:scale-105 transition-transform text-gray-400 group-hover:text-red-500" />
          {!collapsed && <span>{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'hidden lg:flex absolute top-18 w-5 h-5 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 items-center justify-center text-gray-400 hover:text-gray-600 shadow-3xs hover:shadow-2xs transition-all duration-200 hover:scale-110 z-10',
          isRtl ? 'left-[-10px]' : 'right-[-10px]',
        )}
      >
        <ChevronRight className={cn(
          'w-3 h-3 transition-transform duration-200',
          isRtl
            ? (collapsed ? 'rotate-180' : '')
            : (collapsed ? '' : 'rotate-180')
        )} />
      </button>
    </>
  );
}

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen } = useSidebar();
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <>
      <aside
        className={cn(
          'hidden lg:flex fixed top-0 h-screen z-30 flex-col bg-white dark:bg-gray-950 transition-all duration-300 ease-in-out',
          isRtl
            ? 'right-0 border-l border-slate-150 dark:border-slate-850'
            : 'left-0 border-r border-slate-150 dark:border-slate-850',
          collapsed ? 'w-[68px]' : 'w-[220px]',
        )}
      >
        <SidebarContent />
      </aside>

      <aside
        className={cn(
          'lg:hidden fixed inset-y-0 z-40 bg-white dark:bg-gray-950 flex flex-col transition-transform duration-300 ease-in-out shadow-xl',
          isRtl
            ? 'right-0 border-r border-slate-150 dark:border-slate-850'
            : 'left-0 border-l border-slate-150 dark:border-slate-850',
          isRtl
            ? (mobileOpen ? 'translate-x-0' : 'translate-x-full')
            : (mobileOpen ? 'translate-x-0' : '-translate-x-full'),
          'w-[250px]',
        )}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>
    </>
  );
}
