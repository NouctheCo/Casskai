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

import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Lock,
  Unlock,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  RefreshCw,
  Calculator,
  BarChart3,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { periodClosureService, type ClosureValidation } from '@/services/accounting/periodClosureService';
import type { Database } from '@/types/supabase';
import { logger } from '@/lib/logger';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';

type AccountingPeriod = Database['public']['Tables']['accounting_periods']['Row'];

interface PeriodClosurePanelProps {
  companyId: string;
}

export function PeriodClosurePanel({ companyId }: PeriodClosurePanelProps) {
  const { formatAmount } = useCompanyCurrency();
  
  // États
  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [validation, setValidation] = useState<ClosureValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [generatingAN, setGeneratingAN] = useState(false);
  const [periodResult, setPeriodResult] = useState<{
    totalCharges: number;
    totalProduits: number;
    result: number;
    isProfit: boolean;
  } | null>(null);

  // Dialogues
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  // Formulaire création
  const [newPeriod, setNewPeriod] = useState({
    name: '',
    startDate: '',
    endDate: ''
  });

  // Chargement des périodes
  const loadPeriods = useCallback(async () => {
    try {
      setLoading(true);
      const data = await periodClosureService.getPeriods(companyId);
      setPeriods(data);
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error loading periods:', error);
      toast.error('Erreur lors du chargement des périodes');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  // Validation pré-clôture
  const handleValidate = async (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    setValidating(true);
    setValidation(null);

    try {
      const [validationResult, resultCalc] = await Promise.all([
        periodClosureService.validateClosureReadiness(companyId, period.id),
        periodClosureService.calculatePeriodResult(companyId, period.start_date, period.end_date)
      ]);

      setValidation(validationResult);
      setPeriodResult(resultCalc);
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error validating period:', error);
      toast.error('Erreur lors de la validation');
    } finally {
      setValidating(false);
    }
  };

  // Clôture de période
  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;
    
    setClosing(true);
    try {
      // Utilise la fonction RPC Supabase qui gère automatiquement:
      // - Écritures de clôture (classes 6/7)
      // - Affectation du résultat au compte 120
      // - Génération des à-nouveaux (si période suivante existe)
      const result = await periodClosureService.closePeriod(companyId, selectedPeriod.id);

      if (result.success) {
        toast.success(result.message);
        // Afficher le résultat si disponible
        if (result.resultAmount !== undefined) {
          const type = result.resultType === 'profit' ? 'Bénéfice' : 'Perte';
          toast.info(`${type}: ${result.resultAmount.toFixed(2)} €`);
        }
        await loadPeriods();
        setSelectedPeriod(null);
        setValidation(null);
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach(err => toast.error(err));
        }
      }
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error closing period:', error);
      toast.error('Erreur lors de la clôture');
    } finally {
      setClosing(false);
    }
  };

  // Génération des à-nouveaux
  const handleGenerateAN = async (closedPeriod: AccountingPeriod) => {
    setGeneratingAN(true);
    try {
      // Date de début de la nouvelle période = jour suivant la fin de la période clôturée
      const newStartDate = format(addDays(parseISO(closedPeriod.end_date), 1), 'yyyy-MM-dd');

      const result = await periodClosureService.generateOpeningEntries(
        companyId,
        closedPeriod.id,
        newStartDate
      );

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach(err => toast.error(err));
        }
      }
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error generating opening entries:', error);
      toast.error('Erreur lors de la génération des à-nouveaux');
    } finally {
      setGeneratingAN(false);
    }
  };

  // Création de période
  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    try {
      const result = await periodClosureService.createPeriod(
        companyId,
        newPeriod.name,
        newPeriod.startDate,
        newPeriod.endDate
      );

      if (result.success) {
        toast.success(result.message);
        setShowCreateDialog(false);
        setNewPeriod({ name: '', startDate: '', endDate: '' });
        await loadPeriods();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error creating period:', error);
      toast.error('Erreur lors de la création');
    }
  };

  // Réouverture de période
  const handleReopenPeriod = async () => {
    if (!selectedPeriod || !reopenReason.trim()) {
      toast.error('Veuillez indiquer la raison de la réouverture');
      return;
    }

    try {
      const result = await periodClosureService.reopenPeriod(
        companyId,
        selectedPeriod.id,
        reopenReason
      );

      if (result.success) {
        toast.success(result.message);
        setShowReopenDialog(false);
        setReopenReason('');
        setSelectedPeriod(null);
        await loadPeriods();
      } else {
        toast.error(result.message);
        if (result.errors) {
          result.errors.forEach(err => toast.error(err));
        }
      }
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error reopening period:', error);
      toast.error('Erreur lors de la réouverture');
    }
  };

  // Formatage de date
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'dd MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2">Chargement des périodes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Clôture comptable
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos périodes comptables et effectuez les clôtures d'exercice
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPeriods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle période
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une période comptable</DialogTitle>
                <DialogDescription>
                  Définissez une nouvelle période pour votre exercice comptable
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="period-name">Nom de la période</Label>
                  <Input
                    id="period-name"
                    placeholder="Ex: Exercice 2025"
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newPeriod.endDate}
                      onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreatePeriod}>
                  Créer la période
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Liste des périodes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Périodes comptables
          </CardTitle>
          <CardDescription>
            {periods.length} période(s) enregistrée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune période comptable définie</p>
              <p className="text-sm mt-1">Créez votre première période pour commencer</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Période</TableHead>
                  <TableHead>Date début</TableHead>
                  <TableHead>Date fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map((period) => (
                  <TableRow 
                    key={period.id}
                    className={selectedPeriod?.id === period.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    <TableCell className="font-medium">{period.name}</TableCell>
                    <TableCell>{formatDate(period.start_date)}</TableCell>
                    <TableCell>{formatDate(period.end_date)}</TableCell>
                    <TableCell>
                      {period.is_closed ? (
                        <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                          <Lock className="h-3 w-3 mr-1" />
                          Clôturée
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                          <Unlock className="h-3 w-3 mr-1" />
                          Ouverte
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {!period.is_closed ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleValidate(period)}
                                  disabled={validating}
                                >
                                  {validating && selectedPeriod?.id === period.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Valider pour clôture
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleGenerateAN(period)}
                                    disabled={generatingAN}
                                  >
                                    {generatingAN ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Générer les à-nouveaux
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPeriod(period);
                                      setShowReopenDialog(true);
                                    }}
                                  >
                                    <Unlock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Réouvrir la période
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Panneau de validation et clôture */}
      <AnimatePresence>
        {selectedPeriod && !selectedPeriod.is_closed && validation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Validation de clôture: {selectedPeriod.name}
                </CardTitle>
                <CardDescription>
                  Du {formatDate(selectedPeriod.start_date)} au {formatDate(selectedPeriod.end_date)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Résumé de la validation */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  {/* État de la validation */}
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      {validation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      État de la validation
                    </h4>

                    {/* Équilibre comptable */}
                    <div className={`p-3 rounded-lg ${validation.balanceSheet.isBalanced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Équilibre comptable</span>
                        {validation.balanceSheet.isBalanced ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>Total débit: {formatAmount(validation.balanceSheet.totalDebit)}</div>
                        <div>Total crédit: {formatAmount(validation.balanceSheet.totalCredit)}</div>
                      </div>
                    </div>

                    {/* Écritures non validées */}
                    <div className={`p-3 rounded-lg ${validation.unpostedEntries === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Écritures en brouillon</span>
                        <span className={`font-bold ${validation.unpostedEntries === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {validation.unpostedEntries}
                        </span>
                      </div>
                    </div>

                    {/* Écritures non lettrées */}
                    <div className={`p-3 rounded-lg ${validation.unletteredEntries === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Lignes tiers non lettrées</span>
                        <span className={`font-bold ${validation.unletteredEntries === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {validation.unletteredEntries}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Résultat de l'exercice */}
                  {periodResult && (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Résultat de l'exercice
                      </h4>

                      <div className={`p-4 rounded-lg ${periodResult.isProfit ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-2">
                            <span className={periodResult.isProfit ? 'text-green-600' : 'text-red-600'}>
                              {periodResult.isProfit ? '+' : '-'}{formatAmount(Math.abs(periodResult.result))}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {periodResult.isProfit ? 'Bénéfice' : 'Perte'}
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center">
                            <div className="text-red-600 font-medium">
                              {formatAmount(periodResult.totalCharges)}
                            </div>
                            <div className="text-xs text-gray-500">Charges (cl. 6)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-medium">
                              {formatAmount(periodResult.totalProduits)}
                            </div>
                            <div className="text-xs text-gray-500">Produits (cl. 7)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Erreurs */}
                {validation.errors.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h5 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4" />
                      Erreurs bloquantes
                    </h5>
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
                      {validation.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Avertissements */}
                {validation.warnings.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h5 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      Avertissements
                    </h5>
                    <ul className="list-disc list-inside text-sm text-amber-600 dark:text-amber-300 space-y-1">
                      {validation.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Info sur les écritures de clôture */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <h5 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    Actions de clôture
                  </h5>
                  <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>Solde des comptes de charges (classe 6) et de produits (classe 7)</li>
                    <li>Affectation du résultat au compte {periodResult?.isProfit ? '120 (Bénéfice)' : '129 (Perte)'}</li>
                    <li>Verrouillage de la période (aucune modification ultérieure)</li>
                    <li>Possibilité de générer les écritures à-nouveaux pour la période suivante</li>
                  </ul>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setSelectedPeriod(null);
                    setValidation(null);
                  }}>
                    Annuler
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        disabled={!validation.isValid || closing}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {closing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Lock className="h-4 w-4 mr-2" />
                        )}
                        Clôturer la période
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la clôture</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir clôturer la période <strong>{selectedPeriod.name}</strong> ?
                          <br /><br />
                          Cette action va :
                          <ul className="list-disc list-inside mt-2">
                            <li>Générer les écritures de clôture des comptes de résultat</li>
                            <li>Affecter le résultat ({periodResult?.isProfit ? 'bénéfice' : 'perte'} de {formatAmount(Math.abs(periodResult?.result || 0))})</li>
                            <li>Verrouiller la période contre toute modification</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClosePeriod} className="bg-green-600 hover:bg-green-700">
                          Confirmer la clôture
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogue de réouverture */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Réouverture de période
            </DialogTitle>
            <DialogDescription>
              La réouverture d'une période clôturée est une action exceptionnelle qui doit être justifiée.
            </DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Période concernée: <strong>{selectedPeriod.name}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="reopen-reason">Motif de réouverture *</Label>
                <Input
                  id="reopen-reason"
                  placeholder="Ex: Correction d'une erreur de saisie..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Cette action sera tracée dans les logs d'audit
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReopenDialog(false);
              setReopenReason('');
            }}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReopenPeriod}
              disabled={!reopenReason.trim()}
            >
              <Unlock className="h-4 w-4 mr-2" />
              Réouvrir la période
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PeriodClosurePanel;
