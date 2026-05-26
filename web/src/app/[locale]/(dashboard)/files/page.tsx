'use client';

import { useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBox } from '@/components/common/SearchBox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Upload,
  FileText,
  Search,
  Eye,
  Download,
  Trash2,
  Image,
  FileArchive,
  Microscope,
  ScanLine,
  Stethoscope,
  FolderOpen,
  UserRound,
  ShieldAlert,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

const FILE_TYPE_OPTIONS = [
  { value: 'Lab Result', label: 'تحليل' },
  { value: 'X-Ray', label: 'أشعة' },
  { value: 'Scan', label: 'سكان' },
  { value: 'Report', label: 'تقرير' },
  { value: 'Prescription', label: 'روشتة' },
  { value: 'Other', label: 'أخرى' },
];

type CategoryKey = 'all' | 'lab' | 'xray' | 'scan' | 'report' | 'prescription' | 'image' | 'pdf' | 'dicom' | 'other';

const normalizeText = (v?: string | null) => (v || '').toLowerCase();

function detectCategory(file: any): CategoryKey {
  const mime = normalizeText(file.fileType);
  const name = normalizeText(file.fileName);

  if (mime.includes('dicom') || name.endsWith('.dcm')) return 'dicom';
  if (name.includes('xray') || name.includes('x-ray') || name.includes('اشعة') || name.includes('أشعة')) return 'xray';
  if (name.includes('lab') || name.includes('تحليل')) return 'lab';
  if (name.includes('scan') || name.includes('سكان')) return 'scan';
  if (name.includes('report') || name.includes('تقرير')) return 'report';
  if (name.includes('prescription') || name.includes('rosh') || name.includes('روشت')) return 'prescription';
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('pdf')) return 'pdf';
  return 'other';
}

function categoryLabel(category: CategoryKey) {
  const labels: Record<CategoryKey, string> = {
    all: 'الكل',
    lab: 'تحليل',
    xray: 'أشعة',
    scan: 'سكان',
    report: 'تقرير',
    prescription: 'روشتة',
    image: 'صورة',
    pdf: 'PDF',
    dicom: 'DICOM',
    other: 'أخرى',
  };
  return labels[category];
}

function categoryIcon(category: CategoryKey) {
  switch (category) {
    case 'lab': return <Microscope className="w-4 h-4" />;
    case 'xray': return <Stethoscope className="w-4 h-4" />;
    case 'scan': return <ScanLine className="w-4 h-4" />;
    case 'report': return <FileText className="w-4 h-4" />;
    case 'prescription': return <ShieldAlert className="w-4 h-4" />;
    case 'image': return <Image className="w-4 h-4" />;
    case 'pdf': return <FileArchive className="w-4 h-4" />;
    case 'dicom': return <FolderOpen className="w-4 h-4" />;
    default: return <FileText className="w-4 h-4" />;
  }
}

