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
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { dashboardStatsService } from '../../services/dashboardStatsService';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { getCurrentCompanyCurrency } from '@/lib/utils';
interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: string;
}
const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, color }) => {
  const isPositive = change >= 0;
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(change).toFixed(1)}%
        </div>
      </div>
      <h3 className="text-sm text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
};
const ReportsFinancialDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentCompany } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    cashFlow: 0
  });
  const [trends, setTrends] = useState({
    revenueTrend: 0,
    expensesTrend: 0,
    profitTrend: 0,
    cashFlowTrend: 0
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [expensesByCategory, setExpensesByCategory] = useState<any[]>([]);
  const [monthlyComparison, setMonthlyComparison] = useState<any[]>([]);
  useEffect(() => {
    loadDashboardData();
  }, [currentCompany?.id]);
  const loadDashboardData = async () => {
    if (!currentCompany?.id) return;
    try {
      setLoading(true);
      // Charger les statistiques du dashboard
      const stats = await dashboardStatsService.calculateStats(currentCompany.id);
      // KPI Data avec vraies données
      setKpiData({
        revenue: stats.revenue || 0,
        expenses: stats.expenses || 0,
        profit: stats.netIncome || 0,
        cashFlow: 0
      });
      // Vraies tendances calculées
      setTrends({
        revenueTrend: stats.revenueTrend,
        expensesTrend: stats.expensesTrend,
        profitTrend: stats.netIncomeTrend,
        cashFlowTrend: 0
      });
      // Charger les données réelles des graphiques
      const [monthlyRevenue, expensesCat, monthlyComp] = await Promise.all([
        dashboardStatsService.getMonthlyRevenueData(currentCompany.id),
        dashboardStatsService.getExpensesByCategory(currentCompany.id),
        dashboardStatsService.getMonthlyComparison(currentCompany.id)
      ]);
      setRevenueData(monthlyRevenue);
      setExpensesByCategory(expensesCat);
      setMonthlyComparison(monthlyComp);
    } catch (error) {
      logger.error('ReportsFinancialDashboard', 'Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: getCurrentCompanyCurrency(),
      minimumFractionDigits: 0
    }).format(value);
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Period indicator */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>
            <strong>{t('reports.dashboard.periodLabel', 'Période')}</strong> : {t('reports.dashboard.last6Months', '6 derniers mois glissants')}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {t('common.refresh', 'Actualiser')}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('reports.dashboard.revenue', 'Chiffre d\'affaires')}
          value={formatCurrency(kpiData.revenue)}
          change={trends.revenueTrend}
          icon={<DollarSign className="h-6 w-6 text-blue-600" />}
          color="blue"
        />
        <KPICard
          title={t('reports.dashboard.expenses', 'Charges')}
          value={formatCurrency(kpiData.expenses)}
          change={trends.expensesTrend}
          icon={<TrendingDown className="h-6 w-6 text-red-600" />}
          color="red"
        />
        <KPICard
          title={t('reports.dashboard.profit', 'Résultat net')}
          value={formatCurrency(kpiData.profit)}
          change={trends.profitTrend}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          color="green"
        />
        <KPICard
          title={t('reports.dashboard.cashFlow', 'Trésorerie')}
          value={formatCurrency(kpiData.cashFlow)}
          change={trends.cashFlowTrend}
          icon={<Activity className="h-6 w-6 text-purple-600" />}
          color="purple"
        />
      </div>
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart - Evolution CA */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('reports.dashboard.revenueEvolution', 'Évolution du CA')}
            </h3>
          </div>
          {revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="montant"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={t('reports.dashboard.amount', 'Montant')}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">{t('reports.dashboard.noData', 'Aucune donnée disponible pour cette période')}</p>
            </div>
          )}
        </div>
        {/* Pie Chart - Dépenses par catégorie */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('reports.dashboard.expensesByCategory', 'Charges par catégorie')}
            </h3>
          </div>
          {expensesByCategory && expensesByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
              <PieChartIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">{t('reports.dashboard.noData', 'Aucune donnée disponible pour cette période')}</p>
            </div>
          )}
        </div>
      </div>
      {/* Bar Chart - Comparaison mensuelle Produits vs Charges */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('reports.dashboard.monthlyComparison', 'Comparaison mensuelle Produits / Charges')}
          </h3>
        </div>
        {monthlyComparison && monthlyComparison.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar
                dataKey="produits"
                fill="#10b981"
                name={t('reports.dashboard.revenue', 'Produits')}
              />
              <Bar
                dataKey="charges"
                fill="#ef4444"
                name={t('reports.dashboard.expenses', 'Charges')}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">{t('reports.dashboard.noData', 'Aucune donnée disponible pour cette période')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default ReportsFinancialDashboard;