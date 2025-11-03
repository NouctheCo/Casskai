import { 
  BankConnection, 
  BankAccount, 
  BankTransaction, 
  OpenBankingResponse,
  SyncResult,
  PSD2AuthFlow,
  WebhookEvent,
  BankingProvider as BankingProviderConfig
} from '../../../types/openBanking.types';

// Interface abstraite pour tous les providers bancaires
export abstract class BankingProvider {
  protected config: BankingProviderConfig;
  protected isInitialized: boolean = false;

  constructor(config: BankingProviderConfig) {
    this.config = config;
  }

  // Méthodes d'initialisation
  abstract initialize(): Promise<void>;
  abstract isHealthy(): Promise<boolean>;

  // Gestion des connexions
  abstract createConnection(userId: string, bankId: string): Promise<OpenBankingResponse<BankConnection>>;
  abstract getConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>>;
  abstract updateConnection(connectionId: string, updates: Partial<BankConnection>): Promise<OpenBankingResponse<BankConnection>>;
  abstract deleteConnection(connectionId: string): Promise<OpenBankingResponse<void>>;
  abstract refreshConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>>;

  // Authentification PSD2/SCA
  abstract initiateAuth(connectionId: string, redirectUri: string): Promise<OpenBankingResponse<PSD2AuthFlow>>;
  abstract completeAuth(authFlowId: string, authCode: string): Promise<OpenBankingResponse<BankConnection>>;
  abstract handleSCA(authFlowId: string, challengeResponse: string): Promise<OpenBankingResponse<PSD2AuthFlow>>;

  // Gestion des comptes
  abstract getAccounts(connectionId: string): Promise<OpenBankingResponse<BankAccount[]>>;
  abstract getAccount(connectionId: string, accountId: string): Promise<OpenBankingResponse<BankAccount>>;
  abstract refreshAccountBalance(connectionId: string, accountId: string): Promise<OpenBankingResponse<BankAccount>>;

  // Gestion des transactions
  abstract getTransactions(
    connectionId: string, 
    accountId: string, 
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      cursor?: string;
    }
  ): Promise<OpenBankingResponse<{ transactions: BankTransaction[]; nextCursor?: string }>>;

  abstract syncTransactions(connectionId: string, accountId: string): Promise<OpenBankingResponse<SyncResult>>;
  abstract syncAllAccounts(connectionId: string): Promise<OpenBankingResponse<SyncResult[]>>;

  // Webhooks
  abstract setupWebhook(connectionId: string, events: string[]): Promise<OpenBankingResponse<void>>;
  abstract removeWebhook(connectionId: string): Promise<OpenBankingResponse<void>>;
  abstract processWebhookEvent(event: WebhookEvent): Promise<OpenBankingResponse<void>>;
  abstract validateWebhookSignature(payload: string, signature: string): boolean;

  // Catégorisation et enrichissement
  abstract categorizeTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>>;
  abstract enrichTransaction(transaction: BankTransaction): Promise<OpenBankingResponse<BankTransaction>>;

  // Gestion des tokens
  abstract refreshTokens(connectionId: string): Promise<OpenBankingResponse<void>>;
  abstract revokeTokens(connectionId: string): Promise<OpenBankingResponse<void>>;

  // Méthodes utilitaires
  protected abstract makeRequest<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: unknown,
    headers?: Record<string, string>
  ): Promise<T>;

  protected abstract handleError(error: unknown): OpenBankingResponse<never>;

  protected createResponse<T>(data: T): OpenBankingResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        provider: this.config.id,
        requestId: crypto.randomUUID(),
        timestamp: new Date()
      }
    };
  }

  protected createErrorResponse(code: string, message: string, details?: Record<string, unknown>): OpenBankingResponse<never> {
    return {
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        provider: this.config.id,
        requestId: crypto.randomUUID(),
        timestamp: new Date()
      }
    };
  }

  // Rate limiting
  protected async checkRateLimit(): Promise<boolean> {
    if (!this.config.config.rateLimit) return true;
    
    // Implémentation basique du rate limiting
    // En production, utiliser Redis ou une solution plus robuste
  const _key = `rate_limit:${this.config.id}`;
    const now = Date.now();
  const _windowStart = now - this.config.config.rateLimit.windowMs;
    
    // Cette implémentation devrait être remplacée par une vraie solution de rate limiting
    return true;
  }

  // Retry logic avec backoff exponentiel
  protected async retryRequest<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
  let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
  // eslint-disable-next-line no-await-in-loop
  return await operation();
      } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
        lastError = error;
        
        if (attempt === maxRetries) break;
        
        // Backoff exponentiel avec jitter
  const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
  // eslint-disable-next-line no-await-in-loop
  await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Validation des paramètres
  protected validateConnectionId(connectionId: string): void {
    if (!connectionId || typeof connectionId !== 'string') {
      throw new Error('Invalid connection ID');
    }
  }

  protected validateAccountId(accountId: string): void {
    if (!accountId || typeof accountId !== 'string') {
      throw new Error('Invalid account ID');
    }
  }

  protected validateDateRange(startDate?: Date, endDate?: Date): void {
    if (startDate && endDate && startDate > endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  // Normalisation des données
  protected normalizeAmount(amount: number | string): number {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return Math.round(numAmount * 100) / 100; // Arrondi à 2 décimales
  }

  protected normalizeDate(date: string | Date): Date {
    return date instanceof Date ? date : new Date(date);
  }

  protected normalizeDescription(description: string): string {
    return description.trim().replace(/\s+/g, ' ');
  }

  // Getters
  get providerId(): string {
    return this.config.id;
  }

  get providerName(): string {
    return this.config.name;
  }

  get isReady(): boolean {
    return this.isInitialized;
  }

  get supportedCountries(): string[] {
    return this.config.supportedCountries;
  }

  get supportsPSD2(): boolean {
    return this.config.features.psd2Compliance;
  }

  get supportsWebhooks(): boolean {
    return this.config.features.webhookSupport;
  }

  // Méthodes de lifecycle
  async dispose(): Promise<void> {
    this.isInitialized = false;
  }
}

// Factory pour créer des providers
export class BankingProviderFactory {
  private static providers = new Map<string, new (config: BankingProviderConfig) => BankingProvider>();

  static register(providerId: string, providerClass: new (config: BankingProviderConfig) => BankingProvider): void {
    this.providers.set(providerId, providerClass);
  }

  static create(config: BankingProviderConfig): BankingProvider {
    const ProviderClass = this.providers.get(config.id);
    if (!ProviderClass) {
      throw new Error(`Unknown provider: ${config.id}`);
    }
    return new ProviderClass(config);
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Types d'erreurs spécialisées
export class BankingProviderError extends Error {
  constructor(
    public code: string,
    message: string,
  public details?: unknown,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'BankingProviderError';
  }
}

export class AuthenticationError extends BankingProviderError {
  constructor(message: string, details?: unknown) {
    super('AUTH_ERROR', message, details, false);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends BankingProviderError {
  constructor(retryAfter?: number) {
    super('RATE_LIMIT', 'Rate limit exceeded', { retryAfter }, true);
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends BankingProviderError {
  constructor(message: string, details?: unknown) {
    super('NETWORK_ERROR', message, details, true);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends BankingProviderError {
  constructor(message: string, field?: string) {
    super('VALIDATION_ERROR', message, { field }, false);
    this.name = 'ValidationError';
  }
}