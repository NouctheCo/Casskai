import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KPICard, AnimatedNumber } from '../ui/AnimatedCard';
import { DragDropGrid, DragDropItem } from '../ui/DragDropGrid';
import { AnimatedChart } from '../ui/AnimatedChart';
import { DashboardSkeleton } from '../ui/SkeletonLoader';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  BarChart3,
  Activity,
  Target
} from 'lucide-react';

interface DashboardData {
  revenue: {
    current: number;
    change: number;
  };
  clients: {
    current: number;
    change: number;
  };
  orders: {
    current: number;
    change: number;
  };
  conversion: {
    current: number;
    change: number;
  };
  chartData: {
    revenue: {
      labels: string[];
      datasets: any[];
    };
    clients: {
      labels: string[];
      datasets: any[];
    };
  };
}

interface AnimatedDashboardProps {
  data?: DashboardData;
  isLoading?: boolean;
  onWidgetReorder?: (widgets: DragDropItem[]) => void;
  enableDragDrop?: boolean;
}

export const AnimatedDashboard: React.FC<AnimatedDashboardProps> = ({
  data,
  isLoading = false,
  onWidgetReorder,
  enableDragDrop = true
}) => {
  const [widgets, setWidgets] = useState<DragDropItem[]>([]);

  // Données de démonstration
  const mockData: DashboardData = {
    revenue: { current: 87500, change: 12.5 },
    clients: { current: 1245, change: 8.3 },
    orders: { current: 456, change: -2.1 },
    conversion: { current: 3.2, change: 5.7 },
    chartData: {
      revenue: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Chiffre d\'affaires',
          data: [65000, 70000, 75000, 82000, 85000, 87500],
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          fill: true
        }]
      },
      clients: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Nouveaux clients',
          data: [45, 52, 48, 61, 55, 67],
          backgroundColor: [
            '#FF6384',
            '#36A2EB',
            '#FFCE56',
            '#4BC0C0',
            '#9966FF',
            '#FF9F40'
          ]
        }]
      }
    }
  };

  const dashboardData = data || mockData;

  useEffect(() => {
    if (!isLoading) {
      // Initialiser les widgets
      const initialWidgets: DragDropItem[] = [
        {
          id: 'revenue-kpi',
          content: (
            <KPICard
              title="Chiffre d'affaires"
              value={dashboardData.revenue.current}
              change={dashboardData.revenue.change}
              icon={<DollarSign className="w-6 h-6" />}
              color="blue"
            />
          ),
          dragHandle: enableDragDrop
        },
        {
          id: 'clients-kpi',
          content: (
            <KPICard
              title="Clients actifs"
              value={dashboardData.clients.current}
              change={dashboardData.clients.change}
              icon={<Users className="w-6 h-6" />}
              color="green"
            />
          ),
          dragHandle: enableDragDrop
        },
        {
          id: 'orders-kpi',
          content: (
            <KPICard
              title="Commandes"
              value={dashboardData.orders.current}
              change={dashboardData.orders.change}
              icon={<ShoppingCart className="w-6 h-6" />}
              color={dashboardData.orders.change >= 0 ? "green" : "red"}
            />
          ),
          dragHandle: enableDragDrop
        },
        {
          id: 'conversion-kpi',
          content: (
            <KPICard
              title="Taux de conversion"
              value={`${dashboardData.conversion.current}%`}
              change={dashboardData.conversion.change}
              icon={<Target className="w-6 h-6" />}
              color="purple"
            />
          ),
          dragHandle: enableDragDrop
        },
        {
          id: 'revenue-chart',
          content: (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Évolution du CA
              </h3>
              <div className="h-64">
                <AnimatedChart
                  type="line"
                  data={dashboardData.chartData.revenue}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: false,
                        ticks: {
                          callback(value: any) {
                            return new Intl.NumberFormat('fr-FR', {
                              style: 'currency',
                              currency: 'EUR',
                              notation: 'compact'
                            }).format(value);
                          }
                        }
                      }
                    }
                  }}
                  animationDelay={800}
                />
              </div>
            </div>
          ),
          className: "col-span-2",
          dragHandle: enableDragDrop
        },
        {
          id: 'clients-chart',
          content: (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Nouveaux clients
              </h3>
              <div className="h-64">
                <AnimatedChart
                  type="doughnut"
                  data={dashboardData.chartData.clients}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom' as const
                      }
                    }
                  }}
                  animationDelay={1200}
                />
              </div>
            </div>
          ),
          dragHandle: enableDragDrop
        }
      ];

      setWidgets(initialWidgets);
    }
  }, [isLoading, dashboardData, enableDragDrop]);

  const handleReorder = (newWidgets: DragDropItem[]) => {
    setWidgets(newWidgets);
    onWidgetReorder?.(newWidgets);
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      {/* Header animé */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Tableau de bord
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Vue d'ensemble de votre activité
            </p>
          </div>
          
          {enableDragDrop && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg"
            >
              💡 Glissez-déposez pour réorganiser
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Métriques rapides animées */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
      >
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Revenus</p>
              <div className="text-2xl font-bold mt-1">
                <AnimatedNumber 
                  value={dashboardData.revenue.current} 
                  format={(val) => new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                    notation: 'compact'
                  }).format(val)}
                />
              </div>
            </div>
            <Activity className="w-8 h-8 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Croissance</p>
              <div className="text-2xl font-bold mt-1 flex items-center">
                <AnimatedNumber value={dashboardData.revenue.change} format={(val) => `${val.toFixed(1)}%`} />
                <TrendingUp className="w-5 h-5 ml-2" />
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Clients Actifs</p>
              <div className="text-2xl font-bold mt-1">
                <AnimatedNumber value={dashboardData.clients.current} />
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Commandes</p>
              <div className="text-2xl font-bold mt-1 flex items-center">
                <AnimatedNumber value={dashboardData.orders.current} />
                {dashboardData.orders.change >= 0 ? (
                  <TrendingUp className="w-5 h-5 ml-2" />
                ) : (
                  <TrendingDown className="w-5 h-5 ml-2" />
                )}
              </div>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-200" />
          </div>
        </motion.div>
      </motion.div>

      {/* Widgets réorganisables */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <DragDropGrid
          items={widgets}
          onReorder={handleReorder}
          columns={3}
          className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          animateLayoutChanges
        />
      </motion.div>
    </div>
  );
};