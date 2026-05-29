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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, Upload, FolderOpen, Search, Filter, 
  Activity, Pill, FileBadge, CheckCircle2, AlertCircle, Clock, Trash2, Download, Eye,
  Building2, User
} from 'lucide-react';
import { formatDate, cn } from '@/lib/utils';

const FILE_CATEGORIES = [
  { value: 'ALL', label: 'كل الأنواع' },
  { value: 'PRESCRIPTION', label: 'روشتة' },
  { value: 'LAB_REPORT', label: 'تحليل' },
  { value: 'RADIOLOGY', label: 'أشعة' },
  { value: 'MEDICAL_REPORT', label: 'تقرير طبي' },
  { value: 'OTHER', label: 'مرفق آخر' },
];

const UPLOAD_CATEGORIES = [
  { value: 'PRESCRIPTION', label: 'روشتة قديمة' },
  { value: 'LAB_REPORT', label: 'تحليل' },
  { value: 'RADIOLOGY', label: 'أشعة' },
  { value: 'MEDICAL_REPORT', label: 'تقرير طبي' },
  { value: 'OTHER', label: 'مرفق آخر' },
];

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'كل الحالات' },
  { value: 'PENDING_REVIEW', label: 'قيد المراجعة' },
  { value: 'VERIFIED', label: 'معتمد' },
  { value: 'REJECTED', label: 'مرفوض' },
];

const PERIOD_OPTIONS = [
  { value: 'ALL', label: 'كل الأوقات' },
  { value: '30days', label: 'آخر 30 يوم' },
  { value: '6months', label: 'آخر 6 شهور' },
  { value: 'this_year', label: 'هذا العام' },
];

const TABS = [
  { value: 'ALL', label: 'كل الملفات' },
  { value: 'PRESCRIPTION', label: 'الروشتات' },
  { value: 'LAB_REPORT', label: 'التحاليل' },
  { value: 'RADIOLOGY', label: 'الأشعة' },
  { value: 'MEDICAL_REPORT', label: 'التقارير' },
  { value: 'PENDING_REVIEW', label: 'قيد المراجعة' },
];

