import { useState, useEffect, useMemo } from 'react';
import { CurrencyAmount } from '@/components/ui/CurrencyAmount';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useBankReconciliation } from '@/hooks/useBankReconciliation';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import {
  Shuffle, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search, 
  Calendar,
  Loader2,
  BarChart3,
  Target,
  Eye,
  Edit3,
  RefreshCw,
  Link,
  Clock,
  FileText,
  Database,
  Zap
} from 'lucide-react';
/** Extended transaction type for display purposes, adding reconciliation status
 * on top of the hook's UnreconciledBankTransaction */
interface DisplayBankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date: string;
  description: string;
  amount: number;
  transaction_type: string;
  reference: string;
  created_at: string;
  /** Display-only: whether this transaction is reconciled */
  is_reconciled: boolean;
  /** Display-only: suggested match entry IDs */
  suggested_matches?: string[];
  /** Display-only: matched entry ID if reconciled */
  matched_entry_id?: string;
  /** Alias for transaction_date, used in date display */
  date: string;
}

interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
}

interface BankReconciliationProps {
  currentEnterprise: unknown;
  bankAccounts: BankAccount[];
  onReconciliationComplete?: (summary?: unknown) => void;
}
const BankReconciliation = ({ currentEnterprise: _currentEnterprise, bankAccounts, onReconciliationComplete }: BankReconciliationProps) => {
  const { toast } = useToast();
  const { currentCompany } = useAuth();
  const companyId = currentCompany?.id || '';

  // États UI
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isReconciling, setIsReconciling] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [reconciliationInProgress, setReconciliationInProgress] = useState<{[key: string]: boolean}>({});

  // États pour le suivi des transactions réconciliées (Set pour performance O(1))
  const [reconciledTransactionIds, setReconciledTransactionIds] = useState<Set<string>>(new Set());

  // Hook de rapprochement bancaire (remplace les données mock)
  const {
    unreconciledTransactions,
    unreconciledEntries: _unreconciledEntries,
    matchingSuggestions,
    summary,
    isLoading: _isLoading,
    error: _hookError,
    createReconciliation,
    executeAutoReconciliation,
    refreshAll
  } = useBankReconciliation(companyId, selectedAccount || undefined);
  // Les données réelles sont fournies par le hook useBankReconciliation
  // Plus besoin de données mock !
  // Statistiques depuis le hook (résumé fourni par la RPC)
  const reconciliationStats = useMemo(() => {
    if (summary) {
      return {
        totalBankTransactions: summary.total_transactions,
        reconciledTransactions: summary.reconciled_transactions,
        pendingTransactions: summary.unreconciled_transactions,
        reconciliationRate: summary.reconciliation_rate,
        totalAmount: Math.abs(summary.bank_balance),
        reconciledAmount: Math.abs(summary.bank_balance) - Math.abs(summary.accounting_balance),
        pendingAmount: Math.abs(summary.difference)
      };
    }

    // Fallback si pas de résumé
    return {
      totalBankTransactions: unreconciledTransactions.length,
      reconciledTransactions: 0,
      pendingTransactions: unreconciledTransactions.length,
      reconciliationRate: 0,
      totalAmount: unreconciledTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0),
      reconciledAmount: 0,
      pendingAmount: unreconciledTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0)
    };
  }, [summary, unreconciledTransactions]);
  // Fonctions de rapprochement (utilisent le hook)
  const markTransactionAsReconciled = async (transactionId: string, entryLineId: string) => {
    if (!entryLineId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une écriture comptable",
        variant: "destructive"
      });
      return;
    }

    const result = await createReconciliation(transactionId, entryLineId, 'Rapprochement manuel');
    if (result) {
      // Le hook rafraîchit automatiquement les données
      toast({
        title: "✅ Transaction rapprochée",
        description: "Le rapprochement a été créé avec succès"
      });
    }
  };

  const sendToCategorization = (_transactionId: string) => {
    // Cette fonctionnalité nécessiterait un endpoint de suppression de rapprochement
    // Pour l'instant, on affiche un message
    toast({
      title: "Fonction à venir",
      description: "Utilisez l'onglet Rapprochements pour annuler un rapprochement existant",
    });
  };
  // Filtrage des transactions (utilise données du hook)
  // Map UnreconciledBankTransaction to DisplayBankTransaction adding display-only fields
  const filteredTransactions: DisplayBankTransaction[] = useMemo(() => {
    let displayTransactions: DisplayBankTransaction[] = unreconciledTransactions.map(t => {
      const txSuggestions = matchingSuggestions
        .filter(s => s.bank_transaction_id === t.id)
        .map(s => s.entry_line_id);
      return {
        ...t,
        date: t.transaction_date,
        is_reconciled: reconciledTransactionIds.has(t.id),
        suggested_matches: txSuggestions.length > 0 ? txSuggestions : undefined,
        matched_entry_id: undefined as string | undefined,
      };
    });

    if (searchTerm) {
      displayTransactions = displayTransactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      displayTransactions = displayTransactions.filter(t => {
        switch (filterStatus) {
          case 'pending': return !t.is_reconciled;
          case 'suggested': {
            return (t.suggested_matches?.length ?? 0) > 0;
          }
          case 'reconciled': return t.is_reconciled;
          default: return true;
        }
      });
    }

    return displayTransactions;
  }, [unreconciledTransactions, searchTerm, filterStatus, matchingSuggestions, reconciledTransactionIds]);
  // Lancement de la réconciliation automatique (utilise le hook)
  const runAutoReconciliation = async () => {
    if (!selectedAccount) {
      toast({
        title: "Compte requis",
        description: "Veuillez sélectionner un compte bancaire",
        variant: "destructive"
      });
      return;
    }

    setIsReconciling(true);
    try {
      // Exécuter le rapprochement automatique avec score de confiance minimum 80%
      const result = await executeAutoReconciliation(80.0);

      if (result && result.count > 0) {
        toast({
          title: "✅ Réconciliation automatique terminée",
          description: `${result.count} correspondances créées avec succès`,
          variant: "default"
        });

        if (onReconciliationComplete) {
          onReconciliationComplete(summary);
        }
      } else {
        toast({
          title: "Aucune correspondance trouvée",
          description: "Aucune transaction ne correspond aux critères automatiques",
        });
      }
    } catch (error) {
      logger.error('BankReconciliation', 'Erreur lors de la réconciliation automatique:', error instanceof Error ? error.message : String(error));
    } finally {
      setIsReconciling(false);
    }
  };
  // Validation d'une correspondance
  const validateMatch = async (bankTransactionId: string, accountingEntryId: string) => {
    try {
      setReconciliationInProgress(prev => ({ ...prev, [`${bankTransactionId}-${accountingEntryId}`]: true }));
      // Simulation d'un appel au service de réconciliation
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Marquer la transaction comme réconciliée (mise à jour des compteurs et des listes)
      markTransactionAsReconciled(bankTransactionId, accountingEntryId);
      toast({
        title: "✅ Correspondance validée",
        description: `Transaction ${bankTransactionId} réconciliée avec l'écriture ${accountingEntryId}`,
        variant: "default"
      });
      // Rafraîchir les données après validation
      await refreshAll();
    } catch (error) {
      logger.error('BankReconciliation', 'Erreur lors de la validation:', error instanceof Error ? error.message : String(error));
      toast({
        title: "❌ Erreur",
        description: "Échec de la réconciliation",
        variant: "destructive"
      });
    } finally {
      setReconciliationInProgress(prev => {
        const newState = { ...prev };
        delete newState[`${bankTransactionId}-${accountingEntryId}`];
        return newState;
      });
    }
  };
  // Réconcilier une transaction spécifique de l'onglet Historique
  const reconcileTransaction = async (transactionId: string) => {
    try {
      setReconciliationInProgress(prev => ({ ...prev, [transactionId]: true }));

      // Trouver une suggestion de correspondance pour cette transaction
      const suggestion = matchingSuggestions.find(s => s.bank_transaction_id === transactionId);

      if (!suggestion) {
        toast({
          title: "Aucune correspondance",
          description: "Aucune écriture comptable correspondante trouvée. Utilisez l'onglet Manuel.",
          variant: "destructive"
        });
        return;
      }

      // Créer le rapprochement avec l'écriture suggérée
      const result = await createReconciliation(
        transactionId,
        suggestion.entry_line_id,
        'Rapprochement automatique'
      );

      if (result) {
        // Ajouter à la liste des transactions réconciliées
        setReconciledTransactionIds(prev => new Set(prev).add(transactionId));

        toast({
          title: "✅ Réconciliation réussie",
          description: `Transaction réconciliée avec l'écriture ${suggestion.entry_line_id}`,
          variant: "default"
        });
      }
    } catch (error) {
      logger.error('BankReconciliation', 'Erreur lors de la réconciliation:', error instanceof Error ? error.message : String(error));
      toast({
        title: "❌ Erreur",
        description: "Échec de la réconciliation",
        variant: "destructive"
      });
    } finally {
      setReconciliationInProgress(prev => {
        const newState = { ...prev };
        delete newState[transactionId];
        return newState;
      });
    }
  };
  // Récupération du résumé de réconciliation
  const fetchReconciliationSummary = async () => {
    try {
      // Rafraîchir les données depuis le hook
      await refreshAll();

      if (onReconciliationComplete && summary) {
        onReconciliationComplete(summary);
      }
    } catch (error) {
      logger.error('BankReconciliation', 'Erreur lors de la récupération du résumé:', error instanceof Error ? error.message : String(error));
    }
  };
  useEffect(() => {
    if (selectedAccount) {
      fetchReconciliationSummary();
    }
  }, [selectedAccount, selectedPeriod]);
  // Formatage des montants
  const formatAmount = (amount: number) => {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    return (
      <span className="inline-flex items-center">
        <span className="mr-1">{sign}</span>
        <CurrencyAmount amount={absAmount} />
      </span>
    );
  };
  // Couleur selon le statut
  const getStatusColor = (reconciled: boolean, hasMatches = false) => {
    if (reconciled) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (hasMatches) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };
  // Icône de confiance
  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.7) return <AlertCircle className="h-4 w-4 text-orange-600" />;
    return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
  };
  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Shuffle className="h-6 w-6 text-purple-600" />
              Réconciliation bancaire
            </CardTitle>
            <CardDescription>
              Rapprochement automatique et manuel des transactions bancaires
            </CardDescription>
          </CardHeader>
        </Card>
      </motion.div>
      {/* KPI de réconciliation */}
      <motion.div
        className="grid gap-6 md:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Target className="h-4 w-4 text-blue-600" />
              Taux de réconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <motion.div 
                className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {reconciliationStats.reconciliationRate.toFixed(1)}%
              </motion.div>
              <Progress value={reconciliationStats.reconciliationRate} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-300">
                {reconciliationStats.reconciledTransactions}/{reconciliationStats.totalBankTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Réconciliées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {reconciliationStats.reconciledTransactions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {formatAmount(reconciliationStats.reconciledAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {reconciliationStats.pendingTransactions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {formatAmount(reconciliationStats.pendingAmount)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {matchingSuggestions.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Correspondances trouvées
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Contrôles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="account-select" className="text-sm font-medium mb-2 block">
                  Compte bancaire
                </label>
                <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un compte" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.bank_name} - {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label htmlFor="period-select" className="text-sm font-medium mb-2 block">
                  Période
                </label>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="quarter">Ce trimestre</SelectItem>
                    <SelectItem value="year">Cette année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end space-x-2">
                <Button
                  onClick={runAutoReconciliation}
                  disabled={isReconciling || !selectedAccount}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isReconciling ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Réconciliation...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Auto-réconciliation
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(!showDetails)}
                  title="Afficher/masquer les détails"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {showDetails ? 'Masquer' : 'Détails'}
                </Button>
                <Button
                  variant="outline"
                  onClick={fetchReconciliationSummary}
                  disabled={!selectedAccount}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      {/* Panneau de détails conditionnel */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Correspondances en attente
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {matchingSuggestions.length}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Nécessitent validation manuelle
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Résumé de réconciliation
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {summary ? 'Disponible' : 'Non calculé'}
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    {summary ? 'Données à jour' : 'Cliquez sur Actualiser'}
                  </p>
                </div>
                <div className="flex items-center justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      await refreshAll();
                      toast({
                        title: "Détails mis à jour",
                        description: `${matchingSuggestions.length} correspondances disponibles`,
                      });
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:text-blue-400"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Recharger détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Onglets principaux */}
      <Tabs defaultValue="matches" className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700 p-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="matches"
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Link className="h-4 w-4" />
              Correspondances ({matchingSuggestions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="transactions" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <FileText className="h-4 w-4" />
              Transactions ({filteredTransactions.length})
            </TabsTrigger>
            <TabsTrigger 
              value="manual" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Edit3 className="h-4 w-4" />
              Manuel
            </TabsTrigger>
          </TabsList>
        </div>
        {/* Correspondances automatiques */}
        <TabsContent value="matches">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-purple-600" />
                  Correspondances suggérées
                </CardTitle>
                <CardDescription>
                  Validez les correspondances automatiques détectées
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchingSuggestions.length > 0 ? (
                  <div className="space-y-4">
                    {matchingSuggestions.map((match, index) => {
                      const confidenceNormalized = match.confidence_score / 100; // Convertir 0-100 en 0-1
                      return (
                        <motion.div
                          key={`${match.bank_transaction_id}-${match.entry_line_id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getConfidenceIcon(confidenceNormalized)}
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {match.confidence_score.toFixed(0)}% de confiance
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:bg-red-900/20 dark:text-red-400"
                                disabled
                                title="Fonction à venir"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => validateMatch(match.bank_transaction_id, match.entry_line_id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Valider
                              </Button>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Transaction bancaire */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 dark:border-gray-600">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2 flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-600" />
                                Transaction bancaire
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Date:</span>
                                  <span>{new Date(match.bank_date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Montant:</span>
                                  <span className={`font-medium ${match.bank_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatAmount(match.bank_amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Description:</span>
                                  <span className="truncate ml-2">{match.bank_description}</span>
                                </div>
                              </div>
                            </div>
                            {/* Écriture comptable */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 dark:border-gray-600">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                Écriture comptable
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Date:</span>
                                  <span>{new Date(match.entry_date).toLocaleDateString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Montant:</span>
                                  <span className={`font-medium ${match.entry_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatAmount(match.entry_amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">Description:</span>
                                  <span className="truncate ml-2">{match.entry_description}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-300">N° écriture:</span>
                                  <span className="text-xs font-mono">{match.entry_number}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Détails de la correspondance */}
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-blue-800 dark:text-blue-300">
                                <strong>Écart de dates:</strong> {match.days_difference} jour{Math.abs(match.days_difference) > 1 ? 's' : ''}
                              </p>
                              {match.amount_difference !== 0 && (
                                <p className="text-sm text-orange-800 dark:text-orange-300">
                                  <strong>Différence:</strong> {formatAmount(match.amount_difference)}
                                </p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Link className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                      Aucune correspondance trouvée
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Lancez une réconciliation automatique pour détecter les correspondances.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        {/* Liste des transactions */}
        <TabsContent value="transactions">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Transactions bancaires
                    </CardTitle>
                    <CardDescription>
                      Liste complète des transactions avec statut de réconciliation
                    </CardDescription>
                  </div>
                  <div className="flex space-x-3">
                    <div className="relative">
                      <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes</SelectItem>
                        <SelectItem value="reconciled">Réconciliées</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="suggested">Avec suggestions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTransactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors dark:bg-gray-900/50"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${transaction.is_reconciled ? 'bg-green-500' : 'bg-orange-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 dark:text-white truncate">
                              {transaction.description}
                            </p>
                            <span className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(transaction.amount)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {transaction.date}
                            </span>
                            <span className="font-mono text-xs">{transaction.reference}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <Badge className={getStatusColor(transaction.is_reconciled, (transaction.suggested_matches?.length ?? 0) > 0)}>
                          {transaction.is_reconciled ? 'Réconciliée' :
                           (transaction.suggested_matches?.length ?? 0) > 0 ? 'Suggestions' : 'En attente'}
                        </Badge>
                        {!transaction.is_reconciled && (transaction.suggested_matches?.length ?? 0) > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.suggested_matches?.length} suggestion{(transaction.suggested_matches?.length ?? 0) > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {!reconciledTransactionIds.has(transaction.id) && !transaction.is_reconciled && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => reconcileTransaction(transaction.id)}
                            disabled={reconciliationInProgress[transaction.id]}
                            className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            title="Réconcilier cette transaction"
                          >
                            {reconciliationInProgress[transaction.id] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Réconciliation...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Réconcilier
                              </>
                            )}
                          </Button>
                        )}
                        {(reconciledTransactionIds.has(transaction.id) || transaction.is_reconciled) && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Rapprochée
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendToCategorization(transaction.id)}
                              className="text-orange-600 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-900/20"
                              title="Renvoyer en catégorisation"
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Renvoyer
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                      Aucune transaction trouvée
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Aucune transaction ne correspond aux critères de recherche.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
        {/* Réconciliation manuelle */}
        <TabsContent value="manual">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-600 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-orange-600" />
                  Réconciliation manuelle
                </CardTitle>
                <CardDescription>
                  Créez manuellement des correspondances entre transactions et écritures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Edit3 className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-2">
                    Interface de réconciliation manuelle
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 dark:text-gray-300 mb-4">
                    Fonctionnalité en cours de développement
                  </p>
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Bientôt disponible
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
export default BankReconciliation;
