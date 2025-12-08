/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { SepaService, SepaPayment, BankAccount } from '@/services/sepaService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, CreditCard, AlertCircle, CheckCircle2, FileText, Users, Euro } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface SepaPaymentGeneratorProps {
  onClose?: () => void;
  onNavigateToAccounts?: () => void;
}

export const SepaPaymentGenerator: React.FC<SepaPaymentGeneratorProps> = ({ onClose: _onClose, onNavigateToAccounts }) => {
  const { currentCompany } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Données
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SepaPayment[]>([]);
  const [expenseReports, setExpenseReports] = useState<SepaPayment[]>([]);

  // Sélections
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [executionDate, setExecutionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  // Filtres
  const [showSuppliers, setShowSuppliers] = useState(true);
  const [showExpenses, setShowExpenses] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentCompany?.id]);

  const loadData = async () => {
    if (!currentCompany?.id) return;

    setLoading(true);
    try {
      const [accounts, invoices, reports] = await Promise.all([
        SepaService.getBankAccounts(currentCompany.id),
        SepaService.getUnpaidSupplierInvoices(currentCompany.id),
        SepaService.getApprovedExpenseReports(currentCompany.id),
      ]);

      setBankAccounts(accounts);
      setSupplierInvoices(invoices);
      setExpenseReports(reports);

      // Sélectionner le premier compte par défaut
      if (accounts.length > 0 && !selectedBankAccount) {
        setSelectedBankAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      toast.error(t('errors.loadData', 'Erreur lors du chargement des données'));
    } finally {
      setLoading(false);
    }
  };

  const allPayments = [
    ...(showSuppliers ? supplierInvoices : []),
    ...(showExpenses ? expenseReports : []),
  ];

  const selectedPaymentsList = allPayments.filter(p => selectedPayments.has(p.id));
  const totalAmount = selectedPaymentsList.reduce((sum, p) => sum + p.amount, 0);

  const togglePayment = (id: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedPayments(newSelected);
  };

  const selectAll = () => {
    setSelectedPayments(new Set(allPayments.map(p => p.id)));
  };

  const deselectAll = () => {
    setSelectedPayments(new Set());
  };

  const handleGenerate = async () => {
    if (!currentCompany) {
      toast.error('Entreprise non identifiée');
      return;
    }

    if (selectedPaymentsList.length === 0) {
      toast.error('Veuillez sélectionner au moins un paiement');
      return;
    }

    if (!selectedBankAccount) {
      toast.error('Veuillez sélectionner un compte bancaire émetteur');
      return;
    }

    const emitterAccount = bankAccounts.find(acc => acc.id === selectedBankAccount);
    if (!emitterAccount) {
      toast.error('Compte bancaire émetteur introuvable');
      return;
    }

    setGenerating(true);

    try {
      // Générer le XML SEPA
      const xml = SepaService.generateSepaXml({
        companyId: currentCompany.id,
        companyName: currentCompany.name,
        emitterAccount,
        payments: selectedPaymentsList,
        executionDate,
      });

      // Télécharger le fichier
      const filename = `virement_sepa_${new Date().toISOString().split('T')[0]}.xml`;
      SepaService.downloadSepaXml(xml, filename);

      // Mettre à jour le statut des paiements
      await SepaService.markPaymentsAsPending(selectedPaymentsList, currentCompany.id);

      toast.success(
        `Fichier SEPA généré avec succès (${selectedPaymentsList.length} paiement${selectedPaymentsList.length > 1 ? 's' : ''})`
      );

      // Recharger les données
      await loadData();
      deselectAll();
    } catch (error: any) {
      console.error('Erreur génération SEPA:', error);
      toast.error(error.message || 'Erreur lors de la génération du fichier SEPA');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des paiements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CreditCard className="h-6 w-6" />
            Générateur de virements SEPA
          </CardTitle>
          <CardDescription className="text-blue-100">
            Créez des fichiers XML SEPA pour vos virements fournisseurs et notes de frais
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Configuration du virement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Compte émetteur */}
            <div className="space-y-2">
              <Label htmlFor="bank-account" className="text-gray-700 dark:text-gray-300">Compte bancaire émetteur *</Label>
              <Select value={selectedBankAccount} onValueChange={setSelectedBankAccount}>
                <SelectTrigger id="bank-account" className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 dark:text-gray-100">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:border-gray-600">
                  {bankAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="text-gray-900 dark:text-gray-100 dark:text-gray-100">
                      {acc.account_name} - {acc.iban.substring(0, 20)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {bankAccounts.length === 0 && (
                <div className="mt-2 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-3">
                  <p className="text-sm text-amber-900 dark:text-amber-100 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Aucun compte bancaire avec IBAN configuré
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-200">
                    Pour générer des virements SEPA, vous devez d'abord configurer un compte bancaire avec IBAN et BIC.
                  </p>
                  {onNavigateToAccounts && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onNavigateToAccounts}
                      className="w-full border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Configurer un compte bancaire
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Date d'exécution */}
            <div className="space-y-2">
              <Label htmlFor="execution-date" className="text-gray-700 dark:text-gray-300">Date d'exécution souhaitée *</Label>
              <Input
                id="execution-date"
                type="date"
                value={executionDate}
                onChange={(e) => setExecutionDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 dark:text-gray-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtres */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showSuppliers}
                onCheckedChange={(checked) => setShowSuppliers(checked as boolean)}
              />
              <Users className="h-4 w-4" />
              Factures fournisseurs ({supplierInvoices.length})
            </Label>

            <Label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={showExpenses}
                onCheckedChange={(checked) => setShowExpenses(checked as boolean)}
              />
              <FileText className="h-4 w-4" />
              Notes de frais ({expenseReports.length})
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Liste des paiements */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Paiements à effectuer</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll} disabled={allPayments.length === 0}>
                Tout sélectionner
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll} disabled={selectedPayments.size === 0}>
                Tout désélectionner
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allPayments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-16 w-16 text-gray-300 dark:text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
                Aucun paiement en attente
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Tous les paiements ont été traités ou aucune donnée disponible
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allPayments.map((payment) => {
                const isSelected = selectedPayments.has(payment.id);
                const isMissingBic = !payment.beneficiaryBic;

                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 transition ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    } ${isMissingBic ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => togglePayment(payment.id)}
                        disabled={isMissingBic}
                        className="mt-1"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{payment.beneficiaryName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{payment.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-gray-100">
                              {payment.amount.toLocaleString('fr-FR', {
                                style: 'currency',
                                currency: 'EUR',
                              })}
                            </p>
                            <Badge variant={payment.type === 'supplier_invoice' ? 'default' : 'secondary'}>
                              {payment.type === 'supplier_invoice' ? 'Fournisseur' : 'Note de frais'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                          <p>IBAN: {payment.beneficiaryIban}</p>
                          <p>BIC: {payment.beneficiaryBic || 'NON RENSEIGNÉ'}</p>
                          <p>Référence: {payment.reference}</p>
                        </div>

                        {isMissingBic && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            BIC manquant - Veuillez compléter les informations bancaires
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Résumé et génération */}
      {selectedPaymentsList.length > 0 && (
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100 mb-1">
                  {selectedPaymentsList.length} paiement{selectedPaymentsList.length > 1 ? 's' : ''} sélectionné{selectedPaymentsList.length > 1 ? 's' : ''}
                </p>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400 flex items-center gap-2">
                  <Euro className="h-6 w-6" />
                  {totalAmount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generating || !selectedBankAccount}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5 mr-2" />
                    Générer le fichier SEPA
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations */}
      <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">À propos des virements SEPA</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Le fichier XML généré est conforme à la norme SEPA pain.001.001.03</li>
                <li>Import le fichier dans votre banque en ligne pour exécuter les virements</li>
                <li>Les statuts des paiements seront automatiquement mis à jour après génération</li>
                <li>Vérifiez les coordonnées bancaires (IBAN/BIC) avant de générer</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};



