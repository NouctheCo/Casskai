import React from 'react';
import { PurchaseStats } from '../../types/purchase.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PurchaseStatsProps {
  stats: PurchaseStats;
  loading: boolean;
}

const PurchaseStatsComponent: React.FC<PurchaseStatsProps> = ({ stats, loading }) => {
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  if (loading) {
    return (
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
    );
  }

  const statsData = [
    {
      title: t('purchases.stats.totalPurchases'),
      value: stats.total_purchases.toString(),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: t('purchases.stats.totalPurchasesDescription')
    },
    {
      title: t('purchases.stats.totalAmount'),
      value: formatCurrency(stats.total_amount),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: t('purchases.stats.totalAmountDescription')
    },
    {
      title: t('purchases.stats.pendingPayments'),
      value: stats.pending_payments.toString(),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      description: t('purchases.stats.pendingPaymentsDescription'),
      badge: stats.pending_payments > 0 ? 'warning' : null
    },
    {
      title: t('purchases.stats.overduePayments'),
      value: stats.overdue_payments.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      description: t('purchases.stats.overduePaymentsDescription'),
      badge: stats.overdue_payments > 0 ? 'danger' : null
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                    {stat.value}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                </div>
                {stat.badge && (
                  <div className="ml-2">
                    {stat.badge === 'warning' && (
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300 bg-yellow-50">
                        {t('purchases.stats.attention')}
                      </Badge>
                    )}
                    {stat.badge === 'danger' && (
                      <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
                        {t('purchases.stats.urgent')}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PurchaseStatsComponent;
