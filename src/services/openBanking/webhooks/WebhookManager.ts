import {
  WebhookEvent,
  WebhookConfig,
  BankConnection,
  BankTransaction,
  OpenBankingResponse
} from '../../../types/openBanking.types';
import { EncryptionService } from '../security/EncryptionService';

// Gestionnaire de webhooks temps réel
export class WebhookManager {
  private static instance: WebhookManager;
  private configs = new Map<string, WebhookConfig>();
  private eventQueue: WebhookEvent[] = [];
  private processingQueue = false;
  private encryptionService: EncryptionService;
  private isInitialized = false;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  static getInstance(): WebhookManager {
    if (!this.instance) {
      this.instance = new WebhookManager();
    }
    return this.instance;
  }

  async initialize(configs: WebhookConfig[]): Promise<void> {
    try {
      // Charger les configurations de webhooks
      for (const config of configs) {
        this.configs.set(config.providerId, config);
      }

      // Démarrer le processeur de queue
      this.startQueueProcessor();
      
      this.isInitialized = true;
      console.log(`Webhook manager initialized with ${configs.length} providers`);
    } catch (error) {
      throw new Error(`Failed to initialize webhook manager: ${error.message}`);
    }
  }

  // Recevoir et traiter un webhook
  async receiveWebhook(
    providerId: string,
    payload: any,
    signature: string,
    headers: Record<string, string>
  ): Promise<OpenBankingResponse<void>> {
    try {
      const config = this.configs.get(providerId);
      if (!config) {
        return {
          success: false,
          error: {
            code: 'PROVIDER_NOT_CONFIGURED',
            message: `No webhook configuration found for provider: ${providerId}`
          }
        };
      }

      if (!config.isActive) {
        return {
          success: false,
          error: {
            code: 'WEBHOOK_DISABLED',
            message: `Webhook is disabled for provider: ${providerId}`
          }
        };
      }

      // Vérifier la signature
      const isValidSignature = await this.validateSignature(payload, signature, config.secret);
      if (!isValidSignature) {
        return {
          success: false,
          error: {
            code: 'INVALID_SIGNATURE',
            message: 'Webhook signature validation failed'
          }
        };
      }

      // Créer l'événement webhook
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        type: payload.type || 'unknown',
        providerId,
        connectionId: payload.connection_id || payload.item_id,
        data: payload,
        timestamp: new Date(),
        processed: false,
        retryCount: 0
      };

      // Ajouter à la queue de traitement
      this.eventQueue.push(event);

      // Traitement immédiat pour les événements critiques
      if (this.isCriticalEvent(event.type)) {
        await this.processEvent(event);
      }

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: `Failed to process webhook: ${error.message}`,
          details: error
        }
      };
    }
  }

  // Processeur de queue d'événements
  private async startQueueProcessor(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    const processQueue = async () => {
      while (this.eventQueue.length > 0 && this.processingQueue) {
        const event = this.eventQueue.shift();
        if (event && !event.processed) {
          try {
            await this.processEvent(event);
          } catch (error) {
            console.error(`Failed to process event ${event.id}:`, error);
            await this.handleEventError(event, error);
          }
        }
      }

      if (this.processingQueue) {
        setTimeout(processQueue, 1000); // Vérifier toutes les secondes
      }
    };

    processQueue();
  }

  // Traiter un événement webhook
  private async processEvent(event: WebhookEvent): Promise<void> {
    try {
      console.log(`Processing webhook event: ${event.type} for provider: ${event.providerId}`);

      switch (event.type) {
        case 'transaction.created':
          await this.handleTransactionCreated(event);
          break;

        case 'transaction.updated':
          await this.handleTransactionUpdated(event);
          break;

        case 'account.updated':
          await this.handleAccountUpdated(event);
          break;

        case 'connection.status_changed':
          await this.handleConnectionStatusChanged(event);
          break;

        case 'connection.error':
          await this.handleConnectionError(event);
          break;

        case 'connection.expired':
          await this.handleConnectionExpired(event);
          break;

        default:
          console.warn(`Unhandled webhook event type: ${event.type}`);
      }

      // Marquer comme traité
      event.processed = true;
      event.processedAt = new Date();
    } catch (error) {
      throw error;
    }
  }

  // Gestionnaires d'événements spécifiques
  private async handleTransactionCreated(event: WebhookEvent): Promise<void> {
    try {
      const transactionData = event.data.transaction || event.data;
      
      // Normaliser la transaction selon le provider
      const normalizedTransaction = await this.normalizeTransactionData(
        event.providerId,
        transactionData
      );

      // En production, sauvegarder en base de données
      console.log('New transaction created:', normalizedTransaction.id);

      // Déclencher la réconciliation automatique
      await this.triggerAutoReconciliation(normalizedTransaction);

      // Notifier les clients via WebSocket si connectés
      await this.notifyClients('transaction.created', {
        connectionId: event.connectionId,
        transaction: normalizedTransaction
      });
    } catch (error) {
      console.error('Error handling transaction created:', error);
      throw error;
    }
  }

  private async handleTransactionUpdated(event: WebhookEvent): Promise<void> {
    try {
      const transactionData = event.data.transaction || event.data;
      
      const normalizedTransaction = await this.normalizeTransactionData(
        event.providerId,
        transactionData
      );

      // En production, mettre à jour en base de données
      console.log('Transaction updated:', normalizedTransaction.id);

      await this.notifyClients('transaction.updated', {
        connectionId: event.connectionId,
        transaction: normalizedTransaction
      });
    } catch (error) {
      console.error('Error handling transaction updated:', error);
      throw error;
    }
  }

  private async handleAccountUpdated(event: WebhookEvent): Promise<void> {
    try {
      const accountData = event.data.account || event.data;
      
      console.log('Account updated:', accountData.id);

      await this.notifyClients('account.updated', {
        connectionId: event.connectionId,
        account: accountData
      });
    } catch (error) {
      console.error('Error handling account updated:', error);
      throw error;
    }
  }

  private async handleConnectionStatusChanged(event: WebhookEvent): Promise<void> {
    try {
      const status = event.data.status || event.data.state;
      
      // En production, mettre à jour le statut de connexion
      console.log(`Connection ${event.connectionId} status changed to: ${status}`);

      // Si la connexion est expirée, déclencher le renouvellement
      if (status === 'expired' || status === 'error') {
        await this.handleConnectionIssue(event.connectionId, status);
      }

      await this.notifyClients('connection.status_changed', {
        connectionId: event.connectionId,
        status
      });
    } catch (error) {
      console.error('Error handling connection status change:', error);
      throw error;
    }
  }

  private async handleConnectionError(event: WebhookEvent): Promise<void> {
    try {
      const errorInfo = event.data.error || event.data;
      
      console.error(`Connection ${event.connectionId} error:`, errorInfo);

      await this.handleConnectionIssue(event.connectionId, 'error', errorInfo);

      await this.notifyClients('connection.error', {
        connectionId: event.connectionId,
        error: errorInfo
      });
    } catch (error) {
      console.error('Error handling connection error:', error);
      throw error;
    }
  }

  private async handleConnectionExpired(event: WebhookEvent): Promise<void> {
    try {
      console.log(`Connection ${event.connectionId} expired`);

      await this.handleConnectionIssue(event.connectionId, 'expired');

      await this.notifyClients('connection.expired', {
        connectionId: event.connectionId
      });
    } catch (error) {
      console.error('Error handling connection expired:', error);
      throw error;
    }
  }

  // Gérer les problèmes de connexion
  private async handleConnectionIssue(
    connectionId: string,
    issue: string,
    errorInfo?: any
  ): Promise<void> {
    try {
      // En production, récupérer la connexion depuis la DB
      // const connection = await getConnection(connectionId);
      
      switch (issue) {
        case 'expired':
          // Programmer un renouvellement automatique
          await this.scheduleConnectionRenewal(connectionId);
          break;
          
        case 'error':
          // Analyser l'erreur et prendre des mesures
          if (errorInfo?.code === 'invalid_credentials') {
            // Notifier l'utilisateur pour re-authentification
            await this.requestReAuthentication(connectionId);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling connection issue:', error);
    }
  }

  // Normaliser les données de transaction selon le provider
  private async normalizeTransactionData(
    providerId: string,
    transactionData: any
  ): Promise<BankTransaction> {
    // Cette fonction devrait utiliser les mappers spécifiques à chaque provider
    const normalizedTransaction: BankTransaction = {
      id: crypto.randomUUID(),
      accountId: transactionData.account_id,
      transactionId: transactionData.id?.toString(),
      date: new Date(transactionData.date || transactionData.created_at),
      valueDate: new Date(transactionData.value_date || transactionData.date),
      amount: parseFloat(transactionData.amount || transactionData.value),
      currency: transactionData.currency_code || transactionData.currency || 'EUR',
      description: transactionData.description || transactionData.wording || '',
      originalDescription: transactionData.raw_description || transactionData.original_wording || '',
      category: transactionData.category,
      type: parseFloat(transactionData.amount || transactionData.value) >= 0 ? 'credit' : 'debit',
      status: transactionData.status === 'pending' ? 'pending' : 'posted',
      counterparty: transactionData.counterparty || transactionData.account_name,
      reference: transactionData.reference,
      isReconciled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        providerId,
        originalData: transactionData
      }
    };

    return normalizedTransaction;
  }

  // Déclencher la réconciliation automatique
  private async triggerAutoReconciliation(transaction: BankTransaction): Promise<void> {
    try {
      // En production, appeler le service de réconciliation
      console.log(`Triggering auto-reconciliation for transaction: ${transaction.id}`);
      
      // const reconciliationService = new ReconciliationService();
      // await reconciliationService.reconcileTransaction(transaction, accountingEntries);
    } catch (error) {
      console.error('Auto-reconciliation failed:', error);
    }
  }

  // Notifier les clients connectés via WebSocket
  private async notifyClients(eventType: string, data: any): Promise<void> {
    try {
      // En production, utiliser un service de WebSocket (comme Socket.io)
      console.log(`Broadcasting ${eventType} to clients:`, data);
      
      // Exemple avec Supabase Realtime
      // supabase.channel('banking').send({
      //   type: 'broadcast',
      //   event: eventType,
      //   payload: data
      // });
    } catch (error) {
      console.error('Failed to notify clients:', error);
    }
  }

  // Programmer le renouvellement d'une connexion
  private async scheduleConnectionRenewal(connectionId: string): Promise<void> {
    try {
      console.log(`Scheduling renewal for connection: ${connectionId}`);
      
      // En production, programmer une tâche de renouvellement
      // setTimeout(() => {
      //   this.renewConnection(connectionId);
      // }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      console.error('Failed to schedule connection renewal:', error);
    }
  }

  // Demander une re-authentification
  private async requestReAuthentication(connectionId: string): Promise<void> {
    try {
      console.log(`Requesting re-authentication for connection: ${connectionId}`);
      
      await this.notifyClients('authentication.required', {
        connectionId,
        message: 'Please re-authenticate your bank connection'
      });
    } catch (error) {
      console.error('Failed to request re-authentication:', error);
    }
  }

  // Valider la signature du webhook
  private async validateSignature(
    payload: any,
    signature: string,
    secret: string
  ): Promise<boolean> {
    try {
      const payloadString = JSON.stringify(payload);
      return await this.encryptionService.verifyHMACSignature(
        payloadString,
        signature,
        secret,
        'SHA-256'
      );
    } catch (error) {
      console.error('Signature validation error:', error);
      return false;
    }
  }

  // Gérer les erreurs d'événements
  private async handleEventError(event: WebhookEvent, error: any): Promise<void> {
    event.retryCount++;
    event.lastError = error.message;

    const config = this.configs.get(event.providerId);
    const maxRetries = config?.retryPolicy.maxRetries || 3;

    if (event.retryCount < maxRetries) {
      // Calculer le délai de retry avec backoff exponentiel
      const delay = (config?.retryPolicy.initialDelay || 1000) * 
        Math.pow(config?.retryPolicy.backoffMultiplier || 2, event.retryCount - 1);

      console.log(`Retrying event ${event.id} in ${delay}ms (attempt ${event.retryCount}/${maxRetries})`);

      setTimeout(() => {
        this.eventQueue.push(event);
      }, delay);
    } else {
      console.error(`Event ${event.id} failed after ${maxRetries} retries:`, error);
      
      // En production, sauvegarder l'événement en échec pour analyse
      await this.saveFailedEvent(event);
    }
  }

  // Sauvegarder les événements en échec
  private async saveFailedEvent(event: WebhookEvent): Promise<void> {
    try {
      // En production, sauvegarder en base de données pour analyse
      console.log('Saving failed event for analysis:', event.id);
    } catch (error) {
      console.error('Failed to save failed event:', error);
    }
  }

  // Vérifier si un événement est critique
  private isCriticalEvent(eventType: string): boolean {
    const criticalEvents = [
      'connection.error',
      'connection.expired',
      'transaction.created'
    ];
    return criticalEvents.includes(eventType);
  }

  // Configuration des webhooks
  async addWebhookConfig(config: WebhookConfig): Promise<void> {
    this.configs.set(config.providerId, config);
  }

  async updateWebhookConfig(
    providerId: string,
    updates: Partial<WebhookConfig>
  ): Promise<void> {
    const existingConfig = this.configs.get(providerId);
    if (existingConfig) {
      this.configs.set(providerId, { ...existingConfig, ...updates });
    }
  }

  async removeWebhookConfig(providerId: string): Promise<void> {
    this.configs.delete(providerId);
  }

  getWebhookConfig(providerId: string): WebhookConfig | undefined {
    return this.configs.get(providerId);
  }

  // Statistiques
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    configuredProviders: number;
  } {
    return {
      queueLength: this.eventQueue.length,
      processing: this.processingQueue,
      configuredProviders: this.configs.size
    };
  }

  // Arrêter le processeur de queue
  stopQueueProcessor(): void {
    this.processingQueue = false;
  }

  // Nettoyer les ressources
  dispose(): void {
    this.stopQueueProcessor();
    this.configs.clear();
    this.eventQueue = [];
    this.isInitialized = false;
  }

  get initialized(): boolean {
    return this.isInitialized;
  }
}

