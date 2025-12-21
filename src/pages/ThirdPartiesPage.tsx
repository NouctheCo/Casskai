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

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

import { Button } from '../components/ui/button';

import { Badge } from '../components/ui/badge';

import { EmptyList } from '../components/ui/EmptyState';

import { Input } from '../components/ui/input';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

import { toastError, toastSuccess, toastDeleted, toastUpdated } from '@/lib/toast-helpers';

import { useEnterprise } from '../contexts/EnterpriseContext';

import { unifiedThirdPartiesService } from '@/services/unifiedThirdPartiesService';

import { ThirdPartyFormDialog } from '@/components/third-parties/ThirdPartyFormDialog';

import { TransactionsTab } from '@/components/third-parties/TransactionsTab';

import { ImportTab } from '@/components/third-parties/ImportTab';

import { AgingAnalysisTab } from '@/components/third-parties/AgingAnalysisTab';

import {

  ThirdParty,

  ThirdPartyFilters,

  ThirdPartyDashboardData

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

  Sparkles

} from 'lucide-react';



const ThirdPartiesPage: React.FC = () => {

  const { t: _t } = useTranslation();

  const { currentEnterprise } = useEnterprise();

  

  // State management

  const [dashboardData, setDashboardData] = useState<ThirdPartyDashboardData | null>(null);

  const [thirdParties, setThirdParties] = useState<ThirdParty[]>([]);

  const [filteredThirdParties, setFilteredThirdParties] = useState<ThirdParty[]>([]);

  const [_agingReport, setAgingReport] = useState<unknown[]>([]);

  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');

  const [_selectedThirdParty, setSelectedThirdParty] = useState<ThirdParty | null>(null);

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
        stats: {
          total_third_parties: stats.total_customers + stats.total_suppliers,
          active_clients: stats.active_customers,
          active_suppliers: stats.active_suppliers,
          new_this_month: 0,
          total_receivables: 0,
          total_payables: 0,
          overdue_receivables: 0,
          overdue_payables: 0,
          top_clients_by_revenue: [],
          top_suppliers_by_spending: []
        },
        recent_third_parties: [],
        aging_summary: [],
        recent_transactions: [],
        alerts: {
          overdue_invoices: 0,
          credit_limit_exceeded: 0,
          missing_information: 0
        }
      });

    } catch (error) {

      console.error('Error loading dashboard data:', error instanceof Error ? error.message : String(error));

    }

  };



  const loadThirdParties = async () => {

    try {

      const unified = await unifiedThirdPartiesService.getUnifiedThirdParties(currentEnterprise!.id);

      // Transform to match ThirdParty type expected by the page

      const transformed = unified.map(tp => ({

        id: tp.id,

        type: tp.type,

        name: tp.name,

        email: tp.email || '',

        phone: tp.phone || '',

        primary_email: tp.email || '',

        primary_phone: tp.phone || '',

        company_name: tp.company_name,

        tax_number: tp.tax_number,

        billing_address: {

          street: tp.address_line1 || '',

          city: tp.city || '',

          postal_code: tp.postal_code || '',

          country: tp.country || 'FR'

        },

        payment_terms: tp.payment_terms || 30,

        currency: tp.currency || 'EUR',

        is_active: tp.is_active,

        notes: tp.notes,

        current_balance: tp.current_balance,

        total_receivables: tp.type === 'customer' ? tp.current_balance : 0,

        total_payables: tp.type === 'supplier' ? tp.current_balance : 0,

        tags: [],

        created_at: tp.created_at,

        updated_at: tp.updated_at

      }));

      setThirdParties(transformed as unknown as ThirdParty[]);

    } catch (error) {

      console.error('Error loading third parties:', error instanceof Error ? error.message : String(error));

      toastError('Impossible de charger les tiers');

    }

  };



  const loadAgingReport = async () => {

    try {

      // TODO: Implémenter via RPC function si nécessaire

      setAgingReport([]);

      setLoading(false);

    } catch (error) {

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

    toastSuccess('Tiers exportés en CSV avec succès');

  };



  const formatCurrency = (amount: number) => {

    return new Intl.NumberFormat('fr-FR', {

      style: 'currency',

      currency: 'EUR'

    }).format(amount);

  };



  const handleViewThirdParty = (thirdParty: ThirdParty) => {

    setSelectedThirdParty(thirdParty);

    toastSuccess(`Affichage des détails de ${thirdParty.name}`);

    // TODO: Open modal or navigate to detail view

  };



  const handleEditThirdParty = (thirdParty: ThirdParty) => {

    setSelectedThirdParty(thirdParty);

    toastUpdated(`Édition de ${thirdParty.name}`);

    // TODO: Open edit modal or navigate to edit form

  };



  const handleDeleteThirdParty = async (thirdParty: ThirdParty) => {
    // eslint-disable-next-line no-alert
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

      toastDeleted('Le tiers');

    } catch (error) {

      console.error('Error deleting third party:', error instanceof Error ? error.message : String(error));

      toastError('Impossible de supprimer le tiers');

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

          <p className="text-gray-600 dark:text-gray-300">Chargement des tiers...</p>

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

            <p className="text-gray-600 dark:text-gray-300">

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

            <TabsTrigger value="import">Import</TabsTrigger>

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Tiers</p>

                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Clients Actifs</p>

                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Fournisseurs Actifs</p>

                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nouveaux ce mois</p>

                          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Créances</p>

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Dettes</p>

                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Créances Échues</p>

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

                          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Dettes Échues</p>

                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">

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

                          <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">

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

                          <div key={supplier.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">

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

                      <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg dark:bg-red-900/20">

                        <CreditCard className="h-5 w-5 text-red-500" />

                        <div>

                          <p className="font-medium text-red-800">Limites de crédit dépassées</p>

                          <p className="text-sm text-red-600 dark:text-red-400">{dashboardData.alerts.credit_limit_exceeded} tiers</p>

                        </div>

                      </div>

                      <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">

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

                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />

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

                        <div className="p-3 bg-gray-100 rounded-full dark:bg-gray-900/50">

                          {thirdParty.category === 'company' ? (

                            <Building2 className="h-6 w-6 text-gray-600 dark:text-gray-300" />

                          ) : (

                            <Users className="h-6 w-6 text-gray-600 dark:text-gray-300" />

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

                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Code: {thirdParty.code}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">

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

                      <div className="text-center p-3 bg-gray-50 rounded-lg dark:bg-gray-900/30">

                        <p className="text-xs text-gray-600 dark:text-gray-300">Solde Actuel</p>

                        <p className={`font-semibold ${

                          thirdParty.current_balance > 0 ? 'text-green-600' : 

                          thirdParty.current_balance < 0 ? 'text-red-600' : 'text-gray-600'

                        }`}>

                          {formatCurrency(thirdParty.current_balance)}

                        </p>

                      </div>

                      <div className="text-center p-3 bg-green-50 rounded-lg dark:bg-green-900/20">

                        <p className="text-xs text-gray-600 dark:text-gray-300">Créances</p>

                        <p className="font-semibold text-green-600">

                          {formatCurrency(thirdParty.total_receivables)}

                        </p>

                      </div>

                      <div className="text-center p-3 bg-red-50 rounded-lg dark:bg-red-900/20">

                        <p className="text-xs text-gray-600 dark:text-gray-300">Dettes</p>

                        <p className="font-semibold text-red-600 dark:text-red-400">

                          {formatCurrency(thirdParty.total_payables)}

                        </p>

                      </div>

                      <div className="text-center p-3 bg-blue-50 rounded-lg dark:bg-blue-900/20">

                        <p className="text-xs text-gray-600 dark:text-gray-300">Limite de Crédit</p>

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

                      <div className="mt-4 text-xs text-gray-500 dark:text-gray-300">

                        Dernière interaction: {new Date(thirdParty.last_interaction).toLocaleDateString('fr-FR')}

                      </div>

                    )}

                  </CardContent>

                </Card>

              ))}

            </div>



            {filteredThirdParties.length === 0 && (

              <EmptyList

                icon={Users}

                title="Aucun tiers trouvé"

                description="Aucun tiers ne correspond aux critères de recherche actuels."

                action={{

                  label: 'Réinitialiser les filtres',

                  onClick: () => setFilters({ 

                    search: '', 

                    type: '', 

                    category: '', 

                    status: '',

                    balance_status: undefined,

                    has_overdue: undefined 

                  })

                }}

              />

            )}

          </TabsContent>



          {/* Aging Analysis Tab */}

          <TabsContent value="aging" className="space-y-6">

            {currentEnterprise?.id && <AgingAnalysisTab companyId={currentEnterprise.id} />}

          </TabsContent>



          {/* Transactions Tab */}

          <TabsContent value="transactions" className="space-y-6">

            {currentEnterprise?.id && <TransactionsTab companyId={currentEnterprise.id} />}

          </TabsContent>



          {/* Import Tab */}

          <TabsContent value="import" className="space-y-6">

            {currentEnterprise?.id && <ImportTab companyId={currentEnterprise.id} />}

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
