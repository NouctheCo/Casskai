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

import React, { useState } from 'react';

import { devLogger } from '@/utils/devLogger';

import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

import { useCrm } from '../hooks/useCrm';

import { useCRMAnalytics } from '../hooks/useCRMAnalytics';

import { toastError, toastSuccess, toastCreated, toastUpdated, toastDeleted } from '@/lib/toast-helpers';

import { useAuth } from '../contexts/AuthContext';

import { Button } from '../components/ui/button';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';

import { Badge } from '../components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

import { Alert, AlertDescription } from '../components/ui/alert';

import CrmDashboard from '../components/crm/CrmDashboard';
import ClientsManagement from '../components/crm/ClientsManagement';
import OpportunitiesKanban from '../components/crm/OpportunitiesKanban';
import CommercialActions from '../components/crm/CommercialActions';
import { NewClientModal } from '../components/crm/NewClientModal';
import { NewOpportunityModal } from '../components/crm/NewOpportunityModal';
import { NewActionModal } from '../components/crm/NewActionModal';

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

    exportClientsCsv,

    exportClientsExcel,

    exportOpportunitiesCsv,

    exportOpportunitiesExcel,

    exportActionsCsv,

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
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showNewOpportunityModal, setShowNewOpportunityModal] = useState(false);
  const [showNewActionModal, setShowNewActionModal] = useState(false);



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

        toastSuccess(t('crm.messages.dataUpdated'));

      }

    } catch (error) {

      devLogger.error('Error creating client:', error instanceof Error ? error.message : String(error));

      toastError(t('crm.messages.errorUpdating'));

    }

  };



  // Handle contact creation

  const handleCreateContact = async (contactData: ContactFormData) => {

    try {

      const success = await createContact(contactData);

      if (success) {

        toastSuccess(t('crm.messages.dataUpdated'));

      }

    } catch (error) {

      devLogger.error('Error creating contact:', error instanceof Error ? error.message : String(error));

      toastError(t('crm.messages.errorUpdating'));

    }

  };



  // Handle opportunity creation

  const handleCreateOpportunity = async (opportunityData: OpportunityFormData) => {

    try {

      const success = await createOpportunity(opportunityData);

      if (success) {

        toastSuccess(t('crm.messages.dataUpdated'));

      }

    } catch (error) {

      devLogger.error('Error creating opportunity:', error instanceof Error ? error.message : String(error));

      toastError(t('crm.messages.errorUpdating'));

    }

  };



  // Handle commercial action creation

  const handleCreateAction = async (actionData: CommercialActionFormData) => {

    try {

      const success = await createCommercialAction(actionData);

      if (success) {

        toastSuccess(t('crm.messages.dataUpdated'));

      }

    } catch (error) {

      devLogger.error('Error creating action:', error instanceof Error ? error.message : String(error));

      toastError(t('crm.messages.errorUpdating'));

    }

  };



  // Show error if no company

  if (!currentCompany) {

    return (

      <div className="container mx-auto p-6">

        <Alert>

          <AlertTriangle className="h-4 w-4" />

          <AlertDescription>

            {t('crm.messages.noCompany')}

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

            {t('crm.subtitle')}

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

            {t('crm.buttons.fullReport')}

          </Button>

          <Button

            variant="outline"

            size="sm"

            onClick={fetchDashboardData}

            disabled={loading}

          >

            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />

            {t('crm.buttons.refresh')}

          </Button>

          <Badge variant="secondary" className="px-3 py-1">

            <Sparkles className="w-3 h-3 mr-1" />

            {t('crm.badges.supabaseIntegrated')}

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

              {t('crm.tabs.dashboard')}

            </TabsTrigger>

            <TabsTrigger value="clients" className="flex items-center gap-2">

              <Users className="w-4 h-4" />

              {t('crm.tabs.clients')}

            </TabsTrigger>

            <TabsTrigger value="opportunities" className="flex items-center gap-2">

              <Target className="w-4 h-4" />

              {t('crm.tabs.opportunities')}

            </TabsTrigger>

            <TabsTrigger value="actions" className="flex items-center gap-2">

              <Activity className="w-4 h-4" />

              {t('crm.tabs.actions')}

            </TabsTrigger>

          </TabsList>



          <TabsContent value="dashboard" className="space-y-6">

            {/* Analytics Cards */}

            {conversionMetrics && (

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                <Card>

                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

                    <CardTitle className="text-sm font-medium">{t('crm.metrics.conversionRate')}</CardTitle>

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

                    <CardTitle className="text-sm font-medium">{t('crm.metrics.salesCycle')}</CardTitle>

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

                    <CardTitle className="text-sm font-medium">{t('crm.metrics.weightedPipeline')}</CardTitle>

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

                    <CardTitle className="text-sm font-medium">{t('crm.metrics.averageDealSize')}</CardTitle>

                    <BarChart3 className="h-4 w-4 text-muted-foreground" />

                  </CardHeader>

                  <CardContent>

                    <div className="text-2xl font-bold">€{conversionMetrics.average_deal_size.toLocaleString()}</div>

                    <p className="text-xs text-muted-foreground">

                      {t('crm.metrics.averageDealSizeDesc')}

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

                  onCreateClient={() => setShowNewClientModal(true)}

                  onCreateOpportunity={() => setShowNewOpportunityModal(true)}

                  onCreateAction={() => setShowNewActionModal(true)}

                />

              ) : (

                <Card>

                  <CardHeader>

                    <CardTitle>{t('crm.tabs.dashboard')} CRM</CardTitle>

                    <CardDescription>

                      {t('crm.loading.data')}

                    </CardDescription>

                  </CardHeader>

                  <CardContent className="p-6">

                    <div className="flex items-center justify-center py-12">

                      <div className="flex items-center space-x-2">

                        <RefreshCw className="w-5 h-5 animate-spin" />

                        <span>{t('crm.loading.data')}M...</span>

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

                      <CardTitle>{t('crm.sections.salesForecast')}</CardTitle>

                      <CardDescription>{t('crm.sections.salesForecastDesc')}</CardDescription>

                    </div>

                    <Button

                      variant="outline"

                      size="sm"

                      onClick={exportForecastReport}

                    >

                      <Download className="w-4 h-4 mr-2" />

                      {t('crm.buttons.export')}

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

                          <p className="text-sm text-muted-foreground">{t('crm.forecast.forecasted')}</p>

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

                      <CardTitle>{t('crm.sections.clientsManagement')}</CardTitle>

                      <CardDescription>

                        {t('crm.sections.clientsCount', {count: clients.length})}

                      </CardDescription>

                    </div>

                    {clients.length > 0 && (

                      <div className="flex items-center gap-2">

                        <Button

                          variant="outline"

                          size="sm"

                          onClick={exportClientsCsv}

                        >

                          <Download className="w-4 h-4 mr-2" />

                          {t('crm.buttons.csv')}

                        </Button>

                        <Button

                          variant="outline"

                          size="sm"

                          onClick={exportClientsExcel}

                        >

                          <FileText className="w-4 h-4 mr-2" />

                          {t('crm.buttons.excel')}

                        </Button>

                      </div>

                    )}

                  </div>

                </CardHeader>

                <CardContent>
                  <ClientsManagement
                    clients={clients}
                    onCreateClient={() => setShowNewClientModal(true)}
                  />
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

                      <CardTitle>{t('crm.sections.opportunitiesManagement')}</CardTitle>

                      <CardDescription>

                        {t('crm.sections.opportunitiesCount', {count: opportunities.length, pipeline: conversionMetrics.total_pipeline_value.toLocaleString()})}

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

                          {t('crm.buttons.pipelineReport')}

                        </Button>

                        <Button

                          variant="outline"

                          size="sm"

                          onClick={exportOpportunitiesExcel}

                        >

                          <FileText className="w-4 h-4 mr-2" />

                          {t('crm.buttons.excel')}

                        </Button>

                      </div>

                    )}

                  </div>

                </CardHeader>

                <CardContent>

                  <OpportunitiesKanban

                    opportunities={opportunities}

                    onCreateOpportunity={() => setShowNewOpportunityModal(true)}

                  />

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

                      <CardTitle>{t('crm.sections.commercialActions')}</CardTitle>

                      <CardDescription>

                        {t('crm.sections.actionsCount', {count: commercialActions.length})}

                      </CardDescription>

                    </div>

                    {commercialActions.length > 0 && (

                      <Button

                        variant="outline"

                        size="sm"

                        onClick={exportActionsCsv}

                      >

                        <Download className="w-4 h-4 mr-2" />

                        {t('crm.buttons.exportCsv')}

                      </Button>

                    )}

                  </div>

                </CardHeader>

                <CardContent>

                  <CommercialActions

                    actions={commercialActions}

                    onCreateAction={() => setShowNewActionModal(true)}

                  />

                </CardContent>

              </Card>

            </motion.div>

          </TabsContent>

        </Tabs>

      </motion.div>


      {/* Modals */}
      <NewClientModal
        open={showNewClientModal}
        onOpenChange={setShowNewClientModal}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      <NewOpportunityModal
        open={showNewOpportunityModal}
        onOpenChange={setShowNewOpportunityModal}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />

      <NewActionModal
        open={showNewActionModal}
        onOpenChange={setShowNewActionModal}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </div>

  );

}












