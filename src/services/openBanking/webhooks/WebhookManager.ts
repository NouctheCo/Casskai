/* eslint-disable max-lines */
import { WebhookEvent, WebhookConfig, BankTransaction, OpenBankingResponse } from '../../../types/openBanking.types';
import { EncryptionService } from '../security/EncryptionService';

// Gestionnaire de webhooks temps réel
export class WebhookManager {
  private static instance: WebhookManager;
  private configs = new Map<string, WebhookConfig>();
  private eventQueue: WebhookEvent[] = [];
  private processingQueue = false;
  private encryptionService: EncryptionService;
  private isInitialized = false;
  private updateEvent(event: WebhookEvent, patch: Partial<WebhookEvent>): void {
    Object.assign(event, patch);
  }

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
      console.warn(`Webhook manager initialized with ${configs.length} providers`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to initialize webhook manager: ${msg}`);
    }
  }

  // Recevoir et traiter un webhook
  async receiveWebhook(
    providerId: string,
    payload: unknown,
    signature: string,
    _headers: Record<string, string>
  ): Promise<OpenBankingResponse<void>> {
    try {
      type WebhookPayload = Record<string, unknown> & {
        type?: string;
        connection_id?: string;
        item_id?: string;
        transaction?: Record<string, unknown>;
        account?: Record<string, unknown>;
        status?: string;
        state?: string;
        error?: unknown;
      };
      const p = (payload || {}) as WebhookPayload;
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
  const isValidSignature = await this.validateSignature(p, signature, config.secret);
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
      const allowedTypes = new Set<WebhookEvent['type']>([
        'transaction.created',
        'transaction.updated',
        'account.updated',
        'connection.status_changed'
      ]);
      const eventType: WebhookEvent['type'] = allowedTypes.has((p.type || 'connection.status_changed') as WebhookEvent['type'])
        ? (p.type as WebhookEvent['type'])
        : 'connection.status_changed';
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        type: eventType,
        providerId,
        connectionId: (p.connection_id || p.item_id || crypto.randomUUID()) as string,
        data: p,
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
      message: `Failed to process webhook: ${(error as Error).message}`,
      details: { message: (error as Error).message }
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
            // eslint-disable-next-line no-await-in-loop
            await this.processEvent(event);
          } catch (error) {
            console.error(`Failed to process event ${event.id}:`, error);
            // eslint-disable-next-line no-await-in-loop
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
    console.warn(`Processing webhook event: ${event.type} for provider: ${event.providerId}`);
    const type = event.type as string;
    switch (type) {
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
  this.updateEvent(event, { processed: true, processedAt: new Date() });
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
  console.warn('New transaction created:', normalizedTransaction.id);

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
  console.warn('Transaction updated:', normalizedTransaction.id);

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
      
  console.warn('Account updated:', accountData.id);

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
  console.warn(`Connection ${event.connectionId} status changed to: ${status}`);

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
  console.warn(`Connection ${event.connectionId} expired`);

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
  errorInfo?: unknown
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
          {
            const code = (errorInfo as { code?: string } | undefined)?.code;
            if (code === 'invalid_credentials') {
            // Notifier l'utilisateur pour re-authentification
              await this.requestReAuthentication(connectionId);
            }
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
  transactionData: Record<string, unknown>
  ): Promise<BankTransaction> {
    // Cette fonction devrait utiliser les mappers spécifiques à chaque provider
    const normalizedTransaction: BankTransaction = {
      id: crypto.randomUUID(),
  accountId: transactionData.account_id as string,
  transactionId: (transactionData.id != null ? String(transactionData.id) : crypto.randomUUID()),
  date: new Date((transactionData.date as string) || (transactionData.created_at as string)),
  valueDate: new Date((transactionData.value_date as string) || (transactionData.date as string)),
  amount: parseFloat((transactionData.amount as string) || (transactionData.value as string)),
  currency: (transactionData.currency_code as string) || (transactionData.currency as string) || 'EUR',
  description: (transactionData.description as string) || (transactionData.wording as string) || '',
  originalDescription: (transactionData.raw_description as string) || (transactionData.original_wording as string) || '',
  category: transactionData.category as string,
  type: parseFloat((transactionData.amount as string) || (transactionData.value as string)) >= 0 ? 'credit' : 'debit',
  status: (transactionData.status as string) === 'pending' ? 'pending' : 'posted',
  counterparty: (transactionData.counterparty as string) || (transactionData.account_name as string),
  reference: transactionData.reference as string,
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
  console.warn(`Triggering auto-reconciliation for transaction: ${transaction.id}`);
      
      // const reconciliationService = new ReconciliationService();
      // await reconciliationService.reconcileTransaction(transaction, accountingEntries);
    } catch (error) {
      console.error('Auto-reconciliation failed:', error);
    }
  }

  // Notifier les clients connectés via WebSocket
  private async notifyClients(eventType: string, _data: Record<string, unknown>): Promise<void> {
    try {
      // En production, utiliser un service de WebSocket (comme Socket.io)
      console.warn(`Broadcasting ${eventType} to clients.`);
      
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
  console.warn(`Scheduling renewal for connection: ${connectionId}`);
      
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
  console.warn(`Requesting re-authentication for connection: ${connectionId}`);
      
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
    payload: unknown,
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
  private async handleEventError(event: WebhookEvent, error: unknown): Promise<void> {
    event.retryCount++;
  event.lastError = (error as Error).message;

    const config = this.configs.get(event.providerId);
    const maxRetries = config?.retryPolicy.maxRetries || 3;

    if (event.retryCount < maxRetries) {
      // Calculer le délai de retry avec backoff exponentiel
      const delay = (config?.retryPolicy.initialDelay || 1000) * 
        Math.pow(config?.retryPolicy.backoffMultiplier || 2, event.retryCount - 1);

  console.warn(`Retrying event ${event.id} in ${delay}ms (attempt ${event.retryCount}/${maxRetries})`);

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
  console.warn('Saving failed event for analysis:', event.id);
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: any, res: any, _next: any) => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  } catch {
        res.status(500).json({
          error: 'Validation failed'
        });
      }
    };
  }
}
