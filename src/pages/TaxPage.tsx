/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 * 
 * Ce logiciel est la propriété exclusive de NOUTCHE CONSEIL.
 * Toute reproduction, distribution ou utilisation non autorisée est interdite.
 * 
 * This software is the exclusive property of NOUTCHE CONSEIL.
 * Any unauthorized reproduction, distribution or use is prohibited.
 */

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
import { toastError, toastSuccess, toastDeleted, toastUpdated } from '@/lib/toast-helpers';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { taxService } from '../services/taxService';
import { TaxCompliancePanel } from '../components/fiscal/TaxCompliancePanel';
import { FiscalCalendarTab } from '../components/fiscal/FiscalCalendarTab';
import { AutoVATDeclarationButton } from '../components/fiscal/AutoVATDeclarationButton';
import { FECExportButton } from '../components/fiscal/FECExportButton';
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

  // Form state for new declaration
  const [newDeclaration, setNewDeclaration] = useState({
    type: 'TVA' as 'TVA' | 'IS' | 'Liasse' | 'IR' | 'CFE' | 'CVAE',
    name: '',
    period_start: '',
    period_end: '',
    due_date: '',
    amount: '',
    description: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        toastError(t('tax.errors.loadDashboardData'));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error instanceof Error ? error.message : String(error));
      toastError(t('tax.errors.loadDashboardData'));
    }
  };

  const loadDeclarations = async () => {
    try {
      const response = await taxService.getDeclarations(currentEnterprise!.id);
      if (response.data) {
        setDeclarations(response.data);
      }
      if (response.error) {
        toastError(t('tax.errors.loadDeclarations'));
      }
    } catch (error) {
      console.error('Error loading declarations:', error instanceof Error ? error.message : String(error));
      toastError(t('tax.errors.loadDeclarations'));
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
    taxService.exportDeclarationsToCSV(filteredDeclarations, 'declarations_fiscales');
    toastSuccess(t('tax.success.exportDeclarations'));
  };

  const handleCreateDeclaration = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEnterprise?.id) return;

    setIsSubmitting(true);

    try {
      const declarationData: Omit<TaxDeclaration, 'id'> = {
        type: newDeclaration.type,
        name: newDeclaration.name,
        dueDate: new Date(newDeclaration.due_date),
        status: 'draft',
        amount: newDeclaration.amount ? parseFloat(newDeclaration.amount) : undefined,
        description: newDeclaration.description,
        companyId: currentEnterprise.id,
        countryCode: 'FR',
        period: {
          start: new Date(newDeclaration.period_start),
          end: new Date(newDeclaration.period_end)
        }
      };

      const response = await taxService.createTaxDeclaration(currentEnterprise.id, declarationData);

      if (response.data) {
        toastSuccess(t('tax.success.declarationCreated'));

        // Reset form
        setNewDeclaration({
          type: 'TVA',
          name: '',
          period_start: '',
          period_end: '',
          due_date: '',
          amount: '',
          description: ''
        });

        // Reload data
        await loadDeclarations();
        await loadDashboardData();

        // Switch to declarations tab
        setActiveTab('declarations');
      } else if (response.error) {
        toastError(response.error.message || t('tax.errors.createDeclaration'));
      }
    } catch (error) {
      console.error('Error creating declaration:', error);
      toastError(t('tax.errors.createDeclarationGeneric'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await (taxService as any).acknowledgeAlert(alertId);
      if (response.data) {
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId ? response.data : alert
        ));
        toastSuccess(t('tax.success.alertAcknowledged'));
      }
    } catch (error) {
      toastError(t('tax.errors.acknowledgeAlert'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleViewDeclaration = (declaration: TaxDeclaration) => {
    toastSuccess(t('tax.success.viewDeclaration', { name: declaration.name }));
    // TODO: Open modal or navigate to detail view
  };

  const handleEditDeclaration = (declaration: TaxDeclaration) => {
    toastUpdated(t('tax.success.editDeclaration', { name: declaration.name }));
    // TODO: Open edit modal or navigate to edit form
  };

  const handleDeleteDeclaration = async (declarationId: string, declarationName: string) => {
    if (!window.confirm(t('tax.confirm.deleteDeclaration', { name: declarationName }))) {
      return;
    }
    
    try {
      // TODO: Implement delete API call
      // await taxService.deleteDeclaration(declarationId);
      await loadDeclarations();
      toastDeleted('La déclaration');
    } catch (error) {
      console.error('Error deleting declaration:', error instanceof Error ? error.message : String(error));
      toastError(t('tax.errors.deleteDeclaration'));
    }
  };

  const handleEditObligation = (obligation: TaxObligation) => {
    toastUpdated(t('tax.success.editObligation', { name: (obligation as any).name }));
    // TODO: Open edit modal or navigate to edit form
  };

  const handleDeleteObligation = async (obligationId: string, obligationName: string) => {
    if (!window.confirm(t('tax.confirm.deleteObligation', { name: obligationName }))) {
      return;
    }
    
    try {
      // TODO: Implement delete API call
      // await taxService.deleteObligation(obligationId);
      await loadObligations();
      toastDeleted('L\'obligation');
    } catch (error) {
      console.error('Error deleting obligation:', error instanceof Error ? error.message : String(error));
      toastError(t('tax.errors.deleteObligation'));
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
      default: return <Bell className="h-5 w-5 text-gray-500 dark:text-gray-300" />;
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
          <p className="text-gray-600 dark:text-gray-300">{t('tax.loading')}</p>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">
              {t('tax.title')}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-300 dark:text-gray-300">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              {t('tax.subtitle')}
            </p>
            <Badge variant="secondary" className="text-xs">
              {t('tax.realtime')}
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
            {t('tax.export')}
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            onClick={() => setActiveTab('new-declaration')}
          >
            <Plus className="h-4 w-4" />
            {t('tax.newDeclaration')}
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="dashboard">{t('tax.tabs.dashboard')}</TabsTrigger>
            <TabsTrigger value="compliance">{t('tax.tabs.compliance')}</TabsTrigger>
            <TabsTrigger value="declarations">{t('tax.tabs.declarations')}</TabsTrigger>
            <TabsTrigger value="calendar">{t('tax.tabs.calendar')}</TabsTrigger>
            <TabsTrigger value="alerts">{t('tax.tabs.alerts')}</TabsTrigger>
            <TabsTrigger value="obligations">{t('tax.tabs.obligations')}</TabsTrigger>
            <TabsTrigger value="new-declaration">{t('tax.tabs.new')}</TabsTrigger>
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('tax.metrics.totalDeclarations')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('tax.metrics.pendingDeclarations')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('tax.metrics.overdueDeclarations')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {dashboardData.stats.overdue_declarations}
                          </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{t('tax.metrics.activeAlerts')}</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                      <CardTitle>{t('tax.financialOverview.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg dark:bg-red-900/20">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('tax.financialOverview.taxesDue')}</p>
                            <p className="text-xl font-bold text-red-600 dark:text-red-400">
                              {formatCurrency(dashboardData.stats.total_tax_due)}
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-red-500" />
                        </div>
                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg dark:bg-green-900/20">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{t('tax.financialOverview.taxesPaid')}</p>
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
                      <CardTitle>{t('tax.complianceScore.title')}</CardTitle>
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
                    <CardTitle>{t('tax.breakdownByType.title')}</CardTitle>
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
                              <span className="text-gray-600 dark:text-gray-300">{t('tax.breakdownByType.amountDue')}:</span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {formatCurrency(typeData.amount_due)}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-300">{t('tax.breakdownByType.amountPaid')}:</span>
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
                      <CardTitle>{t('tax.recentDeclarations.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(dashboardData.recent_declarations || []).map((declaration) => (
                          <div key={declaration.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getTypeColor(declaration.type)}>
                                  {declaration.type}
                                </Badge>
                                <span className="font-medium text-sm">{declaration.name}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
                                {t('tax.recentDeclarations.dueDate')}: {declaration.dueDate.toLocaleDateString('fr-FR')}
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
                      <CardTitle>{t('tax.upcomingObligations.title')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(dashboardData.upcoming_obligations || []).map((obligation) => (
                          <div key={obligation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className={getPriorityColor(obligation.priority)}>
                                  {obligation.priority}
                                </Badge>
                                <span className="font-medium text-sm">{obligation.title}</span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300">
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
            {/* Actions rapides : Génération TVA auto + Export FEC */}
            <div className="flex justify-end gap-2">
              <FECExportButton
                companyId={currentEnterprise?.id || ''}
                companyName={currentEnterprise?.name || 'Entreprise'}
              />
              <AutoVATDeclarationButton
                companyId={currentEnterprise?.id || ''}
                onSuccess={() => {
                  loadDeclarations();
                  loadDashboardData();
                }}
              />
            </div>

            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                      <Input
                        placeholder={t('tax.declarations.searchPlaceholder')}
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
                        <SelectValue placeholder={t('tax.declarations.filters.type')} />
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
                        <SelectValue placeholder={t('tax.declarations.filters.status')} />
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
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                          {declaration.description}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {t('tax.declarations.dueDate')}: {declaration.dueDate.toLocaleDateString('fr-FR')}
                          </div>
                          {declaration.period && (
                            <div>
                              {t('tax.declarations.period')}: {declaration.period.start.toLocaleDateString('fr-FR')} - {declaration.period.end.toLocaleDateString('fr-FR')}
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
                      <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-900/30">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{t('tax.declarations.declarationAmount')}</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {formatCurrency(declaration.amount)}
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}

                    {declaration.notes && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                        <p className="text-sm text-blue-800">
                          <strong>{t('tax.declarations.notes')}:</strong> {declaration.notes}
                        </p>
                      </div>
                    )}

                    {declaration.attachments && declaration.attachments.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tax.declarations.attachments')}:</p>
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
                  <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('tax.declarations.noDeclarationsFound.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {t('tax.declarations.noDeclarationsFound.message')}
                  </p>
                  <Button onClick={() => setFilters({ search: '', type: '', status: '', due_date_from: '', due_date_to: '' })}>
                    {t('tax.declarations.noDeclarationsFound.resetFilters')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            {currentEnterprise?.id && (
              <FiscalCalendarTab
                countryCode={(currentEnterprise as any).country || 'FR'}
                enterpriseId={currentEnterprise.id}
                completedEventIds={declarations
                  .filter(d => d.status === 'completed')
                  .map(d => d.id)
                }
              />
            )}
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
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{alert.message}</p>
                          {alert.action_required && (
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                              {t('tax.alerts.actionRequired')}: {alert.action_required}
                            </p>
                          )}
                          {alert.due_date && (
                            <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                              {t('tax.alerts.dueDate')}: {new Date(alert.due_date).toLocaleDateString('fr-FR')}
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
                            {t('tax.alerts.confirm')}
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
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('tax.alerts.noActiveAlerts.title')}</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('tax.alerts.noActiveAlerts.message')}
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
                            {obligation.is_active ? t('tax.obligations.status.active') : t('tax.obligations.status.inactive')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div>
                            <span className="font-medium">{t('tax.obligations.frequency')}:</span> {obligation.frequency}
                          </div>
                          <div>
                            <span className="font-medium">{t('tax.obligations.dueDay')}:</span> {obligation.due_day}
                          </div>
                          <div>
                            <span className="font-medium">{t('tax.obligations.advanceNotice')}:</span> {obligation.advance_notice_days} jours
                          </div>
                          <div>
                            <span className="font-medium">{t('tax.obligations.nextDueDate')}:</span> {new Date(obligation.next_due_date).toLocaleDateString('fr-FR')}
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
                          aria-label={t('tax.obligations.autoGenerate')}
                        />
                        <span className="text-sm">{t('tax.obligations.autoGenerate')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={obligation.requires_approval}
                          readOnly
                          className="h-4 w-4"
                          aria-label={t('tax.obligations.requiresApproval')}
                        />
                        <span className="text-sm">{t('tax.obligations.requiresApproval')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={obligation.email_notifications}
                          readOnly
                          className="h-4 w-4"
                          aria-label={t('tax.obligations.emailNotifications')}
                        />
                        <span className="text-sm">{t('tax.obligations.emailNotifications')}</span>
                      </div>
                    </div>

                    {obligation.notification_emails && obligation.notification_emails.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('tax.obligations.notificationEmails')}:</p>
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
                <CardTitle>{t('tax.newDeclaration.title')}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('tax.newDeclaration.subtitle')}
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateDeclaration} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="type" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.type')} *
                      </label>
                      <Select
                        value={newDeclaration.type}
                        onValueChange={(value) => setNewDeclaration({ ...newDeclaration, type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('tax.newDeclaration.form.selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TVA">{t('tax.newDeclaration.form.types.tva')}</SelectItem>
                          <SelectItem value="IS">{t('tax.newDeclaration.form.types.is')}</SelectItem>
                          <SelectItem value="Liasse">{t('tax.newDeclaration.form.types.liasse')}</SelectItem>
                          <SelectItem value="IR">{t('tax.newDeclaration.form.types.ir')}</SelectItem>
                          <SelectItem value="CFE">{t('tax.newDeclaration.form.types.cfe')}</SelectItem>
                          <SelectItem value="CVAE">{t('tax.newDeclaration.form.types.cvae')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.name')} *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        value={newDeclaration.name}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, name: e.target.value })}
                        placeholder={t('tax.newDeclaration.form.namePlaceholder')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="period_start" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.periodStart')} *
                      </label>
                      <Input
                        id="period_start"
                        type="date"
                        value={newDeclaration.period_start}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, period_start: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="period_end" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.periodEnd')} *
                      </label>
                      <Input
                        id="period_end"
                        type="date"
                        value={newDeclaration.period_end}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, period_end: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="due_date" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.dueDate')} *
                      </label>
                      <Input
                        id="due_date"
                        type="date"
                        value={newDeclaration.due_date}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, due_date: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-sm font-medium">
                        {t('tax.newDeclaration.form.amount')}
                      </label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        value={newDeclaration.amount}
                        onChange={(e) => setNewDeclaration({ ...newDeclaration, amount: e.target.value })}
                        placeholder={t('tax.newDeclaration.form.amountPlaceholder')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="description" className="text-sm font-medium">
                      {t('tax.newDeclaration.form.description')}
                    </label>
                    <Input
                      id="description"
                      type="text"
                      value={newDeclaration.description}
                      onChange={(e) => setNewDeclaration({ ...newDeclaration, description: e.target.value })}
                      placeholder={t('tax.newDeclaration.form.descriptionPlaceholder')}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab('dashboard')}
                    >
                      {t('tax.newDeclaration.form.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !newDeclaration.name || !newDeclaration.period_start || !newDeclaration.period_end || !newDeclaration.due_date}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isSubmitting ? t('tax.newDeclaration.form.creating') : t('tax.newDeclaration.form.create')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default TaxPage;
