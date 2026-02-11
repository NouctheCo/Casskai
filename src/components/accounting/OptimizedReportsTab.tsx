import React, { useState, useEffect } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { logger } from '@/lib/logger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast-helpers';
import {
  TrendingUp,
  Download,
  FileText,
  BarChart3,
  Calculator,
  Eye,
  Printer,
  Plus,
  RefreshCw,
  Settings,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Target,
  Activity,
  Package
} from 'lucide-react';
import { reportGenerationService } from '@/services/reportGenerationService';
import { financialReportsService } from '@/services/financialReportsService';
import { getCurrentCompanyCurrency } from '@/lib/utils';
import { DEFAULT_REPORT_TEMPLATES } from '@/data/reportTemplates';
import type { FinancialReport, ReportFormData } from '@/types/reports.types';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardStatsService, type DashboardStats } from '@/services/dashboardStatsService';
import ReportsFinancialDashboard from './ReportsFinancialDashboard';
import { ScheduleReportModal } from '@/components/reports/ScheduleReportModal';
// Type union strict pour les types de rapports
type ReportType =
  | 'balance_sheet'
  | 'income_statement'
  | 'cash_flow'
  | 'trial_balance'
  | 'general_ledger'
  | 'aged_receivables'
  | 'aged_payables'
  | 'financial_ratios'
  | 'vat_report'
  | 'budget_variance'
  | 'kpi_dashboard'
  | 'tax_summary'
  | 'inventory_valuation';
