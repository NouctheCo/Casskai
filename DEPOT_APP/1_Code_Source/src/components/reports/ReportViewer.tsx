import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Download, FileText, Table, BarChart3, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { reportGenerationService } from '@/services/reportGenerationService';
import { reportExportService } from '@/services/ReportExportService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ReportFilters {
  companyId: string;
  dateFrom: string;
  dateTo: string;
  period?: 'monthly' | 'quarterly' | 'yearly';
  includeSubAccounts?: boolean;
  onlyActiveAccounts?: boolean;
  currency?: string;
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  orientation?: 'portrait' | 'landscape';
  title?: string;
  subtitle?: string;
  includeCharts?: boolean;
  watermark?: string;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    logo?: string;
  };
}

const REPORT_TYPES = [
  { value: 'balance-sheet', label: 'Bilan comptable', icon: BarChart3, description: 'Actif, passif et situation financière' },
  { value: 'income-statement', label: 'Compte de résultat', icon: FileText, description: 'Produits, charges et résultat' },
  { value: 'trial-balance', label: 'Balance générale', icon: Table, description: 'Soldes des comptes' },
  { value: 'general-ledger', label: 'Grand livre', icon: FileText, description: 'Détail des écritures comptables' }
];

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'excel', label: 'Excel', icon: Table },
  { value: 'csv', label: 'CSV', icon: Download }
];

export function ReportViewer() {
  const { currentCompany } = useAuth();
  const [reportType, setReportType] = useState<string>('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [isGenerating, setIsGenerating] = useState(false);

  const [filters, setFilters] = useState<ReportFilters>({
    companyId: currentCompany?.id || '',
    dateFrom: format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    period: 'monthly',
    includeSubAccounts: true,
    onlyActiveAccounts: false,
    currency: 'EUR'
  });

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getExportOptions = (): ExportOptions => ({
    format: exportFormat,
    orientation,
    title: REPORT_TYPES.find(t => t.value === reportType)?.label || 'Rapport Financier',
    subtitle: `Période du ${format(new Date(filters.dateFrom), 'dd/MM/yyyy', { locale: fr })} au ${format(new Date(filters.dateTo), 'dd/MM/yyyy', { locale: fr })}`,
    includeCharts: exportFormat === 'pdf',
    watermark: currentCompany?.name ? `${currentCompany.name} - Confidentiel` : 'Confidentiel',
    companyInfo: currentCompany ? {
      name: currentCompany.name,
      address: currentCompany.address,
      phone: currentCompany.phone,
      email: currentCompany.email
    } : undefined
  });

  const generateReport = async () => {
    if (!reportType || !currentCompany?.id) {
      toast.error('Veuillez sélectionner un type de rapport');
      return;
    }

    setIsGenerating(true);

    try {
      const exportOptions = getExportOptions();
      const reportFilters = { ...filters, companyId: currentCompany.id };

      let downloadUrl: string;
      let filename: string;

      switch (reportType) {
        case 'balance-sheet':
          downloadUrl = await reportGenerationService.generateBalanceSheet(reportFilters, exportOptions);
          filename = `bilan-comptable-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
          break;

        case 'income-statement':
          downloadUrl = await reportGenerationService.generateIncomeStatement(reportFilters, exportOptions);
          filename = `compte-resultat-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
          break;

        case 'trial-balance':
          downloadUrl = await reportGenerationService.generateTrialBalance(reportFilters, exportOptions);
          filename = `balance-generale-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
          break;

        case 'general-ledger':
          downloadUrl = await reportGenerationService.generateGeneralLedger(reportFilters, exportOptions);
          filename = `grand-livre-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}`;
          break;

        default:
          throw new Error('Type de rapport non supporté');
      }

      // Télécharger automatiquement le fichier
      reportExportService.downloadFile(downloadUrl, filename);

      toast.success(`Rapport ${REPORT_TYPES.find(t => t.value === reportType)?.label} généré avec succès!`);
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast.error(`Erreur lors de la génération du rapport: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!currentCompany) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500 dark:text-gray-300">
            Veuillez sélectionner une entreprise pour générer des rapports.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Générateur de Rapports Financiers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type de rapport */}
          <div className="space-y-2">
            <Label>Type de rapport</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {REPORT_TYPES.map((report) => {
                const Icon = report.icon;
                return (
                  <Card
                    key={report.value}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      reportType === report.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setReportType(report.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 ${
                          reportType === report.value ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        <div>
                          <h3 className="font-medium">{report.label}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Filtres de période */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date de début</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateTo">Date de fin</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Options avancées */}
          <div className="space-y-4">
            <Label>Options</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Période de regroupement</Label>
                <Select value={filters.period} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => handleFilterChange('period', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                    <SelectItem value="quarterly">Trimestriel</SelectItem>
                    <SelectItem value="yearly">Annuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={filters.currency} onValueChange={(value) => handleFilterChange('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dollar US ($)</SelectItem>
                    <SelectItem value="GBP">Livre Sterling (£)</SelectItem>
                    <SelectItem value="XOF">Franc CFA (FCFA)</SelectItem>
                    <SelectItem value="NGN">Naira (₦)</SelectItem>
                    <SelectItem value="GHS">Cedi (₵)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeSubAccounts"
                  checked={filters.includeSubAccounts}
                  onCheckedChange={(checked) => handleFilterChange('includeSubAccounts', checked)}
                />
                <Label htmlFor="includeSubAccounts">Inclure les sous-comptes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="onlyActiveAccounts"
                  checked={filters.onlyActiveAccounts}
                  onCheckedChange={(checked) => handleFilterChange('onlyActiveAccounts', checked)}
                />
                <Label htmlFor="onlyActiveAccounts">Comptes actifs uniquement</Label>
              </div>
            </div>
          </div>

          {/* Format d'export */}
          <div className="space-y-2">
            <Label>Format d'export</Label>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <Button
                    key={format.value}
                    variant={exportFormat === format.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setExportFormat(format.value as 'pdf' | 'excel' | 'csv')}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {format.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Orientation (PDF seulement) */}
          {exportFormat === 'pdf' && (
            <div className="space-y-2">
              <Label>Orientation</Label>
              <div className="flex gap-2">
                <Button
                  variant={orientation === 'portrait' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrientation('portrait')}
                >
                  Portrait
                </Button>
                <Button
                  variant={orientation === 'landscape' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setOrientation('landscape')}
                >
                  Paysage
                </Button>
              </div>
            </div>
          )}

          {/* Bouton de génération */}
          <div className="pt-4 border-t">
            <Button
              onClick={generateReport}
              disabled={!reportType || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Génération en cours...' : 'Générer le rapport'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur l'entreprise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations de l'entreprise</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Nom:</span> {currentCompany.name}
            </div>
            {currentCompany.address && (
              <div>
                <span className="font-medium">Adresse:</span> {currentCompany.address}
              </div>
            )}
            {currentCompany.phone && (
              <div>
                <span className="font-medium">Téléphone:</span> {currentCompany.phone}
              </div>
            )}
            {currentCompany.email && (
              <div>
                <span className="font-medium">Email:</span> {currentCompany.email}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
