import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
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

const BankReconciliation = ({ currentEnterprise: _currentEnterprise, bankAccounts, onReconciliationComplete }) => {
  const { toast } = useToast();

  // États
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [isReconciling, setIsReconciling] = useState(false);
  const [_reconciliationData, _setReconciliationData] = useState(null);
  const [_pendingMatches, _setPendingMatches] = useState([]);
  const [autoMatches, setAutoMatches] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [_showDetails, _setShowDetails] = useState(false);
  const [_reconciliationSummary, setReconciliationSummary] = useState(null);

  // Données simulées pour les transactions bancaires et écritures comptables
  const [bankTransactions] = useState([
    {
      id: 'bt_1',
      date: '2024-01-15',
      amount: -1250.00,
      description: 'PAIEMENT CB AMAZON FR',
      reference: 'CB****1234',
      reconciled: false,
      suggested_matches: ['ae_5', 'ae_12']
    },
    {
      id: 'bt_2', 
      date: '2024-01-14',
      amount: 2500.00,
      description: 'VIR CLIENT ABC SARL',
      reference: 'VIR240114001',
      reconciled: false,
      suggested_matches: ['ae_3']
    },
    {
      id: 'bt_3',
      date: '2024-01-13',
      amount: -450.75,
      description: 'CHEQUE N°1234567',
      reference: 'CHQ1234567',
      reconciled: true,
      matched_entry_id: 'ae_8'
    },
    {
      id: 'bt_4',
      date: '2024-01-12',
      amount: -89.90,
      description: 'PRLV ELECTRICITE DE FRANCE',
      reference: 'PRLV240112EDF',
      reconciled: false,
      suggested_matches: ['ae_15']
    }
  ]);

  const [accountingEntries] = useState([
    {
      id: 'ae_3',
      date: '2024-01-14',
      amount: 2500.00,
      description: 'Facture ABC-2024-001',
      account: '411000 - Clients',
      reference: 'FAC-001',
      reconciled: false
    },
    {
      id: 'ae_5',
      date: '2024-01-15',
      amount: -1250.00,
      description: 'Achat matériel informatique',
      account: '606000 - Achats',
      reference: 'ACH-2024-015',
      reconciled: false
    },
    {
      id: 'ae_8',
      date: '2024-01-13',
      amount: -450.75,
      description: 'Règlement fournisseur XYZ',
      account: '401000 - Fournisseurs',
      reference: 'REG-XYZ-001',
      reconciled: true,
      matched_transaction_id: 'bt_3'
    },
    {
      id: 'ae_12',
      date: '2024-01-15',
      amount: -1249.99,
      description: 'Matériel bureau Amazon',
      account: '606100 - Fournitures',
      reference: 'ACH-AMZ-001',
      reconciled: false
    },
    {
      id: 'ae_15',
      date: '2024-01-12',
      amount: -89.90,
      description: 'Électricité janvier 2024',
      account: '606300 - Énergie',
      reference: 'EDF-JAN-2024',
      reconciled: false
    }
  ]);

  // Calculs des statistiques
  const reconciliationStats = useMemo(() => {
    const totalBankTransactions = bankTransactions.length;
    const reconciledTransactions = bankTransactions.filter(t => t.reconciled).length;
    const pendingTransactions = totalBankTransactions - reconciledTransactions;
    const reconciliationRate = totalBankTransactions > 0 ? (reconciledTransactions / totalBankTransactions) * 100 : 0;

    const totalAmount = bankTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const reconciledAmount = bankTransactions
      .filter(t => t.reconciled)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const pendingAmount = totalAmount - reconciledAmount;

    return {
      totalBankTransactions,
      reconciledTransactions,
      pendingTransactions,
      reconciliationRate,
      totalAmount,
      reconciledAmount,
      pendingAmount
    };
  }, [bankTransactions]);

  // Filtrage des transactions
  const filteredTransactions = useMemo(() => {
    let filtered = bankTransactions;

    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => {
        switch (filterStatus) {
          case 'reconciled': return t.reconciled;
          case 'pending': return !t.reconciled;
          case 'suggested': return !t.reconciled && t.suggested_matches && t.suggested_matches.length > 0;
          default: return true;
        }
      });
    }

    return filtered;
  }, [bankTransactions, searchTerm, filterStatus]);

  // Lancement de la réconciliation automatique
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
      // Simulation d'un appel au service de réconciliation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockMatches = [
        {
          bank_transaction_id: 'bt_2',
          accounting_entry_id: 'ae_3',
          confidence: 0.95,
          match_reason: 'Amount and date exact match',
          amount_difference: 0
        },
        {
          bank_transaction_id: 'bt_4',
          accounting_entry_id: 'ae_15',
          confidence: 0.98,
          match_reason: 'Amount, date and description match',
          amount_difference: 0
        },
        {
          bank_transaction_id: 'bt_1',
          accounting_entry_id: 'ae_12',
          confidence: 0.85,
          match_reason: 'Similar amount and date',
          amount_difference: -0.01
        }
      ];

      setAutoMatches(mockMatches);

      toast({
        title: "Réconciliation automatique terminée",
        description: `${mockMatches.length} correspondances trouvées`,
        variant: "default"
      });

    } catch (error) {
      console.error('Erreur lors de la réconciliation automatique:', error);
      toast({
        title: "Erreur",
        description: "Échec de la réconciliation automatique",
        variant: "destructive"
      });
    } finally {
      setIsReconciling(false);
    }
  };

  // Validation d'une correspondance
  const validateMatch = async (bankTransactionId, accountingEntryId) => {
    try {
      // Simulation de validation
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Correspondance validée",
        description: "Transaction réconciliée avec succès",
        variant: "default"
      });

      // Retirer de la liste des matches automatiques
      setAutoMatches(prev => prev.filter(m => 
        m.bank_transaction_id !== bankTransactionId || m.accounting_entry_id !== accountingEntryId
      ));

    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      toast({
        title: "Erreur",
        description: "Échec de la validation",
        variant: "destructive"
      });
    }
  };

  // Récupération du résumé de réconciliation
  const fetchReconciliationSummary = async () => {
    try {
      const summary = {
        total_bank_transactions: reconciliationStats.totalBankTransactions,
        reconciled_transactions: reconciliationStats.reconciledTransactions,
        pending_transactions: reconciliationStats.pendingTransactions,
        reconciliation_rate: reconciliationStats.reconciliationRate,
        total_amount: reconciliationStats.totalAmount,
        reconciled_amount: reconciliationStats.reconciledAmount,
        pending_amount: reconciliationStats.pendingAmount,
        last_reconciliation: new Date().toISOString(),
        period: selectedPeriod
      };

      setReconciliationSummary(summary);

      if (onReconciliationComplete) {
        onReconciliationComplete(summary);
      }

    } catch (error) {
      console.error('Erreur lors de la récupération du résumé:', error);
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchReconciliationSummary();
    }
  }, [selectedAccount, selectedPeriod]);

  // Formatage des montants
  const formatAmount = (amount) => {
    const abs = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}${abs.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  // Couleur selon le statut
  const getStatusColor = (reconciled, hasMatches = false) => {
    if (reconciled) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    if (hasMatches) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  };

  // Icône de confiance
  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.9) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.7) return <AlertCircle className="h-4 w-4 text-orange-600" />;
    return <XCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
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
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Target className="h-4 w-4 text-blue-600" />
              Taux de réconciliation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <motion.div 
                className="text-2xl font-bold text-gray-900 dark:text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {reconciliationStats.reconciliationRate.toFixed(1)}%
              </motion.div>
              <Progress value={reconciliationStats.reconciliationRate} className="h-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {reconciliationStats.reconciledTransactions}/{reconciliationStats.totalBankTransactions} transactions
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Réconciliées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {reconciliationStats.reconciledTransactions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatAmount(reconciliationStats.reconciledAmount)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="h-4 w-4 text-orange-600" />
              En attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-orange-600">
                {reconciliationStats.pendingTransactions}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatAmount(reconciliationStats.pendingAmount)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-purple-600">
                {autoMatches.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
        <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                    {bankAccounts.map(account => (
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

      {/* Onglets principaux */}
      <Tabs defaultValue="matches" className="space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger 
              value="matches" 
              className="flex items-center gap-2 data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Link className="h-4 w-4" />
              Correspondances ({autoMatches.length})
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
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                {autoMatches.length > 0 ? (
                  <div className="space-y-4">
                    {autoMatches.map((match, index) => {
                      const bankTx = bankTransactions.find(t => t.id === match.bank_transaction_id);
                      const accountingEntry = accountingEntries.find(e => e.id === match.accounting_entry_id);

                      return (
                        <motion.div
                          key={`${match.bank_transaction_id}-${match.accounting_entry_id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {getConfidenceIcon(match.confidence)}
                              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                                {(match.confidence * 100).toFixed(0)}% de confiance
                              </Badge>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => validateMatch(match.bank_transaction_id, match.accounting_entry_id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Valider
                              </Button>
                            </div>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            {/* Transaction bancaire */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <Database className="h-4 w-4 text-blue-600" />
                                Transaction bancaire
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                  <span>{bankTx?.date}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                                  <span className={`font-medium ${bankTx?.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatAmount(bankTx?.amount || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                                  <span className="truncate ml-2">{bankTx?.description}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Référence:</span>
                                  <span className="font-mono text-xs">{bankTx?.reference}</span>
                                </div>
                              </div>
                            </div>

                            {/* Écriture comptable */}
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                              <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-600" />
                                Écriture comptable
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Date:</span>
                                  <span>{accountingEntry?.date}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                                  <span className={`font-medium ${accountingEntry?.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatAmount(accountingEntry?.amount || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Description:</span>
                                  <span className="truncate ml-2">{accountingEntry?.description}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Compte:</span>
                                  <span className="text-xs">{accountingEntry?.account}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Détails de la correspondance */}
                          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                              <strong>Raison:</strong> {match.match_reason}
                            </p>
                            {match.amount_difference !== 0 && (
                              <p className="text-sm text-orange-800 dark:text-orange-300 mt-1">
                                <strong>Différence:</strong> {formatAmount(match.amount_difference)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Link className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Aucune correspondance trouvée
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
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
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                      <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
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
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className={`w-3 h-3 rounded-full ${transaction.reconciled ? 'bg-green-500' : 'bg-orange-500'}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {transaction.description}
                            </p>
                            <span className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatAmount(transaction.amount)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {transaction.date}
                            </span>
                            <span className="font-mono text-xs">{transaction.reference}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 ml-4">
                        <Badge className={getStatusColor(transaction.reconciled, transaction.suggested_matches?.length > 0)}>
                          {transaction.reconciled ? 'Réconciliée' : 
                           transaction.suggested_matches?.length > 0 ? 'Suggestions' : 'En attente'}
                        </Badge>
                        
                        {!transaction.reconciled && transaction.suggested_matches?.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {transaction.suggested_matches.length} suggestion{transaction.suggested_matches.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Aucune transaction trouvée
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
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
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Interface de réconciliation manuelle
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
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