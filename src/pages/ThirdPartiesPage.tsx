import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { useToast } from '../components/ui/use-toast';
import { useEnterprise } from '../contexts/EnterpriseContext';
import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';
import { ThirdPartyFormDialog } from '@/components/third-parties/ThirdPartyFormDialog';
import {
  ThirdParty,
  ThirdPartyFilters,
  ThirdPartyDashboardData,
  AgingReport,
  Transaction
} from '../types/third-parties.types';
import { 
  Users, 
  Building2, 
  UserCheck, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  FileDown,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  AlertCircle,
  Clock,
  DollarSign,
  Sparkles
} from 'lucide-react';

const ThirdPartiesPage: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { currentEnterprise } = useEnterprise();
  
  // State management
  const [dashboardData, setDashboardData] = useState<ThirdPartyDashboardData | null>(null);
  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);
  const [filteredThirdParties, setFilteredThirdParties] = useState<ThirdParty[]>([]);
  const [agingReport, setAgingReport] = useState<AgingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedThirdParty, setSelectedThirdParty] = useState<ThirdParty | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
  
  // Filter states
  const [filters, setFilters] = useState<ThirdPartyFilters>({
    search: '',
    type: '',
    category: '',
    status: '',
    balance_status: undefined,
    has_overdue: undefined
  });

  // Load data on component mount
  useEffect(() => {
    if (currentEnterprise?.id) {
      loadDashboardData();
      loadThirdParties();
      loadAgingReport();
    }
  }, [currentEnterprise]);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [thirdParties, filters]);

  const loadDashboardData = async () => {
    try {
      const stats = await unifiedThirdPartiesService.getDashboardStats(currentEnterprise!.id);
      setDashboardData({
        total_third_parties: stats.total_customers + stats.total_suppliers,
        total_customers: stats.total_customers,
        total_suppliers: stats.total_suppliers,
        active_third_parties: stats.active_customers + stats.active_suppliers,
        total_balance: stats.net_balance,
        overdue_count: 0, // TODO: Implémenter si nécessaire
        top_customers: [] // TODO: Implémenter si nécessaire
      } as unknown as ThirdPartyDashboardData);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading dashboard data:', error instanceof Error ? error.message : String(error));
    }
  };

  const loadThirdParties = async () => {
    try {
      const unified = await unifiedThirdPartiesService.getUnifiedThirdParties(currentEnterprise!.id);
      // Transform to match ThirdParty type expected by the page
      const transformed = unified.map(tp => ({
        id: tp.id,
        type: tp.party_type,
        name: tp.name,
        email: tp.email || '',
        phone: tp.phone || '',
        primary_email: tp.email || '',
        primary_phone: tp.phone || '',
        company_name: tp.company_name,
        tax_number: tp.tax_number,
        billing_address: {
          street: tp.primary_address_line1 || '',
          city: tp.primary_city || '',
          postal_code: tp.primary_postal_code || '',
          country: tp.primary_country || 'FR'
        },
        payment_terms: tp.payment_terms || 30,
        currency: tp.currency || 'EUR',
        is_active: tp.is_active,
        notes: tp.notes,
        current_balance: tp.balance,
        total_receivables: tp.party_type === 'customer' ? tp.balance : 0,
        total_payables: tp.party_type === 'supplier' ? tp.balance : 0,
        tags: [],
        created_at: tp.created_at,
        updated_at: tp.updated_at
      }));
      setThirdParties(transformed as unknown as ThirdParty[]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading third parties:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de chargement',
        description: 'Impossible de charger les tiers',
        variant: 'destructive'
      });
    }
  };

  const loadAgingReport = async () => {
    try {
      // TODO: Implémenter via RPC function si nécessaire
      setAgingReport([]);
      setLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error loading aging report:', error instanceof Error ? error.message : String(error));
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...thirdParties];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tp =>
        tp.name.toLowerCase().includes(searchLower) ||
        tp.primary_email.toLowerCase().includes(searchLower) ||
        tp.code.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(tp => tp.type === filters.type);
    }
    
    if (filters.category) {
      filtered = filtered.filter(tp => tp.category === filters.category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(tp => tp.status === filters.status);
    }
    
    if (filters.balance_status) {
      if (filters.balance_status === 'positive') {
        filtered = filtered.filter(tp => tp.current_balance > 0);
      } else if (filters.balance_status === 'negative') {
        filtered = filtered.filter(tp => tp.current_balance < 0);
      } else if (filters.balance_status === 'zero') {
        filtered = filtered.filter(tp => tp.current_balance === 0);
      }
    }
    
    if (filters.has_overdue) {
      // TODO: Implement proper overdue logic based on invoice due dates
      // For now, filter based on negative balance (indicating overdue payments)
      filtered = filtered.filter(tp => tp.current_balance < 0);
    }
    
    setFilteredThirdParties(filtered);
  };

  const handleExportThirdParties = () => {
    (unifiedThirdPartiesService as any).exportThirdPartiesToCSV(
      filteredThirdParties,
      { format: 'csv', include_contacts: true, include_transactions: false, include_balances: true },
      'tiers'
    );
    toast({
      title: 'Export réussi',
      description: 'Les tiers ont été exportés en CSV'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const handleViewThirdParty = (thirdParty: ThirdParty) => {
    setSelectedThirdParty(thirdParty);
    toast({
      title: 'Affichage des détails',
      description: `Détails de ${thirdParty.name}`,
    });
    // TODO: Open modal or navigate to detail view
  };

  const handleEditThirdParty = (thirdParty: ThirdParty) => {
    setSelectedThirdParty(thirdParty);
    toast({
      title: 'Modification',
      description: `Édition de ${thirdParty.name}`,
    });
    // TODO: Open edit modal or navigate to edit form
  };

  const handleDeleteThirdParty = async (thirdParty: ThirdParty) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce tiers ?')) {
      return;
    }

    try {
      if ((thirdParty.type as any) === 'customer' || thirdParty.type === 'client') {
        await unifiedThirdPartiesService.deleteCustomer(thirdParty.id);
      } else {
        await unifiedThirdPartiesService.deleteSupplier(thirdParty.id);
      }
      await loadThirdParties();
      toast({
        title: 'Suppression réussie',
        description: 'Le tiers a été supprimé avec succès',
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Error deleting third party:', error instanceof Error ? error.message : String(error));
      toast({
        title: 'Erreur de suppression',
        description: 'Impossible de supprimer le tiers',
        variant: 'destructive'
      });
    }
  };

  const handleCreateSuccess = () => {
    loadThirdParties();
    loadDashboardData();
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'client': return 'bg-green-100 text-green-800';
      case 'supplier': return 'bg-blue-100 text-blue-800';
      case 'partner': return 'bg-purple-100 text-purple-800';
      case 'both': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des tiers...</p>
        </div>
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
              Gestion des Tiers
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}
              Gérez vos clients, fournisseurs et partenaires commerciaux
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={handleExportThirdParties}
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            Exporter
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4" />
            Nouveau Tiers
          </Button>
        </div>
      </motion.div>

      {/* Tabs Navigation */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
            <TabsTrigger value="third-parties">Tiers</TabsTrigger>
            <TabsTrigger value="aging">Analyse d'Ancienneté</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="new-third-party">Nouveau Tiers</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {dashboardData && (
              <>
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Tiers</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.total_third_parties}
                          </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Clients Actifs</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.active_clients}
                          </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                          <UserCheck className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Fournisseurs Actifs</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.active_suppliers}
                          </p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-full">
                          <Building2 className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Nouveaux ce mois</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {dashboardData.stats.new_this_month}
                          </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-full">
                          <TrendingUp className="h-6 w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Créances</p>
                          <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(dashboardData.stats.total_receivables)}
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Dettes</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(dashboardData.stats.total_payables)}
                          </p>
                        </div>
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Créances Échues</p>
                          <p className="text-2xl font-bold text-orange-600">
                            {formatCurrency(dashboardData.stats.overdue_receivables)}
                          </p>
                        </div>
                        <AlertCircle className="h-6 w-6 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Dettes Échues</p>
                          <p className="text-2xl font-bold text-red-600">
                            {formatCurrency(dashboardData.stats.overdue_payables)}
                          </p>
                        </div>
                        <Clock className="h-6 w-6 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Top Clients and Suppliers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Top Clients par Chiffre d'Affaires</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.stats.top_clients_by_revenue.map((client) => (
                          <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-100 rounded-full">
                                <UserCheck className="h-4 w-4 text-green-600" />
                              </div>
                              <span className="font-medium">{client.name}</span>
                            </div>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(client.revenue)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Top Fournisseurs par Dépenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {dashboardData.stats.top_suppliers_by_spending.map((supplier) => (
                          <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-full">
                                <Building2 className="h-4 w-4 text-blue-600" />
                              </div>
                              <span className="font-medium">{supplier.name}</span>
                            </div>
                            <span className="font-semibold text-blue-600">
                              {formatCurrency(supplier.spending)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle>Alertes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        <div>
                          <p className="font-medium text-orange-800">Factures échues</p>
                          <p className="text-sm text-orange-600">{dashboardData.alerts.overdue_invoices} factures</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                        <CreditCard className="h-5 w-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-800">Limites de crédit dépassées</p>
                          <p className="text-sm text-red-600">{dashboardData.alerts.credit_limit_exceeded} tiers</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-blue-800">Informations manquantes</p>
                          <p className="text-sm text-blue-600">{dashboardData.alerts.missing_information} tiers</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Third Parties Tab */}
          <TabsContent value="third-parties" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Rechercher un tiers..."
                        value={filters.search}
                        onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={filters.type}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous types</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="supplier">Fournisseur</SelectItem>
                        <SelectItem value="partner">Partenaire</SelectItem>
                        <SelectItem value="both">Client/Fournisseur</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="inactive">Inactif</SelectItem>
                        <SelectItem value="suspended">Suspendu</SelectItem>
                        <SelectItem value="blocked">Bloqué</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setShowFilters(!showFilters)}
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filtres
                    </Button>
                  </div>
                </div>
                
                {showFilters && (
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                      value={filters.category}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === 'all' ? '' : value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes catégories</SelectItem>
                        <SelectItem value="individual">Particulier</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                        <SelectItem value="government">Administration</SelectItem>
                        <SelectItem value="ngo">Association</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filters.balance_status || ''}
                      onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        balance_status: value === 'all' ? undefined : value as any
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Solde" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous soldes</SelectItem>
                        <SelectItem value="positive">Positif</SelectItem>
                        <SelectItem value="negative">Négatif</SelectItem>
                        <SelectItem value="zero">Nul</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="has_overdue"
                        checked={filters.has_overdue || false}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          has_overdue: e.target.checked ? true : undefined
                        }))}
                        className="h-4 w-4"
                      />
                      <label htmlFor="has_overdue" className="text-sm">
                        Factures échues uniquement
                      </label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Third Parties List */}
            <div className="grid gap-6">
              {filteredThirdParties.map((thirdParty) => (
                <Card key={thirdParty.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-gray-100 rounded-full">
                          {thirdParty.category === 'company' ? (
                            <Building2 className="h-6 w-6 text-gray-600" />
                          ) : (
                            <Users className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold">{thirdParty.name}</h3>
                            <Badge className={getTypeColor(thirdParty.type)}>
                              {thirdParty.type}
                            </Badge>
                            <Badge className={getStatusColor(thirdParty.status)}>
                              {thirdParty.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">Code: {thirdParty.code}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {thirdParty.primary_email}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {thirdParty.primary_phone}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {thirdParty.billing_address.city}, {thirdParty.billing_address.country}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewThirdParty(thirdParty)}
                          title="Voir les détails"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditThirdParty(thirdParty)}
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteThirdParty(thirdParty)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-600">Solde Actuel</p>
                        <p className={`font-semibold ${
                          thirdParty.current_balance > 0 ? 'text-green-600' : 
                          thirdParty.current_balance < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {formatCurrency(thirdParty.current_balance)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-gray-600">Créances</p>
                        <p className="font-semibold text-green-600">
                          {formatCurrency(thirdParty.total_receivables)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-gray-600">Dettes</p>
                        <p className="font-semibold text-red-600">
                          {formatCurrency(thirdParty.total_payables)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-gray-600">Limite de Crédit</p>
                        <p className="font-semibold text-blue-600">
                          {thirdParty.credit_limit ? formatCurrency(thirdParty.credit_limit) : 'Non définie'}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {thirdParty.tags && thirdParty.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {thirdParty.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Last Interaction */}
                    {thirdParty.last_interaction && (
                      <div className="mt-4 text-xs text-gray-500">
                        Dernière interaction: {new Date(thirdParty.last_interaction).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredThirdParties.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun tiers trouvé</h3>
                  <p className="text-gray-600 mb-4">
                    Aucun tiers ne correspond aux critères de recherche actuels.
                  </p>
                  <Button onClick={() => setFilters({ 
                    search: '', 
                    type: '', 
                    category: '', 
                    status: '',
                    balance_status: undefined,
                    has_overdue: undefined 
                  })}>
                    Réinitialiser les filtres
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Aging Analysis Tab */}
          <TabsContent value="aging" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analyse d'Ancienneté des Créances</CardTitle>
                <p className="text-sm text-gray-600">
                  Répartition des créances par période d'ancienneté
                </p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Tiers</th>
                        <th className="text-right py-3 px-4">0-30 jours</th>
                        <th className="text-right py-3 px-4">31-60 jours</th>
                        <th className="text-right py-3 px-4">61-90 jours</th>
                        <th className="text-right py-3 px-4">91-120 jours</th>
                        <th className="text-right py-3 px-4">&gt;120 jours</th>
                        <th className="text-right py-3 px-4">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agingReport.map((report) => (
                        <tr key={report.third_party_id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{report.third_party_name}</td>
                          <td className="text-right py-3 px-4">
                            {formatCurrency(report.aging_buckets.current)}
                          </td>
                          <td className="text-right py-3 px-4">
                            {formatCurrency(report.aging_buckets.bucket_30)}
                          </td>
                          <td className="text-right py-3 px-4 text-yellow-600">
                            {formatCurrency(report.aging_buckets.bucket_60)}
                          </td>
                          <td className="text-right py-3 px-4 text-orange-600">
                            {formatCurrency(report.aging_buckets.bucket_90)}
                          </td>
                          <td className="text-right py-3 px-4 text-red-600">
                            {formatCurrency(report.aging_buckets.bucket_over_120)}
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">
                            {formatCurrency(report.total_outstanding)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Transactions Récentes</CardTitle>
                <p className="text-sm text-gray-600">
                  Historique des transactions avec les tiers
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Transactions</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    L'affichage des transactions sera disponible dans la prochaine version
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* New Third Party Tab */}
          <TabsContent value="new-third-party" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Créer un Nouveau Tiers</CardTitle>
                <p className="text-sm text-gray-600">
                  Ajoutez un nouveau client, fournisseur ou partenaire
                </p>
              </CardHeader>
              <CardContent>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                  <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Formulaire de Création</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Le formulaire de création de tiers sera disponible dans la prochaine version
                  </p>
                  <Button disabled>
                    Créer un Tiers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
      {/* Dialog de création */}
      {currentEnterprise && (
        <ThirdPartyFormDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={handleCreateSuccess}
          companyId={currentEnterprise.id}
          defaultType="customer"
        />
      )}
    </motion.div>
  );
};

export default ThirdPartiesPage;