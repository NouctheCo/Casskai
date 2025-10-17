import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useSubscription } from '@/contexts/SubscriptionContext';
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
  AlertCircle,
  type LucideIcon
} from 'lucide-react';
import OptimizedJournalEntriesTab from '@/components/accounting/OptimizedJournalEntriesTab';
import ChartOfAccountsEnhanced from '@/components/accounting/ChartOfAccountsEnhanced';
import { JournalsList } from '@/components/accounting/JournalsList'; // Importer notre nouveau composant
import OptimizedReportsTab from '@/components/accounting/OptimizedReportsTab';
import JournalDistribution from '@/components/accounting/JournalDistribution';
import { calculateTrend, getPreviousPeriodDates } from '@/utils/trendCalculations';
import { logger } from '@/utils/logger';

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
  balanceTrend: number | null;
  debitTrend: number | null;
  creditTrend: number | null;
  entriesTrend: number | null;
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
  const activities = [];

  if (activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span>Activité récente</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Activity className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Aucune activité récente
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

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
  const [shouldCreateNew, setShouldCreateNew] = useState(null); // 'entry'
  const [error, setError] = useState<string | null>(null);
  const [accountingData, setAccountingData] = useState<AccountingData>({
    totalBalance: 0,
    totalDebit: 0,
    totalCredit: 0,
    entriesCount: 0,
    accountsCount: 0,
    journalsCount: 0,
    balanceTrend: null,
    debitTrend: null,
    creditTrend: null,
    entriesTrend: null
  });
  const [isFirstTime, setIsFirstTime] = useState(false);

  useEffect(() => {
    const loadAccountingData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer les données comptables réelles
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) {
          setError("Utilisateur non authentifié");
          return;
        }

        // Récupérer la première entreprise de l'utilisateur
        const { data: companies, error: companiesError } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.user.id)
          .limit(1);

        if (companiesError) {
          logger.warn('Erreur récupération entreprises:', companiesError);
          setError("Impossible de récupérer les informations de l'entreprise");
          return;
        }

        if (!companies || companies.length === 0) {
          setError("Aucune entreprise trouvée. Veuillez créer une entreprise d'abord.");
          setIsLoading(false);
          return;
        }

        const companyId = companies[0].id;

        // Calculer les dates de la période actuelle et précédente
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const currentPeriodStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
        const currentPeriodEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

        const previousPeriodDates = getPreviousPeriodDates(selectedPeriod);

        // Récupérer les écritures de la période actuelle avec leurs lignes
        const { data: currentEntries, error: currentEntriesError } = await supabase
          .from('journal_entries')
          .select('id, journal_entry_lines!inner(debit_amount, credit_amount)')
          .eq('company_id', companyId)
          .gte('entry_date', currentPeriodStart)
          .lte('entry_date', currentPeriodEnd);

        if (currentEntriesError) {
          logger.warn('Erreur récupération écritures actuelles:', currentEntriesError);
          // Ne pas bloquer si les écritures n'existent pas encore
        }

        // Récupérer les écritures de la période précédente avec leurs lignes
        const { data: previousEntries, error: previousEntriesError } = await supabase
          .from('journal_entries')
          .select('id, journal_entry_lines!inner(debit_amount, credit_amount)')
          .eq('company_id', companyId)
          .gte('entry_date', previousPeriodDates.start)
          .lte('entry_date', previousPeriodDates.end);

        if (previousEntriesError) {
          logger.warn('Erreur récupération écritures précédentes:', previousEntriesError);
          // Ne pas bloquer si les écritures n'existent pas encore
        }

        // Calculer totaux période actuelle à partir des lignes
        const currentDebit = currentEntries?.reduce((sum, e) => {
          return sum + (e.journal_entry_lines?.reduce((lineSum, line) => lineSum + (line.debit_amount || 0), 0) || 0);
        }, 0) || 0;
        const currentCredit = currentEntries?.reduce((sum, e) => {
          return sum + (e.journal_entry_lines?.reduce((lineSum, line) => lineSum + (line.credit_amount || 0), 0) || 0);
        }, 0) || 0;
        const currentBalance = currentDebit - currentCredit;
        const currentEntriesCount = currentEntries?.length || 0;

        // Calculer totaux période précédente à partir des lignes
        const previousDebit = previousEntries?.reduce((sum, e) => {
          return sum + (e.journal_entry_lines?.reduce((lineSum, line) => lineSum + (line.debit_amount || 0), 0) || 0);
        }, 0) || 0;
        const previousCredit = previousEntries?.reduce((sum, e) => {
          return sum + (e.journal_entry_lines?.reduce((lineSum, line) => lineSum + (line.credit_amount || 0), 0) || 0);
        }, 0) || 0;
        const previousBalance = previousDebit - previousCredit;
        const previousEntriesCount = previousEntries?.length || 0;

        // Compter les comptes et journaux
        const [accountsResult, journalsResult] = await Promise.all([
          supabase.from('accounts').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
          supabase.from('journals').select('*', { count: 'exact', head: true }).eq('company_id', companyId)
        ]);

        // Gérer les erreurs de comptage (ne pas bloquer si les tables sont vides)
        const accountsCount = accountsResult.error ? 0 : (accountsResult.count || 0);
        const journalsCount = journalsResult.error ? 0 : (journalsResult.count || 0);

        if (accountsResult.error) {
          logger.warn('Erreur comptage comptes:', accountsResult.error)
        }
        if (journalsResult.error) {
          logger.warn('Erreur comptage journaux:', journalsResult.error)
        }

        // Déterminer si c'est une première utilisation (base vide)
        const isFirstTimeSetup = accountsCount === 0 && journalsCount === 0 && currentEntriesCount === 0;
        setIsFirstTime(isFirstTimeSetup);

        setAccountingData({
          totalBalance: currentBalance,
          totalDebit: currentDebit,
          totalCredit: currentCredit,
          entriesCount: currentEntriesCount,
          accountsCount,
          journalsCount,
          balanceTrend: calculateTrend(currentBalance, previousBalance),
          debitTrend: calculateTrend(currentDebit, previousDebit),
          creditTrend: calculateTrend(currentCredit, previousCredit),
          entriesTrend: calculateTrend(currentEntriesCount, previousEntriesCount)
        });

      } catch (error) {
        logger.error('Erreur chargement données comptables:', error);
        // Pour les erreurs de connexion/réseau, afficher l'erreur
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
          setError("Impossible de charger les données comptables. Vérifiez votre connexion internet.");
        } else {
          // Pour les autres erreurs, considérer comme première utilisation
          setIsFirstTime(true);
          setError(null);
        }
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
    
    try {
      // Quitter l'écran d'accueil et aller vers l'onglet entries
      setIsFirstTime(false);
      setShouldCreateNew('entry');
      setActiveTab('entries');
      
      toast({
        title: "Création d'une nouvelle écriture",
        description: "Prêt à créer une nouvelle écriture comptable."
      });
    } catch (error) {
      logger.error('Error preparing new entry:', error);
      toast({
        title: "Erreur",
        description: "Impossible de préparer la création d'écriture.",
        variant: "destructive"
      });
    }
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

  if (error && !isFirstTime) {
    return (
      <div className="space-y-8 p-6">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Message d'accueil pour première utilisation
  if (isFirstTime) {
    return (
      <motion.div
        className="space-y-8 p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center py-12">
          <div className="max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calculator className="w-10 h-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Bienvenue dans votre comptabilité !
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              Votre espace comptable est prêt. Commencez par créer votre premier plan comptable et vos journaux.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button onClick={handleNewEntry} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Créer ma première écriture
              </Button>
              <Button onClick={() => { setIsFirstTime(false); setActiveTab('accounts'); }} variant="outline" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Configurer le plan comptable
              </Button>
            </div>
            <div className="text-center">
              <Button 
                onClick={() => setIsFirstTime(false)} 
                variant="ghost" 
                size="sm"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Accéder à mon espace comptable →
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
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
          trend={accountingData.balanceTrend ?? undefined}
          description="Balance générale"
        />

        <AccountingKPICard
          title="Total débit"
          value={`${accountingData.totalDebit.toLocaleString('fr-FR')} €`}
          icon={ArrowUpRight}
          color="green"
          trend={accountingData.debitTrend ?? undefined}
          description="Débits ce mois"
        />

        <AccountingKPICard
          title="Total crédit"
          value={`${accountingData.totalCredit.toLocaleString('fr-FR')} €`}
          icon={ArrowDownRight}
          color="purple"
          trend={accountingData.creditTrend ?? undefined}
          description="Crédits ce mois"
        />

        <AccountingKPICard
          title="Écritures"
          value={accountingData.entriesCount}
          icon={FileText}
          color="orange"
          trend={accountingData.entriesTrend ?? undefined}
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
          
          <JournalDistribution />
        </TabsContent>

        <TabsContent value="entries">
          <OptimizedJournalEntriesTab 
            shouldCreateNew={shouldCreateNew === 'entry'}
            onCreateNewCompleted={() => setShouldCreateNew(null)}
          />
        </TabsContent>

        <TabsContent value="accounts">
          <ChartOfAccountsEnhanced />
        </TabsContent>

        <TabsContent value="journals">
          <JournalsList />
        </TabsContent>

        <TabsContent value="reports">
          <OptimizedReportsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
