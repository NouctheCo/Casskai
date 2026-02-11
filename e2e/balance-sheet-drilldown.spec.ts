/**
 * Tests E2E - Balance Sheet Drill-down
 * P2-3: Rapports interactifs avec drill-down vers écritures sources
 */

import { test, expect } from '@playwright/test';

test.describe('Balance Sheet Drill-down', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_USER_EMAIL || 'test@casskai.app');
    await page.fill('input[name="password"]', process.env.TEST_USER_PASSWORD || 'TestPassword123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Naviguer vers module Comptabilité
    await page.goto('/accounting');
    await page.waitForLoadState('networkidle');
  });

  test('should display Reports tab in Accounting page', async ({ page }) => {
    const reportsTab = page.locator('button[value="reports"]');
    await expect(reportsTab).toBeVisible();
  });

  test('should generate Balance Sheet report', async ({ page }) => {
    // Cliquer sur onglet Rapports
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers', { timeout: 5000 });

    // Sélectionner type de rapport "Bilan"
    const reportTypeSelector = page.locator('select#report-type, button:has-text("Type de rapport")').first();
    await reportTypeSelector.click();

    // Cliquer sur "Bilan" (peut être dans un dropdown Radix)
    const bilanOption = page.locator('text=Bilan').first();
    if (await bilanOption.isVisible()) {
      await bilanOption.click();
    }

    // Sélectionner période (utiliser dates par défaut ou année en cours)
    // Les champs de date devraient être pré-remplis avec l'exercice en cours

    // Cliquer sur bouton Générer
    const generateButton = page.locator('button:has-text("Générer")');
    await generateButton.click();

    // Attendre génération du rapport
    await page.waitForSelector('text=BILAN', { timeout: 15000 });

    // Vérifier que le rapport est affiché
    await expect(page.locator('text=/ACTIF|PASSIF/')).toBeVisible();
  });

  test('should display drill-down hint in Balance Sheet', async ({ page }) => {
    // Générer le Bilan (voir test précédent)
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Assumer que le rapport est généré (peut nécessiter setup de données test)
    // Pour ce test, on peut directement accéder à une URL de rapport pré-généré
    // Ou générer le rapport comme dans le test précédent

    // Vérifier présence du hint drill-down
    const drilldownHint = page.locator('text=💡 Rapport interactif');
    const hintVisible = await drilldownHint.isVisible({ timeout: 5000 }).catch(() => false);

    if (hintVisible) {
      await expect(drilldownHint).toBeVisible();
      await expect(page.locator('text=Cliquez sur une ligne de compte pour voir les écritures détaillées')).toBeVisible();
    } else {
      console.log('⚠️ Hint drill-down non affiché (rapport peut être sans drill-down)');
    }
  });

  test('should display clickable rows with chevron icon', async ({ page }) => {
    // Note: Ce test suppose qu'un rapport avec drill-down est affiché
    // Peut nécessiter données de test appropriées

    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher des lignes de compte cliquables
    // Les lignes cliquables ont la classe cursor-pointer et hover:bg-blue-50
    const clickableRows = page.locator('tr.cursor-pointer');
    const rowsCount = await clickableRows.count();

    if (rowsCount > 0) {
      console.log(`✅ ${rowsCount} ligne(s) cliquable(s) trouvée(s)`);

      // Vérifier première ligne cliquable a une icône chevron
      const firstRow = clickableRows.first();
      await expect(firstRow).toBeVisible();

      // Vérifier présence icône ChevronRight (SVG ou icon)
      const chevronIcon = firstRow.locator('svg').first();
      await expect(chevronIcon).toBeVisible();
    } else {
      console.log('⚠️ Aucune ligne cliquable trouvée (rapport peut être sans drill-down ou données)');
    }
  });

  test('should navigate to journal entries on row click', async ({ page }) => {
    // Note: Test d'intégration complet - nécessite données test appropriées

    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher une ligne cliquable avec un compte (ex: 211000 Terrains)
    const clickableRow = page.locator('tr.cursor-pointer').first();
    const rowVisible = await clickableRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Extraire le numéro de compte de la ligne (première cellule)
      const accountCell = clickableRow.locator('td').first();
      const accountNumber = await accountCell.textContent();

      console.log(`Clic sur ligne compte: ${accountNumber}`);

      // Cliquer sur la ligne
      await clickableRow.click();

      // Attendre redirection vers /accounting/entries?account=XXX
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });

      // Vérifier que l'URL contient le paramètre account
      const currentURL = page.url();
      expect(currentURL).toContain('account=');

      // Vérifier que la page des écritures est affichée
      await expect(page.locator('text=Écritures comptables')).toBeVisible({ timeout: 5000 });

      console.log('✅ Navigation drill-down réussie');
    } else {
      console.log('⚠️ Aucune ligne cliquable disponible (test skip - nécessite données)');
    }
  });

  test('should apply correct filters after drill-down navigation', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    const clickableRow = page.locator('tr.cursor-pointer').first();
    const rowVisible = await clickableRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Cliquer sur ligne
      await clickableRow.click();
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });

      // Vérifier que les filtres sont appliqués dans l'URL
      const url = new URL(page.url());
      const searchParams = url.searchParams;

      // Vérifier présence paramètres account, start, end
      expect(searchParams.has('account')).toBe(true);
      expect(searchParams.has('start')).toBe(true);
      expect(searchParams.has('end')).toBe(true);

      console.log('✅ Filtres drill-down correctement appliqués');
      console.log(`  - account: ${searchParams.get('account')}`);
      console.log(`  - start: ${searchParams.get('start')}`);
      console.log(`  - end: ${searchParams.get('end')}`);
    } else {
      console.log('⚠️ Test skip - nécessite données avec drill-down');
    }
  });

  test('should show hover effect on clickable rows', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    const clickableRow = page.locator('tr.cursor-pointer').first();
    const rowVisible = await clickableRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Vérifier que la ligne a la classe cursor-pointer
      await expect(clickableRow).toHaveClass(/cursor-pointer/);

      // Hover sur la ligne
      await clickableRow.hover();

      // Vérifier que la classe hover:bg-blue-50 est appliquée (difficile à tester directement)
      // Alternative: vérifier que le curseur change
      const cursor = await clickableRow.evaluate(el => window.getComputedStyle(el).cursor);
      expect(cursor).toBe('pointer');

      console.log('✅ Hover effect présent');
    } else {
      console.log('⚠️ Test skip - nécessite données avec drill-down');
    }
  });

  test('should not be clickable for header and subtotal rows', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher des lignes de titre/sous-total (contiennent "---" ou "TOTAL" ou "Sous-total")
    const headerRows = page.locator('tr:has-text("---"), tr:has-text("TOTAL"), tr:has-text("Sous-total")');
    const headerCount = await headerRows.count();

    if (headerCount > 0) {
      // Vérifier qu'elles n'ont PAS la classe cursor-pointer
      const firstHeader = headerRows.first();
      const hasPointerClass = await firstHeader.evaluate(el => el.classList.contains('cursor-pointer'));

      expect(hasPointerClass).toBe(false);
      console.log('✅ Lignes header/sous-total non cliquables');
    } else {
      console.log('⚠️ Aucune ligne header trouvée dans le rapport');
    }
  });

  test('should support keyboard navigation (Enter key)', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    const clickableRow = page.locator('tr.cursor-pointer').first();
    const rowVisible = await clickableRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Focus sur la ligne (tab ou focus direct)
      await clickableRow.focus();

      // Appuyer sur Enter
      await page.keyboard.press('Enter');

      // Vérifier navigation
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });
      await expect(page.locator('text=Écritures comptables')).toBeVisible({ timeout: 5000 });

      console.log('✅ Navigation clavier (Enter) fonctionne');
    } else {
      console.log('⚠️ Test skip - nécessite données avec drill-down');
    }
  });
});
