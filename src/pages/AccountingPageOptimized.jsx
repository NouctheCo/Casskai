import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { 
  Calculator,
  FileText, 
  BookOpen, 
  Calendar, 
  FileArchive, 
  TrendingUp,
  AlertTriangle,
  Settings,
  BarChart3,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';

// Import optimized tab components
import OptimizedJournalEntriesTab from '@/components/accounting/OptimizedJournalEntriesTab';
import OptimizedChartOfAccountsTab from '@/components/accounting/OptimizedChartOfAccountsTab';
import OptimizedJournalsTab from '@/components/accounting/OptimizedJournalsTab';
import OptimizedReportsTab from '@/components/accounting/OptimizedReportsTab';

// Accounting KPI Card Component
const AccountingKPICard = ({ title, value, icon, trend, color = 'blue', description, onClick }) => {
  const IconComponent = icon;
  
  return (
    <motion.div
      className={`card-modern card-hover cursor-pointer overflow-hidden relative group ${onClick ? 'hover:shadow-lg' : ''}`}
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/5 to-${color}-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r from-${color}-500 to-${color}-600 shadow-lg`}>
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
              trend > 0 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Quick Actions Component
const QuickActions = ({ onNewEntry, onViewReports, onExportData }) => {
  const quickActions = [
    {
      title: 'Nouvelle écriture',
      description: 'Créer une écriture comptable',
      icon: Plus,
      color: 'blue',
      onClick: onNewEntry
    },
    {
      title: 'Voir les rapports',
      description: 'Consulter les états financiers',
      icon: BarChart3,
      color: 'green',
      onClick: onViewReports
    },
    {
      title: 'Exporter les données',
      description: 'Télécharger les écritures FEC',
      icon: Download,
      color: 'purple',
      onClick: onExportData
    }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${
                  action.color === 'blue' ? 'from-blue-500 to-blue-600' :
                  action.color === 'green' ? 'from-green-500 to-green-600' :
                  'from-purple-500 to-purple-600'
                } flex items-center justify-center`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {action.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

// Recent Activities Component
const RecentAccountingActivities = () => {
  const activities = [
    { type: 'entry', description: 'Nouvelle écriture - Facture F-001', time: '2 min', icon: FileText, color: 'blue' },
    { type: 'validation', description: 'Validation journal des ventes', time: '1h', icon: CheckCircle, color: 'green' },
    { type: 'export', description: 'Export FEC généré', time: '3h', icon: Download, color: 'purple' },
    { type: 'balance', description: 'Balance des comptes mise à jour', time: '1j', icon: BarChart3, color: 'orange' }
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span>Activité récente</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <div className={`w-8 h-8 rounded-lg ${
                activity.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
                activity.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
                activity.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/20' :
                'bg-orange-100 dark:bg-orange-900/20'
              } flex items-center justify-center`}>
                <activity.icon className={`w-4 h-4 ${
                  activity.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                  activity.color === 'green' ? 'text-green-600 dark:text-green-400' :
                  activity.color === 'purple' ? 'text-purple-600 dark:text-purple-400' :
                  'text-orange-600 dark:text-orange-400'
                }`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Il y a {activity.time}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function AccountingPageOptimized() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [isLoading, setIsLoading] = useState(true);

  // Mock accounting data
  const [accountingData, setAccountingData] = useState({
    totalBalance: 45670.50,
    totalDebit: 125430.75,
    totalCredit: 79760.25,
    entriesCount: 156,
    accountsCount: 87,
    journalsCount: 5
  });

  useEffect(() => {
    // Simulate data loading
    const loadAccountingData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    loadAccountingData();
  }, [selectedPeriod]);

  const handleNewEntry = () => {
    if (!canAccessFeature('accounting_entries')) {
      toast({
        title: "Fonctionnalité non disponible",
        description: "Mettez à niveau votre plan pour accéder aux écritures illimitées.",
        variant: "destructive"
      });
      return;
    }
    setActiveTab('entries');
    // Additional logic for creating new entry
  };

  const handleViewReports = () => {
    if (!canAccessFeature('advanced_reports')) {
      toast({
        title: "Rapports avancés",
        description: "Les rapports avancés sont disponibles avec le plan Professionnel.",
        variant: "destructive"
      });
      return;
    }
    setActiveTab('reports');
  };

  const handleExportData = () => {
    toast({
      title: "Export en cours",
      description: "Génération du fichier FEC en cours...",
    });
    // Export logic here
  };

  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-8 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <Calculator className="w-8 h-8 text-blue-500" />
            <span>Comptabilité & Finances</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos écritures comptables et analyses financières
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Mois en cours</SelectItem>
              <SelectItem value="current-quarter">Trimestre en cours</SelectItem>
              <SelectItem value="current-year">Année en cours</SelectItem>
              <SelectItem value="last-month">Mois dernier</SelectItem>
              <SelectItem value="custom">Période personnalisée</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle écriture
          </Button>
        </div>
      </div>

      {/* Accounting KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <AccountingKPICard
          title="Solde total"
          value={`${accountingData.totalBalance.toLocaleString('fr-FR')} €`}
          icon={DollarSign}
          color="blue"
          trend={8.5}
          description="Balance générale"
        />
        
        <AccountingKPICard
          title="Total débit"
          value={`${accountingData.totalDebit.toLocaleString('fr-FR')} €`}
          icon={ArrowUpRight}
          color="green"
          trend={12.3}
          description="Débits ce mois"
        />
        
        <AccountingKPICard
          title="Total crédit"
          value={`${accountingData.totalCredit.toLocaleString('fr-FR')} €`}
          icon={ArrowDownRight}
          color="purple"
          trend={-2.1}
          description="Crédits ce mois"
        />
        
        <AccountingKPICard
          title="Écritures"
          value={accountingData.entriesCount}
          icon={FileText}
          color="orange"
          trend={15.7}
          description="Écritures saisies"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="entries" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Écritures</span>
          </TabsTrigger>
          <TabsTrigger value="accounts" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Plan comptable</span>
          </TabsTrigger>
          <TabsTrigger value="journals" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Journaux</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Rapports</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <QuickActions
            onNewEntry={handleNewEntry}
            onViewReports={handleViewReports}
            onExportData={handleExportData}
          />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    <span>Répartition par journal</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Journal des ventes', amount: 45670, percentage: 65, color: 'blue' },
                      { name: 'Journal des achats', amount: 18440, percentage: 26, color: 'green' },
                      { name: 'Journal de banque', amount: 6320, percentage: 9, color: 'purple' }
                    ].map((journal, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{journal.name}</span>
                          <span>{journal.amount.toLocaleString('fr-FR')} € ({journal.percentage}%)</span>
                        </div>
                        <Progress value={journal.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <RecentAccountingActivities />
          </div>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries">
          <OptimizedJournalEntriesTab />
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts">
          <OptimizedChartOfAccountsTab />
        </TabsContent>

        {/* Journals Tab */}
        <TabsContent value="journals">
          <OptimizedJournalsTab />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <OptimizedReportsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}