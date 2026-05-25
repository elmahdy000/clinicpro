'use client';

import { useQuery } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Receipt, Search, Calendar, CheckCircle2, Clock, XCircle, AlertTriangle,
  ArrowUpRight, Download, Filter, FileText, Landmark, Eye
} from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function InvoicesPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: clinics, isLoading } = useQuery<any[]>({
    queryKey: ['admin-invoices-clinics'],
    queryFn: async () => {
      const { data } = await api.get('/clinics');
      return data;
    },
  });

  // Mock platform invoices based on clinic subscription plan prices to represent actual platform revenue records
  const invoices = clinics ? clinics.flatMap((clinic, index) => {
    const basePrices: Record<string, number> = { FREE: 0, BASIC: 499, PRO: 999, ENTERPRISE: 2499 };
    const planPrice = basePrices[clinic.subscriptionPlan] || 0;
    
    // Skip free plans to show paid invoices
    if (planPrice === 0) return [];

    // Create 2 mock historical invoices for each active/suspended/trial clinic
    return [
      {
        id: `INV-2026-${(100 + index * 2).toString()}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        plan: clinic.subscriptionPlan,
        amount: planPrice,
        status: clinic.subscriptionStatus === 'SUSPENDED' ? 'OVERDUE' : 'PAID',
        issueDate: new Date(new Date(clinic.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date(clinic.createdAt).getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: `INV-2026-${(100 + index * 2 + 1).toString()}`,
        clinicId: clinic.id,
        clinicName: clinic.name,
        plan: clinic.subscriptionPlan,
        amount: planPrice,
        status: clinic.subscriptionStatus === 'ACTIVE' ? 'PAID' : 'PENDING',
        issueDate: new Date(new Date(clinic.createdAt).getTime() + 35 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(new Date(clinic.createdAt).getTime() + 65 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }) : [];

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.clinicName.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? inv.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const totalCollected = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border border-green-200/50">
            <CheckCircle2 className="w-3 h-3" />
            {isRtl ? 'مدفوعة' : 'Paid'}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/50">
            <Clock className="w-3 h-3 animate-pulse" />
            {isRtl ? 'معلقة' : 'Pending'}
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200/50">
            <XCircle className="w-3 h-3" />
            {isRtl ? 'متأخرة' : 'Overdue'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            {isRtl ? 'إدارة فواتير الاشتراكات' : 'Invoice & Revenue Management'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'متابعة المدفوعات، إصدار فواتير العيادات، وإحصائيات إيرادات الـ SaaS' : 'Track SaaS billing transactions, issue client invoices, and audit platform revenues'}
          </p>
        </div>
      </div>

      {/* Revenue Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-green-50/20 to-teal-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'الإيرادات المحصلة' : 'Total Revenue Collected'}</p>
            <div className="text-2xl font-extrabold text-green-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalCollected.toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-amber-50/20 to-yellow-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'فواتير في انتظار الدفع' : 'Total Pending Collection'}</p>
            <div className="text-2xl font-extrabold text-amber-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalPending.toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-red-50/20 to-rose-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'مدفوعات متأخرة' : 'Total Overdue Receivables'}</p>
            <div className="text-2xl font-extrabold text-red-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${totalOverdue.toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? 'ابحث برقم الفاتورة أو العيادة...' : 'Search invoice ID or clinic...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">{isRtl ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="PAID">{isRtl ? 'مدفوعة' : 'Paid'}</option>
              <option value="PENDING">{isRtl ? 'معلقة' : 'Pending'}</option>
              <option value="OVERDUE">{isRtl ? 'متأخرة' : 'Overdue'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Table */}
      <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Receipt className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm font-semibold">{isRtl ? 'لا توجد فواتير مطابقة للبحث' : 'No invoices matching filters'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'رقم الفاتورة' : 'Invoice ID'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'العيادة' : 'Clinic'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'الخطة' : 'Subscription'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'المبلغ' : 'Amount'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'حالة الدفع' : 'Payment Status'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-center">{isRtl ? 'الإجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors group">
                      <td className="px-5 py-3 text-xs font-bold text-teal-600 font-mono">#{inv.id}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                        <Link href={`/${locale}/clinics/${inv.clinicId}`} className="hover:underline">
                          {inv.clinicName}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-semibold">{inv.plan}</td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white font-mono">{inv.amount.toLocaleString()} ج.م</td>
                      <td className="px-5 py-3">{getStatusBadge(inv.status)}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 inline-block mx-1 text-gray-400" />
                        {formatDate(inv.dueDate, locale)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] gap-1 hover:border-teal-500 hover:text-teal-600">
                            <Download className="w-3 h-3" />
                            {isRtl ? 'تحميل' : 'PDF'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] gap-1 hover:bg-teal-50 hover:text-teal-600">
                            <Eye className="w-3 h-3" />
                            {isRtl ? 'معاينة' : 'View'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
