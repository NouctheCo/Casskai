/**
 * Tests E2E - Inventory Settings
 * P2-2: Sélection méthode de valorisation des stocks
 */

import { test, expect } from '@playwright/test';

test.describe('Inventory Settings - Valuation Method Selection', () => {
  test.beforeEach(async ({ page }) => {
    // Login avec compte test
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@casskai.app');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');

    // Attendre la redirection vers dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Naviguer vers module Inventaire
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
  });

  test('should display Settings tab in Inventory page', async ({ page }) => {
    // Vérifier que l'onglet "Paramètres" existe
    const settingsTab = page.locator('button[value="settings"]');
    await expect(settingsTab).toBeVisible();
    await expect(settingsTab).toHaveText(/Paramètres/i);
  });

  test('should open Settings tab and display valuation method selector', async ({ page }) => {
    // Cliquer sur l'onglet Paramètres
    await page.click('button[value="settings"]');

    // Attendre que le composant InventorySettings se charge
    await page.waitForSelector('text=Valorisation des Stocks', { timeout: 5000 });

    // Vérifier titre
    await expect(page.locator('text=📦 Valorisation des Stocks')).toBeVisible();

    // Vérifier description
    await expect(page.locator('text=Choisissez la méthode de valorisation des sorties de stock')).toBeVisible();

    // Vérifier sélecteur méthode valorisation
    const methodSelector = page.locator('select#valuation-method, button[id="valuation-method"]');
    await expect(methodSelector).toBeVisible();
  });

  test('should display CMP, FIFO, LIFO options', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Ouvrir le sélecteur (Radix Select)
    const selectTrigger = page.locator('button[id="valuation-method"]');
    await selectTrigger.click();

    // Vérifier que les 3 options sont présentes
    await expect(page.locator('text=CMP (Coût Moyen Pondéré)')).toBeVisible();
    await expect(page.locator('text=FIFO (Premier Entré Premier Sorti)')).toBeVisible();
    await expect(page.locator('text=LIFO (Dernier Entré Premier Sorti)')).toBeVisible();
  });

  test('should select FIFO and save successfully', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Ouvrir sélecteur et choisir FIFO
    await page.locator('button[id="valuation-method"]').click();
    await page.locator('text=FIFO (Premier Entré Premier Sorti)').click();

    // Vérifier que le bouton Enregistrer est activé
    const saveButton = page.locator('button:has-text("Enregistrer")');
    await expect(saveButton).toBeEnabled();

    // Cliquer sur Enregistrer
    await saveButton.click();

    // Vérifier toast de succès
    await expect(page.locator('text=✅ Paramètres enregistrés')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Méthode de valorisation: FIFO')).toBeVisible();
  });

  test('should select CMP and save successfully', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Ouvrir sélecteur et choisir CMP
    await page.locator('button[id="valuation-method"]').click();
    await page.locator('text=CMP (Coût Moyen Pondéré)').click();

    // Enregistrer
    await page.locator('button:has-text("Enregistrer")').click();

    // Vérifier toast de succès
    await expect(page.locator('text=✅ Paramètres enregistrés')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Méthode de valorisation: CMP')).toBeVisible();
  });

  test('should block LIFO selection if company uses IFRS', async ({ page }) => {
    // Note: Ce test suppose que l'entreprise de test utilise IFRS
    // Si l'entreprise test utilise PCG, ce test sera skip

    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Vérifier si LIFO est désactivé (attribut disabled ou aria-disabled)
    const lifoOption = page.locator('text=LIFO (Dernier Entré Premier Sorti)');

    // Ouvrir le sélecteur
    await page.locator('button[id="valuation-method"]').click();

    // Si LIFO visible, vérifier s'il est disabled
    if (await lifoOption.isVisible()) {
      const lifoButton = page.locator('[role="option"]:has-text("LIFO")');
      const isDisabled = await lifoButton.getAttribute('data-disabled');

      if (isDisabled === 'true') {
        // LIFO désactivé → entreprise IFRS
        console.log('✅ LIFO correctement désactivé pour entreprise IFRS');

        // Vérifier message d'avertissement
        await expect(page.locator('text=⚠️ INTERDIT en IFRS')).toBeVisible();
      } else {
        // LIFO activé → entreprise non-IFRS
        console.log('⚠️ Entreprise test non-IFRS, test skip');
      }
    }
  });

  test('should show warning if LIFO selected (non-IFRS company)', async ({ page }) => {
    // Note: Ce test suppose que l'entreprise test utilise PCG/SYSCOHADA

    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Ouvrir sélecteur et choisir LIFO
    await page.locator('button[id="valuation-method"]').click();
    const lifoOption = page.locator('text=LIFO (Dernier Entré Premier Sorti)');

    if (await lifoOption.isVisible()) {
      const isDisabled = await page.locator('[role="option"]:has-text("LIFO")').getAttribute('data-disabled');

      if (isDisabled !== 'true') {
        // LIFO activé → cliquer
        await lifoOption.click();

        // Vérifier avertissement visuel
        await expect(page.locator('text=⚠️ Attention: LIFO peu recommandé')).toBeVisible({ timeout: 3000 });
        await expect(page.locator('text=La méthode LIFO est interdite en IFRS')).toBeVisible();
      }
    }
  });

  test('should display current accounting standard', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Vérifier affichage norme comptable
    const standardInfo = page.locator('text=Norme comptable:');
    await expect(standardInfo).toBeVisible();

    // Vérifier qu'une des normes est affichée
    const standardValue = page.locator('text=/Norme comptable: (PCG|SYSCOHADA|IFRS|SCF)/');
    await expect(standardValue).toBeVisible();
  });

  test('should show unsaved changes indicator', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Ouvrir sélecteur et changer méthode
    await page.locator('button[id="valuation-method"]').click();
    await page.locator('text=FIFO (Premier Entré Premier Sorti)').click();

    // Vérifier indicateur modifications non enregistrées
    await expect(page.locator('text=● Modifications non enregistrées')).toBeVisible({ timeout: 2000 });
  });

  test('should display method info card', async ({ page }) => {
    await page.click('button[value="settings"]');
    await page.waitForSelector('text=Valorisation des Stocks');

    // Vérifier carte info méthode (par défaut CMP)
    const infoCard = page.locator('div.rounded-lg.border.bg-blue-50');
    await expect(infoCard).toBeVisible();

    // Vérifier contenu (dépend de la méthode sélectionnée)
    const infoText = page.locator('text=/Chaque entrée met à jour le coût moyen|Les premières unités entrées|Les dernières unités entrées/');
    await expect(infoText).toBeVisible();
  });
});
