import { test, expect } from '@playwright/test';
import { testUtils } from './testUtils/test-helpers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 🤖 Tests E2E - AI Document Analysis
 * 
 * Couvre:
 * - Upload de documents (PDF, JPG, PNG)
 * - Analyse IA et extraction de données
 * - Pré-remplissage du formulaire
 * - Validation des suggestions
 * - Gestion des erreurs
 */

test.describe('AI Document Analysis - Invoice Upload', () => {
  let helpers: ReturnType<typeof testUtils.setup>;
  let testFilePath: string;

  test.beforeEach(async ({ page, context }) => {
    helpers = await testUtils.setup(page, context);
    await helpers.auth.login('test@casskai.com', 'Password123!');
    
    // Navigate to Journal Entry form
    await page.goto('/accounting/journal-entries/new');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    if (testFilePath && fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
    await helpers.cleanup();
  });

  // Helper: Create a simple test invoice image
  async function createTestInvoiceImage(): Promise<string> {
    const tmpDir = path.join(process.cwd(), '.tmp-test-files');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const filePath = path.join(tmpDir, `invoice-${Date.now()}.png`);
    
    // Create a minimal valid PNG (1x1 white pixel)
    const pngData = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x7D, 0xD4, 0x13, 0x85, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(filePath, pngData);
    return filePath;
  }

  // ─────────────────────────────────────────────────────────
  // 1. DOCUMENT UPLOAD BUTTON
  // ─────────────────────────────────────────────────────────

  test('should display AI document analysis section', async ({ page }) => {
    const section = page.locator('text=/[Aa]nalyse.*IA|[Aa]nalyze.*AI/i');
    await expect(section).toBeVisible();

    // Check for upload button
    const uploadBtn = page.locator('button:has-text("Choose"), button:has-text("Browse"), input[type="file"]');
    await expect(uploadBtn.first()).toBeVisible();
  });

  test('should show upload input that accepts image/pdf files', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute('accept');

    // Should accept common formats
    expect(accept).toMatch(/pdf|jpg|jpeg|png/i);
  });

  // ─────────────────────────────────────────────────────────
  // 2. FILE UPLOAD & ANALYSIS
  // ─────────────────────────────────────────────────────────

  test('should upload image file and show loading state', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Should show loading spinner
    const spinner = page.locator('[role="status"], .loader, [aria-busy="true"]').first();
    await expect(spinner).toBeVisible({ timeout: 2000 });
  });

  test('should handle document analysis response', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    // Mock the analysis response
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            invoice_number: 'INV-2026-001',
            supplier_name: 'Test Supplier Inc',
            total_ht: 1000,
            total_ttc: 1200,
            vat_amount: 200,
            confidence_score: 92,
            entry_date: '2026-02-04',
            description: 'Supplies from Test Supplier',
            lines: [
              {
                account_suggestion: '401',
                debit_amount: 0,
                credit_amount: 1200,
                description: 'Supplier payable'
              },
              {
                account_suggestion: '607',
                debit_amount: 1000,
                credit_amount: 0,
                description: 'Supplies'
              },
              {
                account_suggestion: '44566',
                debit_amount: 200,
                credit_amount: 0,
                description: 'VAT recoverable'
              }
            ]
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait for analysis to complete
    await page.waitForTimeout(2000);

    // Should show results
    const successMsg = page.locator('text=INV-2026-001, text=Test Supplier, text=confidence').first();
    await expect(successMsg).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────
  // 3. FORM PRE-FILLING
  // ─────────────────────────────────────────────────────────

  test('should pre-fill journal entry form with extracted data', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    // Mock analysis response
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            invoice_number: 'F2026-042',
            supplier_name: 'Acme Corp',
            total_ht: 5000,
            total_ttc: 6000,
            vat_amount: 1000,
            confidence_score: 88,
            entry_date: '2026-02-03',
            description: 'Services from Acme',
            lines: [
              {
                account_suggestion: '401',
                debit_amount: 0,
                credit_amount: 6000,
                description: 'Acme payable'
              },
              {
                account_suggestion: '607',
                debit_amount: 5000,
                credit_amount: 0,
                description: 'Services'
              },
              {
                account_suggestion: '44566',
                debit_amount: 1000,
                credit_amount: 0,
                description: 'VAT'
              }
            ]
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Verify form fields are pre-filled
    const descriptionField = page.locator('input[value*="Acme"], textarea[value*="Acme"]').first();
    await expect(descriptionField).toHaveValue(/Acme/);

    // Check if lines are added
    const lines = page.locator('table tbody tr, .form-lines tr');
    const lineCount = await lines.count();
    expect(lineCount).toBeGreaterThanOrEqual(3);
  });

  test('should pre-fill with correct amounts', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            invoice_number: 'T-001',
            total_ht: 1234.56,
            total_ttc: 1481.47,
            vat_amount: 246.91,
            confidence_score: 95,
            entry_date: '2026-02-04',
            supplier_name: 'Test',
            description: 'Test invoice',
            lines: [
              {
                account_suggestion: '401',
                debit_amount: 0,
                credit_amount: 1481.47,
                description: 'Payable'
              },
              {
                account_suggestion: '607',
                debit_amount: 1234.56,
                credit_amount: 0,
                description: 'Expense'
              },
              {
                account_suggestion: '44566',
                debit_amount: 246.91,
                credit_amount: 0,
                description: 'VAT'
              }
            ]
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Verify amounts
    const amountInputs = page.locator('input[type="number"]');
    const amounts = await amountInputs.allTextContents();
    
    // Should contain our test amounts
    const amountStr = amounts.join(' ');
    expect(amountStr).toMatch(/1481|1234|246/);
  });

  // ─────────────────────────────────────────────────────────
  // 4. CONFIDENCE SCORE DISPLAY
  // ─────────────────────────────────────────────────────────

  test('should display confidence score from AI', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            confidence_score: 87,
            invoice_number: 'TEST',
            total_ht: 100,
            total_ttc: 120,
            vat_amount: 20,
            entry_date: '2026-02-04',
            supplier_name: 'Test',
            description: 'Test',
            lines: []
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Look for confidence display
    const confidenceText = page.locator('text=/confidence|87/i');
    await expect(confidenceText.first()).toBeVisible();
  });

  test('should warn when confidence is low (<70%)', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            confidence_score: 58, // Low confidence
            invoice_number: 'LOW-CONF',
            total_ht: 100,
            total_ttc: 120,
            vat_amount: 20,
            entry_date: '2026-02-04',
            supplier_name: 'Test',
            description: 'Test',
            lines: []
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Should show warning
    const warning = page.locator('[role="alert"], text=/[Ww]arning|[Cc]onfidence|[Vv]erify/i');
    await expect(warning.first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────
  // 5. ERROR HANDLING
  // ─────────────────────────────────────────────────────────

  test('should handle invalid file format', async ({ page }) => {
    // Try to upload a text file
    const fileInput = page.locator('input[type="file"]');
    
    // This should be rejected by accept attribute, but let's test it
    const accept = await fileInput.getAttribute('accept');
    expect(accept).not.toContain('text/plain');
  });

  test('should handle analysis API error gracefully', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    // Mock API error
    await page.route('**/functions/v1/ai-document-analysis', route => {
      route.abort('failed');
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Should show error message
    const errorMsg = page.locator('[role="alert"], text=/[Ee]rror|failed/i');
    await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should handle timeout during analysis', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    // Mock slow response
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await new Promise(resolve => setTimeout(resolve, 35000)); // > 30s timeout
      route.continue();
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    // Wait and check for timeout error
    const errorMsg = page.locator('[role="alert"], text=/timeout|[Ee]rror/i');
    await expect(errorMsg.first()).toBeVisible({ timeout: 40000 });
  });

  test('should recover after failed upload', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    let callCount = 0;
    
    // First call fails, second succeeds
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      callCount++;
      if (callCount === 1) {
        route.abort('failed');
      } else {
        await route.respond({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              confidence_score: 90,
              invoice_number: 'RETRY-SUCCESS',
              total_ht: 100,
              total_ttc: 120,
              vat_amount: 20,
              entry_date: '2026-02-04',
              supplier_name: 'Test',
              description: 'Test',
              lines: []
            }
          })
        });
      }
    });

    const fileInput = page.locator('input[type="file"]');
    
    // First upload fails
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);
    
    let errorMsg = page.locator('[role="alert"]');
    await expect(errorMsg.first()).toBeVisible();

    // Second upload succeeds
    await fileInput.setInputFiles(filePath);
    await page.waitForTimeout(2000);

    const successText = page.locator('text=RETRY-SUCCESS');
    await expect(successText).toBeVisible({ timeout: 5000 });
  });

  // ─────────────────────────────────────────────────────────
  // 6. EXTRACTED DATA VALIDATION
  // ─────────────────────────────────────────────────────────

  test('should validate extracted journal entry is balanced', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    // Unbalanced data (will be rejected)
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            confidence_score: 90,
            invoice_number: 'UNBALANCED',
            total_ht: 100,
            total_ttc: 120,
            vat_amount: 20,
            entry_date: '2026-02-04',
            supplier_name: 'Test',
            description: 'Unbalanced',
            lines: [
              {
                account_suggestion: '401',
                debit_amount: 0,
                credit_amount: 100, // Unbalanced!
                description: 'Too small'
              },
              {
                account_suggestion: '607',
                debit_amount: 120,
                credit_amount: 0,
                description: 'Too big'
              }
            ]
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Should show validation warning
    const validationMsg = page.locator('[role="alert"], text=/balance|[Ee]quilibr/i');
    await expect(validationMsg.first()).toBeVisible({ timeout: 5000 });
  });

  test('should allow manual edit after AI suggestion', async ({ page }) => {
    const filePath = await createTestInvoiceImage();
    testFilePath = filePath;

    await page.route('**/functions/v1/ai-document-analysis', async route => {
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            confidence_score: 85,
            invoice_number: 'EDITABLE',
            total_ht: 500,
            total_ttc: 600,
            vat_amount: 100,
            entry_date: '2026-02-04',
            supplier_name: 'Original',
            description: 'Original description',
            lines: [
              {
                account_suggestion: '401',
                debit_amount: 0,
                credit_amount: 600,
                description: 'Original'
              },
              {
                account_suggestion: '607',
                debit_amount: 500,
                credit_amount: 0,
                description: 'Original'
              },
              {
                account_suggestion: '44566',
                debit_amount: 100,
                credit_amount: 0,
                description: 'Original'
              }
            ]
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForTimeout(2000);

    // Edit a field
    const descField = page.locator('input[value*="Original"], textarea[value*="Original"]').first();
    await descField.clear();
    await descField.fill('Modified description');

    // Verify edit was applied
    await expect(descField).toHaveValue('Modified description');

    // Form should be submittable
    const submitBtn = page.locator('button:has-text("Save"), button:has-text("Create")').first();
    await expect(submitBtn).not.toBeDisabled();
  });

  // ─────────────────────────────────────────────────────────
  // 7. MULTIPLE UPLOADS
  // ─────────────────────────────────────────────────────────

  test('should handle multiple document uploads sequentially', async ({ page }) => {
    const filePath1 = await createTestInvoiceImage();
    const filePath2 = await createTestInvoiceImage();
    testFilePath = filePath1;

    let uploadCount = 0;
    
    await page.route('**/functions/v1/ai-document-analysis', async route => {
      uploadCount++;
      await route.respond({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            confidence_score: 90,
            invoice_number: `INV-${uploadCount}`,
            total_ht: 100 * uploadCount,
            total_ttc: 120 * uploadCount,
            vat_amount: 20 * uploadCount,
            entry_date: '2026-02-04',
            supplier_name: `Supplier ${uploadCount}`,
            description: `Upload ${uploadCount}`,
            lines: []
          }
        })
      });
    });

    const fileInput = page.locator('input[type="file"]');

    // First upload
    await fileInput.setInputFiles(filePath1);
    await page.waitForTimeout(2000);
    await expect(page.locator('text=INV-1')).toBeVisible();

    // Clear and upload second
    await fileInput.setInputFiles(filePath2);
    await page.waitForTimeout(2000);
    
    // Should show second upload
    await expect(page.locator('text=INV-2')).toBeVisible({ timeout: 5000 });
  });
});
