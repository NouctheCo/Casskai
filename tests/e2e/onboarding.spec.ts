import { test, expect } from '@playwright/test'

// Minimal happy-path onboarding; assumes authenticated session or public access gate mocked elsewhere

test.describe('Onboarding happy path', () => {
  test('user can complete onboarding flow', async ({ page }) => {
    await page.goto('/onboarding')

    // Step 1: Welcome
    await expect(page.locator('text=Bienvenue')).toBeVisible()
    await page.click('text=Commencer')

    // Step 2: Features (if present, just continue)
    if (await page.locator('text=Fonctionnalités').first().isVisible().catch(() => false)) {
      await page.click('text=Continuer')
    }

    // Step 3: Préférences (if present, continue)
    if (await page.locator('text=Préférences').first().isVisible().catch(() => false)) {
      await page.click('text=Continuer')
    }

    // Step 4: Entreprise
    await expect(page.locator('text=Informations de votre entreprise')).toBeVisible()
    await page.fill('#company-name', 'Acme SAS')
    await page.click('[role="combobox"]:has-text("Sélectionnez votre secteur")')
    await page.click('[data-state] div:has-text("Services aux entreprises")')
    await page.fill('#email', 'admin@acme.com')

    // country selector
    await page.click('label:has-text("Pays")')
    await page.click('[role="combobox"]:has-text("Sélectionnez un pays")')
    await page.click('div[role="option"]:has-text("France")')

    // Continue to finalization
    await page.click('[data-testid="onboarding-continue"]')

    // Step 5: Finalisation
    await expect(page.locator('text=Configuration en cours').or(page.locator('text=Bienvenue dans CassKai'))).toBeVisible()
    // Let it finish (UI simulates progress). We allow a generous timeout.
    await expect(page.locator('text=Commencer avec CassKai')).toBeVisible({ timeout: 30000 })
  })
})
