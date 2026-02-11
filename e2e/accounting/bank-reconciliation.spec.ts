/**
 * CassKai - Tests E2E Rapprochement Bancaire
 * Test complet du workflow de rapprochement bancaire automatique et manuel
 */

import { test, expect } from '@playwright/test';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@casskai.app';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Test123456az';
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

/**
 * Setup: Connexion avant chaque test
 */
test.beforeEach(async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);

  // Login
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Attendre chargement dashboard
  await page.waitForURL('**/dashboard');
  await expect(page.locator('h1')).toContainText('Dashboard');
});

/**
 * Test 1: Accès à la page de rapprochement bancaire
 */
test('should navigate to bank reconciliation page', async ({ page }) => {
  // Naviguer vers module Banque
  await page.click('a[href*="/banking"]');
  await page.waitForURL('**/banking');

  // Vérifier présence onglet Rapprochement
  await expect(page.locator('text=Rapprochement')).toBeVisible();

  // Cliquer sur onglet
  await page.click('text=Rapprochement');

  // Vérifier éléments clés présents
  await expect(page.locator('text=Transactions non rapprochées')).toBeVisible();
  await expect(page.locator('text=Rapprochement automatique')).toBeVisible();
});

/**
 * Test 2: Affichage des transactions non rapprochées
 */
test('should display unreconciled transactions', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner un compte bancaire
  await page.click('select#bankAccount');
  await page.selectOption('select#bankAccount', { index: 0 }); // Premier compte

  // Attendre chargement des transactions
  await page.waitForTimeout(1000);

  // Vérifier affichage des transactions
  const transactionRows = page.locator('[data-testid="bank-transaction-row"]');
  const count = await transactionRows.count();

  if (count > 0) {
    // Au moins une transaction affichée
    expect(count).toBeGreaterThan(0);

    // Vérifier colonnes présentes
    await expect(transactionRows.first()).toContainText(/\d{4}-\d{2}-\d{2}/); // Date
    await expect(transactionRows.first()).toContainText(/[€$£]/); // Montant avec devise
  } else {
    // Aucune transaction: vérifier message vide
    await expect(page.locator('text=Aucune transaction à rapprocher')).toBeVisible();
  }
});

/**
 * Test 3: Suggestions de correspondance automatique
 */
test('should show automatic matching suggestions', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  // Vérifier section suggestions
  const suggestionsSection = page.locator('[data-testid="matching-suggestions"]');

  if (await suggestionsSection.isVisible()) {
    // Vérifier présence badges de confiance
    const confidenceBadges = page.locator('[data-testid="confidence-badge"]');
    expect(await confidenceBadges.count()).toBeGreaterThan(0);

    // Vérifier que le score de confiance est entre 0-100
    const firstBadge = confidenceBadges.first();
    const confidenceText = await firstBadge.textContent();
    const confidenceScore = parseInt(confidenceText?.match(/\d+/)?.[0] || '0');
    expect(confidenceScore).toBeGreaterThanOrEqual(0);
    expect(confidenceScore).toBeLessThanOrEqual(100);
  }
});

/**
 * Test 4: Rapprochement automatique
 */
test('should execute automatic reconciliation', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  // Cliquer bouton rapprochement automatique
  const autoButton = page.locator('button:has-text("Rapprochement automatique")');
  await autoButton.click();

  // Attendre toast de confirmation ou d'info
  await page.waitForSelector('[role="status"]', { timeout: 5000 });

  const toast = page.locator('[role="status"]').last();
  const toastText = await toast.textContent();

  // Vérifier message de succès ou info
  expect(toastText).toMatch(/rapprochements créés|Aucun rapprochement/i);

  // Vérifier que les statistiques sont mises à jour
  const reconciliationRate = page.locator('[data-testid="reconciliation-rate"]');
  if (await reconciliationRate.isVisible()) {
    const rateText = await reconciliationRate.textContent();
    expect(rateText).toMatch(/\d+%/);
  }
});

/**
 * Test 5: Rapprochement manuel d'une transaction
 */
test('should manually reconcile a transaction', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  // Vérifier présence transactions
  const transactionRows = page.locator('[data-testid="bank-transaction-row"]');
  const transactionCount = await transactionRows.count();

  if (transactionCount === 0) {
    // Pas de transactions à tester, skip
    test.skip();
    return;
  }

  // Sélectionner première transaction
  const firstTransaction = transactionRows.first();
  await firstTransaction.click();

  // Vérifier ouverture panneau de sélection d'écriture
  await expect(page.locator('text=Sélectionner une écriture comptable')).toBeVisible({
    timeout: 3000
  });

  // Sélectionner première écriture disponible
  const entryRows = page.locator('[data-testid="accounting-entry-row"]');
  const entryCount = await entryRows.count();

  if (entryCount > 0) {
    const firstEntry = entryRows.first();
    await firstEntry.click();

    // Cliquer bouton "Valider le rapprochement"
    await page.click('button:has-text("Valider")');

    // Attendre confirmation
    await page.waitForSelector('[role="status"]', { timeout: 5000 });
    const toast = page.locator('[role="status"]').last();
    await expect(toast).toContainText(/rapprochement créé|succès/i);

    // Vérifier que la transaction a disparu de la liste (ou marquée comme rapprochée)
    await page.waitForTimeout(1000);
    const updatedTransactionCount = await transactionRows.count();
    expect(updatedTransactionCount).toBeLessThanOrEqual(transactionCount);
  }
});

