/* eslint-disable max-lines, max-lines-per-function */
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { EnhancedReportsPage } from '../components/reports/EnhancedReportsPage';
import { DashboardSection } from '../components/reports/DashboardSection';
import { ReportsSection } from '../components/reports/ReportsSection';
import { ReportViewer } from '../components/reports/ReportViewer';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { useAuth } from '../contexts/AuthContext';
import { reportsService } from '../services/reportsService';
import {
  FinancialReport,
  ReportTemplate,
  ReportSchedule,
  ReportsDashboardData,
  ReportFilters
} from '../types/reports.types';
import { 
  FileText, 
  BarChart3, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Trash2,
  Activity,
  Play,
  Pause,
  Sparkles,
  FileDown
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { currentEnterprise } = useEnterprise();

  if (!currentEnterprise?.id) {
    return <EnhancedReportsPage />;
  }

  return <EnhancedReportsPage />;
};

const LegacyReportsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  const { user } = useAuth();
  
  // State management
  const [dashboardData, setDashboardData] = useState<ReportsDashboardData | null>(null);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<FinancialReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Date range state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // January 1st of current year
    end: new Date().toISOString().split('T')[0], // Today
    preset: 'current_year'
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };
  
  // Filter states
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    type: 'all_types',
    status: 'all_statuses',
    period_start: '',
    period_end: '',
    file_format: ''
  });

  // Callback functions - defined before useEffect
  const loadDashboardData = useCallback(async () => {
    if (!currentEnterprise?.id) return;
    try {
      const response = await reportsService.getDashboardData(currentEnterprise.id);
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }, [currentEnterprise?.id]);

  const loadReports = useCallback(async () => {
    if (!currentEnterprise?.id) return;
    try {
      const response = await reportsService.getReports(currentEnterprise.id);
      if (response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  }, [currentEnterprise?.id]);

  const loadTemplates = useCallback(async () => {
    if (!currentEnterprise?.id) return;
    try {
      const response = await reportsService.getTemplates(currentEnterprise.id);
      if (response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }, [currentEnterprise?.id]);

  const loadSchedules = useCallback(async () => {
    if (!currentEnterprise?.id) return;
    try {
      const response = await reportsService.getSchedules(currentEnterprise.id);
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  }, [currentEnterprise?.id]);

  const loadFinancialData = useCallback(async () => {
    if (!currentEnterprise?.id) return;
    try {
      setLoading(false);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setLoading(false);
    }
  }, [currentEnterprise?.id]);

  const applyFilters = useCallback(() => {
    let filtered = [...reports];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type && filters.type !== 'all_types') {
      filtered = filtered.filter(r => r.type === filters.type);
    }

    if (filters.status && filters.status !== 'all_statuses') {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.file_format) {
      filtered = filtered.filter(r => r.file_format === filters.file_format);
    }
    
    if (filters.period_start) {
      filtered = filtered.filter(r => r.period_start >= filters.period_start);
    }
    
    if (filters.period_end) {
      filtered = filtered.filter(r => r.period_end <= filters.period_end);
    }
    
    setFilteredReports(filtered);
  }, [reports, filters]);

  // Load data on component mount
  useEffect(() => {
    if (currentEnterprise?.id) {
      loadDashboardData();
      loadReports();
      loadTemplates();
      loadSchedules();
      loadFinancialData();
    }
  }, [currentEnterprise?.id, loadDashboardData, loadReports, loadTemplates, loadSchedules, loadFinancialData]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleExportReports = () => {
    reportsService.exportReportsToCSV(filteredReports, 'rapports_financiers');
    toast({
      title: 'Export réussi',
      description: 'Les rapports ont été exportés en CSV'
    });
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'balance_sheet': return 'bg-blue-100 text-blue-800';
      case 'income_statement': return 'bg-green-100 text-green-800';
      case 'cash_flow': return 'bg-purple-100 text-purple-800';
      case 'trial_balance': return 'bg-orange-100 text-orange-800';
      case 'profit_loss': return 'bg-pink-100 text-pink-800';
      case 'general_ledger': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDateRangePreset = (preset: string) => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (preset) {
      case 'current_year':
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      case 'last_year':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
      case 'current_quarter': {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        startDate = new Date(today.getFullYear(), quarterStartMonth, 1);
        endDate = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
        break;
      }
      case 'last_month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last_3_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case 'last_6_months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        break;
      case 'last_12_months':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default:
        startDate = new Date(today.getFullYear(), 0, 1);
    }

    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      preset
    });
  };

  const handleViewReport = async (reportId: string) => {
    const res = await reportsService.getReportById(reportId);
    if (res.error || !res.data) {
      toast({ title: 'Erreur', description: res.error?.message || 'Rapport introuvable' });
      return;
    }
    // For now, if a file_url exists, open it; otherwise inform user
    const url = res.data.file_url;
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({ title: 'Rapport sans fichier', description: 'Exportez ou générez le fichier pour l\'afficher.' });
    }
  };

  const handleEditReport = async (reportId: string) => {
    const current = reports.find(r => r.id === reportId);
    if (!current) return;
    const newName = `${current.name} (modifié)`;
    const res = await reportsService.updateReport(reportId, { name: newName });
    if (res.error || !res.data) {
      toast({ title: 'Erreur', description: res.error?.message || 'Échec de la mise à jour' });
      return;
    }
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, name: newName, updated_at: new Date().toISOString() } : r));
    toast({ title: 'Modifié', description: 'Le rapport a été renommé.' });
  };

  const handleDeleteReport = async (reportId: string) => {
    const res = await reportsService.deleteReport(reportId);
    if (res.error) {
      toast({ title: 'Erreur', description: res.error.message });
      return;
    }
    setReports(prev => prev.filter(r => r.id !== reportId));
    toast({ title: 'Supprimé', description: 'Le rapport a été supprimé.' });
  };

  const handleDownloadReport = async (reportId: string) => {
    const res = await reportsService.getDownloadUrl(reportId);
    if (res.error || !res.data) {
      toast({ title: 'Erreur', description: res.error?.message || 'Téléchargement indisponible' });
      return;
    }
    // Trigger download/open
    window.open(res.data, '_blank');
  };

  const handleViewTemplate = (_templateId: string) => {
    // TODO: Implement view template functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La visualisation de modèle sera bientôt disponible'
    });
  };

  const handleUseTemplate = (_templateId: string) => {
    // TODO: Implement use template functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'L\'utilisation de modèle sera bientôt disponible'
    });
  };

  const handleViewSchedule = (_scheduleId: string) => {
    // TODO: Implement view schedule functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La visualisation de planification sera bientôt disponible'
    });
  };

  const handleEditSchedule = (_scheduleId: string) => {
    // TODO: Implement edit schedule functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'L\'édition de planification sera bientôt disponible'
    });
  };

  const handleDeleteSchedule = (_scheduleId: string) => {
    // TODO: Implement delete schedule functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'La suppression de planification sera bientôt disponible'
    });
  };

  const handleToggleSchedule = (_scheduleId: string) => {
    // TODO: Implement toggle schedule functionality
    toast({
      title: 'Fonctionnalité à venir',
      description: 'Le basculement de planification sera bientôt disponible'
    });
  };

  const handleCreateReport = async (reportType: string) => {
    if (!currentEnterprise?.id || !user?.id) {
      toast({
        title: 'Erreur',
        description: 'Entreprise ou utilisateur non trouvé'
      });
      return;
    }

    try {
      setLoading(true);
      
      let _reportData;
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const yearStart = `${new Date().getFullYear()}-01-01`;
      
      switch (reportType) {
        case 'balance_sheet': {
          const balanceSheetRes = await reportsService.generateBalanceSheet(currentEnterprise.id, currentDate);
          if (balanceSheetRes.error || !balanceSheetRes.data) {
            throw new Error(balanceSheetRes.error?.message || 'Erreur lors de la génération du bilan');
          }
          _reportData = balanceSheetRes.data;
          break;
        }
          
        case 'income_statement': {
          const incomeRes = await reportsService.generateIncomeStatement(currentEnterprise.id, yearStart, currentDate);
          if (incomeRes.error || !incomeRes.data) {
            throw new Error(incomeRes.error?.message || 'Erreur lors de la génération du compte de résultat');
          }
          _reportData = incomeRes.data;
          break;
        }
          
        case 'cash_flow': {
          const cashFlowRes = await reportsService.generateCashFlowStatement(currentEnterprise.id, yearStart, currentDate);
          if (cashFlowRes.error || !cashFlowRes.data) {
            throw new Error(cashFlowRes.error?.message || 'Erreur lors de la génération du flux de trésorerie');
          }
          _reportData = cashFlowRes.data;
          break;
        }
          
        case 'trial_balance': {
          const trialBalanceRes = await reportsService.generateTrialBalance(currentEnterprise.id, currentDate);
          if (trialBalanceRes.error || !trialBalanceRes.data) {
            throw new Error(trialBalanceRes.error?.message || 'Erreur lors de la génération de la balance générale');
          }
          _reportData = trialBalanceRes.data;
          break;
        }
          
        default:
          throw new Error('Type de rapport non supporté');
      }

      // Créer le rapport dans la base de données
      const createRes = await reportsService.createReport(currentEnterprise.id, user.id, {
        name: `${getReportTypeName(reportType)} - ${new Date().toLocaleDateString('fr-FR')}`,
        type: reportType as 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance',
        format: 'detailed',
        period_start: yearStart,
        period_end: currentDate,
        file_format: 'pdf',
        currency: 'EUR'
      });

      if (createRes.error || !createRes.data) {
        throw new Error(createRes.error?.message || 'Erreur lors de la sauvegarde du rapport');
      }

      // Actualiser la liste des rapports
      await loadReports();
      
      toast({
        title: 'Rapport créé',
        description: `${getReportTypeName(reportType)} généré avec succès`
      });
      
    } catch (error) {
      console.error('Erreur lors de la création du rapport:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la création du rapport'
      });
    } finally {
      setLoading(false);
    }
  };

  const getReportTypeName = (type: string): string => {
    switch (type) {
      case 'balance_sheet': return 'Bilan';
      case 'income_statement': return 'Compte de Résultat';
      case 'cash_flow': return 'Flux de Trésorerie';
      case 'trial_balance': return 'Balance Générale';
      default: return 'Rapport';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des rapports financiers...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Rapports Financiers
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              Générez et gérez vos rapports comptables et financiers
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
            <Badge variant="outline" className="text-xs">
              Période: {dateRange.start} → {dateRange.end}
            </Badge>
          </div>
          
          {/* Dynamic Date Range Selector */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Période:</span>
            </div>
            <Select value={dateRange.preset} onValueChange={handleDateRangePreset}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current_year">Année en cours</SelectItem>
                <SelectItem value="last_year">Année précédente</SelectItem>
                <SelectItem value="current_month">Mois en cours</SelectItem>
                <SelectItem value="last_month">Mois précédent</SelectItem>
                <SelectItem value="last_3_months">3 derniers mois</SelectItem>
                <SelectItem value="last_6_months">6 derniers mois</SelectItem>
                <SelectItem value="last_12_months">12 derniers mois</SelectItem>
                <SelectItem value="last_30_days">30 derniers jours</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value, preset: 'custom' }))}
                className="w-40"
              />
              <span className="text-gray-500">à</span>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value, preset: 'custom' }))}
                className="w-40"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportReports}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exporter
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            onClick={() => setActiveTab('new-report')}
          >
            <Plus className="h-4 w-4" />
            Nouveau Rapport
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
            <TabsTrigger value="generator">Générateur</TabsTrigger>
            <TabsTrigger value="templates">Modèles</TabsTrigger>
            <TabsTrigger value="schedules">Planification</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="new-report">Nouveau</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardSection dashboardData={dashboardData} loading={loading} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <ReportsSection
              reports={reports}
              filteredReports={filteredReports}
              filters={filters}
              onFiltersChange={setFilters}
              onViewReport={handleViewReport}
              onEditReport={handleEditReport}
              onDeleteReport={handleDeleteReport}
              onDownloadReport={handleDownloadReport}
            />
          </TabsContent>

          {/* Generator Tab - New Advanced Report Viewer */}
          <TabsContent value="generator" className="space-y-6">
            <ReportViewer />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <Badge className={getTypeColor(template.type)}>
                        {template.type?.replace('_', ' ') || 'Type non défini'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span>Sections:</span>
                        <Badge variant="outline">{template.sections?.length ?? 0}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Dernière modification:</span>
                        <span className="font-medium">
                          {new Date(template.updated_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleViewTemplate(template.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Voir
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUseTemplate(template.id)}
                        >
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Planifications de Rapports</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Planification
              </Button>
            </div>

            <div className="grid gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{schedule.name}</h3>
                          <Badge className={getStatusColor(schedule.status)}>
                            {schedule.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>Type: {schedule.report_type?.replace('_', ' ') || 'Type non défini'}</span>
                          <span>Fréquence: {schedule.frequency}</span>
                          <span>Prochaine exécution: {schedule.next_run ? new Date(schedule.next_run).toLocaleDateString('fr-FR') : 'Non défini'} à {schedule.time}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSchedule(schedule.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSchedule(schedule.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={schedule.is_active ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleSchedule(schedule.id)}
                        >
                          {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Schedule Options */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={schedule.auto_send}
                          readOnly
                          className="h-4 w-4"
                          title="Envoi automatique"
                        />
                        <span>Envoi automatique</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={schedule.include_charts}
                          readOnly
                          className="h-4 w-4"
                          title="Inclure graphiques"
                        />
                        <span>Inclure graphiques</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Fréquence: </span>
                        <span className="font-medium">{schedule.frequency}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques d'Utilisation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Rapports générés ce mois</span>
                      <span className="font-bold text-lg">{dashboardData?.stats?.reports_this_month || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rapports automatisés</span>
                      <span className="font-bold text-lg">{dashboardData?.stats?.automated_reports || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Planifications actives</span>
                      <span className="font-bold text-lg">{schedules.filter(s => s.is_active).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Temps de génération moyen</span>
                      <span className="font-bold text-lg">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Taux de succès</span>
                      <span className="font-bold text-lg text-green-600">98.5%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Économies temps</span>
                      <span className="font-bold text-lg text-blue-600">75%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* New Report Tab */}
          <TabsContent value="new-report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer un Nouveau Rapport</CardTitle>
                <p className="text-sm text-gray-600">
                  Sélectionnez le type de rapport que vous souhaitez générer
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleCreateReport('balance_sheet')}
                  >
                    <FileText className="h-8 w-8" />
                    <span>Bilan</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleCreateReport('income_statement')}
                  >
                    <BarChart3 className="h-8 w-8" />
                    <span>Compte de Résultat</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-24 flex flex-col items-center justify-center gap-2"
                    onClick={() => handleCreateReport('cash_flow')}
                  >
                    <Activity className="h-8 w-8" />
                    <span>Flux de Trésorerie</span>
                  </Button>
                </div>
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    💡 <strong>Conseil:</strong> Utilisez les modèles prédéfinis pour gagner du temps
                    ou créez un rapport personnalisé selon vos besoins spécifiques.
                  </p>
                  <Button onClick={() => handleCreateReport('custom')} className="mt-3">
                    Créer un Rapport
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ReportsPage;
