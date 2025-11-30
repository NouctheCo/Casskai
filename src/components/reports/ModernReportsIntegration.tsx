import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, ArrowRight, BarChart3, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnhancedReportsPage } from './EnhancedReportsPage';
import { ReportViewer } from './ReportViewer';
import { useReports } from '@/hooks/useReports';
import { useAuth } from '@/contexts/AuthContext';

export const ModernReportsIntegration: React.FC = () => {
  const { currentCompany } = useAuth();
  const { currentExecution } = useReports(currentCompany?.id || '');
  const [showModernReports, setShowModernReports] = useState(false);
  const [showReportViewer, setShowReportViewer] = useState(false);

  if (showReportViewer) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Générateur de Rapports</h2>
          <Button
            variant="outline"
            onClick={() => setShowReportViewer(false)}
          >
            Retour
          </Button>
        </div>
        <ReportViewer />
      </div>
    );
  }

  if (showModernReports) {
    return <EnhancedReportsPage />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Nouveau Système de Rapports Financiers
                </CardTitle>
                <CardDescription className="text-base">
                  Architecture refactorisée avec calculs professionnels, UX moderne et exportation avancée
                </CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              <Zap className="w-3 h-3 mr-1" />
              Disponible
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="features">Fonctionnalités</TabsTrigger>
              <TabsTrigger value="architecture">Architecture</TabsTrigger>
              <TabsTrigger value="integration">Intégration</TabsTrigger>
            </TabsList>

            <TabsContent value="features" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    🎨 Interface Utilisateur Moderne
                  </h4>
                  <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Interface gradient avec animations Framer Motion</li>
                    <li>• Composants interactifs professionnels</li>
                    <li>• Visualisations de données intégrées</li>
                    <li>• Mode sombre/clair adaptatif</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200">
                    📊 Calculs Financiers Avancés
                  </h4>
                  <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Fonctions SQL optimisées pour PCG/IFRS</li>
                    <li>• Calculs automatisés de ratios financiers</li>
                    <li>• Analyse de tendances et recommandations</li>
                    <li>• Validation automatique des équilibres</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    💾 Exportation Multi-Formats
                  </h4>
                  <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Export PDF avec mise en page professionnelle</li>
                    <li>• Export Excel avec formules et graphiques</li>
                    <li>• Export CSV pour analyse de données</li>
                    <li>• Templates personnalisables</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    ⚡ Performance & Architecture
                  </h4>
                  <ul className="text-sm space-y-1 text-slate-600 dark:text-slate-300">
                    <li>• Architecture Domain-Driven Design</li>
                    <li>• Cache intelligent et mise à jour temps réel</li>
                    <li>• Génération asynchrone avec polling</li>
                    <li>• Compatibilité descendante maintenue</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="architecture" className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-semibold mb-3">Nouvelle Architecture</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-2">
                    <h5 className="font-medium text-blue-600">Domain Layer</h5>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• Report Entity</li>
                      <li>• FinancialReport Entity</li>
                      <li>• IReportRepository</li>
                      <li>• IReportGeneratorService</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-purple-600">Application Layer</h5>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• ReportService</li>
                      <li>• ReportExportService</li>
                      <li>• Validation Logic</li>
                      <li>• Business Rules</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-medium text-green-600">Infrastructure Layer</h5>
                    <ul className="space-y-1 text-slate-600 dark:text-slate-300">
                      <li>• SupabaseReportRepository</li>
                      <li>• Report Generators</li>
                      <li>• SQL RPC Functions</li>
                      <li>• Caching System</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="integration" className="space-y-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Migration en Douceur
                </h4>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  Le nouveau système maintient la compatibilité avec l'ancien tout en offrant une expérience moderne.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-900/20"></div>
                    <span>Hooks existants préservés</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-900/20"></div>
                    <span>Interfaces backwards compatible</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full dark:bg-green-900/20"></div>
                    <span>Migration progressive possible</span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between pt-4 border-t border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse dark:bg-green-900/20"></div>
                <span>Système prêt</span>
              </div>
              <div className="flex items-center space-x-1">
                <BarChart3 className="w-4 h-4" />
                <span>6 types de rapports</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReportViewer(true)}
                disabled={!currentExecution}
              >
                Voir Dernier Rapport
              </Button>
              <Button
                onClick={() => setShowModernReports(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Découvrir le Nouveau Système
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ModernReportsIntegration;
