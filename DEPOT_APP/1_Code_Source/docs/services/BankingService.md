# BankingService - Intégration Bancaire Open Banking

## Vue d'ensemble

Le `BankingService` est le service unifié pour l'intégration bancaire dans CassKai. Il utilise les APIs Open Banking (PSD2) pour synchroniser les comptes, transactions et effectuer la réconciliation automatique avec la comptabilité.

## Architecture

```typescript
BankingService (Singleton)
├── OpenBankingManager
│   ├── Bridge API Provider
│   ├── Budget Insight Provider  
│   └── Future PDP Providers
├── Connection Management
├── Account Synchronization
├── Transaction Processing
└── Reconciliation Engine
```

## Providers Supportés

### 1. Bridge API
- **Utilisation**: Agrégateur bancaire principal
- **Couverture**: 300+ banques européennes
- **Fonctionnalités**: Comptes, transactions, virements
- **Configuration**:
  ```typescript
  bridge: {
    clientId: process.env.REACT_APP_BRIDGE_CLIENT_ID,
    clientSecret: process.env.REACT_APP_BRIDGE_CLIENT_SECRET,
    baseUrl: 'https://api.bridgeapi.io',
    version: '2021-06-01'
  }
  ```

### 2. Budget Insight
- **Utilisation**: Provider alternatif/complémentaire
- **Couverture**: Banques françaises et européennes
- **Fonctionnalités**: Analyse financière, catégorisation
- **Configuration**:
  ```typescript
  budgetInsight: {
    clientId: process.env.REACT_APP_BUDGET_INSIGHT_CLIENT_ID,
    clientSecret: process.env.REACT_APP_BUDGET_INSIGHT_CLIENT_SECRET,
    baseUrl: 'https://api.budget-insight.com'
  }
  ```

## Fonctionnalités Principales

### 1. Gestion des Connexions Bancaires

#### Créer une connexion
```typescript
const bankingService = BankingService.getInstance();

// Initialisation (automatique au premier usage)
await bankingService.initialize();

// Créer une nouvelle connexion
const result = await bankingService.createBankConnection(
  'user-123',
  'bridge', // ou 'budget_insight'
  'bnp_paribas'
);

if (result.success) {
  console.log('Connection créée:', result.data.id);
  // Rediriger vers l'authentification bancaire
  window.location.href = result.data.authUrl;
}
```

#### Récupérer les connexions
```typescript
// Toutes les connexions d'un utilisateur
const connections = await bankingService.getUserBankConnections('user-123');

// Connexion spécifique
const connection = await bankingService.getBankConnection('conn-456');

// Rafraîchir une connexion
await bankingService.refreshBankConnection('conn-456');
```

### 2. Gestion des Comptes

```typescript
// Récupérer les comptes d'une connexion
const accounts = await bankingService.getBankAccounts('conn-456');

if (accounts.success) {
  accounts.data.forEach(account => {
    console.log(`${account.name}: ${account.balance} ${account.currency}`);
  });
}

// Format UI optimisé
const uiAccount = bankingService.transformAccountForUI(account, connection);
/*
{
  id: 'acc-789',
  name: 'Compte Courant Pro',
  type: 'Compte courant',
  balance: '15 420,50 €',
  iban: 'FR76 1234 5678 9012 3456 789',
  bankName: 'BNP Paribas',
  bankLogo: '/banks/bnp.png',
  lastUpdate: 'Il y a 2h'
}
*/
```

### 3. Synchronisation des Transactions

#### Récupération des transactions
```typescript
// Transactions d'un compte avec filtrage
const result = await bankingService.getBankTransactions(
  'conn-456',
  'acc-789',
  {
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    limit: 100
  }
);

if (result.success) {
  const { transactions, nextCursor } = result.data;
  console.log(`${transactions.length} transactions récupérées`);
}
```

#### Synchronisation en temps réel
```typescript
// Synchronisation forcée
const syncResult = await bankingService.syncBankTransactions('conn-456', 'acc-789');

// Format UI optimisé
transactions.forEach(transaction => {
  const uiTransaction = bankingService.transformTransactionForUI(transaction);
  console.log(`${uiTransaction.date}: ${uiTransaction.description} - ${uiTransaction.formattedAmount}`);
});
```

