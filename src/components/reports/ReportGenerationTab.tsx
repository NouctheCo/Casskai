/**
 * Report Generation Tab
 * Onglet de génération de rapports avec sauvegarde automatique
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Plus, Download, FileText, TrendingUp, BarChart3, Calculator,
  Clock, RefreshCw, Calendar, Settings, AlertCircle
} from 'lucide-react';
import { reportGenerationService, type ReportFilters } from '@/services/reportGenerationService';
import { reportArchiveService } from '@/services/reportArchiveService';
import { DEFAULT_REPORT_TEMPLATES } from '@/data/reportTemplates';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { format, startOfYear, endOfYear } from 'date-fns';

interface ReportGenerationTabProps {
  companyId: string;
  refreshTrigger?: number;
  onReportGenerated?: () => void;
}

type ReportType = 'balance_sheet' | 'income_statement' | 'trial_balance' | 'general_ledger' | 'vat_report';

export function ReportGenerationTab({ companyId, refreshTrigger, onReportGenerated }: ReportGenerationTabProps) {
  const { currentCompany } = useAuth();
  const { showToast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedReportType, setSelectedReportType] = useState<ReportType | 'all'>('all');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [reportNotes, setReportNotes] = useState('');

  const accountingReports = [
    {
      type: 'balance_sheet' as ReportType,
      name: 'Bilan comptable',
      description: 'Situation patrimoniale - Actifs et Passifs',
      icon: BarChart3,
      color: 'blue',
      category: 'États de synthèse',
      compliance: 'PCG, IFRS',
      estimatedTime: '2-3 min'
    },
    {
      type: 'income_statement' as ReportType,
      name: 'Compte de résultat',
      description: 'Produits et charges de la période',
      icon: TrendingUp,
      color: 'green',
      category: 'États de synthèse',
      compliance: 'PCG, IFRS',
      estimatedTime: '2-3 min'
    },
    {
      type: 'trial_balance' as ReportType,
      name: 'Balance générale',
      description: 'Balance de tous les comptes',
      icon: Calculator,
      color: 'orange',
      category: 'Contrôles comptables',
      compliance: 'PCG',
      estimatedTime: '1-2 min'
    },
    {
      type: 'general_ledger' as ReportType,
      name: 'Grand livre',
      description: 'Détail des mouvements par compte',
      icon: FileText,
      color: 'indigo',
      category: 'Livres comptables',
      compliance: 'PCG',
      estimatedTime: '5-8 min'
    },
    {
      type: 'vat_report' as ReportType,
      name: 'Déclaration TVA',
      description: 'Rapport TVA collectée et déductible',
      icon: Calculator,
      color: 'yellow',
      category: 'Fiscalité',
      compliance: 'DGFiP',
      estimatedTime: '4-5 min'
    }
  ];

  const getPeriodDates = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'current-month':
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      case 'current-quarter': {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          start: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
          end: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      }
      case 'current-year':
        return {
          start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          end: new Date(currentYear, 11, 31).toISOString().split('T')[0]
        };
      case 'last-month': {
        const lastMonth = currentMonth - 1;
        const year = lastMonth < 0 ? currentYear - 1 : currentYear;
        const month = lastMonth < 0 ? 11 : lastMonth;
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      }
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate
        };
      default:
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
    }
  };

  const handleGenerateReport = async (reportType: ReportType, reportName: string) => {
    setIsGenerating(reportType);
    console.log('[ReportGeneration] Starting report generation:', { reportType, reportName });

    try {
      const periodDates = getPeriodDates(selectedPeriod);
      console.log('[ReportGeneration] Period dates:', periodDates);

      if (selectedPeriod === 'custom' && (!customStartDate || !customEndDate)) {
        console.log('[ReportGeneration] Missing custom dates');
        showToast('Veuillez sélectionner les dates de début et fin', 'error');
        setIsGenerating(null);
        return;
      }

      if (!currentCompany?.id) {
        console.error('[ReportGeneration] No company selected');
        throw new Error('Aucune entreprise sélectionnée');
      }

      console.log('[ReportGeneration] Company ID:', currentCompany.id);

      const filters: ReportFilters = {
        companyId: currentCompany.id,
        startDate: periodDates.start,
        endDate: periodDates.end
      };

      const exportOptions = {
        format: 'pdf' as const,
        title: `${reportName} - ${selectedPeriod}`,
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address,
          phone: currentCompany.phone,
          email: currentCompany.email
        }
      };

      // Générer le rapport
      console.log('[ReportGeneration] Generating report with filters:', filters);
      let downloadUrl: string;
      switch (reportType) {
        case 'balance_sheet':
          console.log('[ReportGeneration] Calling generateBalanceSheet...');
          downloadUrl = await reportGenerationService.generateBalanceSheet(filters, exportOptions);
          break;
        case 'income_statement':
          console.log('[ReportGeneration] Calling generateIncomeStatement...');
          downloadUrl = await reportGenerationService.generateIncomeStatement(filters, exportOptions);
          break;
        case 'trial_balance':
          console.log('[ReportGeneration] Calling generateTrialBalance...');
          downloadUrl = await reportGenerationService.generateTrialBalance(filters, exportOptions);
          break;
        case 'general_ledger':
          console.log('[ReportGeneration] Calling generateGeneralLedger...');
          downloadUrl = await reportGenerationService.generateGeneralLedger(filters, exportOptions);
          break;
        default:
          throw new Error('Type de rapport non supporté');
      }
      console.log('[ReportGeneration] Report generated, download URL:', downloadUrl);

      // Sauvegarder dans la base de données
      console.log('[ReportGeneration] Saving report to database...');
      const fiscalYear = new Date(periodDates.start).getFullYear();
      const saveResult = await reportArchiveService.createGeneratedReport({
        company_id: currentCompany.id,
        report_name: `${reportName} - ${format(new Date(periodDates.start), 'MMM yyyy')}`,
        report_type: reportType,
        report_format: 'detailed',
        period_start: periodDates.start,
        period_end: periodDates.end,
        fiscal_year: fiscalYear,
        status: 'generated',
        file_url: downloadUrl,
        file_path: downloadUrl,
        file_format: 'pdf',
        generated_by: currentCompany.id, // TODO: use actual user ID
        generated_at: new Date().toISOString(),
        generation_config: {
          period: selectedPeriod,
          filters,
          options: exportOptions
        },
        notes: reportNotes || undefined,
        tags: [reportType, `FY${fiscalYear}`, selectedPeriod]
      });

      if (!saveResult.success) {
        console.error('[ReportGeneration] Failed to save report metadata:', saveResult.error);
        // Continue anyway - le fichier est généré
      } else {
        console.log('[ReportGeneration] Report saved successfully to database');
      }

      // Télécharger automatiquement
      if (downloadUrl) {
        console.log('[ReportGeneration] Triggering download...');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportName}_${format(new Date(), 'yyyyMMdd')}.pdf`;
        link.click();
      }

      console.log('[ReportGeneration] Showing success toast...');
      showToast('Rapport généré avec succès', 'success');
      console.log('[ReportGeneration] Success toast shown');

      // Réinitialiser les notes
      setReportNotes('');

      // Notifier le parent
      if (onReportGenerated) {
        onReportGenerated();
      }

    } catch (error) {
      console.error('[ReportGeneration] Error generating report:', error);
      console.error('[ReportGeneration] Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      showToast("Impossible de générer le rapport. Veuillez réessayer.", 'error');
    } finally {
      console.log('[ReportGeneration] Cleaning up, setting isGenerating to null');
      setIsGenerating(null);
    }
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      gray: 'from-gray-500 to-gray-600',
      indigo: 'from-indigo-500 to-indigo-600',
      yellow: 'from-yellow-500 to-yellow-600'
    };
    return colors[color] || colors.blue;
  };

  const filteredReports = selectedReportType === 'all'
    ? accountingReports
    : accountingReports.filter(r => r.type === selectedReportType);

  return (
    <div className="space-y-6">
      {/* Filtres et configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration de génération</CardTitle>
          <CardDescription>Sélectionnez la période et les paramètres</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Période d'analyse</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Mois en cours</SelectItem>
                  <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
                  <SelectItem value="current-year">Année en cours</SelectItem>
                  <SelectItem value="last-month">Mois dernier</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Filtrer par type</label>
              <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v as ReportType | 'all')}>
                <SelectTrigger>
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rapports</SelectItem>
                  <SelectItem value="balance_sheet">Bilan comptable</SelectItem>
                  <SelectItem value="income_statement">Compte de résultat</SelectItem>
                  <SelectItem value="trial_balance">Balance générale</SelectItem>
                  <SelectItem value="general_ledger">Grand livre</SelectItem>
                  <SelectItem value="vat_report">Déclaration TVA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedPeriod === 'custom' && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Date de début</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date de fin</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-2 block">Notes (optionnel)</label>
            <Textarea
              placeholder="Ajouter des notes ou commentaires pour ce rapport..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grille des rapports */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.type} className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getColorClasses(report.color)} flex items-center justify-center shadow-md`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <Badge variant="outline" className="text-xs">{report.compliance}</Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {report.estimatedTime}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{report.name}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{report.description}</p>
                  <Badge variant="outline" className="text-xs">{report.category}</Badge>
                </div>

                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleGenerateReport(report.type, report.name)}
                  disabled={isGenerating === report.type}
                >
                  {isGenerating === report.type ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Générer
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info conformité */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Archivage automatique et conformité légale
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed">
                Tous les rapports générés sont automatiquement enregistrés dans votre historique.
                Les rapports obligatoires (Bilan, Compte de résultat) sont conservés 10 ans conformément
                au Code de commerce (Art. L123-22).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
