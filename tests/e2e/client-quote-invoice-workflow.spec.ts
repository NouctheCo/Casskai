import { test, expect } from '@playwright/test';
import { supabase } from '../../src/lib/supabase';

/**
 * E2E Test: Client Creation -> Quote Generation -> Invoice Conversion
 * Covers: Complete sales workflow from client onboarding to invoicing
 */

test.describe('Sales Workflow: Client -> Quote -> Invoice', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testCompanyId: string;
  let testClientId: string;
  let testQuoteId: string;
  let testInvoiceId: string;

  test.beforeAll(async () => {
    // Create test user and company
    const timestamp = Date.now();
    testUserEmail = `salestest+${timestamp}@casskai.test`;

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testUserEmail,
      password: 'TestPassword123!',
      email_confirmed_at: new Date().toISOString()
    });

    if (authError || !authUser.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = authUser.user.id;

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Sales Test Company',
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
  });

  test.afterAll(async () => {
    // Clean up test data
    if (testCompanyId) {
      await supabase.from('invoice_lines').delete().eq('company_id', testCompanyId);
      await supabase.from('invoices').delete().eq('company_id', testCompanyId);
      await supabase.from('quote_lines').delete().eq('company_id', testCompanyId);
      await supabase.from('quotes').delete().eq('company_id', testCompanyId);
      await supabase.from('third_parties').delete().eq('company_id', testCompanyId);
      await supabase.from('companies').delete().eq('id', testCompanyId);
    }
    
    if (testUserId) {
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  test('should complete full sales workflow: client -> quote -> invoice', async ({ page }) => {
    // Step 1: User Login
    await test.step('Login to application', async () => {
      await page.goto('/auth');
      
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**', { timeout: 10000 });
      await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    });

    // Step 2: Navigate to Client Management
    await test.step('Navigate to client management', async () => {
      await page.click('[data-testid="sidebar-invoicing"]');
      await page.waitForURL('**/invoicing**');
      
      // Switch to clients tab
      await page.click('[data-testid="clients-tab"]');
      await expect(page.locator('[data-testid="clients-list"]')).toBeVisible();
    });

    // Step 3: Create New Client
    await test.step('Create detailed client profile', async () => {
      await page.click('[data-testid="add-client-button"]');
      await expect(page.locator('[data-testid="client-form-modal"]')).toBeVisible();
      
      // Fill comprehensive client information
      await page.fill('[data-testid="client-name"]', 'TechnoSolutions SARL');
      await page.fill('[data-testid="client-email"]', 'contact@technosolutions.fr');
      await page.fill('[data-testid="client-phone"]', '+33 1 23 45 67 89');
      await page.fill('[data-testid="client-website"]', 'www.technosolutions.fr');
      
      // Address information
      await page.fill('[data-testid="client-address"]', '15 Avenue de la République');
      await page.fill('[data-testid="client-city"]', 'Lyon');
      await page.fill('[data-testid="client-postal-code"]', '69002');
      await page.selectOption('[data-testid="client-country"]', 'FR');
      
      // Business information
      await page.fill('[data-testid="client-siret"]', '12345678901234');
      await page.fill('[data-testid="client-vat-number"]', 'FR12345678901');
      await page.selectOption('[data-testid="client-payment-terms"]', '30');
      
      // Save client
      await page.click('[data-testid="save-client-button"]');
      
      // Verify client creation
      await expect(page.locator('[data-testid="client-saved-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="client-form-modal"]')).not.toBeVisible();
      
      // Verify client appears in list
      await expect(page.locator('text=TechnoSolutions SARL')).toBeVisible();
      await expect(page.locator('text=contact@technosolutions.fr')).toBeVisible();
    });

    // Step 4: Create Quote for Client
    await test.step('Create comprehensive quote', async () => {
      // Switch to quotes tab
      await page.click('[data-testid="quotes-tab"]');
      await expect(page.locator('[data-testid="quotes-list"]')).toBeVisible();
      
      // Create new quote
      await page.click('[data-testid="add-quote-button"]');
      await expect(page.locator('[data-testid="quote-form"]')).toBeVisible();
      
      // Select client
      await page.click('[data-testid="quote-client-selector"]');
      await page.click('[data-testid="client-option-technosolutions"]');
      
      // Quote details
      await page.fill('[data-testid="quote-number"]', 'DEV-2024-001');
      await page.fill('[data-testid="quote-title"]', 'Développement Site Web E-commerce');
      
      // Set dates
      const today = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="quote-date"]', today);
      
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);
      await page.fill('[data-testid="quote-valid-until"]', validUntil.toISOString().split('T')[0]);
      
      // Add quote notes
      await page.fill('[data-testid="quote-notes"]', 'Devis pour développement site e-commerce avec système de paiement intégré');
    });

    // Step 5: Add Quote Lines
    await test.step('Add detailed quote lines', async () => {
      // Add first line - Design
      await page.click('[data-testid="add-quote-line"]');
      
      await page.fill('[data-testid="line-description-0"]', 'Design et maquettage du site');
      await page.fill('[data-testid="line-quantity-0"]', '1');
      await page.fill('[data-testid="line-unit-price-0"]', '2500');
      await page.fill('[data-testid="line-tax-rate-0"]', '20');
      
      // Add second line - Development
      await page.click('[data-testid="add-quote-line"]');
      
      await page.fill('[data-testid="line-description-1"]', 'Développement frontend et backend');
      await page.fill('[data-testid="line-quantity-1"]', '40');
      await page.fill('[data-testid="line-unit-price-1"]', '150');
      await page.fill('[data-testid="line-tax-rate-1"]', '20');
      
      // Add third line - Testing
      await page.click('[data-testid="add-quote-line"]');
      
      await page.fill('[data-testid="line-description-2"]', 'Tests et mise en production');
      await page.fill('[data-testid="line-quantity-2"]', '8');
      await page.fill('[data-testid="line-unit-price-2"]', '120');
      await page.fill('[data-testid="line-tax-rate-2"]', '20');
      
      // Add fourth line - Training
      await page.click('[data-testid="add-quote-line"]');
      
      await page.fill('[data-testid="line-description-3"]', 'Formation utilisateur');
      await page.fill('[data-testid="line-quantity-3"]', '4');
      await page.fill('[data-testid="line-unit-price-3"]', '200');
      await page.fill('[data-testid="line-tax-rate-3"]', '20');
      
      // Verify totals calculation
      // Subtotal: 2500 + (40*150) + (8*120) + (4*200) = 2500 + 6000 + 960 + 800 = 10260
      // Tax: 10260 * 0.20 = 2052
      // Total: 10260 + 2052 = 12312
      
      await expect(page.locator('[data-testid="quote-subtotal"]')).toContainText('10 260,00 €');
      await expect(page.locator('[data-testid="quote-tax-amount"]')).toContainText('2 052,00 €');
      await expect(page.locator('[data-testid="quote-total"]')).toContainText('12 312,00 €');
    });

    // Step 6: Save and Send Quote
    await test.step('Save and send quote to client', async () => {
      // Save quote
      await page.click('[data-testid="save-quote-button"]');
      await expect(page.locator('[data-testid="quote-saved-toast"]')).toBeVisible();
      
      // Preview quote before sending
      await page.click('[data-testid="preview-quote-button"]');
      await expect(page.locator('[data-testid="quote-preview-modal"]')).toBeVisible();
      
      // Verify quote content in preview
      await expect(page.locator('[data-testid="preview-client-name"]')).toContainText('TechnoSolutions SARL');
      await expect(page.locator('[data-testid="preview-quote-number"]')).toContainText('DEV-2024-001');
      await expect(page.locator('[data-testid="preview-total"]')).toContainText('12 312,00 €');
      
      await page.click('[data-testid="close-preview"]');
      
      // Send quote
      await page.click('[data-testid="send-quote-button"]');
      
      // Confirm send in modal
      await expect(page.locator('[data-testid="send-quote-modal"]')).toBeVisible();
      await page.click('[data-testid="confirm-send-quote"]');
      
      // Verify quote status
      await expect(page.locator('[data-testid="quote-sent-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-status"]')).toContainText('Envoyé');
    });

    // Step 7: Simulate Client Acceptance
    await test.step('Mark quote as accepted', async () => {
      // Navigate back to quotes list
      await page.click('[data-testid="back-to-quotes"]');
      
      // Find the quote in the list
      const quoteRow = page.locator('[data-testid="quote-row-DEV-2024-001"]');
      await expect(quoteRow).toBeVisible();
      
      // Click on quote to open details
      await quoteRow.click();
      
      // Mark as accepted (simulate client acceptance)
      await page.click('[data-testid="mark-quote-accepted"]');
      
      // Confirm acceptance
      await page.fill('[data-testid="acceptance-notes"]', 'Client a confirmé par email le 15/01/2024');
      await page.click('[data-testid="confirm-acceptance"]');
      
      // Verify status change
      await expect(page.locator('[data-testid="quote-accepted-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="quote-status"]')).toContainText('Accepté');
    });

    // Step 8: Convert Quote to Invoice
    await test.step('Convert accepted quote to invoice', async () => {
      // Convert quote to invoice
      await page.click('[data-testid="convert-to-invoice-button"]');
      
      // Should open invoice creation form with pre-filled data
      await expect(page.locator('[data-testid="invoice-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-from-quote-badge"]')).toBeVisible();
      
      // Verify pre-filled data
      await expect(page.locator('[data-testid="invoice-client"]')).toHaveValue('TechnoSolutions SARL');
      
      // Update invoice details
      await page.fill('[data-testid="invoice-number"]', 'FAC-2024-001');
      
      const issueDate = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="invoice-issue-date"]', issueDate);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      await page.fill('[data-testid="invoice-due-date"]', dueDate.toISOString().split('T')[0]);
      
      // Verify quote lines were copied
      await expect(page.locator('[data-testid="invoice-line-0"]')).toContainText('Design et maquettage du site');
      await expect(page.locator('[data-testid="invoice-line-1"]')).toContainText('Développement frontend et backend');
      await expect(page.locator('[data-testid="invoice-line-2"]')).toContainText('Tests et mise en production');
      await expect(page.locator('[data-testid="invoice-line-3"]')).toContainText('Formation utilisateur');
      
      // Verify totals match quote
      await expect(page.locator('[data-testid="invoice-subtotal"]')).toContainText('10 260,00 €');
      await expect(page.locator('[data-testid="invoice-tax-amount"]')).toContainText('2 052,00 €');
      await expect(page.locator('[data-testid="invoice-total"]')).toContainText('12 312,00 €');
    });

    // Step 9: Modify Invoice if Needed
    await test.step('Make adjustments to invoice', async () => {
      // Apply early payment discount to first line
      await page.fill('[data-testid="line-discount-0"]', '5');
      
      // Add an additional line for project management
      await page.click('[data-testid="add-invoice-line"]');
      await page.fill('[data-testid="line-description-4"]', 'Gestion de projet et suivi');
      await page.fill('[data-testid="line-quantity-4"]', '10');
      await page.fill('[data-testid="line-unit-price-4"]', '100');
      await page.fill('[data-testid="line-tax-rate-4"]', '20');
      
      // Verify updated totals
      // Original subtotal: 10260
      // Discount on line 0: 2500 * 0.05 = 125
      // New line: 10 * 100 = 1000
      // New subtotal: 10260 - 125 + 1000 = 11135
      // Tax: 11135 * 0.20 = 2227
      // Total: 11135 + 2227 = 13362
      
      await expect(page.locator('[data-testid="invoice-subtotal"]')).toContainText('11 135,00 €');
      await expect(page.locator('[data-testid="invoice-tax-amount"]')).toContainText('2 227,00 €');
      await expect(page.locator('[data-testid="invoice-total"]')).toContainText('13 362,00 €');
    });

    // Step 10: Save and Send Invoice
    await test.step('Finalize and send invoice', async () => {
      // Add payment instructions
      await page.fill('[data-testid="invoice-notes"]', 'Merci de procéder au règlement sous 30 jours. RIB en pièce jointe.');
      
      // Save invoice
      await page.click('[data-testid="save-invoice-button"]');
      await expect(page.locator('[data-testid="invoice-saved-toast"]')).toBeVisible();
      
      // Generate PDF preview
      await page.click('[data-testid="preview-pdf-button"]');
      
      // Wait for PDF generation
      await expect(page.locator('[data-testid="pdf-preview-loading"]')).toBeVisible();
      await expect(page.locator('[data-testid="pdf-preview-loading"]')).not.toBeVisible({ timeout: 10000 });
      
      // Verify PDF preview
      await expect(page.locator('[data-testid="pdf-preview-frame"]')).toBeVisible();
      await page.click('[data-testid="close-pdf-preview"]');
      
      // Send invoice to client
      await page.click('[data-testid="send-invoice-button"]');
      
      // Configure email settings
      await expect(page.locator('[data-testid="email-invoice-modal"]')).toBeVisible();
      await page.fill('[data-testid="email-subject"]', 'Facture FAC-2024-001 - Développement Site E-commerce');
      await page.fill('[data-testid="email-body"]', 'Bonjour,\n\nVeuillez trouver ci-joint votre facture pour le développement du site e-commerce.\n\nCordialement,');
      
      // Send email
      await page.click('[data-testid="send-email-button"]');
      
      // Verify invoice sent
      await expect(page.locator('[data-testid="invoice-sent-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-status"]')).toContainText('Envoyée');
    });

    // Step 11: Track Invoice and Payment
    await test.step('Monitor invoice status and track payment', async () => {
      // Navigate to invoices list
      await page.click('[data-testid="invoices-tab"]');
      
      // Verify invoice appears in list
      const invoiceRow = page.locator('[data-testid="invoice-row-FAC-2024-001"]');
      await expect(invoiceRow).toBeVisible();
      await expect(invoiceRow).toContainText('TechnoSolutions SARL');
      await expect(invoiceRow).toContainText('13 362,00 €');
      await expect(invoiceRow).toContainText('Envoyée');
      
      // Click on invoice to view details
      await invoiceRow.click();
      
      // Add payment tracking note
      await page.click('[data-testid="add-payment-note"]');
      await page.fill('[data-testid="payment-note-text"]', 'Client a confirmé réception par email');
      await page.click('[data-testid="save-payment-note"]');
      
      // Set up payment reminder
      await page.click('[data-testid="setup-payment-reminder"]');
      await page.selectOption('[data-testid="reminder-frequency"]', '7'); // 7 days before due date
      await page.check('[data-testid="email-reminder-enabled"]');
      await page.click('[data-testid="save-reminder-settings"]');
      
      await expect(page.locator('[data-testid="reminder-set-toast"]')).toBeVisible();
    });

    // Step 12: Simulate Partial Payment
    await test.step('Record partial payment', async () => {
      // Record first payment
      await page.click('[data-testid="record-payment-button"]');
      
      await expect(page.locator('[data-testid="payment-modal"]')).toBeVisible();
      await page.fill('[data-testid="payment-amount"]', '6681'); // 50% payment
      await page.selectOption('[data-testid="payment-method"]', 'wire_transfer');
      await page.fill('[data-testid="payment-reference"]', 'VIR-20240115-001');
      await page.fill('[data-testid="payment-notes"]', 'Acompte 50% selon conditions');
      
      const paymentDate = new Date().toISOString().split('T')[0];
      await page.fill('[data-testid="payment-date"]', paymentDate);
      
      await page.click('[data-testid="save-payment-button"]');
      
      // Verify payment recorded
      await expect(page.locator('[data-testid="payment-recorded-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-status"]')).toContainText('Partiellement payée');
      await expect(page.locator('[data-testid="remaining-balance"]')).toContainText('6 681,00 €');
    });

    // Step 13: Complete Payment and Close Invoice
    await test.step('Record final payment and close invoice', async () => {
      // Record final payment
      await page.click('[data-testid="record-payment-button"]');
      
      await page.fill('[data-testid="payment-amount"]', '6681'); // Remaining balance
      await page.selectOption('[data-testid="payment-method"]', 'wire_transfer');
      await page.fill('[data-testid="payment-reference"]', 'VIR-20240201-001');
      await page.fill('[data-testid="payment-notes"]', 'Solde final');
      
      const finalPaymentDate = new Date();
      finalPaymentDate.setDate(finalPaymentDate.getDate() + 15);
      await page.fill('[data-testid="payment-date"]', finalPaymentDate.toISOString().split('T')[0]);
      
      await page.click('[data-testid="save-payment-button"]');
      
      // Verify invoice fully paid
      await expect(page.locator('[data-testid="payment-recorded-toast"]')).toBeVisible();
      await expect(page.locator('[data-testid="invoice-status"]')).toContainText('Payée');
      await expect(page.locator('[data-testid="remaining-balance"]')).toContainText('0,00 €');
      await expect(page.locator('[data-testid="invoice-paid-badge"]')).toBeVisible();
    });

    // Step 14: Generate Final Reports
    await test.step('Generate sales and payment reports', async () => {
      // Navigate to reports section
      await page.click('[data-testid="sidebar-reports"]');
      await page.waitForURL('**/reports**');
      
      // Generate sales report
      await page.click('[data-testid="sales-report-tab"]');
      await page.selectOption('[data-testid="report-period"]', 'current_month');
      await page.click('[data-testid="generate-report-button"]');
      
      // Verify report contains our transaction
      await expect(page.locator('[data-testid="sales-report-loading"]')).not.toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=TechnoSolutions SARL')).toBeVisible();
      await expect(page.locator('text=13 362,00 €')).toBeVisible();
      
      // Export report
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-report-excel"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('sales-report');
      expect(download.suggestedFilename()).toContain('.xlsx');
    });

    // Step 15: Verify Dashboard Analytics
    await test.step('Verify dashboard reflects complete workflow', async () => {
      await page.click('[data-testid="sidebar-dashboard"]');
      
      // Check revenue metrics
      await expect(page.locator('[data-testid="total-revenue"]')).toContainText('13 362');
      await expect(page.locator('[data-testid="paid-invoices-count"]')).toContainText('1');
      await expect(page.locator('[data-testid="active-clients-count"]')).toContainText('1');
      
      // Check recent activity timeline
      const activities = page.locator('[data-testid="recent-activity-item"]');
      await expect(activities).toHaveCount.toBeGreaterThanOrEqual(4);
      
      // Verify activity items
      await expect(page.locator('text=Client TechnoSolutions SARL créé')).toBeVisible();
      await expect(page.locator('text=Devis DEV-2024-001 envoyé')).toBeVisible();
      await expect(page.locator('text=Facture FAC-2024-001 créée')).toBeVisible();
      await expect(page.locator('text=Paiement reçu')).toBeVisible();
      
      // Check conversion funnel
      await expect(page.locator('[data-testid="quotes-to-invoices-rate"]')).toContainText('100%');
      await expect(page.locator('[data-testid="invoice-payment-rate"]')).toContainText('100%');
    });
  });

  test('should handle workflow interruptions and resume', async ({ page }) => {
    await test.step('Login and start quote creation', async () => {
      await page.goto('/auth');
      await page.fill('[data-testid="email-input"]', testUserEmail);
      await page.fill('[data-testid="password-input"]', 'TestPassword123!');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForURL('**/dashboard**');
      await page.click('[data-testid="sidebar-invoicing"]');
      await page.click('[data-testid="quotes-tab"]');
      await page.click('[data-testid="add-quote-button"]');
    });

    await test.step('Fill partial quote data and simulate interruption', async () => {
      // Start filling quote
      await page.click('[data-testid="quote-client-selector"]');
      await page.click('[data-testid="client-option-technosolutions"]');
      await page.fill('[data-testid="quote-number"]', 'DEV-2024-002');
      await page.fill('[data-testid="quote-title"]', 'Maintenance Site Web');
      
      // Add one line
      await page.click('[data-testid="add-quote-line"]');
      await page.fill('[data-testid="line-description-0"]', 'Maintenance mensuelle');
      await page.fill('[data-testid="line-quantity-0"]', '12');
      await page.fill('[data-testid="line-unit-price-0"]', '300');
      
      // Simulate browser refresh/interruption
      await page.reload();
    });

    await test.step('Verify auto-save recovery', async () => {
      // Should show draft recovery dialog
      await expect(page.locator('[data-testid="draft-recovery-dialog"]')).toBeVisible();
      
      // Restore draft
      await page.click('[data-testid="restore-draft-button"]');
      
      // Verify data was restored
      await expect(page.locator('[data-testid="quote-number"]')).toHaveValue('DEV-2024-002');
      await expect(page.locator('[data-testid="quote-title"]')).toHaveValue('Maintenance Site Web');
      await expect(page.locator('[data-testid="line-description-0"]')).toHaveValue('Maintenance mensuelle');
      await expect(page.locator('[data-testid="line-quantity-0"]')).toHaveValue('12');
    });
  });
});