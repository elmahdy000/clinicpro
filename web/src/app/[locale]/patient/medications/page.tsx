'use client';

import { useMemo, useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Pill,
  CalendarDays,
  User,
  Building2,
  Search,
  ClipboardList,
  Clock,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { key: 'active', label: 'الحالية' },
  { key: 'recent', label: 'آخر 30 يوم' },
  { key: 'all', label: 'كل الأدوية' },
  { key: 'ended', label: 'منتهية' },
];

export default function PatientMedicationsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const basePath = `/${locale}/patient`;
  const [activeTab, setActiveTab] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: medsResponse, isLoading } = useQuery({
    queryKey: ['patient-medicines', activeTab],
    queryFn: () => {
      const period = activeTab === 'recent' ? '30days' : activeTab === 'all' ? 'all' : undefined;
      const status = activeTab === 'active' ? 'ACTIVE' : activeTab === 'ended' ? 'ENDED' : undefined;
      const params = new URLSearchParams();
      if (period) params.set('period', period);
      if (status) params.set('status', status);
      params.set('limit', '100');
      return api.get(`/patient/medicines?${params.toString()}`).then((r) => r.data);
    },
  });

  const medicines: any[] = medsResponse?.data || [];

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return medicines;
    const q = searchQuery.toLowerCase();
    return medicines.filter(
      (m: any) =>
        m.medicineName.toLowerCase().includes(q) ||
        (m.activeIngredient && m.activeIngredient.toLowerCase().includes(q)),
    );
  }, [medicines, searchQuery]);

  const counts = useMemo(() => {
    const allMeds = medsResponse?.data || [];
    const active = allMeds.filter((m: any) => m.status === 'ACTIVE').length;
    const recent = allMeds.filter((m: any) => {
      const days = Math.floor((Date.now() - new Date(m.prescriptionDate).getTime()) / (1000 * 60 * 60 * 24));
      return days <= 30;
    }).length;
    const uniqueRx = new Set(allMeds.map((m: any) => m.prescriptionId)).size;
    const lastRx = allMeds.length > 0
      ? allMeds.sort((a: any, b: any) => new Date(b.prescriptionDate).getTime() - new Date(a.prescriptionDate).getTime())[0]
        .prescriptionDate
      : null;
    return { active, recent, lastRx, totalRx: uniqueRx };
  }, [medsResponse]);

  const summaryCards = [
    {
      title: 'الأدوية الحالية',
      value: counts.active,
      subtitle: counts.active > 0 ? 'دواء نشط' : 'لا توجد',
      icon: Pill,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'آخر 30 يوم',
      value: counts.recent,
      subtitle: counts.recent > 0 ? 'دواء موصوف' : 'لا توجد',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'آخر روشتة',
      value: counts.lastRx ? formatDate(counts.lastRx, locale) : '—',
      subtitle: counts.lastRx ? 'تاريخ آخر روشتة' : 'لا توجد',
      icon: CalendarDays,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'عدد الروشتات',
      value: counts.totalRx,
      subtitle: counts.totalRx > 0 ? 'روشتة مسجلة' : 'لا توجد',
      icon: ClipboardList,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h1 className="text-xl font-bold text-slate-900">أدويتي</h1>
        <p className="text-sm text-slate-500 mt-0.5">الأدوية الموصوفة لك خلال آخر 30 يومًا</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-4 flex flex-col justify-between min-h-[100px]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xl font-bold text-slate-900">{card.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-1.5 text-xs font-medium rounded-lg transition-all',
                activeTab === tab.key
                  ? 'bg-white text-teal-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث باسم الدواء أو المادة الفعالة"
            className="h-9 pr-9 text-xs rounded-xl border-slate-200"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((med: any) => (
            <Card key={med.id} className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <Pill className="w-5 h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-sm text-slate-900">
                          {med.medicineName}
                          {med.activeIngredient && (
                            <span className="text-xs text-slate-400 font-normal me-1">
                              ({med.activeIngredient})
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0',
                          med.status === 'ACTIVE'
                            ? 'bg-teal-50 text-teal-700'
                            : med.status === 'PAST'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {med.status === 'ACTIVE'
                          ? 'حالي'
                          : med.status === 'PAST'
                            ? 'سابق'
                            : 'منتهي'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      {med.dosage && <span>الجرعة: {med.dosage}</span>}
                      {med.frequency && <span>التكرار: {med.frequency}</span>}
                      {med.duration && <span>المدة: {med.duration}</span>}
                    </div>
                    {med.instructions && (
                      <p className="text-xs text-slate-500">تعليمات: {med.instructions}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {med.doctorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {med.clinicName}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatDate(med.prescriptionDate, locale)}
                      </span>
                    </div>
                    <Link href={`${basePath}/prescriptions`}>
                      <Button variant="outline" size="sm" className="text-xs h-7 mt-1">عرض الروشتة</Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Pill className="w-6 h-6 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">لا توجد أدوية موصوفة حاليًا</p>
            <p className="text-xs text-slate-500 mt-1">
              ستظهر هنا الأدوية التي يضيفها الطبيب في الروشتات الخاصة بك.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              راجع صفحة الروشتات لمتابعة أي روشتة جديدة عند إضافتها من العيادة.
            </p>
            <Link href={`${basePath}/prescriptions`}>
              <Button variant="outline" size="sm" className="mt-4 text-xs">عرض الروشتات</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
