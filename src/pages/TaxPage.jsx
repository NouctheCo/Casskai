// pages/TaxPage.tsx - Version mise à jour avec support multi-entreprises

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Landmark, Percent, FileSignature, Globe, Calendar, Calculator, Plus, Edit, Trash2, AlertCircle, CheckCircle, Clock, Building, Euro, Settings } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEnterprise } from '@/contexts/EnterpriseContext';
import { motion } from 'framer-motion';
import { format, addMonths, addQuarters, addYears, isBefore, startOfMonth, endOfMonth } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import EnterpriseSelector from '@/components/enterprise/EnterpriseSelector';

export default function TaxPage() {
  const { t, currentLocale, formatCurrency } = useLocale();
  const { currentEnterprise, currentEnterpriseId, getEnterpriseTaxConfig } = useEnterprise();
  const { toast } = useToast();

  // États
  const [taxRates, setTaxRates] = useState([]);
  const [taxRegimes, setTaxRegimes] = useState([]);
  const [taxDeclarations, setTaxDeclarations] = useState([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegimeDialogOpen, setIsRegimeDialogOpen] = useState(false);
  const [isDeclarationDialogOpen, setIsDeclarationDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [loading, setLoading] = useState(false);

  // Calculateur de taxes
  const [calculatorAmount, setCalculatorAmount] = useState('');
  const [calculatorRate, setCalculatorRate] = useState('');
  const [calculatorResult, setCalculatorResult] = useState(null);

  // Charger les données de l'entreprise courante
  useEffect(() => {
    if (currentEnterpriseId && currentEnterprise) {
      const taxConfig = getEnterpriseTaxConfig(currentEnterpriseId);
      
      if (taxConfig) {
        // Utiliser les données sauvegardées
        setTaxRates(taxConfig.taxRates);
        setTaxDeclarations(taxConfig.declarations);
      } else {
        // Générer les données par défaut basées sur le pays de l'entreprise
        setTaxRates(getDefaultTaxRates(currentEnterprise.countryCode, currentEnterpriseId));
        setTaxDeclarations(generateTaxDeclarations(currentEnterprise));
      }
      
      setTaxRegimes(getDefaultRegimes(currentEnterprise.countryCode));
    }
  }, [currentEnterpriseId, currentEnterprise, getEnterpriseTaxConfig]);

  // Sauvegarder les modifications dans le contexte
  useEffect(() => {
    if (currentEnterpriseId && taxRates.length > 0) {
      // Ici vous pourriez appeler une fonction pour sauvegarder dans le contexte
      // Par exemple: updateEnterpriseTaxConfig(currentEnterpriseId, { taxRates, declarations: taxDeclarations })
    }
  }, [taxRates, taxDeclarations, currentEnterpriseId]);

  // Pays supportés
  const countries = useMemo(() => [
    { code: 'FR', name: t('taxes.france', { defaultValue: 'France' }), flag: '🇫🇷' },
    { code: 'BE', name: t('taxes.belgium', { defaultValue: 'Belgique' }), flag: '🇧🇪' },
    { code: 'CH', name: t('taxes.switzerland', { defaultValue: 'Suisse' }), flag: '🇨🇭' },
    { code: 'LU', name: t('taxes.luxembourg', { defaultValue: 'Luxembourg' }), flag: '🇱🇺' },
  ], [t]);

  // Données initiales par pays (adapté pour multi-entreprises)
  const getDefaultTaxRates = useCallback((countryCode, enterpriseId) => {
    const rates = {
      FR: [
        { id: `${enterpriseId}-1`, enterpriseId, name: 'TVA Standard', rate: 20.0, type: 'TVA', description: 'Taux normal de TVA' },
        { id: `${enterpriseId}-2`, enterpriseId, name: 'TVA Réduite', rate: 10.0, type: 'TVA', description: 'Restauration, transport' },
        { id: `${enterpriseId}-3`, enterpriseId, name: 'TVA Super-réduite', rate: 5.5, type: 'TVA', description: 'Produits de première nécessité' },
        { id: `${enterpriseId}-4`, enterpriseId, name: 'TVA Particulière', rate: 2.1, type: 'TVA', description: 'Médicaments, presse' },
        { id: `${enterpriseId}-5`, enterpriseId, name: 'Impôt sur les sociétés', rate: 25.0, type: 'IS', description: 'Taux normal IS' },
        { id: `${enterpriseId}-6`, enterpriseId, name: 'IS Réduit PME', rate: 15.0, type: 'IS', description: 'PME jusqu\'à 38 120€' },
      ],
      BE: [
        { id: `${enterpriseId}-1`, enterpriseId, name: 'TVA Standard', rate: 21.0, type: 'TVA', description: 'Taux normal de TVA' },
        { id: `${enterpriseId}-2`, enterpriseId, name: 'TVA Réduite', rate: 12.0, type: 'TVA', description: 'Margarine, combustibles' },
        { id: `${enterpriseId}-3`, enterpriseId, name: 'TVA Super-réduite', rate: 6.0, type: 'TVA', description: 'Alimentation, médicaments' },
        { id: `${enterpriseId}-4`, enterpriseId, name: 'Impôt des sociétés', rate: 25.0, type: 'IS', description: 'Taux normal IS' },
      ],
      CH: [
        { id: `${enterpriseId}-1`, enterpriseId, name: 'TVA Standard', rate: 7.7, type: 'TVA', description: 'Taux normal de TVA' },
        { id: `${enterpriseId}-2`, enterpriseId, name: 'TVA Réduite', rate: 3.7, type: 'TVA', description: 'Hébergement' },
        { id: `${enterpriseId}-3`, enterpriseId, name: 'TVA Spéciale', rate: 2.5, type: 'TVA', description: 'Alimentation, médicaments' },
      ],
      LU: [
        { id: `${enterpriseId}-1`, enterpriseId, name: 'TVA Standard', rate: 17.0, type: 'TVA', description: 'Taux normal de TVA' },
        { id: `${enterpriseId}-2`, enterpriseId, name: 'TVA Intermédiaire', rate: 14.0, type: 'TVA', description: 'Vins, combustibles' },
        { id: `${enterpriseId}-3`, enterpriseId, name: 'TVA Réduite', rate: 8.0, type: 'TVA', description: 'Alimentation, médicaments' },
        { id: `${enterpriseId}-4`, enterpriseId, name: 'TVA Super-réduite', rate: 3.0, type: 'TVA', description: 'Livres, médicaments' },
      ]
    };
    return rates[countryCode] || rates.FR;
  }, []);

  const getDefaultRegimes = useCallback((countryCode) => {
    const regimes = {
      FR: [
        { 
          id: 1, 
          name: 'Réel Normal', 
          description: 'Régime de droit commun',
          conditions: 'CA > 247 000€ (services) ou > 783 000€ (ventes)',
          obligations: ['Bilan annuel', 'Liasse fiscale', 'TVA mensuelle/trimestrielle']
        },
        { 
          id: 2, 
          name: 'Réel Simplifié', 
          description: 'Régime simplifié pour PME',
          conditions: 'CA entre 36 800€ et 247 000€ (services) ou 783 000€ (ventes)',
          obligations: ['Bilan simplifié', 'TVA trimestrielle', 'Déclaration annuelle']
        },
        { 
          id: 3, 
          name: 'Micro-entreprise', 
          description: 'Régime ultra-simplifié',
          conditions: 'CA < 36 800€ (services) ou < 176 200€ (ventes)',
          obligations: ['Déclaration mensuelle/trimestrielle', 'Pas de TVA']
        },
      ],
      BE: [
        { 
          id: 1, 
          name: 'Régime Normal', 
          description: 'Régime standard des sociétés',
          conditions: 'Toutes les sociétés',
          obligations: ['Bilan annuel', 'Déclaration TVA', 'Comptes annuels']
        },
        { 
          id: 2, 
          name: 'Petites Entreprises', 
          description: 'Régime simplifié',
          conditions: 'Critères de taille respectés',
          obligations: ['Bilan simplifié', 'TVA trimestrielle']
        },
      ],
      CH: [
        { 
          id: 1, 
          name: 'Assujetti TVA', 
          description: 'Régime standard TVA',
          conditions: 'CA > 100 000 CHF',
          obligations: ['Déclaration TVA trimestrielle', 'Décompte annuel']
        },
        { 
          id: 2, 
          name: 'Non assujetti', 
          description: 'Exonéré de TVA',
          conditions: 'CA < 100 000 CHF',
          obligations: ['Pas de TVA']
        },
      ],
      LU: [
        { 
          id: 1, 
          name: 'Régime Normal', 
          description: 'Régime standard',
          conditions: 'CA > 35 000€',
          obligations: ['Déclaration TVA', 'Bilan annuel']
        },
        { 
          id: 2, 
          name: 'Franchise TVA', 
          description: 'Exonération pour petites entreprises',
          conditions: 'CA < 35 000€',
          obligations: ['Pas de TVA']
        },
      ]
    };
    return regimes[countryCode] || regimes.FR;
  }, []);

  // Génération des échéances fiscales basée sur l'entreprise
  const generateTaxDeclarations = useCallback((enterprise) => {
    const now = new Date();
    const declarations = [];

    if (enterprise.countryCode === 'FR') {
      // TVA selon la périodicité de l'entreprise
      if (enterprise.taxRegime.vatPeriod === 'monthly') {
        // TVA mensuelle
        for (let i = 0; i < 12; i++) {
          const dueDate = addMonths(now, i);
          declarations.push({
            id: `${enterprise.id}-tva-m${i + 1}`,
            enterpriseId: enterprise.id,
            type: 'TVA',
            name: `TVA ${format(dueDate, 'MMMM yyyy', { locale: fr })}`,
            dueDate,
            status: isBefore(dueDate, now) ? 'overdue' : 'pending',
            amount: Math.floor(Math.random() * 5000) + 1000,
            description: `Déclaration TVA mensuelle`
          });
        }
      } else if (enterprise.taxRegime.vatPeriod === 'quarterly') {
        // TVA trimestrielle
        for (let i = 0; i < 4; i++) {
          const dueDate = addMonths(now, i * 3);
          declarations.push({
            id: `${enterprise.id}-tva-q${i + 1}`,
            enterpriseId: enterprise.id,
            type: 'TVA',
            name: `TVA T${i + 1} ${format(dueDate, 'yyyy')}`,
            dueDate,
            status: isBefore(dueDate, now) ? 'overdue' : 'pending',
            amount: Math.floor(Math.random() * 5000) + 1000,
            description: `Déclaration TVA trimestrielle`
          });
        }
      }

      // Impôt sur les sociétés (si applicable)
      if (enterprise.taxRegime.type !== 'microEnterprise') {
        declarations.push({
          id: `${enterprise.id}-is-annual`,
          enterpriseId: enterprise.id,
          type: 'IS',
          name: `IS ${format(now, 'yyyy')}`,
          dueDate: new Date(now.getFullYear(), 4, 15), // 15 mai
          status: 'pending',
          amount: Math.floor(Math.random() * 15000) + 5000,
          description: 'Impôt sur les sociétés annuel'
        });

        // Liasse fiscale
        declarations.push({
          id: `${enterprise.id}-liasse-annual`,
          enterpriseId: enterprise.id,
          type: 'Liasse',
          name: `Liasse fiscale ${format(now, 'yyyy')}`,
          dueDate: new Date(now.getFullYear(), 4, 15), // 15 mai
          status: 'pending',
          amount: 0,
          description: 'Dépôt de la liasse fiscale'
        });
      }
    }

    return declarations.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, []);

  // Gestionnaires d'événements
  const handleAddTaxRate = useCallback(() => {
    setEditingItem({ 
      name: '', 
      rate: '', 
      type: 'TVA', 
      description: '', 
      enterpriseId: currentEnterpriseId 
    });
    setIsEditDialogOpen(true);
  }, [currentEnterpriseId]);

  const handleEditTaxRate = useCallback((rate) => {
    setEditingItem(rate);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteTaxRate = useCallback((rateId) => {
    setTaxRates(prev => prev.filter(rate => rate.id !== rateId));
    toast({
      title: t('taxes.success', { defaultValue: 'Succès' }),
      description: t('taxes.rateDeleted', { defaultValue: 'Taux supprimé avec succès' })
    });
  }, [toast, t]);

  const handleSaveTaxRate = useCallback(() => {
    if (!editingItem.name || !editingItem.rate) {
      toast({
        variant: 'destructive',
        title: t('taxes.error', { defaultValue: 'Erreur' }),
        description: t('taxes.fillAllFields', { defaultValue: 'Veuillez remplir tous les champs' })
      });
      return;
    }

    if (editingItem.id) {
      // Modification
      setTaxRates(prev => prev.map(rate => 
        rate.id === editingItem.id ? { ...editingItem, rate: parseFloat(editingItem.rate) } : rate
      ));
    } else {
      // Ajout
      setTaxRates(prev => [...prev, { 
        ...editingItem, 
        id: `${currentEnterpriseId}-${Date.now()}`, 
        rate: parseFloat(editingItem.rate),
        enterpriseId: currentEnterpriseId
      }]);
    }

    setIsEditDialogOpen(false);
    setEditingItem(null);
    toast({
      title: t('taxes.success', { defaultValue: 'Succès' }),
      description: t('taxes.rateSaved', { defaultValue: 'Taux enregistré avec succès' })
    });
  }, [editingItem, toast, t, currentEnterpriseId]);

  const calculateTax = useCallback(() => {
    const amount = parseFloat(calculatorAmount);
    const rate = parseFloat(calculatorRate);

    if (isNaN(amount) || isNaN(rate)) {
      toast({
        variant: 'destructive',
        title: t('taxes.error', { defaultValue: 'Erreur' }),
        description: t('taxes.invalidNumbers', { defaultValue: 'Veuillez saisir des nombres valides' })
      });
      return;
    }

    const taxAmount = (amount * rate) / 100;
    const totalAmount = amount + taxAmount;

    setCalculatorResult({
      baseAmount: amount,
      taxRate: rate,
      taxAmount,
      totalAmount
    });
  }, [calculatorAmount, calculatorRate, toast, t]);

  // Statut des déclarations
  const getStatusBadge = (status) => {
    const variants = {
      pending: 'default',
      overdue: 'destructive',
      completed: 'default',
      submitted: 'default'
    };

    const labels = {
      pending: t('taxes.pending', { defaultValue: 'En attente' }),
      overdue: t('taxes.overdue', { defaultValue: 'En retard' }),
      completed: t('taxes.completed', { defaultValue: 'Terminé' }),
      submitted: t('taxes.submitted', { defaultValue: 'Déposé' })
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  if (!currentEnterpriseId) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64"
      >
        <Building className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">
          {t('taxes.noCompanySelected', { defaultValue: 'Aucune entreprise sélectionnée' })}
        </h2>
        <p className="text-muted-foreground">
          {t('taxes.selectCompanyPrompt', { 
            defaultValue: 'Sélectionnez une entreprise pour gérer les taxes' 
          })}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('taxes.title', { defaultValue: 'Taxes' })}
          </h1>
          <p className="text-muted-foreground">
            {t('taxes.subtitle', { 
              defaultValue: 'Gérez vos déclarations et conformités fiscales' 
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <EnterpriseSelector />
          {currentEnterprise && (
            <Badge variant="outline" className="py-2 px-3">
              <Globe className="mr-2 h-4 w-4" />
              {countries.find(c => c.code === currentEnterprise.countryCode)?.flag} {currentEnterprise.countryCode}
            </Badge>
          )}
        </div>
      </div>

      {/* Information sur l'entreprise actuelle */}
      {currentEnterprise && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Building className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{currentEnterprise.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {currentEnterprise.registrationNumber} • {currentEnterprise.taxRegime.name} • {currentEnterprise.taxRegime.vatPeriod === 'monthly' ? 'TVA mensuelle' : currentEnterprise.taxRegime.vatPeriod === 'quarterly' ? 'TVA trimestrielle' : 'TVA annuelle'}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                {t('enterprise.configure', { defaultValue: 'Configurer' })}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Échéances fiscales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-orange-500" />
            {t('taxes.taxDeadlines', { defaultValue: 'Échéances Fiscales' })}
          </CardTitle>
          <CardDescription>
            {t('taxes.upcomingDeadlines', { 
              defaultValue: 'Prochaines échéances et déclarations à effectuer' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('taxes.type', { defaultValue: 'Type' })}</TableHead>
                  <TableHead>{t('taxes.declaration', { defaultValue: 'Déclaration' })}</TableHead>
                  <TableHead>{t('taxes.dueDate', { defaultValue: 'Échéance' })}</TableHead>
                  <TableHead>{t('taxes.status', { defaultValue: 'Statut' })}</TableHead>
                  <TableHead className="text-right">{t('taxes.amount', { defaultValue: 'Montant' })}</TableHead>
                  <TableHead className="text-center">{t('taxes.actions', { defaultValue: 'Actions' })}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxDeclarations.map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell>
                      <Badge variant="outline">{declaration.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{declaration.name}</TableCell>
                    <TableCell>
                      {format(declaration.dueDate, 'dd/MM/yyyy', { 
                        locale: currentLocale === 'fr' ? fr : enUS 
                      })}
                    </TableCell>
                    <TableCell>{getStatusBadge(declaration.status)}</TableCell>
                    <TableCell className="text-right">
                      {declaration.amount > 0 ? formatCurrency(declaration.amount) : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm">
                        <FileSignature className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Taux de taxes */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="text-indigo-500" />
                  {t('taxes.taxRates', { defaultValue: 'Taux de Taxes' })}
                </CardTitle>
                <CardDescription>
                  {t('taxes.manageRates', { defaultValue: 'Gérez vos taux de TVA et d\'impôts' })}
                </CardDescription>
              </div>
              <Button onClick={handleAddTaxRate} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('taxes.addRate', { defaultValue: 'Ajouter' })}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {taxRates.map((rate) => (
                <div key={rate.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rate.type === 'TVA' ? 'default' : 'secondary'}>
                        {rate.type}
                      </Badge>
                      <span className="font-medium">{rate.name}</span>
                      <span className="text-lg font-bold text-primary">{rate.rate}%</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{rate.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditTaxRate(rate)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteTaxRate(rate.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculateur de taxes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-green-500" />
              {t('taxes.taxCalculator', { defaultValue: 'Calculateur de Taxes' })}
            </CardTitle>
            <CardDescription>
              {t('taxes.calculateTaxes', { defaultValue: 'Calculez rapidement vos taxes' })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">
                  {t('taxes.baseAmount', { defaultValue: 'Montant HT' })}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="1000"
                  value={calculatorAmount}
                  onChange={(e) => setCalculatorAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="rate">
                  {t('taxes.taxRate', { defaultValue: 'Taux (%)' })}
                </Label>
                <Select value={calculatorRate} onValueChange={setCalculatorRate}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('taxes.selectRate', { defaultValue: 'Choisir un taux' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {taxRates.map((rate) => (
                      <SelectItem key={rate.id} value={rate.rate.toString()}>
                        {rate.name} - {rate.rate}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={calculateTax} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              {t('taxes.calculate', { defaultValue: 'Calculer' })}
            </Button>

            {calculatorResult && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>{t('taxes.baseAmount', { defaultValue: 'Montant HT' })}</span>
                  <span>{formatCurrency(calculatorResult.baseAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('taxes.taxAmount', { defaultValue: 'Taxe' })} ({calculatorResult.taxRate}%)</span>
                  <span>{formatCurrency(calculatorResult.taxAmount)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>{t('taxes.totalAmount', { defaultValue: 'Total TTC' })}</span>
                  <span>{formatCurrency(calculatorResult.totalAmount)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Régimes fiscaux */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Landmark className="text-teal-500" />
            {t('taxes.taxRegimes', { defaultValue: 'Régimes Fiscaux' })}
          </CardTitle>
          <CardDescription>
            {t('taxes.availableRegimes', { 
              defaultValue: 'Régimes fiscaux disponibles pour votre pays' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {taxRegimes.map((regime) => (
              <div key={regime.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">{regime.name}</h3>
                <p className="text-muted-foreground mb-3">{regime.description}</p>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-sm">
                      {t('taxes.conditions', { defaultValue: 'Conditions' })}
                    </h4>
                    <p className="text-sm text-muted-foreground">{regime.conditions}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm">
                      {t('taxes.obligations', { defaultValue: 'Obligations' })}
                    </h4>
                    <ul className="text-sm text-muted-foreground">
                      {regime.obligations.map((obligation, index) => (
                        <li key={index}>• {obligation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dialog pour éditer les taux */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem?.id ? 
                t('taxes.editRate', { defaultValue: 'Modifier le taux' }) : 
                t('taxes.addRate', { defaultValue: 'Ajouter un taux' })
              }
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rateName">
                {t('taxes.rateName', { defaultValue: 'Nom du taux' })}
              </Label>
              <Input
                id="rateName"
                value={editingItem?.name || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                placeholder="TVA Standard"
              />
            </div>
            <div>
              <Label htmlFor="rateValue">
                {t('taxes.rateValue', { defaultValue: 'Taux (%)' })}
              </Label>
              <Input
                id="rateValue"
                type="number"
                step="0.1"
                value={editingItem?.rate || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, rate: e.target.value }))}
                placeholder="20.0"
              />
            </div>
            <div>
              <Label htmlFor="rateType">
                {t('taxes.rateType', { defaultValue: 'Type' })}
              </Label>
              <Select 
                value={editingItem?.type || 'TVA'} 
                onValueChange={(value) => setEditingItem(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TVA">TVA</SelectItem>
                  <SelectItem value="IS">{t('taxes.corporateTax', { defaultValue: 'Impôt sur les sociétés' })}</SelectItem>
                  <SelectItem value="IR">{t('taxes.incomeTax', { defaultValue: 'Impôt sur le revenu' })}</SelectItem>
                  <SelectItem value="OTHER">{t('taxes.other', { defaultValue: 'Autre' })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="rateDescription">
                {t('taxes.description', { defaultValue: 'Description' })}
              </Label>
              <Input
                id="rateDescription"
                value={editingItem?.description || ''}
                onChange={(e) => setEditingItem(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description du taux"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t('taxes.cancel', { defaultValue: 'Annuler' })}
            </Button>
            <Button onClick={handleSaveTaxRate}>
              {t('taxes.save', { defaultValue: 'Enregistrer' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}