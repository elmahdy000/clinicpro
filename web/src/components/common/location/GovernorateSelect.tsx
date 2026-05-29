'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useGovernorates } from '@/hooks/useGovernorates'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface Governorate {
  id: string
  nameAr: string
  nameEn: string
}

type GovernorateSelectProps = {
  value?: string
  onChange: (governorateId: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function GovernorateSelect({
  value = '',
  onChange,
  placeholder,
  disabled,
  className = '',
}: GovernorateSelectProps) {
  const params = useParams()
  const locale = params?.locale as string
  const isRtl = locale === 'ar'

  const { data: governorates, isLoading } = useGovernorates()

  const options = (governorates || []).map((gov: Governorate) => ({
    value: gov.id,
    label: isRtl ? gov.nameAr : gov.nameEn || gov.nameAr,
  }))

  const defaultPlaceholder = isRtl ? 'اختر المحافظة' : 'Select Governorate'

  return (
    <SearchableSelect
      value={value}
      options={options}
      onChange={(v) => onChange(v || null)}
      placeholder={placeholder || defaultPlaceholder}
      searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
      disabled={disabled || isLoading}
      loading={isLoading}
      noResultsText={isRtl ? 'لا توجد نتائج' : 'No results'}
      className={className}
      rtl={isRtl}
    />
  )
}