### 4. Authentification PSD2

```typescript
// Initier l'authentification forte
const authFlow = await bankingService.initiatePSD2Auth(
  'conn-456',
  'https://myapp.com/banking/callback'
);

if (authFlow.success) {
  // Redirection vers la banque
  window.location.href = authFlow.data.redirectUrl;
}

// Traitement du callback (dans votre route callback)
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');

// Finaliser l'authentification
// (géré automatiquement par le webhook handler)
```

### 5. Réconciliation Automatique

```typescript
// Réconcilier une transaction avec des écritures comptables
const reconciliation = await bankingService.reconcileTransaction(
  'trans-123',
  [
    {
      accountCode: '512000', // Compte banque
      debit: 1500,
      credit: 0,
      description: 'Virement client ABC'
    },
    {
      accountCode: '411000', // Compte client
      debit: 0, 
      credit: 1500,
      description: 'Règlement facture #2024-001'
    }
  ]
);

if (reconciliation.success) {
  console.log('Réconciliation réussie:', reconciliation.data);
}
```

### 6. Export Comptable

```typescript
// Créer un export pour la comptabilité
const exportResult = await bankingService.createAccountingExport(
  'user-123',
  'sage-standard', // Format de sortie
  {
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-03-31')
    },
    accountIds: ['acc-789', 'acc-012'],
    includeReconciled: true,
    includeUnreconciled: false
  }
);

if (exportResult.success) {
  // Télécharger le fichier généré
  const blob = new Blob([exportResult.data.content], { 
    type: 'application/xml' 
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `export_${new Date().toISOString().split('T')[0]}.xml`;
  a.click();
}
```

## Webhooks et Événements

### Configuration des Webhooks

```typescript
// Les webhooks sont configurés automatiquement
const webhookConfig = {
  enabled: true,
  retryAttempts: 3,
  timeoutMs: 5000
};

// URL de réception des webhooks
// POST /api/webhooks/banking/:providerId
```

### Traitement des Webhooks
```typescript
// Dans votre API route
app.post('/api/webhooks/banking/:providerId', async (req, res) => {
  const { providerId } = req.params;
  const signature = req.headers['x-webhook-signature'];
  
  try {
    const result = await bankingService.processWebhook(
      providerId,
      req.body,
      signature,
      req.headers
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook processing failed:', error);
    res.status(400).json({ error: error.message });
  }
});
```

### Types d'Événements
- **connection.updated**: Statut de connexion modifié
- **account.updated**: Solde ou infos de compte modifiés
- **transaction.created**: Nouvelle transaction détectée
- **transaction.updated**: Transaction modifiée (réconciliation)

## Configuration et Initialisation

### Configuration Complète
```typescript
const config = {
  providers: {
    bridge: {
      clientId: 'your-bridge-client-id',
      clientSecret: 'your-bridge-secret',
      baseUrl: 'https://api.bridgeapi.io',
      version: '2021-06-01',
      webhookSecret: 'your-webhook-secret'
    },
    budgetInsight: {
      clientId: 'your-budget-insight-client-id', 
      clientSecret: 'your-budget-insight-secret',
      baseUrl: 'https://api.budget-insight.com',
      webhookSecret: 'your-webhook-secret'
    }
  },
  security: {
    encryptionKey: 'your-32-char-encryption-key',
    tokenRotationInterval: 24 * 60 * 60 * 1000, // 24h
    auditLogRetention: 30 * 24 * 60 * 60 * 1000  // 30j
  },
  reconciliation: {
    autoMatchThreshold: 0.85,      // 85% de similarité
    reviewRequiredThreshold: 0.6,   // Seuil de révision manuelle
    maxDiscrepancyAmount: 0.01,     // Écart maximum 1 centime
    maxDiscrepancyDays: 7          // Écart maximum 7 jours
  }
};

await bankingService.initialize(config);
```

## Types de Données

