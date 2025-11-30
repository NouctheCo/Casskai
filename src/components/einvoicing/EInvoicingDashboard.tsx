/**
 * E-invoicing Dashboard Component
 * Main dashboard for French electronic invoicing functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  FileText, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Settings,
  BarChart3,
  Download,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { useEInvoicing } from '../../hooks/useEInvoicing';
import { EInvoiceSubmissionForm } from './EInvoiceSubmissionForm';
import { EInvoiceDocumentsList } from './EInvoiceDocumentsList';
import { EInvoiceStatistics } from './EInvoiceStatistics';
import { EInvoiceSettings } from './EInvoiceSettings';

interface EInvoicingDashboardProps {
  companyId: string;
}

export const EInvoicingDashboard: React.FC<EInvoicingDashboardProps> = ({ 
  companyId 
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  const {
    isEnabled,
    capabilities,
    statistics,
    documents,
    isLoading: einvoicingLoading,
    error,
    enableFeature,
    disableFeature,
    submitInvoice,
    refreshData
  } = useEInvoicing(companyId);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshData();
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [companyId, refreshData]);

  const handleEnableFeature = async () => {
    try {
      await enableFeature();
      await refreshData();
    } catch (error) {
      console.error('Error enabling e-invoicing:', error instanceof Error ? error.message : String(error));
    }
  };

  const handleDisableFeature = async () => {
    try {
      await disableFeature();
      await refreshData();
    } catch (error) {
      console.error('Error disabling e-invoicing:', error instanceof Error ? error.message : String(error));
    }
  };

  if (isLoading || einvoicingLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Progress value={33} className="w-64" />
          <p className="text-muted-foreground">Chargement du module e-invoicing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erreur lors du chargement du module e-invoicing: {error}
        </AlertDescription>
      </Alert>
    );
  }

  // Feature not enabled state
  if (!isEnabled) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Facturation Électronique</CardTitle>
          <p className="text-muted-foreground">
            Conformité EN 16931 • Factur-X 1.0.7 • Chorus Pro
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Fonctionnalités incluses</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Génération automatique Factur-X, UBL et CII
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Transmission sécurisée via Chorus Pro (PPF)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Archivage légal 10 ans
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Suivi du cycle de vie des factures
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Validation EN 16931 complète
              </li>
            </ul>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">
              Obligation légale 2024-2026
            </h4>
            <p className="text-sm text-yellow-700">
              La facturation électronique devient obligatoire progressivement pour toutes 
              les entreprises françaises entre 2024 et 2026. Préparez-vous dès maintenant.
            </p>
          </div>

          <div className="flex justify-center pt-4">
            <Button 
              onClick={handleEnableFeature}
              size="lg"
              className="px-8"
            >
              Activer la facturation électronique
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Cette fonctionnalité peut être désactivée à tout moment dans les paramètres
          </p>
        </CardContent>
      </Card>
    );
  }

  // Main dashboard with enabled features
  return (
    <div className="space-y-6">
      {/* Header with quick stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Facturation Électronique</h1>
          <p className="text-muted-foreground">
            Module EN 16931 • {statistics?.total_documents || 0} document(s) traité(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exporter
          </Button>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Quick stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.total_documents || 0}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.by_status?.DELIVERED || 0}</p>
                <p className="text-xs text-muted-foreground">Livrées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.by_status?.SUBMITTED || 0}</p>
                <p className="text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{statistics?.by_status?.REJECTED || 0}</p>
                <p className="text-xs text-muted-foreground">Rejetées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success rate indicator */}
      {statistics && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Taux de succès</span>
              <span className="text-sm text-muted-foreground">
                {statistics.success_rate}%
              </span>
            </div>
            <Progress value={statistics.success_rate} className="h-2" />
          </CardContent>
        </Card>
      )}

      {/* Main content tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tableau de bord
          </TabsTrigger>
          <TabsTrigger value="submit">
            <Send className="h-4 w-4 mr-2" />
            Soumettre
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <EInvoiceStatistics 
            companyId={companyId}
            statistics={statistics}
          />
        </TabsContent>

        <TabsContent value="submit" className="space-y-6">
          <EInvoiceSubmissionForm 
            companyId={companyId}
            capabilities={capabilities}
            onSubmit={submitInvoice}
          />
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <EInvoiceDocumentsList 
            companyId={companyId}
            documents={documents}
            onRefresh={refreshData}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <EInvoiceSettings 
            companyId={companyId}
            capabilities={capabilities}
            isEnabled={isEnabled}
            onDisable={handleDisableFeature}
            onRefresh={refreshData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
