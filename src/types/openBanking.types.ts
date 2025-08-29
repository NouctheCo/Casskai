// Types pour le système Open Banking
export interface BankConnection {
  id: string;
  userId: string;
  providerId: string;
  providerName: string;
  bankName: string;
  bankLogo?: string;
  status: 'connected' | 'connecting' | 'error' | 'expired' | 'pending_auth';
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  consentId?: string;
  consentExpiresAt?: Date;
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface BankAccount {
  id: string;
  connectionId: string;
  accountId: string; // ID de la banque
  name: string;
  displayName?: string;
  type: 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'business';
  currency: string;
  balance: number;
  availableBalance?: number;
  iban?: string;
  bic?: string;
  accountNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface BankTransaction {
  id: string;
  accountId: string;
  transactionId: string; // ID de la banque
  date: Date;
  valueDate?: Date;
  amount: number;
  currency: string;
  description: string;
  originalDescription: string;
  category?: string;
  subcategory?: string;
  type: 'debit' | 'credit';
  status: 'posted' | 'pending' | 'canceled';
  counterparty?: string;
  counterpartyAccount?: string;
  reference?: string;
  merchantInfo?: MerchantInfo;
  location?: TransactionLocation;
  isReconciled: boolean;
  reconciledWith?: string[];
  reconciledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface MerchantInfo {
  name: string;
  category: string;
  mcc?: string; // Merchant Category Code
  website?: string;
  logo?: string;
}

export interface TransactionLocation {
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
}

// Types pour les providers
export interface BankingProvider {
  id: string;
  name: string;
  displayName: string;
  type: 'aggregator' | 'direct_api' | 'screen_scraping';
  supportedCountries: string[];
  supportedBanks: SupportedBank[];
  features: ProviderFeatures;
  isActive: boolean;
  config: ProviderConfig;
}

export interface SupportedBank {
  id: string;
  name: string;
  displayName: string;
  country: string;
  bic?: string;
  logo?: string;
  loginType: 'credentials' | 'oauth2' | 'redirect';
  supportsBusinessAccounts: boolean;
  supportsPSD2: boolean;
  features: BankFeatures;
}

export interface BankFeatures {
  accounts: boolean;
  transactions: boolean;
  balance: boolean;
  paymentInitiation: boolean;
  webhooks: boolean;
  realTimeNotifications: boolean;
}

export interface ProviderFeatures {
  psd2Compliance: boolean;
  strongCustomerAuth: boolean;
  realTimeTransactions: boolean;
  webhookSupport: boolean;
  categorization: boolean;
  merchantEnrichment: boolean;
}

export interface ProviderConfig {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookUrl?: string;
  // Secret used to validate incoming webhook signatures (if provider supports it)
  webhookSecret?: string;
  scopes: string[];
  environment: 'sandbox' | 'production';
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
}

// Types pour l'authentification PSD2
export interface PSD2AuthFlow {
  id: string;
  connectionId: string;
  status: 'initiated' | 'redirect_needed' | 'pending_sca' | 'completed' | 'failed';
  redirectUrl?: string;
  scaMethod?: SCAMethod;
  challengeData?: ChallengeData;
  consentId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SCAMethod {
  type: 'sms' | 'app' | 'hardware_token' | 'biometric';
  description: string;
  challengeData?: Record<string, any>;
}

export interface ChallengeData {
  challengeId: string;
  data: string;
  image?: string;
  format: 'text' | 'image' | 'qr_code';
}

// Types pour la réconciliation
export interface ReconciliationRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  isActive: boolean;
  conditions: ReconciliationCondition[];
  actions: ReconciliationAction[];
  autoApply: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReconciliationCondition {
  field: 'amount' | 'date' | 'description' | 'counterparty' | 'reference' | 'category';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'range' | 'date_range';
  value: string | number | Date | [string | number | Date, string | number | Date];
  caseSensitive?: boolean;
}

export interface ReconciliationAction {
  type: 'match' | 'categorize' | 'split' | 'merge' | 'flag' | 'create_entry';
  parameters: Record<string, any>;
}

export interface ReconciliationMatch {
  id: string;
  transactionId: string;
  accountingEntryId: string;
  matchType: 'automatic' | 'manual' | 'rule_based';
  confidence: number;
  ruleId?: string;
  discrepancy?: {
    amount?: number;
    date?: number; // jours de différence
    description?: string;
  };
  status: 'matched' | 'partial' | 'disputed' | 'resolved';
  reviewedBy?: string;
  reviewedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AccountingEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  reference?: string;
  category?: string;
  isReconciled: boolean;
  reconciledWith?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les webhooks
export interface WebhookEvent {
  id: string;
  type:
    | 'transaction.created'
    | 'transaction.updated'
    | 'account.updated'
    | 'connection.status_changed'
    | 'connection.error'
    | 'connection.expired'
    | 'unknown';
  providerId: string;
  connectionId: string;
  data: Record<string, any>;
  timestamp: Date;
  processed: boolean;
  processedAt?: Date;
  retryCount: number;
  lastError?: string;
}

export interface WebhookConfig {
  id: string;
  providerId: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Types pour la sécurité
export interface EncryptedCredentials {
  id: string;
  userId: string;
  providerId: string;
  encryptedData: string;
  keyId: string;
  algorithm: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface TokenRotationLog {
  id: string;
  connectionId: string;
  oldTokenHash: string;
  newTokenHash: string;
  reason: 'scheduled' | 'expired' | 'error' | 'manual';
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
}

// Types pour l'export comptable
export interface ExportFormat {
  id: string;
  name: string;
  displayName: string;
  software: 'sage' | 'quickbooks' | 'cegid' | 'ebp' | 'custom';
  version?: string;
  fileFormat: 'xml' | 'csv' | 'json' | 'txt';
  mapping: FieldMapping[];
  validation: ValidationRule[];
  isActive: boolean;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: FieldTransformation;
  required: boolean;
  defaultValue?: string;
}

export interface FieldTransformation {
  type: 'format_date' | 'format_currency' | 'truncate' | 'uppercase' | 'lowercase' | 'regex_replace' | 'lookup';
  parameters: Record<string, any>;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'range' | 'custom';
  parameters: Record<string, any>;
  errorMessage: string;
}

export interface ExportJob {
  id: string;
  userId: string;
  formatId: string;
  parameters: {
    dateRange: {
      start: Date;
      end: Date;
    };
    accountIds?: string[];
    includeReconciled?: boolean;
    includeUnreconciled?: boolean;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Types pour les réponses API
export interface OpenBankingResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  details?: Record<string, unknown>;
  };
  metadata?: {
    provider: string;
    requestId: string;
    timestamp: Date;
    rateLimitRemaining?: number;
  };
}

export interface SyncResult {
  accountId: string;
  transactionsAdded: number;
  transactionsUpdated: number;
  errors: SyncError[];
  lastSyncDate: Date;
  nextSyncDate?: Date;
}

export interface SyncError {
  code: string;
  message: string;
  transactionId?: string;
  recoverable: boolean;
}

// Types pour la configuration
export interface OpenBankingConfig {
  providers: {
    bridge: BridgeConfig;
    budgetInsight: BudgetInsightConfig;
    custom?: CustomProviderConfig;
  };
  security: {
    encryptionKey: string;
    tokenRotationInterval: number;
    auditLogRetention: number;
  };
  reconciliation: {
    autoMatchThreshold: number;
    reviewRequiredThreshold: number;
    maxDiscrepancyAmount: number;
    maxDiscrepancyDays: number;
  };
  webhooks: {
    enabled: boolean;
    retryAttempts: number;
    timeoutMs: number;
  };
}

export interface BridgeConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  version: string;
  webhookSecret: string;
}

export interface BudgetInsightConfig {
  clientId: string;
  clientSecret: string;
  baseUrl: string;
  manageUrl: string;
  webhookSecret: string;
}

export interface CustomProviderConfig {
  [key: string]: any;
}

// Types pour les statistiques
export interface SyncStatistics {
  totalConnections: number;
  activeConnections: number;
  totalAccounts: number;
  totalTransactions: number;
  lastSyncTime: Date;
  averageSyncDuration: number;
  syncSuccessRate: number;
  errorsByProvider: Record<string, number>;
}

export interface ReconciliationStatistics {
  totalTransactions: number;
  reconciledTransactions: number;
  pendingReconciliation: number;
  discrepancies: number;
  autoMatchRate: number;
  avgProcessingTime: number;
}