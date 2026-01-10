import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { LegalComplianceStatus } from '@/services/legalComplianceService';

interface LegalComplianceDialogProps {
  isOpen: boolean;
  status: LegalComplianceStatus;
  onClose: () => void;
  onGoToSettings: () => void;
  actionLabel?: string;
  allowAnyway?: boolean;
  onContinueAnyway?: () => void;
}

export function LegalComplianceDialog({
  isOpen,
  status,
  onClose,
  onGoToSettings,
  actionLabel = 'Télécharger PDF',
  allowAnyway = false,
  onContinueAnyway,
}: LegalComplianceDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>Informations légales incomplètes</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-gray-700">
            Pour générer des factures conformes légalement, veuillez compléter les informations obligatoires suivantes:
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="font-semibold text-yellow-900 mb-2">
              Complétude: {status.completionPercentage}%
            </p>
            <ul className="space-y-1 text-yellow-800 text-xs">
              {status.missingFields.map((field) => (
                <li key={field} className="flex items-center gap-2">
                  <span className="text-yellow-600">○</span>
                  {field}
                </li>
              ))}
            </ul>
          </div>

          {status.warnings.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-800 font-semibold mb-1">Avertissements:</p>
              <ul className="text-xs text-blue-700 space-y-0.5">
                {status.warnings.map((warn) => (
                  <li key={warn}>• {warn}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-gray-600 text-xs italic">
            Les factures générées sans ces informations peuvent être non-conformes légalement.
          </p>
        </div>

        <DialogFooter className="gap-2 flex-col-reverse sm:flex-row">
          {allowAnyway && onContinueAnyway && (
            <Button variant="outline" onClick={onContinueAnyway} size="sm">
              {actionLabel} quand même
            </Button>
          )}
          <Button
            onClick={onGoToSettings}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Compléter maintenant
          </Button>
          <Button variant="ghost" onClick={onClose} size="sm">
            Annuler
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
