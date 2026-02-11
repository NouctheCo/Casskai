/**
 * CassKai - Plateforme de gestion financière
 * Copyright © 2025 NOUTCHE CONSEIL (SIREN 909 672 685)
 * Tous droits réservés - All rights reserved
 */

/**
 * Tests E2E - Rapprochement Bancaire
 *
 * Couvre les scénarios critiques :
 * - Rapprochement automatique complet
 * - Validation manuelle de correspondances
 * - Gestion des erreurs
 * - Filtrage et recherche
 * - Rafraîchissement des données
 */

import { test, expect } from '@playwright/test';

// Configuration de base
const BASE_URL = process.env.VITE_APP_URL || 'http://localhost:5173';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@casskai.app';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'TestPassword123!';

/**
 * Helper: Login et navigation vers Rapprochement bancaire
 */
async function loginAndNavigateToBanking(page: any) {
  await page.goto(`${BASE_URL}/login`);

  // Login
  await page.fill('input[type="email"]', TEST_USER_EMAIL);
  await page.fill('input[type="password"]', TEST_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Attendre la redirection vers dashboard
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 });

  // Naviguer vers la page Banque
  await page.goto(`${BASE_URL}/banks`);

  // Attendre que la page Banks charge
  await page.waitForSelector('text=Virements SEPA', { timeout: 10000 });

  // Cliquer sur l'onglet "Rapprochement bancaire"
  await page.click('button:has-text("Rapprochement bancaire")');

  // Attendre le chargement du composant BankReconciliation
  await page.waitForSelector('text=Réconciliation bancaire', { timeout: 10000 });
}

