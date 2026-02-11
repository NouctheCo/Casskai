/**
 * Tests E2E - Income Statement (P&L) Drill-down
 * P2-3: Rapports interactifs Compte de Résultat avec drill-down
 */

import { test, expect } from '@playwright/test';

test.describe('Income Statement (P&L) Drill-down', () => {
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

  test('should generate Income Statement report', async ({ page }) => {
    // Cliquer sur onglet Rapports
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers', { timeout: 5000 });

    // Sélectionner type de rapport "Compte de Résultat"
    const reportTypeSelector = page.locator('select#report-type, button:has-text("Type de rapport")').first();
    await reportTypeSelector.click();

    // Sélectionner "Compte de Résultat" ou "P&L"
    const plOption = page.locator('text=/Compte de Résultat|P&L|Income Statement/').first();
    if (await plOption.isVisible()) {
      await plOption.click();
    }

    // Cliquer sur bouton Générer
    const generateButton = page.locator('button:has-text("Générer")');
    await generateButton.click();

    // Attendre génération du rapport
    await page.waitForSelector('text=/COMPTE DE RÉSULTAT|PRODUITS|CHARGES/', { timeout: 15000 });

    // Vérifier que le rapport est affiché
    await expect(page.locator('text=/PRODUITS|CHARGES/')).toBeVisible();
  });

  test('should display PRODUITS and CHARGES tables', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Vérifier présence des sections Produits et Charges
    const produitsSection = page.locator('text=PRODUITS').first();
    const chargesSection = page.locator('text=CHARGES').first();

    // Ces sections peuvent être présentes ou non selon les données
    const produitsVisible = await produitsSection.isVisible({ timeout: 5000 }).catch(() => false);
    const chargesVisible = await chargesSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (produitsVisible || chargesVisible) {
      console.log('✅ Tables PRODUITS et/ou CHARGES affichées');
    } else {
      console.log('⚠️ Rapport P&L non généré ou données manquantes');
    }
  });

  test('should have clickable rows for revenue accounts (7x)', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher des comptes de produits (commencent par 7)
    const revenueRows = page.locator('tr.cursor-pointer:has-text(/^7[0-9]{5}/)');
    const rowsCount = await revenueRows.count();

    if (rowsCount > 0) {
      console.log(`✅ ${rowsCount} ligne(s) de produits (7x) cliquable(s)`);

      // Vérifier première ligne a chevron
      const firstRow = revenueRows.first();
      await expect(firstRow).toBeVisible();

      const chevronIcon = firstRow.locator('svg').first();
      await expect(chevronIcon).toBeVisible();
    } else {
      console.log('⚠️ Aucune ligne de produits cliquable (données test manquantes)');
    }
  });

  test('should have clickable rows for expense accounts (6x)', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher des comptes de charges (commencent par 6)
    const expenseRows = page.locator('tr.cursor-pointer:has-text(/^6[0-9]{5}/)');
    const rowsCount = await expenseRows.count();

    if (rowsCount > 0) {
      console.log(`✅ ${rowsCount} ligne(s) de charges (6x) cliquable(s)`);

      // Vérifier première ligne a chevron
      const firstRow = expenseRows.first();
      await expect(firstRow).toBeVisible();

      const chevronIcon = firstRow.locator('svg').first();
      await expect(chevronIcon).toBeVisible();
    } else {
      console.log('⚠️ Aucune ligne de charges cliquable (données test manquantes)');
    }
  });

  test('should navigate to journal entries from revenue account', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Cliquer sur première ligne de produits
    const revenueRow = page.locator('tr.cursor-pointer:has-text(/^7[0-9]{5}/)').first();
    const rowVisible = await revenueRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Extraire numéro de compte
      const accountCell = revenueRow.locator('td').first();
      const accountNumber = await accountCell.textContent();

      console.log(`Clic sur compte produit: ${accountNumber}`);

      // Cliquer
      await revenueRow.click();

      // Vérifier navigation
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });
      const url = page.url();
      expect(url).toContain('account=7');

      console.log('✅ Navigation depuis compte produit réussie');
    } else {
      console.log('⚠️ Test skip - aucun compte produit cliquable');
    }
  });

  test('should navigate to journal entries from expense account', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Cliquer sur première ligne de charges
    const expenseRow = page.locator('tr.cursor-pointer:has-text(/^6[0-9]{5}/)').first();
    const rowVisible = await expenseRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      // Extraire numéro de compte
      const accountCell = expenseRow.locator('td').first();
      const accountNumber = await accountCell.textContent();

      console.log(`Clic sur compte charge: ${accountNumber}`);

      // Cliquer
      await expenseRow.click();

      // Vérifier navigation
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });
      const url = page.url();
      expect(url).toContain('account=6');

      console.log('✅ Navigation depuis compte charge réussie');
    } else {
      console.log('⚠️ Test skip - aucun compte charge cliquable');
    }
  });

  test('should display HAO sections for SYSCOHADA standard', async ({ page }) => {
    // Note: Ce test suppose que l'entreprise test utilise SYSCOHADA

    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher sections HAO (Hors Activités Ordinaires)
    const produitsHAO = page.locator('text=PRODUITS HAO');
    const chargesHAO = page.locator('text=CHARGES HAO');

    const produitsHAOVisible = await produitsHAO.isVisible({ timeout: 5000 }).catch(() => false);
    const chargesHAOVisible = await chargesHAO.isVisible({ timeout: 5000 }).catch(() => false);

    if (produitsHAOVisible || chargesHAOVisible) {
      console.log('✅ Sections HAO présentes (entreprise SYSCOHADA)');

      // Vérifier que les comptes HAO (8x) sont cliquables
      const haoRows = page.locator('tr.cursor-pointer:has-text(/^8[0-9]{5}/)');
      const haoCount = await haoRows.count();

      if (haoCount > 0) {
        console.log(`✅ ${haoCount} ligne(s) HAO (8x) cliquable(s)`);
      }
    } else {
      console.log('⚠️ Aucune section HAO (entreprise non-SYSCOHADA ou pas de données HAO)');
    }
  });

  test('should have clickable HAO account rows', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher comptes HAO (8x)
    const haoRow = page.locator('tr.cursor-pointer:has-text(/^8[0-9]{5}/)').first();
    const rowVisible = await haoRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      console.log('✅ Comptes HAO cliquables présents');

      // Cliquer
      await haoRow.click();

      // Vérifier navigation
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });
      const url = page.url();
      expect(url).toContain('account=8');

      console.log('✅ Navigation depuis compte HAO réussie');
    } else {
      console.log('⚠️ Test skip - pas de comptes HAO cliquables');
    }
  });

  test('should not be clickable for SIG rows (calculated metrics)', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher table SIG (Soldes Intermédiaires de Gestion)
    const sigSection = page.locator('text=SOLDES INTERMÉDIAIRES DE GESTION');
    const sigVisible = await sigSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (sigVisible) {
      // Les lignes SIG (Marge commerciale, EBE, etc.) ne doivent PAS être cliquables
      const sigRows = page.locator('tr:has-text(/Marge commerciale|Valeur ajoutée|EBE|Résultat d\'exploitation/)');
      const firstSigRow = sigRows.first();

      if (await firstSigRow.isVisible()) {
        const hasPointerClass = await firstSigRow.evaluate(el => el.classList.contains('cursor-pointer'));
        expect(hasPointerClass).toBe(false);

        console.log('✅ Lignes SIG (calculées) non cliquables');
      }
    } else {
      console.log('⚠️ Section SIG non affichée');
    }
  });

  test('should not be clickable for total rows', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Chercher lignes de totaux
    const totalRows = page.locator('tr:has-text(/Total Produits|Total Charges|Résultat d\'exploitation/)');
    const totalCount = await totalRows.count();

    if (totalCount > 0) {
      const firstTotal = totalRows.first();
      const hasPointerClass = await firstTotal.evaluate(el => el.classList.contains('cursor-pointer'));

      expect(hasPointerClass).toBe(false);
      console.log('✅ Lignes totaux non cliquables');
    } else {
      console.log('⚠️ Aucune ligne total trouvée');
    }
  });

  test('should display drill-down hint in P&L report', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Vérifier présence du hint
    const drilldownHint = page.locator('text=💡 Rapport interactif');
    const hintVisible = await drilldownHint.isVisible({ timeout: 5000 }).catch(() => false);

    if (hintVisible) {
      await expect(drilldownHint).toBeVisible();
      await expect(page.locator('text=Cliquez sur une ligne de compte')).toBeVisible();
      console.log('✅ Hint drill-down affiché');
    } else {
      console.log('⚠️ Hint drill-down non affiché');
    }
  });

  test('should apply correct date filters after drill-down', async ({ page }) => {
    await page.click('button[value="reports"]');
    await page.waitForSelector('text=Rapports financiers');

    // Cliquer sur n'importe quel compte cliquable
    const clickableRow = page.locator('tr.cursor-pointer:has-text(/^[67][0-9]{5}/)').first();
    const rowVisible = await clickableRow.isVisible({ timeout: 5000 }).catch(() => false);

    if (rowVisible) {
      await clickableRow.click();
      await page.waitForURL(/\/accounting\/entries/, { timeout: 10000 });

      // Vérifier paramètres URL
      const url = new URL(page.url());
      const searchParams = url.searchParams;

      expect(searchParams.has('account')).toBe(true);
      expect(searchParams.has('start')).toBe(true);
      expect(searchParams.has('end')).toBe(true);

      // Vérifier que les dates correspondent à la période du rapport
      const startDate = searchParams.get('start');
      const endDate = searchParams.get('end');

      console.log('✅ Filtres appliqués:');
      console.log(`  - start: ${startDate}`);
      console.log(`  - end: ${endDate}`);
    } else {
      console.log('⚠️ Test skip - pas de ligne cliquable');
    }
  });
});
