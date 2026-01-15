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
import { motion, AnimatePresence as _AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription as _CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as _Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { toastSuccess } from '@/lib/toast-helpers';
import { PageContainer } from '@/components/ui/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { invoicingService } from '@/services/invoicingService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  FileText,
  Receipt,
  CreditCard,
  Calendar as _Calendar,
  Euro,
  TrendingUp as _TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Edit as _Edit,
  Download as _Download,
  RefreshCw,
  Search as _Search,
  Filter as _Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity,
  Zap as _Zap,
  DollarSign as _DollarSign,
  BarChart3 as _BarChart3,
  Settings as _Settings
} from 'lucide-react';
// Import optimized tab components
import OptimizedInvoicesTab from '@/components/invoicing/OptimizedInvoicesTab';
import OptimizedClientsTab from '@/components/invoicing/OptimizedClientsTab';
import OptimizedQuotesTab from '@/components/invoicing/OptimizedQuotesTab';
import OptimizedPaymentsTab from '@/components/invoicing/OptimizedPaymentsTab';
import { LateFeeCalculator } from '@/components/invoicing/LateFeeCalculator';
import { InvoiceComplianceSettings } from '@/components/invoicing/InvoiceComplianceSettings';
import { logger } from '@/lib/logger';
// Invoicing KPI Card Component
const InvoicingKPICard = ({ title, value, icon, trend, color = 'blue', description, onClick }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: number;
  color?: string;
  description?: string;
  onClick?: () => void;
}) => {
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
const QuickInvoicingActions = ({ onNewInvoice, onNewQuote, onNewPayment, onViewClients, t }: {
  onNewInvoice: () => void;
  onNewQuote: () => void;
  onNewPayment: () => void;
  onViewClients: () => void;
  t: any;
}) => {
  const quickActions = [
    {
      title: t('invoicing.quickActions.newInvoice', 'Nouvelle facture'),
      description: t('invoicing.quickActions.newInvoiceDesc', 'Créer une facture client'),
      icon: Plus,
      color: 'blue',
      onClick: onNewInvoice
    },
    {
      title: t('invoicing.quickActions.newQuote', 'Nouveau devis'),
      description: t('invoicing.quickActions.newQuoteDesc', 'Créer un devis'),
      icon: FileText,
      color: 'green',
      onClick: onNewQuote
    },
    {
      title: t('invoicing.quickActions.newPayment', 'Nouveau paiement'),
      description: t('invoicing.quickActions.newPaymentDesc', 'Enregistrer un paiement'),
      icon: CreditCard,
      color: 'orange',
      onClick: onNewPayment
    },
    {
      title: t('invoicing.quickActions.viewClients', 'Gérer les clients'),
      description: t('invoicing.quickActions.viewClientsDesc', 'Voir la liste des clients'),
      icon: Users,
      color: 'purple',
      onClick: onViewClients
    }
  ];
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
      {quickActions.map((action, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={action.onClick}
        >
          <Card className="cursor-pointer hover:shadow-md transition-all duration-200 border-2 border-transparent hover:border-gray-200 dark:border-gray-600 dark:hover:border-gray-700">
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
// Recent Invoicing Activities Component
const RecentInvoicingActivities = ({ t }: { t: any }) => {
  const { currentCompany } = useAuth();
  type ActivityItem = {
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'purple' | 'orange';
    description: string;
    time: string;
  };
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const loadRecentActivities = async () => {
      if (!currentCompany?.id) return;

      try {
        // Charger les 5 dernières factures et devis
        const { data: recentInvoices } = await supabase
          .from('invoices')
          .select('id, invoice_number, status, total_incl_tax, created_at, customer:customers(name)')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false })
          .limit(3);

        const { data: recentQuotes } = await supabase
          .from('quotes')
          .select('id, quote_number, status, total_incl_tax, created_at')
          .eq('company_id', currentCompany.id)
          .order('created_at', { ascending: false })
          .limit(2);

        const activityItems: ActivityItem[] = [];

        // Ajouter les factures récentes
        if (recentInvoices) {
          for (const invoice of recentInvoices) {
            const customerName = invoice.customer?.name || 'Client inconnu';
            const amount = invoice.total_incl_tax || 0;
            const timeAgo = getTimeAgo(invoice.created_at);

            activityItems.push({
              icon: FileText,
              color: invoice.status === 'paid' ? 'green' : 'blue',
              description: `Facture ${invoice.invoice_number} - ${customerName} ($<CurrencyAmount amount={amount} />)`,
              time: timeAgo
            });
          }
        }

        // Ajouter les devis récents
        if (recentQuotes) {
          for (const quote of recentQuotes) {
            const amount = quote.total_incl_tax || 0;
            const timeAgo = getTimeAgo(quote.created_at);

            activityItems.push({
              icon: Receipt,
              color: 'purple',
              description: `Devis ${quote.quote_number} ($<CurrencyAmount amount={amount} />)`,
              time: timeAgo
            });
          }
        }

        // Trier par date et garder les 5 plus récents
        setActivities(activityItems.slice(0, 5));
      } catch (error) {
        logger.error('InvoicingPage', 'Error loading recent activities:', error);
      }
    };

    // Fonction helper pour calculer "il y a X temps"
    const getTimeAgo = (dateString: string): string => {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins} min`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}j`;
      return date.toLocaleDateString('fr-FR');
    };

    loadRecentActivities();
  }, [currentCompany]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span>{t('invoicing.recentActivity.title', 'Activité récente')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>{t('invoicing.recentActivity.noActivity', 'Aucune activité récente')}</p>
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
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-white">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Il y a {activity.time}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default function InvoicingPageOptimized() {
  const { user: _user } = useAuth();
  const { canAccessFeature } = useSubscription();
  const { isExpired } = useSubscriptionStatus();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCreateNew, setShouldCreateNew] = useState<'invoice' | 'quote' | 'payment' | null>(null);
  const [invoicingData, setInvoicingData] = useState({
    totalRevenue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    invoicesCount: 0,
    clientsCount: 0,
    quotesCount: 0,
    averageInvoiceValue: 0,
    totalRevenueTrend: undefined as number | undefined,
    paidInvoicesTrend: undefined as number | undefined,
    pendingInvoicesTrend: undefined as number | undefined,
    overdueInvoicesTrend: undefined as number | undefined
  });
  const [_error, setError] = useState<string | null>(null);
  useEffect(() => {
    const loadInvoicingData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const periodStart = getPeriodStart(selectedPeriod);
        const periodEnd = getPeriodEnd(selectedPeriod);
        const stats = await invoicingService.getInvoicingStatsWithTrends({
          periodStart,
          periodEnd
        });
        setInvoicingData({
          totalRevenue: stats.totalRevenue,
          paidInvoices: stats.paidInvoices,
          pendingInvoices: stats.pendingInvoices,
          overdueInvoices: stats.overdueInvoices,
          invoicesCount: stats.invoicesCount,
          clientsCount: stats.clientsCount,
          quotesCount: stats.quotesCount,
          averageInvoiceValue: stats.averageInvoiceValue,
          totalRevenueTrend: stats.totalRevenueTrend,
          paidInvoicesTrend: stats.paidInvoicesTrend,
          pendingInvoicesTrend: stats.pendingInvoicesTrend,
          overdueInvoicesTrend: stats.overdueInvoicesTrend
        });
      } catch (error: unknown) {
        logger.error('Invoicing', 'Error loading invoicing data:', error);
        setError((error instanceof Error ? error.message : 'Une erreur est survenue'));
        toastSuccess("Action effectuée avec succès");
      } finally {
        setIsLoading(false);
      }
    };
    loadInvoicingData();
  }, [selectedPeriod, customStartDate, customEndDate]);
  const getPeriodStart = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      case 'current-quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterMonth, 1).toISOString().split('T')[0];
      }
      case 'current-year':
        return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      case 'last-year':
        return new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
      case 'custom':
        return customStartDate || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    }
  };
  const getPeriodEnd = (period: string) => {
    const now = new Date();
    switch (period) {
      case 'current-month':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      case 'current-quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        return new Date(now.getFullYear(), quarterMonth + 3, 0).toISOString().split('T')[0];
      }
      case 'current-year':
        return new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      case 'last-month':
        return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      case 'last-year':
        return new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
      case 'custom':
        return customEndDate || new Date().toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    }
  };
  const handleNewInvoice = async () => {
    // Check if subscription is expired
    if (isExpired) {
      toast.error('Abonnement expiré. Veuillez choisir un plan pour continuer.');
      navigate('/settings/billing');
      return;
    }
    if (!canAccessFeature('unlimited_invoices')) {
      toastSuccess("Action effectuée avec succès");
      return;
    }
    try {
      // For now, just switch to invoices tab and set create mode
      // The actual invoice creation will be handled by the OptimizedInvoicesTab component
      setShouldCreateNew('invoice');
      setActiveTab('invoices');
      toastSuccess("Action effectuée avec succès");
    } catch (error: unknown) {
      logger.error('Invoicing', 'Error preparing new invoice:', error);
      toastSuccess("Action effectuée avec succès");
    }
  };
  const handleNewQuote = () => {
    // Check if subscription is expired
    if (isExpired) {
      toast.error('Abonnement expiré. Veuillez choisir un plan pour continuer.');
      navigate('/settings/billing');
      return;
    }
    setShouldCreateNew('quote');
    setActiveTab('quotes');
  };
  const handleNewPayment = () => {
    // Check if subscription is expired
    if (isExpired) {
      toast.error('Abonnement expiré. Veuillez choisir un plan pour continuer.');
      navigate('/settings/billing');
      return;
    }
    setShouldCreateNew('payment');
    setActiveTab('payments');
  };
  const handleViewClients = () => {
    setActiveTab('clients');
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
    <PageContainer variant="default" className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header professionnel */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Receipt className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      {t('invoicing.title', 'Facturation & Devis')}
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('invoicing.subtitle', 'Gestion professionnelle des factures et devis')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current-month">{t('invoicing.periods.currentMonth', 'Mois en cours')}</SelectItem>
                    <SelectItem value="current-quarter">{t('invoicing.periods.currentQuarter', 'Trimestre en cours')}</SelectItem>
                    <SelectItem value="current-year">{t('invoicing.periods.currentYear', 'Année en cours')}</SelectItem>
                    <SelectItem value="last-month">{t('invoicing.periods.lastMonth', 'Mois dernier')}</SelectItem>
                    <SelectItem value="last-year">{t('invoicing.periods.lastYear', 'Année N-1')}</SelectItem>
                    <SelectItem value="custom">{t('invoicing.periods.custom', 'Période personnalisée')}</SelectItem>
                  </SelectContent>
                </Select>
                {selectedPeriod === 'custom' && (
                  <div className="flex items-center space-x-2">
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.from', 'Du')}</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sélectionner une date de début"
                        title="Date de début de la période personnalisée"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('common.to', 'Au')}</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sélectionner une date de fin"
                        title="Date de fin de la période personnalisée"
                      />
                    </div>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  className="bg-white dark:bg-gray-900/30 hover:bg-gray-50 dark:hover:bg-gray-600"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  {t('common.refresh', 'Actualiser')}
                </Button>
                <Button 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                  onClick={handleNewInvoice} 
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('invoicing.newInvoice', 'Nouvelle facture')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
        {/* Invoicing KPIs */}
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <InvoicingKPICard
            title={t('invoicing.kpis.revenue', 'Chiffre d\'affaires')}
            value={`$<CurrencyAmount amount={invoicingData.totalRevenue} />`}
            icon={Euro}
            color="blue"
            trend={invoicingData.totalRevenueTrend}
            description={t('invoicing.kpis.revenueDesc', 'CA total ce mois')}
            onClick={() => setActiveTab('invoices')}
          />
          <InvoicingKPICard
            title={t('invoicing.kpis.paidInvoices', 'Factures payées')}
            value={`$<CurrencyAmount amount={invoicingData.paidInvoices} />`}
            icon={CheckCircle}
            color="green"
            trend={invoicingData.paidInvoicesTrend}
            description={t('invoicing.kpis.paidInvoicesDesc', 'Paiements reçus')}
            onClick={() => setActiveTab('payments')}
          />
          <InvoicingKPICard
            title={t('invoicing.kpis.pendingInvoices', 'En attente')}
            value={`$<CurrencyAmount amount={invoicingData.pendingInvoices} />`}
            icon={Clock}
            color="orange"
            trend={invoicingData.pendingInvoicesTrend}
            description={t('invoicing.kpis.pendingInvoicesDesc', 'Factures en attente')}
            onClick={() => setActiveTab('invoices')}
          />
          <InvoicingKPICard
            title={t('invoicing.kpis.overdueInvoices', 'En retard')}
            value={`$<CurrencyAmount amount={invoicingData.overdueInvoices} />`}
            icon={AlertTriangle}
            color="red"
            trend={invoicingData.overdueInvoicesTrend}
            description={t('invoicing.kpis.overdueInvoicesDesc', 'Factures en retard')}
            onClick={() => setActiveTab('invoices')}
          />
        </motion.div>
        {/* Navigation par onglets */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-2">
            <TabsList className="flex w-full flex-nowrap overflow-x-auto gap-2 py-1 px-1">
              <TabsTrigger 
                value="overview" 
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Eye className="h-4 w-4" />
                {t('invoicing.tabs.overview', 'Vue d\'ensemble')}
              </TabsTrigger>
              <TabsTrigger 
                value="invoices" 
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                {t('invoicing.tabs.invoices', 'Factures')}
              </TabsTrigger>
              <TabsTrigger 
                value="quotes" 
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Receipt className="h-4 w-4" />
                {t('invoicing.tabs.quotes', 'Devis')}
              </TabsTrigger>
              <TabsTrigger 
                value="clients" 
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <Users className="h-4 w-4" />
                {t('invoicing.tabs.clients', 'Clients')}
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <CreditCard className="h-4 w-4" />
                {t('invoicing.tabs.payments', 'Paiements')}
              </TabsTrigger>
              <TabsTrigger
                value="late-fees"
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <AlertTriangle className="h-4 w-4" />
                {t('invoicing.tabs.late_fees', 'Pénalités')}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center gap-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4" />
                Configuration
              </TabsTrigger>
            </TabsList>
          </div>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <QuickInvoicingActions
                onNewInvoice={handleNewInvoice}
                onNewQuote={handleNewQuote}
                onNewPayment={handleNewPayment}
                onViewClients={handleViewClients}
                t={t}
              />
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="w-5 h-5 text-purple-500" />
                        <span>{t('invoicing.revenueBreakdown.title', 'Répartition des revenus')}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const totalAmount = invoicingData.totalRevenue;
                          const revenueBreakdown = [
                            { 
                              name: t('invoicing.revenueBreakdown.paidInvoices', 'Factures payées'), 
                              amount: invoicingData.paidInvoices, 
                              percentage: totalAmount > 0 ? Math.round((invoicingData.paidInvoices / totalAmount) * 100) : 0, 
                              color: 'green' 
                            },
                            { 
                              name: t('invoicing.revenueBreakdown.pendingInvoices', 'En attente de paiement'), 
                              amount: invoicingData.pendingInvoices, 
                              percentage: totalAmount > 0 ? Math.round((invoicingData.pendingInvoices / totalAmount) * 100) : 0, 
                              color: 'orange' 
                            },
                            { 
                              name: t('invoicing.revenueBreakdown.overdueInvoices', 'Factures en retard'), 
                              amount: invoicingData.overdueInvoices, 
                              percentage: totalAmount > 0 ? Math.round((invoicingData.overdueInvoices / totalAmount) * 100) : 0, 
                              color: 'red' 
                            }
                          ];
                          if (totalAmount === 0) {
                            return (
                              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <p>{t('invoicing.revenueBreakdown.noData', 'Aucune donnée de revenus disponible pour la période sélectionnée')}</p>
                              </div>
                            );
                          }
                          return revenueBreakdown.map((item, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium">{item.name}</span>
                                <span><CurrencyAmount amount={item.amount} /> ({item.percentage}%)</span>
                              </div>
                              <Progress value={item.percentage} className="h-2" />
                            </div>
                          ));
                        })()} 
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <RecentInvoicingActivities t={t} />
              </div>
              {/* Additional Stats */}
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoicing.stats.invoicesCreated', 'Factures créées')}</p>
                        <p className="text-2xl font-bold">{invoicingData.invoicesCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoicing.stats.thisMonth', 'Ce mois')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoicing.stats.activeClients', 'Clients actifs')}</p>
                        <p className="text-2xl font-bold">{invoicingData.clientsCount}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoicing.stats.total', 'Total')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('invoicing.stats.averageValue', 'Valeur moyenne')}</p>
                        <p className="text-xl font-bold"><CurrencyAmount amount={invoicingData.averageInvoiceValue} /></p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('invoicing.stats.perInvoice', 'Par facture')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          </TabsContent>
          {/* Invoices Tab */}
          <TabsContent value="invoices">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OptimizedInvoicesTab 
                shouldCreateNew={shouldCreateNew === 'invoice'}
                onCreateNewCompleted={() => setShouldCreateNew(null)}
              />
            </motion.div>
          </TabsContent>
          {/* Quotes Tab */}
          <TabsContent value="quotes">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OptimizedQuotesTab 
                shouldCreateNew={shouldCreateNew === 'quote'}
                onCreateNewCompleted={() => setShouldCreateNew(null)}
              />
            </motion.div>
          </TabsContent>
          {/* Clients Tab */}
          <TabsContent value="clients">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OptimizedClientsTab />
            </motion.div>
          </TabsContent>
          {/* Payments Tab */}
          <TabsContent value="payments">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OptimizedPaymentsTab 
                shouldCreateNew={shouldCreateNew === 'payment'}
                onCreateNewCompleted={() => setShouldCreateNew(null)}
              />
            </motion.div>
          </TabsContent>
          {/* Late Fees Tab */}
          <TabsContent value="late-fees">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LateFeeCalculator />
            </motion.div>
          </TabsContent>
          {/* Invoice Settings Tab */}
          <TabsContent value="settings">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                    Configuration des Factures
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Paramétrez vos mentions légales et informations obligatoires pour des factures conformes à la législation française.
                  </p>
                </CardHeader>
                <CardContent>
                  <InvoiceComplianceSettings />
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