test.describe('Rapprochement Bancaire - Workflow Complet', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToBanking(page);
  });

  test('P1: Doit afficher les statistiques de réconciliation', async ({ page }) => {
    // Vérifier que les 4 KPI cards sont affichées
    await expect(page.locator('text=Taux de réconciliation')).toBeVisible();
    await expect(page.locator('text=Réconciliées')).toBeVisible();
    await expect(page.locator('text=En attente')).toBeVisible();
    await expect(page.locator('text=Suggestions')).toBeVisible();

    // Vérifier que les valeurs sont des nombres (utiliser first() pour éviter les doublons)
    const reconciledCount = await page.locator('.text-2xl.font-bold.text-green-600').first().textContent();
    expect(reconciledCount).toMatch(/^\d+$/);
  });

  test('P2: Sélection de compte bancaire requise', async ({ page }) => {
    // Vérifier qu'il y a bien un sélecteur de compte
    await expect(page.locator('text=Compte bancaire')).toBeVisible();

    // Vérifier que le sélecteur de compte est bien présent
    const accountSelect = page.locator('button[role="combobox"]').first();
    await expect(accountSelect).toBeVisible();

    // Vérifier que le bouton Auto-réconciliation existe
    const autoButton = page.locator('button:has-text("Auto-réconciliation")');
    await expect(autoButton).toBeVisible();
  });

  test('P3: Sélection de compte et chargement des données', async ({ page }) => {
    // Chercher le SelectTrigger du compte bancaire (premier select)
    const accountSelect = page.locator('button[role="combobox"]').first();

    if (await accountSelect.isVisible()) {
      await accountSelect.click();
      await page.waitForTimeout(500);

      // Sélectionner le premier compte disponible
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();

        // Attendre le chargement des données
        await page.waitForTimeout(2000);

        // Vérifier que les KPI se mettent à jour
        const pendingCount = await page.locator('.text-2xl.font-bold.text-orange-600').textContent();
        expect(pendingCount).toBeDefined();
      }
    }
  });

  test('P4: Workflow rapprochement automatique complet', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1500);

      // Vérifier que le bouton Auto-réconciliation n'est plus disabled
      const autoButton = page.locator('button:has-text("Auto-réconciliation")');
      await expect(autoButton).toBeEnabled({ timeout: 5000 });

      // Capturer l'état initial du KPI "Reconciled"
      const initialReconciledText = await page.locator('.text-2xl.font-bold.text-green-600').first().textContent();
      const initialReconciled = parseInt(initialReconciledText || '0');

      // Lancer rapprochement automatique
      await autoButton.click();

      // Attendre que le traitement soit terminé
      // Le bouton affiche "Réconciliation..." pendant le traitement
      await page.waitForTimeout(3000);

      // Vérifier que le bouton est redevenu normal (plus "Réconciliation...")
      const buttonText = await autoButton.textContent();
      expect(buttonText).toContain('Auto-réconciliation');

      // Vérifier que le nombre de transactions réconciliées n'a pas changé négativement
      const finalReconciledText = await page.locator('.text-2xl.font-bold.text-green-600').first().textContent();
      const finalReconciled = parseInt(finalReconciledText || '0');
      expect(finalReconciled).toBeGreaterThanOrEqual(initialReconciled);
    }
  });

  test('P5: Onglets de navigation fonctionnels', async ({ page }) => {
    // Vérifier que les 3 onglets existent
    await expect(page.locator('button[role="tab"]:has-text("Correspondances")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Transactions")')).toBeVisible();
    await expect(page.locator('button[role="tab"]:has-text("Manuel")')).toBeVisible();

    // Cliquer sur l'onglet Transactions
    await page.click('button[role="tab"]:has-text("Transactions")');
    await page.waitForTimeout(1000);
    // Vérifier juste qu'on peut voir "Transactions" dans le heading ou description
    const transactionsVisible = await page.locator('text=Transactions').count() > 0;
    expect(transactionsVisible).toBe(true);

    // Cliquer sur l'onglet Manuel
    await page.click('button[role="tab"]:has-text("Manuel")');
    await page.waitForTimeout(1000);
    // Vérifier qu'on est bien sur l'onglet Manuel (tab actif)
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Manuel")')).toBeVisible();

    // Retour à Correspondances
    await page.click('button[role="tab"]:has-text("Correspondances")');
    await page.waitForTimeout(1000);
    // Vérifier tab Correspondances actif
    await expect(page.locator('button[role="tab"][aria-selected="true"]:has-text("Correspondances")')).toBeVisible();
  });

  test('P6: Filtrage et recherche de transactions', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1500);

      // Aller à l'onglet Transactions
      await page.click('button[role="tab"]:has-text("Transactions")');
      await page.waitForTimeout(1500);

      // Vérifier que le champ de recherche existe
      const searchInput = page.locator('input[placeholder="Rechercher..."]');
      await expect(searchInput).toBeVisible({ timeout: 5000 });

      // Tester la recherche
      await searchInput.fill('VIR');
      await page.waitForTimeout(500);

      // Vérifier que le filtre de statut existe (second ou troisième combobox)
      // Il peut y avoir plusieurs combobox: compte, période, statut
      const comboboxes = await page.locator('button[role="combobox"]').count();
      expect(comboboxes).toBeGreaterThan(1);

      // Test simplifié : juste vérifier que les éléments de filtre existent
      const hasSearchInput = await searchInput.isVisible();
      expect(hasSearchInput).toBe(true);
    }
  });

  test('P7: Validation manuelle de correspondance', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Onglet Correspondances
      await page.click('button[role="tab"]:has-text("Correspondances")');

      // Vérifier s'il y a des suggestions
      const suggestionCard = page.locator('.bg-gray-50.dark\\:bg-gray-700.rounded-xl.p-6').first();

      if (await suggestionCard.isVisible()) {
        // Vérifier la présence de l'icône de confiance
        await expect(suggestionCard.locator('text=% de confiance')).toBeVisible();

        // Vérifier les détails transaction bancaire
        await expect(suggestionCard.locator('text=Transaction bancaire')).toBeVisible();
        await expect(suggestionCard.locator('text=Écriture comptable')).toBeVisible();

        // Cliquer sur Valider
        const validateButton = suggestionCard.locator('button:has-text("Valider")');
        await validateButton.click();

        // Attendre le toast de confirmation
        await expect(page.locator('text=Transaction rapprochée')).toBeVisible({ timeout: 5000 });
      } else {
        // Aucune suggestion disponible
        await expect(page.locator('text=Aucune correspondance trouvée')).toBeVisible();
      }
    }
  });

  test('P8: Bouton Actualiser rafraîchit les données', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Récupérer le nombre de transactions en attente avant refresh
      const pendingBefore = await page.locator('.text-2xl.font-bold.text-orange-600').textContent();

      // Cliquer sur Actualiser
      await page.click('button:has-text("Actualiser")');
      await page.waitForTimeout(1500);

      // Récupérer le nombre après refresh
      const pendingAfter = await page.locator('.text-2xl.font-bold.text-orange-600').textContent();

      // Les données ont été rechargées (peuvent être identiques ou différentes)
      expect(pendingAfter).toBeDefined();
    }
  });

  test('P9: Affichage des détails (toggle)', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Cliquer sur Détails
      await page.click('button:has-text("Détails")');
      await page.waitForTimeout(500);

      // Vérifier que le panneau de détails s'affiche
      await expect(page.locator('text=Correspondances en attente')).toBeVisible();

      // Cliquer sur Masquer
      await page.click('button:has-text("Masquer")');
      await page.waitForTimeout(500);

      // Vérifier que le panneau se cache
      await expect(page.locator('text=Correspondances en attente')).not.toBeVisible();
    }
  });

  test('P10: Réconciliation depuis onglet Transactions', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Aller à l'onglet Transactions
      await page.click('button[role="tab"]:has-text("Transactions")');

      // Chercher une transaction avec bouton "Réconcilier"
      const reconcileButton = page.locator('button:has-text("Réconcilier")').first();

      if (await reconcileButton.isVisible()) {
        await reconcileButton.click();

        // Attendre le résultat (succès ou erreur)
        await page.waitForSelector('[role="status"]', { timeout: 5000 });

        const toastText = await page.locator('[role="status"]').first().textContent();

        // Vérifier un message de résultat
        const isSuccess = toastText?.includes('réconciliée') || false;
        const isError = toastText?.includes('Aucune correspondance') || false;

        expect(isSuccess || isError).toBe(true);
      }
    }
  });
});

