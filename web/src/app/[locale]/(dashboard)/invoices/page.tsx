'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription
} from '@/components/ui/dialog';
import {
  Receipt, RefreshCw, TrendingUp, FileText, CheckCircle2, AlertCircle,
  Clock, Plus, Search, Trash2, Calendar, ShieldCheck, Download,
  Building2, SlidersHorizontal, ChevronRight, XCircle, Info, BadgeAlert, ArrowUpRight
} from 'lucide-react';
import { toast } from 'sonner';

// Status Style Maps
const STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-250 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900',
  OVERDUE: 'bg-rose-50 text-rose-700 border-rose-250 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:border-slate-700',
};

// Plan Color Maps
const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300',
  BASIC: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300',
  PRO: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300',
  ENTERPRISE: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300',
};

// Subscribed Clinics List
const PREDEFINED_CLINICS = [
  { id: '1', nameAr: 'عيادة د. المهدي التخصصية', nameEn: 'Dr. Elmahdy Specialty Clinic', plan: 'PRO', locationAr: 'مدينة نصر، القاهرة', locationEn: 'Nasr City, Cairo' },
  { id: '2', nameAr: 'عيادة الشروق لطب العيون', nameEn: 'Al-Shorouk Eye Clinic', plan: 'BASIC', locationAr: 'مصر الجديدة، القاهرة', locationEn: 'Heliopolis, Cairo' },
  { id: '3', nameAr: 'مركز الحياة الطبي المتكامل', nameEn: 'Al-Hayat Integrated Medical Center', plan: 'ENTERPRISE', locationAr: 'سموحة، الإسكندرية', locationEn: 'Smouha, Alexandria' },
  { id: '4', nameAr: 'عيادة النيل التخصصية لطب الأطفال', nameEn: 'Nile Specialty Pediatrics Clinic', plan: 'FREE', locationAr: 'المنصورة، الدقهلية', locationEn: 'Mansoura, Dakahlia' },
  { id: '5', nameAr: 'عيادة الأمل لجراحة القلب', nameEn: 'Al-Amal Heart Surgery Clinic', plan: 'PRO', locationAr: 'طنطا، الغربية', locationEn: 'Tanta, Gharbia' },
];

