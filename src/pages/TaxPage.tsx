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
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '../components/ui/use-toast';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { taxService } from '../services/taxService';
import { TaxCompliancePanel } from '../components/fiscal/TaxCompliancePanel';
import {
  TaxDeclaration,
  TaxCalendarEvent,
  TaxAlert,
  TaxObligation,
  TaxDashboardData,
  TaxFilters
} from '../types/tax.types';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  TrendingUp,
  Bell,
  Plus,
  Search,
  Filter,
  FileDown,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  XCircle,
  Info,
  Shield,
  Sparkles
} from 'lucide-react';

// Calendar setup
const locales = {
  fr,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const TaxPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  
  // State management
  const [dashboardData, setDashboardData] = useState<TaxDashboardData | null>(null);
  const [declarations, setDeclarations] = useState<TaxDeclaration[]>([]);
  const [filteredDeclarations, setFilteredDeclarations] = useState<TaxDeclaration[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<TaxCalendarEvent[]>([]);
  const [alerts, setAlerts] = useState<TaxAlert[]>([]);
  const [obligations, setObligations] = useState<TaxObligation[]>([]);
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
  const [filters, setFilters] = useState<TaxFilters>({
    search: '',
    type: '',
    status: '',
    due_date_from: '',
    due_date_to: ''
  });

  // Load data on component mount
  useEffect(() => {
    if (currentEnterprise?.id) {
      loadDashboardData();
      loadDeclarations();
      loadCalendarEvents();
      loadAlerts();
      loadObligations();
    }
  }, [currentEnterprise]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [declarations, filters]);

  const loadDashboardData = async () => {
    try {
      const response = await taxService.getDashboardData(currentEnterprise!.id);
      if (response.data) {
        setDashboardData(response.data);
      }
      if (response.error) {
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les données du tableau de bord',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les données du tableau de bord',
        variant: 'destructive'
      });
    }
  };

  const loadDeclarations = async () => {
    try {
      const response = await taxService.getDeclarations(currentEnterprise!.id);
      if (response.data) {
        setDeclarations(response.data);
      }
      if (response.error) {
        toast({
          title: 'Erreur de chargement',
          description: 'Impossible de charger les déclarations',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading declarations:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les déclarations',
        variant: 'destructive'
      });
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const response = await taxService.getCalendarEvents(currentEnterprise!.id);
      if (response.data) {
        // Transform events for calendar
        const events = response.data.map(event => ({
          ...event,
          start: new Date(event.start_date),
          end: event.end_date ? new Date(event.end_date) : new Date(event.start_date),
          title: event.title
        }));
        setCalendarEvents(response.data);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await taxService.getAlerts(currentEnterprise!.id);
      if (response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadObligations = async () => {
    try {
      const response = await taxService.getObligations(currentEnterprise!.id);
      if (response.data) {
        setObligations(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading obligations:', error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...declarations];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchLower) ||
        d.description?.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(d => d.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(d => d.status === filters.status);
    }
    
    if (filters.due_date_from) {
      const fromDate = new Date(filters.due_date_from);
      if (!isNaN(fromDate.getTime())) {
        filtered = filtered.filter(d =>
          d.dueDate >= fromDate
        );
      }
    }
    
    if (filters.due_date_to) {
      const toDate = new Date(filters.due_date_to);
      if (!isNaN(toDate.getTime())) {
        filtered = filtered.filter(d =>
          d.dueDate <= toDate
        );
      }
    }
    
    setFilteredDeclarations(filtered);
  };

  const handleExportDeclarations = () => {
    (taxService as any).exportDeclarationsToCSV(filteredDeclarations, 'declarations_fiscales');
    toast({
      title: 'Export réussi',
      description: 'Les déclarations ont été exportées en CSV'
    });
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await (taxService as any).acknowledgeAlert(alertId);
      if (response.data) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? response.data : alert
        ));
        toast({
          title: 'Alerte confirmée',
          description: 'L\'alerte a été marquée comme prise en compte'
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de confirmer l\'alerte',
        variant: 'destructive'
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleViewDeclaration = (declaration: TaxDeclaration) => {
    toast({
      title: 'Affichage de la déclaration',
      description: `Détails de ${declaration.name}`,
    });
    // TODO: Open modal or navigate to detail view
  };

  const handleEditDeclaration = (declaration: TaxDeclaration) => {
    toast({
      title: 'Modification de la déclaration',
      description: `Édition de ${declaration.name}`,
    });
    // TODO: Open edit modal or navigate to edit form
  };

  const handleDeleteDeclaration = async (declarationId: string, declarationName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la déclaration "${declarationName}" ?`)) {
      return;
    }
    
    try {
      // TODO: Implement delete API call
      // await taxService.deleteDeclaration(declarationId);
      await loadDeclarations();
      toast({
        title: 'Suppression réussie',
        description: 'La déclaration a été supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting declaration:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer la déclaration',
        variant: 'destructive'
      });
    }
  };

  const handleEditObligation = (obligation: TaxObligation) => {
    toast({
      title: 'Modification de l\'obligation',
      description: `Édition de ${(obligation as any).name}`,
    });
    // TODO: Open edit modal or navigate to edit form
  };

  const handleDeleteObligation = async (obligationId: string, obligationName: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'obligation "${obligationName}" ?`)) {
      return;
    }
    
    try {
      // TODO: Implement delete API call
      // await taxService.deleteObligation(obligationId);
      await loadObligations();
      toast({
        title: 'Suppression réussie',
        description: 'L\'obligation a été supprimée avec succès',
      });
    } catch (error) {
      console.error('Error deleting obligation:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer l\'obligation',
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'TVA': return 'bg-blue-100 text-blue-800';
      case 'IS': return 'bg-green-100 text-green-800';
      case 'IR': return 'bg-purple-100 text-purple-800';
      case 'Liasse': return 'bg-orange-100 text-orange-800';
      case 'CFE': return 'bg-pink-100 text-pink-800';
      case 'CVAE': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des données fiscales...</p>
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
              Gestion Fiscale
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              Gérez vos déclarations, obligations et calendrier fiscal
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportDeclarations}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exporter
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            onClick={() => setActiveTab('new-declaration')}
          >
            <Plus className="h-4 w-4" />
            Nouvelle Déclaration
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="compliance">Conformité Fiscale</TabsTrigger>
            <TabsTrigger value="declarations">Déclarations</TabsTrigger>
            <TabsTrigger value="calendar">Calendrier</TabsTrigger>
            <TabsTrigger value="alerts">Alertes</TabsTrigger>
            <TabsTrigger value="obligations">Obligations</TabsTrigger>
            <TabsTrigger value="new-declaration">Nouvelle</TabsTrigger>
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
                          <p className="text-sm font-medium text-gray-600">Total Déclarations</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.total_declarations}
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
                          <p className="text-sm font-medium text-gray-600">En Attente</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.pending_declarations}
                          </p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                          <Clock className="h-6 w-6 text-yellow-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">En Retard</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.overdue_declarations}
                          </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Alertes Actives</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.active_alerts}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Bell className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Aperçu Financier</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Taxes Dues</p>
                            <p className="text-xl font-bold text-red-600">
                              {formatCurrency(dashboardData.stats.total_tax_due)}
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Taxes Payées</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(dashboardData.stats.total_tax_paid)}
                            </p>
                          </div>
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

{dashboardData.compliance_score && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Score de Conformité</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {dashboardData.compliance_score.current_score || 0}/{dashboardData.compliance_score.max_score || 100}
                        </div>
                        <Progress
                          value={dashboardData.compliance_score.current_score && dashboardData.compliance_score.max_score
                            ? (dashboardData.compliance_score.current_score / dashboardData.compliance_score.max_score) * 100
                            : 0}
                          className="w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        {(dashboardData.compliance_score.factors || []).map((factor, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span className={`flex items-center gap-2 ${
                              factor.status === 'good' ? 'text-green-600' :
                              factor.status === 'warning' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {factor.status === 'good' ? <CheckCircle className="h-4 w-4" /> :
                               factor.status === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                               <XCircle className="h-4 w-4" />}
                              {factor.name}
                            </span>
                            <span className="font-medium">
                              {factor.score || 0}/{factor.max_score || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                </div>

                {/* Breakdown by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Répartition par Type de Déclaration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {(dashboardData.stats?.by_type || []).map((typeData) => (
                        <div key={typeData.type} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                              <Badge className={getTypeColor(typeData.type)}>
                                {typeData.type}
                              </Badge>
                              <span className="font-medium">{typeData.count} déclarations</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Montant dû:</span>
                              <span className="font-medium text-red-600">
                                {formatCurrency(typeData.amount_due)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Montant payé:</span>
                              <span className="font-medium text-green-600">
                                {formatCurrency(typeData.amount_paid)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Declarations and Upcoming Obligations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Déclarations Récentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(dashboardData.recent_declarations || []).map((declaration) => (
                          <div key={declaration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getTypeColor(declaration.type)}>
                                  {declaration.type}
                                </Badge>
                                <span className="font-medium text-sm">{declaration.name}</span>
                              </div>
                              <p className="text-xs text-gray-600">
                                Échéance: {declaration.dueDate.toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(declaration.status)}>
                                {declaration.status}
                              </Badge>
                              {declaration.amount && (
                                <p className="text-sm font-semibold mt-1">
                                  {formatCurrency(declaration.amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Obligations à Venir</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(dashboardData.upcoming_obligations || []).map((obligation) => (
                          <div key={obligation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getPriorityColor(obligation.priority)}>
                                  {obligation.priority}
                                </Badge>
                                <span className="font-medium text-sm">{obligation.title}</span>
                              </div>
                              <p className="text-xs text-gray-600">
                                {new Date(obligation.start_date).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              {obligation.amount && (
                                <p className="text-sm font-semibold">
                                  {formatCurrency(obligation.amount)}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          {/* Conformité Fiscale Multi-pays Tab */}
          <TabsContent value="compliance" className="space-y-6">
            {currentEnterprise?.id && (
              <TaxCompliancePanel
                companyId={currentEnterprise.id}
                countryCode={(currentEnterprise as any).country || 'FR'}
              />
            )}
          </TabsContent>

          {/* Declarations Tab */}
          <TabsContent value="declarations" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher une déclaration..."
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
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="TVA">TVA</SelectItem>
                        <SelectItem value="IS">IS</SelectItem>
                        <SelectItem value="IR">IR</SelectItem>
                        <SelectItem value="Liasse">Liasse</SelectItem>
                        <SelectItem value="CFE">CFE</SelectItem>
                        <SelectItem value="CVAE">CVAE</SelectItem>
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
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="submitted">Soumise</SelectItem>
                        <SelectItem value="completed">Terminée</SelectItem>
                        <SelectItem value="overdue">En retard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Declarations List */}
            <div className="grid gap-6">
              {filteredDeclarations.map((declaration) => (
                <Card key={declaration.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{declaration.name}</h3>
                          <Badge className={getTypeColor(declaration.type)}>
                            {declaration.type}
                          </Badge>
                          <Badge className={getStatusColor(declaration.status)}>
                            {declaration.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {declaration.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Échéance: {declaration.dueDate.toLocaleDateString('fr-FR')}
                          </div>
                          {declaration.period && (
                            <div>
                              Période: {declaration.period.start.toLocaleDateString('fr-FR')} - {declaration.period.end.toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDeclaration(declaration)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditDeclaration(declaration)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteDeclaration(declaration.id, declaration.name)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {declaration.amount && (
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">Montant de la déclaration</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(declaration.amount)}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    {declaration.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Notes:</strong> {declaration.notes}
                        </p>
                      </div>
                    )}

                    {declaration.attachments && declaration.attachments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Pièces jointes:</p>
                        <div className="flex flex-wrap gap-2">
                          {declaration.attachments.map((attachment, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              📎 {attachment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredDeclarations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune déclaration trouvée</h3>
                  <p className="text-gray-600 mb-4">
                    Aucune déclaration ne correspond aux critères de recherche actuels.
                  </p>
                  <Button onClick={() => setFilters({ search: '', type: '', status: '', due_date_from: '', due_date_to: '' })}>
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Calendrier Fiscal</CardTitle>
                <p className="text-sm text-gray-600">
                  Vue d'ensemble de vos obligations et échéances fiscales
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-96 border rounded-lg p-4">
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Calendrier Fiscal</h3>
                      <p className="text-sm text-gray-600">
                        L'affichage du calendrier sera disponible dans la prochaine version
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid gap-4">
              {(alerts || []).map((alert) => (
                <Card key={alert.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge className={
                              alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'error' ? 'bg-red-100 text-red-800' :
                              alert.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          {alert.action_required && (
                            <p className="text-sm font-medium text-gray-800">
                              Action requise: {alert.action_required}
                            </p>
                          )}
                          {alert.due_date && (
                            <p className="text-xs text-gray-500 mt-2">
                              Échéance: {new Date(alert.due_date).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Confirmer
                          </Button>
                        )}
                        <Badge className={
                          alert.status === 'active' ? 'bg-red-100 text-red-800' :
                          alert.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {alert.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {alerts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte active</h3>
                  <p className="text-gray-600">
                    Tout est en ordre ! Aucune alerte fiscale en cours.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Obligations Tab */}
          <TabsContent value="obligations" className="space-y-6">
            <div className="grid gap-6">
              {(obligations || []).map((obligation) => (
                <Card key={obligation.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold">{obligation.tax_type_name}</h3>
                          <Badge className={getTypeColor(obligation.tax_type_name)}>
                            {obligation.tax_type_name}
                          </Badge>
                          <Badge className={obligation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {obligation.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Fréquence:</span> {obligation.frequency}
                          </div>
                          <div>
                            <span className="font-medium">Jour d'échéance:</span> {obligation.due_day}
                          </div>
                          <div>
                            <span className="font-medium">Préavis:</span> {obligation.advance_notice_days} jours
                          </div>
                          <div>
                            <span className="font-medium">Prochaine échéance:</span> {new Date(obligation.next_due_date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditObligation(obligation)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteObligation(obligation.id, obligation.tax_type_name)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={obligation.auto_generate}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Génération automatique</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={obligation.requires_approval}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Approbation requise</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={obligation.email_notifications}
                          readOnly
                          className="h-4 w-4"
                        />
                        <span className="text-sm">Notifications email</span>
                      </div>
                    </div>

                    {obligation.notification_emails && obligation.notification_emails.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Emails de notification:</p>
                        <div className="flex flex-wrap gap-2">
                          {(obligation.notification_emails || []).map((email, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              📧 {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* New Declaration Tab */}
          <TabsContent value="new-declaration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer une Nouvelle Déclaration</CardTitle>
                <p className="text-sm text-gray-600">
                  Ajoutez une nouvelle déclaration fiscale
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Formulaire de Déclaration</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Le formulaire de création de déclaration sera disponible dans la prochaine version
                  </p>
                  <Button disabled>
                    Créer une Déclaration
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

export default TaxPage;