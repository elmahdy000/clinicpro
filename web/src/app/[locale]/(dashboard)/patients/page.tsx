'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBox } from '@/components/common/SearchBox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, Eye, Calendar, Stethoscope } from 'lucide-react';
import { formatDate } from '@/lib/utils';

const genderBadge = (gender: string) => {
  if (gender === 'Male') return 'ذكر';
  if (gender === 'Female') return 'أنثى';
  return '-';
};


export default function PatientsPage() {
  const t = useTranslations('patients');
  const tc = useTranslations('common');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => api.get('/patients', { params: { search, limit: 20 } }).then((r) => r.data),
  });

  const patients = data?.data || [];

  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-5 animate-fade-in" dir={isRtl ? 'rtl' : 'ltr'}>
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-right">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('subtitle')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center w-full lg:w-auto">
              <div className="w-full sm:w-[320px]">
                <SearchBox
                  placeholder={t('searchPatients')}
                  value={search}
                  onChange={setSearch}
                />
              </div>
              <Link href={`/${locale}/patients/new`} className="shrink-0">
                <Button className="h-10 w-full sm:w-auto bg-teal-600 hover:bg-teal-700 rounded-lg gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>{t('addNew')}</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-12 text-slate-500 animate-fade-in">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">{t('noPatientsFound')}</p>
            </div>
          ) : (
            <Table className="min-w-[1000px] table-fixed">
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900/60">
                  <TableHead className="w-[90px] text-center">{t('patientCode')}</TableHead>
                  <TableHead className="w-[260px] text-right">{t('name')}</TableHead>
                  <TableHead className="w-[150px] text-center">{tc('phone')}</TableHead>
                  <TableHead className="w-[130px] text-center">{t('age')}</TableHead>
                  <TableHead className="w-[110px] text-center">{t('gender')}</TableHead>
                  <TableHead className="w-[110px] text-center">{t('bloodGroup')}</TableHead>
                  <TableHead className="w-[130px] text-center">{t('lastVisit')}</TableHead>
                  <TableHead className="w-[160px] text-center">{tc('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((p: any, i: number) => {
                  const age = p.dateOfBirth
                    ? Math.floor((Date.now() - new Date(p.dateOfBirth).getTime()) / 31557600000)
                    : null;
                  const lastAppt = p.appointments?.length ? p.appointments[p.appointments.length - 1] : null;

                  return (
                    <TableRow
                      key={p.id}
                      className="hover:bg-teal-50/40 dark:hover:bg-teal-950/20 transition-colors duration-150"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <TableCell className="align-middle text-center">
                        <span className="inline-flex items-center justify-center font-mono text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">#{p.id}</span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center justify-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                            {p.firstName?.[0]}{p.lastName?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{p.firstName} {p.lastName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-center text-sm font-mono text-slate-700 dark:text-slate-300">{p.phone || '-'}</TableCell>
                      <TableCell className="align-middle text-center">
                        {age !== null ? (
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">{age}</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <Badge variant="outline" className="inline-flex text-[11px] rounded-full border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          {genderBadge(p.gender)}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <Badge variant="outline" className="inline-flex font-mono text-[11px] rounded-full border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
                          {p.bloodGroup || '-'}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle text-center text-sm text-slate-600 dark:text-slate-300">
                        {lastAppt ? formatDate(lastAppt.appointmentDate, locale) : '-'}
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/${locale}/patients/${p.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-teal-700 hover:bg-teal-50 dark:text-slate-300 dark:hover:bg-teal-950/30">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/${locale}/appointments/new?patientId=${p.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-blue-950/30">
                              <Calendar className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <Link href={`/${locale}/visits/new?patientId=${p.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-violet-700 hover:bg-violet-50 dark:text-slate-300 dark:hover:bg-violet-950/30">
                              <Stethoscope className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
