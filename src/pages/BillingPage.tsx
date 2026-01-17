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
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast-helpers';
import { 
  CreditCard,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  FileText,
  RefreshCw,
  ArrowUpCircle,
  Filter
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/types/subscription.types';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import { TrialStatusCard, TrialActionsCard } from '@/components/TrialComponents';
import { logger } from '@/lib/logger';
const BillingPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: _user } = useAuth();
  const {
    subscription,
    plan,
    isLoading,
    invoices,
    paymentMethods,
    defaultPaymentMethod: _defaultPaymentMethod,
    subscribe: _subscribe,
    updateSubscription: _updateSubscription,
    refreshSubscription,
    openBillingPortal
  } = useSubscription();
  const [activeTab, setActiveTab] = useState<string>('overview');

  const handleOpenBillingPortal = async () => {
    try {
      const result = await openBillingPortal();
      if (!result.success) {
        toastError(result.error || t('billingPage.toasts.portalError'));
      }
    } catch (error) {
      logger.error('Billing', 'Error opening billing portal:', error instanceof Error ? error.message : String(error));
      toastError(t('billingPage.toasts.unexpectedError'));
    }
  };
  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'plans', 'payment', 'invoices'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    if (success === 'true') {
      toastSuccess(t('billingPage.toasts.subscriptionActivated'));
      // Refresh subscription data
      refreshSubscription();
      // Clean URL
      navigate('/billing', { replace: true });
    } else if (canceled === 'true') {
      toastError(t('billingPage.toasts.paymentCanceled'));
      // Clean URL
      navigate('/billing', { replace: true });
    }
  }, [searchParams, navigate, refreshSubscription]);
  const handleAddPaymentMethod = async () => {
    if (!subscription) {
      toastError(t('billingPage.toasts.needSubscription'));
      return;
    }
    try {
      const result = await openBillingPortal();
      if (!result.success) {
        toastError(result.error || t('billingPage.toasts.portalError'));
      }
      // If successful, the portal will open in a new tab
    } catch (error) {
      logger.error('Billing', 'Error opening billing portal:', error instanceof Error ? error.message : String(error));
      toastError(t('billingPage.toasts.unexpectedError'));
    }
  };
  const handleManagePaymentMethod = async (_methodId: string) => {
    if (!subscription) {
      toastError(t('billingPage.toasts.needActiveSubscription'));
      return;
    }
    try {
      // Ouvrir le portail de facturation Stripe pour gérer cette méthode spécifique
      const result = await openBillingPortal();
      if (!result.success) {
        toastError(result.error || t('billingPage.toasts.paymentManagementError'));
      } else {
        toastSuccess(t('billingPage.toasts.paymentPortalOpening'));
      }
      // Si succès, le portail s'ouvrira dans un nouvel onglet
    } catch (error) {
      logger.error('Billing', 'Error managing payment method:', error instanceof Error ? error.message : String(error));
      toastError(t('billingPage.toasts.paymentMethodError'));
    }
  };
  const handleDownloadPDF = async (invoice: any) => {
    try {
      if (!invoice.pdfUrl) {
        toastError(t('billingPage.toasts.pdfNotAvailable'));
        return;
      }
      toastSuccess(t('billingPage.toasts.downloadingInvoice', { invoiceId: invoice.stripeInvoiceId.slice(-8) }));
      // Ouvrir le PDF dans un nouvel onglet pour téléchargement
      window.open(invoice.pdfUrl, '_blank');
      // Message de succès
      setTimeout(() => {
        toastSuccess(t('billingPage.toasts.invoiceDownloaded'));
      }, 1000);
    } catch (error) {
      logger.error('Billing', 'Error downloading PDF:', error instanceof Error ? error.message : String(error));
      toastError(t('billingPage.toasts.downloadError'));
    }
  };
  const handleViewInvoice = async (invoice: any) => {
    try {
      if (!invoice.invoiceUrl) {
        toastError(t('billingPage.toasts.invoiceNotAvailable'));
        return;
      }
      toastSuccess(t('billingPage.toasts.accessingInvoice', { invoiceId: invoice.stripeInvoiceId.slice(-8) }));
      // Ouvrir la facture Stripe dans un nouvel onglet
      window.open(invoice.invoiceUrl, '_blank');
      // Message de succès
      setTimeout(() => {
        toastSuccess(t('billingPage.toasts.invoiceOpening'));
      }, 500);
    } catch (error) {
      logger.error('Billing', 'Error viewing invoice:', error instanceof Error ? error.message : String(error));
      toastError(t('billingPage.toasts.viewError'));
    }
  };
  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };
  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return t('billingPage.invoices.status.paid');
      case 'open':
        return t('billingPage.invoices.status.open');
      case 'void':
        return t('billingPage.invoices.status.void');
      case 'uncollectible':
        return t('billingPage.invoices.status.uncollectible');
      default:
        return t('billingPage.invoices.status.unknown');
    }
  };
  if (isLoading) {
    return (
      <div className="space-y-8 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <CreditCard className="w-8 h-8 text-blue-500" />
            <span>{t('billingPage.title')}</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {t('billingPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refreshSubscription()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('billingPage.refresh')}
          </Button>
        </div>
      </div>
      {/* Trial Status Section */}
      <div className="space-y-6">
        <TrialStatusCard />
        <TrialActionsCard />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* Cleaner, responsive tab bar */}
        <div className="sticky top-0 z-20 bg-transparent">
          <TabsList className="w-full overflow-x-auto flex gap-2 md:grid md:grid-cols-4 bg-transparent p-0 border-b border-gray-200 dark:border-gray-800 rounded-none">
            <TabsTrigger value="overview" className="text-sm md:text-base px-3 md:px-4 py-2 whitespace-nowrap">
              {t('billingPage.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="plans" className="text-sm md:text-base px-3 md:px-4 py-2 whitespace-nowrap">
              {t('billingPage.tabs.plans')}
            </TabsTrigger>
            <TabsTrigger value="payment" className="text-sm md:text-base px-3 md:px-4 py-2 whitespace-nowrap">
              {t('billingPage.tabs.payment')}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-sm md:text-base px-3 md:px-4 py-2 whitespace-nowrap">
              {t('billingPage.tabs.invoices')}
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <SubscriptionStatus />
          {/* Quick actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('plans')}>
              <CardContent className="p-6 text-center">
                <ArrowUpCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t('billingPage.quickActions.changePlan.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('billingPage.quickActions.changePlan.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('payment')}>
              <CardContent className="p-6 text-center">
                <CreditCard className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t('billingPage.quickActions.paymentMethods.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('billingPage.quickActions.paymentMethods.description')}
                </p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('invoices')}>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {t('billingPage.quickActions.invoiceHistory.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('billingPage.quickActions.invoiceHistory.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-gray-900">
            <CardHeader>
              <CardTitle className="text-2xl text-blue-900 dark:text-blue-100">
                {t('billingPage.plans.title')}
              </CardTitle>
              <CardDescription>
                {t('billingPage.plans.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription && (
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('billingPage.plans.currentPlan')}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan?.name || subscription.planId}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {t('billingPage.plans.status')}: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status === 'active' ? t('billingPage.plans.active') : subscription.status}
                        </Badge>
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleOpenBillingPortal}
                    >
                      {t('billingPage.plans.manageInStripe')}
                    </Button>
                  </div>
                </div>
              )}
              <div className="pt-4">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {t('billingPage.plans.seeAllPlansDescription')}
                </p>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full"
                  size="lg"
                >
                  <ArrowUpCircle className="w-5 h-5 mr-2" />
                  {t('billingPage.plans.seeAllPlans')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('billingPage.payment.title')}
            </h2>
            {paymentMethods.length > 0 ? (
              <div className="space-y-4">
                {paymentMethods.map(method => (
                  <Card key={method.id} className={method.isDefault ? 'ring-2 ring-blue-500' : ''}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-8 bg-gray-800 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {method.brand?.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              •••• •••• •••• {method.last4}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                              {t('billingPage.payment.expires')} {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                          {method.isDefault && (
                            <Badge variant="secondary">{t('billingPage.payment.default')}</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {!method.isDefault && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManagePaymentMethod(method.id)}
                            >
                              {t('billingPage.payment.setDefault')}
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManagePaymentMethod(method.id)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            {t('billingPage.payment.manage')}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Bouton pour ajouter une nouvelle carte */}
                <Card className="border-dashed border-2">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">
                      {t('billingPage.payment.addNew')}
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddPaymentMethod()}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {t('billingPage.payment.addCard')}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('billingPage.payment.noMethods.title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {t('billingPage.payment.noMethods.description')}
                  </p>
                  <Button onClick={() => handleAddPaymentMethod()}>
                    {t('billingPage.payment.addCard')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('billingPage.invoices.title')}
            </h2>
            <Button
              variant="outline"
              onClick={() => toastWarning('Filtrage des factures : bientôt disponible')}
            >
              <Filter className="w-4 h-4 mr-2" />
              {t('billingPage.invoices.filter')}
            </Button>
          </div>
          {invoices.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('billingPage.invoices.table.invoice')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('billingPage.invoices.table.status')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('billingPage.invoices.table.amount')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('billingPage.invoices.table.date')}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          {t('billingPage.invoices.table.actions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="">
                      {invoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-900/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{invoice.stripeInvoiceId.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-300">
                              {invoice.createdAt.toLocaleDateString('fr-FR')}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getInvoiceStatusIcon(invoice.status)}
                              <span className="text-sm text-gray-900 dark:text-white">
                                {getInvoiceStatusLabel(invoice.status)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {formatPrice(invoice.amount, invoice.currency)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                            {invoice.dueDate.toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center space-x-2">
                              {invoice.pdfUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadPDF(invoice)}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  {t('billingPage.invoices.pdf')}
                                </Button>
                              )}
                              {invoice.invoiceUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewInvoice(invoice)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  {t('billingPage.invoices.view')}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('billingPage.invoices.noInvoices.title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('billingPage.invoices.noInvoices.description')}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
export default BillingPage;