### BankConnection
```typescript
interface BankConnection {
  id: string;                    // ID unique de la connexion
  userId: string;                // Propriétaire
  providerName: string;          // 'bridge' | 'budget_insight'
  bankName: string;              // Nom de la banque
  bankLogo?: string;             // Logo de la banque
  status: 'connected' | 'connecting' | 'error' | 'expired' | 'pending_auth';
  authUrl?: string;              // URL d'authentification
  lastSync?: Date;               // Dernière synchronisation
  createdAt: Date;
  updatedAt: Date;
}
```

### BankAccount  
```typescript
interface BankAccount {
  id: string;                    // ID unique du compte
  connectionId: string;          // Connexion parente
  name: string;                  // Nom du compte
  displayName?: string;          // Nom affiché personnalisé
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'business';
  balance: number;               // Solde actuel
  availableBalance?: number;     // Solde disponible
  currency: string;              // Devise (EUR, USD, etc.)
  iban?: string;                 // IBAN si disponible
  accountNumber?: string;        // Numéro de compte
  isActive: boolean;             // Compte actif
  createdAt: Date;
  updatedAt: Date;
}
```

### BankTransaction
```typescript
interface BankTransaction {
  id: string;                    // ID unique de la transaction
  accountId: string;             // Compte source
  date: Date;                    // Date de la transaction
  description: string;           // Description nettoyée
  originalDescription: string;   // Description originale banque
  amount: number;                // Montant (négatif = débit)
  currency: string;              // Devise
  type: 'debit' | 'credit';     // Type de mouvement
  status: 'posted' | 'pending' | 'canceled'; // Statut
  category?: string;             // Catégorie automatique
  counterparty?: string;         // Contrepartie
  reference?: string;            // Référence bancaire
  isReconciled: boolean;         // Réconcilié en comptabilité
  reconciliationData?: any;      // Données de réconciliation
  createdAt: Date;
  updatedAt: Date;
}
```

### OpenBankingResponse
```typescript
interface OpenBankingResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    provider: string;
  };
}
```

## Banques Supportées

### Via Bridge API
- **France**: BNP Paribas, Crédit Agricole, Société Générale, LCL, Banque Populaire
- **Europe**: ING, Santander, Deutsche Bank, UniCredit, etc.
- **Néobanques**: Revolut, N26, Qonto, etc.

### Via Budget Insight  
- **France**: Crédit Mutuel, La Banque Postale, Caisse d'Épargne, HSBC France
- **Spécialisées**: Boursorama, Fortuneo, Hello Bank, etc.

```typescript
// Récupérer la liste des banques supportées
const bridgeBanks = bankingService.getSupportedBanks('bridge');
const budgetInsightBanks = bankingService.getSupportedBanks('budget_insight');

console.log(`${bridgeBanks.length} banques via Bridge`);
console.log(`${budgetInsightBanks.length} banques via Budget Insight`);
```

## Gestion des Erreurs

### Types d'Erreurs Communes

```typescript
try {
  await bankingService.createBankConnection(userId, providerId, bankId);
} catch (error) {
  switch (error.code) {
    case 'NOT_INITIALIZED':
      console.error('Service non initialisé');
      await bankingService.initialize();
      break;
      
    case 'PROVIDER_ERROR':
      console.error('Erreur du provider bancaire:', error.message);
      // Réessayer avec un autre provider
      break;
      
    case 'AUTH_REQUIRED':
      console.error('Authentification requise');
      // Rediriger vers l'auth PSD2
      break;
      
    case 'RATE_LIMITED':
      console.error('Limite de taux atteinte');
      // Attendre et réessayer
      setTimeout(() => retry(), 60000);
      break;
      
    case 'CONNECTION_ERROR':
      console.error('Erreur de connexion réseau');
      // Mode offline ou fallback
      break;
  }
}
```

### Gestion Gracieuse
```typescript
// Le service gère automatiquement les erreurs
const connections = await bankingService.getUserBankConnections('user-123');

// Même si le service n'est pas initialisé, retourne une réponse sûre
if (!connections.success) {
  console.log('Service indisponible, afficher le cache local');
}
```

