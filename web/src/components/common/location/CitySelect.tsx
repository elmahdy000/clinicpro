'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useCities } from '@/hooks/useCities'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface City {
  id: string
  nameAr: string
  nameEn: string
}

type CitySelectProps = {
  governorateId?: string | null
  value?: string
  onChange: (cityId: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function CitySelect({
  governorateId,
  value = '',
  onChange,
  placeholder,
  disabled,
  className = '',
}: CitySelectProps) {
  const params = useParams()
  const locale = params?.locale as string
  const isRtl = locale === 'ar'

  const { data: cities, isLoading } = useCities(governorateId)

  const options = (cities || []).map((city: City) => ({
    value: city.id,
    label: isRtl ? city.nameAr : city.nameEn || city.nameAr,
  }))

  const hasCities = !isLoading && (cities || []).length > 0
  const isDisabled = disabled || !governorateId || isLoading
  const defaultPlaceholder = !governorateId
    ? (isRtl ? 'اختر المحافظة أولًا' : 'Select Governorate first')
    : isLoading
    ? (isRtl ? 'جارٍ تحميل المدن...' : 'Loading cities...')
    : !hasCities
    ? (isRtl ? 'لا توجد مدن متاحة' : 'No cities available')
    : (isRtl ? 'اختر المدينة' : 'Select City')
  const noCitiesText = isRtl ? 'لا توجد مدن متاحة' : 'No cities available'

  return (
    <SearchableSelect
      value={value}
      options={options}
      onChange={(v) => onChange(v || null)}
      placeholder={placeholder || defaultPlaceholder}
      searchPlaceholder={isRtl ? 'ابحث...' : 'Search...'}
      disabled={isDisabled}
      loading={isLoading}
      noResultsText={noCitiesText}
      className={className}
      rtl={isRtl}
    />
  )
}
