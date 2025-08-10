import { test, expect } from '@playwright/test'

test.describe('Onboarding failure and retry', () => {
  test('shows error and allows retry on finalization failure', async ({ page }) => {
    // Intercept Supabase calls to force a failure during finalization
    await page.route('**://*.supabase.co/**', route => {
      route.fulfill({ status: 500, body: 'Internal Error' })
    })

    await page.goto('/onboarding')

    // Welcome → continue
    if (await page.getByText('Bienvenue').isVisible().catch(() => false)) {
      const startBtn = await page.getByRole('button', { name: /commencer|continuer/i }).first()
      if (await startBtn.isVisible().catch(() => false)) await startBtn.click()
    }

    // Features → continue (if present)
    if (await page.getByText('Fonctionnalités').first().isVisible().catch(() => false)) {
      const cont = page.getByRole('button', { name: /continuer/i }).first()
      if (await cont.isVisible().catch(() => false)) await cont.click()
    }

    // Préférences → continue (if present)
    if (await page.getByText('Préférences').first().isVisible().catch(() => false)) {
      const cont = page.getByRole('button', { name: /continuer/i }).first()
      if (await cont.isVisible().catch(() => false)) await cont.click()
    }

    // Company step
    await page.fill('#company-name', 'Acme Test')
    // sector select
    await page.getByRole('combobox').first().click()
    await page.getByRole('option').first().click()
    await page.fill('#email', 'user@acme.test')
    // country select (open second combobox on the section)
    const combos = page.getByRole('combobox')
    if (await combos.nth(1).isVisible().catch(() => false)) {
      await combos.nth(1).click()
      const frOption = page.getByRole('option', { name: /france/i })
      if (await frOption.isVisible().catch(() => false)) await frOption.click()
    }

    // Continue triggers finalization
    await page.getByTestId('onboarding-continue').click()

    // Expect error UI and retry button
    await expect(page.getByText(/Erreur de configuration|Une erreur est survenue/i)).toBeVisible({ timeout: 30000 })
    const retryBtn = page.getByRole('button', { name: /réessayer la finalisation/i })
    await expect(retryBtn).toBeVisible()
    await retryBtn.click()

    // Still failing; error remains visible
    await expect(page.getByText(/Erreur de configuration|Une erreur est survenue/i)).toBeVisible()
  })
})
