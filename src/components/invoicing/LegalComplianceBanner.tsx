import React from 'react';
import { AlertTriangle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalComplianceBannerProps {
  completionPercentage: number;
  onOpenSettings: () => void;
  showIfIncomplete?: boolean;
}

export function LegalComplianceBanner({
  completionPercentage,
  onOpenSettings,
  showIfIncomplete = true,
}: LegalComplianceBannerProps) {
  const isIncomplete = completionPercentage < 100;

  if (!showIfIncomplete || !isIncomplete) {
    return null;
  }

  const bgColor =
    completionPercentage < 50
      ? 'bg-red-50 border-red-200'
      : 'bg-yellow-50 border-yellow-200';

  const textColor =
    completionPercentage < 50
      ? 'text-red-800'
      : 'text-yellow-800';

  return (
    <div className={`border rounded-lg p-4 ${bgColor}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${textColor}`} />
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>
            Profil légal incomplète ({completionPercentage}%)
          </h3>
          <p className={`text-sm mt-1 ${textColor}`}>
            Les informations légales minimales sont requises pour générer des factures conformes.
            Veuillez compléter votre profil entreprise avant de créer/exporter des factures.
          </p>
        </div>
        <Button
          onClick={onOpenSettings}
          size="sm"
          variant="outline"
          className={`flex-shrink-0 ${textColor} border-current hover:bg-white`}
        >
          <Settings className="h-4 w-4 mr-2" />
          Paramètres
        </Button>
      </div>
    </div>
  );
}
