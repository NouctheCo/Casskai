/**
 * Composant Empty State pour les rapports sans données
 * Affiche un message convivial avec des actions suggérées
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  AlertCircle,
  Plus,
  BookOpen,
  TrendingUp
} from 'lucide-react';

interface EmptyReportStateProps {
  reportType?: string;
  reportName?: string;
  message?: string;
  onCreateEntry?: () => void;
  onViewDocs?: () => void;
}

export default function EmptyReportState({
  reportType,
  reportName = 'ce rapport',
  message,
  onCreateEntry,
  onViewDocs
}: EmptyReportStateProps) {
  // Messages personnalisés par type de rapport
  const getCustomMessage = () => {
    if (message) return message;

    switch (reportType) {
      case 'balance_sheet':
        return 'Le bilan ne peut pas être généré car aucune écriture comptable n\'a été enregistrée pour cette période.';
      case 'income_statement':
        return 'Le compte de résultat ne peut pas être généré car aucune écriture de produits ou charges n\'a été trouvée.';
      case 'trial_balance':
        return 'La balance générale ne peut pas être générée car aucun compte n\'a de mouvements pour cette période.';
      case 'general_ledger':
        return 'Le grand livre ne peut pas être généré car aucune écriture comptable n\'existe pour cette période.';
      case 'cash_flow':
        return 'Le tableau de flux de trésorerie ne peut pas être généré sans données de trésorerie.';
      case 'vat_report':
        return 'La déclaration TVA ne peut pas être générée car aucune opération assujettie à la TVA n\'a été trouvée.';
      default:
        return `Aucune donnée disponible pour générer ${reportName} sur la période sélectionnée.`;
    }
  };

  return (
    <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
      <CardContent className="flex flex-col items-center justify-center py-12 px-6">
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-gray-400 dark:text-gray-600" />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
          Aucune donnée disponible
        </h3>

        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
          {getCustomMessage()}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          {onCreateEntry && (
            <Button
              onClick={onCreateEntry}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une écriture comptable</span>
            </Button>
          )}

          {onViewDocs && (
            <Button
              variant="outline"
              onClick={onViewDocs}
              className="flex items-center space-x-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Consulter la documentation</span>
            </Button>
          )}

          {!onCreateEntry && !onViewDocs && (
            <Button
              variant="outline"
              className="flex items-center space-x-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Sélectionner une autre période</span>
            </Button>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p className="flex items-center justify-center space-x-2">
            <span>💡</span>
            <span>
              Astuce : Assurez-vous d'avoir des écritures comptables enregistrées pour la période choisie
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
