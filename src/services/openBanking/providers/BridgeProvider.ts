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
  BankConnection,
  BankAccount,
  BankTransaction,
  OpenBankingResponse,
  SyncResult,
  PSD2AuthFlow,
  WebhookEvent,
} from '../../../types/openBanking.types';
import { BankingProvider, BankingProviderError, AuthenticationError, NetworkError } from '../base/BankingProvider';
import { logger } from '@/lib/logger';
// Bridge API Response Types
interface BridgeAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
interface BridgeStatusResponse {
  status: 'ok' | 'maintenance' | 'error';
}
interface BridgeItemResponse {
  item_id: string;
  redirect_url: string;
  user_id: string;
  bank: {
    name: string;
    logo_url: string;
  };
  status: 'ok' | 'pending' | 'error' | 'expired';
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  last_refresh?: number;
  created_at: number;
  updated_at: number;
}
interface BridgeConsentResponse {
  consent_id: string;
  redirect_url: string;
  status: 'completed' | 'pending' | 'failed';
  expires_at: number;
}
interface BridgeAccountResponse {
  id: number | string;
  name: string;
  type: string;
  currency_code: string;
  balance: number | string;
  iban?: string;
  number?: string;
  status: 'active' | 'inactive';
  created_at: number;
  updated_at: number;
}
interface BridgeTransactionResource {
  id: number | string;
  date: string;
  value_date?: string;
  amount: number | string;
  currency_code: string;
  description: string;
  raw_description?: string;
  category_id?: number;
  status: 'posted' | 'pending';
  account_name?: string;
  reference?: string;
  created_at: number;
  updated_at: number;
}
interface BridgeTransactionsResponse {
  resources: BridgeTransactionResource[];
  pagination?: {
    next_uri?: string;
  };
}
// Provider spécialisé pour Bridge API
export class BridgeProvider extends BankingProvider {
  private accessToken: string | null = null;
  private baseUrl: string;
  constructor(config: any) {
    super(config);
    this.baseUrl = config.config.baseUrl || 'https://api.bridgeapi.io';
  }
  async initialize(): Promise<void> {
    try {
      await this.authenticateClient();
      this.isInitialized = true;
    } catch (error) {
      const err = error as Error;
      throw new BankingProviderError(
        'INIT_ERROR',
        `Failed to initialize Bridge provider: ${err.message}`,
        error
      );
    }
  }
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/v2/status') as BridgeStatusResponse;
      return response.status === 'ok';
    } catch (_error) {
      return false;
    }
  }
  // Authentification client Bridge
  private async authenticateClient(): Promise<void> {
    try {
      const response = await this.makeRequest('POST', '/v2/authenticate', {
        client_id: this.config.config.clientId,
        client_secret: this.config.config.clientSecret
      }) as BridgeAuthResponse;
      this.accessToken = response.access_token;
    } catch (_error) {
      throw new AuthenticationError('Failed to authenticate with Bridge API');
    }
  }
  async createConnection(userId: string, bankId: string): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(userId);
    try {
      const bank = this.config.supportedBanks.find(b => b.id === bankId);
      if (!bank) {
        return this.createErrorResponse('BANK_NOT_SUPPORTED', `Bank ${bankId} is not supported`);
      }
      // Bridge utilise un système de "items" pour les connexions bancaires
      const response = await this.makeRequest('POST', '/v2/connect/items/add', {
        user_id: userId,
        bank_id: bankId,
        redirect_url: `${window.location.origin}/banking/callback`
      }) as BridgeItemResponse;
      const connection: BankConnection = {
        id: crypto.randomUUID(),
        userId,
        providerId: this.providerId,
        providerName: this.providerName,
        bankName: bank.name,
        bankLogo: bank.logo,
        status: 'connecting',
        consentId: response.item_id,
        consentExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 jours
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          itemId: response.item_id,
          redirectUrl: response.redirect_url
        }
      };
      return this.createResponse(connection);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async getConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(connectionId);
    try {
      // En production, récupérer depuis la base de données
      // Ici on simule un appel à Bridge pour vérifier le statut
      const itemId = ''; // À récupérer depuis la DB
      const response = await this.makeRequest('GET', `/v2/connect/items/${itemId}`) as BridgeItemResponse;
      const connection: BankConnection = {
        id: connectionId,
        userId: response.user_id,
        providerId: this.providerId,
        providerName: this.providerName,
        bankName: response.bank.name,
        bankLogo: response.bank.logo_url,
        status: this.mapBridgeStatus(response.status),
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        tokenExpiresAt: response.expires_at ? new Date(response.expires_at * 1000) : undefined,
        consentId: response.item_id,
        lastSync: response.last_refresh ? new Date(response.last_refresh * 1000) : undefined,
        createdAt: new Date(response.created_at * 1000),
        updatedAt: new Date(response.updated_at * 1000)
      };
      return this.createResponse(connection);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async updateConnection(_connectionId: string, _updates: Partial<BankConnection>): Promise<OpenBankingResponse<BankConnection>> {
    // En production, mettre à jour en base et synchroniser avec Bridge si nécessaire
    throw new Error('Method not implemented.');
  }
  async deleteConnection(connectionId: string): Promise<OpenBankingResponse<void>> {
    this.validateConnectionId(connectionId);
    try {
      const itemId = ''; // À récupérer depuis la DB
      await this.makeRequest('DELETE', `/v2/connect/items/${itemId}`);
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async refreshConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(connectionId);
    try {
      const itemId = ''; // À récupérer depuis la DB
      await this.makeRequest('POST', `/v2/connect/items/${itemId}/refresh`);
      // Mettre à jour la connexion avec les nouvelles données
      return await this.getConnection(connectionId);
    } catch (error) {
      return this.handleError(error);
    }
  }
  // Authentification PSD2
  async initiateAuth(connectionId: string, redirectUri: string): Promise<OpenBankingResponse<PSD2AuthFlow>> {
    try {
      const itemId = ''; // À récupérer depuis la DB
      const response = await this.makeRequest('POST', `/v2/connect/items/${itemId}/authenticate`, {
        redirect_url: redirectUri
      }) as BridgeConsentResponse;
      const authFlow: PSD2AuthFlow = {
        id: crypto.randomUUID(),
        connectionId,
        status: 'redirect_needed',
        redirectUrl: response.redirect_url,
        consentId: response.consent_id || itemId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return this.createResponse(authFlow);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async completeAuth(authFlowId: string, authCode: string): Promise<OpenBankingResponse<BankConnection>> {
    try {
      await this.makeRequest('POST', '/v2/connect/items/auth/complete', {
        auth_code: authCode
      });
      // Mettre à jour la connexion avec les tokens
      const connectionId = ''; // À récupérer depuis authFlowId
      return await this.getConnection(connectionId);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async handleSCA(authFlowId: string, challengeResponse: string): Promise<OpenBankingResponse<PSD2AuthFlow>> {
    try {
      const response = await this.makeRequest('POST', '/v2/connect/items/sca/validate', {
        auth_flow_id: authFlowId,
        challenge_response: challengeResponse
      }) as BridgeConsentResponse;
      const authFlow: PSD2AuthFlow = {
        id: authFlowId,
        connectionId: '',
        status: response.status === 'completed' ? 'completed' : 'pending_sca',
        consentId: response.consent_id,
        expiresAt: new Date(response.expires_at * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return this.createResponse(authFlow);
  } catch (error) {
      return this.handleError(error);
    }
  }
  // Gestion des comptes
  async getAccounts(connectionId: string): Promise<OpenBankingResponse<BankAccount[]>> {
    this.validateConnectionId(connectionId);
    try {
      const itemId = ''; // À récupérer depuis la DB
      const response = await this.makeRequest('GET', `/v2/accounts?item_id=${itemId}`) as { resources: BridgeAccountResponse[] };
      const accounts: BankAccount[] = response.resources.map((account) => ({
        id: crypto.randomUUID(),
        connectionId,
        accountId: account.id.toString(),
        name: account.name,
        displayName: account.name,
        type: this.mapBridgeAccountType(account.type),
        currency: account.currency_code,
        balance: parseFloat(account.balance.toString()),
        availableBalance: parseFloat(account.balance.toString()),
        iban: account.iban,
        accountNumber: account.number,
        isActive: account.status === 'active',
        createdAt: new Date(account.created_at * 1000),
        updatedAt: new Date(account.updated_at * 1000),
        metadata: {
          bridgeAccountId: account.id.toString(),
          bankId: ''
        }
      }));
      return this.createResponse(accounts);
  } catch (error) {
      return this.handleError(error);
    }
  }
  async getAccount(connectionId: string, accountId: string): Promise<OpenBankingResponse<BankAccount>> {
    this.validateConnectionId(connectionId);
    this.validateAccountId(accountId);
    try {
      const response = await this.makeRequest('GET', `/v2/accounts/${accountId}`) as BridgeAccountResponse;
      const account: BankAccount = {
        id: crypto.randomUUID(),
        connectionId,
        accountId: response.id.toString(),
        name: response.name,
        displayName: response.name,
        type: this.mapBridgeAccountType(response.type),
        currency: response.currency_code,
        balance: parseFloat(response.balance.toString()),
        availableBalance: parseFloat(response.balance.toString()),
        iban: response.iban,
        accountNumber: response.number,
        isActive: response.status === 'active',
        createdAt: new Date(response.created_at * 1000),
        updatedAt: new Date(response.updated_at * 1000)
      };
      return this.createResponse(account);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async refreshAccountBalance(connectionId: string, accountId: string): Promise<OpenBankingResponse<BankAccount>> {
    try {
      await this.makeRequest('POST', `/v2/accounts/${accountId}/refresh`);
      return await this.getAccount(connectionId, accountId);
    } catch (error) {
      return this.handleError(error);
    }
  }
  // Gestion des transactions
  async getTransactions(
    connectionId: string,
    accountId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      cursor?: string;
    } = {}
  ): Promise<OpenBankingResponse<{ transactions: BankTransaction[]; nextCursor?: string }>> {
    this.validateConnectionId(connectionId);
    this.validateAccountId(accountId);
    this.validateDateRange(options.startDate, options.endDate);
    try {
      const params = new URLSearchParams({
        account_id: accountId,
        limit: (options.limit || 100).toString()
      });
      if (options.startDate) {
        params.append('since', options.startDate.toISOString().split('T')[0]);
      }
      if (options.endDate) {
        params.append('until', options.endDate.toISOString().split('T')[0]);
      }
      if (options.cursor) {
        params.append('cursor', options.cursor);
      }
      const response = await this.makeRequest('GET', `/v2/transactions?${params.toString()}`) as BridgeTransactionsResponse;
      const transactions: BankTransaction[] = response.resources.map((tx) => ({
        id: crypto.randomUUID(),
        accountId,
        transactionId: tx.id.toString(),
        date: new Date(tx.date),
        valueDate: new Date(tx.value_date || tx.date),
        amount: parseFloat(tx.amount.toString()),
        currency: tx.currency_code,
        description: this.normalizeDescription(tx.description),
        originalDescription: tx.raw_description || tx.description,
        category: tx.category_id ? this.mapBridgeCategory(tx.category_id) : undefined,
        type: parseFloat(tx.amount.toString()) >= 0 ? 'credit' : 'debit',
        status: tx.status === 'posted' ? 'posted' : 'pending',
        counterparty: tx.account_name,
        reference: tx.reference,
        isReconciled: false,
        createdAt: new Date(tx.created_at * 1000),
        updatedAt: new Date(tx.updated_at * 1000),
        metadata: {
          bridgeTransactionId: tx.id.toString(),
          bridgeCategoryId: tx.category_id
        }
      }));
      return this.createResponse({
        transactions,
        nextCursor: response.pagination?.next_uri ? 'next_page' : undefined
      });
    } catch (error) {
      return this.handleError(error);
    }
  }
  async syncTransactions(connectionId: string, accountId: string): Promise<OpenBankingResponse<SyncResult>> {
    try {
      // Force refresh des transactions
      await this.makeRequest('POST', `/v2/accounts/${accountId}/refresh`);
      // Récupérer les nouvelles transactions
      const result = await this.getTransactions(connectionId, accountId, {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 jours
      });
      if (!result.success || !result.data) {
        throw new Error('Failed to fetch transactions');
      }
      const syncResult: SyncResult = {
        accountId,
        transactionsAdded: result.data.transactions.length,
        transactionsUpdated: 0,
        errors: [],
        lastSyncDate: new Date(),
        nextSyncDate: new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 heures
      };
      return this.createResponse(syncResult);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async syncAllAccounts(connectionId: string): Promise<OpenBankingResponse<SyncResult[]>> {
    try {
      const accountsResult = await this.getAccounts(connectionId);
      if (!accountsResult.success || !accountsResult.data) {
        throw new Error('Failed to fetch accounts');
      }
      const syncResults: SyncResult[] = [];
      for (const account of accountsResult.data) {
        const result = await this.syncTransactions(connectionId, account.accountId);
        if (result.success && result.data) {
          syncResults.push(result.data);
        }
      }
      return this.createResponse(syncResults);
  } catch (error) {
      return this.handleError(error);
    }
  }
  // Webhooks
  async setupWebhook(_connectionId: string, events: string[]): Promise<OpenBankingResponse<void>> {
    try {
      const itemId = ''; // À récupérer depuis la DB
      await this.makeRequest('POST', '/v2/webhooks', {
        item_id: itemId,
        url: this.config.config.webhookUrl,
        events
      });
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async removeWebhook(_connectionId: string): Promise<OpenBankingResponse<void>> {
    try {
      const webhookId = ''; // À récupérer depuis la DB
      await this.makeRequest('DELETE', `/v2/webhooks/${webhookId}`);
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async processWebhookEvent(event: WebhookEvent): Promise<OpenBankingResponse<void>> {
    try {
      // Traitement spécifique à Bridge
      switch (event.type) {
        case 'transaction.created':
          // Traiter la nouvelle transaction
          break;
        case 'account.updated':
          // Traiter la mise à jour du compte
          break;
        default:
          logger.warn('Bridge', `Unhandled webhook event: ${event.type}`);
      }
      return this.createResponse(undefined);
  } catch (error) {
      return this.handleError(error);
    }
  }
  validateWebhookSignature(payload: string, signature: string): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.config.webhookSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
  // Enrichissement
  async categorizeTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>> {
    // Bridge fait la catégorisation automatiquement
    return this.createResponse(transaction);
  }
  async enrichTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>> {
    // Enrichissement avec des informations supplémentaires
    return this.createResponse(transaction);
  }
  // Gestion des tokens
  async refreshTokens(_connectionId: string): Promise<OpenBankingResponse<void>> {
    try {
      const itemId = ''; // À récupérer depuis la DB
      await this.makeRequest('POST', `/v2/connect/items/${itemId}/refresh`);
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  async revokeTokens(_connectionId: string): Promise<OpenBankingResponse<void>> {
    try {
      const itemId = ''; // À récupérer depuis la DB
      await this.makeRequest('POST', `/v2/connect/items/${itemId}/revoke`);
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }
  // Méthodes utilitaires
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers: Record<string, string> = {}
  ): Promise<T> {
    await this.checkRateLimit();
    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Bridge-Version': '2021-06-01',
      ...headers
    };
    if (this.accessToken) {
      requestHeaders['Authorization'] = `Bearer ${this.accessToken}`;
    }
    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: data ? JSON.stringify(data) : undefined
      });
      if (!response.ok) {
        throw new NetworkError(`HTTP ${response.status}: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.error) {
        throw new BankingProviderError(
          result.error.type || 'API_ERROR',
          result.error.message || 'Unknown API error',
          result.error
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BankingProviderError) {
        throw error;
      }
      const err = error as Error;
      throw new NetworkError(`Request failed: ${err.message}`, error);
    }
  }
  protected handleError(error: any): OpenBankingResponse<never> {
    if (error instanceof BankingProviderError) {
      return this.createErrorResponse(error.code, error.message, error.details as Record<string, unknown>);
    }
    const errorDetails: Record<string, unknown> = typeof error === 'object' && error !== null && error
      ? { ...error }
      : { message: String(error) };
    return this.createErrorResponse(
      'UNKNOWN_ERROR',
      (error instanceof Error ? error.message : null) || 'An unknown error occurred',
      errorDetails
    );
  }
  // Mappers spécifiques à Bridge
  private mapBridgeStatus(status: string): BankConnection['status'] {
    switch (status) {
      case 'ok':
        return 'connected';
      case 'pending':
        return 'connecting';
      case 'error':
        return 'error';
      case 'expired':
        return 'expired';
      default:
        return 'error';
    }
  }
  private mapBridgeAccountType(type: string): BankAccount['type'] {
    switch (type) {
      case 'checking':
        return 'checking';
      case 'savings':
        return 'savings';
      case 'credit_card':
        return 'credit';
      case 'loan':
        return 'loan';
      case 'investment':
        return 'investment';
      default:
        return 'checking';
    }
  }
  private mapBridgeCategory(categoryId: number): string {
    // Mapping des catégories Bridge vers nos catégories
    const categoryMap: Record<number, string> = {
      1: 'Alimentaire',
      2: 'Transport',
      3: 'Logement',
      4: 'Santé',
      5: 'Loisirs',
      // ... autres mappings
    };
    return categoryMap[categoryId] || 'Autre';
  }
}