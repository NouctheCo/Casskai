import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { useEnterprise } from '@/hooks/useEnterpriseContext';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedDashboard } from '@/components/dashboard/AnimatedDashboard';
import { ModularDashboard } from '@/components/dashboard/ModularDashboard';
import { DashboardProvider } from '@/contexts/DashboardContext';
import { DashboardErrorBoundary } from '@/components/dashboard/DashboardErrorBoundary';
import { DashboardSkeleton } from '@/components/ui/SkeletonLoader';
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  BookOpen, 
  Plus, 
  ArrowUp, 
  ArrowDown,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Settings,
  Sparkles,
  Target,
  Zap,
  Calendar,
  RefreshCw,
  Filter,
  Download,
  TrendingDown,
  AlertCircle,
  CreditCard,
  Package,
  Percent,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import SubscriptionWidget from '@/components/subscription/SubscriptionWidget';

const StatCard = ({ title, value, icon, trend, description, isLoading, color = "blue" }) => {
  const IconComponent = icon;
  
  if (isLoading) {
    return (
      <motion.div
        className="card-modern p-6 animate-shimmer"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="skeleton w-24 h-4" />
          <div className="skeleton w-10 h-10 rounded-lg" />
        </div>
        <div className="skeleton w-32 h-8 mb-2" />
        <div className="skeleton w-20 h-3" />
      </motion.div>
    );
  }
  
  return (
    <motion.div
      className="card-modern card-hover overflow-hidden relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color ? `from-${color}-500/5 to-${color}-600/5` : 'from-gray-500/5 to-gray-600/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <div className={`p-2 rounded-lg ${color ? `bg-${color}-100 dark:bg-${color}-900/50` : 'bg-gray-100 dark:bg-gray-900/50'}`}>
            <IconComponent className={`h-5 w-5 ${color ? `text-${color}-600 dark:text-${color}-400` : 'text-gray-600 dark:text-gray-400'}`} />
          </div>
        </div>
        
        <div className="space-y-2">
          <motion.div 
            className="text-2xl font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {value}
          </motion.div>
          
          {trend && (
            <motion.div
              className="flex items-center space-x-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {trend > 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(trend)}%
              </span>
              <span className="text-xs text-gray-500">vs mois dernier</span>
            </motion.div>
          )}
          
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const QuickActionCard = ({ title, description, icon, onClick, color = "blue", badge }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      className="card-modern card-hover cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-6 relative">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-3 rounded-xl ${color ? `bg-gradient-to-r from-${color}-500 to-${color}-600` : 'bg-gradient-to-r from-gray-500 to-gray-600'} shadow-lg group-hover:shadow-xl transition-shadow duration-300`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {badge && (
            <span className="bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        
        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ArrowUp className="h-4 w-4 text-gray-400 rotate-45" />
        </div>
      </div>
    </motion.div>
  );
};

const ActivityItem = ({ icon, title, time, status, color = "blue" }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className={`p-2 rounded-lg ${color ? `bg-${color}-100 dark:bg-${color}-900/50` : 'bg-gray-100 dark:bg-gray-900/50'}`}>
        <IconComponent className={`h-4 w-4 ${color ? `text-${color}-600 dark:text-${color}-400` : 'text-gray-600 dark:text-gray-400'}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{time}</p>
      </div>
      {status && (
        <div className={`w-2 h-2 rounded-full ${color ? `bg-${color}-500` : 'bg-gray-500'}`} />
      )}
    </motion.div>
  );
};

const ProgressWidget = ({ title, value, max, color = "blue" }) => {
  const percentage = (value / max) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{value}/{max}</span>
      </div>
      <div className="relative">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${color ? `bg-gradient-to-r from-${color}-500 to-${color}-600` : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>0</span>
          <span>{percentage.toFixed(0)}%</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
};

// Interactive Chart Component
const InteractiveChart = ({ title, data, type = 'line', height = 300, color = '#3B82F6' }) => {
  // Always coerce incoming data to an array to avoid map-on-undefined
  const safeData = Array.isArray(data) ? data : [];

  const renderChart = () => {
    switch (type) {
      case 'area':
        return (
          <AreaChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                color: 'white'
              }} 
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={`${color}20`}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                color: 'white'
              }} 
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      
      case 'pie':
        const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
        return (
          <RechartsPieChart>
            <Pie
              data={safeData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={5}
              dataKey="value"
            >
              {safeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        );
      
      default:
        return (
          <LineChart data={safeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
            <YAxis stroke="#6B7280" fontSize={12} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                color: 'white'
              }} 
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, fill: color }}
            />
          </LineChart>
        );
    }
  };

  return (
    <div className="card-modern">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div style={{ height: height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// Enhanced KPI Widget
const KPIWidget = ({ title, currentValue, targetValue, icon, color = 'blue', trend, period = 'ce mois' }) => {
  const IconComponent = icon;
  const percentage = targetValue ? Math.round((currentValue / targetValue) * 100) : 0;
  const isPositiveTrend = trend && trend > 0;

  return (
    <motion.div
      className="card-modern card-hover overflow-hidden relative group"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color ? `from-${color}-500/5 to-${color}-600/5` : 'from-gray-500/5 to-gray-600/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl ${color ? `bg-gradient-to-r from-${color}-500 to-${color}-600` : 'bg-gradient-to-r from-gray-500 to-gray-600'} shadow-lg`}>
            <IconComponent className="h-6 w-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              isPositiveTrend 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {isPositiveTrend ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{title}</h3>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {typeof currentValue === 'number' ? currentValue.toLocaleString() : currentValue}
            </div>
          </div>
          
          {targetValue && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Objectif {period}</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  className={`h-2 rounded-full ${color ? `bg-gradient-to-r from-${color}-500 to-${color}-600` : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {targetValue.toLocaleString()} cible
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const DashboardPage = () => {
  const { t } = useLocale();
  const { currentEnterprise, loading: enterpriseLoading } = useEnterprise();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [stats, setStats] = useState({
    revenue: 0,
    customers: 0,
    orders: 0,
    growth: 0,
    cashFlow: 0,
    profit: 0,
    expenses: 0,
    unpaidInvoices: 0
  });
  
  // Chart data
  const [chartData, setChartData] = useState({
    revenue: [],
    orders: [],
    customers: [],
    expenses: []
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Simuler le chargement des données
  useEffect(() => {
    const loadDashboardData = async () => {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Données simulées étendues
      setStats({
        revenue: 45750,
        customers: 234,
        orders: 156,
        growth: 12.4,
        cashFlow: 18200,
        profit: 13440,
        expenses: 32310,
        unpaidInvoices: 8750
      });
      
      // Données de graphiques simulées
      const revenueData = [
        { name: 'Jan', value: 32000 },
        { name: 'Fév', value: 38000 },
        { name: 'Mar', value: 35000 },
        { name: 'Avr', value: 42000 },
        { name: 'Mai', value: 39000 },
        { name: 'Juin', value: 45750 }
      ];
      
      const ordersData = [
        { name: 'Lun', value: 23 },
        { name: 'Mar', value: 18 },
        { name: 'Mer', value: 28 },
        { name: 'Jeu', value: 22 },
        { name: 'Ven', value: 31 },
        { name: 'Sam', value: 19 },
        { name: 'Dim', value: 15 }
      ];
      
      const customersData = [
        { name: 'Nouveaux', value: 47 },
        { name: 'Récurrents', value: 156 },
        { name: 'Inactifs', value: 31 }
      ];
      
      const expensesData = [
        { name: 'Salaires', value: 18500 },
        { name: 'Loyer', value: 4200 },
        { name: 'Marketing', value: 3800 },
        { name: 'Fournitures', value: 2910 },
        { name: 'Autres', value: 2900 }
      ];
      
      setChartData({
        revenue: revenueData,
        orders: ordersData,
        customers: customersData,
        expenses: expensesData
      });
      
      setIsLoading(false);
    };

    loadDashboardData();
  }, [selectedPeriod]);

  const quickActions = [
    {
      title: "Nouvelle facture",
      description: "Créer une facture client rapidement",
      icon: FileText,
      onClick: () => navigate('/invoicing'),
      color: "blue",
      badge: "Populaire"
    },
    {
      title: "Ajouter un client",
      description: "Enregistrer un nouveau client",
      icon: Users,
      onClick: () => navigate('/third-parties'),
      color: "green"
    },
    {
      title: "Gestion stock",
      description: "Gérer votre inventaire",
      icon: ShoppingCart,
      onClick: () => navigate('/inventory'),
      color: "purple"
    },
    {
      title: "Rapports avancés",
      description: "Analytics et insights",
      icon: BarChart3,
      onClick: () => navigate('/reports'),
      color: "orange"
    }
  ];

  const recentActivities = [
    { icon: CheckCircle2, title: "Facture FAC-001 payée", time: "Il y a 2 heures", status: true, color: "green" },
    { icon: Clock, title: "Commande en attente de validation", time: "Il y a 4 heures", status: true, color: "yellow" },
    { icon: AlertTriangle, title: "Stock faible - Produit A", time: "Il y a 6 heures", status: true, color: "red" },
    { icon: Users, title: "3 nouveaux clients ajoutés", time: "Il y a 1 jour", status: false, color: "blue" }
  ];

  // Vérifier le chargement de l'entreprise avec logique améliorée
  if (enterpriseLoading) {
    return (
      <div className="container mx-auto p-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // Si pas d'entreprise après chargement, essayer de charger depuis localStorage ou AuthContext
  if (!currentEnterprise) {
    // Vérifier localStorage pour une entreprise récemment créée
    const recentCompanyId = localStorage.getItem('casskai_current_enterprise');
    if (recentCompanyId) {
      // Tentative de rechargement des entreprises
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
      return (
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Synchronisation en cours</CardTitle>
              <CardDescription>
                Chargement des données de votre entreprise...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Synchronisation des données</span>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Si vraiment aucune entreprise disponible
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuration requise</CardTitle>
            <CardDescription>
              Aucune entreprise configurée. Veuillez terminer votre configuration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Il semble que la configuration de votre entreprise ne soit pas terminée ou synchronisée.
              </p>
              <div className="flex space-x-2">
                <Button onClick={() => window.location.href = '/onboarding'}>
                  Terminer la configuration
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Recharger la page
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Option pour utiliser le nouveau dashboard animé
  const USE_MODULAR_DASHBOARD = true; // Changez à false pour utiliser l'ancien dashboard
  if (USE_MODULAR_DASHBOARD) {
    return (
      <DashboardErrorBoundary>
        <DashboardProvider>
          <div className="container mx-auto p-6">
            <ModularDashboard
              className="space-y-6"
              onEditModeChange={(isEditing) => {
                if (import.meta.env.DEV) {
                  console.log('Edit mode changed:', isEditing);
                }
              }}
            />
          </div>
        </DashboardProvider>
      </DashboardErrorBoundary>
    );
  }

  // Legacy dashboard below is fully gated by USE_MODULAR_DASHBOARD flag to avoid accidental rendering
  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.title', { defaultValue: 'Tableau de bord' })}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              {t('dashboard.subtitle', { defaultValue: 'Vue d\'ensemble de votre activité' })}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="3m">3 mois</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => navigate('/settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
          <Button onClick={() => navigate('/reports')} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <Eye className="h-4 w-4 mr-2" />
            Voir rapports
          </Button>
        </div>
      </motion.div>

      {/* Enhanced KPI Cards */}
      <motion.div 
        className="dashboard-grid grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card-modern p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="skeleton w-24 h-4" />
                <div className="skeleton w-10 h-10 rounded-lg" />
              </div>
              <div className="skeleton w-32 h-8 mb-2" />
              <div className="skeleton w-20 h-3" />
            </div>
          ))
        ) : (
          <>
            <KPIWidget
              title="Chiffre d'affaires"
              currentValue={`${stats.revenue.toLocaleString()} €`}
              targetValue={50000}
              icon={DollarSign}
              color="blue"
              trend={stats.growth}
            />
            <KPIWidget
              title="Flux de trésorerie"
              currentValue={`${stats.cashFlow.toLocaleString()} €`}
              targetValue={25000}
              icon={TrendingUp}
              color="green"
              trend={8.7}
            />
            <KPIWidget
              title="Clients actifs"
              currentValue={stats.customers}
              targetValue={300}
              icon={Users}
              color="purple"
              trend={15.2}
            />
            <KPIWidget
              title="Commandes"
              currentValue={stats.orders}
              targetValue={200}
              icon={ShoppingCart}
              color="orange"
              trend={-2.1}
            />
            <KPIWidget
              title="Bénéfice net"
              currentValue={`${stats.profit.toLocaleString()} €`}
              targetValue={15000}
              icon={Percent}
              color="emerald"
              trend={22.3}
            />
            <KPIWidget
              title="Dépenses"
              currentValue={`${stats.expenses.toLocaleString()} €`}
              targetValue={35000}
              icon={CreditCard}
              color="red"
              trend={-5.4}
            />
            <KPIWidget
              title="Factures impayées"
              currentValue={`${stats.unpaidInvoices.toLocaleString()} €`}
              targetValue={5000}
              icon={AlertCircle}
              color="yellow"
              trend={-12.8}
            />
            <KPIWidget
              title="Taux conversion"
              currentValue="68.4%"
              targetValue={null}
              icon={Target}
              color="indigo"
              trend={4.2}
            />
          </>
        )}
      </motion.div>

      {/* Enhanced Quick Actions */}
      <motion.div 
        className="space-y-6"
        variants={itemVariants}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            <span>{t('dashboard.quickActions', { defaultValue: 'Actions rapides' })}</span>
          </h2>
          <Button variant="ghost" size="sm">
            Personnaliser
          </Button>
        </div>
        
        <div className="card-grid grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {(Array.isArray(quickActions) ? quickActions : [])
            .filter(action => action && action.title)
            .map((action, index) => (
            <motion.div
              key={action.title || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <QuickActionCard {...action} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Interactive Charts Section */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-2"
        variants={itemVariants}
      >
        <InteractiveChart
          title="Évolution du chiffre d'affaires"
          data={chartData.revenue}
          type="area"
          color="#3B82F6"
          height={350}
        />
        <InteractiveChart
          title="Commandes par jour"
          data={chartData.orders}
          type="bar"
          color="#10B981"
          height={350}
        />
      </motion.div>

      {/* Additional Charts and Metrics */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-3"
        variants={itemVariants}
      >
        <InteractiveChart
          title="Répartition des clients"
          data={chartData.customers}
          type="pie"
          height={300}
        />
        
        <div className="lg:col-span-2">
          <InteractiveChart
            title="Répartition des dépenses"
            data={chartData.expenses}
            type="bar"
            color="#F59E0B"
            height={300}
          />
        </div>
      </motion.div>

      {/* Enhanced Activity and Subscription Section */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-3"
        variants={itemVariants}
      >
        {/* Recent Activity */}
        <div className="card-modern lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <span>{t('dashboard.recentActivity', { defaultValue: 'Activité récente' })}</span>
              </h3>
              <Button variant="ghost" size="sm">
                Voir tout
              </Button>
            </div>
            
            <div className="space-y-1">
              {(Array.isArray(recentActivities) ? recentActivities : [])
                .filter(activity => activity && activity.title)
                .map((activity, index) => (
                <motion.div
                  key={activity.title || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ActivityItem {...activity} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div>
          <SubscriptionWidget />
        </div>
      </motion.div>

      {/* Alerts Section */}
      <motion.div 
        className="grid gap-6"
        variants={itemVariants}
      >
        <div className="card-modern">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span>Alertes importantes</span>
              </h3>
              <Button variant="ghost" size="sm">
                Gérer
              </Button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <h4 className="font-semibold text-red-800 dark:text-red-400">Factures en retard</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">5 factures dépassent 30 jours</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Package className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-400">Stock faible</h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300">12 produits sous le seuil</p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-400">Échéances à venir</h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300">3 paiements cette semaine</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      {/* Performance Metrics Grid */}
      <motion.div 
        className="card-grid-4 grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        variants={itemVariants}
      >
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Temps moyen de paiement</h4>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">24 jours</div>
          <div className="flex items-center space-x-1 text-sm">
            <ArrowDown className="h-3 w-3 text-green-500" />
            <span className="text-green-600">-3 jours vs mois dernier</span>
          </div>
        </div>
        
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Valeur moyenne commande</h4>
            <DollarSign className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">293 €</div>
          <div className="flex items-center space-x-1 text-sm">
            <ArrowUp className="h-3 w-3 text-green-500" />
            <span className="text-green-600">+18 € vs mois dernier</span>
          </div>
        </div>
        
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Taux de rétention</h4>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">84.2%</div>
          <div className="flex items-center space-x-1 text-sm">
            <ArrowUp className="h-3 w-3 text-green-500" />
            <span className="text-green-600">+2.1% vs mois dernier</span>
          </div>
        </div>
        
        <div className="card-modern p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Marge bénéficiaire</h4>
            <Percent className="h-5 w-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">29.4%</div>
          <div className="flex items-center space-x-1 text-sm">
            <ArrowUp className="h-3 w-3 text-green-500" />
            <span className="text-green-600">+1.2% vs mois dernier</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;