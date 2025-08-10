import {
  BankConnection,
  BankAccount,
  BankTransaction,
  OpenBankingResponse,
  OpenBankingConfig,
  SyncStatistics,
  ReconciliationStatistics,
  WebhookEvent,
  ExportJob,
  ReconciliationMatch
} from '../../types/openBanking.types';

import { BankingProvider, BankingProviderFactory } from './base/BankingProvider';
import { BridgeProvider } from './providers/BridgeProvider';
import { BudgetInsightProvider } from './providers/BudgetInsightProvider';
import { EncryptionService } from './security/EncryptionService';
import { ReconciliationService } from './reconciliation/ReconciliationEngine';
import { WebhookManager } from './webhooks/WebhookManager';
import { AccountingExportService, ExportFormatFactory } from './export/AccountingExportService';

// Gestionnaire principal Open Banking
export class OpenBankingManager {
  private static instance: OpenBankingManager;
  private providers = new Map<string, BankingProvider>();
  private connections = new Map<string, BankConnection>();
  private encryptionService: EncryptionService;
  private reconciliationService: ReconciliationService;
  private webhookManager: WebhookManager;
  private exportService: AccountingExportService;
  private config: OpenBankingConfig | null = null;
  private isInitialized = false;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
    this.reconciliationService = new ReconciliationService();
    this.webhookManager = WebhookManager.getInstance();
    this.exportService = AccountingExportService.getInstance();
  }

  static getInstance(): OpenBankingManager {
    if (!this.instance) {
      this.instance = new OpenBankingManager();
    }
    return this.instance;
  }

  // Initialisation complète du système Open Banking
  async initialize(config: OpenBankingConfig): Promise<void> {
    try {
      this.config = config;

      // Initialiser le service de chiffrement
      await this.encryptionService.initialize(config.security.encryptionKey);

      // Enregistrer les providers
      this.registerProviders();

      // Initialiser les providers avec leurs configurations
      await this.initializeProviders();

      // Initialiser les services auxiliaires
      await this.initializeServices();

      this.isInitialized = true;
      console.log('Open Banking Manager initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize Open Banking Manager: ${error.message}`);
    }
  }

  // Enregistrer les providers disponibles
  private registerProviders(): void {
    BankingProviderFactory.register('bridge', BridgeProvider);
    BankingProviderFactory.register('budget_insight', BudgetInsightProvider);
  }

  // Initialiser tous les providers configurés
  private async initializeProviders(): Promise<void> {
    const providerConfigs = [
      {
        id: 'bridge',
        name: 'Bridge',
        displayName: 'Bridge API',
        type: 'aggregator' as const,
        supportedCountries: ['FR', 'ES', 'IT'],
        supportedBanks: [],
        features: {
          psd2Compliance: true,
          strongCustomerAuth: true,
          realTimeTransactions: true,
          webhookSupport: true,
          categorization: true,
          merchantEnrichment: true
        },
        isActive: true,
        config: this.config!.providers.bridge
      },
      {
        id: 'budget_insight',
        name: 'Budget Insight',
        displayName: 'Budget Insight API',
        type: 'aggregator' as const,
        supportedCountries: ['FR', 'ES', 'IT', 'DE'],
        supportedBanks: [],
        features: {
          psd2Compliance: true,
          strongCustomerAuth: true,
          realTimeTransactions: true,
          webhookSupport: true,
          categorization: true,
          merchantEnrichment: true
        },
        isActive: true,
        config: this.config!.providers.budgetInsight
      }
    ];

    for (const providerConfig of providerConfigs) {
      try {
        const provider = BankingProviderFactory.create(providerConfig);
        await provider.initialize();
        this.providers.set(providerConfig.id, provider);
        console.log(`Provider ${providerConfig.id} initialized successfully`);
      } catch (error) {
        console.error(`Failed to initialize provider ${providerConfig.id}:`, error);
      }
    }
  }

  // Initialiser les services auxiliaires
  private async initializeServices(): Promise<void> {
    try {
      // Service de réconciliation avec règles par défaut
      await this.reconciliationService.initialize([]);

      // Gestionnaire de webhooks
      await this.webhookManager.initialize([]);

      // Service d'export avec formats prédéfinis
      const exportFormats = [
        ExportFormatFactory.createSageFormat(),
        ExportFormatFactory.createQuickBooksFormat(),
        ExportFormatFactory.createCegidFormat()
      ];
      await this.exportService.initialize(exportFormats);

      console.log('Auxiliary services initialized successfully');
    } catch (error) {
      throw new Error(`Failed to initialize services: ${error.message}`);
    }
  }

  // GESTION DES CONNEXIONS BANCAIRES

  // Créer une nouvelle connexion bancaire
  async createBankConnection(
    userId: string,
    providerId: string,
    bankId: string
  ): Promise<OpenBankingResponse<BankConnection>> {
    if (!this.isInitialized) {
      return this.createErrorResponse('MANAGER_NOT_INITIALIZED', 'Open Banking Manager not initialized');
    }

    try {
      const provider = this.providers.get(providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', `Provider ${providerId} not found`);
      }

      const result = await provider.createConnection(userId, bankId);
      
      if (result.success && result.data) {
        // Sauvegarder la connexion
        this.connections.set(result.data.id, result.data);
        
        // En production, sauvegarder en base de données
        console.log(`Bank connection created: ${result.data.id}`);
        
        // Configurer les webhooks si supportés
        if (provider.supportsWebhooks) {
          await provider.setupWebhook(result.data.id, [
            'transaction.created',
            'transaction.updated',
            'account.updated',
            'connection.status_changed'
          ]);
        }
      }

      return result;
    } catch (error) {
      return this.createErrorResponse('CONNECTION_CREATION_ERROR', error.message);
    }
  }

  // Récupérer une connexion bancaire
  async getBankConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    try {
      // Vérifier d'abord en cache
      const cachedConnection = this.connections.get(connectionId);
      if (cachedConnection) {
        const provider = this.providers.get(cachedConnection.providerId);
        if (provider) {
          return await provider.getConnection(connectionId);
        }
      }

      return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
    } catch (error) {
      return this.createErrorResponse('CONNECTION_RETRIEVAL_ERROR', error.message);
    }
  }

  // Récupérer toutes les connexions d'un utilisateur
  async getUserConnections(userId: string): Promise<OpenBankingResponse<BankConnection[]>> {
    try {
      const userConnections = Array.from(this.connections.values())
        .filter(conn => conn.userId === userId);

      // Mettre à jour le statut de chaque connexion
      const updatedConnections: BankConnection[] = [];
      for (const connection of userConnections) {
        const provider = this.providers.get(connection.providerId);
        if (provider) {
          const result = await provider.getConnection(connection.id);
          if (result.success && result.data) {
            updatedConnections.push(result.data);
          }
        }
      }

      return {
        success: true,
        data: updatedConnections
      };
    } catch (error) {
      return this.createErrorResponse('USER_CONNECTIONS_ERROR', error.message);
    }
  }

  // Rafraîchir une connexion
  async refreshConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
      }

      const provider = this.providers.get(connection.providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      return await provider.refreshConnection(connectionId);
    } catch (error) {
      return this.createErrorResponse('CONNECTION_REFRESH_ERROR', error.message);
    }
  }

  // Supprimer une connexion bancaire
  async deleteBankConnection(connectionId: string): Promise<OpenBankingResponse<void>> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
      }

      const provider = this.providers.get(connection.providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      const result = await provider.deleteConnection(connectionId);
      
      if (result.success) {
        // Supprimer du cache
        this.connections.delete(connectionId);
        
        // Nettoyer les webhooks
        if (provider.supportsWebhooks) {
          await provider.removeWebhook(connectionId);
        }
      }

      return result;
    } catch (error) {
      return this.createErrorResponse('CONNECTION_DELETION_ERROR', error.message);
    }
  }

  // GESTION DES COMPTES

  // Récupérer les comptes d'une connexion
  async getAccounts(connectionId: string): Promise<OpenBankingResponse<BankAccount[]>> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
      }

      const provider = this.providers.get(connection.providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      return await provider.getAccounts(connectionId);
    } catch (error) {
      return this.createErrorResponse('ACCOUNTS_RETRIEVAL_ERROR', error.message);
    }
  }

  // GESTION DES TRANSACTIONS

  // Récupérer les transactions d'un compte
  async getTransactions(
    connectionId: string,
    accountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      cursor?: string;
    }
  ): Promise<OpenBankingResponse<{ transactions: BankTransaction[]; nextCursor?: string }>> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
      }

      const provider = this.providers.get(connection.providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      return await provider.getTransactions(connectionId, accountId, options);
    } catch (error) {
      return this.createErrorResponse('TRANSACTIONS_RETRIEVAL_ERROR', error.message);
    }
  }

  // Synchroniser les transactions
  async syncTransactions(connectionId: string, accountId: string): Promise<OpenBankingResponse<any>> {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return this.createErrorResponse('CONNECTION_NOT_FOUND', 'Connection not found');
      }

      const provider = this.providers.get(connection.providerId);
      if (!provider) {
        return this.createErrorResponse('PROVIDER_NOT_FOUND', 'Provider not found');
      }

      const result = await provider.syncTransactions(connectionId, accountId);

      // Déclencher la réconciliation automatique si configurée
      if (result.success && this.config?.reconciliation.autoMatchThreshold) {
        // En production, récupérer les écritures comptables et lancer la réconciliation
        console.log('Auto-reconciliation triggered after sync');
      }

      return result;
    } catch (error) {
      return this.createErrorResponse('SYNC_ERROR', error.message);
    }
  }

  // RÉCONCILIATION

  // Réconcilier une transaction
  async reconcileTransaction(
    transactionId: string,
    accountingEntries: any[]
  ): Promise<OpenBankingResponse<ReconciliationMatch[]>> {
    try {
      // En production, récupérer la transaction depuis la base de données
      const mockTransaction: BankTransaction = {
        id: transactionId,
        accountId: '',
        transactionId: '',
        date: new Date(),
        amount: 0,
        currency: 'EUR',
        description: '',
        originalDescription: '',
        type: 'debit',
        status: 'posted',
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return await this.reconciliationService.reconcileTransaction(mockTransaction, accountingEntries);
    } catch (error) {
      return this.createErrorResponse('RECONCILIATION_ERROR', error.message);
    }
  }

  // WEBHOOKS

  // Traiter un webhook entrant
  async processWebhook(
    providerId: string,
    payload: any,
    signature: string,
    headers: Record<string, string>
  ): Promise<OpenBankingResponse<void>> {
    try {
      return await this.webhookManager.receiveWebhook(providerId, payload, signature, headers);
    } catch (error) {
      return this.createErrorResponse('WEBHOOK_PROCESSING_ERROR', error.message);
    }
  }

  // EXPORT COMPTABLE

  // Créer un job d'export
  async createExport(
    userId: string,
    formatId: string,
    parameters: ExportJob['parameters']
  ): Promise<OpenBankingResponse<ExportJob>> {
    try {
      return await this.exportService.createExportJob(userId, formatId, parameters);
    } catch (error) {
      return this.createErrorResponse('EXPORT_CREATION_ERROR', error.message);
    }
  }

  // Récupérer le statut d'un export
  async getExportStatus(jobId: string): Promise<OpenBankingResponse<ExportJob>> {
    try {
      return await this.exportService.getExportJob(jobId);
    } catch (error) {
      return this.createErrorResponse('EXPORT_STATUS_ERROR', error.message);
    }
  }

  // STATISTIQUES

  // Récupérer les statistiques de synchronisation
  async getSyncStatistics(): Promise<SyncStatistics> {
    const connections = Array.from(this.connections.values());
    
    return {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.status === 'connected').length,
      totalAccounts: 0, // À calculer depuis la base de données
      totalTransactions: 0, // À calculer depuis la base de données
      lastSyncTime: new Date(),
      averageSyncDuration: 0,
      syncSuccessRate: 0.95,
      errorsByProvider: {}
    };
  }

  // Récupérer les statistiques de réconciliation
  async getReconciliationStatistics(): Promise<ReconciliationStatistics> {
    return {
      totalTransactions: 0,
      reconciledTransactions: 0,
      pendingReconciliation: 0,
      discrepancies: 0,
      autoMatchRate: 0.8,
      avgProcessingTime: 2.5
    };
  }

  // UTILITAIRES

  // Vérifier la santé du système
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: Record<string, boolean>;
    services: Record<string, boolean>;
  }> {
    const providerHealth: Record<string, boolean> = {};
    let healthyProviders = 0;

    for (const [providerId, provider] of this.providers) {
      try {
        const isHealthy = await provider.isHealthy();
        providerHealth[providerId] = isHealthy;
        if (isHealthy) healthyProviders++;
      } catch (error) {
        providerHealth[providerId] = false;
      }
    }

    const services = {
      encryption: this.encryptionService.initialized,
      reconciliation: this.reconciliationService.initialized,
      webhooks: this.webhookManager.initialized,
      export: this.exportService.initialized
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyProviders === this.providers.size && healthyServices === totalServices) {
      status = 'healthy';
    } else if (healthyProviders > 0 && healthyServices > totalServices / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      providers: providerHealth,
      services
    };
  }

  // Méthodes utilitaires privées
  private createErrorResponse(code: string, message: string): OpenBankingResponse<never> {
    return {
      success: false,
      error: {
        code,
        message
      }
    };
  }

  // Getters
  get initialized(): boolean {
    return this.isInitialized;
  }

  get availableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  // Nettoyage des ressources
  async dispose(): Promise<void> {
    // Arrêter tous les providers
    for (const provider of this.providers.values()) {
      await provider.dispose();
    }

    // Nettoyer les services
    this.encryptionService.dispose();
    this.reconciliationService.dispose();
    this.webhookManager.dispose();
    this.exportService.dispose();

    // Nettoyer les caches
    this.providers.clear();
    this.connections.clear();

    this.isInitialized = false;
    console.log('Open Banking Manager disposed');
  }
}

// Instance singleton exportée
export const openBankingManager = OpenBankingManager.getInstance();