// Liste des rapports actuellement implémentés
const AVAILABLE_REPORTS: ReportType[] = [
  'balance_sheet',
  'income_statement',
  'cash_flow',
  'trial_balance',
  'general_ledger',
  'aged_receivables',
  'aged_payables',
  'financial_ratios',
  'budget_variance',
  'vat_report',
  'kpi_dashboard',
  'tax_summary',
  'inventory_valuation'
];
// Helper pour vérifier si un rapport est disponible
const isReportAvailable = (reportType: string): boolean => {
  return AVAILABLE_REPORTS.includes(reportType as ReportType);
};
export default function OptimizedReportsTab() {
  const { currentCompany } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedReportType, setSelectedReportType] = useState('all_types');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [lastGenerationMessage, setLastGenerationMessage] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // États pour les actions view/download
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  // État pour le modal des modèles
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  // État pour les statistiques en temps réel
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [_statsLoading, setStatsLoading] = useState(true);
  // Impression simple de la page/section
  const handlePrint = () => {
    window.print();
  };
  // RBAC simulation (à remplacer par vrai hook/context)
  const userCanGenerate = true; // TODO: remplacer par vrai contrôle
  const userCanView = true;
  const userCanDownload = true;
  // Logging pour debug
  logger.debug('OptimizedReportsTab render', {
    userCanView,
    userCanDownload,
    availableReportsCount: AVAILABLE_REPORTS.length,
    selectedPeriod,
    selectedReportType
  });
  // Définition des rapports financiers professionnels avec leurs icônes et couleurs
  const accountingReports = [
    {
      type: 'balance_sheet',
      name: 'Bilan comptable',
      description: 'Situation patrimoniale - Actifs et Passifs',
      icon: BarChart3,
      color: 'blue',
      category: 'États de synthèse',
      frequency: 'Mensuel',
      compliance: 'PCG, IFRS',
      estimatedTime: '2-3 min'
    },
    {
      type: 'income_statement',
      name: 'Compte de résultat',
      description: 'Produits et charges de la période',
      icon: TrendingUp,
      color: 'green',
      category: 'États de synthèse',
      frequency: 'Mensuel',
      compliance: 'PCG, IFRS',
      estimatedTime: '2-3 min'
    },
    {
      type: 'trial_balance',
      name: 'Balance générale',
      description: 'Balance de tous les comptes',
      icon: Calculator,
      color: 'orange',
      category: 'Contrôles comptables',
      frequency: 'Mensuel',
      compliance: 'PCG',
      estimatedTime: '1-2 min'
    },
    {
      type: 'general_ledger',
      name: 'Grand livre',
      description: 'Détail des mouvements par compte',
      icon: FileText,
      color: 'indigo',
      category: 'Livres comptables',
      frequency: 'À la demande',
      compliance: 'PCG',
      estimatedTime: '5-8 min'
    },
    {
      type: 'vat_report',
      name: 'Déclaration TVA',
      description: 'Rapport TVA collectée et déductible',
      icon: Calculator,
      color: 'yellow',
      category: 'Fiscalité',
      frequency: 'Mensuel',
      compliance: 'DGFiP',
      estimatedTime: '4-5 min'
    },
    {
      type: 'cash_flow',
      name: 'Tableau de Flux de Trésorerie',
      description: 'Flux d\'exploitation, investissement et financement',
      icon: TrendingUp,
      color: 'red',
      category: 'États de synthèse',
      frequency: 'Mensuel',
      compliance: 'IFRS',
      estimatedTime: '3-4 min'
    },
    {
      type: 'aged_receivables',
      name: 'Analyse des Créances Clients',
      description: 'Ancienneté des créances et risques clients',
      icon: Users,
      color: 'orange',
      category: 'Analyses',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '2-3 min'
    },
    {
      type: 'financial_ratios',
      name: 'Analyse par Ratios Financiers',
      description: 'Ratios de liquidité, rentabilité, activité et endettement',
      icon: BarChart3,
      color: 'purple',
      category: 'Analyses',
      frequency: 'Trimestriel',
      compliance: 'Gestion',
      estimatedTime: '3-5 min'
    },
    {
      type: 'aged_payables',
      name: 'Analyse des Dettes Fournisseurs',
      description: 'Ancienneté des dettes et échéances fournisseurs',
      icon: Users,
      color: 'red',
      category: 'Analyses',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '2-3 min'
    },
    {
      type: 'budget_variance',
      name: 'Analyse des Écarts Budgétaires',
      description: 'Comparaison Budget vs Réalisé avec analyse des écarts',
      icon: BarChart3,
      color: 'indigo',
      category: 'Analyses',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '3-4 min'
    },
    {
      type: 'kpi_dashboard',
      name: 'Tableau de Bord KPI',
      description: 'Vue d\'ensemble des indicateurs clés de performance',
      icon: Activity,
      color: 'cyan',
      category: 'Analyses',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '4-5 min'
    },
    {
      type: 'tax_summary',
      name: 'Synthèse Fiscale',
      description: 'Calendrier des obligations fiscales et récapitulatif',
      icon: Calendar,
      color: 'yellow',
      category: 'Fiscal',
      frequency: 'Annuel',
      compliance: 'Légal',
      estimatedTime: '3-4 min'
    },
    {
      type: 'inventory_valuation',
      name: 'Valorisation des Stocks',
      description: 'Analyse de la valorisation et rotation des stocks',
      icon: Package,
      color: 'emerald',
      category: 'Analyses',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '3-4 min'
    }
  ];
  // Statistiques rapides calculées à partir des données réelles
  const quickStats = dashboardStats ? [
    { label: 'Chiffre d\'affaires', value: dashboardStats.revenue, trend: dashboardStats.revenueTrend, color: 'green' },
    { label: 'Charges totales', value: dashboardStats.expenses, trend: dashboardStats.expensesTrend, color: 'red' },
    { label: 'Résultat net', value: dashboardStats.netIncome, trend: dashboardStats.netIncomeTrend, color: 'blue' },
    { label: 'Marge nette', value: dashboardStats.netMargin, trend: dashboardStats.netMarginTrend, color: 'purple', isPercentage: true }
  ] : [];
  // Gestion des couleurs étendues pour tous les types de rapports
  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      gray: 'from-gray-500 to-gray-600',
      indigo: 'from-indigo-500 to-indigo-600',
      cyan: 'from-cyan-500 to-cyan-600',
      emerald: 'from-emerald-500 to-emerald-600',
      yellow: 'from-yellow-500 to-yellow-600',
      teal: 'from-teal-500 to-teal-600',
      pink: 'from-pink-500 to-pink-600',
      amber: 'from-amber-500 to-amber-600'
    };
    return colors[color] || colors.blue;
  };
  // Génération automatique d'un rapport financier
  const handleGenerateReport = async (reportType: string, reportName: string) => {
    logger.debug('OptimizedReportsTab', '🎯 handleGenerateReport appelé:', { reportType, reportName });
    setIsGenerating(reportType);
    setLastGenerationMessage(null);
    try {
      const periodDates = getPeriodDates(selectedPeriod);
      logger.debug('OptimizedReportsTab', '📅 Period dates calculées:', periodDates);
      
      const reportData: ReportFormData = {
        name: `${reportName} - ${selectedPeriod}`,
        type: reportType as ReportType,
        format: 'detailed',
        period_start: periodDates.start,
        period_end: periodDates.end,
        file_format: 'pdf',
        currency: currentCompany?.default_currency || getCurrentCompanyCurrency()
      };
      logger.debug('OptimizedReportsTab', '📋 Report data:', reportData);
      
      // Génération du rapport avec notre service
      if (!currentCompany?.id) {
        throw new Error('Aucune entreprise sélectionnée');
      }
      const filters = {
        companyId: currentCompany.id,
        startDate: reportData.period_start,
        endDate: reportData.period_end,
        currency: reportData.currency
      };
      logger.debug('OptimizedReportsTab', '🔧 Filters:', filters);
      
      const exportOptions = {
        format: reportData.file_format as 'pdf' | 'excel' | 'csv',
        title: reportData.name,
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address || undefined,
          phone: currentCompany.phone || undefined,
          email: currentCompany.email || undefined
        }
      };
      logger.debug('OptimizedReportsTab', '📤 Export options:', exportOptions);
      
      let downloadUrl: string;
      logger.debug('OptimizedReportsTab', `🔄 Calling generate${reportType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}...`);
      
      switch (reportData.type) {
        case 'balance_sheet':
          logger.debug('OptimizedReportsTab', '⚙️ Generating balance sheet...');
          downloadUrl = await reportGenerationService.generateBalanceSheet(filters, exportOptions);
          logger.debug('OptimizedReportsTab', '✅ Balance sheet generated:', downloadUrl);
          break;
        case 'income_statement':
          logger.debug('OptimizedReportsTab', '⚙️ Generating income statement...');
          downloadUrl = await reportGenerationService.generateIncomeStatement(filters, exportOptions);
          logger.debug('OptimizedReportsTab', '✅ Income statement generated:', downloadUrl);
          break;
        case 'trial_balance':
          logger.debug('OptimizedReportsTab', '⚙️ Generating trial balance...');
          downloadUrl = await reportGenerationService.generateTrialBalance(filters, exportOptions);
          logger.debug('OptimizedReportsTab', '✅ Trial balance generated:', downloadUrl);
          break;
        case 'general_ledger':
          logger.debug('OptimizedReportsTab', '⚙️ Generating general ledger...');
          downloadUrl = await reportGenerationService.generateGeneralLedger(filters, exportOptions);
          logger.debug('OptimizedReportsTab', '✅ General ledger generated:', downloadUrl);
          break;
        case 'cash_flow':
          downloadUrl = await reportGenerationService.generateCashFlow(filters, exportOptions);
          break;
        case 'aged_receivables':
          downloadUrl = await reportGenerationService.generateAgedReceivables(filters, exportOptions);
          break;
        case 'aged_payables':
          downloadUrl = await reportGenerationService.generateAgedPayables(filters, exportOptions);
          break;
        case 'financial_ratios':
          downloadUrl = await reportGenerationService.generateFinancialRatios(filters, exportOptions);
          break;
        case 'vat_report':
          downloadUrl = await reportGenerationService.generateVATReport(filters, exportOptions);
          break;
        case 'budget_variance':
          downloadUrl = await reportGenerationService.generateBudgetVariance(filters, exportOptions);
          break;
        case 'kpi_dashboard':
          downloadUrl = await reportGenerationService.generateKPIDashboard(filters, exportOptions);
          break;
        case 'tax_summary':
          downloadUrl = await reportGenerationService.generateTaxSummary(filters, exportOptions);
          break;
        case 'inventory_valuation':
          downloadUrl = await reportGenerationService.generateInventoryValuation(filters, exportOptions);
          break;
        default:
          throw new Error('Type de rapport non supporté');
      }
      logger.debug('OptimizedReportsTab', '📥 Download URL:', downloadUrl);
      
      // Auto-download the generated report
      if (downloadUrl) {
        logger.debug('OptimizedReportsTab', '💾 Triggering download...');
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportData.name}.${reportData.file_format}`;
        link.click();
        logger.debug('OptimizedReportsTab', '✅ Download triggered');
      }
      const successMessage = `Rapport généré avec succès (${reportName}).`;
      toastSuccess(successMessage);
      setLastGenerationMessage(successMessage);
      logger.debug('OptimizedReportsTab', '🎉 Success toast shown');
      
      // Actualiser la liste des rapports récents
      loadRecentReports();
    } catch (error) {
      logger.error('OptimizedReportsTab', '❌ Erreur génération rapport:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      const errorMessage = error instanceof Error ? error.message : "Impossible de générer le rapport. Veuillez réessayer.";
      toastError(errorMessage);
    } finally {
      logger.debug('OptimizedReportsTab', '🏁 Cleaning up...');
      setIsGenerating(null);
    }
  };
  // Calcul des dates de période
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
      case 'last-year':
        return {
          start: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
          end: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]
        };
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
  // Chargement des rapports récents depuis la base de données
  const loadRecentReports = async () => {
    if (!currentCompany?.id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const result = await financialReportsService.getReports(currentCompany.id);
      if (result.data && result.data.length > 0) {
        // Prendre les 10 derniers rapports
        setRecentReports(result.data.slice(0, 10) as FinancialReport[]);
      } else {
        setRecentReports([]);
      }
    } catch (error) {
      logger.error('OptimizedReportsTab', 'Error loading recent reports:', error);
      setRecentReports([]);
    } finally {
      setIsLoading(false);
    }
  };
  // Gestionnaire pour consulter un rapport - génère puis ouvre
  const handleViewReport = async (reportType: string, reportName: string) => {
    logger.debug('OptimizedReportsTab', '👁️ handleViewReport appelé:', { reportType, reportName, userCanView });
    if (!userCanView) return;
    setViewingReport(reportType);
    try {
      const periodDates = getPeriodDates(selectedPeriod);
      if (!currentCompany?.id) {
        throw new Error('Aucune entreprise sélectionnée');
      }
      const filters = {
        companyId: currentCompany.id,
        startDate: periodDates.start,
        endDate: periodDates.end
      };
      const exportOptions = {
        format: 'pdf' as const,
        title: `${reportName} - ${selectedPeriod}`,
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address || undefined,
          phone: currentCompany.phone || undefined,
          email: currentCompany.email || undefined
        }
      };
      let downloadUrl: string | null = null;
      switch (reportType) {
        case 'balance_sheet':
          downloadUrl = await reportGenerationService.generateBalanceSheet(filters, exportOptions);
          break;
        case 'income_statement':
          downloadUrl = await reportGenerationService.generateIncomeStatement(filters, exportOptions);
          break;
        case 'trial_balance':
          downloadUrl = await reportGenerationService.generateTrialBalance(filters, exportOptions);
          break;
        case 'general_ledger':
          downloadUrl = await reportGenerationService.generateGeneralLedger(filters, exportOptions);
          break;
        case 'cash_flow':
          downloadUrl = await reportGenerationService.generateCashFlow(filters, exportOptions);
          break;
        case 'aged_receivables':
          downloadUrl = await reportGenerationService.generateAgedReceivables(filters, exportOptions);
          break;
        case 'financial_ratios':
          downloadUrl = await reportGenerationService.generateFinancialRatios(filters, exportOptions);
          break;
        case 'vat_report':
          downloadUrl = await reportGenerationService.generateVATReport(filters, exportOptions);
          break;
        case 'aged_payables':
          downloadUrl = await reportGenerationService.generateAgedPayables(filters, exportOptions);
          break;
        case 'budget_variance':
          downloadUrl = await reportGenerationService.generateBudgetVariance(filters, exportOptions);
          break;
        case 'kpi_dashboard':
          downloadUrl = await reportGenerationService.generateKPIDashboard(filters, exportOptions);
          break;
        case 'tax_summary':
          downloadUrl = await reportGenerationService.generateTaxSummary(filters, exportOptions);
          break;
        case 'inventory_valuation':
          downloadUrl = await reportGenerationService.generateInventoryValuation(filters, exportOptions);
          break;
        default:
          toastWarning(`Le rapport "${reportName}" n'est pas encore disponible.`);
          return;
      }
      // Ouvrir dans un nouvel onglet
      if (downloadUrl) {
        window.open(downloadUrl, '_blank');
        toastSuccess(`Rapport "${reportName}" ouvert avec succès.`);
      }
    } catch (error) {
      logger.error('OptimizedReportsTab', 'Erreur ouverture rapport:', error);
      const errorMessage = error instanceof Error ? error.message : "Impossible d'ouvrir le rapport. Veuillez réessayer.";
      toastError(errorMessage);
    } finally {
      setViewingReport(null);
    }
  };
  // Gestionnaire pour télécharger un rapport - génère puis télécharge
  const handleDownloadReport = async (reportType: string, reportName: string) => {
    logger.debug('OptimizedReportsTab', '🔽 handleDownloadReport appelé:', { reportType, reportName, userCanDownload });
    if (!userCanDownload) return;
    setDownloadingReport(reportType);
    try {
      const periodDates = getPeriodDates(selectedPeriod);
      if (!currentCompany?.id) {
        throw new Error('Aucune entreprise sélectionnée');
      }
      const filters = {
        companyId: currentCompany.id,
        startDate: periodDates.start,
        endDate: periodDates.end,
        currency: currentCompany?.default_currency || getCurrentCompanyCurrency()
      };
      const exportOptions = {
        format: 'pdf' as const,
        title: `${reportName} - ${selectedPeriod}`,
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address || undefined,
          phone: currentCompany.phone || undefined,
          email: currentCompany.email || undefined
        }
      };
      let downloadUrl: string;
      switch (reportType) {
        case 'balance_sheet':
          downloadUrl = await reportGenerationService.generateBalanceSheet(filters, exportOptions);
          break;
        case 'income_statement':
          downloadUrl = await reportGenerationService.generateIncomeStatement(filters, exportOptions);
          break;
        case 'trial_balance':
          downloadUrl = await reportGenerationService.generateTrialBalance(filters, exportOptions);
          break;
        case 'general_ledger':
          downloadUrl = await reportGenerationService.generateGeneralLedger(filters, exportOptions);
          break;
        case 'cash_flow':
          downloadUrl = await reportGenerationService.generateCashFlow(filters, exportOptions);
          break;
        case 'aged_receivables':
          downloadUrl = await reportGenerationService.generateAgedReceivables(filters, exportOptions);
          break;
        case 'financial_ratios':
          downloadUrl = await reportGenerationService.generateFinancialRatios(filters, exportOptions);
          break;
        case 'vat_report':
          downloadUrl = await reportGenerationService.generateVATReport(filters, exportOptions);
          break;
        case 'aged_payables':
          downloadUrl = await reportGenerationService.generateAgedPayables(filters, exportOptions);
          break;
        case 'budget_variance':
          downloadUrl = await reportGenerationService.generateBudgetVariance(filters, exportOptions);
          break;
        case 'kpi_dashboard':
          downloadUrl = await reportGenerationService.generateKPIDashboard(filters, exportOptions);
          break;
        case 'tax_summary':
          downloadUrl = await reportGenerationService.generateTaxSummary(filters, exportOptions);
          break;
        case 'inventory_valuation':
          downloadUrl = await reportGenerationService.generateInventoryValuation(filters, exportOptions);
          break;
        default:
          toastWarning(`Le rapport "${reportName}" n'est pas encore disponible.`);
          return;
      }
      // Télécharger le fichier
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportName}-${selectedPeriod}.pdf`;
        link.click();
        toastSuccess(`Rapport "${reportName}" téléchargé avec succès.`);
      }
    } catch (error) {
      logger.error('OptimizedReportsTab', 'Erreur téléchargement rapport:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de télécharger le rapport. Veuillez réessayer.';
      toastError(errorMessage);
    } finally {
      setDownloadingReport(null);
    }
  };
  // Chargement initial
  useEffect(() => {
    loadRecentReports();
  }, [selectedPeriod]);
  // Chargement des statistiques réelles
  useEffect(() => {
    const loadDashboardStats = async () => {
      if (!currentCompany?.id) {
        setStatsLoading(false);
        return;
      }
      try {
        setStatsLoading(true);
        // Charger les stats selon la période sélectionnée
        let stats: DashboardStats;
        if (selectedPeriod === 'current-year') {
          stats = await dashboardStatsService.getCurrentYearStats(currentCompany.id);
        } else {
          stats = await dashboardStatsService.getCurrentMonthStats(currentCompany.id);
        }
        setDashboardStats(stats);
      } catch (error) {
        logger.error('OptimizedReportsTab', 'Error loading dashboard stats:', error);
        // En cas d'erreur, garder les stats à null (affichera 0 ou vide)
      } finally {
        setStatsLoading(false);
      }
    };
    loadDashboardStats();
  }, [currentCompany?.id, selectedPeriod]);
  // Filtrage des rapports par type
  const filteredReports = accountingReports.filter(report => {
    if (selectedReportType === 'all_types') return true;
    return report.category === selectedReportType;
  });
  return (
    <div className="space-y-8">
      {/* Actions principales */}
      <div className="flex items-center justify-end space-x-3 mb-6">
        <Button variant="outline" onClick={loadRecentReports} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button variant="outline" onClick={handlePrint} title="Imprimer la vue">
          <Printer className="w-4 h-4 mr-2" />
          Imprimer
        </Button>
        <Button onClick={() => setShowScheduleModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Programmer un rapport
        </Button>
      </div>

      {lastGenerationMessage && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {lastGenerationMessage}
        </div>
      )}

      {/* Filtres et sélecteurs - AVANT les statistiques */}
      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Période d'analyse
              </label>
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
                  <SelectItem value="last-year">Année N-1</SelectItem>
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedPeriod === 'custom' && (
              <div className="flex items-center space-x-2">
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Du</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Date de début"
                    title="Date de début de la période personnalisée"
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">Au</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Date de fin"
                    title="Date de fin de la période personnalisée"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Catégorie de rapports
              </label>
              <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                <SelectTrigger>
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_types">Tous les rapports</SelectItem>
                  <SelectItem value="États de synthèse">États de synthèse</SelectItem>
                  <SelectItem value="Analyse financière">Analyse financière</SelectItem>
                  <SelectItem value="Fiscalité">Fiscalité</SelectItem>
                  <SelectItem value="Pilotage">Pilotage</SelectItem>
                  <SelectItem value="Contrôles comptables">Contrôles comptables</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Actions rapides
              </label>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setShowTemplatesModal(true)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Modèles
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Download className="w-4 h-4 mr-1" />
                  Historique
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Graphique Financier */}
      <ReportsFinancialDashboard />

      {/* Statistiques rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        {quickStats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </p>
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                    stat.trend > 0
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    <span>{stat.trend > 0 ? '+' : ''}{Number(stat.trend).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.isPercentage ? `${Number(stat.value).toFixed(2)}%` : <CurrencyAmount amount={stat.value} />}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Grille des rapports professionnels */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredReports.map((report) => (
          <Card key={report.type} className="hover:shadow-lg transition-all duration-200 border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* En-tête du rapport */}
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getColorClasses(report.color)} flex items-center justify-center shadow-md`}>
                    <report.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {!isReportAvailable(report.type) && (
                      <Badge variant="default" className="text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white">
                        Bientôt disponible
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs font-medium">
                      {report.frequency}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {report.compliance}
                    </Badge>
                  </div>
                </div>
                {/* Informations du rapport */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {report.name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {report.description}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{report.estimatedTime}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>{report.category}</span>
                    </span>
                  </div>
                </div>
                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleGenerateReport(report.type, report.name)}
                    disabled={isGenerating === report.type || !userCanGenerate || !isReportAvailable(report.type)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewReport(report.type, report.name)}
                    disabled={!userCanView || viewingReport === report.type || !isReportAvailable(report.type)}
                  >
                    {viewingReport === report.type ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report.type, report.name)}
                    disabled={!userCanDownload || downloadingReport === report.type || !isReportAvailable(report.type)}
                  >
                    {downloadingReport === report.type ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Section des rapports récents */}
      {!isLoading && recentReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-green-500" />
              <span>Rapports récemment générés</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{report.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Généré le {new Date(report.created_at).toLocaleDateString('fr-FR')} • {Math.round((report.file_size || 0) / 1024 / 1024 * 10) / 10} MB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(report.type, report.name)}
                      disabled={!userCanView || viewingReport === report.type}
                    >
                      {viewingReport === report.type ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      Consulter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadReport(report.type, report.name)}
                      disabled={!userCanDownload || downloadingReport === report.type}
                    >
                      {downloadingReport === report.type ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Section d'aide et documentation */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center dark:bg-blue-900/20">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Rapports conformes aux normes comptables françaises
              </h3>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed mb-3">
                Tous les rapports sont générés automatiquement selon le Plan Comptable Général (PCG) français
                et les normes IFRS internationales. Les données proviennent directement de vos écritures comptables.
              </p>
              <div className="flex items-center space-x-4">
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:text-blue-400">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:text-blue-400">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Modal des modèles de rapports */}
      <Dialog open={showTemplatesModal} onOpenChange={setShowTemplatesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              Modèles de rapports disponibles
            </DialogTitle>
            <DialogDescription>
              {DEFAULT_REPORT_TEMPLATES.length} templates professionnels conformes PCG et IFRS
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {DEFAULT_REPORT_TEMPLATES.map((template, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {template.name}
                      </h4>
                      {template.is_default && (
                        <Badge variant="secondary" className="text-xs">Par défaut</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Badge variant="outline">{template.type}</Badge>
                      <span>•</span>
                      <span>{template.sections.length} sections</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setShowTemplatesModal(false)}>
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal de programmation de rapport */}
      <ScheduleReportModal
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onSchedule={(config) => {
          logger.debug('OptimizedReportsTab', '📅 Report scheduled:', config);
          toastSuccess('Rapport programmé avec succès');
          setShowScheduleModal(false);
        }}
      />
    </div>
  );
}
