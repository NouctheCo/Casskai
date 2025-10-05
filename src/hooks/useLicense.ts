// hooks/useLicense.ts
import { useState, useEffect } from 'react';
import { LicenseService } from '../services/licenseService';
import type { LicenseFeatures, LicenseLimits, LicenseType } from '../types/licensing';

export function useLicense() {
  const [licenseService] = useState(() => LicenseService.getInstance());
  const [currentLicense, setCurrentLicense] = useState(licenseService.getCurrentLicense());

  const canAccess = (feature: keyof LicenseFeatures): boolean => {
    return licenseService.canAccessFeature(feature);
  };

  const isWithinLimit = (limit: keyof LicenseLimits, currentValue: number): boolean => {
    return licenseService.isWithinLimit(limit, currentValue);
  };

  const getAvailablePlans = (): LicenseType[] => {
    return licenseService.getLicensePlans();
  };

  return {
    currentLicense,
    canAccess,
    isWithinLimit,
    getAvailablePlans
  };
}