## Monitoring et Statistiques

### Statistiques de Synchronisation
```typescript
const syncStats = await bankingService.getSyncStatistics();
/*
{
  totalConnections: 15,
  activeConnections: 12,
  lastSyncSuccessRate: 0.94,
  avgSyncDuration: 2.3, // secondes
  errorsLast24h: 3
}
*/
```

### Statistiques de Réconciliation
```typescript
const reconStats = await bankingService.getReconciliationStatistics();
/*
{
  totalTransactions: 1247,
  reconciledTransactions: 1199,
  pendingReconciliation: 48,
  autoMatchRate: 0.87,
  avgProcessingTime: 1.2 // secondes
}
*/
```

### Health Check
```typescript
const health = await bankingService.healthCheck();
/*
{
  status: 'healthy' | 'degraded' | 'down',
  providers: {
    bridge: { status: 'healthy', latency: 245 },
    budgetInsight: { status: 'degraded', latency: 1240 }
  },
  lastError: null,
  uptime: '99.2%'
}
*/
```

## Sécurité

### Chiffrement des Données
```typescript
// Les tokens d'accès sont chiffrés avec AES-256
// Clé de chiffrement configurée dans security.encryptionKey
// Rotation automatique selon tokenRotationInterval
```

### Audit et Logging
```typescript
// Toutes les opérations sont auditées
await bankingService.createBankConnection(userId, providerId, bankId);
// → Log: [AUDIT] User user-123 created connection to bnp_paribas via bridge

// Rétention configurable des logs d'audit
const auditRetention = 30 * 24 * 60 * 60 * 1000; // 30 jours
```

### Conformité PSD2
- **Authentification forte**: SCA (Strong Customer Authentication)
- **Consentement explicite**: Collecte et gestion des consentements
- **Données minimales**: Accès aux seules données nécessaires
- **Révocation**: Possibilité de révoquer l'accès à tout moment

## Bonnes Pratiques

### 1. Initialisation
```typescript
// Initialiser une seule fois au démarrage de l'app
useEffect(() => {
  const initBanking = async () => {
    try {
      await bankingService.initialize();
    } catch (error) {
      console.error('Banking service init failed:', error);
      // Continuer sans les fonctionnalités bancaires
    }
  };
  
  initBanking();
}, []);
```

### 2. Gestion des États de Connexion
```typescript
// Surveiller le statut des connexions
const connections = await bankingService.getUserBankConnections(userId);

connections.data?.forEach(connection => {
  const uiConnection = bankingService.transformConnectionForUI(connection);
  
  if (uiConnection.needsAuth) {
    // Afficher une alerte pour renouveler l'authentification
    showAuthRenewalAlert(connection);
  }
});
```

### 3. Synchronisation Périodique
```typescript
// Synchroniser automatiquement toutes les 4 heures
setInterval(async () => {
  const connections = await bankingService.getUserBankConnections(userId);
  
  for (const connection of connections.data || []) {
    if (connection.status === 'connected') {
      const accounts = await bankingService.getBankAccounts(connection.id);
      
      for (const account of accounts.data || []) {
        await bankingService.syncBankTransactions(connection.id, account.id);
      }
    }
  }
}, 4 * 60 * 60 * 1000);
```

### 4. UX Optimisée
```typescript
// Interface utilisateur réactive
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

const handleCreateConnection = async (bankId) => {
  setIsLoading(true);
  setError(null);
  
  try {
    const result = await bankingService.createBankConnection(userId, 'bridge', bankId);
    
    if (result.success) {
      // Redirection en popup pour préserver le contexte
      const popup = window.open(result.data.authUrl, 'bankAuth', 'width=600,height=700');
      
      // Écouter la fermeture de la popup
      const checkClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkClosed);
          // Rafraîchir les données
          refreshConnections();
        }
      }, 1000);
    }
  } catch (error) {
    setError(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

## Exemple Complet d'Intégration

```typescript
import { BankingService } from '@/services/bankingService';
import { useState, useEffect } from 'react';

