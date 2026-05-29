'use client';

import { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/stores/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrint } from '@/hooks/usePrint';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogClose
} from '@/components/ui/dialog';
import {
  Receipt, RefreshCw, TrendingUp, FileText, CheckCircle2, AlertCircle,
  Clock, Plus, Search, Trash2, Calendar, ShieldCheck, Download,
  Building2, SlidersHorizontal, ChevronRight, XCircle, Info, BadgeAlert, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

import { useGovernorates } from '@/hooks/useGovernorates';
import { useCities } from '@/hooks/useCities';

// Status Style Maps
const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700',
};

const STATUS_LABEL_AR: Record<string, string> = {
  PAID: 'مسددة بالكامل',
  PENDING: 'بانتظار السداد',
  OVERDUE: 'متأخرة السداد',
  CANCELLED: 'ملغية',
};

// Plan Color Maps
const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  PRO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
};

// Subscribed Clinics List using dynamic data

export default function InvoicesPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'PLATFORM_OWNER')) {
      router.push(`/${locale}/dashboard`);
    }
  }, [user, authLoading, router, locale]);

  const qc = useQueryClient();
  const { printElement } = usePrint();

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ['subscription-invoices'],
    queryFn: () => api.get('/dashboard/subscription-invoices').then(res => res.data),
  });

  const { data: clinicsList = [] } = useQuery<any[]>({
    queryKey: ['clinics'],
    queryFn: () => api.get('/clinics').then(r => r.data),
  });

  // Loading indicator for Refresh trigger
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');
  const [selectedGov, setSelectedGov] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');

  // Load Governorates and Cities dynamically from Egypt Locations Hook API
  const { data: governorates = [] } = useGovernorates();
  const { data: cities = [] } = useCities(selectedGov !== 'ALL' ? selectedGov : null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Modal Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form states for creating SaaS invoice
  const [formClinicId, setFormClinicId] = useState('');
  const [formPlan, setFormPlan] = useState('PRO');
  const [formCycle, setFormCycle] = useState('monthly');
  const [formAmount, setFormAmount] = useState(599);
  const [formDueDate, setFormDueDate] = useState('2026-06-15');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState('PENDING');

  // Initialize formClinicId with the first clinic when the list loads
  useEffect(() => {
    if (clinicsList.length > 0 && !formClinicId) {
      setFormClinicId(String(clinicsList[0].id));
      handleFormPlanCycleChange(clinicsList[0].subscriptionPlan || 'FREE', formCycle);
    }
  }, [clinicsList]);

  // Reset selected city when governorate changes
  useEffect(() => {
    setSelectedCity('ALL');
  }, [selectedGov]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, planFilter, statusFilter, cycleFilter, selectedGov, selectedCity]);

  // Trigger loading spinner for refresh simulation
  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['subscription-invoices'] });
    setRefreshing(false);
    toast.success(isRtl ? 'تم مزامنة فواتير الاشتراكات السحابية بنجاح' : 'SaaS Invoices list synchronized successfully');
  };

  // Adjust invoice amount dynamically based on selected plan & cycle
  const handleFormPlanCycleChange = (plan: string, cycle: string) => {
    setFormPlan(plan);
    setFormCycle(cycle);
    if (plan === 'FREE') {
      setFormAmount(0);
    } else if (plan === 'BASIC') {
      setFormAmount(cycle === 'monthly' ? 299 : 2870);
    } else if (plan === 'PRO') {
      setFormAmount(cycle === 'monthly' ? 599 : 5750);
    } else if (plan === 'ENTERPRISE') {
      setFormAmount(cycle === 'monthly' ? 2499 : 23990);
    }
  };

  // Create new Platform SaaS Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClinicId) return;

    try {
      await api.post('/dashboard/subscription-invoices', {
        clinicId: Number(formClinicId),
        plan: formPlan,
        billingPeriod: formCycle,
        amount: Number(formAmount),
        status: formStatus,
        dueDate: new Date(formDueDate).toISOString(),
        notes: formNotes || (isRtl ? 'تم إصدار الفاتورة يدوياً من لوحة تحكم المنصة.' : 'Manually issued via platform console.'),
      });
      await qc.invalidateQueries({ queryKey: ['subscription-invoices'] });
      setCreateOpen(false);
      toast.success(isRtl ? 'تم تسجيل فاتورة اشتراك العيادة الجديدة وإدراجها بنجاح' : 'Subscription invoice registered successfully');
    } catch (err) {
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ الفاتورة' : 'Failed to save invoice');
    }
  };

  // Toggle invoice status directly from action
  const handleUpdateStatus = async (id: string, rawId: number, newStatus: string) => {
    try {
      await api.patch(`/dashboard/subscription-invoices/${rawId}/status`, { status: newStatus });
      await qc.invalidateQueries({ queryKey: ['subscription-invoices'] });
      toast.success(isRtl ? `تم تحديث حالة الفاتورة رقم ${id} إلى ${STATUS_LABEL_AR[newStatus] || newStatus}` : `Invoice ${id} updated to ${newStatus}`);
    } catch (err) {
      toast.error(isRtl ? 'فشل تحديث حالة الفاتورة' : 'Failed to update invoice status');
    }
  };

  // Delete invoice with strong confirmation safeguard
  const handleDeleteInvoice = async (id: string, rawId: number) => {
    const confirmation = confirm(
      isRtl 
        ? `تنبيه هام جداً: هل أنت متأكد من رغبتك في حذف الفاتورة رقم ${id} نهائياً وبشكل قطعي من سجلات اشتراكات المنصة؟`
        : `CRITICAL WARNING: Are you absolutely sure you want to permanently delete subscription invoice ${id} from the central ledger?`
    );
    if (confirmation) {
      try {
        await api.delete(`/dashboard/subscription-invoices/${rawId}`);
        await qc.invalidateQueries({ queryKey: ['subscription-invoices'] });
        toast.success(isRtl ? `تم حذف الفاتورة رقم ${id} بنجاح` : `Invoice ${id} deleted successfully`);
      } catch (err) {
        toast.error(isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete invoice');
      }
    }
  };

  // Print/Download invoice using usePrint hook
  const handleDownloadReceipt = (inv: any) => {
    // Open the detailed drawer first so there is something to print
    handleOpenDetails(inv);
    toast.success(isRtl 
      ? `جاري تجهيز إيصال الفاتورة رقم ${inv.id} للطباعة...` 
      : `Preparing receipt ${inv.id} for printing...`
    );
    
    // Wait for the modal animation and rendering to complete before printing
    setTimeout(() => {
      printElement('invoice-printable-area', `Invoice_${inv.id}`);
    }, 400);
  };

  // View detailed drawer modal
  const handleOpenDetails = (inv: any) => {
    setSelectedInvoice(inv);
    setDetailsOpen(true);
  };

  // Filter Logic
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clinicNameAr.includes(searchQuery) ||
      inv.clinicNameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.transactionId && inv.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesPlan = planFilter === 'ALL' || inv.planCode === planFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesCycle = cycleFilter === 'ALL' || inv.billingCycle === cycleFilter;

    // Governorate Filter (Match loaded API Governorate Names with Invoice metadata)
    const selectedGovObj = governorates.find((g: any) => g.id === selectedGov);
    const matchesGov = selectedGov === 'ALL' || 
      (selectedGovObj && (
        inv.governorateAr === selectedGovObj.nameAr || 
        inv.governorateEn === selectedGovObj.nameEn
      ));

    // City Filter (Match loaded API City Names with Invoice metadata)
    const selectedCityObj = cities.find((c: any) => c.id === selectedCity);
    const matchesCity = selectedCity === 'ALL' || 
      (selectedCityObj && (
        inv.cityAr === selectedCityObj.nameAr || 
        inv.cityEn === selectedCityObj.nameEn
      ));

    return matchesSearch && matchesPlan && matchesStatus && matchesCycle && matchesGov && matchesCity;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Dynamic KPI Calculation (SaaS Platform Context Only)
  const totalRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueRevenue = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const activeClinicsCount = new Set(invoices.map(inv => inv.clinicId)).size;
  

  if (authLoading || !user || user.role !== 'PLATFORM_OWNER') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── HEADER PANEL ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2 tracking-tight">
            <Receipt className="w-5.5 h-5.5 text-teal-650 shrink-0" />
            {isRtl ? 'سجل فواتير الاشتراكات السحابية' : 'SaaS Tenant Subscription Invoices'}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isRtl 
              ? 'متابعة وإصدار الفواتير الدورية لاشتراكات العيادات في باقات المنصة ولا يشمل أي تعاملات مالية داخلية للأطباء أو فواتير المرضى.' 
              : 'Monitor periodic subscription dues, plan compliance, and receipts issued to clinics (SaaS context only)'}
          </p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5 h-9 rounded-lg border-slate-200 dark:border-slate-800 bg-white font-semibold text-xs text-slate-700 dark:text-slate-300">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing && 'animate-spin'}`} />
            {isRtl ? 'تحديث البيانات' : 'Sync Invoices'}
          </Button>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger
              render={
                <Button className="bg-teal-600 hover:bg-teal-700 text-xs font-bold gap-1.5 h-9 shrink-0">
                  <Plus className="w-4 h-4" />
                  {isRtl ? 'إصدار فاتورة اشتراك جديدة' : 'Issue SaaS Invoice'}
                </Button>
              }
            />
            <DialogContent className="max-w-md max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Receipt className="w-5 h-5" />
                  {isRtl ? 'إصدار فاتورة اشتراك باقة عيادة' : 'Issue Subscription Invoice'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {isRtl ? 'سجل مطالبة مالية جديدة لاشتراك العيادة الحالي على خوادم المنصة.' : 'Create a new subscription billing claim for registered clinic tenants.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateInvoice} className="space-y-4 pt-3 text-xs font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isRtl ? 'اختر العيادة الطبية' : 'Select Subscribed Clinic'}</Label>
                  <select 
                    value={formClinicId} 
                    onChange={(e) => {
                      const cId = e.target.value;
                      setFormClinicId(cId);
                      const c = clinicsList.find(cli => String(cli.id) === cId);
                      if (c) handleFormPlanCycleChange(c.subscriptionPlan || 'FREE', formCycle);
                    }}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {clinicsList.map(c => (
                      <option key={c.id} value={c.id} className="text-black">{isRtl ? c.name : (c.nameEn || c.name)}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRtl ? 'باقة الاشتراك السحابية' : 'SaaS Tier'}</Label>
                    <select 
                      value={formPlan} 
                      onChange={(e) => handleFormPlanCycleChange(e.target.value, formCycle)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none"
                    >
                      <option value="FREE" className="text-black">FREE</option>
                      <option value="BASIC" className="text-black">BASIC</option>
                      <option value="PRO" className="text-black">PRO</option>
                      <option value="ENTERPRISE" className="text-black">ENTERPRISE</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRtl ? 'دورة الدفع' : 'Billing Cycle'}</Label>
                    <select 
                      value={formCycle} 
                      onChange={(e) => handleFormPlanCycleChange(formPlan, e.target.value)}
                      className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none"
                    >
                      <option value="monthly" className="text-black">{isRtl ? 'شهري' : 'Monthly'}</option>
                      <option value="yearly" className="text-black">{isRtl ? 'سنوي (-20%)' : 'Yearly (-20%)'}</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRtl ? 'المبلغ المستحق (ج.م)' : 'Amount Due (EGP)'}</Label>
                    <Input 
                      type="number" 
                      value={formAmount} 
                      onChange={(e) => setFormAmount(Number(e.target.value))} 
                      className="h-9" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRtl ? 'تاريخ استحقاق الفاتورة' : 'Payment Due Date'}</Label>
                    <Input 
                      type="date" 
                      value={formDueDate} 
                      onChange={(e) => setFormDueDate(e.target.value)} 
                      className="h-9" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isRtl ? 'حالة السداد الأولية' : 'Initial Payment Status'}</Label>
                  <select 
                    value={formStatus} 
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none"
                  >
                    <option value="PENDING" className="text-black">{isRtl ? 'بانتظار السداد (معلقة)' : 'Pending Invoice'}</option>
                    <option value="PAID" className="text-black">{isRtl ? 'مسددة بالكامل' : 'Paid Invoice'}</option>
                    <option value="OVERDUE" className="text-black">{isRtl ? 'متأخرة السداد' : 'Overdue Invoice'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isRtl ? 'ملاحظات وسجل تسوية الدفع' : 'Billing Notes'}</Label>
                  <textarea 
                    value={formNotes} 
                    onChange={(e) => setFormNotes(e.target.value)} 
                    rows={2} 
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none"
                    placeholder={isRtl ? 'تأكيد الحوالات البنكية أو وسيلة التحصيل الإلكتروني...' : 'e.g. Bank transfer confirmation ref...'}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3">
                  <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} type="button">{isRtl ? 'إلغاء' : 'Cancel'}</Button>
                  <Button size="sm" className="bg-teal-600 hover:bg-teal-700" type="submit">{isRtl ? 'إصدار وتسجيل' : 'Register Invoice'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── SaaS KPI SUMMARY GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: isRtl ? 'إجمالي إيرادات السحابة المحصلة' : 'Total SaaS Revenue', value: `${totalRevenue.toLocaleString()} ج.م`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100/50' },
          { label: isRtl ? 'المبالغ المعلقة قيد التحصيل' : 'Pending Subscriptions', value: `${pendingRevenue.toLocaleString()} ج.م`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100/50' },
          { label: isRtl ? 'الاشتراكات المتأخرة والإنذارات' : 'Overdue Claims', value: `${overdueRevenue.toLocaleString()} ج.م`, icon: BadgeAlert, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100/50' },
          { label: isRtl ? 'العيادات المشتركة بالمنصة' : 'Total Active Clinics', value: `${activeClinicsCount} عيادة`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100/50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-2xs hover:shadow-xs transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shrink-0 shadow-3xs">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-950 dark:text-white tracking-tight">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-normal">{s.label}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 self-start mt-0.5 shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── ADVANCED SAAS FILTER BAR ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 backdrop-blur-sm shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 pt-4 border-b border-slate-150 dark:border-slate-800/80 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <SlidersHorizontal className="w-4 h-4 text-teal-650 dark:text-teal-400 shrink-0" />
            {isRtl ? 'محرك تصفية وبحث فواتير الاشتراكات' : 'SaaS Billings Search Filters'}
          </CardTitle>
          {searchQuery || planFilter !== 'ALL' || statusFilter !== 'ALL' || cycleFilter !== 'ALL' || selectedGov !== 'ALL' || selectedCity !== 'ALL' ? (
            <Button 
              variant="ghost" 
              size="xs" 
              className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 h-7 px-2"
              onClick={() => {
                setSearchQuery('');
                setPlanFilter('ALL');
                setStatusFilter('ALL');
                setCycleFilter('ALL');
                setSelectedGov('ALL');
                setSelectedCity('ALL');
              }}
            >
              {isRtl ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Search Clinic Name or ID */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'البحث عن عيادة، فاتورة، أو معاملة' : 'Search Clinic / ID / Txn'}</Label>
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'برقم الفاتورة، اسم العيادة، مرجع السداد...' : 'Search Invoice ID, Clinic Name, Txn Ref...'}
                className="h-9 pr-9 pl-3 text-xs"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'باقة الاشتراك المفعلة' : 'SaaS Plan Tier'}</Label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 dark:bg-slate-900"
            >
              <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع باقات الاشتراك' : 'All Subscription Tiers'}</option>
              <option value="FREE" className="text-black dark:text-white">FREE</option>
              <option value="BASIC" className="text-black dark:text-white">BASIC</option>
              <option value="PRO" className="text-black dark:text-white">PRO</option>
              <option value="ENTERPRISE" className="text-black dark:text-white">ENTERPRISE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'حالة السداد والتحصيل' : 'Payment Status'}</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 dark:bg-slate-900"
            >
              <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع الحالات المالية' : 'All Billing Statuses'}</option>
              <option value="PAID" className="text-black dark:text-white">{isRtl ? 'مسددة بالكامل' : 'PAID'}</option>
              <option value="PENDING" className="text-black dark:text-white">{isRtl ? 'بانتظار السداد' : 'PENDING'}</option>
              <option value="OVERDUE" className="text-black dark:text-white">{isRtl ? 'متأخرة السداد' : 'OVERDUE'}</option>
              <option value="CANCELLED" className="text-black dark:text-white">{isRtl ? 'ملغية' : 'CANCELLED'}</option>
            </select>
          </div>

          {/* Cycle Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'دورة الفوترة السحابية' : 'Billing Frequency'}</Label>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 dark:bg-slate-900"
            >
              <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع فترات السداد' : 'All Billing Frequencies'}</option>
              <option value="monthly" className="text-black dark:text-white">{isRtl ? 'تجديد شهري دوري' : 'Monthly Cycle'}</option>
              <option value="yearly" className="text-black dark:text-white">{isRtl ? 'تجديد سنوي مجمع' : 'Yearly Cycle'}</option>
            </select>
          </div>

          {/* Governorate Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'تصفية حسب المحافظة' : 'Governorate'}</Label>
            <select
              value={selectedGov}
              onChange={(e) => setSelectedGov(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 dark:bg-slate-900"
            >
              <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع المحافظات' : 'All Governorates'}</option>
              {governorates.map((gov: any) => (
                <option key={gov.id} value={gov.id} className="text-black dark:text-white">
                  {isRtl ? gov.nameAr : gov.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* City Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'تصفية حسب المدينة' : 'City'}</Label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              disabled={selectedGov === 'ALL'}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 dark:bg-slate-900 disabled:opacity-50"
            >
              <option value="ALL" className="text-black dark:text-white">{isRtl ? 'جميع المدن' : 'All Cities'}</option>
              {cities.map((city: any) => (
                <option key={city.id} value={city.id} className="text-black dark:text-white">
                  {isRtl ? city.nameAr : city.nameEn}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── SaaS SUBSCRIPTION INVOICES DATA TABLE ── */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 rounded-xl overflow-hidden shadow-2xs">
        <CardHeader className="pb-3 border-b border-slate-150 dark:border-slate-800/80">
          <CardTitle className="text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span>{isRtl ? 'سجل الفواتير والمستندات السحابية المعتمدة' : 'SaaS Billing Claims Directory'}</span>
            <span className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-600 px-2.5 py-0.5 rounded-full font-bold">
              {filteredInvoices.length} {isRtl ? 'فاتورة مطابقة' : 'matching invoices'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b bg-slate-50/50 dark:bg-slate-950/40 text-gray-400 font-bold text-[10px] uppercase select-none">
                <th className="px-5 py-3 text-right"># {isRtl ? 'معرف الفاتورة والمعاملة' : 'ID & Txn Ref'}</th>
                <th className="px-5 py-3 text-right">{isRtl ? 'العيادة المشتركة والموقع' : 'Subscribed Clinic & Location'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'باقة الاشتراك' : 'SaaS Tier'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'دورة الدفع' : 'Cycle'}</th>
                <th className="px-5 py-3 text-right">{isRtl ? 'مبلغ الاشتراك' : 'Premium Fee'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'تاريخ الإصدار' : 'Issue Date'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'تاريخ السداد' : 'Payment Date'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'حالة السداد' : 'Payment Status'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'خيارات التحكم' : 'Operations'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850 font-semibold">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-4">
                      <div className="relative p-5 bg-teal-50 dark:bg-teal-950/20 rounded-full scale-110 mb-2">
                        <Receipt className="w-10 h-10 text-teal-600 animate-pulse" />
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 text-white border-2 border-white dark:border-slate-900"><Info className="w-3.5 h-3.5" /></span>
                      </div>
                      <h4 className="text-sm font-black text-gray-950 dark:text-white">
                        {isRtl ? 'لا توجد فواتير اشتراك مطابقة' : 'No Subscription Invoices Found'}
                      </h4>
                      <p className="text-[11px] text-gray-400 leading-relaxed font-semibold">
                        {isRtl 
                          ? 'لم نعثر على مطالبات مالية للاشتراكات السحابية مطابقة لمعايير البحث الحالية. جرب إعادة تعيين مرشحات البحث.' 
                          : 'No platform billing records matched your current query criteria. Try adjusting or resetting your filters.'}
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[10px] font-bold" 
                          onClick={() => {
                            setSearchQuery('');
                            setPlanFilter('ALL');
                            setStatusFilter('ALL');
                            setCycleFilter('ALL');
                            setSelectedGov('ALL');
                            setSelectedCity('ALL');
                          }}
                        >
                          {isRtl ? 'مسح الفلاتر' : 'Clear Filters'}
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-teal-600 hover:bg-teal-700 text-[10px] font-bold"
                          onClick={() => setCreateOpen(true)}
                        >
                          {isRtl ? 'إصدار فاتورة الآن' : 'Create Invoice Now'}
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    {/* Invoice ID & Transaction Ref */}
                    <td className="px-5 py-3.5 font-mono text-slate-500 font-bold text-right">
                      <span className="block font-bold">#{inv.id}</span>
                      <span className="text-[10px] text-teal-600 block mt-0.5 font-semibold">
                        {inv.transactionId ? inv.transactionId : (isRtl ? '— (لم يتم السداد)' : '— (No Txn)')}
                      </span>
                    </td>
                    
                    {/* Clinic Name & Location */}
                    <td className="px-5 py-3.5 text-gray-950 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-md shrink-0"><Building2 className="w-3.5 h-3.5 text-teal-650" /></div>
                        <div>
                          <span className="font-bold truncate max-w-[200px] block">{isRtl ? inv.clinicNameAr : inv.clinicNameEn}</span>
                          <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                            {inv.governorateAr ? `${isRtl ? inv.governorateAr : inv.governorateEn}، ${isRtl ? inv.cityAr : inv.cityEn}` : '—'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Plan Code */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black tracking-wider border select-none ${PLAN_COLOR[inv.planCode] || 'bg-slate-100'}`}>
                        {inv.planCode}
                      </span>
                    </td>

                    {/* Billing Cycle */}
                    <td className="px-5 py-3.5 text-center text-gray-400 font-bold">
                      {inv.billingCycle === 'monthly' ? (isRtl ? 'شهري' : 'Monthly') : (isRtl ? 'سنوي' : 'Yearly')}
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 font-mono text-teal-600 font-black text-right">
                      {inv.amount.toLocaleString()} ج.م
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3.5 text-center text-gray-500 font-mono">
                      {new Date(inv.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </td>

                    {/* Due Date */}
                    <td className="px-5 py-3.5 text-center text-rose-500 font-bold font-mono">
                      {new Date(inv.dueDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </td>

                    {/* Payment Date */}
                    <td className="px-5 py-3.5 text-center text-slate-500 font-mono">
                      {inv.paidAt ? (
                        <span className="text-emerald-600 font-bold">
                          {new Date(inv.paidAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black border tracking-wider select-none ${STATUS_STYLE[inv.status] || ''}`}>
                        {isRtl ? STATUS_LABEL_AR[inv.status] || inv.status : inv.status}
                      </span>
                    </td>

                    {/* Operations */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View detailed drawer */}
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => handleOpenDetails(inv)}
                          className="text-[10px] text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 font-black h-7 px-2 rounded-lg border border-teal-100/30"
                        >
                          {isRtl ? 'تفاصيل الفاتورة' : 'Invoice Details'}
                        </Button>

                        {/* Quick pay toggle */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            onClick={() => handleUpdateStatus(inv.id, inv.rawId, 'PAID')}
                            className="text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-black h-7 px-2 rounded-lg border border-emerald-100/30"
                          >
                            {isRtl ? 'تسجيل السداد' : 'Mark Paid'}
                          </Button>
                        )}

                        {/* Download invoice */}
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => handleDownloadReceipt(inv)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 h-7 w-7 p-0 shrink-0"
                          title={isRtl ? 'تحميل إيصال سحابي' : 'Download SaaS Invoice PDF'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        {/* Delete invoice (Safe Action) */}
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => handleDeleteInvoice(inv.id, inv.rawId)}
                          className="text-rose-450 hover:text-rose-650 h-7 w-7 p-0 shrink-0"
                          title={isRtl ? 'حذف من السجلات' : 'Remove from Console'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* SaaS-Style Pagination Controls */}
          {filteredInvoices.length > 0 && (
            <div className="px-5 py-4 border-t border-slate-150 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
              <div>
                {isRtl 
                  ? `عرض ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredInvoices.length)} من إجمالي ${filteredInvoices.length} فاتورة اشتراك`
                  : `Showing ${(currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of ${filteredInvoices.length} invoices`}
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span>{isRtl ? 'الصفوف لكل صفحة:' : 'Rows per page:'}</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-md border border-input bg-transparent px-2 py-1 text-xs focus-visible:outline-none dark:bg-slate-900"
                  >
                    <option value={5} className="text-black dark:text-white">5</option>
                    <option value={10} className="text-black dark:text-white">10</option>
                    <option value={20} className="text-black dark:text-white">20</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button 
                    variant="outline" 
                    size="xs" 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="h-8 px-2"
                  >
                    {isRtl ? 'السابق' : 'Prev'}
                  </Button>
                  <span className="px-3">
                    {isRtl ? `صفحة ${currentPage} من ${totalPages}` : `Page ${currentPage} of ${totalPages}`}
                  </span>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="h-8 px-2"
                  >
                    {isRtl ? 'التالي' : 'Next'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── HIGH-FIDELITY DETAILED INVOICE DRAWER ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0" showCloseButton={false}>
          {selectedInvoice && (
            <div id="invoice-printable-area" className={`text-xs ${isRtl ? 'text-right' : 'text-left'} max-h-[80vh] sm:max-h-[85vh] overflow-y-auto`} dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Header Visual Stripe */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white relative">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 no-print">
                    <DialogClose className="text-white hover:text-rose-100 transition-colors p-1 flex items-center justify-center cursor-pointer" title={isRtl ? 'إغلاق' : 'Close'}>
                      <XCircle className="w-5 h-5" />
                    </DialogClose>
                    <button 
                      onClick={() => printElement('invoice-printable-area', `Invoice_${selectedInvoice.id}`)}
                      className="text-white hover:text-emerald-100 transition-colors p-1 flex items-center justify-center cursor-pointer" 
                      title={isRtl ? 'طباعة الفاتورة' : 'Print Invoice'}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <Badge variant="outline" className="text-white border-white/20 bg-white/10 text-[9px] font-black tracking-wider uppercase">
                      {isRtl ? 'فاتورة اشتراك سحابي' : 'SaaS Tenant Claim'}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-white/80 font-mono font-bold">#{selectedInvoice.id}</span>
                </div>
                <div className="pt-8">
                  <h3 className="text-lg font-black tracking-tight">{isRtl ? selectedInvoice.clinicNameAr : selectedInvoice.clinicNameEn}</h3>
                  <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1 font-bold">
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    {isRtl ? 'ترخيص واستضافة السحابة الطبية لمنصة ClinicPro' : 'ClinicPro Managed Cloud Tenant Subscriptions'}
                  </p>
                </div>
              </div>

              {/* Invoice Breakdown Details */}
              <div className="p-6 space-y-5 font-semibold text-gray-700 dark:text-gray-300">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/60">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'الباقة السحابية المفعلة' : 'Subscribed Plan'}</span>
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-black border ${PLAN_COLOR[selectedInvoice.planCode]}`}>
                      {selectedInvoice.planCode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'موقع العيادة الجغرافي' : 'Clinic Location'}</span>
                    <span className="text-xs font-black text-gray-950 dark:text-white uppercase block mt-1">
                      {selectedInvoice.governorateAr ? `${isRtl ? selectedInvoice.governorateAr : selectedInvoice.governorateEn}، ${isRtl ? selectedInvoice.cityAr : selectedInvoice.cityEn}` : '—'}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-gray-200/50 dark:border-gray-850/50 col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'تاريخ إصدار الفاتورة' : 'Date Issued'}</span>
                      <span className="text-[10.5px] font-bold text-gray-800 dark:text-gray-200 font-mono">
                        {new Date(selectedInvoice.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'تاريخ الاستحقاق النهائي' : 'Payment Due Date'}</span>
                      <span className="text-[10.5px] font-bold text-rose-500 font-mono font-black">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-gray-200/50 dark:border-gray-850/50 col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'رقم المعاملة البنكية' : 'Payment Txn Ref'}</span>
                      <span className="text-[10.5px] font-bold text-teal-600 font-mono">
                        {selectedInvoice.transactionId ? selectedInvoice.transactionId : (isRtl ? '— (لم يسدد بعد)' : '— (Unpaid)')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'تاريخ إتمام الدفع والتحصيل' : 'Payment Captured At'}</span>
                      <span className="text-[10.5px] font-bold text-emerald-600 font-mono">
                        {selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : (isRtl ? '— (قيد الانتظار)' : '—')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtotal table calculation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{isRtl ? 'تفصيل بنود الفوترة والرسوم السحابية' : 'Billing Items Breakdown'}</h4>
                  <div className="border border-gray-150/60 dark:border-gray-850/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/30">
                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-slate-900/20 border-b border-gray-100 dark:border-gray-850">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {isRtl ? `اشتراك الباقة السحابية ${selectedInvoice.planCode}` : `${selectedInvoice.planCode} Subscription Fee`}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                          {selectedInvoice.billingCycle === 'monthly' ? (isRtl ? 'ترخيص شهري شامل للمستخدمين وقاعدة البيانات' : 'ترخيص سنوي شامل شامل خفض السعر') : 'SaaS Cloud Hosting License'}
                        </p>
                      </div>
                      <span className="font-mono font-black text-gray-900 dark:text-white">{selectedInvoice.amount.toLocaleString()} ج.م</span>
                    </div>

                    <div className="p-3.5 space-y-2 text-[11px]">
                      <div className="flex items-center justify-between text-gray-400">
                        <span>{isRtl ? 'المجموع الفرعي' : 'Subtotal'}</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{selectedInvoice.amount.toLocaleString()} ج.م</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>{isRtl ? 'ضريبة القيمة المضافة (٠٪)' : 'Value Added Tax (0%)'}</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">0 ج.م</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>{isRtl ? 'الخصومات والعروض السحابية' : 'Applied Platform Discount'}</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">0 ج.م</span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex items-center justify-between text-teal-650 text-xs font-black">
                        <span>{isRtl ? 'إجمالي مبلغ الفاتورة السحابية' : 'Total Amount Due'}</span>
                        <span className="font-mono font-black text-lg">{selectedInvoice.amount.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit trail / Notes section */}
                {selectedInvoice.notes && (
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-100/40 dark:border-amber-900/20 text-[10.5px]">
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block mb-1">
                      {isRtl ? 'ملاحظات وتدقيق السداد السحابي' : 'Administrator Audit & Transaction Notes'}
                    </span>
                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-semibold">{selectedInvoice.notes}</p>
                  </div>
                )}

                {/* Payment timestamp */}
                {selectedInvoice.paidAt && (
                  <div className="flex items-center gap-2 bg-emerald-50/50 dark:bg-emerald-950/10 p-3.5 rounded-2xl border border-emerald-250/20 dark:border-emerald-900/20 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                      {isRtl 
                        ? `تم تحصيل الاشتراك بنجاح وقيد المعاملة برقم ${selectedInvoice.transactionId} بتاريخ ${new Date(selectedInvoice.paidAt).toLocaleDateString('ar-EG')}` 
                        : `Successfully captured txn ${selectedInvoice.transactionId} on ${new Date(selectedInvoice.paidAt).toLocaleDateString('en-US')}`}
                    </span>
                  </div>
                )}

                {/* Action buttons inside drawer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-150 dark:border-slate-800/80">
                  <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)}>{isRtl ? 'إغلاق النافذة' : 'Close'}</Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleDownloadReceipt(selectedInvoice)}
                    className="bg-teal-600 hover:bg-teal-700 text-xs font-bold gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    {isRtl ? 'تحميل الفاتورة PDF' : 'Download Receipt'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}