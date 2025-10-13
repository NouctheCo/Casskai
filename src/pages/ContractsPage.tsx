/**
 * Page de gestion des contrats clients et calcul automatisé des RFA
 * Réutilise les composants et patterns existants de l'application CassKai
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { useCurrency } from '../hooks/useCurrency';
import { useContracts } from '../hooks/useContracts';
import { AmountDisplay } from '../components/currency/AmountDisplay';
import {
  ContractData
} from '../types/contracts.types';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calculator,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Target,
  BarChart3,
  Eye,
  Edit,
  Activity,
  Sparkles
} from 'lucide-react';

/**
 * Composant principal de la page Contrats RFA
 */
const ContractsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentEnterprise } = useEnterprise();
  const { formatAmount } = useCurrency();

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
  
  const {
    contracts,
    dashboardData,
    rfaCalculations,
    loading,
    error,
    exportContracts,
    exportRFACalculations
  } = useContracts();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [_selectedContract, setSelectedContract] = useState<ContractData | null>(null);
  const [_showContractForm, setShowContractForm] = useState(false);
  const [_showRFACalculator, setShowRFACalculator] = useState(false);

  // Composant StatCard réutilisé du dashboard
  const StatCard: React.FC<{
    title: string;
    value: string | number | React.ReactNode;
    change?: number;
    icon: React.ReactNode;
    className?: string;
  }> = ({ title, value, change, icon, className = '' }) => (
    <Card className={`${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <p className={`text-xs ${change >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center`}>
            {change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(change)}% par rapport au mois dernier
          </p>
        )}
      </CardContent>
    </Card>
  );

  // Composant Dashboard principal
  const ContractsDashboard: React.FC = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('contracts.stats.total_contracts', 'Contrats totaux')}
          value={dashboardData?.stats.total_contracts || 0}
          icon={<FileText />}
        />
        <StatCard
          title={t('contracts.stats.active_contracts', 'Contrats actifs')}
          value={dashboardData?.stats.active_contracts || 0}
          icon={<Activity />}
        />
        <StatCard
          title={t('contracts.stats.total_rfa_pending', 'RFA en attente')}
          value={<AmountDisplay amount={dashboardData?.stats.total_rfa_pending || 0} currency="EUR" />}
          icon={<DollarSign />}
        />
        <StatCard
          title={t('contracts.stats.average_rate', 'Taux moyen')}
          value={`${((dashboardData?.stats.average_rfa_rate || 0) * 100).toFixed(2)}%`}
          icon={<Target />}
        />
      </div>

      {/* Alertes importantes */}
      {dashboardData?.alerts && dashboardData.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
              {t('contracts.alerts.title', 'Alertes importantes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(dashboardData.alerts || []).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-4 ${
                    alert.priority === 'high'
                      ? 'border-red-500 bg-red-50'
                      : alert.priority === 'medium'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{alert.client_name}</p>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                    </div>
                    <Badge variant={alert.priority === 'high' ? 'destructive' : 'secondary'}>
                      {alert.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Graphiques et données récentes */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {t('contracts.top_clients', 'Top clients RFA')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.top_clients.map((client, index) => (
                <div key={client.client_id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{client.client_name}</p>
                      <p className="text-xs text-gray-500">
                        {client.contracts_count} contrat{client.contracts_count > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      <AmountDisplay amount={client.total_rfa} currency={client.currency} />
                    </p>
                    <p className="text-xs text-gray-500">
                      {(client.average_rate * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculs récents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              {t('contracts.recent_calculations', 'Calculs récents')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.recent_calculations.map((calc) => (
                <div key={calc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{calc.client_name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(calc.period_start).toLocaleDateString('fr-FR')} - {new Date(calc.period_end).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      <AmountDisplay amount={calc.rfa_amount} currency={calc.currency} />
                    </p>
                    <Badge variant={calc.status === 'validated' ? 'default' : calc.status === 'pending' ? 'secondary' : 'outline'}>
                      {t(`contracts.status.${calc.status}`, calc.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Composant liste des contrats
  const ContractsList: React.FC = () => (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="contracts-search"
              name="contracts-search"
              placeholder={t('contracts.search_placeholder', 'Rechercher un contrat ou client...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportContracts}>
            <Download className="h-4 w-4 mr-2" />
            {t('common.export', 'Exporter')}
          </Button>
          <Button onClick={() => setShowContractForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('contracts.new_contract', 'Nouveau contrat')}
          </Button>
        </div>
      </div>

      {/* Liste des contrats */}
      <div className="grid gap-4">
        {contracts
          .filter(contract => 
            !searchTerm || 
            contract.contract_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
          .map((contract) => (
            <Card key={contract.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-lg">{contract.contract_name}</h3>
                      <Badge variant={contract.status === 'active' ? 'default' : 'secondary'}>
                        {t(`contracts.status.${contract.status}`, contract.status)}
                      </Badge>
                      <Badge variant="outline">
                        {t(`contracts.type.${contract.contract_type}`, contract.contract_type)}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-600 mt-1">{contract.client_name}</p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(contract.start_date).toLocaleDateString('fr-FR')}
                        {contract.end_date && ` - ${new Date(contract.end_date).toLocaleDateString('fr-FR')}`}
                      </span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {contract.currency}
                      </span>
                    </div>

                    {/* Configuration des remises */}
                    <div className="mt-3">
                      {contract.discount_config.type === 'progressive' && contract.discount_config.tiers && (
                        <div className="text-sm">
                          <span className="text-gray-500">Remises par paliers : </span>
                          {contract.discount_config.tiers.map((tier, index) => (
                            <span key={index} className="inline-block mr-2">
                              {(tier.rate * 100).toFixed(1)}%
                              {contract.discount_config.tiers && index < contract.discount_config.tiers.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                      {contract.discount_config.type === 'fixed_percent' && (
                        <div className="text-sm">
                          <span className="text-gray-500">Taux fixe : </span>
                          <span className="font-medium">{((contract.discount_config.rate || 0) * 100).toFixed(2)}%</span>
                        </div>
                      )}
                      {contract.discount_config.type === 'fixed_amount' && (
                        <div className="text-sm">
                          <span className="text-gray-500">Montant fixe : </span>
                          <span className="font-medium">
                            <AmountDisplay amount={contract.discount_config.amount || 0} currency={contract.currency} />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedContract(contract)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                      setSelectedContract(contract);
                      setShowRFACalculator(true);
                    }}>
                      <Calculator className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );

  // Composant calculs RFA
  const RFACalculationsList: React.FC = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t('contracts.rfa_calculations', 'Calculs RFA')}</h2>
        <Button variant="outline" onClick={exportRFACalculations}>
          <Download className="h-4 w-4 mr-2" />
          {t('common.export', 'Exporter')}
        </Button>
      </div>

      <div className="grid gap-4">
        {rfaCalculations.map((calc) => (
          <Card key={calc.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="font-semibold">{calc.client_name}</h3>
                    <Badge variant={calc.status === 'validated' ? 'default' : calc.status === 'pending' ? 'secondary' : 'outline'}>
                      {t(`contracts.rfa_status.${calc.status}`, calc.status)}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 text-sm mt-1">{calc.contract_name}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Période</p>
                      <p className="font-medium">
                        {new Date(calc.period_start).toLocaleDateString('fr-FR')} - {new Date(calc.period_end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">CA Réalisé</p>
                      <p className="font-medium">
                        <AmountDisplay amount={calc.turnover_amount} currency={calc.currency} />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">RFA</p>
                      <p className="font-medium text-blue-600">
                        <AmountDisplay amount={calc.rfa_amount} currency={calc.currency} />
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Taux effectif</p>
                      <p className="font-medium">
                        {((calc.rfa_amount / calc.turnover_amount) * 100).toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Détails du calcul */}
                  {calc.calculation_details.breakdown && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Détail du calcul par paliers :</p>
                      <div className="space-y-1">
                        {calc.calculation_details.breakdown.map((tier, index) => (
                          <div key={index} className="flex justify-between text-xs">
                            <span>
                              {formatAmount(tier.tier_min)} - {tier.tier_max ? formatAmount(tier.tier_max) : '∞'} 
                              ({(tier.tier_rate * 100).toFixed(1)}%)
                            </span>
                            <span className="font-medium">
                              <AmountDisplay amount={tier.rfa_amount} currency={calc.currency} />
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Gestion des erreurs
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              {t('contracts.title', 'Contrats & RFA')}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              {t('contracts.subtitle', 'Gestion des contrats clients et calcul automatisé des remises de fin d\'année')}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => exportContracts()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {t('common.export', 'Exporter')}
          </Button>
          <Button
            onClick={() => setActiveTab('contracts')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('contracts.new', 'Nouveau Contrat')}
          </Button>
        </div>
      </motion.div>

      {/* Navigation par onglets */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('contracts.tabs.dashboard', 'Dashboard')}
          </TabsTrigger>
          <TabsTrigger value="contracts" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            {t('contracts.tabs.contracts', 'Contrats')}
          </TabsTrigger>
          <TabsTrigger value="calculations" className="flex items-center">
            <Calculator className="h-4 w-4 mr-2" />
            {t('contracts.tabs.calculations', 'Calculs RFA')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ContractsDashboard />
          )}
        </TabsContent>

        <TabsContent value="contracts" className="mt-6">
          <ContractsList />
        </TabsContent>

        <TabsContent value="calculations" className="mt-6">
          <RFACalculationsList />
        </TabsContent>
      </Tabs>
      </motion.div>
    </motion.div>
  );
};

export default ContractsPage;