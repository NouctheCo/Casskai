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

import { Purchase, PurchaseFormData, PurchaseFilters, Supplier } from '../types/purchase.types';

import { purchasesService } from '../services/purchasesService';

import { Button } from '../components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

import { Badge } from '../components/ui/badge';

import { toastError, toastSuccess, toastCreated, toastUpdated } from '@/lib/toast-helpers';

import { useEnterprise } from '../contexts/EnterpriseContext';

import { useConfirmDialog } from '../components/ui/ConfirmDialog';

import PurchaseStatsComponent from '../components/purchases/PurchaseStats';

import PurchasesTable from '../components/purchases/PurchasesTable';

import PurchasesFilters from '../components/purchases/PurchasesFilters';

import PurchaseForm from '../components/purchases/PurchaseForm';

import { exportToCsv, generatePdfReport } from '../components/purchases/ExportUtils';

import { Plus, RefreshCw, FileText, AlertTriangle, Sparkles } from 'lucide-react';

import { useAutoAccounting } from '@/hooks/useAutoAccounting';



export default function PurchasesPage() {

  const { t, i18n } = useTranslation();

  

  // Debug: force reload translations if needed

  React.useEffect(() => {

    if (i18n.isInitialized) {

      i18n.reloadResources();

    }

  }, [i18n]);

  const { currentEnterpriseId, currentEnterprise } = useEnterprise();

  const { generateFromPurchase } = useAutoAccounting();

  const { ConfirmDialog: _ConfirmDialog, confirm } = useConfirmDialog();

  

  // State management

  const [purchases, setPurchases] = useState<Purchase[]>([]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [stats, setStats] = useState({ total_purchases: 0, total_amount: 0, pending_payments: 0, overdue_payments: 0 });

  const [loading, setLoading] = useState(true);

  const [exportLoading, setExportLoading] = useState(false);

  const [formLoading, setFormLoading] = useState(false);

  

  // Form and dialog states

  const [isFormOpen, setIsFormOpen] = useState(false);

  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  

  // Filters

  const [filters, setFilters] = useState<PurchaseFilters>({

    payment_status: 'all'

  });

  

  const companyId = currentEnterpriseId || 'company-1'; // Use current enterprise or fallback



  // Load data on component mount

  useEffect(() => {

    if (companyId) {

      loadPurchasesData();

      loadSuppliers();

    }

  }, [filters, companyId]);



  const loadPurchasesData = async () => {

    try {

      setLoading(true);

      

      const [purchasesResult, statsResult] = await Promise.all([

        purchasesService.getPurchases(companyId, filters),

        purchasesService.getPurchaseStats(companyId)

      ]);

      

      if (purchasesResult.error) {

        throw new Error(purchasesResult.error.message);

      }

      

      if (statsResult.error) {

        throw new Error(statsResult.error.message);

      }

      

      setPurchases(purchasesResult.data);

      setStats(statsResult.data);

    } catch (error) {

      console.error('Error loading purchases:', error);

      toastError(error instanceof Error ? error.message : t('purchases.notifications.loadError'));

    } finally {

      setLoading(false);

    }

  };



  const loadSuppliers = async () => {

    try {

      const result = await purchasesService.getSuppliers(companyId);

      if (result.error) {

        throw new Error(result.error.message);

      }

      setSuppliers(result.data);

    } catch (error) {

      console.error('Error loading suppliers:', error);

    }

  };



  // Filter handlers

  const handleFiltersChange = (newFilters: PurchaseFilters) => {

    setFilters(newFilters);

  };



  const handleClearFilters = () => {

    setFilters({ payment_status: 'all' });

  };



  const handleExportCsv = async () => {

    try {

      setExportLoading(true);

      exportToCsv(purchases, 'achats');

      

      toastSuccess(t('purchases.notifications.exportSuccess'));

    } catch (error) {

      console.error('Error exporting:', error);

      toastError('Erreur lors de l\'export');

    } finally {

      setExportLoading(false);

    }

  };



  const handleGeneratePdf = () => {

    try {

      generatePdfReport(purchases, filters);

      

      toastSuccess(t('purchases.notifications.generateReportSuccess'));

    } catch (error) {

      console.error('Error generating PDF:', error);

      toastError(t('purchases.notifications.generateReportError'));

    }

  };



  // Form handlers

  const handleCreatePurchase = () => {

    setEditingPurchase(null);

    setIsFormOpen(true);

  };



  const handleEditPurchase = (purchase: Purchase) => {

    setEditingPurchase(purchase);

    setIsFormOpen(true);

  };



  const handleFormSubmit = async (formData: PurchaseFormData) => {

    try {

      setFormLoading(true);

      

      let result;

      if (editingPurchase) {

        result = await purchasesService.updatePurchase(editingPurchase.id, formData);

      } else {

        result = await purchasesService.createPurchase(companyId, formData);

      }

      

      if (result.error) {

        throw new Error(result.error.message);

      }



      // ✅ Auto-génération de l'écriture comptable pour un nouvel achat

      if (!editingPurchase && result.data && currentEnterprise) {

        try {

          const supplier = suppliers.find(s => s.id === formData.supplier_id);



          await generateFromPurchase({

            id: result.data.id,

            company_id: currentEnterprise.id,

            supplier_id: formData.supplier_id,

            supplier_name: supplier?.name || 'Fournisseur',

            order_number: formData.invoice_number,

            order_date: formData.purchase_date,

            total_excl_tax: formData.amount_ht,

            total_tax: formData.amount_ht * (formData.tva_rate / 100),

            total_incl_tax: formData.amount_ht * (1 + formData.tva_rate / 100),

            items: [{

              account_id: undefined, // Sera mappé automatiquement (607 Achats)

              description: formData.description || 'Achat fournisseur',

              amount_excl_tax: formData.amount_ht,

            }],

          });

        } catch (error) {

          console.warn('Auto-accounting generation failed, but purchase was created:', error);

        }

      }



      if (editingPurchase) {

        toastUpdated('L\'achat');

      } else {

        toastCreated('L\'achat');

      }

      

      loadPurchasesData();

      setIsFormOpen(false);

      setEditingPurchase(null);

    } catch (error) {

      console.error('Error saving purchase:', error);

      toastError(error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement');

    } finally {

      setFormLoading(false);

    }

  };



  const handleDeletePurchase = async (id: string) => {

    const confirmed = await confirm({

      title: t('purchases.notifications.deleteTitle') || 'Supprimer l\'achat',

      description: t('purchases.notifications.deleteConfirm') || 'Êtes-vous sûr de vouloir supprimer cet achat ? Cette action est irréversible.',

      confirmText: t('common.delete') || 'Supprimer',

      cancelText: t('common.cancel') || 'Annuler',

      variant: 'destructive'

    });

    

    if (confirmed) {

      try {

        const result = await purchasesService.deletePurchase(id);

        if (result.error) {

          throw new Error(result.error.message);

        }

        

        toastSuccess("Op\u00e9ration effectu\u00e9e avec succ\u00e8s");

        

        loadPurchasesData();

      } catch (error) {

        console.error('Error deleting purchase:', error);

        toastError("Erreur lors de l'op\u00e9ration");

      }

    }

  };



  const handleMarkAsPaid = async (id: string) => {

    try {

      const result = await purchasesService.markAsPaid(id);

      if (result.error) {

        throw new Error(result.error.message);

      }

      

      toastSuccess("Op\u00e9ration effectu\u00e9e avec succ\u00e8s");

      

      loadPurchasesData();

    } catch (error) {

      console.error('Error marking as paid:', error);

      toastError("Erreur lors de l'op\u00e9ration");

    }

  };



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



  // Show message if no enterprise is selected

  if (!currentEnterpriseId && !currentEnterprise) {

    return (

      <motion.div 

        className="space-y-8 p-6"

        variants={containerVariants}

        initial="hidden"

        animate="visible"

      >

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">

          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg p-6">

            <CardTitle className="text-2xl flex items-center">

              <AlertTriangle className="mr-3 h-8 w-8" />

              {t('purchases.title')}

            </CardTitle>

          </CardHeader>

          <CardContent className="p-6 text-center">

            <p className="text-lg text-muted-foreground mb-6">

              {t('common.noCompanySelectedTitle', 'Aucune entreprise sélectionnée')}

            </p>

            <p className="text-sm text-gray-500 dark:text-gray-400">

              {t('purchases.noCompanySelectedDescription')}

            </p>

          </CardContent>

        </Card>

      </motion.div>

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

            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">

              {t('purchases.title')}

            </h1>

            <Sparkles className="h-6 w-6 text-yellow-500" />

          </div>

          <div className="flex items-center space-x-2">

            <p className="text-gray-600 dark:text-gray-400">

              {currentEnterprise ? `${currentEnterprise.name} - ` : ''}

              {t('purchases.description')}

            </p>

            <Badge variant="secondary" className="text-xs">

              {t('purchases.status.realTime')}

            </Badge>

          </div>

        </div>

        

        <div className="flex items-center space-x-3">

          <Button

            onClick={loadPurchasesData}

            variant="outline"

            disabled={loading}

            className="flex items-center gap-2"

          >

            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />

            {t('purchases.actions.refresh')}

          </Button>

          <Button

            onClick={handleGeneratePdf}

            variant="outline"

            className="flex items-center gap-2"

          >

            <FileText className="w-4 h-4" />

            {t('purchases.actions.generateReport')}

          </Button>

          <Button

            onClick={handleCreatePurchase}

            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"

          >

            <Plus className="w-4 h-4" />

            {t('purchases.createPurchase')}

          </Button>

        </div>

      </motion.div>



      {/* Statistics */}

      <motion.div variants={itemVariants}>

        <PurchaseStatsComponent stats={stats} loading={loading} />

      </motion.div>



      {/* Filters */}

      <motion.div variants={itemVariants}>

        <PurchasesFilters

          filters={filters}

          suppliers={suppliers}

          onFiltersChange={handleFiltersChange}

          onExport={handleExportCsv}

          onClearFilters={handleClearFilters}

          exportLoading={exportLoading}

        />

      </motion.div>



      {/* Purchases Table */}

      <motion.div variants={itemVariants}>

        <PurchasesTable

          purchases={purchases}

          loading={loading}

          onEdit={handleEditPurchase}

          onDelete={handleDeletePurchase}

          onMarkAsPaid={handleMarkAsPaid}

        />

      </motion.div>



      {/* Quick Actions */}

      {purchases.length === 0 && !loading && (

        <motion.div variants={itemVariants}>

          <Card className="shadow-lg">

            <CardContent className="p-8 text-center">

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-2">

                {t('purchases.noPurchases')}

              </h3>

              <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-6">

                {t('purchases.noPurchasesDescription')}

              </p>

              <Button

                onClick={handleCreatePurchase}

                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 mx-auto"

              >

                <Plus className="w-4 h-4" />

                {t('purchases.createPurchase')}

              </Button>

            </CardContent>

          </Card>

        </motion.div>

      )}



      {/* Purchase Form Dialog */}

      <PurchaseForm

        isOpen={isFormOpen}

        onClose={() => {

          setIsFormOpen(false);

          setEditingPurchase(null);

        }}

        onSubmit={handleFormSubmit}

        purchase={editingPurchase}

        suppliers={suppliers}

        loading={formLoading}

      />





      {/* Render confirmation dialog - component provided by useConfirmDialog */}

    </motion.div>

  );

}

