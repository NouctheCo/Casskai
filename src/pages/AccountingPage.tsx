import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { AccountingService } from '@/services/accountingService';
import { supabase } from '@/lib/supabase';
import { 
  Calculator,
  FileText, 
  BookOpen, 
  TrendingUp,
  BarChart3,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Activity,
  Plus,
  Eye,
  RefreshCw,
  Download,
  CheckCircle,
  type LucideIcon
} from 'lucide-react';
import OptimizedJournalEntriesTab from '@/components/accounting/OptimizedJournalEntriesTab';
import ChartOfAccountsEnhanced from '@/components/accounting/ChartOfAccountsEnhanced';
import OptimizedJournalsTab from '@/components/accounting/OptimizedJournalsTab';
import OptimizedReportsTab from '@/components/accounting/OptimizedReportsTab';

// Types
interface AccountingKPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  color?: string;
  description: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  onNewEntry: () => void;
  onViewReports: () => void;
  onExportData: () => void;
}

interface AccountingData {
  totalBalance: number;
  totalDebit: number;
  totalCredit: number;
  entriesCount: number;
  accountsCount: number;
  journalsCount: number;
}

const AccountingKPICard: React.FC<AccountingKPICardProps> = ({ title, value, icon: Icon, trend, color = 'blue', description, onClick }) => {
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
            <Icon className="w-6 h-6 text-white" />
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

const QuickActions: React.FC<QuickActionsProps> = ({ onNewEntry, onViewReports, onExportData }) => {
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
		  onClick={action.onClick}
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
  const { canAccessFeature } = useSubscription();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [isLoading, setIsLoading] = useState(true);
  const [accountingData, setAccountingData] = useState<AccountingData>({
    totalBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    entriesCount: 0,
    accountsCount: 0,
    journalsCount: 0
  });

  const accountingService = AccountingService.getInstance();

  useEffect(() => {
    const loadAccountingData = async () => {
      try {
        setIsLoading(true);

        // Récupérer les données comptables réelles
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) return;

        // Récupérer la première entreprise de l'utilisateur
        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.user.id)
          .limit(1);

        if (!companies || companies.length === 0) {
          setIsLoading(false);
          return;
        }

        const companyId = companies[0].id;

        // Compter les comptes, journaux et écritures
        const [accountsResult, journalsResult, entriesResult] = await Promise.all([
          supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('journals').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
        ]);

        setAccountingData({
          totalBalance: 0, // À calculer depuis les écritures
          totalDebit: 0,   // À calculer
          totalCredit: 0,  // À calculer
          entriesCount: entriesResult.count || 0,
          accountsCount: accountsResult.count || 0,
          journalsCount: journalsResult.count || 0
        });

      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        console.error('Erreur chargement données comptables:', error instanceof Error ? error.message : String(error));
      } finally {
        setIsLoading(false);
      }
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
          <div>
            <label htmlFor="accounting-period-select" className="sr-only">
              Sélectionner la période comptable
            </label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger id="accounting-period-select" name="accounting-period" className="w-48">
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
          </div>
          
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
          
          <Button onClick={handleNewEntry}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle écriture
          </Button>
        </div>
      </div>

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

        <TabsContent value="entries">
          <OptimizedJournalEntriesTab />
        </TabsContent>

        <TabsContent value="accounts">
          <ChartOfAccountsEnhanced />
        </TabsContent>

        <TabsContent value="journals">
          <OptimizedJournalsTab />
        </TabsContent>

        <TabsContent value="reports">
          <OptimizedReportsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
