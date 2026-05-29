'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
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
  DialogClose,
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
  Image as ImageIcon,
  FileArchive,
  Microscope,
  ScanLine,
  Stethoscope,
  FolderOpen,
  UserRound,
  ShieldAlert,
  LayoutGrid,
  List,
  Calendar,
  Layers,
  ArrowLeftRight,
  Sparkles,
  X,
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
    case 'lab': return <Microscope className="w-5 h-5" />;
    case 'xray': return <Stethoscope className="w-5 h-5" />;
    case 'scan': return <ScanLine className="w-5 h-5" />;
    case 'report': return <FileText className="w-5 h-5" />;
    case 'prescription': return <ShieldAlert className="w-5 h-5" />;
    case 'image': return <ImageIcon className="w-5 h-5" />;
    case 'pdf': return <FileArchive className="w-5 h-5" />;
    case 'dicom': return <FolderOpen className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
}

function categoryBadgeClass(category: CategoryKey) {
  const map: Record<CategoryKey, string> = {
    all: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    lab: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/60',
    xray: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/60',
    scan: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/60',
    report: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-900/60',
    prescription: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/60',
    image: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-900/60',
    pdf: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/60',
    dicom: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/60',
    other: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  };
  return map[category];
}

function arabicFileName(file: any, category: CategoryKey) {
  const d = new Date(file.uploadedAt || file.createdAt || Date.now());
  const dateLabel = d.toLocaleDateString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${categoryLabel(category)} - ${dateLabel} - #${file.id}`;
}

