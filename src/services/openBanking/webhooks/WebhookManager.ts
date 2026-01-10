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
import {
  WebhookEvent,
  WebhookConfig,
  BankTransaction,
  OpenBankingResponse
} from '../../../types/openBanking.types';
import { EncryptionService } from '../security/EncryptionService';
import { logger } from '@/lib/logger';
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
  logger.warn('WebhookManager', `Webhook manager initialized with ${configs.length} providers`);
    } catch (error) {
  const message = (error as { message?: string })?.message || 'unknown';
  throw new Error(`Failed to initialize webhook manager: ${message}`);
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
      // Normaliser le payload inconnu
      const p = (payload as Record<string, unknown>) || {};
      // Créer l'événement webhook
      const event: WebhookEvent = {
        id: crypto.randomUUID(),
        type: (p.type as WebhookEvent['type']) || 'unknown',
        providerId,
        connectionId: (p.connection_id as string) || (p.item_id as string) || '',
        data: p as Record<string, unknown>,
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
      logger.error('WebhookManager', 'Webhook processing error:', error instanceof Error ? error.message : String(error));
      const message = (error as { message?: string })?.message || 'unknown';
      return {
        success: false,
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: `Failed to process webhook: ${message}`
        }
      };
    }
  }
  // Processeur de queue d'événements
  private async startQueueProcessor(): Promise<void> {
    if (this.processingQueue) return;
    this.processingQueue = true;
    const processQueue = () => {
      if (!this.processingQueue) return;
      // Constituer un lot jusqu'à 50 événements
      const batch: WebhookEvent[] = [];
      while (this.eventQueue.length > 0 && batch.length < 50) {
        const e = this.eventQueue.shift();
        if (e && !e.processed) batch.push(e);
      }
      if (batch.length === 0) {
        // Rien à traiter maintenant, replanifier plus tard
        if (this.processingQueue) setTimeout(processQueue, 1000);
        return;
      }
      const tasks = batch.map((event) =>
        this.processEvent(event).catch(async (error) => {
          logger.error('WebhookManager', `Failed to process event ${event.id}:`, error);
          await this.handleEventError(event, error as Error);
        })
      );
      // Traiter le lot puis replanifier immédiatement pour drainer la queue sans await dans une boucle
      Promise.allSettled(tasks).finally(() => {
        if (this.processingQueue) setTimeout(processQueue, 0);
      });
    };
    // Lancer le premier cycle
    processQueue();
  }
  // Traiter un événement webhook
  private async processEvent(event: WebhookEvent): Promise<void> {
    logger.warn('WebhookManager', `Processing webhook event: ${event.type} for provider: ${event.providerId}`);
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
        logger.warn('WebhookManager', `Unhandled webhook event type: ${event.type}`);
    }
    // Marquer comme traité
    // eslint-disable-next-line require-atomic-updates
    event.processed = true;
    // eslint-disable-next-line require-atomic-updates
    event.processedAt = new Date();
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
  logger.warn('WebhookManager', 'New transaction created:', normalizedTransaction.id);
      // Déclencher la réconciliation automatique
      await this.triggerAutoReconciliation(normalizedTransaction);
      // Notifier les clients via WebSocket si connectés
      await this.notifyClients('transaction.created', {
        connectionId: event.connectionId,
        transaction: normalizedTransaction
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling transaction created:', error instanceof Error ? error.message : String(error));
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
  logger.warn('WebhookManager', 'Transaction updated:', normalizedTransaction.id);
      await this.notifyClients('transaction.updated', {
        connectionId: event.connectionId,
        transaction: normalizedTransaction
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling transaction updated:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  private async handleAccountUpdated(event: WebhookEvent): Promise<void> {
    try {
      const accountData = event.data.account || event.data;
  logger.warn('WebhookManager', 'Account updated:', accountData.id);
      await this.notifyClients('account.updated', {
        connectionId: event.connectionId,
        account: accountData
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling account updated:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  private async handleConnectionStatusChanged(event: WebhookEvent): Promise<void> {
    try {
      const status = event.data.status || event.data.state;
      // En production, mettre à jour le statut de connexion
  logger.warn('WebhookManager', `Connection ${event.connectionId} status changed to: ${status}`);
      // Si la connexion est expirée, déclencher le renouvellement
      if (status === 'expired' || status === 'error') {
        await this.handleConnectionIssue(event.connectionId, status);
      }
      await this.notifyClients('connection.status_changed', {
        connectionId: event.connectionId,
        status
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling connection status change:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  private async handleConnectionError(event: WebhookEvent): Promise<void> {
    try {
      const errorInfo = event.data.error || event.data;
      logger.error('WebhookManager', `Connection ${event.connectionId} error:`, errorInfo);
      await this.handleConnectionIssue(event.connectionId, 'error', errorInfo);
      await this.notifyClients('connection.error', {
        connectionId: event.connectionId,
        error: errorInfo
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling connection error:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  private async handleConnectionExpired(event: WebhookEvent): Promise<void> {
    try {
  logger.warn('WebhookManager', `Connection ${event.connectionId} expired`);
      await this.handleConnectionIssue(event.connectionId, 'expired');
      await this.notifyClients('connection.expired', {
        connectionId: event.connectionId
      });
    } catch (error) {
      logger.error('WebhookManager', 'Error handling connection expired:', error instanceof Error ? error.message : String(error));
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
        case 'error': {
          // Analyser l'erreur et prendre des mesures
          const info = errorInfo as { code?: string } | undefined;
          if (info?.code === 'invalid_credentials') {
            // Notifier l'utilisateur pour re-authentification
            await this.requestReAuthentication(connectionId);
          }
          break;
        }
      }
    } catch (error) {
      logger.error('WebhookManager', 'Error handling connection issue:', error instanceof Error ? error.message : String(error));
    }
  }
  // Normaliser les données de transaction selon le provider
  private async normalizeTransactionData(
    providerId: string,
    transactionData: {
      id?: string | number;
      account_id?: string;
      date?: string;
      created_at?: string;
      value_date?: string;
      amount?: string | number;
      value?: string | number;
      currency_code?: string;
      currency?: string;
      description?: string;
      wording?: string;
      raw_description?: string;
      original_wording?: string;
      category?: string;
      status?: string;
      counterparty?: string;
      account_name?: string;
      reference?: string;
    }
  ): Promise<BankTransaction> {
    return Promise.resolve(this.mapToBankTransaction(providerId, transactionData));
  }
  private mapToBankTransaction(
    providerId: string,
    transactionData: {
      id?: string | number;
      account_id?: string;
      date?: string;
      created_at?: string;
      value_date?: string;
      amount?: string | number;
      value?: string | number;
      currency_code?: string;
      currency?: string;
      description?: string;
      wording?: string;
      raw_description?: string;
      original_wording?: string;
      category?: string;
      status?: string;
      counterparty?: string;
      account_name?: string;
      reference?: string;
    }
  ): BankTransaction {
  const id = String(this.firstDefined(transactionData.id, ''));
  const accountId = this.firstTruthy(transactionData.account_id) ?? '';
  const dateStr = this.firstTruthy(transactionData.date, transactionData.created_at) ?? new Date().toISOString();
  const valueDateStr = this.firstTruthy(transactionData.value_date, transactionData.date) ?? dateStr;
  const amountRaw = this.firstDefined(transactionData.amount, transactionData.value, '0');
  const amountStr = String(amountRaw);
    const amountNum = parseFloat(amountStr);
  const currency = this.firstTruthy(transactionData.currency_code, transactionData.currency) ?? 'EUR';
  const description = this.firstTruthy(transactionData.description, transactionData.wording) ?? '';
  const originalDescription = this.firstTruthy(transactionData.raw_description, transactionData.original_wording) ?? '';
    return {
      id: crypto.randomUUID(),
      accountId,
      transactionId: id,
      date: new Date(dateStr),
      valueDate: new Date(valueDateStr),
      amount: Number.isFinite(amountNum) ? amountNum : 0,
      currency,
      description,
      originalDescription,
      category: transactionData.category,
      type: amountNum >= 0 ? 'credit' : 'debit',
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
  }
  // Helpers to reduce complexity in mapping
  private firstDefined<T>(...vals: Array<T | undefined | null>): T | undefined {
    for (const v of vals) {
      if (v !== undefined && v !== null) return v as T;
    }
    return undefined;
  }
  private firstTruthy<T>(...vals: Array<T | undefined | null | ''>): T | undefined {
    for (const v of vals) {
      if (v) return v as T;
    }
    return undefined;
  }
  // Déclencher la réconciliation automatique
  private async triggerAutoReconciliation(transaction: BankTransaction): Promise<void> {
    try {
      // En production, appeler le service de réconciliation
  logger.warn('WebhookManager', `Triggering auto-reconciliation for transaction: ${transaction.id}`);
      // const reconciliationService = new ReconciliationService();
      // await reconciliationService.reconcileTransaction(transaction, accountingEntries);
    } catch (error) {
      logger.error('WebhookManager', 'Auto-reconciliation failed:', error instanceof Error ? error.message : String(error));
    }
  }
  // Notifier les clients connectés via WebSocket
  private async notifyClients(eventType: string, data: unknown): Promise<void> {
    try {
      // En production, utiliser un service de WebSocket (comme Socket.io)
  logger.warn('WebhookManager', `Broadcasting ${eventType} to clients:`, data);
      // Exemple avec Supabase Realtime
      // supabase.channel('banking').send({
      //   type: 'broadcast',
      //   event: eventType,
      //   payload: data
      // });
    } catch (error) {
      logger.error('WebhookManager', 'Failed to notify clients:', error instanceof Error ? error.message : String(error));
    }
  }
  // Programmer le renouvellement d'une connexion
  private async scheduleConnectionRenewal(connectionId: string): Promise<void> {
    try {
  logger.warn('WebhookManager', `Scheduling renewal for connection: ${connectionId}`);
      // En production, programmer une tâche de renouvellement
      // setTimeout(() => {
      //   this.renewConnection(connectionId);
      // }, 5 * 60 * 1000); // 5 minutes
    } catch (error) {
      logger.error('WebhookManager', 'Failed to schedule connection renewal:', error instanceof Error ? error.message : String(error));
    }
  }
  // Demander une re-authentification
  private async requestReAuthentication(connectionId: string): Promise<void> {
    try {
  logger.warn('WebhookManager', `Requesting re-authentication for connection: ${connectionId}`);
      await this.notifyClients('authentication.required', {
        connectionId,
        message: 'Please re-authenticate your bank connection'
      });
    } catch (error) {
      logger.error('WebhookManager', 'Failed to request re-authentication:', error instanceof Error ? error.message : String(error));
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
      logger.error('WebhookManager', 'Signature validation error:', error instanceof Error ? error.message : String(error));
      return false;
    }
  }
  // Gérer les erreurs d'événements
  private async handleEventError(event: WebhookEvent, error: unknown): Promise<void> {
    event.retryCount++;
    event.lastError = (error as { message?: string })?.message || 'unknown';
    const config = this.configs.get(event.providerId);
    const maxRetries = config?.retryPolicy.maxRetries || 3;
    if (event.retryCount < maxRetries) {
      // Calculer le délai de retry avec backoff exponentiel
      const delay = (config?.retryPolicy.initialDelay || 1000) * 
        Math.pow(config?.retryPolicy.backoffMultiplier || 2, event.retryCount - 1);
  logger.warn('WebhookManager', `Retrying event ${event.id} in ${delay}ms (attempt ${event.retryCount}/${maxRetries})`);
      setTimeout(() => {
        this.eventQueue.push(event);
      }, delay);
    } else {
  logger.error('WebhookManager', `Event ${event.id} failed after ${maxRetries} retries:`, error);
      // En production, sauvegarder l'événement en échec pour analyse
      await this.saveFailedEvent(event);
    }
  }
  // Sauvegarder les événements en échec
  private async saveFailedEvent(event: WebhookEvent): Promise<void> {
    try {
      // En production, sauvegarder en base de données pour analyse
  logger.warn('WebhookManager', 'Saving failed event for analysis:', event.id);
    } catch (error) {
      logger.error('WebhookManager', 'Failed to save failed event:', error instanceof Error ? error.message : String(error));
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
    return async (
      req: { params?: Record<string, string>; headers: Record<string, string>; body?: unknown },
      res: { status: (code: number) => { json: (body: unknown) => void } },
      _next: unknown
    ) => {
      try {
        const providerId = req.params?.providerId || req.headers['x-provider-id'];
        const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
        if (!providerId) {
          return res.status(400).json({
            error: 'Provider ID is required'
          });
        }
        const result = await this.webhookManager.receiveWebhook(
          providerId,
          req.body,
          String(signature),
          req.headers
        );
        if (result.success) {
          res.status(200).json({ status: 'received' });
        } else {
          res.status(400).json({
            error: result.error?.message || 'Webhook processing failed'
          });
        }
      } catch (_error) {
        logger.error('WebhookManager', 'Webhook middleware error');
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    };
  }
  // Middleware de validation pour les webhooks
  createValidationMiddleware() {
    return async (
      req: { headers: Record<string, string>; body?: unknown },
      res: { status: (code: number) => { json: (body: unknown) => void } },
      next: () => void
    ) => {
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
      } catch (_error) {
        res.status(500).json({
          error: 'Validation failed'
        });
      }
    };
  }
}