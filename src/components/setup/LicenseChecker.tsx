// components/LicenseChecker.tsx
import React, { useEffect, useState } from 'react';
import { LicenseService } from '../../services/licenseService';
import { LicenseFeatures } from '../../types/licensing';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface LicenseCheckerProps {
  children: React.ReactNode;
  requiredFeature?: keyof LicenseFeatures;
}

export function LicenseChecker({ children, requiredFeature }: LicenseCheckerProps) {
  const [licenseService] = useState(() => LicenseService.getInstance());
  const [hasAccess, setHasAccess] = useState(false);
  const [currentLicense, setCurrentLicense] = useState(licenseService.getCurrentLicense());

  useEffect(() => {
    if (!requiredFeature) {
      setHasAccess(true);
      return;
    }

    const canAccess = licenseService.canAccessFeature(requiredFeature);
    setHasAccess(canAccess);
  }, [licenseService, requiredFeature, currentLicense]);

  if (!hasAccess && requiredFeature) {
    return (
      <div className="p-6 text-center">
        <Alert className="border-orange-200 bg-orange-50 mb-4">
          <AlertDescription className="text-orange-800">
            Cette fonctionnalité nécessite une licence {getLicenseNameForFeature(requiredFeature)}.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.open('/upgrade', '_blank')}>
          Mettre à niveau
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

function getLicenseNameForFeature(feature: keyof LicenseFeatures): string {
  const featureToLicense: Record<string, string> = {
    multiCompany: 'Professionnel',
    multiCurrency: 'Professionnel',
    advancedReports: 'Professionnel',
    apiAccess: 'Entreprise',
    customBranding: 'Entreprise',
    prioritySupport: 'Professionnel',
    mobileApp: 'Starter',
    cloudBackup: 'Starter',
    auditTrail: 'Professionnel',
    customFields: 'Professionnel'
  };
  return featureToLicense[feature] || 'Professionnel';
}
