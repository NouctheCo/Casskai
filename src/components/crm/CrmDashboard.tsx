import React from 'react';
import { CrmDashboardData } from '../../types/crm.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Users, 
  TrendingUp, 
  Target, 
  DollarSign, 
  Calendar, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Eye
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
interface CrmDashboardProps {
  dashboardData: CrmDashboardData;
  loading: boolean;
  onCreateClient?: () => void;
  onCreateOpportunity?: () => void;
  onCreateAction?: () => void;
}
const CrmDashboard: React.FC<CrmDashboardProps> = ({ 
  dashboardData, 
  loading, 
  onCreateClient,
  onCreateOpportunity,
  onCreateAction
}) => {
  const { t } = useTranslation();
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };
  const getStageColor = (stage: string) => {
    const colors = {
      prospecting: 'bg-blue-100 text-blue-800 border-blue-300',
      qualification: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      proposal: 'bg-purple-100 text-purple-800 border-purple-300',
      negotiation: 'bg-orange-100 text-orange-800 border-orange-300',
      closing: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };
  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-300';
  };
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Charts Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  const { stats, pipeline_stats, revenue_data, recent_opportunities, recent_actions, top_clients } = dashboardData;
  const mainStats = [
    {
      title: t('crm.dashboard.stats.totalClients'),
      value: stats.total_clients.toString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: t('crm.dashboard.stats.activeOpportunities'),
      value: stats.total_opportunities.toString(),
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: t('crm.dashboard.stats.pipelineValue'),
      value: formatCurrency(stats.opportunities_value),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: t('crm.dashboard.stats.conversionRate'),
      value: `${stats.conversion_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    }
  ];
  return (
    <div className="space-y-6">
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Pipeline Overview & Revenue Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('crm.dashboard.pipeline.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pipeline_stats.map((stage, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStageColor(stage.stage)}>
                      {t(`crm.stages.${stage.stage}`)}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      {stage.count} {t('crm.dashboard.pipeline.deals')}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(stage.value)}</div>
                    <div className="text-xs text-gray-500">
                      {t('crm.dashboard.pipeline.avgDeal')}: {formatCurrency(stage.avg_deal_size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {/* Revenue Chart (Mock visualization) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('crm.dashboard.revenue.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenue_data.slice(-6).map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${month.target ? (month.revenue / month.target) * 100 : 100}%` 
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium w-20 text-right">
                      {formatCurrency(month.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('crm.dashboard.revenue.total')}</span>
                <span className="font-medium">
                  {formatCurrency(stats.monthly_revenue)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Opportunities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t('crm.dashboard.recentOpportunities.title')}
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent_opportunities.slice(0, 5).map((opportunity) => (
              <div key={opportunity.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-sm font-medium truncate">{opportunity.title}</h4>
                  <p className="text-xs text-gray-600">{opportunity.client_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getStageColor(opportunity.stage)} size="sm">
                      {t(`crm.stages.${opportunity.stage}`)}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(opportunity.priority)} size="sm">
                      {t(`crm.priority.${opportunity.priority}`)}
                    </Badge>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="text-sm font-medium">{formatCurrency(opportunity.value)}</div>
                  <div className="text-xs text-gray-500">{opportunity.probability}%</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Recent Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t('crm.dashboard.recentActions.title')}
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent_actions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-1 rounded-full ${
                  action.type === 'meeting' ? 'bg-blue-100' :
                  action.type === 'call' ? 'bg-green-100' :
                  action.type === 'email' ? 'bg-purple-100' :
                  'bg-gray-100'
                }`}>
                  <Calendar className="w-3 h-3" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium">{action.title}</h4>
                  <p className="text-xs text-gray-600">{action.client_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={action.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                      size="sm"
                    >
                      {t(`crm.actionStatus.${action.status}`)}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {action.due_date ? formatDate(action.due_date) : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Top Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">
              {t('crm.dashboard.topClients.title')}
            </CardTitle>
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {top_clients.slice(0, 5).map((client, index) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">{client.company_name}</h4>
                    <p className="text-xs text-gray-600">{client.industry}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(client.total_revenue || 0)}</div>
                  <Badge 
                    variant="outline" 
                    className={client.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                    size="sm"
                  >
                    {t(`crm.clientStatus.${client.status}`)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Quick Actions Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">
                {t('crm.dashboard.quickActions')}:
              </span>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  {stats.overdue_actions} {t('crm.dashboard.overdue')}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                  {stats.pending_actions} {t('crm.dashboard.pending')}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onCreateClient}>
                {t('crm.dashboard.actions.newClient')}
              </Button>
              <Button size="sm" variant="outline" onClick={onCreateOpportunity}>
                {t('crm.dashboard.actions.newOpportunity')}
              </Button>
              <Button size="sm" onClick={onCreateAction}>
                {t('crm.dashboard.actions.newAction')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
export default CrmDashboard;