// Middleware Express pour les webhooks
export class WebhookMiddleware {
  private webhookManager: WebhookManager;

  constructor() {
    this.webhookManager = WebhookManager.getInstance();
  }

  // Créer un middleware Express pour recevoir les webhooks
  createExpressMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const providerId = req.params.providerId || req.headers['x-provider-id'];
        const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
        
        if (!providerId) {
          return res.status(400).json({
            error: 'Provider ID is required'
          });
        }

        const result = await this.webhookManager.receiveWebhook(
          providerId,
          req.body,
          signature,
          req.headers
        );

        if (result.success) {
          res.status(200).json({ status: 'received' });
        } else {
          res.status(400).json({
            error: result.error?.message || 'Webhook processing failed'
          });
        }
      } catch (error) {
        console.error('Webhook middleware error:', error);
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    };
  }

  // Middleware de validation pour les webhooks
  createValidationMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        // Vérifier le Content-Type
        if (!req.headers['content-type']?.includes('application/json')) {
          return res.status(400).json({
            error: 'Content-Type must be application/json'
          });
        }

        // Vérifier la présence du payload
        if (!req.body) {
          return res.status(400).json({
            error: 'Request body is required'
          });
        }

        next();
      } catch (error) {
        res.status(500).json({
          error: 'Validation failed'
        });
      }
    };
  }
}