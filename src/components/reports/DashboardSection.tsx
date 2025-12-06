import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  FileText,
  Calendar
} from 'lucide-react';
import { ReportsDashboardData, FinancialReport } from '../../types/reports.types';

interface DashboardSectionProps {
  dashboardData: ReportsDashboardData | null;
  loading: boolean;
}

const MetricsCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  color: string;
}> = ({ title, value, icon, trend, color }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 100, damping: 15 }}
  >
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>
              €{value.toLocaleString('fr-FR')}
            </p>
          </div>
          {icon}
        </div>
        <div className="mt-4 flex items-center text-sm">
          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
          <span className="text-green-600">{trend}</span>
          <span className="text-gray-600 dark:text-gray-400 ml-2">vs mois dernier</span>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const LoadingState: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const RecentReports: React.FC<{ reports: FinancialReport[] }> = ({ reports }) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ type: "spring", stiffness: 100, damping: 15 }}
  >
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Rapports Récents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reports?.map((report) => (
            <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium">{report.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Généré le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={report.status === 'ready' ? 'default' : 'secondary'}>
                  {report.status}
                </Badge>
                <Button variant="outline" size="sm">
                  Télécharger
                </Button>
              </div>
            </div>
          )) || (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              Aucun rapport récent
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const FinancialMetrics: React.FC<{ data: ReportsDashboardData | null }> = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <MetricsCard
      title="Revenus Totaux"
      value={data?.key_metrics?.total_revenue_ytd || 0}
      icon={<DollarSign className="h-8 w-8 text-green-600" />}
      trend="+12.5%"
      color="text-green-600"
    />

    <MetricsCard
      title="Dépenses Totales"
      value={data?.key_metrics?.total_expenses_ytd || 0}
      icon={<TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />}
      trend="+8.2%"
      color="text-red-600"
    />

    <MetricsCard
      title="Bénéfice Net"
      value={data?.key_metrics?.net_income_ytd || 0}
      icon={<Activity className="h-8 w-8 text-blue-600" />}
      trend="+15.3%"
      color="text-blue-600"
    />

    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Rapports Générés</p>
              <p className="text-2xl font-bold text-purple-600">
                {data?.recent_reports?.length || 0}
              </p>
            </div>
            <FileText className="h-8 w-8 text-purple-600" />
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-green-600">+5.1%</span>
            <span className="text-gray-600 dark:text-gray-400 ml-2">vs mois dernier</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

export const DashboardSection: React.FC<DashboardSectionProps> = ({ dashboardData, loading }) => {
  if (loading) return <LoadingState />;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: 0.1 }}
      className="space-y-6"
    >
      <FinancialMetrics data={dashboardData} />
      <RecentReports reports={dashboardData?.recent_reports || []} />
    </motion.div>
  );
};
