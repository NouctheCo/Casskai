import {
  BankConnection,
  BankAccount,
  BankTransaction,
  OpenBankingResponse,
  SyncResult,
  PSD2AuthFlow,
  WebhookEvent,
  BudgetInsightConfig,
  BankingProvider as OBProviderConfig,
} from '../../../types/openBanking.types';
import { BankingProvider, BankingProviderError, AuthenticationError, NetworkError } from '../base/BankingProvider';

// Provider spécialisé pour Budget Insight API
export class BudgetInsightProvider extends BankingProvider {
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private baseUrl: string;
  private manageUrl: string;

  constructor(config: OBProviderConfig) {
    super(config);
  const budgetInsightConfig = (config.config as unknown as BudgetInsightConfig);
    this.baseUrl = budgetInsightConfig.baseUrl || 'https://api.budget-insight.com';
    this.manageUrl = budgetInsightConfig.manageUrl || 'https://manage.budget-insight.com';
  }

  async initialize(): Promise<void> {
    try {
      await this.authenticateClient();
      this.isInitialized = true;
  } catch (_error) {
      throw new BankingProviderError(
        'INIT_ERROR',
    `Failed to initialize Budget Insight provider: ${(_error as { message?: string })?.message}`,
    _error as { message?: string }
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
  const response = await this.makeRequest<{ status: string }>('GET', '/2.0/status');
      return response.status === 'OK';
  } catch (_error) {
      return false;
    }
  }

  // Authentification client Budget Insight
  private async authenticateClient(): Promise<void> {
    try {
      const credentials = Buffer.from(
        `${this.config.config.clientId}:${this.config.config.clientSecret}`
      ).toString('base64');

  const response = await this.makeRequest<{ access_token: string; expires_in: number }>('POST', '/2.0/auth/init', {}, {
        'Authorization': `Basic ${credentials}`
      });

      this.accessToken = response.access_token;
      this.tokenExpiresAt = new Date(Date.now() + response.expires_in * 1000);
  } catch (_error) {
      throw new AuthenticationError('Failed to authenticate with Budget Insight API');
    }
  }

  async createConnection(userId: string, bankId: string): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(userId);

    try {
      const bank = this.config.supportedBanks.find(b => b.id === bankId);
      if (!bank) {
        return this.createErrorResponse('BANK_NOT_SUPPORTED', `Bank ${bankId} is not supported`);
      }

      // Budget Insight utilise des "connections" pour les connexions bancaires
  const response = await this.makeRequest<{ id: number; state: string }>('POST', `/2.0/users/${userId}/connections`, {
        id_connector: bankId,
        expand: 'connector'
      });

      const connection: BankConnection = {
        id: crypto.randomUUID(),
        userId,
        providerId: this.providerId,
        providerName: this.providerName,
        bankName: bank.name,
        bankLogo: bank.logo,
        status: 'connecting',
        consentId: response.id.toString(),
        consentExpiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 jours
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          connectionId: response.id,
          connectorId: bankId,
          state: response.state
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
      // En production, récupérer userId et connectionId depuis la base de données
  const _userId = ''; // À récupérer depuis la DB
      const biConnectionId = ''; // À récupérer depuis la DB
      
  const response = await this.makeRequest<{
        id: number;
        id_connector: string;
        state: string;
        last_update: number;
        created: number;
        connector: { name: string; logo?: string };
  }>('GET', `/2.0/users/${_userId}/connections/${biConnectionId}`, {
        expand: 'connector'
      });

      const connection: BankConnection = {
        id: connectionId,
  userId: _userId,
        providerId: this.providerId,
        providerName: this.providerName,
        bankName: response.connector.name,
        bankLogo: response.connector.logo,
        status: this.mapBudgetInsightStatus(response.state),
        consentId: response.id.toString(),
        lastSync: response.last_update ? new Date(response.last_update * 1000) : undefined,
        createdAt: new Date(response.created * 1000),
        updatedAt: new Date(response.last_update * 1000),
        metadata: {
          connectionId: response.id,
          connectorId: response.id_connector,
          state: response.state
        }
      };

      return this.createResponse(connection);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async updateConnection(connectionId: string, _updates: Partial<BankConnection>): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(connectionId);
    
    try {
  const _initUserId = ''; // À récupérer depuis la DB
  const biConnectionId = ''; // À récupérer depuis la DB

  await this.makeRequest<unknown>('PUT', `/2.0/users/${userId}/connections/${biConnectionId}`, {
        // Budget Insight specific updates
      });

      return await this.getConnection(connectionId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async deleteConnection(connectionId: string): Promise<OpenBankingResponse<void>> {
    this.validateConnectionId(connectionId);

    try {
  const _userId2 = ''; // À récupérer depuis la DB
  const biConnectionId = ''; // À récupérer depuis la DB
      
  await this.makeRequest<unknown>('DELETE', `/2.0/users/${_userId2}/connections/${biConnectionId}`);
      
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async refreshConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    this.validateConnectionId(connectionId);

    try {
    const _userId3 = ''; // À récupérer depuis la DB
    const biConnectionId = ''; // À récupérer depuis la DB

  await this.makeRequest<unknown>('POST', `/2.0/users/${_userId3}/connections/${biConnectionId}/sources`);

      return await this.getConnection(connectionId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Authentification PSD2
  async initiateAuth(connectionId: string, _redirectUri: string): Promise<OpenBankingResponse<PSD2AuthFlow>> {
    try {
      const biConnectionId = ''; // À récupérer depuis la DB

      // Budget Insight gère l'authentification via une URL de redirection
  const authUrl = `${this.manageUrl}/auth?connection_id=${biConnectionId}`;

      const authFlow: PSD2AuthFlow = {
        id: crypto.randomUUID(),
        connectionId,
        status: 'redirect_needed',
        redirectUrl: authUrl,
        consentId: biConnectionId,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return this.createResponse(authFlow);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async completeAuth(_authFlowId: string, authCode: string): Promise<OpenBankingResponse<BankConnection>> {
    try {
      // Budget Insight gère l'authentification côté serveur
      // Le statut de la connexion est mis à jour automatiquement
  await this.makeRequest<unknown>('POST', '/2.0/auth/complete', { code: authCode });
      const connectionId = ''; // À récupérer depuis _authFlowId
      return await this.getConnection(connectionId);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleSCA(authFlowId: string, challengeResponse: string): Promise<OpenBankingResponse<PSD2AuthFlow>> {
    try {
  const _userId = ''; // À récupérer depuis authFlowId
  const _biConnectionId = ''; // À récupérer depuis authFlowId

  const response = await this.makeRequest<{ state: string; consent_id: string; expires_at: number }>('POST', `/2.0/users/${_userId}/connections/${_biConnectionId}/sca`, {
        value: challengeResponse
      });

      const authFlow: PSD2AuthFlow = {
        id: authFlowId,
        connectionId: '',
  status: response.state === 'valid' ? 'completed' : 'pending_sca',
  consentId: authFlowId,
  expiresAt: new Date(Date.now() + 15 * 60 * 1000),
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
  const _userId = ''; // À récupérer depuis la DB
  const response = await this.makeRequest<{ accounts: Array<{
        id: number;
        name: string;
        connection: { id: number };
        type: string;
        currency?: { code?: string };
        balance: string;
        coming?: string;
        iban?: string;
        bic?: string;
        number?: string;
        disabled?: boolean;
        last_update: number;
  }>; }>('GET', `/2.0/users/${_userId}/accounts`, {
        expand: 'connection'
      });

      const accounts: BankAccount[] = response.accounts
        .filter((account) => account.connection.id.toString() === connectionId)
        .map((account) => ({
          id: crypto.randomUUID(),
          connectionId,
          accountId: account.id.toString(),
          name: account.name,
          displayName: account.name,
          type: this.mapBudgetInsightAccountType(account.type),
          currency: account.currency?.code || 'EUR',
          balance: parseFloat(account.balance),
          availableBalance: parseFloat(account.coming || account.balance),
          iban: account.iban,
          bic: account.bic,
          accountNumber: account.number,
          isActive: !account.disabled,
          createdAt: new Date(),
          updatedAt: new Date(account.last_update * 1000),
          metadata: {
            budgetInsightAccountId: account.id,
            accountType: account.type
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
  const _userId3 = ''; // À récupérer depuis la DB
  const response = await this.makeRequest<{
        id: number;
        name: string;
        type: string;
        currency?: { code?: string };
        balance: string;
        coming?: string;
        iban?: string;
        bic?: string;
        number?: string;
        disabled?: boolean;
        last_update: number;
  }>('GET', `/2.0/users/${_userId3}/accounts/${accountId}`);

      const account: BankAccount = {
        id: crypto.randomUUID(),
        connectionId,
        accountId: response.id.toString(),
        name: response.name,
        displayName: response.name,
        type: this.mapBudgetInsightAccountType(response.type),
        currency: response.currency?.code || 'EUR',
        balance: parseFloat(response.balance),
        availableBalance: parseFloat(response.coming || response.balance),
        iban: response.iban,
        bic: response.bic,
        accountNumber: response.number,
        isActive: !response.disabled,
        createdAt: new Date(),
        updatedAt: new Date(response.last_update * 1000)
      };

      return this.createResponse(account);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async refreshAccountBalance(connectionId: string, accountId: string): Promise<OpenBankingResponse<BankAccount>> {
    try {
      // Budget Insight synchronise automatiquement lors de la requête
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
  const _userId4 = ''; // À récupérer depuis la DB
      const params: Record<string, string> = {
        limit: (options.limit || 100).toString(),
        expand: 'category'
      };

      if (options.startDate) {
        params.min_date = options.startDate.toISOString().split('T')[0];
      }
      if (options.endDate) {
        params.max_date = options.endDate.toISOString().split('T')[0];
      }
      if (options.cursor) {
        params.offset = options.cursor;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await this.makeRequest<{
        transactions: Array<{
          id: number;
          date: string;
          value_date?: string;
          value: string;
          currency?: { code?: string };
          simplified_wording?: string;
          wording: string;
          category?: { name?: string };
          coming?: boolean;
          reference?: string;
          last_update: number;
          id_category?: string | number;
          state?: string;
        }>;
        pagination?: { next_uri?: string; offset?: number };
      }>('GET', 
        `/2.0/users/${_userId4}/accounts/${accountId}/transactions?${queryString}`
      );

  const transactions: BankTransaction[] = response.transactions.map((tx) => ({
        id: crypto.randomUUID(),
        accountId,
        transactionId: tx.id.toString(),
        date: new Date(tx.date),
        valueDate: new Date(tx.value_date || tx.date),
        amount: parseFloat(tx.value),
        currency: tx.currency?.code || 'EUR',
        description: this.normalizeDescription(tx.simplified_wording || tx.wording),
  originalDescription: (tx as unknown as { original_wording?: string }).original_wording || tx.wording,
        category: tx.category ? this.mapBudgetInsightCategory(tx.category) : undefined,
        type: parseFloat(tx.value) >= 0 ? 'credit' : 'debit',
        status: tx.coming ? 'pending' : 'posted',
        counterparty: tx.simplified_wording,
        reference: tx.reference,
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date(tx.last_update * 1000),
        metadata: {
          budgetInsightTransactionId: tx.id,
          categoryId: tx.id_category,
          state: tx.state
        }
      }));

      const nextCursor = response.pagination && response.pagination.next_uri 
        ? response.pagination.offset?.toString() 
        : undefined;

      return this.createResponse({
        transactions,
        nextCursor
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  async syncTransactions(connectionId: string, accountId: string): Promise<OpenBankingResponse<SyncResult>> {
    try {
  const _userId5 = ''; // À récupérer depuis la DB
  const biConnectionId = ''; // À récupérer depuis la DB

      // Force synchronization avec Budget Insight
  await this.makeRequest<unknown>('POST', `/2.0/users/${_userId5}/connections/${biConnectionId}/sources`);
      
      // Attendre un peu pour la synchronisation
      await new Promise(resolve => setTimeout(resolve, 2000));

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
        nextSyncDate: new Date(Date.now() + 6 * 60 * 60 * 1000) // 6 heures
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

      const syncResultsFiltered = await Promise.all(
        accountsResult.data.map(async (account) => {
          const result = await this.syncTransactions(connectionId, account.accountId);
          return result.success && result.data ? result.data : null;
        })
      );
      const syncResults: SyncResult[] = syncResultsFiltered.filter(
        (r): r is SyncResult => r !== null
      );

      return this.createResponse(syncResults);
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Webhooks
  async setupWebhook(_connectionId: string, _events: string[]): Promise<OpenBankingResponse<void>> {
    try {
      // Budget Insight configure les webhooks au niveau client
      // Cette configuration se fait généralement via le dashboard
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async removeWebhook(_connectionId: string): Promise<OpenBankingResponse<void>> {
    try {
      // Budget Insight webhook removal
      return this.createResponse(undefined);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async processWebhookEvent(event: WebhookEvent): Promise<OpenBankingResponse<void>> {
    try {
      // Traitement spécifique à Budget Insight
      switch (event.type) {
        case 'transaction.created':
          // Traiter la nouvelle transaction
          break;
        case 'account.updated':
          // Traiter la mise à jour du compte
          break;
        default:
          console.warn(`Unhandled webhook event: ${event.type}`);
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
      .createHmac('sha1', this.config.config.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature.replace('sha1=', ''), 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  // Enrichissement
  async categorizeTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>> {
    try {
  const _userId6 = ''; // À récupérer depuis la DB
  const response = await this.makeRequest<{ category?: { name?: string } }>('POST', `/2.0/users/${_userId6}/transactions/categorize`, {
        wording: transaction.description,
        value: transaction.amount
      });

      const enrichedTransaction = {
        ...transaction,
        category: this.mapBudgetInsightCategory(response.category)
      };

      return this.createResponse(enrichedTransaction);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async enrichTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>> {
    // Budget Insight fait l'enrichissement automatiquement
    return this.createResponse(transaction);
  }

  // Gestion des tokens
  async refreshTokens(_connectionId: string): Promise<OpenBankingResponse<void>> {
    // Budget Insight gère les tokens automatiquement
    return this.createResponse(undefined);
  }

  async revokeTokens(connectionId: string): Promise<OpenBankingResponse<void>> {
    return this.deleteConnection(connectionId);
  }

  // Méthodes utilitaires
  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    headers: Record<string, string> = {}
  ): Promise<T> {
    await this.checkRateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CassKai/1.0',
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
          result.error.code || 'API_ERROR',
          result.error.description || 'Unknown API error',
          result.error
        );
      }

      return result;
    } catch (error) {
      if (error instanceof BankingProviderError) {
        throw error;
      }
      const message = (error as { message?: string })?.message || 'Unknown error';
      throw new NetworkError(`Request failed: ${message}`, error);
    }
  }

  protected handleError(error: unknown): OpenBankingResponse<never> {
    if (error instanceof BankingProviderError) {
      return this.createErrorResponse(error.code, error.message, error.details as Record<string, unknown>);
    }

    const message = (error as { message?: string })?.message || 'An unknown error occurred';
    return this.createErrorResponse('UNKNOWN_ERROR', message, error as Record<string, unknown>);
  }

  // Mappers spécifiques à Budget Insight
  private mapBudgetInsightStatus(state: string): BankConnection['status'] {
    switch (state) {
      case 'valid':
        return 'connected';
      case 'pending':
        return 'connecting';
      case 'error':
        return 'error';
      case 'wrongpass':
        return 'error';
      case 'expired':
        return 'expired';
      default:
        return 'error';
    }
  }

  private mapBudgetInsightAccountType(type: string): BankAccount['type'] {
    switch (type) {
      case 'checking':
        return 'checking';
      case 'savings':
        return 'savings';
      case 'card':
        return 'credit';
      case 'loan':
        return 'loan';
      case 'market':
        return 'investment';
      case 'deposit':
        return 'savings';
      default:
        return 'checking';
    }
  }

  private mapBudgetInsightCategory(category: { name?: string } | null | undefined): string {
    if (!category) return 'Autre';

    // Mapping des catégories Budget Insight vers nos catégories
    const categoryMap: Record<string, string> = {
      'food': 'Alimentaire',
      'transport': 'Transport',
      'housing': 'Logement',
      'health': 'Santé',
      'leisure': 'Loisirs',
      'shopping': 'Achats',
      'services': 'Services',
      'taxes': 'Impôts',
      'income': 'Revenus'
    };

  return categoryMap[category.name ?? ''] || category.name || 'Autre';
  }
}