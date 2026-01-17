/**
 * CassKai - Page de gestion des devises
 * Page complète pour gérer les devises, conversions, taux de change et gains/pertes
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CurrencyConverter } from '@/components/currency/CurrencyConverter';
import { ConversionHistoryComponent } from '@/components/currency/ConversionHistory';
import { exchangeRateService, type CurrencyGainLoss } from '@/services/exchangeRateService';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  Calendar,
  RefreshCw,
  Settings,
  Globe,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function CurrencyManagementPage() {
  const { currentEnterprise } = useEnterprise();
  const { currencyCode, currencyInfo, symbol } = useCompanyCurrency();
  const { toast } = useToast();

  const [gainLoss, setGainLoss] = useState<CurrencyGainLoss[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('converter');

  useEffect(() => {
    if (currentEnterprise?.id) {
      loadGainLoss();
    }
  }, [currentEnterprise?.id]);

  const loadGainLoss = async () => {
    if (!currentEnterprise?.id) return;

    setLoading(true);
    try {
      const data = await exchangeRateService.getCurrencyGainLoss(currentEnterprise.id);
      setGainLoss(data);
    } catch (error) {
      console.error('Erreur chargement gains/pertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGainLoss = async () => {
    if (!currentEnterprise?.id) return;

    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const result = await exchangeRateService.calculateCurrencyGainLoss(currentEnterprise.id, currentYear);

      toast({
        title: 'Calcul effectué',
        description: `Gains réalisés: ${result.realized.toFixed(2)} ${symbol}`,
      });

      await loadGainLoss();
    } catch (_error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de calculer les gains/pertes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const currentYearGainLoss = gainLoss.find((gl) => gl.fiscal_year === new Date().getFullYear());

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Globe className="w-8 h-8 text-blue-600" />
            Gestion des Devises
          </h1>
          <p className="text-gray-500 mt-1">
            Conversions, taux de change et gains/pertes de change
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-4 py-2">
            <DollarSign className="w-4 h-4 mr-2" />
            Devise principale: {currencyCode} ({symbol})
          </Badge>
        </div>
      </motion.div>

      {/* KPIs Gains/Pertes */}
      {currentYearGainLoss && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                Gains Réalisés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyAmount
                  amount={currentYearGainLoss.realized_gain}
                  size="xl"
                  colored
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gains de change effectivement réalisés cette année
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                Gains Latents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyAmount
                  amount={currentYearGainLoss.unrealized_gain}
                  size="xl"
                  colored
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Gains non réalisés sur positions ouvertes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyAmount
                  amount={currentYearGainLoss.realized_gain + currentYearGainLoss.unrealized_gain}
                  size="xl"
                  colored
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-500">Exercice {currentYearGainLoss.fiscal_year}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={calculateGainLoss}
                  disabled={loading}
                  className="h-7 px-2"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Onglets principaux */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="converter" className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4" />
              Convertisseur
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Historique
            </TabsTrigger>
            <TabsTrigger value="rates" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Taux de Change
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </TabsTrigger>
          </TabsList>

          {/* Onglet Convertisseur */}
          <TabsContent value="converter" className="space-y-6">
            <CurrencyConverter
              defaultFromCurrency={currencyCode}
              onConvert={async (fromAmount, toAmount, fromCurrency, toCurrency, rate) => {
                if (currentEnterprise?.id) {
                  await exchangeRateService.recordConversion(
                    currentEnterprise.id,
                    fromCurrency,
                    toCurrency,
                    fromAmount,
                    toAmount,
                    rate
                  );
                }
              }}
            />
          </TabsContent>

          {/* Onglet Historique */}
          <TabsContent value="history">
            <ConversionHistoryComponent />
          </TabsContent>

          {/* Onglet Taux de Change */}
          <TabsContent value="rates">
            <Card>
              <CardHeader>
                <CardTitle>Taux de Change Actuels</CardTitle>
                <CardDescription>
                  Taux de change en temps réel par rapport à {currencyCode}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['EUR', 'USD', 'XOF', 'XAF', 'MAD', 'DZD', 'TND', 'NGN', 'KES'].map((currency) => (
                    currency !== currencyCode && (
                      <Card key={currency} className="bg-gray-50 dark:bg-gray-900">
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-lg font-bold">{currency}</p>
                              <p className="text-xs text-gray-500">vers {currencyCode}</p>
                            </div>
                            <Badge variant="secondary" className="text-lg">
                              1.0000
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Paramètres */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de Devises</CardTitle>
                <CardDescription>
                  Configurez les devises et les préférences de conversion
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3">Devise Principale</h3>
                  <Badge variant="outline" className="px-4 py-2">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {currencyInfo.name} ({currencyCode})
                  </Badge>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Devises Secondaires</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Ajoutez des devises secondaires pour les transactions multi-devises
                  </p>
                  <Button type="button" variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Configurer les devises
                  </Button>
                </div>

                <div>
                  <h3 className="font-medium mb-3">Mise à Jour Automatique des Taux</h3>
                  <p className="text-sm text-gray-500 mb-3">
                    Synchroniser automatiquement les taux de change avec les sources officielles
                  </p>
                  <Button type="button" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Activer la synchronisation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* Historique des Gains/Pertes par Année */}
      {gainLoss.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Historique des Gains/Pertes de Change</CardTitle>
              <CardDescription>Évolution des gains et pertes de change par exercice fiscal</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gainLoss.map((gl) => (
                  <div
                    key={gl.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{gl.fiscal_year}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Réalisés</p>
                        <CurrencyAmount amount={gl.realized_gain} colored size="sm" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Latents</p>
                        <CurrencyAmount amount={gl.unrealized_gain} colored size="sm" />
                      </div>
                      <div className="text-right min-w-[120px]">
                        <p className="text-xs text-gray-500">Total</p>
                        <CurrencyAmount
                          amount={gl.realized_gain + gl.unrealized_gain}
                          colored
                          size="lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
