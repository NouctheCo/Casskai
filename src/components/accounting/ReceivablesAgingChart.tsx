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

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  TrendingUp,
  Clock,
  RefreshCw,
  BarChart3,
  PieChart as PieChartIcon,
  List,
  Loader2,
} from 'lucide-react';
import { AccountingDataService, type ReceivablesAgingAnalysis } from '@/services/accountingDataService';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { logger } from '@/lib/logger';

// Couleurs pour les buckets d'aging
const AGING_COLORS = {
  current: '#22c55e',      // vert - non échu
  days_1_30: '#eab308',    // jaune - 1-30 jours
  days_31_60: '#f97316',   // orange - 31-60 jours
  days_61_90: '#ef4444',   // rouge clair - 61-90 jours
  over_90: '#991b1b',      // rouge foncé - >90 jours
};

const AGING_LABELS = {
  current: 'Non échu',
  days_1_30: '1-30 jours',
  days_31_60: '31-60 jours',
  days_61_90: '61-90 jours',
  over_90: '+90 jours',
};

interface ReceivablesAgingChartProps {
  companyId: string;
  showDetails?: boolean;
  compact?: boolean;
}

export function ReceivablesAgingChart({
  companyId,
  showDetails = true,
  compact = false,
}: ReceivablesAgingChartProps) {
  const { t } = useTranslation();
  const { formatAmount } = useCompanyCurrency();
  const [data, setData] = useState<ReceivablesAgingAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [activeTab, setActiveTab] = useState('chart');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const service = AccountingDataService.getInstance();
      const today = new Date();
      const startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      const result = await service.analyzeReceivables(companyId, startDate, endDate);
      setData(result);
    } catch (error) {
      logger.error('ReceivablesAgingChart', 'Error loading receivables aging:', error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId, loadData]);

  // Préparer les données pour les charts
  const chartData = data ? [
    { name: AGING_LABELS.current, value: data.aged_analysis.current, color: AGING_COLORS.current, key: 'current' },
    { name: AGING_LABELS.days_1_30, value: data.aged_analysis.days_1_30, color: AGING_COLORS.days_1_30, key: 'days_1_30' },
    { name: AGING_LABELS.days_31_60, value: data.aged_analysis.days_31_60, color: AGING_COLORS.days_31_60, key: 'days_31_60' },
    { name: AGING_LABELS.days_61_90, value: data.aged_analysis.days_61_90, color: AGING_COLORS.days_61_90, key: 'days_61_90' },
    { name: AGING_LABELS.over_90, value: data.aged_analysis.over_90, color: AGING_COLORS.over_90, key: 'over_90' },
  ] : [];

  // Calculer le pourcentage en retard
  const overdueAmount = data
    ? data.aged_analysis.days_1_30 + data.aged_analysis.days_31_60 + data.aged_analysis.days_61_90 + data.aged_analysis.over_90
    : 0;
  const overduePercentage = data && data.total_receivables > 0
    ? Math.round((overdueAmount / data.total_receivables) * 100)
    : 0;

  // Créances critiques (>90 jours)
  const criticalAmount = data?.aged_analysis.over_90 || 0;
  const criticalCount = data?.details?.filter(d => d.aging_bucket === 'over_90').length || 0;

  const getBadgeVariant = (bucket: string) => {
    switch (bucket) {
      case 'current': return 'default';
      case 'days_1_30': return 'secondary';
      case 'days_31_60': return 'outline';
      case 'days_61_90': return 'destructive';
      case 'over_90': return 'destructive';
      default: return 'default';
    }
  };

  // Custom tooltip pour les charts
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { color: string } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{item.name}</p>
          <p className="text-lg font-bold" style={{ color: item.payload.color }}>
            {formatAmount(item.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600"/>
            {t('accounting.receivablesAging.title', 'Échéancier créances')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600"/>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.total_receivables === 0) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-blue-600"/>
            {t('accounting.receivablesAging.title', 'Échéancier créances')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-64 text-gray-500">
          <TrendingUp className="h-12 w-12 mb-4 opacity-30"/>
          <p>{t('accounting.receivablesAging.noData', 'Aucune créance en cours')}</p>
        </CardContent>
      </Card>
    );
  }

  // Version compacte pour les widgets dashboard
  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-blue-600"/>
              {t('accounting.receivablesAging.title', 'Échéancier créances')}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* KPIs compacts */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="text-lg font-bold">{formatAmount(data.total_receivables)}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded">
              <div className="text-lg font-bold text-amber-600">{overduePercentage}%</div>
              <div className="text-xs text-gray-500">En retard</div>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <div className="text-lg font-bold text-red-600">{criticalCount}</div>
              <div className="text-xs text-gray-500">Critiques</div>
            </div>
          </div>

          {/* Mini bar chart */}
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number"/>
              <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    );
  }

  // Version complète
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600"/>
              {t('accounting.receivablesAging.title', 'Échéancier créances clients')}
              <HelpTooltip helpKey="helpContent.reports.receivablesAging" variant="info" size="sm"/>
            </CardTitle>
            <CardDescription>
              {t('accounting.receivablesAging.description', 'Analyse des créances par ancienneté')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={(v) => setChartType(v as 'bar' | 'pie')}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4"/>
                    Barres
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4"/>
                    Camembert
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total créances</div>
            <div className="text-2xl font-bold text-blue-600">{formatAmount(data.total_receivables)}</div>
          </div>
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">En retard</div>
            <div className="text-2xl font-bold text-amber-600">{formatAmount(overdueAmount)}</div>
            <div className="text-xs text-gray-500">{overduePercentage}% du total</div>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              Critiques (+90j)
              {criticalCount > 0 && <AlertTriangle className="h-4 w-4 text-red-500"/>}
            </div>
            <div className="text-2xl font-bold text-red-600">{formatAmount(criticalAmount)}</div>
            <div className="text-xs text-gray-500">{criticalCount} facture(s)</div>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Délai moyen</div>
            <div className="text-2xl font-bold text-green-600">{data.average_collection_period}j</div>
            <div className="text-xs text-gray-500">de recouvrement</div>
          </div>
        </div>

        {showDetails ? (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="chart">
                <BarChart3 className="h-4 w-4 mr-2"/>
                Graphique
              </TabsTrigger>
              <TabsTrigger value="details">
                <List className="h-4 w-4 mr-2"/>
                Détails ({data.details?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chart">
              <div className="h-80">
                {chartType === 'bar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {chartData.filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="details">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Facture</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead className="text-right">Montant</TableHead>
                      <TableHead>Échéance</TableHead>
                      <TableHead>Retard</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data.details || []).slice(0, 20).map((item) => (
                      <TableRow key={item.invoice_id}>
                        <TableCell className="font-medium">{item.invoice_number}</TableCell>
                        <TableCell>{item.client_name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatAmount(item.amount)}
                        </TableCell>
                        <TableCell>
                          {new Date(item.due_date).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          {item.days_overdue > 0 ? (
                            <span className="text-red-600 font-medium">
                              {item.days_overdue}j
                            </span>
                          ) : (
                            <span className="text-green-600">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getBadgeVariant(item.aging_bucket)} className="text-xs" style={{ backgroundColor: (AGING_COLORS as Record<string, string>)[item.aging_bucket] }}>
                            {(AGING_LABELS as Record<string, string>)[item.aging_bucket] || item.aging_bucket}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {(data.details?.length || 0) > 20 && (
                  <p className="text-center text-sm text-gray-500 py-2">
                    ... et {(data.details?.length || 0) - 20} autres factures
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30"/>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReceivablesAgingChart;