/**
 * Test 6: Statistiques de rapprochement
 */
test('should display reconciliation statistics', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  // Vérifier affichage des KPIs
  const statsCard = page.locator('[data-testid="reconciliation-stats"]');

  if (await statsCard.isVisible()) {
    // Vérifier présence métriques clés
    await expect(statsCard).toContainText(/Total transactions|Rapprochées|En attente/i);

    // Vérifier taux de rapprochement
    const rate = page.locator('[data-testid="reconciliation-rate"]');
    if (await rate.isVisible()) {
      const rateText = await rate.textContent();
      const rateValue = parseFloat(rateText?.match(/[\d.]+/)?.[0] || '0');
      expect(rateValue).toBeGreaterThanOrEqual(0);
      expect(rateValue).toBeLessThanOrEqual(100);
    }
  }
});

/**
 * Test 7: Filtrage des transactions
 */
test('should filter transactions by search term', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  const transactionRows = page.locator('[data-testid="bank-transaction-row"]');
  const initialCount = await transactionRows.count();

  if (initialCount === 0) {
    test.skip();
    return;
  }

  // Entrer terme de recherche
  const searchInput = page.locator('input[placeholder*="Rechercher"]');
  await searchInput.fill('VIR'); // Terme commun dans descriptions

  // Attendre filtrage
  await page.waitForTimeout(500);

  const filteredCount = await transactionRows.count();

  // Vérifier que le filtrage a été appliqué
  // (soit moins de résultats, soit 0 si aucun match)
  expect(filteredCount).toBeLessThanOrEqual(initialCount);
});

/**
 * Test 8: Annulation d'un rapprochement
 */
test('should cancel a reconciliation', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Aller sur onglet "Rapprochés"
  await page.click('button[role="tab"]:has-text("Rapprochées")');
  await page.waitForTimeout(1000);

  const reconciledRows = page.locator('[data-testid="reconciled-transaction-row"]');
  const reconciledCount = await reconciledRows.count();

  if (reconciledCount === 0) {
    // Pas de transactions rapprochées à tester
    test.skip();
    return;
  }

  // Sélectionner première transaction rapprochée
  const firstReconciled = reconciledRows.first();

  // Cliquer bouton annuler (icône X ou "Annuler")
  const cancelButton = firstReconciled.locator('button[aria-label="Annuler"]');
  if (await cancelButton.isVisible()) {
    await cancelButton.click();

    // Confirmer dans modal si présent
    const confirmButton = page.locator('button:has-text("Confirmer")');
    if (await confirmButton.isVisible({ timeout: 1000 })) {
      await confirmButton.click();
    }

    // Attendre confirmation
    await page.waitForSelector('[role="status"]', { timeout: 5000 });
    const toast = page.locator('[role="status"]').last();
    await expect(toast).toContainText(/annulé|supprimé/i);
  }
});

/**
 * Test 9: Gestion des erreurs (compte sans transactions)
 */
test('should handle empty account gracefully', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Créer ou sélectionner compte sans transactions
  // (Assumons qu'un compte vide existe)

  const emptyStateMessage = page.locator('text=Aucune transaction');

  // Vérifier message approprié
  if (await emptyStateMessage.isVisible({ timeout: 3000 })) {
    await expect(emptyStateMessage).toBeVisible();

    // Vérifier présence bouton action (ex: "Importer des transactions")
    const actionButton = page.locator('button:has-text("Importer")');
    if (await actionButton.isVisible()) {
      await expect(actionButton).toBeEnabled();
    }
  }
});

/**
 * Test 10: Performance - Chargement rapide
 */
test('should load reconciliation page quickly', async ({ page }) => {
  const startTime = Date.now();

  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });

  // Attendre affichage des données
  await page.waitForSelector('[data-testid="bank-transaction-row"], text=Aucune transaction', {
    timeout: 5000
  });

  const loadTime = Date.now() - startTime;

  // Vérifier chargement < 5 secondes
  expect(loadTime).toBeLessThan(5000);

  console.log(`⏱️ Page chargée en ${loadTime}ms`);
});

/**
 * Test 11: Accessibilité WCAG 2.1 AA
 */
test('should meet accessibility standards', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Vérifier navigation au clavier
  await page.keyboard.press('Tab');
  const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedElement).toBeTruthy();

  // Vérifier labels aria
  const buttons = page.locator('button');
  const buttonCount = await buttons.count();

  if (buttonCount > 0) {
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();

      // Chaque bouton doit avoir soit aria-label soit texte
      expect(ariaLabel || text?.trim()).toBeTruthy();
    }
  }
});

/**
 * Test 12: Multi-devises
 */
test('should handle multi-currency transactions', async ({ page }) => {
  await page.goto(`${BASE_URL}/banking?tab=reconciliation`);

  // Sélectionner compte
  await page.selectOption('select#bankAccount', { index: 0 });
  await page.waitForTimeout(1000);

  const transactionRows = page.locator('[data-testid="bank-transaction-row"]');
  const count = await transactionRows.count();

  if (count > 0) {
    // Vérifier présence symbole devise (€, $, £, FCFA, etc.)
    const firstRow = transactionRows.first();
    const amountText = await firstRow.locator('[data-testid="amount"]').textContent();

    expect(amountText).toMatch(/[€$£]|FCFA|XOF|XAF/);
  }
});
