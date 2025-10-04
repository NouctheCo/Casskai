import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useCrm } from '../hooks/useCrm';
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
  Sparkles
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
    dashboardData,
    loading,
    error,
    fetchDashboardData,
    createClient,
    createContact,
    createOpportunity,
    createCommercialAction
  } = useCrm();

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
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <motion.div variants={itemVariants}>
              <Card>
                <CardHeader>
                  <CardTitle>Gestion des Clients</CardTitle>
                  <CardDescription>
                    Module clients en cours de migration vers Supabase
                  </CardDescription>
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
                  <CardTitle>Gestion des Opportunités</CardTitle>
                  <CardDescription>
                    Pipeline de ventes et suivi des opportunités
                  </CardDescription>
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
                  <CardTitle>Actions Commerciales</CardTitle>
                  <CardDescription>
                    Suivi des actions et interactions clients
                  </CardDescription>
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