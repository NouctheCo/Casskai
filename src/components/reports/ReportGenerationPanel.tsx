/**
 * Composant de génération de rapports comptables
 * Permet de sélectionner période et générer PDF/Excel
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { reportsService } from '@/services/reportsService';
import { PDFGenerator } from '@/utils/reportGeneration';
import { logger } from '@/utils/logger';
import type {
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  GeneralLedgerData,
  PDFReportConfig,
  CompanyInfo
} from '@/utils/reportGeneration/types';
import {
  FileText,
  Download,
  Eye,
  FileSpreadsheet,
  Calendar,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface ReportGenerationPanelProps {
  reportType: 'balance_sheet' | 'income_statement' | 'trial_balance' | 'general_ledger';
  companyId: string;
  companyInfo: CompanyInfo;
}

export const ReportGenerationPanel: React.FC<ReportGenerationPanelProps> = ({
  reportType,
  companyId,
  companyInfo
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // État période
  const [periodPreset, setPeriodPreset] = useState('current-year');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [accountFilter, setAccountFilter] = useState('');

  // Configurations par type de rapport
  const reportConfig = {
    balance_sheet: {
      title: 'Bilan Comptable',
      icon: FileText,
      description: 'État patrimonial à une date donnée (Actif, Passif, Capitaux propres)',
      needsStartDate: false
    },
    income_statement: {
      title: 'Compte de Résultat',
      icon: FileText,
      description: 'Résultat sur une période (Produits - Charges)',
      needsStartDate: true
    },
    trial_balance: {
      title: 'Balance Générale',
      icon: FileText,
      description: 'Liste de tous les comptes avec débits et crédits',
      needsStartDate: false
    },
    general_ledger: {
      title: 'Grand Livre',
      icon: FileText,
      description: 'Détail de toutes les écritures comptables',
      needsStartDate: true
    }
  };

  const config = reportConfig[reportType];
  const Icon = config.icon;

  // Presets de période
  const periodPresets = [
    { value: 'current-month', label: 'Mois en cours' },
    { value: 'current-quarter', label: 'Trimestre en cours' },
    { value: 'current-year', label: 'Année en cours' },
    { value: 'previous-year', label: 'Année dernière' },
    { value: 'custom', label: 'Période personnalisée' }
  ];

  // Calculer dates selon preset
  const calculatePeriodDates = (preset: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    switch (preset) {
      case 'current-month':
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      case 'current-quarter': {
        const quarterStart = Math.floor(month / 3) * 3;
        return {
          start: new Date(year, quarterStart, 1).toISOString().split('T')[0],
          end: new Date(year, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      }
      case 'current-year':
        return {
          start: new Date(year, 0, 1).toISOString().split('T')[0],
          end: new Date(year, 11, 31).toISOString().split('T')[0]
        };
      case 'previous-year':
        return {
          start: new Date(year - 1, 0, 1).toISOString().split('T')[0],
          end: new Date(year - 1, 11, 31).toISOString().split('T')[0]
        };
      default:
        return { start: periodStart, end: periodEnd };
    }
  };

  // Handler changement preset
  const handlePresetChange = (preset: string) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      const dates = calculatePeriodDates(preset);
      setPeriodStart(dates.start);
      setPeriodEnd(dates.end);
    }
  };

  // Générer les données via RPC
  const generateReportData = async () => {
    setIsGenerating(true);
    setReportData(null);

    try {
      let result;

      switch (reportType) {
        case 'balance_sheet':
          result = await reportsService.generateBalanceSheet(companyId, periodEnd);
          break;
        case 'income_statement':
          result = await reportsService.generateIncomeStatement(companyId, periodStart, periodEnd);
          break;
        case 'trial_balance':
          result = await reportsService.generateTrialBalance(companyId, periodEnd);
          break;
        case 'general_ledger':
          result = await reportsService.generateGeneralLedger(companyId, periodStart, periodEnd, accountFilter || undefined);
          break;
      }

      if (result.error) {
        throw new Error(result.error.message);
      }

      if (!result.data) {
        throw new Error('Aucune donnée retournée');
      }

      setReportData(result.data);
      setShowPreview(true);

      toast({
        title: '✅ Rapport généré',
        description: `${config.title} généré avec succès`
      });
    } catch (error) {
      logger.error('Erreur génération rapport:', error);
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Impossible de générer le rapport',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Télécharger PDF
  const downloadPDF = () => {
    if (!reportData) return;

    try {
      const pdfConfig: PDFReportConfig = {
        title: config.title.toUpperCase(),
        subtitle: periodPreset !== 'custom'
          ? periodPresets.find(p => p.value === periodPreset)?.label
          : `Du ${formatDate(periodStart)} au ${formatDate(periodEnd)}`,
        company: companyInfo,
        period: {
          start: config.needsStartDate ? periodStart : undefined,
          end: periodEnd
        },
        footer: 'Généré par CassKai - Comptabilité intelligente',
        pageNumbers: true,
        margins: { top: 20, right: 15, bottom: 15, left: 15 }
      };

      let pdf;
      switch (reportType) {
        case 'balance_sheet':
          pdf = PDFGenerator.generateBalanceSheet(reportData as BalanceSheetData, pdfConfig);
          break;
        case 'income_statement':
          pdf = PDFGenerator.generateIncomeStatement(reportData as IncomeStatementData, pdfConfig);
          break;
        case 'trial_balance':
          pdf = PDFGenerator.generateTrialBalance(reportData as TrialBalanceData, pdfConfig);
          break;
        case 'general_ledger':
          pdf = PDFGenerator.generateGeneralLedger(reportData as GeneralLedgerData, pdfConfig);
          break;
      }

      const filename = `${reportType}_${companyInfo.name.replace(/\s+/g, '_')}_${periodEnd}.pdf`;
      pdf.save(filename);

      toast({
        title: '📥 PDF téléchargé',
        description: filename
      });
    } catch (error) {
      logger.error('Erreur téléchargement PDF:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de télécharger le PDF',
        variant: 'destructive'
      });
    }
  };

  // Télécharger Excel (TODO: Implémenter)
  const downloadExcel = () => {
    toast({
      title: '⏳ Fonctionnalité en cours',
      description: 'Export Excel bientôt disponible',
      variant: 'default'
    });
  };

  // Formater date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* En-tête */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Sélection période */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Période</Label>
              <Select value={periodPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodPresets.map(preset => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {config.needsStartDate && (
              <div className="space-y-2">
                <Label>Date de début</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="date"
                    value={periodStart}
                    onChange={(e) => {
                      setPeriodStart(e.target.value);
                      setPeriodPreset('custom');
                    }}
                    className="pl-10"
                    disabled={periodPreset !== 'custom'}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{config.needsStartDate ? 'Date de fin' : 'Date'}</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => {
                    setPeriodEnd(e.target.value);
                    setPeriodPreset('custom');
                  }}
                  className="pl-10"
                  disabled={periodPreset !== 'custom'}
                />
              </div>
            </div>
          </div>

          {/* Filtre compte (Grand Livre uniquement) */}
          {reportType === 'general_ledger' && (
            <div className="space-y-2">
              <Label>Filtre compte (optionnel)</Label>
              <Input
                placeholder="Ex: 411% pour tous les clients, ou 512000 pour un compte spécifique"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Utilisez % comme joker (ex: 6% pour toutes les charges)
              </p>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={generateReportData}
              disabled={isGenerating || (config.needsStartDate && !periodStart)}
              className="flex-1 sm:flex-none"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Générer & Aperçu
                </>
              )}
            </Button>

            {reportData && (
              <>
                <Button
                  onClick={downloadPDF}
                  variant="default"
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger PDF
                </Button>

                <Button
                  onClick={downloadExcel}
                  variant="outline"
                  className="flex-1 sm:flex-none"
                >
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Exporter Excel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Aperçu des données */}
      {reportData && showPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Aperçu du rapport
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-xs">
                {JSON.stringify(reportData, null, 2)}
              </pre>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Cliquez sur "Télécharger PDF" pour obtenir le rapport formaté professionnellement
            </p>
          </CardContent>
        </Card>
      )}

      {/* État vide */}
      {!reportData && !isGenerating && (
        <Card className="border-dashed">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              Aucun rapport généré
            </p>
            <p className="text-sm text-gray-500">
              Sélectionnez une période et cliquez sur "Générer & Aperçu"
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};
