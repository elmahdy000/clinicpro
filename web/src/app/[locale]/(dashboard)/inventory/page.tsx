'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBox } from '@/components/common/SearchBox';
import { PremiumModal } from '@/components/ui/PremiumModal';

import {
  Package, Plus, AlertTriangle, Clock,
  TrendingDown, Pill, Calendar,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function InventoryPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medSearch, setMedSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const { data: inventory, isLoading } = useQuery<any>({
    queryKey: ['inventory', search, showLowStock],
    queryFn: () => api.get('/inventory', { params: { search, lowStock: showLowStock ? 'true' : undefined, limit: 100 } }).then((r) => r.data),
  });

  const { data: meds } = useQuery({
    queryKey: ['medications-search-inv', medSearch],
    queryFn: () => api.get('/medications', { params: { q: medSearch, limit: 10 } }).then((r) => r.data),
    enabled: medSearch.length > 1,
  });

  const { data: lowStockItems } = useQuery({
    queryKey: ['inventory-low-stock'],
    queryFn: () => api.get('/inventory/low-stock').then((r) => r.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => api.post('/inventory', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      toast.success(isRtl ? 'تم إضافة المخزون' : 'Stock added');
      setAddOpen(false);
      setMedName('');
      setMedSearch('');
      setQuantity('');
      setBatchNumber('');
      setExpiryDate('');
    },
    onError: (e) => console.error(e),
  });

  const restockMutation = useMutation({
    mutationFn: ({ id, qty }: { id: number; qty: number }) => api.put(`/inventory/${id}/add-stock`, { quantity: qty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-low-stock'] });
      toast.success(isRtl ? 'تم إعادة التخزين' : 'Restocked');
    },
  });

  const items = inventory?.data || [];
  const totalItems = items.length;
  const lowCount = lowStockItems?.length || 0;
  const expired = items.filter((i: any) => i.isExpired).length;

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            {isRtl ? 'المخزون الدوائي' : 'Medication Inventory'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isRtl ? 'إدارة مخزون الأدوية وتتبع الكميات وتواريخ الصلاحية' : 'Manage medication stock, track quantities and expiry dates'}
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700 gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            {isRtl ? 'إضافة مخزون' : 'Add Stock'}
          </Button>

          <PremiumModal
            open={addOpen}
            onClose={() => setAddOpen(false)}
            title={isRtl ? 'إضافة مخزون جديد' : 'Add New Stock'}
            description={isRtl ? 'أضف دواءً جديداً إلى مخزون عيادتك' : 'Add a new medication to your clinic inventory'}
            icon={<Package className="w-5 h-5 text-white" />}
            headerColor="teal"
            size="sm"
            footer={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddOpen(false)}
                  className="rounded-xl border-slate-200 dark:border-slate-700">
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  className="flex-1 rounded-xl bg-teal-600 hover:bg-teal-700 text-white"
                  onClick={() => {
                    if (!medName || !quantity) { toast.error(isRtl ? 'اختر دواء وأدخل الكمية' : 'Select medication and enter quantity'); return; }
                    const med = meds?.find((m: any) => m.name === medName);
                    if (!med) { toast.error(isRtl ? 'اختر دواء من القائمة' : 'Select a medication from the list'); return; }
                    addMutation.mutate({ medicationId: med.id, quantityOnHand: parseInt(quantity, 10), batchNumber, expiryDate: expiryDate || undefined });
                  }}
                  disabled={addMutation.isPending}
                >
                  {isRtl ? 'حفظ المخزون' : 'Save Stock'}
                </Button>
              </div>
            }
          >
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isRtl ? 'الدواء' : 'Medication'}</Label>
                <Input
                  value={medSearch}
                  onChange={(e) => setMedSearch(e.target.value)}
                  placeholder={isRtl ? 'ابحث عن دواء...' : 'Search medication...'}
                  className="rounded-xl border-slate-200 dark:border-slate-700 h-10"
                />
                {medSearch && meds && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 max-h-40 overflow-y-auto">
                    {meds.map((m: any) => (
                      <button key={m.id} type="button"
                        onClick={() => { setMedName(m.name); setMedSearch(''); }}
                        className={`w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors ${medName === m.name ? 'bg-teal-50 font-semibold text-teal-700' : ''}`}>
                        {m.name}
                        {m.activeIngredient && <span className="text-xs text-slate-400 mr-2">({m.activeIngredient})</span>}
                      </button>
                    ))}
                  </div>
                )}
                {medName && (
                  <p className="text-xs text-teal-700 bg-teal-50 border border-teal-200 rounded-lg px-3 py-1.5 font-medium">
                    ✓ {medName}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isRtl ? 'الكمية' : 'Quantity'}</Label>
                  <Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0"
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isRtl ? 'رقم التشغيلة' : 'Batch #'}</Label>
                  <Input value={batchNumber} onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder={isRtl ? 'اختياري' : 'Optional'}
                    className="rounded-xl border-slate-200 dark:border-slate-700 h-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{isRtl ? 'تاريخ الصلاحية' : 'Expiry Date'}</Label>
                <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)}
                  className="rounded-xl border-slate-200 dark:border-slate-700 h-10" />
              </div>
            </div>
          </PremiumModal>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي الأصناف' : 'Total Items', value: totalItems, icon: Package, cls: 'bg-teal-50 text-teal-700' },
          { label: isRtl ? 'منخفض المخزون' : 'Low Stock', value: lowCount, icon: AlertTriangle, cls: 'bg-amber-50 text-amber-700' },
          { label: isRtl ? 'منتهي الصلاحية' : 'Expired', value: expired, icon: Clock, cls: 'bg-red-50 text-red-700' },
          { label: isRtl ? 'المجموع الكلي' : 'Total Qty', value: items.reduce((s: number, i: any) => s + i.quantityOnHand, 0), icon: TrendingDown, cls: 'bg-blue-50 text-blue-700' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.cls}`}><Icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-gray-400">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{isLoading ? <Skeleton className="h-6 w-12" /> : s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <SearchBox value={search} onChange={setSearch} placeholder={isRtl ? 'ابحث باسم الدواء...' : 'Search by medication name...'} />
          </div>
          <Button
            variant={showLowStock ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowLowStock(!showLowStock)}
            className={`h-9 gap-1.5 text-xs ${showLowStock ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {isRtl ? 'منخفض المخزون فقط' : 'Low Stock Only'}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200/80 dark:border-gray-800/80 overflow-hidden shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Package className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-sm font-semibold">{isRtl ? 'لا يوجد مخزون دوائي' : 'No inventory items'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-right">
                <thead>
                  <tr className="border-b bg-gray-50/80 dark:bg-gray-900/60">
                    <th className="px-5 py-3 text-xs font-bold text-gray-500">{isRtl ? 'الدواء' : 'Medication'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500">{isRtl ? 'الكمية' : 'Qty'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500">{isRtl ? 'تشغيلة' : 'Batch'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500">{isRtl ? 'صلاحية' : 'Expiry'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500">{isRtl ? 'الموقع' : 'Location'}</th>
                    <th className="px-5 py-3 text-xs font-bold text-gray-500 text-center">{isRtl ? 'الإجراء' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {items.map((item: any) => (
                    <tr key={item.id} className={`hover:bg-teal-50/20 dark:hover:bg-teal-950/10 transition-colors ${item.isExpired ? 'bg-red-50/30 dark:bg-red-950/10' : item.isLowStock ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Pill className="w-4 h-4 text-teal-600" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.medication?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-sm font-bold font-mono ${item.isExpired ? 'text-red-600' : item.isLowStock ? 'text-amber-600' : 'text-green-600'}`}>
                          {item.quantityOnHand}
                        </span>
                        {item.isLowStock && <Badge variant="outline" className="mr-2 text-[10px] border-amber-200 text-amber-700">{isRtl ? 'منخفض' : 'Low'}</Badge>}
                        {item.isExpired && <Badge variant="outline" className="mr-2 text-[10px] border-red-200 text-red-700">{isRtl ? 'منتهي' : 'Expired'}</Badge>}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500 font-mono">{item.batchNumber || '-'}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {item.expiryDate ? (
                          <span className={`inline-flex items-center gap-1 ${item.isExpired ? 'text-red-600' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {new Date(item.expiryDate).toLocaleDateString('en-CA')}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{item.location || '-'}</td>
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1"
                            onClick={() => {
                              const qty = prompt(isRtl ? 'الكمية المضافة:' : 'Quantity to add:');
                              if (!qty) return;
                              const parsedQty = parseInt(qty, 10);
                              if (!isNaN(parsedQty) && parsedQty > 0) restockMutation.mutate({ id: item.id, qty: parsedQty });
                            }}
                          >
                            {isRtl ? 'إضافة' : 'Restock'}
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