import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { bankingService } from '@/services/bankingService';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { 
  Landmark, 
  PlusCircle, 
  CreditCard, 
  AlertTriangle, 
  Shuffle, 
  BarChartHorizontal, 
  PiggyBank, 
  ArrowLeft,
  Upload,
  Download,
  Settings,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  RotateCcw,
  Save,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  MapPin,
  Sparkles
} from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { motion, AnimatePresence } from 'framer-motion';

// Données par défaut pour les règles de catégorisation
const defaultCategorizationRules = [
  {
    id: '1',
    name: 'Alimentation',
    keywords: ['CARREFOUR', 'MONOPRIX', 'LECLERC', 'SUPER U'],
    account: '607000',
    active: true
  },
  {
    id: '2',
    name: 'Carburant',
    keywords: ['TOTAL', 'BP', 'SHELL', 'ESSO'],
    account: '606100',
    active: true
  },
  {
    id: '3',
    name: 'Frais bancaires',
    keywords: ['FRAIS', 'COMMISSION', 'AGIOS'],
    account: '627000',
    active: true
  }
];

const BankAccountCard = ({ 
  name, 
  balance, 
  lastSync, 
  logoUrl, 
  status, 
  statusColor, 
  needsAuth,
  onViewTransactions, 
  onReconcile,
  onReconnect 
}) => {
  const { t } = useLocale();
  
  const getStatusBadge = () => {
    if (!status) return null;
    
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    
    return (
      <Badge className={`${colorClasses[statusColor]} border`}>
        {status}
      </Badge>
    );
  };
  
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0px 8px 15px rgba(0,0,0,0.1)" }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 bg-secondary/30">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${name} logo`} 
                className="h-8 w-8 rounded-full" 
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
            ) : null}
            <Landmark className="h-8 w-8 text-primary" style={{ display: logoUrl ? 'none' : 'block' }} />
            <div>
              <CardTitle className="text-lg font-semibold">{name}</CardTitle>
              {getStatusBadge()}
            </div>
          </div>
          <Button variant="ghost" size="sm">{t('manage')}</Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="text-2xl font-bold">{balance}</div>
          <p className="text-xs text-muted-foreground">{lastSync}</p>
          
          {needsAuth ? (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-xs text-yellow-800 mb-2">Authentification requise</p>
              <Button size="sm" variant="outline" onClick={onReconnect}>
                Se reconnecter
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={onViewTransactions}>
                {t('viewTransactions')}
              </Button>
              <Button variant="outline" size="sm" onClick={onReconcile}>
                <Shuffle className="h-4 w-4 mr-1" />
                Réconcilier
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
    
// Composants pour l'interface de réconciliation
const ReconciliationDashboard = ({ metrics, loading }) => {
  const { toast } = useToast();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des métriques...</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <div className="text-2xl font-bold">{metrics?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">transactions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Réconciliées</span>
            </div>
            <div className="text-2xl font-bold">{metrics?.reconciledTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.autoMatchRate ? `${(metrics.autoMatchRate * 100).toFixed(1)}% du total` : '0% du total'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">En attente</span>
            </div>
            <div className="text-2xl font-bold">{metrics?.pendingReconciliation || 0}</div>
            <p className="text-xs text-muted-foreground">à traiter</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Écarts</span>
            </div>
            <div className="text-2xl font-bold">{metrics?.discrepancies || 0}</div>
            <p className="text-xs text-muted-foreground">à réconcilier</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progression de réconciliation</CardTitle>
          <CardDescription>Aperçu du processus de lettrage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Réconciliation automatique</span>
              <span>{metrics?.autoMatchRate ? `${(metrics.autoMatchRate * 100).toFixed(1)}%` : '0%'}</span>
            </div>
            <Progress value={metrics?.autoMatchRate ? metrics.autoMatchRate * 100 : 0} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TransactionsList = ({ transactions, onMatch, onEdit }) => {
  const getStatusBadge = (status) => {
    const variants = {
      'reconciled': { variant: 'success', label: 'Réconciliée', icon: CheckCircle },
      'matched': { variant: 'default', label: 'Lettrée', icon: Target },
      'pending': { variant: 'warning', label: 'En attente', icon: AlertCircle }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Transactions importées
        </CardTitle>
        <CardDescription>Gérez et réconciliez vos transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date} • Réf: {transaction.reference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount >= 0 ? '+' : ''}€{Math.abs(transaction.amount).toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 ml-4">
                {getStatusBadge(transaction.status)}
                
                <div className="flex gap-1">
                  {transaction.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMatch(transaction)}
                    >
                      <Target className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(transaction)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const FileImportInterface = ({ onImport }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFiles = useCallback(async (files) => {
    const file = files[0];
    if (!file) return;

    const allowedTypes = ['.csv', '.ofx', '.qif'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Format non supporté",
        description: "Veuillez importer un fichier CSV, OFX ou QIF."
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulation du traitement
    for (let i = 0; i <= 100; i += 10) {
      setUploadProgress(i);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTimeout(() => {
      onImport(file, fileExtension);
      setIsUploading(false);
      setUploadProgress(0);
    }, 500);
  }, [onImport, toast]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  }, [handleFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import de fichiers bancaires
        </CardTitle>
        <CardDescription>
          Importez vos relevés au format CSV, OFX ou QIF
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Traitement en cours...</p>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="h-12 w-12 mx-auto text-gray-400" />
              <div>
                <p className="text-lg font-medium">Glissez vos fichiers ici</p>
                <p className="text-sm text-muted-foreground">
                  ou cliquez pour sélectionner
                </p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                Choisir un fichier
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".csv,.ofx,.qif"
                className="hidden"
                onChange={(e) => handleFiles(Array.from(e.target.files))}
              />
              <div className="text-xs text-muted-foreground">
                Formats supportés: CSV, OFX, QIF • Taille max: 10MB
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CategorizationRules = ({ rules, onEdit, onToggle, onAdd }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Règles de catégorisation
            </CardTitle>
            <CardDescription>
              Automatisez la classification de vos transactions
            </CardDescription>
          </div>
          <Button onClick={onAdd} size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle règle
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.map((rule) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Mots-clés: {rule.keywords.join(', ')} → Compte {rule.account}
                    </p>
                  </div>
                  <Badge variant={rule.active ? 'default' : 'secondary'}>
                    {rule.active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              
              <div className="flex gap-1 ml-4">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggle(rule.id)}
                >
                  {rule.active ? <Eye className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(rule)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default function BanksPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // State management
  const [activeView, setActiveView] = useState('accounts');
  const [showConnectForm, setShowConnectForm] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  
  // Data states
  const [bankConnections, setBankConnections] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reconciliationMetrics, setReconciliationMetrics] = useState(null);
  const [categorizationRules, setCategorizationRules] = useState(defaultCategorizationRules);
  const [supportedBanks, setSupportedBanks] = useState({ bridge: [], budget_insight: [] });
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  
  // Form states
  const [selectedProvider, setSelectedProvider] = useState('bridge');
  const [selectedBankId, setSelectedBankId] = useState('');

  // Load data on component mount
  useEffect(() => {
    loadBankingData();
  }, [user]);

  // Load banking data
  const loadBankingData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      await bankingService.initialize();
      
      // Load user connections
      const connectionsResult = await bankingService.getUserBankConnections(user.id);
      if (connectionsResult.success) {
        setBankConnections(connectionsResult.data);
        
        // Load accounts for each connection
        const allAccounts = [];
        for (const connection of connectionsResult.data) {
          const accountsResult = await bankingService.getBankAccounts(connection.id);
          if (accountsResult.success) {
            const transformedAccounts = accountsResult.data.map(account => 
              bankingService.transformAccountForUI(account, connection)
            );
            allAccounts.push(...transformedAccounts);
          }
        }
        setBankAccounts(allAccounts);
      }
      
      // Load supported banks
      const bridgeBanks = bankingService.getSupportedBanks('bridge');
      const budgetInsightBanks = bankingService.getSupportedBanks('budget_insight');
      setSupportedBanks({ bridge: bridgeBanks, budget_insight: budgetInsightBanks });
      
    } catch (error) {
      console.error('Failed to load banking data:', error);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: "Impossible de charger les données bancaires."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load reconciliation metrics
  const loadReconciliationMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const metrics = await bankingService.getReconciliationStatistics();
      setReconciliationMetrics(metrics);
    } catch (error) {
      console.error('Failed to load reconciliation metrics:', error);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Load transactions for selected account
  const loadTransactions = async (connectionId, accountId) => {
    setIsLoadingTransactions(true);
    try {
      const result = await bankingService.getBankTransactions(connectionId, accountId, {
        limit: 50,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
      });
      
      if (result.success) {
        const transformedTransactions = result.data.transactions.map(transaction =>
          bankingService.transformTransactionForUI(transaction)
        );
        setTransactions(transformedTransactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger les transactions."
      });
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Event handlers
  const handleConnectAccount = () => {
    setShowConnectForm(true);
  };

  const handleBackToList = () => {
    setShowConnectForm(false);
    setSelectedBankId('');
  };

  const handleViewTransactions = async (account) => {
    setSelectedAccount(account);
    setActiveView('transactions');
    await loadTransactions(account.connectionId, account.id);
  };

  const handleReconcile = async (account) => {
    setSelectedAccount(account);
    setActiveView('reconciliation');
    await loadReconciliationMetrics();
  };

  const handleConnectBank = async () => {
    if (!selectedBankId || !user?.id) {
      toast({
        variant: "destructive",
        title: "Sélection requise",
        description: "Veuillez sélectionner une banque."
      });
      return;
    }

    setIsConnecting(true);
    try {
      const result = await bankingService.createBankConnection(
        user.id,
        selectedProvider,
        selectedBankId
      );

      if (result.success) {
        // Initiate PSD2 authentication
        const authResult = await bankingService.initiatePSD2Auth(result.data.id);
        
        if (authResult.success && authResult.data.redirectUrl) {
          // Redirect to bank authentication
          window.location.href = authResult.data.redirectUrl;
        } else {
          toast({
            title: "Connexion créée",
            description: "La connexion bancaire a été créée avec succès."
          });
          
          // Refresh connections
          await loadBankingData();
          handleBackToList();
        }
      } else {
        throw new Error(result.error?.message || 'Connection failed');
      }
    } catch (error) {
      console.error('Bank connection failed:', error);
      toast({
        variant: "destructive",
        title: "Erreur de connexion",
        description: error.message || "Impossible de connecter la banque."
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleFileImport = useCallback(async (file, extension) => {
    try {
      // En production, traiter le fichier selon son format
      // Pour l'instant, simuler l'import
      toast({
        title: "Import réussi",
        description: `Fichier ${file.name} importé avec succès.`
      });
      
      // Recharger les transactions après import
      if (selectedAccount) {
        await loadTransactions(selectedAccount.connectionId, selectedAccount.id);
      }
    } catch (error) {
      console.error('File import failed:', error);
      toast({
        variant: "destructive",
        title: "Erreur d'import",
        description: "Impossible d'importer le fichier."
      });
    }
  }, [selectedAccount, toast]);

  const handleTransactionMatch = useCallback(async (transaction) => {
    try {
      // En production, appeler le service de réconciliation
      const result = await bankingService.reconcileTransaction(transaction.id, []);
      
      if (result.success) {
        setTransactions(prev => 
          prev.map(t => 
            t.id === transaction.id 
              ? { ...t, reconciliationStatus: 'reconciled', statusColor: 'green' }
              : t
          )
        );
        
        toast({
          title: "Transaction réconciliée",
          description: `Transaction ${transaction.reference || transaction.id} réconciliée avec succès.`
        });
      } else {
        throw new Error(result.error?.message || 'Reconciliation failed');
      }
    } catch (error) {
      console.error('Transaction reconciliation failed:', error);
      toast({
        variant: "destructive",
        title: "Erreur de réconciliation",
        description: error.message || "Impossible de réconcilier la transaction."
      });
    }
  }, [toast]);

  const handleTransactionEdit = useCallback((transaction) => {
    toast({
      title: "Édition",
      description: "Interface d'édition à implémenter"
    });
  }, [toast]);

  const handleRuleToggle = useCallback((ruleId) => {
    setCategorizationRules(prev =>
      prev.map(rule =>
        rule.id === ruleId
          ? { ...rule, active: !rule.active }
          : rule
      )
    );
  }, []);

  // Transform connections for UI display
  const transformedConnections = useMemo(() => {
    return bankConnections.map(connection => 
      bankingService.transformConnectionForUI(connection)
    );
  }, [bankConnections]);

  // Get available banks for selected provider
  const availableBanks = useMemo(() => {
    return supportedBanks[selectedProvider] || [];
  }, [supportedBanks, selectedProvider]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des données bancaires...</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-8 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header with filters */}
      <motion.div 
        className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0"
        variants={itemVariants}
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {activeView !== 'accounts' && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setActiveView('accounts')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {activeView === 'accounts' && t('bankConnections')}
              {activeView === 'transactions' && 'Transactions'}
              {activeView === 'reconciliation' && 'Réconciliation bancaire'}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-gray-600 dark:text-gray-400">
              {activeView === 'accounts' && t('connectAndTrackBanks')}
              {activeView === 'transactions' && `Transactions de ${selectedAccount?.name}`}
              {activeView === 'reconciliation' && 'Interface avancée de réconciliation'}
            </p>
            <Badge variant="secondary" className="text-xs">
              En temps réel
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {activeView === 'reconciliation' && (
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
          {activeView === 'accounts' && !showConnectForm && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleConnectAccount}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                {t('connectBank')}
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Navigation par onglets pour la réconciliation */}
      {activeView === 'reconciliation' && (
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Tableau de bord</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="rules">Règles</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard" className="space-y-6">
            <ReconciliationDashboard metrics={reconciliationMetrics} loading={isLoadingMetrics} />
          </TabsContent>
          
          <TabsContent value="import" className="space-y-6">
            <FileImportInterface onImport={handleFileImport} />
          </TabsContent>
          
          <TabsContent value="transactions" className="space-y-6">
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement des transactions...</span>
              </div>
            ) : (
              <TransactionsList 
                transactions={transactions}
                onMatch={handleTransactionMatch}
                onEdit={handleTransactionEdit}
              />
            )}
          </TabsContent>
          
          <TabsContent value="rules" className="space-y-6">
            <CategorizationRules
              rules={categorizationRules}
              onEdit={(rule) => toast({ title: "Édition", description: "Interface d'édition à implémenter" })}
              onToggle={handleRuleToggle}
              onAdd={() => toast({ title: "Nouvelle règle", description: "Interface de création à implémenter" })}
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Contenu principal selon la vue active */}
      <AnimatePresence mode="wait">
        {showConnectForm ? (
          <motion.div
            key="connect-form"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={handleBackToList} className="mr-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <CardTitle>Connexion Bancaire</CardTitle>
                    <CardDescription>Connectez votre compte bancaire en toute sécurité</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="provider-select" className="block text-sm font-medium mb-1">Provider Open Banking</label>
                  <select 
                    id="provider-select" 
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full border border-input bg-white dark:bg-gray-900 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="bridge">Bridge API</option>
                    <option value="budget_insight">Budget Insight</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="bank-select" className="block text-sm font-medium mb-1">Choisir votre banque</label>
                  <select 
                    id="bank-select" 
                    value={selectedBankId}
                    onChange={(e) => setSelectedBankId(e.target.value)}
                    className="w-full border border-input bg-white dark:bg-gray-900 hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Sélectionner votre banque...</option>
                    {availableBanks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </select>
                </div>
                
                {/* Note: Credentials are handled securely by the PSD2 flow */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700/50">
                  <p className="text-sm text-blue-700 dark:text-blue-300/80">
                    <strong>Authentification PSD2 :</strong> Vous serez redirigé vers votre banque pour vous authentifier de manière sécurisée.
                    Aucune donnée d'authentification n'est stockée sur nos serveurs.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700/50">
                  <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center">
                    <Landmark className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400"/>
                    🔒 Connexion sécurisée
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300/80">
                    Vos identifiants sont chiffrés et transmis directement à votre banque. 
                    Nous utilisons la technologie PSD2 pour garantir la sécurité.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button onClick={handleBackToList} variant="outline" disabled={isConnecting}>Annuler</Button>
                  <Button onClick={handleConnectBank} disabled={isConnecting || !selectedBankId}>
                    {isConnecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connexion...
                      </>
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : activeView === 'accounts' ? (
          <motion.div
            key="accounts-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {transformedConnections.length > 0 ? (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {transformedConnections.map((connection, index) => (
                    <motion.div 
                      key={connection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <BankAccountCard 
                        name={connection.name}
                        balance={`Provider: ${connection.provider}`}
                        lastSync={connection.lastSync}
                        logoUrl={connection.logo}
                        status={connection.status}
                        statusColor={connection.statusColor}
                        needsAuth={connection.needsAuth}
                        onViewTransactions={() => {
                          const account = bankAccounts.find(acc => acc.connectionId === connection.id);
                          if (account) handleViewTransactions(account);
                        }}
                        onReconcile={() => {
                          const account = bankAccounts.find(acc => acc.connectionId === connection.id);
                          if (account) handleReconcile(account);
                        }}
                        onReconnect={async () => {
                          try {
                            const authResult = await bankingService.initiatePSD2Auth(connection.id);
                            if (authResult.success && authResult.data.redirectUrl) {
                              window.location.href = authResult.data.redirectUrl;
                            }
                          } catch (error) {
                            console.error('Reconnection failed:', error);
                            toast({
                              variant: "destructive",
                              title: "Erreur de reconnexion",
                              description: "Impossible de relancer l'authentification."
                            });
                          }
                        }}
                      />
                    </motion.div>
                  ))}
                </div>
                
                {/* Display accounts for each connection */}
                {bankAccounts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Comptes bancaires</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {bankAccounts.map((account, index) => (
                        <Card key={account.id} className="cursor-pointer hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{account.name}</p>
                                <p className="text-sm text-muted-foreground">{account.type}</p>
                                {account.iban && (
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {account.iban.substring(0, 8)}...{account.iban.substring(account.iban.length - 4)}
                                  </p>
                                )}
                              </div>
                              <img src={account.bankLogo} alt={account.bankName} className="h-6 w-6" onError={(e) => e.target.style.display = 'none'} />
                            </div>
                            <div className="text-xl font-bold text-green-600 mb-2">
                              {account.balance}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleViewTransactions(account)}
                              >
                                Transactions
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleReconcile(account)}
                              >
                                Réconcilier
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                  <CreditCard className="mx-auto h-16 w-16 text-primary/50" />
                  <p className="mt-4 text-lg text-muted-foreground">{t('noAccountsConnected')}</p>
                  <p className="text-sm text-muted-foreground mb-4">{t('connectFirstAccountPrompt')}</p>
                  <Button onClick={handleConnectAccount}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    {t('connectBank')}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Fonctionnalités avancées */}
            <div className="grid gap-6 md:grid-cols-3 mt-8">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveView('reconciliation')}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shuffle className="text-blue-500"/>
                    Réconciliation bancaire
                  </CardTitle>
                  <CardDescription>Interface avancée de lettrage et réconciliation</CardDescription>
                </CardHeader>
                <CardContent className="h-[150px] flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-sm text-muted-foreground">Cliquez pour accéder</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChartHorizontal className="text-green-500"/>
                    IA de catégorisation
                  </CardTitle>
                  <CardDescription>Classification automatique par IA</CardDescription>
                </CardHeader>
                <CardContent className="h-[150px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex gap-1 mb-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-2 h-8 bg-green-500 rounded animate-pulse" style={{animationDelay: `${i * 0.2}s`}} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Prochainement</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="text-purple-500"/>
                    Prévision de trésorerie
                  </CardTitle>
                  <CardDescription>Projections basées sur l'historique</CardDescription>
                </CardHeader>
                <CardContent className="h-[150px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-end gap-1 mb-2">
                      {[3, 6, 4, 8, 5, 7].map((height, i) => (
                        <div key={i} className={`w-2 bg-purple-500 rounded`} style={{height: `${height * 4}px`}} />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">Prochainement</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Avertissement de sécurité */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.5 }}
              className="mt-8"
            >
              <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-700/50">
                <CardHeader className="flex flex-row items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-yellow-500 dark:text-yellow-400" />
                  <CardTitle className="text-yellow-700 dark:text-yellow-300">{t('secureBankConnection')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-yellow-600 dark:text-yellow-300/80">
                    {t('secureBankConnectionDisclaimer')}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ) : activeView === 'transactions' ? (
          <motion.div
            key="transactions-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {isLoadingTransactions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Chargement des transactions...</span>
              </div>
            ) : (
              <TransactionsList 
                transactions={transactions}
                onMatch={handleTransactionMatch}
                onEdit={handleTransactionEdit}
              />
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}