const BankingDashboard = ({ userId }) => {
  const [connections, setConnections] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const bankingService = BankingService.getInstance();

  useEffect(() => {
    loadBankingData();
  }, [userId]);

  const loadBankingData = async () => {
    try {
      setIsLoading(true);

      // Charger les connexions
      const connectionsResult = await bankingService.getUserBankConnections(userId);
      if (connectionsResult.success) {
        setConnections(connectionsResult.data);

        // Charger les comptes pour chaque connexion
        const allAccounts = [];
        const allTransactions = [];

        for (const connection of connectionsResult.data) {
          if (connection.status === 'connected') {
            const accountsResult = await bankingService.getBankAccounts(connection.id);
            
            if (accountsResult.success) {
              allAccounts.push(...accountsResult.data);

              // Charger les transactions récentes
              for (const account of accountsResult.data) {
                const transactionsResult = await bankingService.getBankTransactions(
                  connection.id,
                  account.id,
                  {
                    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 jours
                    limit: 50
                  }
                );

                if (transactionsResult.success) {
                  allTransactions.push(...transactionsResult.data.transactions);
                }
              }
            }
          }
        }

        setAccounts(allAccounts);
        setTransactions(allTransactions);
      }
    } catch (error) {
      console.error('Erreur chargement données bancaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBank = async (bankId, providerId = 'bridge') => {
    try {
      const result = await bankingService.createBankConnection(userId, providerId, bankId);
      
      if (result.success) {
        // Ouvrir l'authentification bancaire
        window.open(result.data.authUrl, 'bankAuth', 'width=600,height=700');
      }
    } catch (error) {
      console.error('Erreur ajout banque:', error);
    }
  };

  if (isLoading) {
    return <div>Chargement des données bancaires...</div>;
  }

  return (
    <div className="banking-dashboard">
      {/* Connexions bancaires */}
      <section>
        <h2>Connexions bancaires ({connections.length})</h2>
        {connections.map(connection => {
          const uiConnection = bankingService.transformConnectionForUI(connection);
          return (
            <div key={connection.id} className={`connection status-${uiConnection.statusColor}`}>
              <img src={uiConnection.logo} alt={uiConnection.name} />
              <span>{uiConnection.name}</span>
              <span className={`status ${uiConnection.statusColor}`}>
                {uiConnection.status}
              </span>
              <span className="last-sync">{uiConnection.lastSync}</span>
            </div>
          );
        })}
        
        <button onClick={() => handleAddBank('bnp_paribas')}>
          Ajouter une banque
        </button>
      </section>

      {/* Comptes */}
      <section>
        <h2>Comptes ({accounts.length})</h2>
        {accounts.map(account => {
          const connection = connections.find(c => c.id === account.connectionId);
          const uiAccount = bankingService.transformAccountForUI(account, connection);
          return (
            <div key={account.id} className="account">
              <span>{uiAccount.name}</span>
              <span>{uiAccount.type}</span>
              <span className="balance">{uiAccount.balance}</span>
              <span className="iban">{uiAccount.iban}</span>
            </div>
          );
        })}
      </section>

      {/* Transactions récentes */}
      <section>
        <h2>Transactions récentes ({transactions.length})</h2>
        {transactions
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 20)
          .map(transaction => {
            const uiTransaction = bankingService.transformTransactionForUI(transaction);
            return (
              <div key={transaction.id} className={`transaction ${uiTransaction.type}`}>
                <span className="date">{uiTransaction.date}</span>
                <span className="description">{uiTransaction.description}</span>
                <span className={`amount ${transaction.amount < 0 ? 'debit' : 'credit'}`}>
                  {uiTransaction.formattedAmount}
                </span>
                <span className={`status ${uiTransaction.statusColor}`}>
                  {uiTransaction.reconciliationStatus}
                </span>
              </div>
            );
          })}
      </section>
    </div>
  );
};

export default BankingDashboard;
```

Ce service offre une intégration bancaire complète et robuste, prête pour un environnement de production avec toutes les fonctionnalités nécessaires pour une application de gestion d'entreprise moderne.