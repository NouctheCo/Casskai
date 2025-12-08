/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

// hooks/useLicense.ts
import { useState } from 'react';
import { LicenseService } from '../services/licenseService';
import type { LicenseFeatures, LicenseLimits, LicenseType } from '../types/licensing';

export function useLicense() {
  const [licenseService] = useState(() => LicenseService.getInstance());
  const [currentLicense, _setCurrentLicense] = useState(licenseService.getCurrentLicense());

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
