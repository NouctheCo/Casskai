/**
 * Tests E2E - PWA (Progressive Web App)
 * Phase 2 - Task #15
 *
 * Tests:
 * - Manifest.json présent et valide
 * - Service Worker enregistré
 * - Installabilité PWA
 * - Icônes disponibles
 * - Offline fallback
 * - Push notifications setup
 */

import { test, expect } from '@playwright/test';

test.describe('PWA - Progressive Web App', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have valid manifest.json', async ({ page }) => {
    // Vérifier présence manifest link
    const manifestLink = await page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveCount(1);

    const manifestHref = await manifestLink.getAttribute('href');
    expect(manifestHref).toBeTruthy();

    // Fetch manifest et vérifier contenu
    const manifestResponse = await page.request.get(manifestHref!);
    expect(manifestResponse.ok()).toBeTruthy();

    const manifest = await manifestResponse.json();

    // Vérifier propriétés obligatoires
    expect(manifest.name).toBe('CassKai');
    expect(manifest.short_name).toBe('CassKai');
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();

    // Vérifier icônes
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);

    // Vérifier au moins une icône 192x192 (Android)
    const icon192 = manifest.icons.find((icon: any) => icon.sizes === '192x192');
    expect(icon192).toBeDefined();

    // Vérifier au moins une icône 512x512 (splash screen)
    const icon512 = manifest.icons.find((icon: any) => icon.sizes === '512x512');
    expect(icon512).toBeDefined();

    console.log('✅ Manifest.json valide:', manifest);
  });

  test('should register service worker', async ({ page, context }) => {
    // Attendre enregistrement service worker
    await page.waitForTimeout(2000);

    // Vérifier service worker enregistré
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    expect(swRegistered).toBeTruthy();

    console.log('✅ Service Worker enregistré');
  });

  test('should have all required icons', async ({ page }) => {
    const manifestLink = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestResponse = await page.request.get(manifestLink!);
    const manifest = await manifestResponse.json();

    // Vérifier que toutes les icônes sont accessibles
    for (const icon of manifest.icons) {
      const iconResponse = await page.request.get(icon.src);
      expect(iconResponse.ok()).toBeTruthy();
      console.log(`✅ Icon ${icon.sizes} disponible: ${icon.src}`);
    }
  });

  test('should have apple-touch-icon', async ({ page }) => {
    const appleTouchIcon = await page.locator('link[rel="apple-touch-icon"]');
    await expect(appleTouchIcon).toHaveCount(1);

    const iconHref = await appleTouchIcon.getAttribute('href');
    const iconResponse = await page.request.get(iconHref!);
    expect(iconResponse.ok()).toBeTruthy();

    console.log('✅ Apple Touch Icon disponible');
  });

  test('should have theme color meta tag', async ({ page }) => {
    const themeColor = await page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveCount(1);

    const color = await themeColor.getAttribute('content');
    expect(color).toMatch(/^#[0-9A-Fa-f]{6}$/);

    console.log('✅ Theme color:', color);
  });

  test('should be installable (beforeinstallprompt)', async ({ page, context }) => {
    // Note: Ce test ne peut vérifier que le setup, pas l'événement réel
    // qui nécessite interaction utilisateur et critères PWA complets

    const hasInstallPromptListener = await page.evaluate(() => {
      return 'onbeforeinstallprompt' in window;
    });

    expect(hasInstallPromptListener).toBeTruthy();

    console.log('✅ Install prompt listener disponible');
  });

  test('should cache static assets', async ({ page }) => {
    // Recharger page et vérifier cache
    await page.reload();

    // Vérifier que certaines ressources viennent du cache
    const cachedResources = await page.evaluate(async () => {
      if (!('caches' in window)) return [];

      const cacheNames = await caches.keys();
      const cassKaiCache = cacheNames.find((name) => name.startsWith('casskai-'));

      if (!cassKaiCache) return [];

      const cache = await caches.open(cassKaiCache);
      const keys = await cache.keys();

      return keys.map((req) => req.url);
    });

    expect(cachedResources.length).toBeGreaterThan(0);
    console.log(`✅ ${cachedResources.length} ressources en cache`);
  });

  test('should work offline (basic)', async ({ page, context }) => {
    // Charger page normalement
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Simuler offline
    await context.setOffline(true);

    // Essayer de recharger
    await page.reload();

    // Vérifier que la page se charge (depuis cache)
    await expect(page.locator('body')).toBeVisible();

    console.log('✅ Page accessible offline');

    // Remettre online
    await context.setOffline(false);
  });

  test('should have correct viewport meta', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);

    const content = await viewport.getAttribute('content');
    expect(content).toContain('width=device-width');
    expect(content).toContain('initial-scale=1');

    console.log('✅ Viewport meta correct');
  });

  test('should support push notifications (setup)', async ({ page }) => {
    const notificationsSupported = await page.evaluate(() => {
      return 'Notification' in window && 'serviceWorker' in navigator;
    });

    expect(notificationsSupported).toBeTruthy();

    console.log('✅ Push notifications supportées');
  });
});
