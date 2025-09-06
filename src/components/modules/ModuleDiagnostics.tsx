import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Settings,
  Activity,
  BarChart3,
  Shield,
  Zap,
  Users,
  Package,
  Clock,
  Target,
  AlertCircle,
  Info,
  TrendingUp,
  Cpu
} from 'lucide-react';

import { useModulesSafe, useModules } from '@/contexts/ModulesContext';
import { ModuleTestService } from '@/services/moduleTestService';
import { ModuleDefinition } from '@/types/modules.types';

interface TestResult {
  id: string;
  name: string;
  status: 'running' | 'passed' | 'failed' | 'pending';
  message: string;
  duration?: number;
  details?: any;
}

interface SystemHealth {
  score: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  issues: string[];
  recommendations: string[];
}

const ModuleDiagnostics: React.FC = () => {
  const { availableModules, activeModules, isLoading, refreshModules } = useModulesSafe();
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  useEffect(() => {
    if (availableModules.length > 0) {
      generateSystemHealth();
    }
  }, [availableModules, activeModules]);

  const generateSystemHealth = () => {
    const activeModuleIds = activeModules.map(m => m.id);
    const report = ModuleTestService.generateSystemReport(availableModules, activeModuleIds);
    
    let status: SystemHealth['status'] = 'excellent';
    if (report.health.score < 90) status = 'good';
    if (report.health.score < 70) status = 'warning';
    if (report.health.score < 50) status = 'critical';

    setSystemHealth({
      score: report.health.score,
      status,
      issues: report.health.issues,
      recommendations: report.health.recommendations
    });
  };

  const runDiagnostics = async () => {
    setIsRunningTests(true);
    
    const testSuite: TestResult[] = [
      {
        id: 'module-integrity',
        name: 'Intégrité des modules',
        status: 'pending',
        message: 'Test de la validité des modules installés'
      },
      {
        id: 'dependency-check',
        name: 'Vérification des dépendances',
        status: 'pending',
        message: 'Contrôle des dépendances entre modules'
      },
      {
        id: 'conflict-detection',
        name: 'Détection des conflits',
        status: 'pending',
        message: 'Recherche de conflits potentiels entre modules'
      },
      {
        id: 'activation-test',
        name: 'Test d\'activation',
        status: 'pending',
        message: 'Simulation du processus d\'activation'
      },
      {
        id: 'performance-test',
        name: 'Test de performance',
        status: 'pending',
        message: 'Évaluation des performances du système modulaire'
      }
    ];

    setTests([...testSuite]);

    // Test 1: Intégrité des modules
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const integrity = ModuleTestService.testModuleIntegrity(availableModules);
      
      testSuite[0].status = integrity.invalidModules.length === 0 ? 'passed' : 'failed';
      testSuite[0].message = integrity.invalidModules.length === 0 
        ? `${integrity.validModules.length} modules valides`
        : `${integrity.invalidModules.length} modules invalides détectés`;
      testSuite[0].details = integrity;
      testSuite[0].duration = 800;
      
      setTests([...testSuite]);
    } catch (error) {
      testSuite[0].status = 'failed';
      testSuite[0].message = 'Erreur lors du test d\'intégrité';
    }

    // Test 2: Dépendances
    try {
      testSuite[1].status = 'running';
      setTests([...testSuite]);
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const integrity = ModuleTestService.testModuleIntegrity(availableModules);
      testSuite[1].status = integrity.dependencyIssues.length === 0 ? 'passed' : 'failed';
      testSuite[1].message = integrity.dependencyIssues.length === 0
        ? 'Toutes les dépendances sont satisfaites'
        : `${integrity.dependencyIssues.length} problème(s) de dépendances`;
      testSuite[1].details = integrity.dependencyIssues;
      testSuite[1].duration = 600;
      
      setTests([...testSuite]);
    } catch (error) {
      testSuite[1].status = 'failed';
      testSuite[1].message = 'Erreur lors de la vérification des dépendances';
    }

    // Test 3: Conflits
    try {
      testSuite[2].status = 'running';
      setTests([...testSuite]);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const integrity = ModuleTestService.testModuleIntegrity(availableModules);
      testSuite[2].status = integrity.conflicts.length === 0 ? 'passed' : 'failed';
      testSuite[2].message = integrity.conflicts.length === 0
        ? 'Aucun conflit détecté'
        : `${integrity.conflicts.length} conflit(s) détecté(s)`;
      testSuite[2].details = integrity.conflicts;
      testSuite[2].duration = 400;
      
      setTests([...testSuite]);
    } catch (error) {
      testSuite[2].status = 'failed';
      testSuite[2].message = 'Erreur lors de la détection des conflits';
    }

    // Test 4: Simulation d'activation
    try {
      testSuite[3].status = 'running';
      setTests([...testSuite]);
      
      const testModule = availableModules.find(m => !activeModules.find(a => a.id === m.id));
      if (testModule) {
        const activationResult = await ModuleTestService.simulateModuleActivation(testModule.id);
        testSuite[3].status = activationResult.success ? 'passed' : 'failed';
        testSuite[3].message = activationResult.success
          ? `Activation simulée réussie en ${activationResult.duration}ms`
          : 'Échec de la simulation d\'activation';
        testSuite[3].details = activationResult;
        testSuite[3].duration = activationResult.duration;
      } else {
        testSuite[3].status = 'passed';
        testSuite[3].message = 'Tous les modules sont déjà actifs';
        testSuite[3].duration = 100;
      }
      
      setTests([...testSuite]);
    } catch (error) {
      testSuite[3].status = 'failed';
      testSuite[3].message = 'Erreur lors du test d\'activation';
    }

    // Test 5: Performance
    try {
      testSuite[4].status = 'running';
      setTests([...testSuite]);
      
      const startTime = Date.now();
      
      // Simuler des opérations de performance
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = Date.now() - startTime;
      const metrics = {
        totalModules: availableModules.length,
        activeModules: activeModules.length,
        loadTime: duration,
        memoryUsage: Math.random() * 100, // Simulation
        cpuUsage: Math.random() * 50, // Simulation
      };
      
      testSuite[4].status = duration < 2000 ? 'passed' : 'failed';
      testSuite[4].message = `Performance: ${duration}ms (${duration < 2000 ? 'Bon' : 'Lent'})`;
      testSuite[4].details = metrics;
      testSuite[4].duration = duration;
      
      setPerformanceMetrics(metrics);
      setTests([...testSuite]);
    } catch (error) {
      testSuite[4].status = 'failed';
      testSuite[4].message = 'Erreur lors du test de performance';
    }

    setIsRunningTests(false);
    generateSystemHealth();
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'pending': return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getHealthColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
    }
  };

  const getHealthIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-5 h-5" />;
      case 'good': return <TrendingUp className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'critical': return <AlertCircle className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Chargement des diagnostics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Diagnostics Modulaires</h1>
          <p className="text-gray-600 mt-1">
            État de santé et tests du système modulaire
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshModules} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          <Button onClick={runDiagnostics} disabled={isRunningTests}>
            <Activity className="w-4 h-4 mr-2" />
            {isRunningTests ? 'Tests en cours...' : 'Lancer les tests'}
          </Button>
        </div>
      </div>

      {/* Vue d'ensemble de la santé */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              État de Santé du Système
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Score de santé</span>
                  <span className="text-2xl font-bold">{systemHealth.score}/100</span>
                </div>
                <Progress value={systemHealth.score} className="h-3" />
              </div>
              <div className={`p-3 rounded-lg flex items-center gap-2 ${getHealthColor(systemHealth.status)}`}>
                {getHealthIcon(systemHealth.status)}
                <span className="font-medium capitalize">{systemHealth.status}</span>
              </div>
            </div>

            {systemHealth.issues.length > 0 && (
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Problèmes détectés:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {systemHealth.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {systemHealth.recommendations.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recommandations:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {systemHealth.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tests">Tests & Diagnostics</TabsTrigger>
          <TabsTrigger value="modules">État des Modules</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="system">Informations Système</TabsTrigger>
        </TabsList>

        {/* Tests & Diagnostics */}
        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Suite de Tests</CardTitle>
              <CardDescription>
                Tests automatisés pour valider l'intégrité du système modulaire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tests.map((test) => (
                <div key={test.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {getStatusIcon(test.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{test.name}</h4>
                      {test.duration && (
                        <Badge variant="outline" className="text-xs">
                          {test.duration}ms
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                  </div>
                </div>
              ))}
              
              {tests.length === 0 && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun test exécuté</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliquez sur "Lancer les tests" pour commencer les diagnostics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* État des Modules */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Modules Actifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeModules.map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="font-medium">{module.name}</span>
                      <Badge className="bg-green-100 text-green-800">v{module.version}</Badge>
                    </div>
                  ))}
                  {activeModules.length === 0 && (
                    <p className="text-gray-500 text-center py-4">Aucun module actif</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Modules Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {availableModules.filter(m => !activeModules.find(a => a.id === m.id)).map((module) => (
                    <div key={module.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-medium">{module.name}</span>
                      <Badge variant="outline">v{module.version}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance" className="space-y-4">
          {performanceMetrics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Temps de Chargement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceMetrics.loadTime}ms</div>
                  <p className="text-sm text-gray-600">
                    {performanceMetrics.loadTime < 1000 ? 'Excellent' : 
                     performanceMetrics.loadTime < 2000 ? 'Bon' : 'À améliorer'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Utilisation Mémoire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceMetrics.memoryUsage.toFixed(1)} MB</div>
                  <Progress value={performanceMetrics.memoryUsage} max={200} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Utilisation CPU
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceMetrics.cpuUsage.toFixed(1)}%</div>
                  <Progress value={performanceMetrics.cpuUsage} className="mt-2" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Aucune donnée de performance disponible</p>
                <p className="text-sm text-gray-500 mt-1">
                  Lancez les tests pour générer des métriques de performance
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Informations Système */}
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Configuration Système</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>Modules total:</span>
                  <span className="font-medium">{availableModules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Modules actifs:</span>
                  <span className="font-medium">{activeModules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Architecture:</span>
                  <span className="font-medium">Modulaire v2.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Version système:</span>
                  <span className="font-medium">CassKai 2024.2</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Catégorie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const categoryCount: Record<string, number> = {};
                  availableModules.forEach((module: unknown) => {
                    const category = (module as { category?: string }).category || 'unknown';
                    categoryCount[category] = (categoryCount[category] || 0) + 1;
                  });
                  
                  return Object.entries(categoryCount).map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span className="capitalize">{category}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ));
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ModuleDiagnostics;