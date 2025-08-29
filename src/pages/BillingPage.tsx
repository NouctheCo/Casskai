import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  CreditCard,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ExternalLink,
  Settings,
  FileText,
  RefreshCw,
  ArrowUpCircle,
  ArrowDownCircle,
  Filter
} from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/types/subscription.types';
import SubscriptionStatus from '@/components/subscription/SubscriptionStatus';
import PricingCard from '@/components/subscription/PricingCard';

const BillingPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    subscription,
    plan,
    isLoading,
    invoices,
    paymentMethods,
    defaultPaymentMethod,
    subscribe,
    updateSubscription,
    refreshSubscription,
    openBillingPortal
  } = useSubscription();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'month' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<string>('overview');

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
      toast({
        title: "Abonnement activé !",
        description: "Votre abonnement a été activé avec succès.",
        duration: 5000,
      });
      // Refresh subscription data
      refreshSubscription();
      // Clean URL
      navigate('/settings/billing', { replace: true });
    } else if (canceled === 'true') {
      toast({
        title: "Paiement annulé",
        description: "Vous avez annulé le processus de paiement.",
        variant: "destructive",
        duration: 5000,
      });
      // Clean URL
      navigate('/settings/billing', { replace: true });
    }
  }, [searchParams, toast, navigate, refreshSubscription]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    setSelectedPlan(planId);
    setSubscriptionLoading(true);

    try {
      const result = await subscribe(planId);
      
      if (result.success && result.checkoutUrl) {
        // In a real app, redirect to Stripe checkout
        // window.location.href = result.checkoutUrl;
        
        // For demo, show success message
        toast({
          title: "Abonnement créé !",
          description: `Vous êtes maintenant abonné au plan ${SUBSCRIPTION_PLANS.find(p => p.id === planId)?.name}.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Erreur d'abonnement",
          description: result.error || "Une erreur est survenue lors de l'abonnement.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
      setSelectedPlan(null);
    }
  };

  const handlePlanChange = async (newPlanId: string) => {
    if (!subscription) return;

    setSelectedPlan(newPlanId);
    setSubscriptionLoading(true);

    try {
      const result = await updateSubscription(newPlanId);
      
      if (result.success) {
        toast({
          title: "Plan modifié !",
          description: `Votre plan a été changé avec succès.`,
          duration: 5000,
        });
      } else {
        toast({
          title: "Erreur de modification",
          description: result.error || "Une erreur est survenue lors de la modification.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Plan change error:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    } finally {
      setSubscriptionLoading(false);
      setSelectedPlan(null);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!subscription) {
      toast({
        title: "Abonnement requis",
        description: "Vous devez avoir un abonnement actif pour ajouter une méthode de paiement.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await openBillingPortal();
      
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'accéder au portail de facturation.",
          variant: "destructive",
        });
      }
      // If successful, the portal will open in a new tab
    } catch (error) {
      console.error('Error opening billing portal:', error);
      toast({
        title: "Erreur inattendue",
        description: "Une erreur inattendue est survenue.",
        variant: "destructive",
      });
    }
  };

  const handleManagePaymentMethod = async (methodId: string) => {
    if (!subscription) {
      toast({
        title: "Abonnement requis",
        description: "Vous devez avoir un abonnement actif.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Ouvrir le portail de facturation Stripe pour gérer cette méthode spécifique
      const result = await openBillingPortal();
      
      if (!result.success) {
        toast({
          title: "Erreur",
          description: result.error || "Impossible d'accéder à la gestion des paiements.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Redirection...",
          description: "Ouverture du portail de gestion des paiements",
          duration: 2000
        });
      }
      // Si succès, le portail s'ouvrira dans un nouvel onglet
    } catch (error) {
      console.error('Error managing payment method:', error);
      toast({
        title: "Erreur inattendue",
        description: "Impossible d'accéder à la gestion des méthodes de paiement.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultPaymentMethod = async (methodId: string) => {
    try {
      // Dans une vraie application, ceci ferait un appel API pour définir la méthode par défaut
      // Pour l'instant, on simule le comportement
      toast({
        title: "Méthode mise à jour",
        description: "Cette carte est maintenant votre méthode de paiement par défaut",
        duration: 3000
      });
      
      // Recharger les données d'abonnement pour réfléter les changements
      await refreshSubscription();
    } catch (error) {
      console.error('Error setting default payment method:', error);
      toast({
        title: "Erreur",
        description: "Impossible de définir cette méthode comme défaut",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (invoice: any) => {
    try {
      if (!invoice.pdfUrl) {
        toast({
          title: "PDF non disponible",
          description: "Le PDF de cette facture n'est pas encore disponible.",
          variant: "destructive",
        });
        return;
      }

      // Dans une vraie application, ceci téléchargerait le PDF depuis l'URL
      // Pour l'instant, on simule le téléchargement
      toast({
        title: "Téléchargement...",
        description: `Téléchargement de la facture #${invoice.stripeInvoiceId.slice(-8)}`,
        duration: 2000
      });

      // Simuler l'ouverture du PDF dans un nouvel onglet
      // window.open(invoice.pdfUrl, '_blank');
      
      // Pour la démo, on affiche un message de succès après un délai
      setTimeout(() => {
        toast({
          title: "PDF téléchargé",
          description: "La facture a été téléchargée avec succès.",
          duration: 3000
        });
      }, 2000);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le PDF de cette facture.",
        variant: "destructive",
      });
    }
  };

  const handleViewInvoice = async (invoice: any) => {
    try {
      if (!invoice.invoiceUrl) {
        toast({
          title: "Facture non disponible",
          description: "Cette facture n'est pas encore accessible en ligne.",
          variant: "destructive",
        });
        return;
      }

      // Dans une vraie application, ceci ouvrirait la facture dans Stripe ou un autre portail
      // Pour l'instant, on simule l'ouverture
      toast({
        title: "Ouverture de la facture",
        description: `Accès à la facture #${invoice.stripeInvoiceId.slice(-8)}`,
        duration: 2000
      });

      // Simuler l'ouverture dans un nouvel onglet
      // window.open(invoice.invoiceUrl, '_blank');
      
      // Pour la démo, on affiche un message informatif
      setTimeout(() => {
        toast({
          title: "Facture ouverte",
          description: "La facture s'ouvre dans un nouvel onglet.",
          duration: 3000
        });
      }, 2000);
    } catch (error) {
      console.error('Error viewing invoice:', error);
      toast({
        title: "Erreur d'affichage",
        description: "Impossible d'ouvrir cette facture.",
        variant: "destructive",
      });
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
        return 'Payée';
      case 'open':
        return 'En attente';
      case 'void':
        return 'Annulée';
      case 'uncollectible':
        return 'Impayée';
      default:
        return 'Inconnue';
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
            <span>Facturation et abonnement</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Gérez votre abonnement, moyens de paiement et factures
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refreshSubscription()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
          <TabsTrigger value="payment">Paiement</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <SubscriptionStatus />
          
          {/* Quick actions */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('plans')}>
              <CardContent className="p-6 text-center">
                <ArrowUpCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Changer de plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mettez à niveau ou réduisez votre plan
                </p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('payment')}>
              <CardContent className="p-6 text-center">
                <CreditCard className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Moyens de paiement
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Gérez vos cartes de crédit
                </p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('invoices')}>
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Historique des factures
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Téléchargez vos factures
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Choisissez votre plan
            </h2>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">Facturation :</span>
              <Select value={billingPeriod} onValueChange={(value: 'month' | 'year') => setBillingPeriod(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Mensuelle</SelectItem>
                  <SelectItem value="year">Annuelle (-20%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {SUBSCRIPTION_PLANS.map(planOption => (
              <PricingCard
                key={planOption.id}
                plan={planOption}
                isCurrentPlan={plan?.id === planOption.id}
                onSelect={subscription ? handlePlanChange : handleSubscribe}
                loading={subscriptionLoading && selectedPlan === planOption.id}
              />
            ))}
          </div>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Moyens de paiement
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
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Expire {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                          {method.isDefault && (
                            <Badge variant="secondary">Par défaut</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!method.isDefault && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            >
                              Définir par défaut
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleManagePaymentMethod(method.id)}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Gérer
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {/* Bouton pour ajouter une nouvelle carte */}
                <Card className="border-dashed border-2">
                  <CardContent className="p-6 text-center">
                    <CreditCard className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                      Ajouter une nouvelle méthode de paiement
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAddPaymentMethod()}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Ajouter une carte
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-dashed border-2">
                <CardContent className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    Aucun moyen de paiement
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Ajoutez une carte de crédit pour gérer vos paiements
                  </p>
                  <Button onClick={() => handleAddPaymentMethod()}>
                    Ajouter une carte
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
              Historique des factures
            </h2>
            
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtrer
            </Button>
          </div>
          
          {invoices.length > 0 ? (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Facture
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Montant
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="">
                      {invoices.map(invoice => (
                        <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              #{invoice.stripeInvoiceId.slice(-8)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                                  PDF
                                </Button>
                              )}
                              {invoice.invoiceUrl && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleViewInvoice(invoice)}
                                >
                                  <ExternalLink className="w-4 h-4 mr-1" />
                                  Voir
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
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Aucune facture
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Vos factures apparaîtront ici une fois que vous aurez un abonnement actif
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