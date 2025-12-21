/**
 * CassKai - Simulateur IS/IR
 * Page de simulation fiscale pour comparer IS et IR
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  Info,
  Download,
  BarChart3,
  PieChart,
  Users,
  Building,
  FileText,
  Lightbulb,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { taxSimulationService, TaxSimulationInput, TaxSimulationResult } from '@/services/fiscal/TaxSimulationService';
import { getAvailableCountries } from '@/data/taxConfigurations';
import { useAuth } from '@/contexts/AuthContext';

const TaxSimulator: React.FC = () => {
  const { currentCompany: company } = useAuth();
  const availableCountries = getAvailableCountries();

  // État du formulaire
  const [formData, setFormData] = useState<TaxSimulationInput>({
    countryCode: company?.country || 'FR',
    revenue: 0,
    expenses: 0,
    companyType: 'SASU',
    hasEmployees: false,
    numberOfEmployees: 0,
    totalSalaries: 0
  });

  // Résultats de simulation
  const [result, setResult] = useState<TaxSimulationResult | null>(null);
  const [showComparison, setShowComparison] = useState(false);

  // Gestion du formulaire
  const handleInputChange = (field: keyof TaxSimulationInput, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Lancer la simulation
  const runSimulation = () => {
    if (formData.revenue <= 0) {
      console.warn('Veuillez saisir un chiffre d\'affaires');
      return;
    }

    const simulationResult = showComparison
      ? taxSimulationService.compareISvsIR(formData)
      : taxSimulationService.simulateCorporateTax(formData);

    setResult(simulationResult);
  };

  // Formater devise
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formater pourcentage
  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  // Export PDF (placeholder)
  const exportToPDF = () => {
    console.log('Export PDF - Fonctionnalité à venir');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            <span>Simulateur Fiscal IS / IR</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comparez l'impôt sur les sociétés (IS) et l'impôt sur le revenu (IR) pour optimiser votre fiscalité
          </p>
        </div>

        <Button variant="outline" onClick={exportToPDF} className="flex items-center space-x-2">
          <Download className="w-4 h-4" />
          <span>Exporter PDF</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULAIRE */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Paramètres</span>
            </CardTitle>
            <CardDescription>
              Saisissez les données de votre entreprise
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pays */}
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select
                value={formData.countryCode}
                onValueChange={(value) => handleInputChange('countryCode', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un pays" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type de société */}
            <div className="space-y-2">
              <Label htmlFor="companyType">Forme juridique</Label>
              <Select
                value={formData.companyType}
                onValueChange={(value: any) => handleInputChange('companyType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EURL">EURL</SelectItem>
                  <SelectItem value="SASU">SASU</SelectItem>
                  <SelectItem value="SARL">SARL</SelectItem>
                  <SelectItem value="SAS">SAS</SelectItem>
                  <SelectItem value="SA">SA</SelectItem>
                  <SelectItem value="SNC">SNC</SelectItem>
                  <SelectItem value="MICRO">Micro-entreprise</SelectItem>
                  <SelectItem value="EI">Entreprise individuelle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Chiffre d'affaires */}
            <div className="space-y-2">
              <Label htmlFor="revenue">Chiffre d'affaires annuel (€)</Label>
              <Input
                id="revenue"
                type="number"
                min="0"
                step="1000"
                value={formData.revenue || ''}
                onChange={(e) => handleInputChange('revenue', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 250000"
              />
            </div>

            {/* Charges */}
            <div className="space-y-2">
              <Label htmlFor="expenses">Charges déductibles (€)</Label>
              <Input
                id="expenses"
                type="number"
                min="0"
                step="1000"
                value={formData.expenses || ''}
                onChange={(e) => handleInputChange('expenses', parseFloat(e.target.value) || 0)}
                placeholder="Ex: 150000"
              />
              <p className="text-xs text-gray-500">
                Bénéfice estimé : {formatCurrency(formData.revenue - formData.expenses)}
              </p>
            </div>

            {/* Salariés */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="hasEmployees">Salariés</Label>
                <input
                  id="hasEmployees"
                  type="checkbox"
                  checked={formData.hasEmployees}
                  onChange={(e) => handleInputChange('hasEmployees', e.target.checked)}
                  className="w-4 h-4"
                  aria-label="L'entreprise a des salariés"
                />
              </div>

              {formData.hasEmployees && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <Input
                      type="number"
                      min="0"
                      placeholder="Nombre de salariés"
                      value={formData.numberOfEmployees || ''}
                      onChange={(e) => handleInputChange('numberOfEmployees', parseInt(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="Masse salariale annuelle (€)"
                      value={formData.totalSalaries || ''}
                      onChange={(e) => handleInputChange('totalSalaries', parseFloat(e.target.value) || 0)}
                    />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Mode de simulation */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Mode de simulation</Label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showComparison"
                  checked={showComparison}
                  onChange={(e) => setShowComparison(e.target.checked)}
                  className="w-4 h-4"
                  aria-label="Activer la comparaison IS vs IR"
                />
                <Label htmlFor="showComparison" className="font-normal cursor-pointer">
                  Comparer IS vs IR
                </Label>
              </div>
            </div>

            {/* Bouton simulation */}
            <Button
              className="w-full"
              size="lg"
              onClick={runSimulation}
              disabled={formData.revenue <= 0}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Calculer
            </Button>
          </CardContent>
        </Card>

        {/* RÉSULTATS */}
        <div className="lg:col-span-2 space-y-6">
          {!result ? (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center space-y-4 py-12">
                <Calculator className="w-16 h-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">
                    Aucune simulation
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Remplissez le formulaire et cliquez sur "Calculer" pour voir les résultats
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Résumé principal */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Résumé Fiscal</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Métriques clés */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Bénéfice fiscal</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          {formatCurrency(result.fiscalProfit)}
                        </p>
                      </div>

                      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Impôt sur les sociétés</p>
                        <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                          {formatCurrency(result.corporateTaxAmount)}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                          Taux effectif : {formatPercent(result.corporateTaxRate)}
                        </p>
                      </div>

                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Charges sociales</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {formatCurrency(result.socialContributions)}
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                          {formatPercent(result.socialContributionsRate)}
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">Net après impôts</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                          {formatCurrency(result.netAfterTax)}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          Taux global : {formatPercent(result.effectiveTaxRate)}
                        </p>
                      </div>
                    </div>

                    {/* Détail de l'IS */}
                    {result.corporateTaxBreakdown && result.corporateTaxBreakdown.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                          Détail du calcul de l'IS
                        </h4>
                        <div className="space-y-2">
                          {result.corporateTaxBreakdown.map((bracket, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {bracket.range}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Taux : {bracket.rate}%
                                </p>
                              </div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatCurrency(bracket.amount)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Comparaison IS vs IR */}
                {result.comparison && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <PieChart className="w-5 h-5" />
                        <span>Comparaison IS vs IR</span>
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Recommandation */}
                      <div className={cn(
                        "p-4 rounded-lg",
                        result.comparison.recommendation === 'IS'
                          ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                      )}>
                        <div className="flex items-start space-x-3">
                          <CheckCircle className={cn(
                            "w-6 h-6 flex-shrink-0 mt-1",
                            result.comparison.recommendation === 'IS' ? 'text-green-600' : 'text-blue-600'
                          )} />
                          <div>
                            <h4 className={cn(
                              "font-bold text-lg",
                              result.comparison.recommendation === 'IS' ? 'text-green-700 dark:text-green-300' : 'text-blue-700 dark:text-blue-300'
                            )}>
                              {result.comparison.recommendation === 'IS'
                                ? 'L\'Impôt sur les Sociétés (IS) est recommandé'
                                : 'L\'Impôt sur le Revenu (IR) est recommandé'}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              Économie estimée : {formatCurrency(
                                result.comparison.recommendation === 'IS'
                                  ? result.comparison.isSaving
                                  : result.comparison.irSaving
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Détails comparaison */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* IS */}
                        <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>Impôt sur les Sociétés</span>
                            </h5>
                            {result.comparison.recommendation === 'IS' && (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                Recommandé
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">IS</span>
                              <span className="font-medium">{formatCurrency(result.corporateTaxAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Charges sociales</span>
                              <span className="font-medium">{formatCurrency(result.socialContributions)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
                              <span className="text-gray-900 dark:text-white">Total</span>
                              <span className="text-gray-900 dark:text-white">
                                {formatCurrency(result.corporateTaxAmount + result.socialContributions)}
                              </span>
                            </div>
                          </div>

                          {/* Avantages IS */}
                          <div className="space-y-1 pt-2 border-t">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Avantages :</p>
                            <ul className="space-y-1">
                              {result.comparison.reasonsIS.map((reason, index) => (
                                <li key={index} className="flex items-start space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                  <TrendingUp className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* IR */}
                        <div className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                              <Users className="w-4 h-4" />
                              <span>Impôt sur le Revenu</span>
                            </h5>
                            {result.comparison.recommendation === 'IR' && (
                              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                Recommandé
                              </Badge>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">IR</span>
                              <span className="font-medium">{formatCurrency(result.irTaxAmount || 0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Prélèvements sociaux</span>
                              <span className="font-medium">{formatCurrency(result.fiscalProfit * 0.172)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm font-bold border-t pt-2">
                              <span className="text-gray-900 dark:text-white">Total</span>
                              <span className="text-gray-900 dark:text-white">
                                {formatCurrency((result.irTaxAmount || 0) + (result.fiscalProfit * 0.172))}
                              </span>
                            </div>
                          </div>

                          {/* Avantages IR */}
                          <div className="space-y-1 pt-2 border-t">
                            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Avantages :</p>
                            <ul className="space-y-1">
                              {result.comparison.reasonsIR.map((reason, index) => (
                                <li key={index} className="flex items-start space-x-2 text-xs text-gray-600 dark:text-gray-400">
                                  <TrendingDown className="w-3 h-3 text-blue-500 flex-shrink-0 mt-0.5" />
                                  <span>{reason}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Optimisations suggérées */}
                {result.optimizations && result.optimizations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="w-5 h-5 text-yellow-500" />
                        <span>Optimisations suggérées</span>
                        <Badge variant="secondary">{result.optimizations.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Opportunités d'économies fiscales identifiées par l'IA
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {result.optimizations.map((optimization, index) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 space-y-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                <span>{optimization.title}</span>
                                <Badge className={cn(
                                  "text-xs",
                                  optimization.category === 'deduction' && "bg-blue-100 text-blue-800 border-blue-200",
                                  optimization.category === 'timing' && "bg-orange-100 text-orange-800 border-orange-200",
                                  optimization.category === 'structure' && "bg-purple-100 text-purple-800 border-purple-200"
                                )}>
                                  {optimization.category === 'deduction' ? 'Déduction' :
                                   optimization.category === 'timing' ? 'Timing' :
                                   'Structure'}
                                </Badge>
                              </h5>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {optimization.description}
                              </p>
                            </div>

                            <div className="text-right ml-4">
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(optimization.potentialSaving)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">économie</p>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-3 flex items-start space-x-2">
                        <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Ces optimisations sont des suggestions basées sur votre situation. Consultez toujours un expert-comptable avant de les mettre en œuvre.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaxSimulator;
