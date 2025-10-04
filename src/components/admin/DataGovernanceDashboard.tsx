import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, CheckCircle, TrendingUp, Database, Search,
  Merge, Shield, BarChart3, RefreshCw, Settings, Filter,
  Eye, FileText, Trash2, Award, Users
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';

import {
  dataGovernanceService,
  type CompanyDuplicate,
  type CompanySearchResult,
  type DataQualityMetric
} from '@/services/dataGovernanceService';

interface GovernanceStats {
  totalCompanies: number;
  duplicatesDetected: number;
  mergesCompleted: number;
  averageQualityScore: number;
  pendingActions: number;
}

export const DataGovernanceDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // États pour les données
  const [stats, setStats] = useState<GovernanceStats>({
    totalCompanies: 0,
    duplicatesDetected: 0,
    mergesCompleted: 0,
    averageQualityScore: 0,
    pendingActions: 0
  });
  const [duplicates, setDuplicates] = useState<CompanyDuplicate[]>([]);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetric[]>([]);

  // Chargement initial des données
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, duplicatesData, metricsData] = await Promise.all([
        dataGovernanceService.getGovernanceStats(),
        dataGovernanceService.getDetectedDuplicates(),
        dataGovernanceService.analyzeDataQuality()
      ]);

      setStats(statsData);
      setDuplicates(duplicatesData);
      setQualityMetrics(metricsData);
    } catch (error) {
      console.error('❌ Erreur chargement dashboard:', error);
      showToast("Impossible de charger les données de gouvernance", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const results = await dataGovernanceService.searchCompaniesIntelligent(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('❌ Erreur recherche:', error);
      showToast("Erreur lors de la recherche", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsFalsePositive = async (duplicateId: string) => {
    try {
      const result = await dataGovernanceService.markAsFalsePositive(duplicateId);
      if (result.success) {
        showToast("Doublon marqué comme faux positif", "success");
        loadDashboardData();
      }
    } catch (error) {
      showToast("Impossible de marquer comme faux positif", "error");
    }
  };

  const handleMergeCompanies = async (masterCompanyId: string, duplicateCompanyId: string) => {
    try {
      const result = await dataGovernanceService.mergeCompanies({
        master_company_id: masterCompanyId,
        duplicate_company_id: duplicateCompanyId
      });

      if (result.success) {
        showToast(`Fusion réussie - ${result.migrated_users} utilisateurs migrés`, "success");
        loadDashboardData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Erreur de fusion inconnue",
        "error"
      );
    }
  };

  const handleRecalculateQuality = async () => {
    setLoading(true);
    try {
      const result = await dataGovernanceService.recalculateQualityScores();
      showToast(`Recalcul terminé - ${result.updated} entreprises mises à jour`, "success");
      loadDashboardData();
    } catch (error) {
      showToast("Erreur lors du recalcul des scores", "error");
    } finally {
      setLoading(false);
    }
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Entreprises totales</p>
                <p className="text-2xl font-bold">{stats.totalCompanies.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doublons détectés</p>
                <p className="text-2xl font-bold text-orange-600">{stats.duplicatesDetected}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fusions réalisées</p>
                <p className="text-2xl font-bold text-green-600">{stats.mergesCompleted}</p>
              </div>
              <Merge className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score qualité moyen</p>
                <p className="text-2xl font-bold text-purple-600">{stats.averageQualityScore}%</p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métriques de qualité */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Qualité des données
          </CardTitle>
          <CardDescription>
            Analyse de la complétude et qualité des informations entreprises
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium">{metric.metric_name}</p>
                  <Progress value={metric.percentage} className="w-full mt-1" />
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-bold">{metric.metric_value.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{metric.percentage.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            <Button
              onClick={handleRecalculateQuality}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Recalculer les scores
            </Button>
            <Button onClick={loadDashboardData} disabled={loading} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderDuplicatesTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Doublons détectés ({duplicates.length})
          </CardTitle>
          <CardDescription>
            Entreprises potentiellement en double nécessitant une action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicates.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucun doublon détecté</p>
              <p className="text-muted-foreground">Toutes les entreprises sont uniques</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((duplicate) => (
                <motion.div
                  key={duplicate.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        duplicate.similarity_score >= 95 ? "destructive" :
                        duplicate.similarity_score >= 80 ? "secondary" : "outline"
                      }
                    >
                      {duplicate.similarity_score.toFixed(1)}% similaire
                    </Badge>
                    <Badge variant="outline">{duplicate.detection_method}</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-r pr-4">
                      <h4 className="font-medium text-green-700">Entreprise principale</h4>
                      <p className="font-semibold">{duplicate.primary_company.name}</p>
                      {duplicate.primary_company.siret && (
                        <p className="text-sm text-muted-foreground">
                          SIRET: {duplicate.primary_company.siret}
                        </p>
                      )}
                      <p className="text-xs">
                        Qualité: {duplicate.primary_company.data_quality_score}%
                      </p>
                    </div>

                    <div className="pl-4">
                      <h4 className="font-medium text-orange-700">Doublon potentiel</h4>
                      <p className="font-semibold">{duplicate.duplicate_company.name}</p>
                      {duplicate.duplicate_company.siret && (
                        <p className="text-sm text-muted-foreground">
                          SIRET: {duplicate.duplicate_company.siret}
                        </p>
                      )}
                      <p className="text-xs">
                        Qualité: {duplicate.duplicate_company.data_quality_score}%
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleMergeCompanies(
                        duplicate.primary_company_id,
                        duplicate.duplicate_company_id
                      )}
                      className="flex-1"
                    >
                      <Merge className="h-4 w-4 mr-2" />
                      Fusionner
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMarkAsFalsePositive(duplicate.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Faux positif
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderSearchTab = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recherche intelligente
          </CardTitle>
          <CardDescription>
            Recherche avancée avec détection de similarité et scoring de qualité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Nom d'entreprise, SIRET, ou mots-clés..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={loading || !searchTerm.trim()}>
              <Search className="h-4 w-4 mr-2" />
              Rechercher
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">Résultats ({searchResults.length})</h3>
              {searchResults.map((result) => (
                <div key={result.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{result.name}</h4>
                    <div className="flex gap-2">
                      <Badge variant="outline">
                        Qualité: {result.data_quality_score}%
                      </Badge>
                      <Badge variant="secondary">
                        Score: {result.similarity_score.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  {result.legal_name && result.legal_name !== result.name && (
                    <p className="text-sm text-muted-foreground">
                      Raison sociale: {result.legal_name}
                    </p>
                  )}
                  {result.siret && (
                    <p className="text-sm text-muted-foreground">
                      SIRET: {result.siret}
                    </p>
                  )}
                  <Badge variant="outline" className="mt-2">
                    {result.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (loading && activeTab === 'overview') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Chargement des données de gouvernance...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Gouvernance des données
          </h2>
          <p className="text-muted-foreground">
            Gestion de l'intégrité et de la qualité des données entreprises
          </p>
        </div>

        {stats.pendingActions > 0 && (
          <Badge variant="destructive" className="animate-pulse">
            {stats.pendingActions} actions en attente
          </Badge>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="duplicates" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Doublons ({duplicates.length})
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Recherche
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="duplicates">
          {renderDuplicatesTab()}
        </TabsContent>

        <TabsContent value="search">
          {renderSearchTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
};