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

import React, { useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { motion } from 'framer-motion';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toastError, toastSuccess } from '@/lib/toast-helpers';

import { useSubscription } from '@/contexts/SubscriptionContext';

import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';

import { AccountingService } from '@/services/accountingService';

import { accountingDataService } from '@/services/accountingDataService';

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

  Activity,

  Plus,

  Eye,

  RefreshCw,

  Download,

  Upload,

  Clock,

  CheckCircle2,

  AlertCircle,

  Users,

  ShoppingCart,

  type LucideIcon

} from 'lucide-react';

import OptimizedJournalEntriesTab from '@/components/accounting/OptimizedJournalEntriesTab';

import ChartOfAccountsEnhanced from '@/components/accounting/ChartOfAccountsEnhanced';

import OptimizedJournalsTab from '@/components/accounting/OptimizedJournalsTab';

import OptimizedReportsTab from '@/components/accounting/OptimizedReportsTab';

import FECImport from '@/components/accounting/FECImport';

import ExportFecModal from '@/components/accounting/ExportFecModal';

import JournalDistributionChart from '@/components/accounting/JournalDistributionChart';



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

  pendingEntriesCount: number;

  postedEntriesCount: number;

  accountsCount: number;

  journalsCount: number;

  unpaidInvoicesAmount: number;

  unpaidInvoicesCount: number;

  overdueInvoicesCount: number;

  overdueAmount: number;

  unpaidPurchasesAmount: number;

  unpaidPurchasesCount: number;

  totalBalanceTrend?: number;

  totalDebitTrend?: number;

  totalCreditTrend?: number;

  entriesCountTrend?: number;

  pendingEntriesCountTrend?: number;

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
  const { t } = useTranslation();

  const quickActions = [

    {

      title: t('accounting.quickActions.newEntry', 'Nouvelle écriture'),

      description: t('accounting.quickActions.newEntryDesc', 'Créer une écriture comptable'),

      icon: Plus,

      color: 'blue',

      onClick: onNewEntry

    },

    {

      title: t('accounting.quickActions.viewReports', 'Voir les rapports'),

      description: t('accounting.quickActions.viewReportsDesc', 'Consulter les états financiers'),

      icon: BarChart3,

      color: 'green',

      onClick: onViewReports

    },

    {

      title: t('accounting.quickActions.exportData', 'Exporter les données'),

      description: t('accounting.quickActions.exportDataDesc', 'Télécharger les écritures FEC'),

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

          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 dark:border-gray-700">

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
  const { t } = useTranslation();
  const [activities, setActivities] = React.useState<Array<{
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'purple' | 'orange';
    description: string;
    time: string;
  }>>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadRecentActivities = async () => {
      try {
        setLoading(true);

        // Get current user's company
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) return;

        const { data: companies } = await supabase
          .from('companies')
          .select('id')
          .eq('owner_id', user.user.id)
          .limit(1);

        if (!companies || companies.length === 0) return;
        const companyId = companies[0].id;

        // Get recent journal entries (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: recentEntries } = await supabase
          .from('journal_entries')
          .select('id, entry_date, entry_number, description, status, created_at')
          .eq('company_id', companyId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5);

        if (!recentEntries || recentEntries.length === 0) {
          setActivities([]);
          return;
        }

        // Transform to activity format
        const activityItems = recentEntries.map(entry => {
          const createdDate = new Date(entry.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);

          let timeAgo: string;
          if (diffMins < 1) {
            timeAgo = 'quelques secondes';
          } else if (diffMins < 60) {
            timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
          } else if (diffHours < 24) {
            timeAgo = `${diffHours} heure${diffHours > 1 ? 's' : ''}`;
          } else {
            timeAgo = `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
          }

          let icon: React.ComponentType<{ className?: string }>;
          let color: 'blue' | 'green' | 'purple' | 'orange';

          if (entry.status === 'posted' || entry.status === 'imported') {
            icon = FileText;
            color = 'green';
          } else if (entry.status === 'draft') {
            icon = FileText;
            color = 'orange';
          } else {
            icon = Activity;
            color = 'blue';
          }

          const statusLabel = entry.status === 'posted' ? 'validée' : entry.status === 'draft' ? 'brouillon' : entry.status === 'imported' ? 'importée' : entry.status;

          return {
            icon,
            color,
            description: `Écriture ${entry.entry_number || entry.id.substring(0, 8)} ${statusLabel}: ${entry.description || 'Sans description'}`,
            time: timeAgo
          };
        });

        setActivities(activityItems);
      } catch (error) {
        console.error('Error loading recent activities:', error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecentActivities();
  }, []);



  return (

    <Card className="h-full">

      <CardHeader>

        <CardTitle className="text-lg flex items-center space-x-2">

          <Activity className="w-5 h-5 text-blue-500" />

          <span>{t('accounting.recentActivity.title', 'Activité récente')}</span>

        </CardTitle>

      </CardHeader>

      <CardContent>

        <div className="space-y-3">

          {loading ? (

            <div className="text-center py-8">

              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>

            </div>

          ) : activities.length === 0 ? (

            <div className="text-center py-8 text-gray-500 dark:text-gray-400">

              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />

              <p className="text-sm">{t('accounting.recentActivity.noActivity', 'Aucune activité récente')}</p>

            </div>

          ) : (

            activities.map((activity, index) => (

              <motion.div

                key={index}

                initial={{ opacity: 0, x: -10 }}

                animate={{ opacity: 1, x: 0 }}

                transition={{ delay: index * 0.1 }}

                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-900/30"

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

          )))}

        </div>

      </CardContent>

    </Card>

  );

};



export default function AccountingPageOptimized() {

  const { canAccessFeature } = useSubscription();
  const { isExpired } = useSubscriptionStatus();
  const { t } = useTranslation();
  const navigate = useNavigate();

  

  const [activeTab, setActiveTab] = useState('overview');

  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const [isLoading, setIsLoading] = useState(true);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | undefined>(undefined);

  const [accountingData, setAccountingData] = useState<AccountingData>({

    totalBalance: 0,

    totalDebit: 0,

    totalCredit: 0,

    entriesCount: 0,

    pendingEntriesCount: 0,

    postedEntriesCount: 0,

    accountsCount: 0,

    journalsCount: 0,

    unpaidInvoicesAmount: 0,

    unpaidInvoicesCount: 0,

    overdueInvoicesCount: 0,

    overdueAmount: 0,

    unpaidPurchasesAmount: 0,

    unpaidPurchasesCount: 0

  });

  const [journalDistribution, setJournalDistribution] = useState<Array<{ name: string; code: string; count: number; percentage: number }>>([]);

  const [journalDistributionLoading, setJournalDistributionLoading] = useState(false);



  const _accountingService = AccountingService.getInstance();



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
        setCurrentCompanyId(companyId);

        // Calculate period dates
        const now = new Date();
        let periodStart: string;
        let periodEnd: string;

        switch (selectedPeriod) {
          case 'current-month':
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            break;
          case 'current-quarter': {
            const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
            periodStart = new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
            periodEnd = new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().split('T')[0];
            break;
          }
          case 'current-year':
            periodStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
            periodEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            break;
          default:
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        }

        // Get accounting stats with trends
        const stats = await accountingDataService.getAccountingStatsWithTrends({
          periodStart,
          periodEnd,
          companyId
        });

        setAccountingData(stats as AccountingData);

        // Get journal distribution
        setJournalDistributionLoading(true);
        const distribution = await accountingDataService.getJournalDistribution({
          periodStart,
          periodEnd,
          companyId
        });
        setJournalDistribution(distribution);
        setJournalDistributionLoading(false);



      } catch (error) {

        console.error('Erreur chargement données comptables:', error instanceof Error ? error.message : String(error));
        setJournalDistributionLoading(false);

      } finally {

        setIsLoading(false);

      }

    };



    loadAccountingData();

  }, [selectedPeriod]);



  const handleNewEntry = () => {

    // Check if subscription is expired
    if (isExpired) {
      toast.error('Abonnement expiré. Veuillez choisir un plan pour continuer.');
      navigate('/settings/billing');
      return;
    }

    if (!canAccessFeature('accounting_entries')) {

      toastError('Mettez à niveau votre plan pour accéder aux écritures illimitées.');

      return;

    }

    setActiveTab('entries');

  };



  const handleViewReports = () => {

    if (!canAccessFeature('advanced_reports')) {

      toastError('Les rapports avancés sont disponibles avec le plan Professionnel.');

      return;

    }

    setActiveTab('reports');

  };



  const [showExportModal, setShowExportModal] = useState(false);

  const handleExportData = () => {
    setShowExportModal(true);
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

            <span>{t('accounting.title', 'Comptabilité & Finances')}</span>

          </h1>

          <p className="text-gray-600 dark:text-gray-400 mt-2">

            {t('accounting.subtitle', 'Gérez vos écritures comptables et analyses financières')}

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

            {t('accounting.refresh', 'Actualiser')}

          </Button>

          

          <Button onClick={handleNewEntry}>

            <Plus className="w-4 h-4 mr-2" />

            {t('accounting.newEntry', 'Nouvelle écriture')}

          </Button>

        </div>

      </div>



      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

        <AccountingKPICard

          title={t('accounting.stats.totalBalance', 'Solde total')}

          value={`${accountingData.totalBalance.toLocaleString('fr-FR')} €`}

          icon={DollarSign}

          color="blue"

          trend={accountingData.totalBalanceTrend}

          description={t('accounting.stats.totalBalanceDesc', 'Balance générale')}

        />



        <AccountingKPICard

          title={t('accounting.stats.totalDebit', 'Total débit')}

          value={`${accountingData.totalDebit.toLocaleString('fr-FR')} €`}

          icon={ArrowUpRight}

          color="green"

          trend={accountingData.totalDebitTrend}

          description={t('accounting.stats.totalDebitDesc', 'Débits ce mois')}

        />



        <AccountingKPICard

          title={t('accounting.stats.totalCredit', 'Total crédit')}

          value={`${accountingData.totalCredit.toLocaleString('fr-FR')} €`}

          icon={ArrowDownRight}

          color="purple"

          trend={accountingData.totalCreditTrend}

          description={t('accounting.stats.totalCreditDesc', 'Crédits ce mois')}

        />



        <AccountingKPICard

          title={t('accounting.stats.entries', 'Écritures')}

          value={accountingData.entriesCount}

          icon={FileText}

          color="orange"

          trend={accountingData.entriesCountTrend}

          description={t('accounting.stats.entriesDesc', 'Total écritures')}

        />



        <AccountingKPICard

          title={t('accounting.stats.pendingEntries', 'En attente')}

          value={accountingData.pendingEntriesCount}

          icon={Clock}

          color="yellow"

          trend={accountingData.pendingEntriesCountTrend}

          description={t('accounting.stats.pendingEntriesDesc', 'Écritures à valider')}

          onClick={() => setActiveTab('entries')}

        />



        <AccountingKPICard

          title={t('accounting.stats.postedEntries', 'Validées')}

          value={accountingData.postedEntriesCount}

          icon={CheckCircle2}

          color="teal"

          description={t('accounting.stats.postedEntriesDesc', 'Écritures comptabilisées')}

        />

      </div>



      {/* Deuxième rangée de KPIs - Trésorerie et Aging */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">

        <AccountingKPICard

          title={t('accounting.stats.receivables', 'À recevoir')}

          value={`${accountingData.unpaidInvoicesAmount.toLocaleString('fr-FR')} €`}

          icon={Users}

          color="cyan"

          description={t('accounting.stats.receivablesDesc', `${accountingData.unpaidInvoicesCount} facture(s) client(s) impayée(s)`)}

        />



        <AccountingKPICard

          title={t('accounting.stats.payables', 'À payer')}

          value={`${accountingData.unpaidPurchasesAmount.toLocaleString('fr-FR')} €`}

          icon={ShoppingCart}

          color="indigo"

          description={t('accounting.stats.payablesDesc', `${accountingData.unpaidPurchasesCount} facture(s) fournisseur(s)`)}

        />



        <AccountingKPICard

          title={t('accounting.stats.overdue', 'En retard')}

          value={accountingData.overdueInvoicesCount}

          icon={AlertCircle}

          color={accountingData.overdueInvoicesCount > 0 ? 'red' : 'gray'}

          description={t('accounting.stats.overdueDesc', `${accountingData.overdueAmount.toLocaleString('fr-FR')} € de retard`)}

        />



        <AccountingKPICard

          title={t('accounting.stats.validationRate', 'Taux validation')}

          value={`${accountingData.entriesCount > 0 ? Math.round((accountingData.postedEntriesCount / accountingData.entriesCount) * 100) : 0}%`}

          icon={TrendingUp}

          color="emerald"

          description={t('accounting.stats.validationRateDesc', 'Écritures validées')}

        />

      </div>



      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">

        <TabsList className="grid w-full grid-cols-6">

          <TabsTrigger value="overview" className="flex items-center space-x-2">

            <Eye className="w-4 h-4" />

            <span>{t('accounting.tabs.overview', 'Vue d\'ensemble')}</span>

          </TabsTrigger>

          <TabsTrigger value="entries" className="flex items-center space-x-2">

            <FileText className="w-4 h-4" />

            <span>{t('accounting.tabs.entries', 'Écritures')}</span>

          </TabsTrigger>

          <TabsTrigger value="accounts" className="flex items-center space-x-2">

            <BookOpen className="w-4 h-4" />

            <span>{t('accounting.tabs.accounts', 'Plan comptable')}</span>

          </TabsTrigger>

          <TabsTrigger value="fec-import" className="flex items-center space-x-2">

            <Upload className="w-4 h-4" />

            <span>{t('accounting.tabs.fecImport', '📥 Import FEC')}</span>

          </TabsTrigger>

          <TabsTrigger value="journals" className="flex items-center space-x-2">

            <BarChart3 className="w-4 h-4" />

            <span>{t('accounting.tabs.journals', 'Journaux')}</span>

          </TabsTrigger>

          <TabsTrigger value="reports" className="flex items-center space-x-2">

            <TrendingUp className="w-4 h-4" />

            <span>{t('accounting.tabs.reports', 'Rapports')}</span>

          </TabsTrigger>

        </TabsList>



        <TabsContent value="overview" className="space-y-6">

          <QuickActions

            onNewEntry={handleNewEntry}

            onViewReports={handleViewReports}

            onExportData={handleExportData}

          />



          <div className="grid gap-6 lg:grid-cols-3">

            {/* Répartition par journal */}
            <div className="lg:col-span-2">
              <JournalDistributionChart
                data={journalDistribution}
                loading={journalDistributionLoading}
              />
            </div>



            <RecentAccountingActivities />

          </div>

        </TabsContent>



        <TabsContent value="entries">

          <OptimizedJournalEntriesTab />

        </TabsContent>



        <TabsContent value="accounts">

          <ChartOfAccountsEnhanced currentEnterpriseId={currentCompanyId} />

        </TabsContent>

        <TabsContent value="fec-import">

          <FECImport
            currentEnterpriseId={currentCompanyId}
            onImportSuccess={() => window.location.reload()}
          />

        </TabsContent>



        <TabsContent value="journals">

          <OptimizedJournalsTab />

        </TabsContent>



        <TabsContent value="reports">

          <OptimizedReportsTab />

        </TabsContent>

      </Tabs>

      {/* Modal d'export FEC */}
      <ExportFecModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

    </motion.div>

  );

}
