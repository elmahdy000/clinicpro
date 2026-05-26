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
  ArrowUpRight, Download, Filter, FileText, Eye, User, RefreshCw
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';

export default function InvoicesPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: invoicesData, isLoading, refetch } = useQuery<any>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data } = await api.get('/billing', { params: { limit: 100 } });
      return data;
    },
  });

  const { data: summary } = useQuery<any>({
    queryKey: ['invoices-summary'],
    queryFn: async () => {
      const { data } = await api.get('/billing/summary');
      return data;
    },
  });

  const invoices = useMemo(() => {
    const raw = invoicesData?.data || [];
    return raw.filter((inv: any) => {
      const matchesSearch = !search ||
        inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
        `${inv.patient?.firstName || ''} ${inv.patient?.lastName || ''}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter ? inv.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
  }, [invoicesData, search, statusFilter]);

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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-right" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600" />
            {isRtl ? 'الفواتير' : 'Invoices'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'إدارة فواتير المرضى ومتابعة المدفوعات' : 'Manage patient invoices and track payments'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          {isRtl ? 'تحديث' : 'Refresh'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-green-50/20 to-teal-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'الإيرادات المحصلة' : 'Total Revenue Collected'}</p>
            <div className="text-2xl font-extrabold text-green-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${(summary?.totalCollected || 0).toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-amber-50/20 to-yellow-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'فواتير في انتظار الدفع' : 'Total Pending Collection'}</p>
            <div className="text-2xl font-extrabold text-amber-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${(summary?.totalPending || 0).toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm bg-gradient-to-br from-red-50/20 to-rose-50/20">
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 font-semibold">{isRtl ? 'مدفوعات متأخرة' : 'Total Overdue Receivables'}</p>
            <div className="text-2xl font-extrabold text-red-600 mt-1.5 font-mono">
              {isLoading ? <Skeleton className="h-8 w-24" /> : `${(summary?.totalOverdue || 0).toLocaleString()} ج.م`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={isRtl ? 'ابحث برقم الفاتورة أو اسم المريض...' : 'Search invoice ID or patient...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full h-9 rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 ${isRtl ? 'pr-9 pl-3 text-right' : 'pl-9 pr-3 text-left'}`}
            />
          </div>
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
        </CardContent>
      </Card>

      <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Receipt className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm font-semibold">{isRtl ? 'لا توجد فواتير' : 'No invoices found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-right">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'رقم الفاتورة' : 'Invoice'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'المريض' : 'Patient'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'المبلغ' : 'Amount'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'حالة الدفع' : 'Status'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">{isRtl ? 'التاريخ' : 'Date'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase text-center">{isRtl ? 'الإجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors group">
                      <td className="px-5 py-3 text-xs font-bold text-teal-600 font-mono">#{inv.invoiceNumber}</td>
                      <td className="px-5 py-3">
                        <Link href={`/${locale}/patients/${inv.patient?.id}`} className="flex items-center gap-2 hover:underline">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {inv.patient?.firstName} {inv.patient?.lastName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-sm font-bold text-gray-900 dark:text-white font-mono">{inv.total.toLocaleString()} ج.م</td>
                      <td className="px-5 py-3">{getStatusBadge(inv.status)}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        <Calendar className="w-3.5 h-3.5 inline-block mx-1 text-gray-400" />
                        {formatDate(inv.createdAt, locale)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <Link href={`/${locale}/invoices`}>
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[10px] gap-1 hover:bg-teal-50 hover:text-teal-600">
                              <Eye className="w-3 h-3" />
                              {isRtl ? 'عرض' : 'View'}
                            </Button>
                          </Link>
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