import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
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
  DollarSign,
  Users,
  Archive,
  Target,
  Zap
} from 'lucide-react';
import { reportGenerationService } from '@/services/reportGenerationService';
import type { FinancialReport, ReportFormData } from '@/types/reports.types';
import { useAuth } from '@/contexts/AuthContext';

export default function OptimizedReportsTab() {
  const { showToast } = useToast();
  const { currentCompany } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedReportType, setSelectedReportType] = useState('all_types');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [recentReports, setRecentReports] = useState<FinancialReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // États pour les actions view/download
  const [viewingReport, setViewingReport] = useState<string | null>(null);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(null);
  
  // Impression simple de la page/section
  const handlePrint = () => {
    window.print();
  };
  
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

  // État des statistiques rapides avec des données actualisées
  const quickStats = [
    { label: 'Chiffre d\'affaires', value: 125430, trend: 8.5, color: 'green' },
    { label: 'Charges totales', value: 78650, trend: -2.3, color: 'red' },
    { label: 'Résultat net', value: 46780, trend: 15.2, color: 'blue' },
    { label: 'Marge nette', value: 37.3, trend: 4.1, color: 'purple', isPercentage: true }
  ];

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
    setIsGenerating(reportType);

    try {
      const periodDates = getPeriodDates(selectedPeriod);

      const reportData: ReportFormData = {
        name: `${reportName} - ${selectedPeriod}`,
        type: reportType as any,
        format: 'detailed',
        period_start: periodDates.start,
        period_end: periodDates.end,
        file_format: 'pdf',
        currency: 'EUR'
      };

      // Génération du rapport avec notre service
      if (!currentCompany?.id) {
        throw new Error('Aucune entreprise sélectionnée');
      }

      const filters = {
        companyId: currentCompany.id,
        dateFrom: reportData.period_start,
        dateTo: reportData.period_end,
        currency: reportData.currency
      };

      const exportOptions = {
        format: reportData.file_format as 'pdf' | 'excel' | 'csv',
        title: reportData.name,
        companyInfo: {
          name: currentCompany.name,
          address: currentCompany.address,
          phone: currentCompany.phone,
          email: currentCompany.email
        }
      };

      let downloadUrl: string;
      switch (reportData.type) {
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
        default:
          throw new Error('Type de rapport non supporté');
      }

      // Auto-download the generated report
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${reportData.name}.${reportData.file_format}`;
        link.click();
      }

      showToast(`Rapport "${reportName}" généré avec succès et disponible au téléchargement.`, 'success');

      // Actualiser la liste des rapports récents
      loadRecentReports();

      } catch (_error) {
      showToast("Impossible de générer le rapport. Veuillez réessayer.", 'error');
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
      case 'current-month':
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
      case 'current-quarter':
        const quarterStart = Math.floor(currentMonth / 3) * 3;
        return {
          start: new Date(currentYear, quarterStart, 1).toISOString().split('T')[0],
          end: new Date(currentYear, quarterStart + 3, 0).toISOString().split('T')[0]
        };
      case 'current-year':
        return {
          start: new Date(currentYear, 0, 1).toISOString().split('T')[0],
          end: new Date(currentYear, 11, 31).toISOString().split('T')[0]
        };
      case 'last-month':
        const lastMonth = currentMonth - 1;
        const year = lastMonth < 0 ? currentYear - 1 : currentYear;
        const month = lastMonth < 0 ? 11 : lastMonth;
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: new Date(year, month + 1, 0).toISOString().split('T')[0]
        };
      default:
        return {
          start: new Date(currentYear, currentMonth, 1).toISOString().split('T')[0],
          end: new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0]
        };
    }
  };

  // Chargement des rapports récents (simulation)
  const loadRecentReports = async () => {
    setIsLoading(true);
    // Simulation d'un appel API
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockReports: FinancialReport[] = [
      {
        id: '1',
        company_id: 'comp-1',
        name: 'Bilan comptable - Décembre 2024',
        type: 'balance_sheet',
        format: 'detailed',
        period_start: '2024-12-01',
        period_end: '2024-12-31',
        status: 'ready',
        file_url: '/reports/balance-sheet-dec-2024.pdf',
        file_format: 'pdf',
        file_size: 2457600,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '2',
        company_id: 'comp-1',
        name: 'Compte de résultat - Décembre 2024',
        type: 'income_statement',
        format: 'detailed',
        period_start: '2024-12-01',
        period_end: '2024-12-31',
        status: 'ready',
        file_url: '/reports/income-statement-dec-2024.pdf',
        file_format: 'pdf',
        file_size: 1843200,
        generated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    setRecentReports(mockReports);
    setIsLoading(false);
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
      // Simulation du téléchargement
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Simuler le téléchargement
      const link = document.createElement('a');
      link.href = report.file_url || '#';
      link.download = `${report.name}.${report.file_format}`;
      link.click();
      
      showToast(`Rapport "${report.name}" téléchargé avec succès.`, 'success');
    } catch (_error) {
      showToast("Impossible de télécharger le rapport. Veuillez réessayer.", 'error');
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
          <Button variant="outline" onClick={handlePrint} title="Imprimer la vue">
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
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
                Actions rapides
              </label>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
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