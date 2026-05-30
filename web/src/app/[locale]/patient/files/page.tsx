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
  FileText, Upload, FolderOpen, Search, 
  Activity, CheckCircle2, AlertCircle, Clock, Trash2, Download, Eye,
  Building2, FileBadge
} from 'lucide-react';
import { formatDate, cn, extractErrorMessage } from '@/lib/utils';

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
    clinicId: '',
    notes: '',
    file: null as File | null,
  });

  const fileCategories = [
    { value: 'ALL', label: isRtl ? 'كل الأنواع' : 'All Types' },
    { value: 'PRESCRIPTION', label: isRtl ? 'روشتة' : 'Prescription' },
    { value: 'LAB_REPORT', label: isRtl ? 'تحليل' : 'Lab Report' },
    { value: 'RADIOLOGY', label: isRtl ? 'أشعة' : 'Radiology' },
    { value: 'MEDICAL_REPORT', label: isRtl ? 'تقرير طبي' : 'Medical Report' },
    { value: 'OTHER', label: isRtl ? 'مرفق آخر' : 'Other Attachment' },
  ];

  const uploadCategories = [
    { value: 'PRESCRIPTION', label: isRtl ? 'روشتة قديمة' : 'Past Prescription' },
    { value: 'LAB_REPORT', label: isRtl ? 'تحليل' : 'Lab Report' },
    { value: 'RADIOLOGY', label: isRtl ? 'أشعة' : 'Radiology' },
    { value: 'MEDICAL_REPORT', label: isRtl ? 'تقرير طبي' : 'Medical Report' },
    { value: 'OTHER', label: isRtl ? 'مرفق آخر' : 'Other Attachment' },
  ];

  const statusOptions = [
    { value: 'ALL', label: isRtl ? 'كل الحالات' : 'All Statuses' },
    { value: 'PENDING_REVIEW', label: isRtl ? 'قيد المراجعة' : 'Pending Review' },
    { value: 'VERIFIED', label: isRtl ? 'معتمد' : 'Verified' },
    { value: 'REJECTED', label: isRtl ? 'مرفوض' : 'Rejected' },
  ];

  const periodOptions = [
    { value: 'ALL', label: isRtl ? 'كل الأوقات' : 'All Times' },
    { value: '30days', label: isRtl ? 'آخر 30 يوم' : 'Last 30 Days' },
    { value: '6months', label: isRtl ? 'آخر 6 شهور' : 'Last 6 Months' },
    { value: 'this_year', label: isRtl ? 'هذا العام' : 'This Year' },
  ];

  const tabs = [
    { value: 'ALL', label: isRtl ? 'كل الملفات' : 'All Files' },
    { value: 'PRESCRIPTION', label: isRtl ? 'الروشتات' : 'Prescriptions' },
    { value: 'LAB_REPORT', label: isRtl ? 'التحاليل' : 'Lab Reports' },
    { value: 'RADIOLOGY', label: isRtl ? 'الأشعة' : 'Radiology' },
    { value: 'MEDICAL_REPORT', label: isRtl ? 'التقارير' : 'Reports' },
    { value: 'PENDING_REVIEW', label: isRtl ? 'قيد المراجعة' : 'Pending Review' },
  ];

  const { data: clinicsData } = useQuery({
    queryKey: ['patient-clinics-list'],
    queryFn: () => api.get('/patient-portal/clinics').then((r) => r.data),
  });

  const clinics: any[] = clinicsData || [];

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['patient-files', { activeTab, searchQuery, selectedType, selectedStatus, selectedPeriod }],
    queryFn: async () => {
      let cat = selectedType !== 'ALL' ? selectedType : undefined;
      let stat = selectedStatus !== 'ALL' ? selectedStatus : undefined;

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

  const uploadMutation = useMutation<any, any, FormData>({
    mutationFn: async (formData: FormData) => {
      return api.post('/patient/files', formData);
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم رفع الملف بنجاح وهو الآن قيد مراجعة العيادة' : 'File uploaded successfully and is now pending clinic review');
      setIsUploadModalOpen(false);
      setUploadForm({ title: '', category: '', reportDate: '', clinicId: '', notes: '', file: null });
      queryClient.invalidateQueries({ queryKey: ['patient-files'] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error(extractErrorMessage(e));
    },
  });

  const deleteMutation = useMutation<any, any, number>({
    mutationFn: async (id: number) => {
      return api.delete(`/patient/files/${id}`);
    },
    onSuccess: () => {
      toast.success(isRtl ? 'تم حذف الملف بنجاح' : 'File deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['patient-files'] });
    },
    onError: (e: any) => {
      console.error(e);
      toast.error(extractErrorMessage(e));
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title || !uploadForm.category) {
      toast.error(isRtl ? 'يرجى تعبئة الحقول المطلوبة واختيار ملف' : 'Please fill in required fields and select a file');
      return;
    }
    if (clinics.length > 1 && !uploadForm.clinicId) {
      toast.error(isRtl ? 'يرجى اختيار العيادة المستهدفة' : 'Please select the target clinic');
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_REVIEW': return <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium flex items-center gap-1 dark:bg-amber-950/20 dark:text-amber-400"><Clock className="w-3 h-3"/> {isRtl ? 'قيد المراجعة' : 'Pending Review'}</span>;
      case 'VERIFIED': return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium flex items-center gap-1 dark:bg-emerald-950/20 dark:text-emerald-400"><CheckCircle2 className="w-3 h-3"/> {isRtl ? 'معتمد' : 'Verified'}</span>;
      case 'REJECTED': return <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 dark:bg-red-950/20 dark:text-red-400"><AlertCircle className="w-3 h-3"/> {isRtl ? 'مرفوض' : 'Rejected'}</span>;
      default: return null;
    }
  };

  const getCategoryBadge = (category: string) => {
    const found = fileCategories.find(c => c.value === category);
    const label = found ? found.label : category;
    switch (category) {
      case 'PRESCRIPTION': return <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 text-xs font-medium dark:bg-purple-950/20 dark:text-purple-400">{label}</span>;
      case 'LAB_REPORT': return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium dark:bg-blue-950/20 dark:text-blue-400">{label}</span>;
      case 'RADIOLOGY': return <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 text-xs font-medium dark:bg-orange-950/20 dark:text-orange-400">{label}</span>;
      case 'MEDICAL_REPORT': return <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-medium dark:bg-teal-950/20 dark:text-teal-400">{label}</span>;
      default: return <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium dark:bg-slate-900 dark:text-slate-400">{label}</span>;
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">{isRtl ? 'ملفاتي' : 'My Files'}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isRtl ? 'كل ملفاتك الطبية وروشتاتك وتحاليلك وأشعتك في مكان واحد' : 'All your medical files, prescriptions, lab reports, and radiology scans in one place'}</p>
        </div>
        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex items-center gap-2 rounded-xl">
          <Upload className="w-4 h-4" />
          {isRtl ? 'رفع ملف طبي' : 'Upload Medical File'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px] dark:bg-slate-950 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{isRtl ? 'إجمالي الملفات' : 'Total Files'}</span>
              <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-slate-600 dark:text-slate-450" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white truncate">{totalFiles}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{totalFiles > 0 ? (isRtl ? 'في جميع الأقسام' : 'across all folders') : (isRtl ? 'لا توجد ملفات بعد' : 'No files uploaded yet')}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px] dark:bg-slate-950 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">{isRtl ? 'قيد المراجعة' : 'Pending Review'}</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white truncate">{pendingFiles}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{isRtl ? 'بانتظار مراجعة العيادة' : 'Awaiting clinic verification'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px] dark:bg-slate-950 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">{isRtl ? 'ملفات معتمدة' : 'Verified Files'}</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white truncate">{verifiedFiles}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{isRtl ? 'متاحة للعرض' : 'Available for viewing'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm h-[132px] dark:bg-slate-950 dark:border-slate-800">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-500">{isRtl ? 'آخر ملف' : 'Latest File'}</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                <FileBadge className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{lastFile ? lastFile.title : (isRtl ? 'لا يوجد' : 'None')}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{lastFile ? formatDate(lastFile.createdAt, locale) : (isRtl ? 'لم يتم رفع ملفات بعد' : 'No uploads recorded')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-4">
        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 scrollbar-hide gap-2 border-b border-slate-100 dark:border-slate-900">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "whitespace-nowrap px-4 py-2 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.value
                  ? "border-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400"
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
              placeholder={isRtl ? 'ابحث باسم الملف أو نوع التقرير...' : 'Search by file name or report type...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-9 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm w-full"
            />
          </div>
          <Select value={selectedType} onValueChange={(v) => setSelectedType(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder={isRtl ? 'نوع الملف' : 'File Type'} />
            </SelectTrigger>
            <SelectContent>
              {fileCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder={isRtl ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v || 'ALL')}>
            <SelectTrigger className="w-full md:w-[150px] h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <SelectValue placeholder={isRtl ? 'الفترة الزمنية' : 'Time Frame'} />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
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
            <Card key={file.id} className="rounded-2xl border-slate-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow dark:bg-slate-950 dark:border-slate-800">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row p-4 gap-4 items-start sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-800">
                    <FileText className="w-6 h-6 text-slate-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-slate-150 text-base">{file.title || file.fileName}</h3>
                      {getCategoryBadge(file.category)}
                      {getStatusBadge(file.verificationStatus)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      {file.reportDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {isRtl ? 'تاريخ التقرير: ' : 'Report Date: '}{formatDate(file.reportDate, locale)}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        {isRtl ? 'تم الرفع: ' : 'Uploaded: '}{formatDate(file.createdAt, locale)} {isRtl ? 'بواسطة' : 'by'} {file.uploadedByType === 'PATIENT' ? (isRtl ? 'المريض' : 'Patient') : (isRtl ? 'العيادة' : 'Clinic')}
                      </span>
                      {file.clinic?.name && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {isRtl ? 'العيادة: ' : 'Clinic: '}{file.clinic.name}
                        </span>
                      )}
                    </div>

                    {file.verificationStatus === 'REJECTED' && file.rejectionReason && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-100 dark:bg-red-950/20 dark:border-red-900 dark:text-red-400">
                        <strong>{isRtl ? 'سبب الرفض: ' : 'Rejection Reason: '}</strong>{file.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto mt-2 sm:mt-0">
                    {file.verificationStatus === 'PENDING_REVIEW' && file.uploadedByType === 'PATIENT' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 dark:border-red-900 dark:hover:bg-red-950/20 rounded-lg"
                        onClick={() => {
                          if (confirm(isRtl ? 'هل أنت متأكد من رغبتك في حذف هذا الملف؟' : 'Are you sure you want to delete this file?')) {
                            deleteMutation.mutate(file.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 ml-1 mr-1" />
                        {isRtl ? 'حذف الطلب' : 'Delete Request'}
                      </Button>
                    )}
                    {(file.verificationStatus === 'VERIFIED' || file.verificationStatus === 'PENDING_REVIEW') && (
                      <>
                        <Button variant="outline" size="sm" className="h-8 text-xs flex-1 sm:flex-none rounded-lg">
                          <Eye className="w-3.5 h-3.5 ml-1 mr-1" />
                          {isRtl ? 'عرض' : 'View'}
                        </Button>
                        <Button variant="default" size="sm" className="h-8 text-xs bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none rounded-lg">
                          <Download className="w-3.5 h-3.5 ml-1 mr-1" />
                          {isRtl ? 'تحميل' : 'Download'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-teal-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{isRtl ? 'لا توجد ملفات طبية بعد' : 'No medical files yet'}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
              {isRtl ? 'ستظهر هنا الروشتات والتحاليل والأشعة والتقارير الطبية التي ترفعها أنت أو تضيفها العيادة.' : 'Prescriptions, lab tests, radiology scans, and medical reports uploaded by you or the clinic will appear here.'}
            </p>
            <div className="mt-6 space-y-3">
              <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-11 px-6 shadow-sm">
                <Upload className="w-4 h-4 ml-2 mr-2" />
                {isRtl ? 'رفع أول ملف طبي' : 'Upload First Medical File'}
              </Button>
              <p className="text-xs text-slate-400 dark:text-slate-500 block">
                {isRtl ? 'سيتم إرسال الملفات التي ترفعها إلى العيادة للمراجعة قبل اعتمادها في سجلك الطبي.' : 'Files uploaded by you will be sent to the clinic for verification before appearing in your profile.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6" dir={isRtl ? 'rtl' : 'ltr'}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Upload className="w-5 h-5 text-teal-600" />
              {isRtl ? 'رفع ملف طبي' : 'Upload Medical File'}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isRtl ? 'سيتم مراجعة الملف المرفق من قبل العيادة قبل اعتماده رسمياً في سجلك الطبي' : 'The uploaded file will be reviewed by the clinic before being officially added to your record'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'نوع الملف' : 'File Type'} <span className="text-red-500">*</span></Label>
              <Select value={uploadForm.category} onValueChange={(v: string | null) => setUploadForm({ ...uploadForm, category: v || '' })}>
                <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <SelectValue placeholder={isRtl ? 'اختر نوع الملف...' : 'Select file type...'} />
                </SelectTrigger>
                <SelectContent>
                  {uploadCategories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {clinics.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'العيادة المستهدفة' : 'Target Clinic'} <span className="text-red-500">*</span></Label>
                <Select value={uploadForm.clinicId} onValueChange={(v: string | null) => setUploadForm({ ...uploadForm, clinicId: v || '' })}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={isRtl ? 'اختر العيادة...' : 'Select clinic...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {clinics.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'عنوان الملف' : 'File Title'} <span className="text-red-500">*</span></Label>
              <Input
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder={isRtl ? 'مثال: تحليل دم شامل للغدة أو أشعة صدر' : 'e.g., Complete blood count or Chest X-Ray'}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'تاريخ التقرير' : 'Report Date'}</Label>
              <Input
                type="date"
                value={uploadForm.reportDate}
                onChange={(e) => setUploadForm({ ...uploadForm, reportDate: e.target.value })}
                className="h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'ملاحظات' : 'Notes'}</Label>
              <Textarea
                value={uploadForm.notes}
                onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                placeholder={isRtl ? 'أي ملاحظات تريد إرسالها للعيادة...' : 'Any comments you wish to send to the clinic...'}
                className="rounded-xl min-h-[80px] resize-none bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-350">{isRtl ? 'اختر الملف' : 'Select File'} <span className="text-red-500">*</span></Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                className="file:bg-slate-100 dark:file:bg-slate-800 dark:file:text-slate-200 file:text-slate-700 file:border-0 file:rounded-lg file:px-3 file:py-1 file:mr-2 file:text-xs file:font-medium text-sm h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{isRtl ? 'الأنواع المسموحة: PDF, JPG, PNG (الحد الأقصى 10MB)' : 'Allowed formats: PDF, JPG, PNG (Max size: 10MB)'}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-900">
              <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)} className="rounded-xl font-medium">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending} className="rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm px-6 font-medium">
                {uploadMutation.isPending ? (isRtl ? 'جاري الرفع...' : 'Uploading...') : (isRtl ? 'رفع الملف' : 'Upload File')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
