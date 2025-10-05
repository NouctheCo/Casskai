import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCrm } from '../hooks/useCrm';
import { useCRMAnalytics } from '../hooks/useCRMAnalytics';
import { useToast } from '../components/ui/use-toast.js';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import CrmDashboard from '../components/crm/CrmDashboard';
import {
  BarChart3,
  Users,
  Target,
  Activity,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Download,
  FileText,
  TrendingUp,
  Calendar
} from 'lucide-react';
import {
  ClientFormData,
  ContactFormData,
  OpportunityFormData,
  CommercialActionFormData
} from '../types/crm.types';

export default function SalesCrmPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentCompany } = useAuth();

  // Use the new CRM hook
  const {
    clients,
    opportunities,
    commercialActions,
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    createClient,
    createContact,
    createOpportunity,
    createCommercialAction
  } = useCrm();

  // Use CRM analytics hook
  const {
    conversionMetrics,
    salesCycleMetrics,
    forecastData,
    exportClientsCSV,
    exportClientsExcel,
    exportOpportunitiesCSV,
    exportOpportunitiesExcel,
    exportActionsCSV,
    exportPipelineReport,
    exportForecastReport,
    exportDashboardReport
  } = useCRMAnalytics({
    clients,
    opportunities,
    actions: commercialActions
  });

  // State management
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

  // Handle client creation
  const handleCreateClient = async (clientData: ClientFormData) => {
    try {
      const success = await createClient(clientData);
      if (success) {
        toast({
          title: t('common.success'),
          description: 'Client créé avec succès',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors de la création du client',
        variant: 'destructive'
      });
    }
  };

  // Handle contact creation
  const handleCreateContact = async (contactData: ContactFormData) => {
    try {
      const success = await createContact(contactData);
      if (success) {
        toast({
          title: t('common.success'),
          description: 'Contact créé avec succès',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error creating contact:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors de la création du contact',
        variant: 'destructive'
      });
    }
  };

  // Handle opportunity creation
  const handleCreateOpportunity = async (opportunityData: OpportunityFormData) => {
    try {
      const success = await createOpportunity(opportunityData);
      if (success) {
        toast({
          title: t('common.success'),
          description: 'Opportunité créée avec succès',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors de la création de l\'opportunité',
        variant: 'destructive'
      });
    }
  };

  // Handle commercial action creation
  const handleCreateAction = async (actionData: CommercialActionFormData) => {
    try {
      const success = await createCommercialAction(actionData);
      if (success) {
        toast({
          title: t('common.success'),
          description: 'Action commerciale créée avec succès',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error creating action:', error);
      toast({
        title: t('common.error'),
        description: 'Erreur lors de la création de l\'action',
        variant: 'destructive'
      });
    }
  };

  // Show error if no company
  if (!currentCompany) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Aucune entreprise sélectionnée. Veuillez sélectionner une entreprise pour accéder au CRM.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            {t('common.salesCrm', 'Ventes & CRM')}
          </h1>
          <p className="text-muted-foreground">
            Gérez vos clients, opportunités et actions commerciales
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportDashboardReport}
            disabled={loading || clients.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Rapport Complet
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1" />
            Intégré Supabase
          </Badge>
        </div>
      </motion.div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Tabs */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Opportunités
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Actions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Analytics Cards */}
            {conversionMetrics && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taux de Conversion</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conversionMetrics.conversion_rate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      {conversionMetrics.won_opportunities} gagnées / {conversionMetrics.total_opportunities} total
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Cycle de Vente</CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{salesCycleMetrics.average_days_to_close} jours</div>
                    <p className="text-xs text-muted-foreground">
                      Médiane: {salesCycleMetrics.median_days_to_close} jours
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Pipeline Pondéré</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{conversionMetrics.weighted_pipeline_value.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Total: €{conversionMetrics.total_pipeline_value.toLocaleString()}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taille Moyenne</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{conversionMetrics.average_deal_size.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Par opportunité gagnée
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            <motion.div variants={itemVariants}>
              {dashboardData ? (
                <CrmDashboard
                  dashboardData={dashboardData}
                  loading={loading}
                  onCreateClient={() => console.log('Create client')}
                  onCreateOpportunity={() => console.log('Create opportunity')}
                  onCreateAction={() => console.log('Create action')}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Tableau de Bord CRM</CardTitle>
                    <CardDescription>
                      Chargement des données...
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center py-12">
                      <div className="flex items-center space-x-2">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Chargement des données CRM...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* Forecast Section */}
            {forecastData && forecastData.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Prévisions des Ventes</CardTitle>
                      <CardDescription>Prochains 3 mois</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportForecastReport}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {forecastData.map((forecast) => (
                      <div key={forecast.month} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <p className="font-medium">{forecast.month}</p>
                          <p className="text-sm text-muted-foreground">
                            Confiance: {forecast.confidence_level}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Prévu</p>
                          <p className="font-bold">€{forecast.pipeline_revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestion des Clients</CardTitle>
                      <CardDescription>
                        {clients.length} clients
                      </CardDescription>
                    </div>
                    {clients.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportClientsCSV}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportClientsExcel}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Module Clients</h3>
                        <p className="text-sm text-muted-foreground">
                          Fonctionnalité complètement intégrée avec Supabase
                        </p>
                      </div>
                      <Button onClick={() => console.log('Open client management')}>
                        Ouvrir la Gestion des Clients
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Gestion des Opportunités</CardTitle>
                      <CardDescription>
                        {opportunities.length} opportunités - Pipeline: €{conversionMetrics.total_pipeline_value.toLocaleString()}
                      </CardDescription>
                    </div>
                    {opportunities.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportPipelineReport}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Rapport Pipeline
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={exportOpportunitiesExcel}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Target className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Pipeline de Ventes</h3>
                        <p className="text-sm text-muted-foreground">
                          Suivi des opportunités intégré avec Supabase
                        </p>
                      </div>
                      <Button onClick={() => console.log('Open opportunities')}>
                        Ouvrir le Pipeline
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Actions Commerciales</CardTitle>
                      <CardDescription>
                        {commercialActions.length} actions
                      </CardDescription>
                    </div>
                    {commercialActions.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportActionsCSV}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exporter CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-4">
                      <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">Actions Commerciales</h3>
                        <p className="text-sm text-muted-foreground">
                          Historique et planification des actions
                        </p>
                      </div>
                      <Button onClick={() => console.log('Open actions')}>
                        Ouvrir les Actions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}