export default function PatientFilesPage() {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: '',
    reportDate: '',
    notes: '',
    file: null as File | null,
  });

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['patient-files', { activeTab, searchQuery, selectedType, selectedStatus, selectedPeriod }],
    queryFn: async () => {
      let cat = selectedType !== 'ALL' ? selectedType : undefined;
      let stat = selectedStatus !== 'ALL' ? selectedStatus : undefined;

      // Map tab selection to filters
      if (activeTab === 'PENDING_REVIEW') {
        stat = 'PENDING_REVIEW';
      } else if (activeTab !== 'ALL') {
        cat = activeTab;
      }

      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (cat) params.append('category', cat);
      if (stat) params.append('verificationStatus', stat);
      if (selectedPeriod !== 'ALL') params.append('period', selectedPeriod);

      return api.get(`/patient/files?${params.toString()}`).then((r) => r.data);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return api.post('/patient/files', formData);
    },
    onSuccess: () => {
      toast.success('تم رفع الملف بنجاح وهو الآن قيد مراجعة العيادة');
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', category: '', reportDate: '', notes: '', file: null });
      queryClient.invalidateQueries({ queryKey: ['patient-files'] });
    },
    onError: (e) => console.error(e),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/patient/files/${id}`);
    },
    onSuccess: () => {
      toast.success('تم حذف الملف بنجاح');
      queryClient.invalidateQueries({ queryKey: ['patient-files'] });
    },
    onError: (e) => console.error(e),
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category) {
      toast.error('يرجى تعبئة الحقول المطلوبة واختيار ملف');
      return;
    }
    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('title', uploadForm.title);
    formData.append('category', uploadForm.category);
    if (uploadForm.reportDate) formData.append('reportDate', uploadForm.reportDate);
    if (uploadForm.notes) formData.append('notes', uploadForm.notes);
    
    uploadMutation.mutate(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW': return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> قيد المراجعة</span>;
      case 'VERIFIED': return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> معتمد</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3"/> مرفوض</span>;
      default: return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    const label = FILE_CATEGORIES.find(c => c.value === category)?.label || category;
    switch (category) {
      case 'PRESCRIPTION': return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-medium">{label}</span>;
      case 'LAB_REPORT': return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">{label}</span>;
      case 'RADIOLOGY': return <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium">{label}</span>;
      case 'MEDICAL_REPORT': return <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-medium">{label}</span>;
      default: return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">{label}</span>;
    }
  };

  const totalFiles = files.length;
  const pendingFiles = files.filter((f: any) => f.verificationStatus === 'PENDING_REVIEW').length;
  const verifiedFiles = files.filter((f: any) => f.verificationStatus === 'VERIFIED').length;
  const lastFile = files.length > 0 ? files[0] : null;

  return (
    <div className="space-y-5 max-w-[1180px]" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">ملفاتي</h1>
          <p className="text-sm text-slate-500 mt-0.5">كل ملفاتك الطبية وروشتاتك وتحاليلك وأشعتك في مكان واحد</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2">
          <Upload className="w-4 h-4" />
          رفع ملف طبي
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">إجمالي الملفات</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-slate-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 truncate">{totalFiles}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{totalFiles > 0 ? 'في جميع الأقسام' : 'لا توجد ملفات بعد'}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600">قيد المراجعة</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 truncate">{pendingFiles}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">بانتظار مراجعة العيادة</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600">ملفات معتمدة</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 truncate">{verifiedFiles}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">متاحة للعرض</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px]">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600">آخر ملف</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <FileBadge className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 truncate">{lastFile ? lastFile.title : 'لا يوجد'}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate">{lastFile ? formatDate(lastFile.createdAt, locale) : 'لم يتم رفع ملفات بعد'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.value
                  ? "border-teal-600 text-teal-700"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="ابحث باسم الملف أو نوع التقرير..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-9 h-10 rounded-xl bg-slate-50 border-slate-200 text-sm w-full"
            />
          </div>
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 border-slate-200">
              <SelectValue placeholder="نوع الملف" />
            </SelectTrigger>
            <SelectContent>
              {FILE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 border-slate-200">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 border-slate-200">
              <SelectValue placeholder="الفترة الزمنية" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12"><Activity className="w-6 h-6 animate-spin text-teal-600" /></div>
        ) : files.length > 0 ? (
          files.map((file: any) => (
            <Card key={file.id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row p-4 gap-4 items-start sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-base">{file.title || file.fileName}</h3>
                      {getCategoryBadge(file.category)}
                      {getStatusBadge(file.verificationStatus)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {file.reportDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          تاريخ التقرير: {formatDate(file.reportDate, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        تم الرفع: {formatDate(file.createdAt, locale)} بواسطة {file.uploadedByType === 'PATIENT' ? 'المريض' : 'العيادة'}
                      </span>
                      {file.clinic?.name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          العيادة: {file.clinic.name}
                        </span>
                      )}
                    </div>

                    {file.verificationStatus === 'REJECTED' && file.rejectionReason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <strong>سبب الرفض: </strong>{file.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
                    {file.verificationStatus === 'PENDING_REVIEW' && file.uploadedByType === 'PATIENT' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          if (confirm('هل أنت متأكد من رغبتك في حذف هذا الملف؟')) {
                            deleteMutation.mutate(file.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-1" />
                        حذف الطلب
                      </Button>
                    )}
                    {(file.verificationStatus === 'VERIFIED' || file.verificationStatus === 'PENDING_REVIEW') && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-none">
                          <Eye className="w-3.5 h-3.5 ml-1" />
                          عرض
                        </Button>
                        <Button variant="default" size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none">
                          <Download className="w-3.5 h-3.5 ml-1" />
                          تحميل
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm mt-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">لا توجد ملفات طبية بعد</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              ستظهر هنا الروشتات والتحاليل والأشعة والتقارير الطبية التي ترفعها أنت أو تضيفها العيادة.
            </p>
            <div className="mt-6 space-y-3">
              <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 px-6 shadow-sm">
                <Upload className="w-4 h-4 ml-2" />
                رفع أول ملف طبي
              </Button>
              <p className="text-xs text-slate-400 block">
                سيتم إرسال الملفات التي ترفعها إلى العيادة للمراجعة قبل اعتمادها في سجلك الطبي.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Upload className="w-5 h-5 text-teal-600" />
              رفع ملف طبي
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1">
              سيتم مراجعة الملف المرفق من قبل العيادة قبل اعتماده رسمياً في سجلك الطبي
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">نوع الملف <span className="text-red-500">*</span></Label>
              <Select value={uploadForm.category} onValueChange={(v: string | null) => setUploadForm({ ...uploadForm, category: v || '' })}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-slate-200">
                  <SelectValue placeholder="اختر نوع الملف..." />
                </SelectTrigger>
                <SelectContent>
                  {UPLOAD_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">عنوان الملف <span className="text-red-500">*</span></Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="مثال: تحليل دم شامل للغدة أو أشعة صدر"
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">تاريخ التقرير</Label>
              <Input
                type="date"
                value={uploadForm.reportDate}
                onChange={(e) => setUploadForm({ ...uploadForm, reportDate: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">ملاحظات</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder="أي ملاحظات تريد إرسالها للعيادة..."
                className="rounded-xl min-h-[80px] resize-none bg-slate-50 border-slate-200"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">اختر الملف <span className="text-red-500">*</span></Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                className="file:bg-slate-100 file:text-slate-700 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-2 file:text-xs file:font-medium text-sm h-11 bg-slate-50 border-slate-200 rounded-xl"
              />
              <p className="text-[10px] text-slate-400 mt-1">الأنواع المسموحة: PDF, JPG, PNG (الحد الأقصى 10MB)</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="rounded-xl font-medium">
                إلغاء
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm px-6 font-medium">
                {uploadMutation.isPending ? 'جاري الرفع...' : 'رفع الملف'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
