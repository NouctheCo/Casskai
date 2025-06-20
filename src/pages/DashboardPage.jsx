import React, { useEffect, useState, Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import { DollarSign, Users, ShoppingCart, TrendingUp, AlertTriangle, CheckCircle2, Clock, FileText, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const StatCard = ({ title, value, icon, trend, description, isLoading }) => {
  const IconComponent = icon;
  if (isLoading) {
    return (
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <IconComponent className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1"></div>
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)" }}
      className="bg-card"
    >
      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <IconComponent className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && <p className={`text-xs ${trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>{trend}</p>}
          <p className="text-xs text-muted-foreground pt-1">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DeadlineCard = ({ title, date, type, daysLeft, isLoading }) => {
  const Icon = type === 'payment' ? Clock : type === 'tax' ? AlertTriangle : CheckCircle2;
  const color = type === 'payment' ? 'text-blue-500' : type === 'tax' ? 'text-red-500' : 'text-green-500';
  
  if (isLoading) {
    return (
      <div className="flex items-center space-x-4 p-4 border rounded-lg bg-card">
        <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="flex items-center space-x-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
      whileHover={{ scale: 1.02 }}
    >
      <Icon className={`h-6 w-6 ${color}`} />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{date} - {daysLeft > 0 ? `${daysLeft} ${daysLeft === 1 ? 'jour restant' : 'jours restants'}` : 'Échue'}</p>
      </div>
    </motion.div>
  );
};

const ChartPlaceholder = () => (
  <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center animate-pulse">
    <TrendingUp className="h-16 w-16 text-gray-400 dark:text-gray-500" />
  </div>
);

const LazyChart = React.lazy(() => 
  import('@/services/dashboardService.jsx').then(module => {
    if (module.DashboardChart) {
      return { default: module.DashboardChart };
    }
    console.error("DashboardChart not found in module:", module);
    return { default: () => <div className="text-red-500 p-4 border border-red-500 rounded-md">Error: Chart component not found.</div> };
  })
);

export default function DashboardPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const { currentEnterpriseId, user } = useAuth();
  const [stats, setStats] = useState({ revenue: null, clients: null, expenses: null, profit: null });
  const [deadlines, setDeadlines] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingDeadlines, setIsLoadingDeadlines] = useState(true);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  useEffect(() => {
    if (!currentEnterpriseId) {
      setIsLoadingStats(false);
      setIsLoadingDeadlines(false);
      setIsLoadingChart(false);
      setStats({ revenue: 'N/A', clients: 'N/A', expenses: 'N/A', profit: 'N/A' });
      setDeadlines([]);
      setChartData({ labels: ['Jan', 'Feb', 'Mar'], datasets: [{ label: 'N/A', data: [0,0,0]}]});
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [statsResponse, deadlinesResponse, chartResponse] = await Promise.all([
          supabase.rpc('get_dashboard_stats', { p_company_id: currentEnterpriseId }),
          supabase.rpc('get_upcoming_deadlines', { p_company_id: currentEnterpriseId, p_days_threshold: 30 }),
          supabase.rpc('get_monthly_revenue_expense', { p_company_id: currentEnterpriseId })
        ]);

        if (statsResponse.error) throw statsResponse.error;
        if (deadlinesResponse.error) throw deadlinesResponse.error;
        if (chartResponse.error) throw chartResponse.error;

        // Process stats data
        const statsData = statsResponse.data[0] || {};
        setStats({
          revenue: parseFloat(statsData.total_revenue || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
          clients: statsData.active_clients_count || 0,
          expenses: parseFloat(statsData.total_expenses || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }),
          profit: (parseFloat(statsData.total_revenue || 0) - parseFloat(statsData.total_expenses || 0)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
        });
        setIsLoadingStats(false);

        // Process deadlines data
        setDeadlines((deadlinesResponse.data || []).map(d => ({
          id: d.id,
          title: d.title,
          date: new Date(d.due_date).toLocaleDateString('fr-FR'),
          type: d.type,
          daysLeft: Math.max(0, Math.ceil((new Date(d.due_date) - new Date()) / (1000 * 60 * 60 * 24)))
        })));
        setIsLoadingDeadlines(false);

        // Process chart data
        const chartData = chartResponse.data || [];
        const labels = chartData.map(item => 
          new Date(item.month).toLocaleString('fr-FR', { month: 'short', year: '2-digit'})
        );
        const revenueData = chartData.map(item => item.total_revenue || 0);
        const expenseData = chartData.map(item => item.total_expenses || 0);

        setChartData({
          labels,
          datasets: [
            {
              label: t('dashboard.revenue'),
              data: revenueData,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
            },
            {
              label: t('dashboard.expenses'),
              data: expenseData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
            }
          ]
        });
        setIsLoadingChart(false);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({ revenue: 'Erreur', clients: 'Erreur', expenses: 'Erreur', profit: 'Erreur' });
        setDeadlines([]);
        setChartData({ labels: [], datasets: [] });
        setIsLoadingStats(false);
        setIsLoadingDeadlines(false);
        setIsLoadingChart(false);
      }
    };

    fetchDashboardData();
  }, [currentEnterpriseId, t]);

  // Fonction améliorée pour récupérer le nom d'utilisateur
  const getUserName = () => {
    // Vérifier les métadonnées utilisateur
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    
    if (user?.user_metadata?.display_name) {
      return user.user_metadata.display_name;
    }
    
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    
    // Fallback sur l'email
    if (user?.email) {
      const emailName = user.email.split('@')[0];
      // Capitaliser la première lettre
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    // Dernier recours
    return t('common.guest');
  };

  const userName = getUserName();

  const statCards = [
    { title: t('dashboard.totalRevenue', 'Total Revenue'), value: stats.revenue, icon: DollarSign, trend: "+5.2% vs mois dernier", description: t('dashboard.totalRevenueDescription', 'Revenue for the current period'), isLoading: isLoadingStats },
    { title: t('dashboard.activeClients', 'Active Clients'), value: stats.clients, icon: Users, trend: "+10 depuis le mois dernier", description: t('dashboard.activeClientsDescription', 'Number of clients with recent activity'), isLoading: isLoadingStats },
    { title: t('dashboard.totalExpenses', 'Total Expenses'), value: stats.expenses, icon: ShoppingCart, trend: "-2.1% vs mois dernier", description: t('dashboard.totalExpensesDescription', 'Charges and expenses for the period'), isLoading: isLoadingStats },
    { title: t('dashboard.netProfit', 'Net Profit'), value: stats.profit, icon: TrendingUp, trend: "+8.0% vs mois dernier", description: t('dashboard.netProfitDescription', 'Profit after deducting charges'), isLoading: isLoadingStats },
  ];

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('common.dashboard', 'Dashboard')}</h1>
        <p className="text-muted-foreground">{t('dashboard.dashboardWelcomeMessage', { userName })}</p>
      </div>

      {!currentEnterpriseId && (
        <Card className="bg-yellow-50 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
              <AlertTriangle /> {t('common.noCompanySelectedTitle', 'No Company Selected')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-600 dark:text-yellow-300">{t('accountingPage.noCompanySelectedMessage', 'Please select a company to access accounting features.')}</p>
            <Button className="mt-4" onClick={() => navigate('/settings')}>{t('common.settings', 'Settings')}</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, index) => (
          <StatCard key={index} {...card} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('dashboard.revenueExpenseTrend', 'Revenue/Expense Trend')}</CardTitle>
            <CardDescription>{t('dashboard.revenueExpenseTrendDescription', 'Evolution of revenue and expenses')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<ChartPlaceholder />}>
              {isLoadingChart ? <ChartPlaceholder /> : <LazyChart data={chartData} />}
            </Suspense>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>{t('dashboard.upcomingDeadlines', 'Upcoming Deadlines')}</CardTitle>
            <CardDescription>{t('dashboard.upcomingDeadlinesDescription', 'Upcoming deadlines and obligations')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {isLoadingDeadlines ? (
              Array(3).fill(0).map((_, i) => <DeadlineCard key={`loader-${i}`} isLoading={true} />)
            ) : deadlines.length > 0 ? (
              deadlines.map(deadline => <DeadlineCard key={deadline.id} {...deadline} />)
            ) : (
              <p className="text-muted-foreground">{t('dashboard.noUpcomingDeadlines', 'No upcoming deadlines')}</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-8"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.shortcutsTitle', 'Quick Shortcuts')}</CardTitle>
            <CardDescription>{t('dashboard.shortcutsDescription', 'Quickly access main features')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/invoicing')}>
                <FileText className="h-6 w-6 mb-2" />
                {t('dashboard.newInvoice', 'New Invoice')}
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/accounting')}>
                <BookOpen className="h-6 w-6 mb-2" />
                {t('journalEntries.newEntry', 'New Entry')}
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/purchases')}>
                <ShoppingCart className="h-6 w-6 mb-2" />
                {t('dashboard.newPurchaseOrder', 'New Purchase Order')}
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/sales-crm')}>
                <Users className="h-6 w-6 mb-2" />
                {t('dashboard.newOpportunity', 'New Opportunity')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}