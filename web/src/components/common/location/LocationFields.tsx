'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { GovernorateSelect } from './GovernorateSelect';
import { CitySelect } from './CitySelect';
import { Label } from '@/components/ui/label';

type LocationFieldsProps = {
  governorateId?: string | null;
  cityId?: string | null;
  onGovernorateChange: (governorateId: string | null) => void;
  onCityChange: (cityId: string | null) => void;
  showLabels?: boolean;
  disabled?: boolean;
  className?: string;
};

export function LocationFields({
  governorateId,
  cityId,
  onGovernorateChange,
  onCityChange,
  showLabels = true,
  disabled = false,
  className = '',
}: LocationFieldsProps) {
  const params = useParams();
  const locale = params?.locale as string;
  const isRtl = locale === 'ar';

  const handleGovernorateChange = (newGovId: string | null) => {
    onGovernorateChange(newGovId);
    onCityChange(null);
  };

  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${className}`}>
      <div className="flex flex-col">
        {showLabels && (
          <Label className="mb-1.5 text-xs font-semibold text-slate-600">
            {isRtl ? 'المحافظة' : 'Governorate'}
          </Label>
        )}
        <GovernorateSelect
          value={governorateId || undefined}
          onChange={handleGovernorateChange}
          disabled={disabled}
        />
      </div>

      <div className="flex flex-col">
        {showLabels && (
          <Label className="mb-1.5 text-xs font-semibold text-slate-600">
            {isRtl ? 'المدينة / المركز' : 'City'}
          </Label>
        )}
        <CitySelect
          governorateId={governorateId}
          value={cityId || undefined}
          onChange={onCityChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
