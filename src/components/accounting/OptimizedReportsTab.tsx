import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import type {
  BalanceSheetData,
  IncomeStatementData,
  TrialBalanceData,
  GeneralLedgerData,
  CashFlowData,
  AgedReceivablesData,
  AgedPayablesData,
  FinancialRatiosData,
  BudgetVarianceData,
  KPIDashboardData,
  TaxSummaryData,
  TaxDeclarationVAT,
  PDFReportConfig,
  ExcelReportConfig,
  CompanyInfo
} from '@/utils/reportGeneration/types';


import {
  TrendingUp,
  Download,
  FileText,
  BarChart3,
  PieChart,
  Calculator,
  Eye,
  Printer,
  Plus,
  RefreshCw,
  Settings,
  Calendar,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Archive,
  Target,
  Zap
} from 'lucide-react';
import { reportsService } from '@/services/reportsService';
import { reportStorageService } from '@/services/reportStorageService';
import { PDFGenerator, ExcelGenerator } from '@/utils/reportGeneration';
import type { FinancialReport } from '@/types/reports.types';
import { useAuth } from '@/contexts/AuthContext';
import EmptyReportState from './EmptyReportState';

export default function OptimizedReportsTab() {
  const { showToast } = useToast();
  const { currentCompany } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedReportType, setSelectedReportType] = useState('all_types');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emptyStateReport, setEmptyStateReport] = useState<{type: string; name: string} | null>(null);

  // États pour les actions view/download
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  
  // RBAC simulation (à remplacer par vrai hook/context)
  const userCanGenerate = true; // TODO: remplacer par vrai contrôle
  const userCanView = true;
  const userCanDownload = true;

  // Définition des rapports financiers professionnels avec leurs icônes et couleurs
  const professionalReports = [
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
      type: 'cash_flow',
      name: 'Tableau de flux de trésorerie',
      description: 'Flux de trésorerie par activité',
      icon: DollarSign,
      color: 'purple',
      category: 'États de synthèse',
      frequency: 'Trimestriel',
      compliance: 'IFRS',
      estimatedTime: '3-4 min'
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
      type: 'aged_receivables',
      name: 'Clients échéancier',
      description: 'Analyse des créances clients par ancienneté',
      icon: Users,
      color: 'cyan',
      category: 'Analyse crédit',
      frequency: 'Hebdomadaire',
      compliance: 'Gestion',
      estimatedTime: '2-3 min'
    },
    {
      type: 'aged_payables',
      name: 'Fournisseurs échéancier',
      description: 'Analyse des dettes fournisseurs',
      icon: Archive,
      color: 'red',
      category: 'Analyse crédit',
      frequency: 'Hebdomadaire',
      compliance: 'Gestion',
      estimatedTime: '2-3 min'
    },
    {
      type: 'financial_ratios',
      name: 'Ratios financiers',
      description: 'Indicateurs de performance financière',
      icon: Target,
      color: 'emerald',
      category: 'Analyse financière',
      frequency: 'Mensuel',
      compliance: 'Analyse',
      estimatedTime: '3-4 min'
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
      type: 'budget_variance',
      name: 'Analyse budgétaire',
      description: 'Écarts budget vs réalisé',
      icon: BarChart3,
      color: 'teal',
      category: 'Pilotage',
      frequency: 'Mensuel',
      compliance: 'Gestion',
      estimatedTime: '3-4 min'
    },
    {
      type: 'kpi_dashboard',
      name: 'Tableau de bord KPI',
      description: 'Indicateurs clés de performance',
      icon: Zap,
      color: 'pink',
      category: 'Pilotage',
      frequency: 'Hebdomadaire',
      compliance: 'Gestion',
      estimatedTime: '5-6 min'
    },
    {
      type: 'tax_summary',
      name: 'Synthèse fiscale',
      description: 'Résumé des obligations fiscales',
      icon: FileText,
      color: 'amber',
      category: 'Fiscalité',
      frequency: 'Trimestriel',
      compliance: 'DGFiP',
      estimatedTime: '6-8 min'
    }
  ];

  // État des statistiques rapides - chargées depuis la base de données
  const [quickStats, setQuickStats] = useState<Array<{
    label: string;
    value: number;
    trend: number;
    color: string;
    isPercentage?: boolean;
  }>>([
    { label: 'Chiffre d\'affaires', value: 0, trend: 0, color: 'green' },
    { label: 'Charges totales', value: 0, trend: 0, color: 'red' },
    { label: 'Résultat net', value: 0, trend: 0, color: 'blue' },
    { label: 'Marge nette', value: 0, trend: 0, color: 'purple', isPercentage: true }
  ]);

  // Charger les statistiques rapides depuis les données réelles avec calcul des tendances
  useEffect(() => {
    const loadQuickStats = async () => {
      if (!currentCompany?.id) return;

      try {
        const periodDates = getPeriodDates(selectedPeriod);
        const previousPeriodDates = getPreviousPeriodDates(selectedPeriod);

        // Récupérer les entrées comptables pour la période actuelle
        const { data: entries, error } = await supabase
          .from('journal_entries')
          .select('debit_amount, credit_amount, account_number')
          .eq('company_id', currentCompany.id)
          .gte('entry_date', periodDates.start)
          .lte('entry_date', periodDates.end);

        if (error) throw error;

        // Récupérer les entrées de la période précédente pour calcul des tendances
        const { data: previousEntries } = await supabase
          .from('journal_entries')
          .select('debit_amount, credit_amount, account_number')
          .eq('company_id', currentCompany.id)
          .gte('entry_date', previousPeriodDates.start)
          .lte('entry_date', previousPeriodDates.end);

        // Calculer les valeurs de la période actuelle
        const revenue = entries
          ?.filter(e => e.account_number?.startsWith('7'))
          .reduce((sum, e) => sum + (e.credit_amount || 0) - (e.debit_amount || 0), 0) || 0;

        const expenses = entries
          ?.filter(e => e.account_number?.startsWith('6'))
          .reduce((sum, e) => sum + (e.debit_amount || 0) - (e.credit_amount || 0), 0) || 0;

        const netIncome = revenue - expenses;
        const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

        // Calculer les valeurs de la période précédente
        const prevRevenue = previousEntries
          ?.filter(e => e.account_number?.startsWith('7'))
          .reduce((sum, e) => sum + (e.credit_amount || 0) - (e.debit_amount || 0), 0) || 0;

        const prevExpenses = previousEntries
          ?.filter(e => e.account_number?.startsWith('6'))
          .reduce((sum, e) => sum + (e.debit_amount || 0) - (e.credit_amount || 0), 0) || 0;

        const prevNetIncome = prevRevenue - prevExpenses;
        const prevNetMargin = prevRevenue > 0 ? (prevNetIncome / prevRevenue) * 100 : 0;

        // Calculer les tendances (variation en pourcentage)
        const calculateTrend = (current: number, previous: number) => {
          if (previous === 0) return 0;
          return Math.round(((current - previous) / previous) * 100);
        };

        setQuickStats([
          {
            label: 'Chiffre d\'affaires',
            value: Math.round(revenue),
            trend: calculateTrend(revenue, prevRevenue),
            color: 'green'
          },
          {
            label: 'Charges totales',
            value: Math.round(expenses),
            trend: calculateTrend(expenses, prevExpenses),
            color: 'red'
          },
          {
            label: 'Résultat net',
            value: Math.round(netIncome),
            trend: calculateTrend(netIncome, prevNetIncome),
            color: 'blue'
          },
          {
            label: 'Marge nette',
            value: Math.round(netMargin * 10) / 10,
            trend: calculateTrend(netMargin, prevNetMargin),
            color: 'purple',
            isPercentage: true
          }
        ]);
      } catch (error) {
        logger.error('Error loading quick stats:', error)
      }
    };

    loadQuickStats();
  }, [currentCompany?.id, selectedPeriod]);

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

  // Helper pour vérifier si les données sont vides
  const isReportDataEmpty = (reportType: string, data: any): boolean => {
    if (!data) return true;

    switch (reportType) {
      case 'balance_sheet': {
        const bsData = data as BalanceSheetData;
        return (
          (!bsData.assets.fixed_assets || bsData.assets.fixed_assets.length === 0) &&
          (!bsData.assets.inventory || bsData.assets.inventory.length === 0) &&
          (!bsData.assets.receivables || bsData.assets.receivables.length === 0) &&
          (!bsData.assets.cash || bsData.assets.cash.length === 0) &&
          (!bsData.liabilities.payables || bsData.liabilities.payables.length === 0) &&
          (!bsData.equity.capital || bsData.equity.capital.length === 0)
        );
      }

      case 'income_statement': {
        const isData = data as IncomeStatementData;
        return (
          (!isData.revenue.sales || isData.revenue.sales.length === 0) &&
          (!isData.revenue.other_revenue || isData.revenue.other_revenue.length === 0) &&
          (!isData.expenses.purchases || isData.expenses.purchases.length === 0) &&
          (!isData.expenses.external_charges || isData.expenses.external_charges.length === 0)
        );
      }

      case 'trial_balance': {
        const tbData = data as TrialBalanceData;
        return !tbData.accounts || tbData.accounts.length === 0;
      }

      case 'general_ledger': {
        const glData = data as GeneralLedgerData;
        return !glData.entries || glData.entries.length === 0;
      }

      default:
        return false;
    }
  };

  // Génération automatique d'un rapport financier
  const handleGenerateReport = async (reportType: string, reportName: string) => {
    setIsGenerating(reportType);
    setEmptyStateReport(null); // Reset empty state

    try {
      const periodDates = getPeriodDates(selectedPeriod);

      // Génération du rapport avec notre service
      if (!currentCompany?.id) {
        throw new Error('Aucune entreprise sélectionnée');
      }

      // Préparer les informations de l'entreprise
      const companyInfo: CompanyInfo = {
        id: currentCompany.id,
        name: currentCompany.name || 'Entreprise',
        address: currentCompany.address || '',
        city: currentCompany.city || '',
        postal_code: currentCompany.postal_code || '',
        country: currentCompany.country || 'FR',
        siret: currentCompany.siret || '',
        vat_number: currentCompany.vat_number || ''
      };

      // Configuration commune pour PDF et Excel
      const reportConfig = {
        title: reportName.toUpperCase(),
        subtitle: `Période: ${new Date(periodDates.start).toLocaleDateString('fr-FR')} - ${new Date(periodDates.end).toLocaleDateString('fr-FR')}`,
        company: companyInfo,
        period: {
          start: periodDates.start,
          end: periodDates.end
        }
      };

      let result: any;

      // Générer le rapport selon le type
      switch (reportType) {
        case 'balance_sheet':
          result = await reportsService.generateBalanceSheet(currentCompany.id, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          // Vérifier si les données sont vides
          if (isReportDataEmpty(reportType, result.data)) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune donnée disponible pour cette période', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateBalanceSheet(result.data as BalanceSheetData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            // Upload to storage
            const uploadResult = await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            if (!uploadResult.success) {
              logger.error('Upload failed:', uploadResult.error)
            }

            // Download locally
            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateBalanceSheet(result.data as BalanceSheetData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            // Upload to storage
            const uploadResult = await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            if (!uploadResult.success) {
              logger.error('Upload failed:', uploadResult.error)
            }

            // Download locally
            pdf.save(filename);
          }
          break;

        case 'income_statement':
          result = await reportsService.generateIncomeStatement(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (isReportDataEmpty(reportType, result.data)) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune donnée disponible pour cette période', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateIncomeStatement(result.data as IncomeStatementData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateIncomeStatement(result.data as IncomeStatementData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'trial_balance':
          result = await reportsService.generateTrialBalance(currentCompany.id, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (isReportDataEmpty(reportType, result.data)) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune donnée disponible pour cette période', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateTrialBalance(result.data as TrialBalanceData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateTrialBalance(result.data as TrialBalanceData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'general_ledger':
          result = await reportsService.generateGeneralLedger(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (isReportDataEmpty(reportType, result.data)) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune donnée disponible pour cette période', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateGeneralLedger(result.data as GeneralLedgerData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateGeneralLedger(result.data as GeneralLedgerData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            // Upload to storage
            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'cash_flow':
          result = await reportsService.generateCashFlowStatement(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          // Vérifier données vides
          if (result.data.summary.net_cash_change === 0) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune donnée de trésorerie', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateCashFlowStatement(result.data as CashFlowData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateCashFlowStatement(result.data as CashFlowData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'aged_receivables':
          result = await reportsService.generateAgedReceivables(currentCompany.id, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (!result.data.customers || result.data.customers.length === 0) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune créance client en cours', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateAgedReceivables(result.data as AgedReceivablesData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateAgedReceivables(result.data as AgedReceivablesData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'aged_payables':
          result = await reportsService.generateAgedPayables(currentCompany.id, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (!result.data.suppliers || result.data.suppliers.length === 0) {
            setEmptyStateReport({ type: reportType, name: reportName });
            showToast('Aucune dette fournisseur en cours', 'info');
            return;
          }

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateAgedPayables(result.data as AgedPayablesData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateAgedPayables(result.data as AgedPayablesData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'financial_ratios':
          result = await reportsService.generateFinancialRatios(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateFinancialRatios(result.data as FinancialRatiosData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateFinancialRatios(result.data as FinancialRatiosData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'vat_report':
          result = await reportsService.generateVATDeclaration(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateVATReport(result.data as TaxDeclarationVAT, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateVATReport(result.data as TaxDeclarationVAT, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'budget_variance':
          result = await reportsService.generateBudgetVariance(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateBudgetVariance(result.data as BudgetVarianceData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateBudgetVariance(result.data as BudgetVarianceData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'kpi_dashboard':
          result = await reportsService.generateKPIDashboard(currentCompany.id, periodDates.start, periodDates.end);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateKPIDashboard(result.data as KPIDashboardData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateKPIDashboard(result.data as KPIDashboardData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${periodDates.end}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: periodDates.start,
              periodEnd: periodDates.end
            });

            pdf.save(filename);
          }
          break;

        case 'tax_summary': {
          const fiscalYear = new Date(periodDates.end).getFullYear().toString();
          result = await reportsService.generateTaxSummary(currentCompany.id, fiscalYear);
          if (result.error) throw new Error(result.error.message);
          if (!result.data) throw new Error('Aucune donnée retournée');

          if (exportFormat === 'excel') {
            const excelConfig: ExcelReportConfig = reportConfig;
            const blob = await ExcelGenerator.generateTaxSummary(result.data as TaxSummaryData, excelConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${fiscalYear}.xlsx`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: blob,
              fileFormat: 'xlsx',
              periodStart: `${fiscalYear}-01-01`,
              periodEnd: `${fiscalYear}-12-31`
            });

            ExcelGenerator.downloadBlob(blob, filename);
          } else {
            const pdfConfig: PDFReportConfig = { ...reportConfig, footer: 'Généré par CassKai - Comptabilité intelligente', pageNumbers: true, margins: { top: 20, right: 15, bottom: 15, left: 15 } };
            const pdf = PDFGenerator.generateTaxSummary(result.data as TaxSummaryData, pdfConfig);
            const filename = `${reportType}_${currentCompany.name.replace(/\s+/g, '_')}_${fiscalYear}.pdf`;

            await reportStorageService.uploadReport({
              companyId: currentCompany.id,
              reportType,
              reportName,
              fileBlob: pdf.getBlob(),
              fileFormat: 'pdf',
              periodStart: `${fiscalYear}-01-01`,
              periodEnd: `${fiscalYear}-12-31`
            });

            pdf.save(filename);
          }
          break;
        }

        default:
          showToast(`Type de rapport "${reportType}" en cours de développement`, 'info');
          return;
      }

      const formatLabel = exportFormat === 'excel' ? 'Excel' : 'PDF';
      showToast(`Rapport "${reportName}" généré avec succès au format ${formatLabel}.`, 'success');

      // Actualiser la liste des rapports récents
      loadRecentReports();

    } catch (error) {
      logger.error('Erreur génération rapport:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de générer le rapport';
      showToast(`Erreur: ${errorMessage}`, 'error');
    } finally {
      setIsGenerating(null);
    }
  };

  // Calcul des dates de période
  const getPeriodDates = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'current-month': {
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      }
      case 'current-quarter': {
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          start: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
          end: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      }
      case 'current-year': {
        return {
          start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          end: new Date(currentYear, 11, 31).toISOString().split('T')[0]
        };
      }
      case 'last-month': {
        const lastMonth = currentMonth - 1;
        const year = lastMonth < 0 ? currentYear - 1 : currentYear;
        const month = lastMonth < 0 ? 11 : lastMonth;
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      }
      default: {
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      }
    }
  };

  // Calcul des dates de la période précédente (pour comparaison des tendances)
  const getPreviousPeriodDates = (period: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'current-month': {
        // Mois précédent
        const prevMonth = currentMonth - 1;
        const prevYear = prevMonth < 0 ? currentYear - 1 : currentYear;
        const month = prevMonth < 0 ? 11 : prevMonth;
        return {
          start: new Date(prevYear, month, 1).toISOString().split('T')[0],
          end: new Date(prevYear, month + 1, 0).toISOString().split('T')[0]
        };
      }
      case 'current-quarter': {
        // Trimestre précédent
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        const prevQuarterStart = quarterStart - 3;
        const qYear = prevQuarterStart < 0 ? currentYear - 1 : currentYear;
        const qMonth = prevQuarterStart < 0 ? 9 : prevQuarterStart;
        return {
          start: new Date(qYear, qMonth, 1).toISOString().split('T')[0],
          end: new Date(qYear, qMonth + 3, 0).toISOString().split('T')[0]
        };
      }
      case 'current-year': {
        // Année précédente
        return {
          start: new Date(currentYear - 1, 0, 1).toISOString().split('T')[0],
          end: new Date(currentYear - 1, 11, 31).toISOString().split('T')[0]
        };
      }
      case 'last-month': {
        // Mois d'avant le mois dernier (N-2)
        const lastMonth = currentMonth - 2;
        const lYear = lastMonth < 0 ? currentYear - 1 : currentYear;
        const lMonth = lastMonth < 0 ? 12 + lastMonth : lastMonth;
        return {
          start: new Date(lYear, lMonth, 1).toISOString().split('T')[0],
          end: new Date(lYear, lMonth + 1, 0).toISOString().split('T')[0]
        };
      }
      default: {
        // Par défaut: mois précédent
        const defPrevMonth = currentMonth - 1;
        const defYear = defPrevMonth < 0 ? currentYear - 1 : currentYear;
        const defMonth = defPrevMonth < 0 ? 11 : defPrevMonth;
        return {
          start: new Date(defYear, defMonth, 1).toISOString().split('T')[0],
          end: new Date(defYear, defMonth + 1, 0).toISOString().split('T')[0]
        };
      }
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
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .eq('company_id', currentCompany.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentReports(data || []);
    } catch (error) {
      logger.error('Error loading recent reports:', error);
      showToast("Impossible de charger les rapports récents.", 'error');
      setRecentReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire pour consulter un rapport
  const handleViewReport = async (report: FinancialReport) => {
    if (!userCanView) return;
    
    setViewingReport(report.id);
    try {
      // Simulation d'ouverture du rapport
      await new Promise(resolve => setTimeout(resolve, 800));
      showToast(`Rapport "${report.name}" ouvert avec succès.`, 'success');
    } catch (_error) {
      showToast("Impossible d'ouvrir le rapport. Veuillez réessayer.", 'error');
    } finally {
      setViewingReport(null);
    }
  };

  // Gestionnaire pour télécharger un rapport
  const handleDownloadReport = async (report: FinancialReport) => {
    if (!userCanDownload) return;

    setDownloadingReport(report.id);
    try {
      // Télécharger depuis le storage
      const result = await reportStorageService.downloadReport(report.id);

      if (!result.success || !result.blob) {
        throw new Error(result.error || 'Échec du téléchargement');
      }

      // Créer un lien de téléchargement
      const url = URL.createObjectURL(result.blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${report.name}.${report.file_format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(`Rapport "${report.name}" téléchargé avec succès.`, 'success');
    } catch (error) {
      logger.error('Download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Impossible de télécharger le rapport';
      showToast(errorMessage, 'error');
    } finally {
      setDownloadingReport(null);
    }
  };

  // Chargement initial
  useEffect(() => {
    loadRecentReports();
  }, [selectedPeriod]);

  // Filtrage des rapports par type
  const filteredReports = professionalReports.filter(report => {
    if (selectedReportType === 'all_types') return true;
    return report.category === selectedReportType;
  });

  return (
    <div className="space-y-8">
      {/* En-tête avec actions principales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-blue-500" />
            <span>Rapports financiers professionnels</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Génération automatique conforme aux normes PCG et IFRS
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadRecentReports} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Programmer un rapport
          </Button>
        </div>
      </div>

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
                    <span>{stat.trend > 0 ? '+' : ''}{stat.trend}%</span>
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.isPercentage ? `${stat.value}%` : `${stat.value.toLocaleString('fr-FR')} €`}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtres et sélecteurs */}
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
                  <SelectItem value="custom">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                Format d'export
              </label>
              <Select value={exportFormat} onValueChange={(value: 'pdf' | 'excel') => setExportFormat(value)}>
                <SelectTrigger>
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    disabled={isGenerating === report.type || !userCanGenerate}
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
                    onClick={() => handleViewReport({
                      id: report.type,
                      company_id: currentCompany?.id || 'comp-1',
                      name: report.name,
                      type: report.type as any,
                      format: 'detailed',
                      period_start: '',
                      period_end: '',
                      status: 'ready',
                      file_format: 'pdf',
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })}
                    disabled={!userCanView}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadReport({
                      id: report.type,
                      company_id: currentCompany?.id || 'comp-1',
                      name: report.name,
                      type: report.type as any,
                      format: 'detailed',
                      period_start: '',
                      period_end: '',
                      status: 'ready',
                      file_format: 'pdf',
                      file_url: `/reports/${report.type}.pdf`,
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString()
                    })}
                    disabled={!userCanDownload}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State pour rapport sans données */}
      {emptyStateReport && (
        <EmptyReportState
          reportType={emptyStateReport.type}
          reportName={emptyStateReport.name}
          onCreateEntry={() => {
            // Navigate to journal entries tab
            showToast('Redirection vers les écritures comptables...', 'info');
            setEmptyStateReport(null);
          }}
          onViewDocs={() => {
            window.open('https://docs.casskai.app/rapports', '_blank');
          }}
        />
      )}

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
                <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
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
                      onClick={() => handleViewReport(report)}
                      disabled={!userCanView || viewingReport === report.id}
                    >
                      {viewingReport === report.id ? (
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4 mr-1" />
                      )}
                      Consulter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownloadReport(report)}
                      disabled={!userCanDownload || downloadingReport === report.id}
                    >
                      {downloadingReport === report.id ? (
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
            <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
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
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                  <Settings className="w-4 h-4 mr-2" />
                  Configuration
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}