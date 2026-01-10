import React, { useMemo } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { CompanySettings } from '@/types/company-settings.types';
import { checkLegalCompliance } from '@/services/legalComplianceService';

interface ComplianceChecklistProps {
  settings: CompanySettings | null;
}

export function ComplianceChecklist({ settings }: ComplianceChecklistProps) {
  const status = useMemo(() => {
    return checkLegalCompliance(settings);
  }, [settings]);

  if (!status) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-600" />
          )}
          Conformité légale pour factures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Complétude du profil: {status.completionPercentage}%
            </span>
            <span className={`text-xs font-semibold px-2 py-1 rounded ${
              status.completionPercentage === 100
                ? 'bg-green-100 text-green-800'
                : status.completionPercentage >= 75
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {status.isComplete ? '✓ Complet' : 'À remplir'}
            </span>
          </div>
          <Progress value={status.completionPercentage} className="h-2" />
        </div>

        {status.missingFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Champs obligatoires manquants:
            </p>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {status.missingFields.map((field) => (
                <li key={field} className="flex items-center gap-2">
                  <span className="text-yellow-600">◆</span>
                  {field}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status.warnings.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Avertissements:
            </p>
            <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
              {status.warnings.map((warning) => (
                <li key={warning} className="flex items-center gap-2">
                  <span className="text-blue-600">ℹ</span>
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status.isComplete && (
          <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200 font-semibold">
              ✓ Tous les champs obligatoires sont remplis. Les factures générées seront conformes légalement.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
