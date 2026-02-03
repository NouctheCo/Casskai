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

import React, { useCallback, useEffect, useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { logger } from '@/lib/logger';
import { periodClosureService, type ClosureValidation } from '@/services/accounting/periodClosureService';
import type { Database } from '@/types/supabase';
import { AlertTriangle, BarChart3, Calendar, CheckCircle2, Info, Loader2, Lock, Plus, RefreshCw, Sparkles, Unlock, XCircle, Calculator } from 'lucide-react';
import { PeriodClosureHistory } from './PeriodClosureHistory';

type AccountingPeriod = Database['public']['Tables']['accounting_periods']['Row'];

type PeriodResult = {
  totalCharges: number;
  totalProduits: number;
  result: number;
  isProfit: boolean;
};

type PeriodClosurePanelProps = {
  companyId: string;
};

export const PeriodClosurePanel = ({ companyId }: PeriodClosurePanelProps) => {
  const { t } = useTranslation();
  const { formatAmount } = useCompanyCurrency();

  const [periods, setPeriods] = useState<AccountingPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<AccountingPeriod | null>(null);
  const [validation, setValidation] = useState<ClosureValidation | null>(null);
  const [periodResult, setPeriodResult] = useState<PeriodResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [closing, setClosing] = useState(false);
  const [generatingAN, setGeneratingAN] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [newPeriod, setNewPeriod] = useState({ name: '', startDate: '', endDate: '' });

  const loadPeriods = useCallback(async () => {
    setLoading(true);
    try {
      const data = await periodClosureService.getPeriods(companyId);
      setPeriods(data);
      setSelectedPeriod((prev) => {
        if (!prev) return prev;
        const updated = data.find((period) => period.id === prev.id);
        if (!updated) {
          setValidation(null);
          setPeriodResult(null);
        }
        return updated ?? null;
      });
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error loading periods:', error);
      toast.error(t('accounting.closure.errors.load', 'Erreur lors du chargement'));
    } finally {
      setLoading(false);
    }
  }, [companyId, t]);

  useEffect(() => {
    if (!companyId) return;
    loadPeriods();
  }, [companyId, loadPeriods]);

  const handleValidate = async (period: AccountingPeriod) => {
    setSelectedPeriod(period);
    setValidating(true);
    setValidation(null);
    setPeriodResult(null);

    try {
      const [validationResult, resultCalc] = await Promise.all([
        periodClosureService.validateClosureReadiness(companyId, period.id),
        periodClosureService.calculatePeriodResult(companyId, period.start_date, period.end_date)
      ]);

      setValidation(validationResult);
      setPeriodResult(resultCalc);
    } catch (error) {
      logger.error('PeriodClosurePanel', 'Error validating period:', error);
      toast.error(t('accounting.closure.errors.validation', 'Erreur lors de la validation'));
    } finally {
      setValidating(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;

    setClosing(true);
    try {
      const result = await periodClosureService.closePeriod(companyId, selectedPeriod.id);

      if (result.success) {
        toast.success(result.message);
        if (result.resultAmount !== undefined) {
          const type = result.resultType === 'profit'
            ? t('accounting.closure.profit', 'Bénéfice')
            : t('accounting.closure.loss', 'Perte');
          toast.info(`${type}: ${formatAmount(result.resultAmount)}`);
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
      toast.error(t('accounting.closure.errors.close', 'Erreur lors de la clôture'));
    } finally {
      setClosing(false);
    }
  };

  const handleGenerateAN = async (closedPeriod: AccountingPeriod) => {
    setGeneratingAN(true);
    try {
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
      toast.error(t('accounting.closure.errors.generateAN', 'Erreur lors de la génération des à-nouveaux'));
    } finally {
      setGeneratingAN(false);
    }
  };

  const handleCreatePeriod = async () => {
    if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
      toast.error(t('accounting.closure.errors.fillAllFields', 'Veuillez remplir tous les champs'));
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
      toast.error(t('accounting.closure.errors.create', 'Erreur lors de la création'));
    }
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriod || !reopenReason.trim()) {
      toast.error(t('accounting.closure.errors.reopenReasonRequired', 'Veuillez indiquer la raison de la réouverture'));
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
      toast.error(t('accounting.closure.errors.reopen', 'Erreur lors de la réouverture'));
    }
  };

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
        <span className="ml-2">{t('accounting.closure.loading', 'Chargement des périodes...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('accounting.closure.title', 'Clôture comptable')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('accounting.closure.subtitle', "Gérez vos périodes comptables et effectuez les clôtures d'exercice")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadPeriods}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('accounting.closure.refresh', 'Actualiser')}
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('accounting.closure.newPeriod', 'Nouvelle période')}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('accounting.closure.createTitle', 'Créer une période comptable')}</DialogTitle>
                <DialogDescription>
                  {t('accounting.closure.createDescription', "Définissez une nouvelle période pour votre exercice comptable")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="period-name">{t('accounting.closure.periodNameLabel', 'Nom de la période')}</Label>
                  <Input
                    id="period-name"
                    placeholder={t('accounting.closure.periodNamePlaceholder', 'Ex: Exercice 2025')}
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">{t('accounting.closure.startDateLabel', 'Date de début')}</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newPeriod.startDate}
                      onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">{t('accounting.closure.endDateLabel', 'Date de fin')}</Label>
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
                  {t('accounting.closure.cancel', 'Annuler')}
                </Button>
                <Button onClick={handleCreatePeriod}>
                  {t('accounting.closure.createCta', 'Créer la période')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('accounting.closure.periodsTitle', 'Périodes comptables')}</CardTitle>
          <CardDescription>
            {t('accounting.closure.periodsDescription', 'Liste des périodes définies pour votre entreprise')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('accounting.closure.noPeriodsTitle', 'Aucune période comptable définie')}</p>
              <p className="text-sm mt-1">{t('accounting.closure.noPeriodsDescription', 'Créez votre première période pour commencer')}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('accounting.closure.table.period', 'Période')}</TableHead>
                    <TableHead>{t('accounting.closure.table.startDate', 'Date début')}</TableHead>
                    <TableHead>{t('accounting.closure.table.endDate', 'Date fin')}</TableHead>
                    <TableHead>{t('accounting.closure.table.status', 'Statut')}</TableHead>
                    <TableHead className="text-right">{t('accounting.closure.table.actions', 'Actions')}</TableHead>
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
                          <Badge variant="destructive">{t('accounting.closure.status.closed', 'Clôturée')}</Badge>
                        ) : (
                          <Badge variant="secondary">{t('accounting.closure.status.open', 'Ouverte')}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleValidate(period)}
                                  disabled={validating && selectedPeriod?.id === period.id}
                                >
                                  {validating && selectedPeriod?.id === period.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{t('accounting.closure.actions.validate', 'Valider')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {period.is_closed ? (
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
                                    <p>{t('accounting.closure.tooltips.generateAN', 'Générer les à-nouveaux')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
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
                                    <p>{t('accounting.closure.tooltips.reopen', 'Réouvrir la période')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleValidate(period)}
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{t('accounting.closure.actions.close', 'Clôturer')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PeriodClosureHistory companyId={companyId} periodId={selectedPeriod?.id} />

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
                  {t('accounting.closure.validationTitle', 'Validation de clôture: {{periodName}}', { periodName: selectedPeriod.name })}
                </CardTitle>
                <CardDescription>
                  {t('accounting.closure.validationRange', 'Du {{start}} au {{end}}', {
                    start: formatDate(selectedPeriod.start_date),
                    end: formatDate(selectedPeriod.end_date)
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold flex items-center gap-2">
                      {validation.isValid ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {t('accounting.closure.validationState', 'État de la validation')}
                    </h4>

                    <div className={`p-3 rounded-lg ${validation.balanceSheet.isBalanced ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('accounting.closure.balanceCheck', 'Équilibre comptable')}</span>
                        {validation.balanceSheet.isBalanced ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>{t('accounting.closure.totalDebit', 'Total débit')}: {formatAmount(validation.balanceSheet.totalDebit)}</div>
                        <div>{t('accounting.closure.totalCredit', 'Total crédit')}: {formatAmount(validation.balanceSheet.totalCredit)}</div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${validation.unpostedEntries === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('accounting.closure.draftEntries', 'Écritures en brouillon')}</span>
                        <span className={`font-bold ${validation.unpostedEntries === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {validation.unpostedEntries}
                        </span>
                      </div>
                    </div>

                    <div className={`p-3 rounded-lg ${validation.unletteredEntries === 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{t('accounting.closure.unletteredEntries', 'Lignes tiers non lettrées')}</span>
                        <span className={`font-bold ${validation.unletteredEntries === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {validation.unletteredEntries}
                        </span>
                      </div>
                    </div>
                  </div>

                  {periodResult && (
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        {t('accounting.closure.periodResultTitle', "Résultat de l'exercice")}
                      </h4>

                      <div className={`p-4 rounded-lg ${periodResult.isProfit ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' : 'bg-red-50 dark:bg-red-900/20 border border-red-200'}`}>
                        <div className="text-center">
                          <div className="text-3xl font-bold mb-2">
                            <span className={periodResult.isProfit ? 'text-green-600' : 'text-red-600'}>
                              {periodResult.isProfit ? '+' : '-'}{formatAmount(Math.abs(periodResult.result))}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {periodResult.isProfit ? t('accounting.closure.profit', 'Bénéfice') : t('accounting.closure.loss', 'Perte')}
                          </div>
                        </div>
                        <Separator className="my-3" />
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-center">
                            <div className="text-red-600 font-medium">
                              {formatAmount(periodResult.totalCharges)}
                            </div>
                            <div className="text-xs text-gray-500">{t('accounting.closure.chargesLabel', 'Charges (cl. 6)')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-green-600 font-medium">
                              {formatAmount(periodResult.totalProduits)}
                            </div>
                            <div className="text-xs text-gray-500">{t('accounting.closure.productsLabel', 'Produits (cl. 7)')}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {validation.errors.length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <h5 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4" />
                      {t('accounting.closure.blockingErrors', 'Erreurs bloquantes')}
                    </h5>
                    <ul className="list-disc list-inside text-sm text-red-600 dark:text-red-300 space-y-1">
                      {validation.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validation.warnings.length > 0 && (
                  <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <h5 className="font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      {t('accounting.closure.warnings', 'Avertissements')}
                    </h5>
                    <ul className="list-disc list-inside text-sm text-amber-600 dark:text-amber-300 space-y-1">
                      {validation.warnings.map((warning, idx) => (
                        <li key={idx}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
                  <h5 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4" />
                    {t('accounting.closure.actionsTitle', 'Actions de clôture')}
                  </h5>
                  <ul className="list-disc list-inside text-sm text-blue-600 dark:text-blue-300 space-y-1">
                    <li>{t('accounting.closure.actions.items.balanceAccounts', 'Solde des comptes de charges (classe 6) et de produits (classe 7)')}</li>
                    <li>{t('accounting.closure.actions.items.assignResult', 'Affectation du résultat au compte {{account}}', { account: periodResult?.isProfit ? '120 (Bénéfice)' : '129 (Perte)' })}</li>
                    <li>{t('accounting.closure.actions.items.lockPeriod', 'Verrouillage de la période (aucune modification ultérieure)')}</li>
                    <li>{t('accounting.closure.actions.items.generateOpening', 'Possibilité de générer les écritures à-nouveaux pour la période suivante')}</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => {
                    setSelectedPeriod(null);
                    setValidation(null);
                  }}>
                    {t('accounting.closure.cancel', 'Annuler')}
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
                        {t('accounting.closure.closePeriod', 'Clôturer la période')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('accounting.closure.confirmTitle', 'Confirmer la clôture')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('accounting.closure.confirmDescription', 'Êtes-vous sûr de vouloir clôturer la période {{periodName}} ?', { periodName: selectedPeriod.name })}
                          <br /><br />
                          {t('accounting.closure.confirmIntro', 'Cette action va :')}
                          <ul className="list-disc list-inside mt-2">
                            <li>{t('accounting.closure.confirmItems.closingEntries', 'Générer les écritures de clôture des comptes de résultat')}</li>
                            <li>{t('accounting.closure.confirmItems.assignResult', 'Affecter le résultat ({{resultType}} de {{amount}})', { resultType: periodResult?.isProfit ? t('accounting.closure.profitLower', 'bénéfice') : t('accounting.closure.lossLower', 'perte'), amount: formatAmount(Math.abs(periodResult?.result || 0)) })}</li>
                            <li>{t('accounting.closure.confirmItems.lockPeriod', 'Verrouiller la période contre toute modification')}</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('accounting.closure.cancel', 'Annuler')}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClosePeriod} className="bg-green-600 hover:bg-green-700">
                          {t('accounting.closure.confirmCta', 'Confirmer la clôture')}
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

      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent className="w-[95vw] max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              {t('accounting.closure.reopenTitle', 'Réouverture de période')}
            </DialogTitle>
            <DialogDescription>
              {t('accounting.closure.reopenDescription', "La réouverture d'une période clôturée est une action exceptionnelle qui doit être justifiée.")}
            </DialogDescription>
          </DialogHeader>
          {selectedPeriod && (
            <div className="py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {t('accounting.closure.reopenPeriodLabel', 'Période concernée')}: <strong>{selectedPeriod.name}</strong>
              </p>
              <div className="space-y-2">
                <Label htmlFor="reopen-reason">{t('accounting.closure.reopenReasonLabel', 'Motif de réouverture *')}</Label>
                <Input
                  id="reopen-reason"
                  placeholder={t('accounting.closure.reopenReasonPlaceholder', "Ex: Correction d'une erreur de saisie...")}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>
              <p className="text-xs text-amber-600 mt-2">
                {t('accounting.closure.reopenAuditNote', '⚠️ Cette action sera tracée dans les logs d\'audit')}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowReopenDialog(false);
              setReopenReason('');
            }}>
              {t('accounting.closure.cancel', 'Annuler')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleReopenPeriod}
              disabled={!reopenReason.trim()}
            >
              <Unlock className="h-4 w-4 mr-2" />
              {t('accounting.closure.reopenCta', 'Réouvrir la période')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PeriodClosurePanel;
