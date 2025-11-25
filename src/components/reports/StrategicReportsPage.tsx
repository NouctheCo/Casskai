/**
 * Page de Rapports Stratégiques et de Gestion
 * Focus: KPI, Analyses, Pilotage, Décisions stratégiques
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  DollarSign,
  Users,
  Archive,
  Target,
  Zap,
  BarChart3,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { format, startOfYear, endOfYear, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

const strategicReports = [
  {
    type: 'cash_flow',
    name: 'Tableau de flux de trésorerie',
    description: 'Flux de trésorerie par activité (exploitation, investissement, financement)',
    icon: DollarSign,
    color: 'purple',
    category: 'Trésorerie',
    status: 'coming_soon'
  },
  {
    type: 'aged_receivables',
    name: 'Clients échéancier',
    description: 'Analyse des créances clients par ancienneté (< 30j, 30-60j, > 60j)',
    icon: Users,
    color: 'cyan',
    category: 'Crédit Management',
    status: 'coming_soon'
  },
  {
    type: 'aged_payables',
    name: 'Fournisseurs échéancier',
    description: 'Analyse des dettes fournisseurs par échéance',
    icon: Archive,
    color: 'red',
    category: 'Crédit Management',
    status: 'coming_soon'
  },
  {
    type: 'financial_ratios',
    name: 'Ratios financiers',
    description: 'Indicateurs de performance: liquidité, solvabilité, rentabilité',
    icon: Target,
    color: 'emerald',
    category: 'Analyse Financière',
    status: 'coming_soon'
  },
  {
    type: 'budget_variance',
    name: 'Analyse budgétaire',
    description: 'Écarts budget vs réalisé avec analyse des déviations',
    icon: BarChart3,
    color: 'teal',
    category: 'Pilotage',
    status: 'coming_soon'
  },
  {
    type: 'kpi_dashboard',
    name: 'Tableau de bord KPI',
    description: 'Indicateurs clés de performance en temps réel',
    icon: Zap,
    color: 'pink',
    category: 'Pilotage',
    status: 'coming_soon'
  }
];

const datePresets = [
  { value: 'current_month', label: 'Mois en cours', start: startOfMonth(new Date()), end: endOfMonth(new Date()) },
  { value: 'last_month', label: 'Mois dernier', start: startOfMonth(subMonths(new Date(), 1)), end: endOfMonth(subMonths(new Date(), 1)) },
  { value: 'current_year', label: 'Année en cours', start: startOfYear(new Date()), end: endOfYear(new Date()) },
  { value: 'custom', label: 'Personnalisé', start: null, end: null }
];

export const StrategicReportsPage: React.FC = () => {
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [datePreset, setDatePreset] = useState('current_year');
  const [dateRange, setDateRange] = useState({
    start: startOfYear(new Date()).toISOString().split('T')[0],
    end: endOfYear(new Date()).toISOString().split('T')[0]
  });

  const handleDatePresetChange = (value: string) => {
    setDatePreset(value);
    const preset = datePresets.find(p => p.value === value);
    if (preset && preset.start && preset.end) {
      setDateRange({
        start: preset.start.toISOString().split('T')[0],
        end: preset.end.toISOString().split('T')[0]
      });
    }
  };

  const handleGenerateReport = (reportType: string, reportName: string) => {
    toast({
      title: 'Prochainement disponible',
      description: `Le rapport "${reportName}" sera bientôt disponible. Les rapports stratégiques sont en cours de développement.`,
      variant: 'default'
    });
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      purple: 'from-purple-500 to-purple-600',
      cyan: 'from-cyan-500 to-cyan-600',
      red: 'from-red-500 to-red-600',
      emerald: 'from-emerald-500 to-emerald-600',
      teal: 'from-teal-500 to-teal-600',
      pink: 'from-pink-500 to-pink-600'
    };
    return colors[color] || 'from-blue-500 to-blue-600';
  };

  if (!currentEnterprise) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Veuillez sélectionner une entreprise pour accéder aux rapports stratégiques</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Rapports Stratégiques & Gestion</h1>
        <p className="text-gray-600">Analyses, KPI et outils de pilotage pour la prise de décision</p>
      </div>

      {/* Info card - Rapports comptables */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Besoin de rapports comptables ?</p>
                  <p className="text-sm text-blue-700">
                    Les rapports comptables (Bilan, Compte de résultat, Balance) sont disponibles dans le module Comptabilité
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/accounting?tab=reports'}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                Accéder aux rapports comptables
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Période d'analyse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Select value={datePreset} onValueChange={handleDatePresetChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {datePresets.map(preset => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div>
              <label className="text-sm text-gray-600">Date de début</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Date de fin</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full border rounded p-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rapports stratégiques disponibles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Rapports disponibles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {strategicReports.map(report => {
            const Icon = report.icon;
            const isComingSoon = report.status === 'coming_soon';

            return (
              <Card key={report.type} className="hover:shadow-lg transition-shadow relative overflow-hidden">
                {isComingSoon && (
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      Bientôt disponible
                    </Badge>
                  </div>
                )}

                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${getColorClasses(report.color)} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription className="text-sm">{report.description}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline">{report.category}</Badge>
                  </div>

                  <Button
                    onClick={() => handleGenerateReport(report.type, report.name)}
                    disabled={isComingSoon}
                    className="w-full"
                    variant={isComingSoon ? "outline" : "default"}
                  >
                    {isComingSoon ? 'En développement' : 'Générer'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Info - En développement */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <Zap className="h-6 w-6 text-purple-600 mt-1" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-2">
                Rapports stratégiques en cours de développement
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                Les rapports stratégiques et de gestion sont actuellement en développement.
                Ils seront progressivement disponibles dans les prochaines versions.
              </p>
              <p className="text-sm text-purple-700">
                <strong>Priorités de développement :</strong>
              </p>
              <ul className="list-disc list-inside text-sm text-purple-700 mt-2 space-y-1">
                <li>Flux de trésorerie avec projection à 30/60/90 jours</li>
                <li>Analyse crédit clients et fournisseurs</li>
                <li>Ratios financiers automatiques (FR, BFR, ROE, etc.)</li>
                <li>KPI personnalisables par entreprise</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
