// @ts-nocheck
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BankingService } from './bankingService';
import type { BankConnection, BankAccount, BankTransaction } from '../types/openBanking.types';

// Mock the OpenBankingManager
vi.mock('./openBanking/OpenBankingManager', () => ({
  openBankingManager: {
    initialize: vi.fn().mockResolvedValue(undefined),
    createBankConnection: vi.fn(),
    getUserConnections: vi.fn(),
    getBankConnection: vi.fn(),
    refreshConnection: vi.fn(),
    deleteBankConnection: vi.fn(),
    getAccounts: vi.fn(),
    getTransactions: vi.fn(),
    syncTransactions: vi.fn(),
    reconcileTransaction: vi.fn(),
    processWebhook: vi.fn(),
    createExport: vi.fn(),
    getSyncStatistics: vi.fn(),
    getReconciliationStatistics: vi.fn(),
    healthCheck: vi.fn(),
    dispose: vi.fn(),
  },
}));

describe('BankingService', () => {
  let bankingService: BankingService;
  
  beforeEach(() => {
    bankingService = BankingService.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    bankingService.dispose();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BankingService.getInstance();
      const instance2 = BankingService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Initialization', () => {
    it('should initialize with proper configuration', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      
      await bankingService.initialize();
      
      expect(openBankingManager.initialize).toHaveBeenCalledWith(
        expect.objectContaining({
          providers: expect.objectContaining({
            bridge: expect.any(Object),
            budgetInsight: expect.any(Object),
          }),
          security: expect.any(Object),
          reconciliation: expect.any(Object),
          webhooks: expect.any(Object),
        })
      );
    });

    it('should handle initialization errors', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.initialize.mockRejectedValueOnce(new Error('Init failed'));

      await expect(bankingService.initialize()).rejects.toThrow('Init failed');
    });
  });

  describe('Bank Connections', () => {
    const mockConnection: BankConnection = {
      id: 'conn-123',
      userId: 'user-123',
      providerId: 'bridge',
      providerName: 'Bridge',
      bankName: 'Test Bank',
      status: 'connected',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      await bankingService.initialize();
    });

    it('should create bank connection successfully', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.createBankConnection.mockResolvedValueOnce({
        success: true,
        data: mockConnection,
      });

      const result = await bankingService.createBankConnection('user-123', 'bridge', 'bank-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockConnection);
      expect(openBankingManager.createBankConnection).toHaveBeenCalledWith(
        'user-123',
        'bridge',
        'bank-123'
      );
    });

    it('should handle connection creation errors', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.createBankConnection.mockResolvedValueOnce({
        success: false,
        error: { code: 'BANK_ERROR', message: 'Bank connection failed' },
      });

      const result = await bankingService.createBankConnection('user-123', 'bridge', 'bank-123');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('Bank connection failed');
    });

    it('should get user connections', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.getUserConnections.mockResolvedValueOnce({
        success: true,
        data: [mockConnection],
      });

      const result = await bankingService.getUserBankConnections('user-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockConnection]);
    });

    it('should delete bank connection', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.deleteBankConnection.mockResolvedValueOnce({
        success: true,
        data: undefined,
      });

      const result = await bankingService.deleteBankConnection('conn-123');

      expect(result.success).toBe(true);
      expect(openBankingManager.deleteBankConnection).toHaveBeenCalledWith('conn-123');
    });
  });

  describe('Account Management', () => {
    const mockAccount: BankAccount = {
      id: 'acc-123',
      connectionId: 'conn-123',
      accountId: 'external-acc-123',
      name: 'Test Account',
      displayName: 'My Test Account',
      type: 'checking',
      balance: 1000.50,
      currency: 'EUR',
      iban: 'FR1420041010050500013M02606',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      await bankingService.initialize();
    });

    it('should get bank accounts', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.getAccounts.mockResolvedValueOnce({
        success: true,
        data: [mockAccount],
      });

      const result = await bankingService.getBankAccounts('conn-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockAccount]);
    });
  });

  describe('Transaction Management', () => {
    const mockTransaction: BankTransaction = {
      id: 'txn-123',
      accountId: 'acc-123',
      transactionId: 'external-txn-123',
      date: new Date('2024-01-15'),
      amount: -50.75,
      currency: 'EUR',
      description: 'Test Transaction',
      originalDescription: 'ORIGINAL TEST TRANSACTION',
      type: 'debit',
      status: 'posted',
      isReconciled: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(async () => {
      await bankingService.initialize();
    });

    it('should get bank transactions', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.getTransactions.mockResolvedValueOnce({
        success: true,
        data: { transactions: [mockTransaction], nextCursor: 'cursor-123' },
      });

      const result = await bankingService.getBankTransactions('conn-123', 'acc-123', {
        limit: 10,
        startDate: new Date('2024-01-01'),
      });

      expect(result.success).toBe(true);
      expect(result.data.transactions).toEqual([mockTransaction]);
      expect(result.data.nextCursor).toBe('cursor-123');
    });

    it('should sync transactions', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      openBankingManager.syncTransactions.mockResolvedValueOnce({
        success: true,
        data: { syncedCount: 5, errors: [] },
      });

      const result = await bankingService.syncBankTransactions('conn-123', 'acc-123');

      expect(result.success).toBe(true);
      expect(result.data.syncedCount).toBe(5);
    });
  });

  describe('Data Transformation', () => {
    const mockConnection: BankConnection = {
      id: 'conn-123',
      userId: 'user-123',
      providerId: 'bridge',
      providerName: 'Bridge',
      bankName: 'Test Bank',
      bankLogo: '/logos/test-bank.png',
      status: 'connected',
      lastSync: new Date('2024-01-15T10:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should transform connection for UI', () => {
      const transformed = bankingService.transformConnectionForUI(mockConnection);

      expect(transformed).toEqual({
        id: 'conn-123',
        name: 'Test Bank',
        provider: 'Bridge',
        status: 'Connecté',
        statusColor: 'green',
        lastSync: expect.any(String),
        logo: '/logos/test-bank.png',
        createdAt: mockConnection.createdAt,
        needsAuth: false,
      });
    });

    it('should handle expired connection status', () => {
      const expiredConnection = { ...mockConnection, status: 'expired' as const };
      const transformed = bankingService.transformConnectionForUI(expiredConnection);

      expect(transformed.status).toBe('Expiré');
      expect(transformed.statusColor).toBe('orange');
      expect(transformed.needsAuth).toBe(true);
    });

    it('should transform transaction for UI', () => {
      const mockTransaction: BankTransaction = {
        id: 'txn-123',
        accountId: 'acc-123',
        transactionId: 'external-txn-123',
        date: new Date('2024-01-15'),
        amount: -50.75,
        currency: 'EUR',
        description: 'Test Transaction',
        originalDescription: 'ORIGINAL TEST TRANSACTION',
        category: 'Food',
        type: 'debit',
        status: 'posted',
        counterparty: 'Test Merchant',
        reference: 'REF123',
        isReconciled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const transformed = bankingService.transformTransactionForUI(mockTransaction);

      expect(transformed).toEqual({
        id: 'txn-123',
        date: '2024-01-15',
        description: 'Test Transaction',
        originalDescription: 'ORIGINAL TEST TRANSACTION',
        amount: -50.75,
        formattedAmount: '-50,75\u00A0€',
        currency: 'EUR',
        category: 'Food',
        type: 'debit',
        status: 'Validée',
        statusColor: 'green',
        counterparty: 'Test Merchant',
        reference: 'REF123',
        isReconciled: true,
        reconciliationStatus: 'reconciled',
      });
    });
  });

  describe('Supported Banks', () => {
    it('should return supported banks for Bridge', () => {
      const bridgeBanks = bankingService.getSupportedBanks('bridge');

      expect(bridgeBanks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'bnp_paribas',
            name: 'BNP Paribas',
            country: 'FR',
          }),
        ])
      );
    });

    it('should return supported banks for Budget Insight', () => {
      const budgetInsightBanks = bankingService.getSupportedBanks('budget_insight');

      expect(budgetInsightBanks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'credit_mutuel',
            name: 'Crédit Mutuel',
            country: 'FR',
          }),
        ])
      );
    });
  });

  describe('Statistics and Health', () => {
    beforeEach(async () => {
      await bankingService.initialize();
    });

    it('should get sync statistics', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      const mockStats = {
        totalConnections: 5,
        activeConnections: 4,
        totalAccounts: 12,
        totalTransactions: 1500,
        lastSyncTime: new Date(),
        averageSyncDuration: 2.5,
        syncSuccessRate: 0.95,
        errorsByProvider: {},
      };

      openBankingManager.getSyncStatistics.mockResolvedValueOnce(mockStats);

      const result = await bankingService.getSyncStatistics();
      expect(result).toEqual(mockStats);
    });

    it('should perform health check', async () => {
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      const mockHealth = {
        status: 'healthy' as const,
        providers: { bridge: true, budget_insight: true },
        services: { encryption: true, reconciliation: true },
      };

      openBankingManager.healthCheck.mockResolvedValueOnce(mockHealth);

      const result = await bankingService.healthCheck();
      expect(result).toEqual(mockHealth);
    });
  });

  describe('Error Handling', () => {
    it('should handle service not initialized', async () => {
      const uninitializedService = new (BankingService as any)();
      
      const result = await uninitializedService.getUserBankConnections('user-123');
      
      // Should initialize automatically
      expect(result).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      await bankingService.initialize();
      const { openBankingManager } = await import('./openBanking/OpenBankingManager');
      
      openBankingManager.getUserConnections.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw, but return error response
      await expect(bankingService.getUserBankConnections('user-123')).resolves.toBeDefined();
    });
  });

  describe('PSD2 Authentication', () => {
    beforeEach(async () => {
      await bankingService.initialize();
    });

    it('should initiate PSD2 authentication', async () => {
      const result = await bankingService.initiatePSD2Auth('conn-123');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          connectionId: 'conn-123',
          status: 'redirect_needed',
          redirectUrl: expect.stringContaining('https://auth.bank.example.com'),
          consentId: expect.any(String),
          expiresAt: expect.any(Date),
        })
      );
    });

    it('should use custom redirect URI', async () => {
      const customUri = 'https://myapp.com/callback';
      const result = await bankingService.initiatePSD2Auth('conn-123', customUri);

      expect(result.success).toBe(true);
      expect(result.data.redirectUrl).toContain(encodeURIComponent(customUri));
    });
  });
});