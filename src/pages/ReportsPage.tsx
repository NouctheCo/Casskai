import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useToast } from '../components/ui/use-toast';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { reportsService } from '../services/reportsService';
import {
  FinancialReport,
  ReportTemplate,
  ReportSchedule,
  ReportsDashboardData,
  ReportFilters,
  BalanceSheetData,
  IncomeStatementData,
  CashFlowData,
  ReportAnalytics
} from '../types/reports.types';
import { 
  FileText, 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Plus,
  Search,
  Filter,
  FileDown,
  Eye,
  Edit,
  Trash2,
  Download,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  PieChart,
  LineChart,
  Users,
  Settings,
  Play,
  Pause,
  Sparkles
} from 'lucide-react';

const ReportsPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  
  // State management
  const [dashboardData, setDashboardData] = useState<ReportsDashboardData | null>(null);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<FinancialReport[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetData | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatementData | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

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
    type: '',
    status: '',
    period_start: '',
    period_end: '',
    file_format: ''
  });

  // Load data on component mount
  useEffect(() => {
    if (currentEnterprise?.id) {
      loadDashboardData();
      loadReports();
      loadTemplates();
      loadSchedules();
      loadFinancialData();
    }
  }, [currentEnterprise]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const loadDashboardData = async () => {
    try {
      const response = await reportsService.getDashboardData(currentEnterprise!.id);
      if (response.data) {
        setDashboardData(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadReports = async () => {
    try {
      const response = await reportsService.getReports(currentEnterprise!.id);
      if (response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await reportsService.getTemplates(currentEnterprise!.id);
      if (response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await reportsService.getSchedules(currentEnterprise!.id);
      if (response.data) {
        setSchedules(response.data);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
    }
  };

  const loadFinancialData = async () => {
    try {
      const [balanceResponse, incomeResponse, cashFlowResponse] = await Promise.all([
        reportsService.generateBalanceSheet(currentEnterprise!.id, '2024-01-01', '2024-12-31'),
        reportsService.generateIncomeStatement(currentEnterprise!.id, '2024-01-01', '2024-12-31'),
        reportsService.generateCashFlowStatement(currentEnterprise!.id, '2024-01-01', '2024-12-31')
      ]);

      if (balanceResponse.data) setBalanceSheet(balanceResponse.data);
      if (incomeResponse.data) setIncomeStatement(incomeResponse.data);
      if (cashFlowResponse.data) setCashFlow(cashFlowResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading financial data:', error);
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...reports];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(r =>
        r.name.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(r => r.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.file_format) {
      filtered = filtered.filter(r => r.file_format === filters.file_format);
    }
    
    if (filters.period_start) {
      filtered = filtered.filter(r => r.period.start_date >= filters.period_start!);
    }
    
    if (filters.period_end) {
      filtered = filtered.filter(r => r.period.end_date <= filters.period_end!);
    }
    
    setFilteredReports(filtered);
  };

  const handleExportReports = () => {
    reportsService.exportReportsToCSV(filteredReports, 'rapports_financiers');
    toast({
      title: 'Export réussi',
      description: 'Les rapports ont été exportés en CSV'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'generating': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'published': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'generating': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'draft': return <Edit className="h-4 w-4 text-gray-500" />;
      case 'archived': return <FileText className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="reports">Rapports</TabsTrigger>
            <TabsTrigger value="templates">Modèles</TabsTrigger>
            <TabsTrigger value="schedules">Planification</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="new-report">Nouveau</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Rapports</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.total_reports}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <FileText className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Ce Mois</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.reports_this_month}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Automatisés</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.automated_reports}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Settings className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Prévus Aujourd'hui</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.scheduled_today}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Financial Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Indicateurs Financiers Clés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-sm text-gray-600">Chiffre d'Affaires YTD</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(dashboardData.key_metrics.total_revenue_ytd)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-sm text-gray-600">Charges YTD</p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(dashboardData.key_metrics.total_expenses_ytd)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Résultat Net YTD</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(dashboardData.key_metrics.net_income_ytd)}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-gray-600">Position de Trésorerie</p>
                        <p className="text-2xl font-bold text-purple-600">
                          {formatCurrency(dashboardData.key_metrics.cash_position)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reports by Type and Format */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Répartition par Type</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.stats.by_type.map((typeData) => (
                          <div key={typeData.type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={getTypeColor(typeData.type)}>
                                {typeData.type.replace('_', ' ')}
                              </Badge>
                              <span className="font-medium">{typeData.count} rapports</span>
                            </div>
                            {typeData.last_generated && (
                              <span className="text-xs text-gray-500">
                                {new Date(typeData.last_generated).toLocaleDateString('fr-FR')}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Formats Préférés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.stats.by_format.map((formatData) => (
                          <div key={formatData.format} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium capitalize">{formatData.format}</span>
                              <span className="text-sm text-gray-600">
                                {formatData.count} ({formatData.percentage.toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={formatData.percentage} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Reports and Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Rapports Récents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {dashboardData.recent_reports.map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(report.status)}
                              <div>
                                <p className="font-medium text-sm">{report.name}</p>
                                <p className="text-xs text-gray-600">
                                  {report.generated_at ? new Date(report.generated_at).toLocaleDateString('fr-FR') : 'En cours'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTypeColor(report.type)}>
                                {report.type.replace('_', ' ')}
                              </Badge>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Alertes et Notifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium text-orange-800">Données manquantes</p>
                            <p className="text-sm text-orange-600">{dashboardData.alerts.missing_data} rapports affectés</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                          <AlertTriangle className="h-5 w-5 text-red-500" />
                          <div>
                            <p className="font-medium text-red-800">Planifications échouées</p>
                            <p className="text-sm text-red-600">{dashboardData.alerts.failed_schedules} échecs</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-500" />
                          <div>
                            <p className="font-medium text-blue-800">Rapports obsolètes</p>
                            <p className="text-sm text-blue-600">{dashboardData.alerts.outdated_reports} à mettre à jour</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un rapport..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous types</SelectItem>
                        <SelectItem value="balance_sheet">Bilan</SelectItem>
                        <SelectItem value="income_statement">Compte de résultat</SelectItem>
                        <SelectItem value="cash_flow">Flux de trésorerie</SelectItem>
                        <SelectItem value="trial_balance">Balance générale</SelectItem>
                        <SelectItem value="profit_loss">Profit & Pertes</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="generating">En cours</SelectItem>
                        <SelectItem value="ready">Prêt</SelectItem>
                        <SelectItem value="published">Publié</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.file_format}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, file_format: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="pdf">PDF</SelectItem>
                        <SelectItem value="excel">Excel</SelectItem>
                        <SelectItem value="csv">CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports List */}
            <div className="grid gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{report.name}</h3>
                          <Badge className={getTypeColor(report.type)}>
                            {report.type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline">
                            {report.file_format.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Période: {new Date(report.period.start_date).toLocaleDateString('fr-FR')} - {new Date(report.period.end_date).toLocaleDateString('fr-FR')}
                          </div>
                          {report.generated_at && (
                            <div>
                              Généré le: {new Date(report.generated_at).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {report.file_size && (
                            <div>
                              Taille: {Math.round(report.file_size / 1024)} KB
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {report.status === 'ready' && report.file_url && (
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Report Options */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={report.include_notes}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span>Inclure notes</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={report.include_charts}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span>Inclure graphiques</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={report.show_variance}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span>Afficher écarts</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Accès: </span>
                        <Badge variant="outline">{report.access_level}</Badge>
                      </div>
                    </div>

                    {/* Comparison Info */}
                    {report.comparison?.enabled && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Comparaison activée:</strong> {report.comparison.period_type}
                          {report.comparison.comparison_start && report.comparison.comparison_end && (
                            <span> ({new Date(report.comparison.comparison_start).toLocaleDateString('fr-FR')} - {new Date(report.comparison.comparison_end).toLocaleDateString('fr-FR')})</span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Progress for generating reports */}
                    {report.status === 'generating' && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Génération en cours...</span>
                          <span className="text-sm text-gray-600">75%</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReports.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rapport trouvé</h3>
                  <p className="text-gray-600 mb-4">
                    Aucun rapport ne correspond aux critères de recherche actuels.
                  </p>
                  <Button onClick={() => setFilters({ search: '', type: '', status: '', period_start: '', period_end: '', file_format: '' })}>
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
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
                        <Badge className={getTypeColor(template.type)}>
                          {template.type.replace('_', ' ')}
                        </Badge>
                        {template.is_default && (
                          <Badge variant="outline" className="ml-2">Par défaut</Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!template.is_default && (
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Sections:</span>
                        <span className="font-medium">{template.sections.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Police:</span>
                        <span className="font-medium">{template.styling.font_family}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Créé le:</span>
                        <span className="font-medium">
                          {new Date(template.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button className="w-full" size="sm">
                        Utiliser ce modèle
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Schedules Tab */}
          <TabsContent value="schedules" className="space-y-6">
            <div className="grid gap-6">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{schedule.name}</h3>
                          <Badge className={schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {schedule.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Badge variant="outline">
                            {schedule.frequency}
                          </Badge>
                        </div>
                        {schedule.description && (
                          <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Prochaine exécution:</span> {new Date(schedule.next_run!).toLocaleDateString('fr-FR')} à {schedule.time}
                          </div>
                          <div>
                            <span className="font-medium">Format:</span> {schedule.file_format.toUpperCase()}
                          </div>
                          {schedule.last_run && (
                            <div>
                              <span className="font-medium">Dernière exécution:</span> {new Date(schedule.last_run).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Destinataires:</span> {schedule.recipients.length}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          {schedule.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
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
                        />
                        <span>Envoi automatique</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={schedule.include_charts}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span>Inclure graphiques</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Fréquence: </span>
                        <span className="font-medium">{schedule.frequency}</span>
                      </div>
                    </div>

                    {/* Recipients */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Destinataires:</p>
                      <div className="flex flex-wrap gap-2">
                        {schedule.recipients.map((recipient, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {recipient.name} ({recipient.role})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {/* Financial Data Preview */}
            {balanceSheet && incomeStatement && cashFlow && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Bilan Simplifié
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Actif:</span>
                        <span className="font-semibold">{formatCurrency(balanceSheet.assets.total_assets)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Passif:</span>
                        <span className="font-semibold">{formatCurrency(balanceSheet.liabilities.total_liabilities)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Capitaux Propres:</span>
                        <span className="font-semibold">{formatCurrency(balanceSheet.equity.total_equity)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Équilibre:</span>
                          <span className={`font-semibold ${balanceSheet.assets.total_assets === balanceSheet.total_liabilities_equity ? 'text-green-600' : 'text-red-600'}`}>
                            {balanceSheet.assets.total_assets === balanceSheet.total_liabilities_equity ? '✓ Équilibré' : '✗ Déséquilibré'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Compte de Résultat
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Chiffre d'Affaires:</span>
                        <span className="font-semibold text-green-600">{formatCurrency(incomeStatement.revenue.net_revenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Charges:</span>
                        <span className="font-semibold text-red-600">{formatCurrency(incomeStatement.cost_of_goods_sold.total_cogs + incomeStatement.operating_expenses.total_operating_expenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Résultat Opérationnel:</span>
                        <span className="font-semibold">{formatCurrency(incomeStatement.operating_income)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Résultat Net:</span>
                          <span className={`font-semibold ${incomeStatement.net_income >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(incomeStatement.net_income)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Flux de Trésorerie
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Flux Exploitation:</span>
                        <span className="font-semibold">{formatCurrency(cashFlow.operating_activities.net_cash_from_operations)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Flux Investissement:</span>
                        <span className="font-semibold">{formatCurrency(cashFlow.investing_activities.net_cash_from_investing)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Flux Financement:</span>
                        <span className="font-semibold">{formatCurrency(cashFlow.financing_activities.net_cash_from_financing)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Variation Nette:</span>
                          <span className={`font-semibold ${cashFlow.net_cash_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(cashFlow.net_cash_change)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Analytics Tools */}
            <Card>
              <CardHeader>
                <CardTitle>Outils d'Analyse</CardTitle>
                <p className="text-sm text-gray-600">
                  Analysez vos données financières avec des outils avancés
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse des Ratios</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Calculez et analysez les ratios financiers clés de votre entreprise
                    </p>
                    <Button variant="outline">
                      Analyser les Ratios
                    </Button>
                  </div>
                  
                  <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center">
                    <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Analyse Temporelle</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Comparez vos performances sur différentes périodes
                    </p>
                    <Button variant="outline">
                      Comparer les Périodes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Report Tab */}
          <TabsContent value="new-report" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer un Nouveau Rapport</CardTitle>
                <p className="text-sm text-gray-600">
                  Générez un nouveau rapport financier personnalisé
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Générateur de Rapport</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Le générateur de rapport sera disponible dans la prochaine version
                  </p>
                  <Button disabled>
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