function categoryBadgeClass(category: CategoryKey) {
  const map: Record<CategoryKey, string> = {
    all: 'bg-slate-100 text-slate-700 border-slate-200',
    lab: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    xray: 'bg-blue-50 text-blue-700 border-blue-200',
    scan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    report: 'bg-violet-50 text-violet-700 border-violet-200',
    prescription: 'bg-amber-50 text-amber-700 border-amber-200',
    image: 'bg-pink-50 text-pink-700 border-pink-200',
    pdf: 'bg-rose-50 text-rose-700 border-rose-200',
    dicom: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    other: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[category];
}

function arabicFileName(file: any, category: CategoryKey) {
  const d = new Date(file.uploadedAt || file.createdAt || Date.now());
  const dateLabel = d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${categoryLabel(category)} - ${dateLabel} - #${file.id}`;
}

export default function FilesPage() {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [fileType, setFileType] = useState('Other');
  const [fileNotes, setFileNotes] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadPatientId, setUploadPatientId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryKey>('all');

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => api.get('/upload').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/upload/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('تم حذف الملف');
    },
    onError: () => toast.error('فشل حذف الملف'),
  });

  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-upload', patientSearch],
    queryFn: () => api.get('/patients', { params: { search: patientSearch, limit: 5 } }).then((r) => r.data),
    enabled: patientSearch.length > 1,
  });

  const handleUpload = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.length) {
      toast.error('اختر ملفًا أولًا');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      if (uploadPatientId) formData.append('patientId', uploadPatientId);
      if (fileNotes) formData.append('notes', fileNotes);
      if (uploadCategory) formData.append('category', uploadCategory);
      await api.post('/upload/medical-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('تم رفع الملف بنجاح');
      setUploadOpen(false);
      fileInput.value = '';
      setFileNotes('');
      setFileType('Other');
      setUploadCategory('');
      setUploadPatientId('');
      setPatientSearch('');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل رفع الملف');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (id: number, fileName: string) => {
    try {
      const res = await api.get(`/upload/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('فشل تنزيل الملف');
    }
  };

  const handlePreview = async (id: number) => {
    try {
      const res = await api.get(`/upload/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error('تعذرت المعاينة');
    }
  };

  const fileList = Array.isArray(files) ? files : [];

  const decorated = useMemo(() => {
    return fileList.map((file: any) => {
      const category = detectCategory(file);
      const patientLabel = file.patient?.firstName && file.patient?.lastName
        ? `${file.patient.firstName} ${file.patient.lastName}`
        : file.patientId
          ? `المريض #${file.patientId}`
          : 'غير مرتبط';
      return {
        ...file,
        category,
        patientLabel,
        displayName: arabicFileName(file, category),
      };
    });
  }, [fileList]);

  const filtered = useMemo(() => {
    return decorated.filter((file: any) => {
      const q = search.trim();
      const matchesSearch =
        !q ||
        file.displayName.includes(q) ||
        file.patientLabel.includes(q) ||
        String(file.id).includes(q);
      const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [decorated, search, categoryFilter]);

  const stats = useMemo(() => {
    const total = decorated.length;
    const lab = decorated.filter((f: any) => f.category === 'lab').length;
    const xray = decorated.filter((f: any) => f.category === 'xray').length;
    const report = decorated.filter((f: any) => f.category === 'report').length;
    const image = decorated.filter((f: any) => f.category === 'image').length;
    return { total, lab, xray, report, image };
  }, [decorated]);

  return (
    <div className="mx-auto w-full max-w-[1360px] space-y-5 px-5 py-6 lg:px-7" dir="rtl">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">الملفات</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            إدارة ملفات المرضى والتحاليل والأشعة والتقارير الطبية
          </p>
        </div>

        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-cyan-600 text-white hover:bg-cyan-700 h-11 px-4">
            <Upload className="h-4 w-4" />
            رفع ملف
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>رفع ملف</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-3">
              <div
                className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-7 text-center cursor-pointer hover:border-cyan-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600">اسحب الملف هنا أو اختر من الجهاز</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.dcm"
                />
              </div>
              <div className="space-y-2">
                <Label>ربط بمريض (اختياري)</Label>
                <Input
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="ابحث باسم المريض..."
                  className="h-9 text-sm"
                />
                {patientSearch && patientResults?.data && (
                  <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 max-h-40 overflow-y-auto mt-1">
                    {patientResults.data.map((pat: any) => (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => { setUploadPatientId(String(pat.id)); setPatientSearch(`${pat.firstName} ${pat.lastName}`); }}
                        className={`w-full text-right px-3 py-2 text-sm rounded-md hover:bg-teal-50 dark:hover:bg-teal-950/30 transition-colors ${uploadPatientId === String(pat.id) ? 'bg-teal-50 dark:bg-teal-950/30 font-semibold' : ''}`}
                      >
                        {pat.firstName} {pat.lastName} - {pat.phone}
                      </button>
                    ))}
                    {patientResults.data.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-2">لا توجد نتائج</p>
                    )}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>نوع الملف</Label>
                <Select defaultValue="Other" onValueChange={(v: string | null) => setFileType(v ?? '')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FILE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التصنيف (اختياري)</Label>
                <Select value={uploadCategory} onValueChange={(v: string | null) => setUploadCategory(v ?? '')}>
                  <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lab">تحليل</SelectItem>
                    <SelectItem value="xray">أشعة</SelectItem>
                    <SelectItem value="scan">سكان</SelectItem>
                    <SelectItem value="report">تقرير</SelectItem>
                    <SelectItem value="prescription">روشتة</SelectItem>
                    <SelectItem value="image">صورة</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="dicom">DICOM</SelectItem>
                    <SelectItem value="other">أخرى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea rows={2} value={fileNotes} onChange={(e) => setFileNotes(e.target.value)} placeholder="أي ملاحظات عن الملف..." />
              </div>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'جارٍ الرفع...' : 'رفع الملف'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'إجمالي الملفات', value: stats.total, icon: FolderOpen, cls: 'bg-slate-50 text-slate-700' },
          { label: 'تحاليل', value: stats.lab, icon: Microscope, cls: 'bg-emerald-50 text-emerald-700' },
          { label: 'أشعة', value: stats.xray, icon: Stethoscope, cls: 'bg-blue-50 text-blue-700' },
          { label: 'تقارير', value: stats.report, icon: FileText, cls: 'bg-violet-50 text-violet-700' },
          { label: 'صور', value: stats.image, icon: Image, cls: 'bg-pink-50 text-pink-700' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200/80 dark:border-slate-800/80">
              <CardContent className="p-3.5">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.cls}`}><Icon className="w-4 h-4" /></div>
                  <div>
                    <p className="text-[11px] text-slate-500">{s.label}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800/80">
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="ابحث باسم الملف أو المريض أو رقم الملف"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'lab', 'xray', 'scan', 'report', 'prescription', 'image', 'pdf', 'dicom', 'other'] as CategoryKey[]).map((key) => (
                <Button
                  key={key}
                  size="sm"
                  variant={categoryFilter === key ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(key)}
                  className={`h-8 rounded-lg text-xs ${categoryFilter === key ? 'bg-cyan-600 hover:bg-cyan-700' : ''}`}
                >
                  {categoryLabel(key)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-medium">لا توجد ملفات مطابقة</p>
              <p className="text-xs mt-1">جرّب البحث بكلمة مختلفة أو غيّر نوع الملف</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((file: any) => (
                <div key={file.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${categoryBadgeClass(file.category)}`}>
                        {categoryIcon(file.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{file.displayName}</p>
                          <Badge variant="outline" className={`text-[11px] ${categoryBadgeClass(file.category)}`}>{categoryLabel(file.category)}</Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1"><UserRound className="w-3 h-3" /> {file.patientLabel}</span>
                          <span>رقم الملف: #{file.id}</span>
                          <span>تاريخ الرفع: {formatDate(file.uploadedAt || file.createdAt, locale)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 justify-end">
                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" onClick={() => handlePreview(file.id)}>
                        <Eye className="w-3.5 h-3.5" /> معاينة
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs gap-1" onClick={() => handleDownload(file.id, file.fileName)}>
                        <Download className="w-3.5 h-3.5" /> تنزيل
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs text-red-600 hover:bg-red-50" onClick={() => deleteMutation.mutate(file.id)}>
                        <Trash2 className="w-3.5 h-3.5" /> حذف
                      </Button>
                      {file.patientId ? (
                        <Link href={`/${locale}/patients/${file.patientId}`}>
                          <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs">ملف المريض</Button>
                        </Link>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 rounded-lg text-xs" disabled>
                          ملف المريض
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