export default function InvoicesPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  // State-driven Subscription Invoices Database
  const [invoices, setInvoices] = useState<any[]>([
    {
      id: 'INV-2026-00001',
      clinicNameAr: 'عيادة د. المهدي التخصصية',
      clinicNameEn: 'Dr. Elmahdy Specialty Clinic',
      planCode: 'PRO',
      billingCycle: 'monthly',
      amount: 599,
      status: 'PAID',
      createdAt: '2026-05-01',
      dueDate: '2026-05-15',
      paidAt: '2026-05-03',
      notes: 'تم الدفع تلقائياً عن طريق بطاقة ميزا البنكية المسجلة.',
    },
    {
      id: 'INV-2026-00002',
      clinicNameAr: 'عيادة الشروق لطب العيون',
      clinicNameEn: 'Al-Shorouk Eye Clinic',
      planCode: 'BASIC',
      billingCycle: 'monthly',
      amount: 299,
      status: 'PAID',
      createdAt: '2026-05-02',
      dueDate: '2026-05-17',
      paidAt: '2026-05-11',
      notes: 'دفع يدوي فودافون كاش - تأكيد الإداري.',
    },
    {
      id: 'INV-2026-00003',
      clinicNameAr: 'مركز الحياة الطبي المتكامل',
      clinicNameEn: 'Al-Hayat Integrated Medical Center',
      planCode: 'ENTERPRISE',
      billingCycle: 'yearly',
      amount: 23990,
      status: 'PENDING',
      createdAt: '2026-05-15',
      dueDate: '2026-06-15',
      paidAt: null,
      notes: 'فاتورة الاشتراك السنوي المجمع - بانتظار التحويل البنكي.',
    },
    {
      id: 'INV-2026-00004',
      clinicNameAr: 'عيادة النيل التخصصية لطب الأطفال',
      clinicNameEn: 'Nile Specialty Pediatrics Clinic',
      planCode: 'FREE',
      billingCycle: 'monthly',
      amount: 0,
      status: 'PAID',
      createdAt: '2026-05-10',
      dueDate: '2026-05-20',
      paidAt: '2026-05-10',
      notes: 'الخطة المجانية الدائمة للعيادات الناشئة.',
    },
    {
      id: 'INV-2026-00005',
      clinicNameAr: 'عيادة الأمل لجراحة القلب',
      clinicNameEn: 'Al-Amal Heart Surgery Clinic',
      planCode: 'PRO',
      billingCycle: 'monthly',
      amount: 599,
      status: 'OVERDUE',
      createdAt: '2026-04-10',
      dueDate: '2026-04-25',
      paidAt: null,
      notes: 'فشل تكرار الخصم التلقائي للبطاقة. تم إرسال تنبيه بالبريد الإلكتروني.',
    },
  ]);

  // Loading indicator for Refresh trigger
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cycleFilter, setCycleFilter] = useState('ALL');

  // Modal Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Form states for creating SaaS invoice
  const [formClinicId, setFormClinicId] = useState('1');
  const [formPlan, setFormPlan] = useState('PRO');
  const [formCycle, setFormCycle] = useState('monthly');
  const [formAmount, setFormAmount] = useState(599);
  const [formDueDate, setFormDueDate] = useState('2026-06-15');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState('PENDING');

  // Trigger loading spinner for refresh simulation
  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      toast.success(isRtl ? 'تم تحديث قائمة اشتراكات وفواتير العيادات بنجاح' : 'SaaS Invoices list synchronized successfully');
    }, 600);
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
  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const clinicObj = PREDEFINED_CLINICS.find(c => c.id === formClinicId);
    if (!clinicObj) return;

    const newInv = {
      id: `INV-2026-${String(invoices.length + 1).padStart(5, '0')}`,
      clinicNameAr: clinicObj.nameAr,
      clinicNameEn: clinicObj.nameEn,
      planCode: formPlan,
      billingCycle: formCycle,
      amount: Number(formAmount),
      status: formStatus,
      createdAt: new Date().toISOString().split('T')[0],
      dueDate: formDueDate,
      paidAt: formStatus === 'PAID' ? new Date().toISOString().split('T')[0] : null,
      notes: formNotes || (isRtl ? 'تم إصدار الفاتورة يدوياً من لوحة تحكم المنصة.' : 'Manually issued via platform console.'),
    };

    setInvoices(prev => [newInv, ...prev]);
    setCreateOpen(false);
    toast.success(isRtl ? 'تم تسجيل فاتورة اشتراك العيادة الجديدة وإدراجها بنجاح' : 'Subscription invoice registered successfully');
  };

  // Toggle invoice status directly from action
  const handleUpdateStatus = (id: string, newStatus: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        toast.success(isRtl ? `تم تحديث حالة الفاتورة رقم ${id} إلى ${newStatus}` : `Invoice ${id} updated to ${newStatus}`);
        return {
          ...inv,
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date().toISOString().split('T')[0] : null
        };
      }
      return inv;
    }));
  };

  // Delete invoice
  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success(isRtl ? `تم حذف الفاتورة رقم ${id} بنجاح` : `Invoice ${id} deleted successfully`);
  };

  // Mock download success alert
  const handleDownloadReceipt = (inv: any) => {
    toast.success(isRtl 
      ? `جاري تحميل إيصال الفاتورة رقم ${inv.id} لعيادة ${inv.clinicNameAr}...` 
      : `Downloading receipt for ${inv.id} (${inv.clinicNameEn})...`
    );
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
      inv.clinicNameEn.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPlan = planFilter === 'ALL' || inv.planCode === planFilter;
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesCycle = cycleFilter === 'ALL' || inv.billingCycle === cycleFilter;

    return matchesSearch && matchesPlan && matchesStatus && matchesCycle;
  });

  // Dynamic KPI Calculation (SaaS Context)
  const totalRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingRevenue = invoices
    .filter(inv => inv.status === 'PENDING')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueRevenue = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const activeClinicsCount = PREDEFINED_CLINICS.length;

  return (
    <div className={`space-y-6 animate-fade-in ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* ── HEADER PANEL ── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-teal-600 shrink-0" />
            {isRtl ? 'إدارة فواتير اشتراكات المنصة (SaaS Invoices)' : 'Platform SaaS Subscriptions Billing'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRtl 
              ? 'متابعة وإصدار فواتير الاشتراكات الدورية بين عيادات الأطباء المشتركة والمنصة (لا تشمل فواتير المرضى الداخلية)' 
              : 'Monitor periodic subscription dues, plan compliance, and receipts issued to clinics (SaaS context only)'}
          </p>
        </div>

        {/* CREATE SAAS INVOICE & REFRESH ACTIONS */}
        <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-1.5 h-9">
            <RefreshCw className={`w-4 h-4 ${refreshing && 'animate-spin'}`} />
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                  <Receipt className="w-5 h-5" />
                  {isRtl ? 'إصدار فاتورة اشتراك عيادة' : 'Issue Subscription Invoice'}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  {isRtl ? 'سجل مطالبة مالية جديدة لاشتراك العيادة الحالي على خوادم المنصة.' : 'Create a new subscription billing claim for registered clinic tenants.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateInvoice} className="space-y-4 pt-3 text-xs font-semibold" dir={isRtl ? 'rtl' : 'ltr'}>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isRtl ? 'اختر العيادة المشتركة' : 'Select Subscribed Clinic'}</Label>
                  <select 
                    value={formClinicId} 
                    onChange={(e) => {
                      const cId = e.target.value;
                      setFormClinicId(cId);
                      const c = PREDEFINED_CLINICS.find(cli => cli.id === cId);
                      if (c) handleFormPlanCycleChange(c.plan, formCycle);
                    }}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {PREDEFINED_CLINICS.map(c => (
                      <option key={c.id} value={c.id} className="text-black">{isRtl ? c.nameAr : c.nameEn}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isRtl ? 'باقة الاشتراك' : 'SaaS Tier'}</Label>
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
                    <Label className="text-xs">{isRtl ? 'تاريخ الاستحقاق' : 'Payment Due Date'}</Label>
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
                    <option value="PENDING" className="text-black">{isRtl ? 'معلقة (بانتظار السداد)' : 'Pending Invoice'}</option>
                    <option value="PAID" className="text-black">{isRtl ? 'مدفوعة بالكامل' : 'Paid Invoice'}</option>
                    <option value="OVERDUE" className="text-black">{isRtl ? 'متأخرة السداد' : 'Overdue Invoice'}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">{isRtl ? 'ملاحظات وتفاصيل السداد' : 'Billing Notes'}</Label>
                  <textarea 
                    value={formNotes} 
                    onChange={(e) => setFormNotes(e.target.value)} 
                    rows={2} 
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm focus-visible:outline-none"
                    placeholder={isRtl ? 'تأكيد الحوالات البنكية أو وسيلة الخصم...' : 'e.g. Bank transfer confirmation ref...'}
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
          { label: isRtl ? 'الاشتراكات المعلقة الجارية' : 'Pending Subscriptions', value: `${pendingRevenue.toLocaleString()} ج.م`, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100/50' },
          { label: isRtl ? 'الاشتراكات المتأخرة والإنذارات' : 'Overdue Claims', value: `${overdueRevenue.toLocaleString()} ج.م`, icon: BadgeAlert, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100/50' },
          { label: isRtl ? 'العيادات المشتركة بالمنصة' : 'Total Active Clinics', value: `${activeClinicsCount} عيادة`, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100/50' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i} className={`border border-gray-250/60 dark:border-gray-800/60 shadow-xs rounded-2xl overflow-hidden hover:shadow-md transition-all duration-300 ${s.bg}`}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl shadow-xs shrink-0">
                    <Icon className={`w-5 h-5 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-950 dark:text-white tracking-tight">{s.value}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-0.5 leading-none">{s.label}</p>
                  </div>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-gray-300 self-start mt-0.5 shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── ADVANCED SAAS FILTER BAR ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-xs rounded-3xl bg-white dark:bg-slate-900/30 overflow-hidden">
        <CardHeader className="pb-3 pt-4 border-b border-gray-150/60 dark:border-gray-850/60 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black uppercase tracking-wider flex items-center gap-2 text-teal-700 dark:text-teal-400">
            <SlidersHorizontal className="w-4 h-4 text-teal-600 shrink-0" />
            {isRtl ? 'محرك تصفية وبحث فواتير المنصة' : 'SaaS Billings Search Filters'}
          </CardTitle>
          {searchQuery || planFilter !== 'ALL' || statusFilter !== 'ALL' || cycleFilter !== 'ALL' ? (
            <Button 
              variant="ghost" 
              size="xs" 
              className="text-[10px] font-bold text-rose-600 hover:bg-rose-50 h-7 px-2"
              onClick={() => {
                setSearchQuery('');
                setPlanFilter('ALL');
                setStatusFilter('ALL');
                setCycleFilter('ALL');
              }}
            >
              {isRtl ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3.5">
          {/* Search Clinic Name or ID */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'البحث عن عيادة أو فاتورة' : 'Search Clinic / ID'}</Label>
            <div className="relative">
              <Search className="absolute right-2.5 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث برقم الفاتورة أو اسم العيادة...' : 'Search Invoice ID, Clinic Name...'}
                className="h-9 pr-9 pl-3 text-xs"
              />
            </div>
          </div>

          {/* Plan Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'تصفية حسب باقة الاشتراك' : 'SaaS Plan Tier'}</Label>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9"
            >
              <option value="ALL" className="text-black">{isRtl ? 'جميع باقات الاشتراك' : 'All Subscription Tiers'}</option>
              <option value="FREE" className="text-black">FREE</option>
              <option value="BASIC" className="text-black">BASIC</option>
              <option value="PRO" className="text-black">PRO</option>
              <option value="ENTERPRISE" className="text-black">ENTERPRISE</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'تصفية حسب حالة السداد' : 'Payment Status'}</Label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9"
            >
              <option value="ALL" className="text-black">{isRtl ? 'جميع الحالات المالية' : 'All Billing Statuses'}</option>
              <option value="PAID" className="text-black">{isRtl ? 'مدفوعة بالكامل' : 'PAID'}</option>
              <option value="PENDING" className="text-black">{isRtl ? 'معلقة السداد' : 'PENDING'}</option>
              <option value="OVERDUE" className="text-black">{isRtl ? 'متأخرة السداد' : 'OVERDUE'}</option>
              <option value="CANCELLED" className="text-black">{isRtl ? 'ملغية' : 'CANCELLED'}</option>
            </select>
          </div>

          {/* Cycle Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{isRtl ? 'دورة الفوترة السحابية' : 'Billing Frequency'}</Label>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9"
            >
              <option value="ALL" className="text-black">{isRtl ? 'جميع فترات السداد' : 'All Billing Frequencies'}</option>
              <option value="monthly" className="text-black">{isRtl ? 'دفع شهري' : 'Monthly Cycle'}</option>
              <option value="yearly" className="text-black">{isRtl ? 'دفع سنوي مجمع' : 'Yearly Cycle'}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── SaaS SUBSCRIPTION INVOICES DATA TABLE ── */}
      <Card className="border-gray-200/60 dark:border-gray-800/60 shadow-xs bg-white dark:bg-slate-900/30 rounded-3xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>{isRtl ? 'سجل المطالبات المالية والفواتير' : 'SaaS Billing Claims Directory'}</span>
            <span className="text-[10px] bg-teal-50 dark:bg-teal-950/30 text-teal-600 px-2 py-0.5 rounded-full font-bold">
              {filteredInvoices.length} {isRtl ? 'فاتورة مطابقة' : 'matching invoices'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b bg-gray-50/60 dark:bg-gray-900/40 text-gray-400 font-bold text-[10px] uppercase select-none">
                <th className="px-5 py-3 text-right"># {isRtl ? 'الرقم المرجعي' : 'Invoice ID'}</th>
                <th className="px-5 py-3 text-right">{isRtl ? 'العيادة الطبية المشتركة' : 'Subscribed Clinic Tenant'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'باقة الاشتراك' : 'SaaS Tier'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'دورة الدفع' : 'Cycle'}</th>
                <th className="px-5 py-3 text-right">{isRtl ? 'مبلغ الاشتراك' : 'Premium Fee'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'حالة المطالبة' : 'Billing Status'}</th>
                <th className="px-5 py-3 text-center">{isRtl ? 'خيارات التحكم' : 'Operations'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150/60 dark:divide-gray-800/60 font-semibold">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    {/* STATE-OF-THE-ART PURE CSS EMPTY STATE */}
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
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    {/* Invoice ID */}
                    <td className="px-5 py-3.5 font-mono text-gray-500 font-bold">#{inv.id}</td>
                    
                    {/* Clinic Name */}
                    <td className="px-5 py-3.5 text-gray-950 dark:text-white">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-slate-50 dark:bg-slate-800 rounded-md shrink-0"><Building2 className="w-3.5 h-3.5 text-teal-600" /></div>
                        <span className="font-bold truncate max-w-[200px]">{isRtl ? inv.clinicNameAr : inv.clinicNameEn}</span>
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

                    {/* Due Date */}
                    <td className="px-5 py-3.5 text-center text-gray-500 font-mono">
                      {new Date(inv.dueDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-black border tracking-wider select-none ${STATUS_STYLE[inv.status] || ''}`}>
                        {inv.status}
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
                          className="text-[10px] text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/20 font-black h-7 px-2 rounded-lg"
                        >
                          {isRtl ? 'عرض الميزانية' : 'Details'}
                        </Button>

                        {/* Quick pay toggle */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <Button 
                            variant="ghost" 
                            size="xs" 
                            onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                            className="text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 font-black h-7 px-2 rounded-lg"
                          >
                            {isRtl ? 'سداد' : 'Mark Paid'}
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

                        {/* Delete invoice */}
                        <Button 
                          variant="ghost" 
                          size="xs" 
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="text-rose-400 hover:text-rose-600 h-7 w-7 p-0 shrink-0"
                          title={isRtl ? 'حذف من المنصة' : 'Remove from Console'}
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
        </CardContent>
      </Card>

      {/* ── HIGH-FIDELITY DETAILED INVOICE BREAKDOWN DRAWER/MODAL ── */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg overflow-hidden rounded-3xl p-0">
          {selectedInvoice && (
            <div className={`text-xs ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
              {/* Header Visual Stripe */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-500 p-6 text-white relative">
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <Badge variant="outline" className="text-white border-white/20 bg-white/10 text-[9px] font-black tracking-wider uppercase">
                    {isRtl ? 'فاتورة اشتراك سحابي' : 'SaaS Tenant Claim'}
                  </Badge>
                  <span className="text-[10px] text-white/80 font-mono font-bold">#{selectedInvoice.id}</span>
                </div>
                <div className="pt-6">
                  <h3 className="text-lg font-black tracking-tight">{isRtl ? selectedInvoice.clinicNameAr : selectedInvoice.clinicNameEn}</h3>
                  <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3 shrink-0" />
                    {isRtl ? 'خطط واستضافة السحابية لمنصة ClinicPro' : 'ClinicPro Managed Cloud Tenant Subscriptions'}
                  </p>
                </div>
              </div>

              {/* Invoice Breakdown Details */}
              <div className="p-6 space-y-5 font-semibold text-gray-700 dark:text-gray-300">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-gray-150/60 dark:border-gray-800/60">
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'باقة السحابة المفعلة' : 'Subscribed Plan'}</span>
                    <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full font-black border ${PLAN_COLOR[selectedInvoice.planCode]}`}>
                      {selectedInvoice.planCode}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'دورة التجديد المجدولة' : 'Billing Interval'}</span>
                    <span className="text-xs font-black text-gray-950 dark:text-white uppercase font-mono">
                      {selectedInvoice.billingCycle === 'monthly' ? (isRtl ? 'تجديد شهري' : 'Monthly cycle') : (isRtl ? 'تجديد سنوي (-20%)' : 'Yearly cycle (-20%)')}
                    </span>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-gray-200/50 dark:border-gray-850/50 col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'تاريخ إصدار الفاتورة' : 'Date Issued'}</span>
                      <span className="text-[10.5px] font-bold text-gray-800 dark:text-gray-200 font-mono">{new Date(selectedInvoice.createdAt).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">{isRtl ? 'تاريخ الاستحقاق النهائي' : 'Payment Due Date'}</span>
                      <span className="text-[10.5px] font-bold text-gray-800 dark:text-gray-200 font-mono">{new Date(selectedInvoice.dueDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</span>
                    </div>
                  </div>
                </div>

                {/* Subtotal table calculation */}
                <div className="space-y-2">
                  <h4 className="text-[10px] text-gray-400 font-black uppercase tracking-wider">{isRtl ? 'تفصيل بنود الإيراد والرسوم' : 'Billing Items Breakdown'}</h4>
                  <div className="border border-gray-150/60 dark:border-gray-850/60 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/30">
                    <div className="flex items-center justify-between p-3.5 bg-gray-50/50 dark:bg-slate-900/20 border-b border-gray-100 dark:border-gray-800">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          {isRtl ? `اشتراك الباقة ${selectedInvoice.planCode}` : `${selectedInvoice.planCode} Subscription Fee`}
                        </p>
                        <p className="text-[9px] text-gray-400 font-semibold">
                          {selectedInvoice.billingCycle === 'monthly' ? (isRtl ? 'ترخيص شهري شامل للأطباء والمرضى' : 'ترخيص سنوي شامل وموفر') : 'SaaS Cloud Hosting License'}
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
                        <span>{isRtl ? 'الضرائب المفروضة (٠٪)' : 'Value Added Tax (0%)'}</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">0 ج.م</span>
                      </div>
                      <div className="flex items-center justify-between text-gray-400">
                        <span>{isRtl ? 'الخصم المطبق' : 'Applied Platform Discount'}</span>
                        <span className="font-mono font-bold text-gray-800 dark:text-gray-200">0 ج.م</span>
                      </div>
                      <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex items-center justify-between text-teal-600 text-xs font-black">
                        <span>{isRtl ? 'الإجمالي النهائي المطلوب سداده' : 'Total Amount Due'}</span>
                        <span className="font-mono font-black text-lg">{selectedInvoice.amount.toLocaleString()} ج.م</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit trail / Notes section */}
                {selectedInvoice.notes && (
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-100/40 dark:border-amber-900/20 text-[10.5px]">
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider block mb-1">
                      {isRtl ? 'ملاحظات الإدارة والتدقيق المالي' : 'Administrator Audit & Transaction Notes'}
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
                        ? `تم تحصيل الاشتراك بنجاح بتاريخ ${new Date(selectedInvoice.paidAt).toLocaleDateString('ar-EG')}` 
                        : `Successfully captured on ${new Date(selectedInvoice.paidAt).toLocaleDateString('en-US')}`}
                    </span>
                  </div>
                )}

                {/* Action buttons inside drawer */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-850">
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