// Custom authenticated Live Thumbnail Component
function FileThumbnail({ file }: { file: any }) {
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (file.fileType?.startsWith('image/')) {
      setLoading(true);
      api.get(`/upload/${file.id}/download`, { responseType: 'blob' })
        .then((res) => {
          if (!active) return;
          const mime = res.headers['content-type'] || file.fileType;
          const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
          setThumbUrl(url);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
      if (thumbUrl) {
        window.URL.revokeObjectURL(thumbUrl);
      }
    };
  }, [file.id, file.fileType]);

  if (file.fileType?.startsWith('image/')) {
    if (loading) {
      return (
        <div className="w-full h-full bg-slate-50 dark:bg-slate-900 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-5 h-5 text-slate-300 dark:text-slate-700 animate-bounce" />
        </div>
      );
    }
    if (thumbUrl) {
      return (
        <img
          src={thumbUrl}
          alt={file.fileName}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      );
    }
  }

  // Fallback to stylized category icon
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-3 text-center transition-colors duration-300 ${categoryBadgeClass(file.category)}`}>
      <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 shadow-sm border border-slate-100/50 dark:border-slate-800/30 mb-2">
        {categoryIcon(file.category)}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{file.fileName?.split('.').pop() || 'FILE'}</span>
    </div>
  );
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Layout View Mode (grid or list)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pre-upload selected file state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ['files'],
    queryFn: () => api.get('/upload').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/upload/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('تم حذف الملف بنجاح');
      if (previewOpen) {
        closePreview();
      }
    },
    onError: (e) => console.error(e),
  });

  const { data: patientResults } = useQuery({
    queryKey: ['patient-search-upload', patientSearch],
    queryFn: () => api.get('/patients', { params: { search: patientSearch, limit: 5 } }).then((r) => r.data),
    enabled: patientSearch.length > 1,
  });

  // Track pre-upload file changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (selectedFileUrl) {
      window.URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
    }
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFileUrl(window.URL.createObjectURL(file));
      }
      
      // Auto detect and set category from filename
      const name = file.name.toLowerCase();
      let detectedCat = 'other';
      if (name.includes('xray') || name.includes('x-ray') || name.includes('اشعة') || name.includes('أشعة')) {
        detectedCat = 'xray';
        setFileType('X-Ray');
      } else if (name.includes('lab') || name.includes('تحليل')) {
        detectedCat = 'lab';
        setFileType('Lab Result');
      } else if (name.includes('scan') || name.includes('سكان')) {
        detectedCat = 'scan';
        setFileType('Scan');
      } else if (name.includes('report') || name.includes('تقرير')) {
        detectedCat = 'report';
        setFileType('Report');
      } else if (name.includes('prescription') || name.includes('rosh') || name.includes('روشت')) {
        detectedCat = 'prescription';
        setFileType('Prescription');
      } else if (file.type.startsWith('image/')) {
        detectedCat = 'image';
        setFileType('Other');
      } else if (file.type.includes('pdf')) {
        detectedCat = 'pdf';
        setFileType('Other');
      } else if (name.endsWith('.dcm')) {
        detectedCat = 'dicom';
        setFileType('Other');
      }

      setUploadCategory(detectedCat);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('يرجى اختيار أو إسقاط ملف للرفع أولاً');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadPatientId) formData.append('patientId', uploadPatientId);
      if (fileNotes) formData.append('notes', fileNotes);
      if (uploadCategory) formData.append('category', uploadCategory);
      
      await api.post('/upload/medical-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      queryClient.invalidateQueries({ queryKey: ['files'] });
      toast.success('تم رفع المستند الطبي بنجاح');
      setUploadOpen(false);
      
      // Clean states
      setSelectedFile(null);
      if (selectedFileUrl) window.URL.revokeObjectURL(selectedFileUrl);
      setSelectedFileUrl(null);
      setFileNotes('');
      setFileType('Other');
      setUploadCategory('');
      setUploadPatientId('');
      setPatientSearch('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'فشل رفع المستند');
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

  const handlePreview = async (file: any) => {
    try {
      const res = await api.get(`/upload/${file.id}/download`, { responseType: 'blob' });
      const mime = res.headers['content-type'] || file.fileType;
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mime }));
      setPreviewUrl(url);
      setPreviewFile(file);
      setPreviewOpen(true);
    } catch {
      toast.error('عذراً، تعذرت معاينة الملف');
    }
  };
  
  const closePreview = () => {
    setPreviewOpen(false);
    if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  const fileList = Array.isArray(files) ? files : [];

  const decorated = useMemo(() => {
    return fileList.map((file: any) => {
      const category = detectCategory(file);
      const patientLabel = file.patient?.firstName && file.patient?.lastName
        ? `${file.patient.firstName} ${file.patient.lastName}`
        : file.patientId
          ? `المريض #${file.patientId}`
          : 'غير مرتبط بمريض';
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
        file.fileName.toLowerCase().includes(q.toLowerCase()) ||
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
    <div className="mx-auto w-full max-w-[1360px] space-y-6 px-5 py-6 lg:px-7" dir="rtl">
      {/* Immersive Background Blur Highlights */}
      <div className="absolute top-0 right-1/4 -z-10 h-72 w-72 rounded-full bg-teal-500/5 blur-[120px] dark:bg-teal-500/5" />
      <div className="absolute top-20 left-1/4 -z-10 h-72 w-72 rounded-full bg-cyan-500/5 blur-[120px] dark:bg-cyan-500/5" />

      {/* Modern Dashboard Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-3xl">سجل الملفات الطبية</h1>
            <Badge variant="outline" className="hidden sm:inline-flex bg-cyan-50/50 dark:bg-cyan-950/20 text-cyan-700 border-cyan-200 dark:text-cyan-400 dark:border-cyan-900/60 font-semibold gap-1">
              <Sparkles className="w-3 h-3 animate-pulse" /> ذكي
            </Badge>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            إدارة وأرشفة ملفات المرضى، صور الأشعة، نتائج التحاليل، والتقارير الطبية مع معاينة فورية
          </p>
        </div>

        {/* Upload File Dialog Trigger */}
        <Dialog open={uploadOpen} onOpenChange={(open) => {
          setUploadOpen(open);
          if (!open) {
            setSelectedFile(null);
            if (selectedFileUrl) window.URL.revokeObjectURL(selectedFileUrl);
            setSelectedFileUrl(null);
            setPatientSearch('');
            setUploadPatientId('');
            setFileNotes('');
            setFileType('Other');
            setUploadCategory('');
          }
        }}>
          <DialogTrigger className="inline-flex items-center justify-center h-11 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-md shadow-cyan-600/10 hover:shadow-cyan-600/20 transition-all hover:scale-[1.02] gap-2 px-5 shrink-0 self-start sm:self-center">
            <Upload className="h-4 w-4" />
            رفع ملف طبي جديد
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl max-w-[calc(100%-2rem)] w-full rounded-2xl p-6 gap-5 overflow-y-auto max-h-[90vh]">
            <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/85">
              <DialogTitle className="text-base font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Upload className="w-5 h-5 text-teal-600" />
                رفع مستند طبي جديد
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {/* Premium Drag and Drop Upload Field with Preview */}
              {selectedFile ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-4 flex items-center gap-3.5 relative shadow-sm animate-fade-in group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-950 flex items-center justify-center shadow-inner relative">
                    {selectedFileUrl ? (
                      <img src={selectedFileUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-lg">
                        {selectedFile.type.includes('pdf') ? (
                          <FileArchive className="w-7 h-7" />
                        ) : (
                          <FileText className="w-7 h-7" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate pr-1" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="font-semibold uppercase bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        {selectedFile.name.split('.').pop()}
                      </span>
                      <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setSelectedFile(null);
                      if (selectedFileUrl) window.URL.revokeObjectURL(selectedFileUrl);
                      setSelectedFileUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl h-9 w-9 p-0 flex items-center justify-center transition-colors"
                    title="حذف الملف المحدد"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/20 p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-cyan-50/10 dark:hover:bg-cyan-950/10 transition-all duration-300 group"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add('border-cyan-500', 'bg-cyan-50/10');
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50/10');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-cyan-500', 'bg-cyan-50/10');
                    const file = e.dataTransfer.files?.[0];
                    if (file && fileInputRef.current) {
                      const dataTransfer = new DataTransfer();
                      dataTransfer.items.add(file);
                      fileInputRef.current.files = dataTransfer.files;
                      handleFileChange({ target: fileInputRef.current } as any);
                    }
                  }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center mx-auto shadow-sm border border-slate-100 dark:border-slate-800 mb-3 group-hover:scale-105 transition-transform duration-300">
                    <Upload className="w-5 h-5 text-cyan-600 animate-pulse" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">اسحب الملف هنا أو انقر للتصفح</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                    يدعم الصور، PDF، ملفات وورد، إكسل، وملفات الأشعة الطبية DICOM (.dcm)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.dcm"
                  />
                </div>
              )}

              {/* Patient Association */}
              <div className="space-y-2 relative">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">ربط بمريض (اختياري)</Label>
                <div className="relative">
                  <Input
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value);
                      if (uploadPatientId) {
                        setUploadPatientId('');
                      }
                    }}
                    placeholder="ابحث باسم المريض..."
                    className="h-10 text-sm rounded-xl focus-visible:ring-cyan-500"
                  />
                  {patientSearch && !uploadPatientId && (
                    <div className="absolute left-3 top-3 w-4 h-4 rounded-full border-2 border-slate-300 border-t-cyan-500 animate-spin" />
                  )}
                </div>
                {patientSearch && !uploadPatientId && patientResults?.data && (
                  <div className="absolute z-50 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 shadow-lg max-h-40 overflow-y-auto mt-1 divide-y divide-slate-50 dark:divide-slate-800">
                    {patientResults.data.map((pat: any) => (
                      <button
                        key={pat.id}
                        type="button"
                        onClick={() => {
                          setUploadPatientId(String(pat.id));
                          setPatientSearch(`${pat.firstName} ${pat.lastName}`);
                        }}
                        className="w-full text-right px-3.5 py-2.5 text-xs rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{pat.firstName} {pat.lastName}</span>
                        <span className="text-[10px] text-slate-400">{pat.phone}</span>
                      </button>
                    ))}
                    {patientResults.data.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-3">لا توجد نتائج مطابقة</p>
                    )}
                  </div>
                )}
              </div>

              {/* Grid layout for file fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">نوع الملف</Label>
                  <Select value={fileType} onValueChange={(v: string | null) => setFileType(v ?? '')}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FILE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">التصنيف</Label>
                  <Select value={uploadCategory} onValueChange={(v: string | null) => setUploadCategory(v ?? '')}>
                    <SelectTrigger className="h-10 rounded-xl"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">ملاحظات المستند</Label>
                <Textarea
                  rows={2}
                  value={fileNotes}
                  onChange={(e) => setFileNotes(e.target.value)}
                  placeholder="أي ملاحظات أو تفاصيل حول هذا المستند الطبي..."
                  className="rounded-xl focus-visible:ring-cyan-500"
                />
              </div>

              <Button
                className="w-full h-11 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-medium shadow-md shadow-cyan-600/10 transition-all hover:shadow-cyan-600/20"
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
              >
                {uploading ? 'جارٍ رفع وتحليل الملف...' : 'رفع وحفظ الملف'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Premium Dynamic Category Overview Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:gap-4">
        {[
          { label: 'إجمالي الملفات', value: stats.total, icon: FolderOpen, color: 'text-cyan-600 bg-cyan-50 border-cyan-100 dark:bg-cyan-950/20 dark:border-cyan-900/60 dark:text-cyan-400' },
          { label: 'تحاليل مخبرية', value: stats.lab, icon: Microscope, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/60 dark:text-emerald-400' },
          { label: 'صور الأشعة', value: stats.xray, icon: Stethoscope, color: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/60 dark:text-blue-400' },
          { label: 'تقارير طبية', value: stats.report, icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/60 dark:text-violet-400' },
          { label: 'مستندات وصور', value: stats.image, icon: ImageIcon, color: 'text-pink-600 bg-pink-50 border-pink-100 dark:bg-pink-950/20 dark:border-pink-900/60 dark:text-pink-400' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/50 backdrop-blur-md hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5 shadow-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform duration-300 group-hover:scale-110 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{s.label}</p>
                  <p className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mt-0.5">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Advanced Filters Dashboard Card */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Box Wrapper */}
            <div className="flex-1">
              <SearchBox
                value={search}
                onChange={setSearch}
                placeholder="ابحث باسم المستند، المريض، الرقم التعريفي..."
              />
            </div>
            
            <div className="flex items-center justify-between gap-3 shrink-0">
              {/* Responsive Layout Mode Switcher */}
              <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 rounded-xl p-1 h-10 shadow-inner">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                  title="عرض شبكي (البطاقات)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 p-0 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-800 shadow-sm text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                  title="عرض قائمة (جدول)"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Categories Filter */}
          <div className="pt-1 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
            {(['all', 'lab', 'xray', 'scan', 'report', 'prescription', 'image', 'pdf', 'dicom', 'other'] as CategoryKey[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={categoryFilter === key ? 'default' : 'outline'}
                onClick={() => setCategoryFilter(key)}
                className={`h-8 rounded-lg text-xs transition-all ${categoryFilter === key ? 'bg-cyan-600 hover:bg-cyan-700 text-white font-semibold' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                {categoryLabel(key)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Files Display Panel */}
      <div className="transition-all duration-300">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 p-12 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
              <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">لا توجد مستندات مطابقة للبحث</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                جرّب البحث باسم مريض آخر، أو ابحث بنطاق تصنيف ملف مختلف من القائمة العلوية
              </p>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View System (Visual Previews First) */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
            {filtered.map((file: any) => (
              <div
                key={file.id}
                className="group rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col hover:-translate-y-0.5 backdrop-blur-sm"
              >
                {/* Visual Preview Header */}
                <div className="aspect-[4/3] w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden flex items-center justify-center shrink-0">
                  <FileThumbnail file={file} />
                  <div className="absolute top-2 right-2">
                    <Badge className={`text-[10px] px-2 py-0.5 shadow-sm border font-semibold ${categoryBadgeClass(file.category)}`}>
                      {categoryLabel(file.category)}
                    </Badge>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between min-w-0">
                  <div className="min-w-0 space-y-2">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors" title={file.displayName}>
                      {file.displayName}
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <UserRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{file.patientLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>رفع في: {formatDate(file.uploadedAt || file.createdAt, locale)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Bar inside Card */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1 justify-between shrink-0">
                    <div className="flex items-center gap-0.5">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
                        onClick={() => handlePreview(file)}
                        title="معاينة الملف"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/20"
                        onClick={() => handleDownload(file.id, file.fileName)}
                        title="تنزيل الملف"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={() => deleteMutation.mutate(file.id)}
                        disabled={deleteMutation.isPending}
                        title="حذف الملف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {file.patientId ? (
                      <Link href={`/${locale}/patients/${file.patientId}`}>
                        <Button size="sm" variant="ghost" className="h-7 text-[10px] rounded-lg px-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 font-semibold">
                          ملف المريض
                        </Button>
                      </Link>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] rounded-lg px-2 text-slate-300 dark:text-slate-700" disabled>
                        ملف المريض
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View System (Dense Administration Grid) */
          <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden animate-fade-in">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filtered.map((file: any) => (
                  <div key={file.id} className="p-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 transition-all duration-200">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${categoryBadgeClass(file.category)}`}>
                          {categoryIcon(file.category)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.displayName}</p>
                            <Badge variant="outline" className={`text-[10px] py-0 border font-semibold ${categoryBadgeClass(file.category)}`}>
                              {categoryLabel(file.category)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1"><UserRound className="w-3.5 h-3.5 text-slate-400" /> {file.patientLabel}</span>
                            <span>رقم الأرشيف: #{file.id}</span>
                            <span>تاريخ الرفع: {formatDate(file.uploadedAt || file.createdAt, locale)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 justify-end shrink-0">
                        <Button size="sm" variant="outline" className="h-8.5 rounded-lg text-xs gap-1 border-slate-200 dark:border-slate-800" onClick={() => handlePreview(file)}>
                          <Eye className="w-3.5 h-3.5" /> معاينة
                        </Button>
                        <Button size="sm" variant="outline" className="h-8.5 rounded-lg text-xs gap-1 border-slate-200 dark:border-slate-800" onClick={() => handleDownload(file.id, file.fileName)}>
                          <Download className="w-3.5 h-3.5" /> تنزيل
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 gap-1"
                          onClick={() => deleteMutation.mutate(file.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" /> حذف
                        </Button>
                        
                        {file.patientId ? (
                          <Link href={`/${locale}/patients/${file.patientId}`}>
                            <Button size="sm" variant="ghost" className="h-8.5 rounded-lg text-xs text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 font-semibold">
                              ملف المريض
                            </Button>
                          </Link>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-8.5 rounded-lg text-xs text-slate-300 dark:text-slate-700" disabled>
                            ملف المريض
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Advanced Fullscreen Preview Modal System */}
      <Dialog open={previewOpen} onOpenChange={(open) => !open && closePreview()}>
        <DialogContent className="sm:max-w-4xl lg:max-w-5xl w-full h-[88vh] flex flex-col p-0 overflow-hidden bg-slate-900 text-white rounded-2xl border-slate-800/80 shadow-2xl">
          <DialogHeader className="px-5 py-4 border-b border-slate-800 bg-slate-950 shrink-0 flex items-center justify-between flex-row relative">
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-100">
              <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                {previewFile && categoryIcon(previewFile.category)}
              </span>
              {previewFile?.displayName || 'معاينة المستند الطبي'}
            </DialogTitle>
            
            {/* Shift actions with pl-12 to make room for absolute close button in RTL (left-3) */}
            {previewFile && (
              <div className="flex items-center gap-2 pl-12 rtl:pl-12 rtl:pr-0">
                <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg gap-1.5 h-8.5 text-xs font-semibold animate-fade-in" onClick={() => handleDownload(previewFile.id, previewFile.fileName)}>
                  <Download className="w-3.5 h-3.5" /> تحميل المستند
                </Button>
                <Button size="sm" variant="destructive" className="rounded-lg gap-1.5 h-8.5 text-xs font-semibold" onClick={() => deleteMutation.mutate(previewFile.id)}>
                  <Trash2 className="w-3.5 h-3.5" /> حذف
                </Button>
              </div>
            )}
          </DialogHeader>
          
          <div className="flex-1 flex items-center justify-center p-4 overflow-auto bg-slate-950 relative">
            {/* Background Medical Mesh Grid for Premium Aesthetic */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            {!previewUrl ? (
              <div className="flex flex-col items-center text-slate-500">
                <div className="relative w-10 h-10 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-cyan-500 animate-spin" />
                </div>
                <p className="text-xs">جاري تحميل ومعالجة المعاينة...</p>
              </div>
            ) : previewFile?.fileType?.startsWith('image/') ? (
              <img
                src={previewUrl}
                alt={previewFile.fileName}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl transition-all duration-300 hover:scale-[1.01]"
              />
            ) : previewFile?.fileType?.includes('pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-xl border border-slate-800 shadow-2xl bg-white"
                title={previewFile.fileName}
              />
            ) : (
              /* Unsupported Browser Preview Formats */
              <div className="flex flex-col items-center text-center max-w-md bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-md">
                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                  <FileText className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-100 mb-2">لا يمكن معاينة هذا الملف مباشرة</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  صيغة الملف ({previewFile?.fileName?.split('.').pop()?.toUpperCase()}) غير مدعومة للمعاينة التفاعلية داخل المتصفح. يرجى تنزيل الملف لعرضه على جهازك.
                </p>
                <Button onClick={() => handleDownload(previewFile.id, previewFile.fileName)} className="bg-cyan-600 hover:bg-cyan-700 w-full gap-2 rounded-xl h-10 font-bold">
                  <Download className="w-4 h-4" />
                  تنزيل الملف وعرضه محلياً
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
