'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Search, Globe, UserPlus, FileText } from 'lucide-react';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useLocale } from 'next-intl';

export function GlobalPatientSearch() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState('');

  const { data: results, isLoading } = useQuery({
    queryKey: ['global-search', searchTrigger],
    queryFn: () => api.get('/patients/global-search', { params: { query: searchTrigger } }).then((res) => res.data),
    enabled: !!searchTrigger && searchTrigger.length >= 3,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      setSearchTrigger(query.trim());
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:hover:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-800">
            <Globe className="w-4 h-4" />
            <span>{isRtl ? 'بحث في السجل العام (EMR)' : 'Global EMR Search'}</span>
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto" dir={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Globe className="w-5 h-5 text-indigo-600" />
            {isRtl ? 'البحث الشامل عن مريض (EMR)' : 'Global Patient Search'}
          </DialogTitle>
          <DialogDescription>
            {isRtl ? 'ابحث برقم التليفون أو الرقم القومي للوصول للسجل الطبي للمريض من أي عيادة.' : 'Search by phone or National ID to access medical history across all clinics.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSearch} className="flex items-center gap-3 mt-2">
          <div className="relative flex-1">
            <Search className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isRtl ? 'رقم التليفون أو الرقم القومي...' : 'Phone or National ID...'}
              className={`${isRtl ? 'pr-9' : 'pl-9'} bg-gray-50`}
            />
          </div>
          <Button type="submit" disabled={query.length < 3}>
            {tc('search')}
          </Button>
        </form>

        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : results?.length > 0 ? (
            <div className="space-y-4">
              {results.map((patient: any) => (
                <div key={patient.id} className="p-4 border rounded-xl bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-lg">{patient.firstName} {patient.lastName}</h4>
                      <p className="text-sm text-gray-500">{patient.phone} • {patient.gender === 'Male' ? (isRtl ? 'ذكر' : 'Male') : (isRtl ? 'أنثى' : 'Female')}</p>
                    </div>
                    <Link href={`/${locale}/patients/${patient.id}`} onClick={() => setOpen(false)}>
                      <Button size="sm" variant="secondary" className="gap-2">
                        <FileText className="w-4 h-4" />
                        {isRtl ? 'عرض السجل' : 'View Record'}
                      </Button>
                    </Link>
                  </div>
                  
                  {patient.clinics?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {patient.clinics.map((c: any) => (
                        <Badge key={c.clinic.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {c.clinic.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{isRtl ? 'تاريخ مرضي:' : 'Medical Hist:'} </span>
                      {patient.medicalHistory || '-'}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{isRtl ? 'الرقم القومي:' : 'National ID:'} </span>
                      {patient.nationalId || '-'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : searchTrigger ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p>{isRtl ? 'لا يوجد مريض مسجل بهذا الرقم في النظام.' : 'No patient found with this number in the system.'}</p>
              <Link href={`/${locale}/patients/new`} onClick={() => setOpen(false)}>
                <Button className="mt-4 gap-2">
                  <UserPlus className="w-4 h-4" />
                  {t('addNew')}
                </Button>
              </Link>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
