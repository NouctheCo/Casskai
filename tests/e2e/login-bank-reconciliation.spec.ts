import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

/**
 * E2E Test: Login -> Bank Transaction Reconciliation
 * Covers: User login -> Import bank data -> Reconcile transactions
 */

test.describe('Bank Reconciliation Workflow', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testCompanyId: string;
  let testBankAccountId: string;

  test.beforeAll(async () => {
    // Create test user and company data
    const timestamp = Date.now();
    testUserEmail = `banktest+${timestamp}@casskai.test`;

    // Create test user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'TestPassword123!',
      email_confirmed_at: new Date().toISOString()
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authUser.user.id;

    // Create test company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Bank Test Company',
        email: testUserEmail,
        country: 'FR',
        currency: 'EUR',
        created_by: testUserId,
        onboarding_completed: true
      })
      .select()
      .single();

    if (companyError || !company) {
      throw new Error('Failed to create test company');
    }

    testCompanyId = company.id;

    // Create test bank account
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .insert({
        company_id: testCompanyId,
        name: 'Test Business Account',
        account_number: 'FR7612345678901234567890',
        iban: 'FR7612345678901234567890',
        bank_name: 'Test Bank',
        currency: 'EUR',
        balance: 10000.00,
        created_by: testUserId
      })
      .select()
      .single();

    if (bankError || !bankAccount) {
      throw new Error('Failed to create test bank account');
    }

    testBankAccountId = bankAccount.id;

    // Create sample bank transactions
    const transactions = [
      {
        company_id: testCompanyId,
        account_id: testBankAccountId,
        date: '2024-01-15',
        amount: -1500.00,
        description: 'VIREMENT SALAIRE EMPLOYE',
        reference: 'VIR240115001',
        category: 'expense'
      },
      {
        company_id: testCompanyId,
        account_id: testBankAccountId,
        date: '2024-01-16',
        amount: 2500.00,
        description: 'FACTURE CLIENT ABC SARL',
        reference: 'CHQ240116001',
        category: 'income'
      },
      {
        company_id: testCompanyId,
        account_id: testBankAccountId,
        date: '2024-01-17',
        amount: -350.75,
        description: 'FOURNITURES BUREAU OFFICE+',
        reference: 'CB240117001',
        category: 'expense'
      }
    ];

    await supabase.from('bank_transactions').insert(transactions);

    // Create corresponding accounting entries for reconciliation
    const accountingEntries = [
      {
        company_id: testCompanyId,
        account_number: '641',
        date: '2024-01-15',
        debit: 1500.00,
        credit: 0,
        amount: 1500.00,
        description: 'Salaire employé',
        reference: 'VIR240115001'
      },
      {
        company_id: testCompanyId,
        account_number: '411',
        date: '2024-01-16',
        debit: 2500.00,
        credit: 0,
        amount: 2500.00,
        description: 'Paiement facture ABC SARL',
        reference: 'CHQ240116001'
      }
      // Note: Missing entry for office supplies to test unmatched transactions
    ];

    await supabase.from('accounting_entries').insert(accountingEntries);
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testCompanyId) {
      await supabase.from('bank_transactions').delete().eq('company_id', testCompanyId);
      await supabase.from('accounting_entries').delete().eq('company_id', testCompanyId);
      await supabase.from('bank_accounts').delete().eq('company_id', testCompanyId);
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
    
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('should complete bank reconciliation workflow', async ({ page }) => {
    // Step 1: User Login
    await test.step('User logs in successfully', async () => {
      await page.goto('/auth');
      
      // Fill login form
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      
      // Submit login
      await page.click('[data-testid="login-button"]');
      
      // Should redirect to dashboard
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    // Step 2: Navigate to Bank Management
    await test.step('Navigate to bank management', async () => {
      await page.click('[data-testid="sidebar-banks"]');
      await page.waitForURL('**/banks**');
      
      // Verify bank account is listed
      await expect(page.locator('[data-testid="bank-account-test-business-account"]')).toBeVisible();
      await expect(page.locator('[data-testid="bank-balance"]')).toContainText('10 000,00 €');
    });

    // Step 3: View Bank Transactions
    await test.step('View imported bank transactions', async () => {
      // Click on the bank account to view transactions
      await page.click('[data-testid="bank-account-test-business-account"]');
      
      // Should show transactions list
      await expect(page.locator('[data-testid="transactions-list"]')).toBeVisible();
      
      // Verify transactions are displayed
      await expect(page.locator('[data-testid="transaction-row"]')).toHaveCount(3);
      
      // Check specific transactions
      await expect(page.locator('text=VIREMENT SALAIRE EMPLOYE')).toBeVisible();
      await expect(page.locator('text=FACTURE CLIENT ABC SARL')).toBeVisible();
      await expect(page.locator('text=FOURNITURES BUREAU OFFICE+')).toBeVisible();
    });

    // Step 4: Start Reconciliation Process
    await test.step('Start bank reconciliation', async () => {
      // Click reconciliation button
      await page.click('[data-testid="start-reconciliation-button"]');
      
      // Should navigate to reconciliation page
      await page.waitForURL('**/reconciliation**');
      await expect(page.locator('[data-testid="reconciliation-dashboard"]')).toBeVisible();
    });

    // Step 5: View Reconciliation Summary
    await test.step('Review reconciliation summary', async () => {
      // Check reconciliation statistics
      await expect(page.locator('[data-testid="total-bank-transactions"]')).toContainText('3');
      await expect(page.locator('[data-testid="total-accounting-entries"]')).toContainText('2');
      await expect(page.locator('[data-testid="unmatched-transactions"]')).toContainText('1');
      
      // Verify reconciliation rate
      await expect(page.locator('[data-testid="reconciliation-rate"]')).toContainText('66%');
    });

    // Step 6: Review Automatic Matches
    await test.step('Review automatic matches', async () => {
      // Switch to matched transactions tab
      await page.click('[data-testid="matched-tab"]');
      
      // Should show automatically matched transactions
      await expect(page.locator('[data-testid="matched-transactions-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="matched-row"]')).toHaveCount(2);
      
      // Verify specific matches
      const salaryMatch = page.locator('[data-testid="match-VIR240115001"]');
      await expect(salaryMatch).toBeVisible();
      await expect(salaryMatch.locator('[data-testid="confidence-score"]')).toContainText('100%');
      await expect(salaryMatch.locator('[data-testid="match-type"]')).toContainText('exact');
      
      const clientMatch = page.locator('[data-testid="match-CHQ240116001"]');
      await expect(clientMatch).toBeVisible();
      await expect(clientMatch.locator('[data-testid="confidence-score"]')).toContainText('100%');
    });

    // Step 7: Handle Unmatched Transactions
    await test.step('Handle unmatched transactions', async () => {
      // Switch to unmatched tab
      await page.click('[data-testid="unmatched-tab"]');
      
      // Should show unmatched transactions
      await expect(page.locator('[data-testid="unmatched-transactions-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="unmatched-row"]')).toHaveCount(1);
      
      // Find the office supplies transaction
      const unmatchedTx = page.locator('[data-testid="unmatched-CB240117001"]');
      await expect(unmatchedTx).toBeVisible();
      await expect(unmatchedTx).toContainText('FOURNITURES BUREAU OFFICE+');
      await expect(unmatchedTx).toContainText('-350,75 €');
    });

    // Step 8: Create Manual Match
    await test.step('Create manual accounting entry for unmatched transaction', async () => {
      // Click on the unmatched transaction
      const unmatchedTx = page.locator('[data-testid="unmatched-CB240117001"]');
      await unmatchedTx.click();
      
      // Should open reconciliation modal
      await expect(page.locator('[data-testid="reconciliation-modal"]')).toBeVisible();
      
      // Choose to create new accounting entry
      await page.click('[data-testid="create-accounting-entry"]');
      
      // Fill accounting entry details
      await page.click('[data-testid="account-selector"]');
      await page.click('[data-testid="account-option-606"]'); // Office supplies account
      
      await page.fill('[data-testid="entry-description"]', 'Fournitures bureau Office+');
      await page.fill('[data-testid="debit-amount"]', '350.75');
      
      // Create the entry
      await page.click('[data-testid="create-entry-button"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="entry-created-toast"]')).toBeVisible();
      
      // Modal should close and transaction should be matched
      await expect(page.locator('[data-testid="reconciliation-modal"]')).not.toBeVisible();
    });

    // Step 9: Verify Updated Reconciliation Status
    await test.step('Verify reconciliation completion', async () => {
      // Refresh reconciliation summary
      await page.click('[data-testid="refresh-reconciliation"]');
      
      // Check updated statistics
      await expect(page.locator('[data-testid="total-bank-transactions"]')).toContainText('3');
      await expect(page.locator('[data-testid="total-accounting-entries"]')).toContainText('3');
      await expect(page.locator('[data-testid="unmatched-transactions"]')).toContainText('0');
      await expect(page.locator('[data-testid="reconciliation-rate"]')).toContainText('100%');
      
      // Switch to matched tab to see all matches
      await page.click('[data-testid="matched-tab"]');
      await expect(page.locator('[data-testid="matched-row"]')).toHaveCount(3);
    });

    // Step 10: Generate Reconciliation Report
    await test.step('Generate reconciliation report', async () => {
      // Click export report button
      await page.click('[data-testid="export-reconciliation-report"]');
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="download-pdf-report"]');
      const download = await downloadPromise;
      
      // Verify download
      expect(download.suggestedFilename()).toContain('reconciliation-report');
      expect(download.suggestedFilename()).toContain('.pdf');
    });

    // Step 11: Verify Accounting Impact
    await test.step('Verify impact on accounting records', async () => {
      // Navigate to accounting section
      await page.click('[data-testid="sidebar-accounting"]');
      await page.waitForURL('**/accounting**');
      
      // Switch to journal entries tab
      await page.click('[data-testid="journal-entries-tab"]');
      
      // Should show the reconciled entries
      await expect(page.locator('[data-testid="journal-entries-list"]')).toBeVisible();
      
      // Verify entries are marked as reconciled
      const reconciledEntries = page.locator('[data-testid="reconciled-entry"]');
      await expect(reconciledEntries).toHaveCount(3);
      
      // Check specific reconciled entries
      await expect(page.locator('text=Salaire employé')).toBeVisible();
      await expect(page.locator('text=Paiement facture ABC SARL')).toBeVisible();
      await expect(page.locator('text=Fournitures bureau Office+')).toBeVisible();
    });

    // Step 12: Verify Dashboard Updates
    await test.step('Verify dashboard reflects reconciliation', async () => {
      await page.click('[data-testid="sidebar-dashboard"]');
      
      // Check cash flow widget
      await expect(page.locator('[data-testid="cash-flow-widget"]')).toBeVisible();
      await expect(page.locator('[data-testid="bank-balance"]')).toContainText('10 000,00 €');
      
      // Verify recent reconciliation activity
      await expect(page.locator('[data-testid="recent-activity"]')).toContainText('Réconciliation bancaire');
      
      // Check reconciliation status indicator
      await expect(page.locator('[data-testid="reconciliation-status"]')).toHaveClass(/.*success.*/);
    });
  });

  test('should handle reconciliation errors gracefully', async ({ page }) => {
    await test.step('Login and navigate to reconciliation', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-banks"]');
      await page.click('[data-testid="start-reconciliation-button"]');
    });

    await test.step('Test invalid account selection', async () => {
      // Try to create entry with invalid account
      await page.click('[data-testid="unmatched-tab"]');
      
      // Simulate network error during account creation
      await page.route('**/accounting_entries', route => {
        route.abort('failed');
      });
      
      const unmatchedTx = page.locator('[data-testid="unmatched-row"]').first();
      await unmatchedTx.click();
      
      await page.click('[data-testid="create-accounting-entry"]');
      await page.fill('[data-testid="entry-description"]', 'Test entry');
      await page.click('[data-testid="create-entry-button"]');
      
      // Should show error message
      await expect(page.locator('[data-testid="creation-error-toast"]')).toBeVisible();
    });

    await test.step('Test reconciliation with missing data', async () => {
      // Clear network route mock
      await page.unroute('**/accounting_entries');
      
      // Test scenario where bank account is deleted during reconciliation
      await page.evaluate(() => {
        // Simulate websocket disconnect
        window.dispatchEvent(new CustomEvent('supabase:disconnected'));
      });
      
      await page.click('[data-testid="refresh-reconciliation"]');
      
      // Should handle gracefully and show warning
      await expect(page.locator('[data-testid="connection-warning"]')).toBeVisible();
    });
  });

  test('should support bulk reconciliation operations', async ({ page }) => {
    await test.step('Login and navigate to reconciliation', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-banks"]');
      await page.click('[data-testid="start-reconciliation-button"]');
    });

    await test.step('Select multiple matches for bulk approval', async () => {
      await page.click('[data-testid="matched-tab"]');
      
      // Select multiple matched transactions
      await page.check('[data-testid="match-checkbox-VIR240115001"]');
      await page.check('[data-testid="match-checkbox-CHQ240116001"]');
      
      // Bulk approve matches
      await page.click('[data-testid="bulk-approve-button"]');
      
      // Confirm bulk operation
      await page.click('[data-testid="confirm-bulk-approve"]');
      
      // Should show success message
      await expect(page.locator('[data-testid="bulk-approve-success"]')).toBeVisible();
      
      // Matches should be approved
      await expect(page.locator('[data-testid="approved-match-VIR240115001"]')).toBeVisible();
      await expect(page.locator('[data-testid="approved-match-CHQ240116001"]')).toBeVisible();
    });
  });
});