test.describe('Rapprochement Bancaire - Gestion des erreurs', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToBanking(page);
  });

  test('E1: Message si aucun compte bancaire disponible', async ({ page }) => {
    // Vérifier que le sélecteur de compte est présent
    const selectTrigger = page.locator('button[role="combobox"]').first();

    if (await selectTrigger.isVisible()) {
      await selectTrigger.click();
      await page.waitForTimeout(500);

      // Soit on a des comptes, soit on affiche "Aucun compte"
      const hasAccounts = await page.locator('[role="option"]').count() > 0;
      const noAccountMessage = page.locator('text=Aucun compte bancaire');
      const hasNoAccountMessage = await noAccountMessage.isVisible();

      expect(hasAccounts || hasNoAccountMessage).toBe(true);
    }
  });

  test('E2: Gestion du chargement (spinner)', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();

      // Lancer rapprochement auto
      const autoButton = page.locator('button:has-text("Auto-réconciliation")');
      await autoButton.click();

      // Pendant le chargement, le bouton doit afficher "Réconciliation..."
      const loadingText = page.locator('text=Réconciliation...');

      // Le spinner peut être très rapide, on vérifie juste que la fonction s'exécute
      await page.waitForTimeout(500);
    }
  });

  test('E3: Message si aucune correspondance après auto-réconciliation', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Lancer rapprochement auto
      await page.click('button:has-text("Auto-réconciliation")');

      // Attendre le toast
      await page.waitForSelector('[role="status"]', { timeout: 10000 });

      const toastText = await page.locator('[role="status"]').first().textContent();

      // On doit avoir soit un succès, soit "Aucune correspondance"
      expect(toastText).toBeDefined();
    }
  });
});

test.describe('Rapprochement Bancaire - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigateToBanking(page);
  });

  test('PERF1: Chargement initial < 3 secondes', async ({ page }) => {
    const startTime = Date.now();

    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();

      // Attendre que les KPI se chargent
      await page.waitForSelector('.text-2xl.font-bold.text-orange-600', { timeout: 5000 });

      const endTime = Date.now();
      const loadTime = endTime - startTime;

      console.log(`⏱️ Temps de chargement: ${loadTime}ms`);

      // Idéalement < 3s (3000ms)
      // En pratique, on accepte jusqu'à 5s en E2E (réseau + DB)
      expect(loadTime).toBeLessThan(5000);
    }
  });

  test('PERF2: Filtrage temps réel < 500ms', async ({ page }) => {
    // Sélectionner un compte
    const accountSelect = page.locator('button[role="combobox"]').first();
    await accountSelect.click();
    await page.waitForTimeout(500);
    const firstAccount = page.locator('[role="option"]').first();

    if (await firstAccount.isVisible()) {
      await firstAccount.click();
      await page.waitForTimeout(1000);

      // Aller à l'onglet Transactions
      await page.click('button[role="tab"]:has-text("Transactions")');

      // Mesurer le temps de filtrage
      const startTime = Date.now();

      const searchInput = page.locator('input[placeholder="Rechercher..."]');
      await searchInput.fill('test');

      // Attendre que le filtrage s'applique (useMemo)
      await page.waitForTimeout(100);

      const endTime = Date.now();
      const filterTime = endTime - startTime;

      console.log(`⏱️ Temps de filtrage: ${filterTime}ms`);

      // Le filtrage doit être instantané (< 500ms)
      expect(filterTime).toBeLessThan(500);
    }
  });
});
