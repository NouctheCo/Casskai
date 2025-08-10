import React, { useState, useEffect } from 'react';
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
  FileText,
  Receipt,
  CreditCard,
  Calendar,
  Euro,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
  Edit,
  Send,
  Download,
  RefreshCw,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  Activity,
  Zap,
  DollarSign,
  BarChart3,
  Settings
} from 'lucide-react';

// Import optimized tab components
import OptimizedInvoicesTab from '@/components/invoicing/OptimizedInvoicesTab';
import OptimizedClientsTab from '@/components/invoicing/OptimizedClientsTab';
import OptimizedQuotesTab from '@/components/invoicing/OptimizedQuotesTab';
import OptimizedPaymentsTab from '@/components/invoicing/OptimizedPaymentsTab';

// Invoicing KPI Card Component
const InvoicingKPICard = ({ title, value, icon, trend, color = 'blue', description, onClick }) => {
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
const QuickInvoicingActions = ({ onNewInvoice, onNewQuote, onNewPayment, onViewClients }) => {
  const quickActions = [
    {
      title: 'Nouvelle facture',
      description: 'Créer une facture client',
      icon: Plus,
      color: 'blue',
      onClick: onNewInvoice
    },
    {
      title: 'Nouveau devis',
      description: 'Créer un devis',
      icon: FileText,
      color: 'green',
      onClick: onNewQuote
    },
    {
      title: 'Nouveau paiement',
      description: 'Enregistrer un paiement',
      icon: CreditCard,
      color: 'orange',
      onClick: onNewPayment
    },
    {
      title: 'Gérer les clients',
      description: 'Voir la liste des clients',
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

// Recent Invoicing Activities Component
const RecentInvoicingActivities = () => {
  const activities = [
    { type: 'invoice', description: 'Facture F-2024-001 créée', time: '5 min', icon: FileText, color: 'blue' },
    { type: 'payment', description: 'Paiement reçu - Client ABC', time: '1h', icon: CheckCircle, color: 'green' },
    { type: 'quote', description: 'Devis D-2024-012 envoyé', time: '2h', icon: Send, color: 'purple' },
    { type: 'reminder', description: 'Relance client XYZ Corp', time: '1j', icon: AlertTriangle, color: 'orange' }
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

export default function InvoicingPageOptimized() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { canAccessFeature } = useSubscription();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [isLoading, setIsLoading] = useState(true);
  const [shouldCreateNew, setShouldCreateNew] = useState(null); // 'invoice', 'quote', 'payment'

  // Mock invoicing data
  const [invoicingData, setInvoicingData] = useState({
    totalRevenue: 125430.50,
    paidInvoices: 89650.25,
    pendingInvoices: 35780.25,
    overdueInvoices: 12450.00,
    invoicesCount: 87,
    clientsCount: 23,
    quotesCount: 15,
    averageInvoiceValue: 1441.49
  });

  useEffect(() => {
    // Simulate data loading
    const loadInvoicingData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    
    loadInvoicingData();
  }, [selectedPeriod]);

  const handleNewInvoice = () => {
    if (!canAccessFeature('unlimited_invoices')) {
      toast({
        title: "Fonctionnalité limitée",
        description: "Mettez à niveau votre plan pour créer des factures illimitées.",
        variant: "destructive"
      });
      return;
    }
    setShouldCreateNew('invoice');
    setActiveTab('invoices');
  };

  const handleNewQuote = () => {
    setShouldCreateNew('quote');
    setActiveTab('quotes');
  };

  const handleNewPayment = () => {
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
            <Receipt className="w-8 h-8 text-blue-500" />
            <span>Facturation & Devis</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez vos factures, devis et suivi des paiements
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
          
          <Button onClick={handleNewInvoice}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Invoicing KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <InvoicingKPICard
          title="Chiffre d'affaires"
          value={`${invoicingData.totalRevenue.toLocaleString('fr-FR')} €`}
          icon={Euro}
          color="blue"
          trend={15.2}
          description="CA total ce mois"
        />
        
        <InvoicingKPICard
          title="Factures payées"
          value={`${invoicingData.paidInvoices.toLocaleString('fr-FR')} €`}
          icon={CheckCircle}
          color="green"
          trend={8.7}
          description="Paiements reçus"
        />
        
        <InvoicingKPICard
          title="En attente"
          value={`${invoicingData.pendingInvoices.toLocaleString('fr-FR')} €`}
          icon={Clock}
          color="orange"
          trend={-3.2}
          description="Factures en attente"
        />
        
        <InvoicingKPICard
          title="En retard"
          value={`${invoicingData.overdueInvoices.toLocaleString('fr-FR')} €`}
          icon={AlertTriangle}
          color="red"
          trend={-12.5}
          description="Factures en retard"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <Eye className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Factures</span>
          </TabsTrigger>
          <TabsTrigger value="quotes" className="flex items-center space-x-2">
            <Receipt className="w-4 h-4" />
            <span>Devis</span>
          </TabsTrigger>
          <TabsTrigger value="clients" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Clients</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Paiements</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <QuickInvoicingActions
            onNewInvoice={handleNewInvoice}
            onNewQuote={handleNewQuote}
            onNewPayment={handleNewPayment}
            onViewClients={handleViewClients}
          />
          
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <PieChart className="w-5 h-5 text-purple-500" />
                    <span>Répartition des revenus</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Factures payées', amount: 89650, percentage: 71, color: 'green' },
                      { name: 'En attente de paiement', amount: 35780, percentage: 29, color: 'orange' },
                      { name: 'Factures en retard', amount: 12450, percentage: 10, color: 'red' }
                    ].map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{item.name}</span>
                          <span>{item.amount.toLocaleString('fr-FR')} € ({item.percentage}%)</span>
                        </div>
                        <Progress value={item.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <RecentInvoicingActivities />
          </div>

          {/* Additional Stats */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Factures créées</p>
                    <p className="text-2xl font-bold">{invoicingData.invoicesCount}</p>
                    <p className="text-xs text-gray-500">Ce mois</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clients actifs</p>
                    <p className="text-2xl font-bold">{invoicingData.clientsCount}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Valeur moyenne</p>
                    <p className="text-xl font-bold">{invoicingData.averageInvoiceValue.toLocaleString('fr-FR')} €</p>
                    <p className="text-xs text-gray-500">Par facture</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <OptimizedInvoicesTab 
            shouldCreateNew={shouldCreateNew === 'invoice'}
            onCreateNewCompleted={() => setShouldCreateNew(null)}
          />
        </TabsContent>

        {/* Quotes Tab */}
        <TabsContent value="quotes">
          <OptimizedQuotesTab 
            shouldCreateNew={shouldCreateNew === 'quote'}
            onCreateNewCompleted={() => setShouldCreateNew(null)}
          />
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients">
          <OptimizedClientsTab />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <OptimizedPaymentsTab 
            shouldCreateNew={shouldCreateNew === 'payment'}
            onCreateNewCompleted={() => setShouldCreateNew(null)}
          />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}