'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Stethoscope,
  CalendarDays,
  Building2,
  Search,
  FileText,
  Clock,
  Activity,
  Syringe,
  Upload,
  Pill,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  FileBadge,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const TABS = [
  { key: 'all', label: 'كل الزيارات' },
  { key: '30days', label: 'آخر 30 يوم' },
  { key: '6months', label: 'آخر 6 شهور' },
  { key: 'clinic', label: 'حسب العيادة' },
];

const RECORD_TYPES = [
  { value: 'ALL', label: 'كل السجلات' },
  { value: 'VISIT', label: 'زيارة طبية' },
  { value: 'DIAGNOSIS', label: 'تشخيص' },
  { value: 'PRESCRIPTION', label: 'روشتة' },
  { value: 'LAB_REPORT', label: 'تحليل' },
  { value: 'RADIOLOGY_SCAN', label: 'أشعة' },
  { value: 'UPLOADED_FILE', label: 'ملف مرفوع' },
];

const FILE_CATEGORIES = [
  { value: 'OLD_PRESCRIPTION', label: 'روشتة قديمة' },
  { value: 'LAB_REPORT', label: 'تحليل' },
  { value: 'RADIOLOGY_SCAN', label: 'أشعة' },
  { value: 'MEDICAL_REPORT', label: 'تقرير طبي' },
  { value: 'OTHER', label: 'مرفق آخر' },
];

