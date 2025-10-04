// hooks/useLicense.ts
import { useState, useEffect } from 'react';

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
