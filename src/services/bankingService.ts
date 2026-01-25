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
import { openBankingManager } from './openBanking/OpenBankingManager';
import { logger } from '@/lib/logger';
import { formatCurrency as formatCurrencyLib } from '@/lib/utils';
import {
  BankConnection, 
  BankAccount,
  BankTransaction, 
  OpenBankingResponse,
  PSD2AuthFlow,
  ReconciliationMatch
} from '../types/openBanking.types';
// Service unifié pour l'intégration bancaire
export class BankingService {
  private static instance: BankingService;
  private isInitialized = false;
  private constructor() {}
  static getInstance(): BankingService {
    if (!this.instance) {
      this.instance = new BankingService();
    }
    return this.instance;
  }
  // Initialiser le service bancaire
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      // Configuration Open Banking (en production, récupérer depuis variables d'environnement)
      const config = {
        providers: {
          bridge: {
            clientId: process.env.REACT_APP_BRIDGE_CLIENT_ID || 'demo_client_id',
            clientSecret: process.env.REACT_APP_BRIDGE_CLIENT_SECRET || 'demo_client_secret',
            baseUrl: process.env.REACT_APP_BRIDGE_BASE_URL || 'https://api.bridgeapi.io',
            version: '2021-06-01',
            webhookSecret: process.env.REACT_APP_BRIDGE_WEBHOOK_SECRET || 'demo_webhook_secret'
          },
          budgetInsight: {
            clientId: process.env.REACT_APP_BUDGET_INSIGHT_CLIENT_ID || 'demo_client_id',
            clientSecret: process.env.REACT_APP_BUDGET_INSIGHT_CLIENT_SECRET || 'demo_client_secret',
            baseUrl: process.env.REACT_APP_BUDGET_INSIGHT_BASE_URL || 'https://api.budget-insight.com',
            manageUrl: process.env.REACT_APP_BUDGET_INSIGHT_MANAGE_URL || 'https://manage.budget-insight.com',
            webhookSecret: process.env.REACT_APP_BUDGET_INSIGHT_WEBHOOK_SECRET || 'demo_webhook_secret'
          }
        },
        security: {
          encryptionKey: process.env.REACT_APP_ENCRYPTION_KEY || 'demo-encryption-key-32-characters',
          tokenRotationInterval: 24 * 60 * 60 * 1000, // 24 heures
          auditLogRetention: 30 * 24 * 60 * 60 * 1000 // 30 jours
        },
        reconciliation: {
          autoMatchThreshold: 0.85,
          reviewRequiredThreshold: 0.6,
          maxDiscrepancyAmount: 0.01,
          maxDiscrepancyDays: 7
        },
        webhooks: {
          enabled: true,
          retryAttempts: 3,
          timeoutMs: 5000
        }
      };
      await openBankingManager.initialize(config);
      this.isInitialized = true;
      logger.warn('Banking', 'Banking Service initialized successfully');
    } catch (error) {
      logger.error('Banking', 'Failed to initialize Banking Service:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  // GESTION DES CONNEXIONS BANCAIRES
  // Créer une nouvelle connexion bancaire
  async createBankConnection(
    userId: string, 
    providerId: 'bridge' | 'budget_insight', 
    bankId: string
  ): Promise<OpenBankingResponse<BankConnection>> {
    await this.ensureInitialized();
    return await openBankingManager.createBankConnection(userId, providerId, bankId);
  }
  // Obtenir toutes les connexions d'un utilisateur
  async getUserBankConnections(userId: string): Promise<OpenBankingResponse<BankConnection[]>> {
    await this.ensureInitialized();
    try {
      const res = await openBankingManager.getUserConnections(userId);
      // If provider unexpectedly returns undefined/null, map to error response
      if (!res) {
        return {
          success: false,
          error: {
            code: 'UNEXPECTED_RESPONSE',
            message: 'No response from provider',
          },
        } as OpenBankingResponse<BankConnection[]>;
      }
      return res;
    } catch (error) {
      // Ne pas lancer l'erreur, renvoyer une réponse d'erreur conforme
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: (error as Error)?.message || 'Unknown error',
        },
      } as OpenBankingResponse<BankConnection[]>;
    }
  }
  // Obtenir une connexion spécifique
  async getBankConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    await this.ensureInitialized();
    return await openBankingManager.getBankConnection(connectionId);
  }
  // Rafraîchir une connexion
  async refreshBankConnection(connectionId: string): Promise<OpenBankingResponse<BankConnection>> {
    await this.ensureInitialized();
    return await openBankingManager.refreshConnection(connectionId);
  }
  // Supprimer une connexion
  async deleteBankConnection(connectionId: string): Promise<OpenBankingResponse<void>> {
    await this.ensureInitialized();
    return await openBankingManager.deleteBankConnection(connectionId);
  }
  // GESTION DES COMPTES
  // Obtenir les comptes d'une connexion
  async getBankAccounts(connectionId: string): Promise<OpenBankingResponse<BankAccount[]>> {
    await this.ensureInitialized();
    return await openBankingManager.getAccounts(connectionId);
  }
  // GESTION DES TRANSACTIONS
  // Obtenir les transactions d'un compte
  async getBankTransactions(
    connectionId: string,
    accountId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      cursor?: string;
    }
  ): Promise<OpenBankingResponse<{ transactions: BankTransaction[]; nextCursor?: string }>> {
    await this.ensureInitialized();
    return await openBankingManager.getTransactions(connectionId, accountId, options);
  }
  // Synchroniser les transactions
  async syncBankTransactions(connectionId: string, accountId: string): Promise<OpenBankingResponse<any>> {
    await this.ensureInitialized();
    return await openBankingManager.syncTransactions(connectionId, accountId);
  }
  // AUTHENTIFICATION PSD2
  // Initier l'authentification PSD2
  async initiatePSD2Auth(connectionId: string, redirectUri?: string): Promise<OpenBankingResponse<PSD2AuthFlow>> {
    await this.ensureInitialized();
    // Le redirectUri par défaut pour l'application
    const defaultRedirectUri = `${window.location.origin}/banking/auth/callback`;
    // En production, utiliser la méthode appropriée du provider
    // Pour l'instant, retourner un mock de l'authentification PSD2
    return {
      success: true,
      data: {
        id: crypto.randomUUID(),
        connectionId,
        status: 'redirect_needed',
        redirectUrl: `https://auth.bank.example.com/psd2?redirect_uri=${encodeURIComponent(redirectUri || defaultRedirectUri)}`,
        consentId: crypto.randomUUID(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  }
  // RÉCONCILIATION
  // Réconcilier une transaction
  async reconcileTransaction(
    transactionId: string,
    accountingEntries: any[]
  ): Promise<OpenBankingResponse<ReconciliationMatch[]>> {
    await this.ensureInitialized();
    return await openBankingManager.reconcileTransaction(transactionId, accountingEntries);
  }
  // WEBHOOKS
  // Traiter un webhook
  async processWebhook(
    providerId: string,
    payload: any,
    signature: string,
    headers: Record<string, string>
  ): Promise<OpenBankingResponse<void>> {
    await this.ensureInitialized();
    return await openBankingManager.processWebhook(providerId, payload, signature, headers);
  }
  // EXPORT
  // Créer un export comptable
  async createAccountingExport(
    userId: string,
    formatId: 'sage-standard' | 'quickbooks-iif' | 'cegid-xml',
    parameters: {
      dateRange: {
        start: Date;
        end: Date;
      };
      accountIds?: string[];
      includeReconciled?: boolean;
      includeUnreconciled?: boolean;
    }
  ): Promise<OpenBankingResponse<any>> {
    await this.ensureInitialized();
    return await openBankingManager.createExport(userId, formatId, parameters);
  }
  // UTILITAIRES POUR L'UI
  // Obtenir les banques supportées par provider
  getSupportedBanks(providerId: 'bridge' | 'budget_insight'): Array<{
    id: string;
    name: string;
    country: string;
    logo?: string;
  }> {
    // En production, récupérer depuis l'API du provider
    const mockBanks = {
      bridge: [
        { id: 'bnp_paribas', name: 'BNP Paribas', country: 'FR', logo: '/banks/bnp.png' },
        { id: 'credit_agricole', name: 'Crédit Agricole', country: 'FR', logo: '/banks/ca.png' },
        { id: 'societe_generale', name: 'Société Générale', country: 'FR', logo: '/banks/sg.png' },
        { id: 'lcl', name: 'LCL', country: 'FR', logo: '/banks/lcl.png' },
        { id: 'banque_populaire', name: 'Banque Populaire', country: 'FR', logo: '/banks/bp.png' }
      ],
      budget_insight: [
        { id: 'credit_mutuel', name: 'Crédit Mutuel', country: 'FR', logo: '/banks/cm.png' },
        { id: 'la_banque_postale', name: 'La Banque Postale', country: 'FR', logo: '/banks/lbp.png' },
        { id: 'caisse_epargne', name: 'Caisse d\'Épargne', country: 'FR', logo: '/banks/ce.png' },
        { id: 'hsbc', name: 'HSBC France', country: 'FR', logo: '/banks/hsbc.png' }
      ]
    };
    return mockBanks[providerId] || [];
  }
  // Obtenir les statistiques de synchronisation
  async getSyncStatistics() {
    await this.ensureInitialized();
    return await openBankingManager.getSyncStatistics();
  }
  // Obtenir les statistiques de réconciliation
  async getReconciliationStatistics() {
    await this.ensureInitialized();
    return await openBankingManager.getReconciliationStatistics();
  }
  // Vérifier la santé du système
  async healthCheck() {
    await this.ensureInitialized();
    return await openBankingManager.healthCheck();
  }
  // MÉTHODES DE TRANSFORMATION POUR L'UI
  // Transformer une BankConnection en format UI
  transformConnectionForUI(connection: BankConnection) {
    return {
      id: connection.id,
      name: connection.bankName,
      provider: connection.providerName,
      status: this.getConnectionStatusLabel(connection.status),
      statusColor: this.getConnectionStatusColor(connection.status),
      lastSync: connection.lastSync ? this.formatLastSync(connection.lastSync) : 'Jamais synchronisé',
      logo: connection.bankLogo || '/banks/default.png',
      createdAt: connection.createdAt,
      needsAuth: connection.status === 'expired' || connection.status === 'error'
    };
  }
  // Transformer un BankAccount en format UI
  transformAccountForUI(account: BankAccount, connection: BankConnection) {
    return {
      id: account.id,
      connectionId: account.connectionId,
      name: account.displayName || account.name,
      type: this.getAccountTypeLabel(account.type),
      balance: this.formatCurrency(account.balance, account.currency),
      availableBalance: account.availableBalance ? this.formatCurrency(account.availableBalance, account.currency) : null,
      iban: account.iban,
      accountNumber: account.accountNumber,
      bankName: connection.bankName,
      bankLogo: connection.bankLogo || '/banks/default.png',
      isActive: account.isActive,
      lastUpdate: this.formatLastSync(account.updatedAt)
    };
  }
  // Transformer une BankTransaction en format UI
  transformTransactionForUI(transaction: BankTransaction) {
    return {
      id: transaction.id,
      date: transaction.date.toISOString().split('T')[0],
      description: transaction.description,
      originalDescription: transaction.originalDescription,
      amount: transaction.amount,
      formattedAmount: this.formatCurrency(transaction.amount, transaction.currency),
      currency: transaction.currency,
      category: transaction.category || 'Non catégorisé',
      type: transaction.type,
      status: this.getTransactionStatusLabel(transaction.status),
      statusColor: this.getTransactionStatusColor(transaction.status),
      counterparty: transaction.counterparty,
      reference: transaction.reference,
      isReconciled: transaction.isReconciled,
      reconciliationStatus: transaction.isReconciled ? 'reconciled' : 'pending'
    };
  }
  // MÉTHODES UTILITAIRES PRIVÉES
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  private getConnectionStatusLabel(status: BankConnection['status']): string {
    const labels = {
      connected: 'Connecté',
      connecting: 'Connexion en cours',
      error: 'Erreur',
      expired: 'Expiré',
      pending_auth: 'Authentification requise'
    };
    return labels[status] || status;
  }
  private getConnectionStatusColor(status: BankConnection['status']): string {
    const colors = {
      connected: 'green',
      connecting: 'blue',
      error: 'red',
      expired: 'orange',
      pending_auth: 'yellow'
    };
    return colors[status] || 'gray';
  }
  private getAccountTypeLabel(type: BankAccount['type']): string {
    const labels = {
      checking: 'Compte courant',
      savings: 'Compte épargne',
      credit: 'Carte de crédit',
      loan: 'Prêt',
      investment: 'Investissement',
      business: 'Professionnel'
    };
    return labels[type] || type;
  }
  private getTransactionStatusLabel(status: BankTransaction['status']): string {
    const labels = {
      posted: 'Validée',
      pending: 'En attente',
      canceled: 'Annulée'
    };
    return labels[status] || status;
  }
  private getTransactionStatusColor(status: BankTransaction['status']): string {
    const colors = {
      posted: 'green',
      pending: 'orange',
      canceled: 'red'
    };
    return colors[status] || 'gray';
  }
  private formatCurrency(amount: number, _currency: string = 'EUR'): string {
    // Delegate to central utility which handles company fallback
    return formatCurrencyLib(amount, _currency);
  }
  private formatLastSync(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffMinutes < 1) {
      return 'À l\'instant';
    } else if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays === 1) {
      return 'Hier';
    } else {
      return `Il y a ${diffDays} jours`;
    }
  }
  // Getters
  get initialized(): boolean {
    return this.isInitialized;
  }
  // Cleanup
  dispose(): void {
    if (this.isInitialized) {
      openBankingManager.dispose();
      this.isInitialized = false;
    }
  }
}
// Instance singleton
export const bankingService = BankingService.getInstance();