export default function PatientMedicalRecordsPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicId, setSelectedClinicId] = useState<string>('all');
  const [selectedRecordType, setSelectedRecordType] = useState('ALL');
  
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: '',
    reportDate: '',
    clinicId: '',
    notes: '',
    file: null as File | null,
  });

  const { data: timelineData, isLoading } = useQuery({
    queryKey: ['patient-medical-timeline'],
    queryFn: () => api.get('/patient/medical-history/timeline').then((r) => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['patient-visits-summary'],
    queryFn: () => api.get('/patient/visits/summary').then((r) => r.data),
  });

  const { data: clinicsData } = useQuery({
    queryKey: ['patient-clinics-list'],
    queryFn: () => api.get('/patient-portal/clinics').then((r) => r.data),
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/patient/files', formData);
    },
    onSuccess: () => {
      toast.success('تم رفع الملف بنجاح وهو قيد المراجعة');
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', category: '', reportDate: '', clinicId: '', notes: '', file: null });
      queryClient.invalidateQueries({ queryKey: ['patient-medical-timeline'] });
    },
    onError: (e) => console.error(e),
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category) {
      toast.error('يرجى تعبئة الحقول المطلوبة');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('category', uploadForm.category);
    if (uploadForm.reportDate) formData.append('reportDate', uploadForm.reportDate);
    if (uploadForm.clinicId) formData.append('clinicId', uploadForm.clinicId);
    if (uploadForm.notes) formData.append('notes', uploadForm.notes);
    
    uploadMutation.mutate(formData);
  };

  const clinics: any[] = clinicsData || [];
  const allEvents = timelineData || [];

  const filteredEvents = allEvents.filter((event: any) => {
    // 1. Tab Period Filter
    if (activeTab === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (new Date(event.date) < thirtyDaysAgo) return false;
    } else if (activeTab === '6months') {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      if (new Date(event.date) < sixMonthsAgo) return false;
    }

    // 2. Clinic Filter
    if (selectedClinicId !== 'all') {
      const clinicName = clinics.find((c) => String(c.id) === selectedClinicId)?.name;
      if (event.clinic !== clinicName) return false;
    }

    // 3. Record Type Filter
    if (selectedRecordType !== 'ALL') {
      if (selectedRecordType === 'VISIT' && event.type !== 'VISIT') return false;
      if (selectedRecordType === 'PRESCRIPTION' && event.type !== 'PRESCRIPTION') return false;
      if (selectedRecordType === 'DIAGNOSIS' && (!event.payload?.diagnosis)) return false;
      if (selectedRecordType === 'LAB_REPORT' && event.type !== 'LAB_REPORT') return false;
      if (selectedRecordType === 'RADIOLOGY_SCAN' && event.type !== 'RADIOLOGY_SCAN') return false;
      if (selectedRecordType === 'UPLOADED_FILE' && !['MEDICAL_FILE', 'LAB_REPORT', 'RADIOLOGY_SCAN'].includes(event.type)) return false;
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        event.title?.toLowerCase().includes(q) ||
        event.clinic?.toLowerCase().includes(q) ||
        event.doctor?.toLowerCase().includes(q) ||
        event.payload?.diagnosis?.toLowerCase().includes(q) ||
        event.payload?.fileName?.toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }

    return true;
  });

  const summaryCards = [
    {
      title: 'إجمالي الزيارات',
      value: summary?.totalVisits ?? 0,
      subtitle: summary?.totalVisits > 0 ? 'زيارة مسجلة' : 'لا توجد',
      icon: Stethoscope,
      color: 'text-teal-600',
      bg: 'bg-teal-50',
    },
    {
      title: 'آخر زيارة',
      value: summary?.lastVisitDate ? formatDate(summary.lastVisitDate, locale) : '—',
      subtitle: summary?.lastVisitDate ? (summary.lastVisitClinic || '') : 'لا توجد',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'العيادات المرتبطة',
      value: summary?.clinicsLinked ?? 0,
      subtitle: summary?.clinicsLinked > 0 ? 'عيادة' : 'لا توجد',
      icon: Building2,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'تقارير متاحة',
      value: summary?.reportsCount ?? 0,
      subtitle: summary?.reportsCount > 0 ? 'تقرير طبي' : 'لا توجد',
      icon: FileBadge,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">الكشف الطبي</h1>
          <p className="text-sm text-slate-500 mt-0.5">سجل زياراتك الطبية في جميع العيادات المرتبطة بحسابك</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2">
          <Upload className="w-4 h-4" />
          رفع ملف طبي
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px]">
              <CardContent className="p-4 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">{card.title}</span>
                  <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                </div>
                <div>
                  <p className="text-xl font-bold text-slate-900 truncate">{card.value}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{card.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Section */}
      <Card className="border-slate-200 bg-white shadow-sm rounded-2xl">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-xs text-slate-500">بحث باسم العيادة أو الطبيب</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث هنا..."
                  className="h-10 pr-9 text-sm rounded-xl border-slate-200 w-full"
                />
              </div>
            </div>
            
            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-xs text-slate-500">الفترة الزمنية</Label>
              <div className="flex gap-1 bg-slate-100 rounded-xl p-1 h-10 w-full">
                {TABS.filter(t => t.key !== 'clinic').map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={cn(
                      'flex-1 text-xs font-medium rounded-lg transition-all',
                      activeTab === tab.key
                        ? 'bg-white text-teal-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-xs text-slate-500">العيادة</Label>
              <Select value={selectedClinicId} onValueChange={(v: string | null) => setSelectedClinicId(v || 'all')}>
                <SelectTrigger className="h-10 rounded-xl text-sm border-slate-200 w-full">
                  <SelectValue placeholder="اختر العيادة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {clinics.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5 w-full">
              <Label className="text-xs text-slate-500">نوع السجل</Label>
              <Select value={selectedRecordType} onValueChange={(v: string | null) => setSelectedRecordType(v || 'ALL')}>
                <SelectTrigger className="h-10 rounded-xl text-sm border-slate-200 w-full">
                  <SelectValue placeholder="كل السجلات" />
                </SelectTrigger>
                <SelectContent>
                  {RECORD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className={cn("relative space-y-6", isRtl ? "border-r-2 border-slate-200/60 pr-6" : "border-l-2 border-slate-200/60 pl-6")}>
            {filteredEvents.map((event: any, idx: number) => {
              const isVisit = event.type === 'VISIT' || event.type === 'APPOINTMENT';
              const isPrescription = event.type === 'PRESCRIPTION';
              const isFile = ['LAB_REPORT', 'RADIOLOGY_SCAN', 'MEDICAL_FILE'].includes(event.type);
              
              let Icon = Activity;
              let iconColor = 'text-slate-500';
              let iconBg = 'bg-slate-100 border-slate-200';

              if (event.type === 'VISIT') { Icon = Stethoscope; iconColor = 'text-teal-600'; iconBg = 'bg-teal-50 border-teal-200'; }
              if (event.type === 'PRESCRIPTION') { Icon = Pill; iconColor = 'text-indigo-600'; iconBg = 'bg-indigo-50 border-indigo-200'; }
              if (event.type === 'LAB_REPORT') { Icon = Syringe; iconColor = 'text-blue-600'; iconBg = 'bg-blue-50 border-blue-200'; }
              if (event.type === 'RADIOLOGY_SCAN') { Icon = ImageIcon; iconColor = 'text-amber-600'; iconBg = 'bg-amber-50 border-amber-200'; }

              return (
                <div key={`${event.type}-${idx}`} className="relative">
                  <div className={cn("absolute top-4 w-8 h-8 rounded-full border-2 flex items-center justify-center z-10", isRtl ? "-right-[35px]" : "-left-[35px]", iconBg)}>
                    <Icon className={`w-4 h-4 ${iconColor}`} />
                  </div>
                  
                  <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{event.title}</span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <CalendarDays className="w-3.5 h-3.5" />
                              {formatDate(event.date, locale)}
                            </span>
                            {isFile && event.payload?.verificationStatus === 'UNVERIFIED' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                قيد المراجعة
                              </span>
                            )}
                            {isFile && event.payload?.verificationStatus === 'VERIFIED' && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                معتمد
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-600">
                            {event.clinic && (
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                                {event.clinic}
                              </span>
                            )}
                            {event.doctor && (
                              <span className="flex items-center gap-1">
                                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                                د. {event.doctor}
                              </span>
                            )}
                          </div>

                          {event.payload?.diagnosis && (
                            <div className="mt-3 bg-teal-50/50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-teal-700 mb-1">التشخيص</p>
                              <p className="text-sm text-slate-700">{event.payload.diagnosis}</p>
                            </div>
                          )}

                          {isPrescription && event.payload?.items && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {event.payload.items.map((med: any, midx: number) => (
                                <div key={midx} className="px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs flex flex-col gap-0.5">
                                  <span className="font-semibold text-slate-700">{med.name}</span>
                                  <span className="text-slate-500">{med.dosage} - {med.frequency}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {isFile && event.payload?.fileName && (
                            <div className="mt-3 flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <FileText className="w-8 h-8 text-blue-500" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{event.payload.fileName}</p>
                                <p className="text-xs text-slate-500">{event.payload.category || 'ملف مرفق'}</p>
                              </div>
                              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0">
                                عرض
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 border-dashed">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">لا توجد سجلات مطابقة</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              لم نتمكن من العثور على أية سجلات طبية تتطابق مع معايير البحث الخاصة بك. حاول تغيير الفلاتر أو رفع ملف جديد.
            </p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-teal-600" />
              رفع ملف طبي
            </DialogTitle>
            <DialogDescription className="text-xs">
              سيتم مراجعة الملف المرفق من قبل الطبيب المعالج قبل اعتماده في سجلك الطبي
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">نوع الملف <span className="text-red-500">*</span></Label>
              <Select value={uploadForm.category} onValueChange={(v: string | null) => setUploadForm({ ...uploadForm, category: v || '' })}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="اختر نوع الملف..." />
                </SelectTrigger>
                <SelectContent>
                  {FILE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">عنوان الملف <span className="text-red-500">*</span></Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="مثال: تحليل دم شامل للغدة"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">تاريخ التقرير</Label>
              <Input
                type="date"
                value={uploadForm.reportDate}
                onChange={(e) => setUploadForm({ ...uploadForm, reportDate: e.target.value })}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">ملاحظات (اختياري)</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="أي ملاحظات إضافية بخصوص هذا الملف..."
                className="rounded-xl resize-none h-20"
              />
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="text-sm font-medium">الملف <span className="text-red-500">*</span></Label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  {uploadForm.file ? uploadForm.file.name : 'اضغط هنا أو قم بسحب الملف'}
                </p>
                <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (بحد أقصى 5MB)</p>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" className="flex-1 h-11 rounded-xl" onClick={() => setIsUploadModalOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="flex-1 h-11 rounded-xl bg-teal-600 hover:bg-teal-700" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? 'جاري الرفع...' : 'حفظ الملف'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

