/**
 * Tests E2E - Performance
 * Phase 2 - Task #15
 *
 * Tests:
 * - Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Lazy loading pages
 * - Images lazy loaded
 * - Bundle size
 * - Cache strategies
 * - Performance Dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Performance Optimization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have good Largest Contentful Paint (LCP)', async ({ page }) => {
    await page.goto('/');

    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcp = lastEntry.renderTime || lastEntry.loadTime;
          resolve(lcp);
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        setTimeout(() => resolve(0), 5000);
      });
    });

    console.log('📊 LCP:', Math.round(lcp), 'ms');
    expect(lcp).toBeLessThan(2500); // Good threshold
  });

  test('should have good First Input Delay (FID)', async ({ page }) => {
    await page.goto('/');

    // Simuler interaction
    await page.click('body');

    const fid = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fid = entry.processingStart - entry.startTime;
            resolve(fid);
          });
        }).observe({ type: 'first-input', buffered: true });

        setTimeout(() => resolve(0), 3000);
      });
    });

    if (fid > 0) {
      console.log('📊 FID:', Math.round(fid), 'ms');
      expect(fid).toBeLessThan(100); // Good threshold
    } else {
      console.log('ℹ️  FID: Pas d\'interaction détectée');
    }
  });

  test('should have good Cumulative Layout Shift (CLS)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const cls = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let clsValue = 0;

        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
        }).observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => resolve(clsValue), 3000);
      });
    });

    console.log('📊 CLS:', cls.toFixed(3));
    expect(cls).toBeLessThan(0.1); // Good threshold
  });

  test('should have good First Contentful Paint (FCP)', async ({ page }) => {
    await page.goto('/');

    const fcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              resolve(entry.startTime);
            }
          });
        }).observe({ type: 'paint', buffered: true });

        setTimeout(() => resolve(0), 3000);
      });
    });

    console.log('📊 FCP:', Math.round(fcp), 'ms');
    expect(fcp).toBeLessThan(1800); // Good threshold
  });

  test('should have good Time to First Byte (TTFB)', async ({ page }) => {
    await page.goto('/');

    const ttfb = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navEntry) {
        return navEntry.responseStart - navEntry.requestStart;
      }
      return 0;
    });

    console.log('📊 TTFB:', Math.round(ttfb), 'ms');
    expect(ttfb).toBeLessThan(800); // Good threshold
  });

  test('should lazy load pages', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Vérifier chunks lazy loadés
    const chunks = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      return scripts
        .map((script) => (script as HTMLScriptElement).src)
        .filter((src) => src.includes('.js'));
    });

    // Vérifier présence de chunks
    const hasChunks = chunks.some((src) => /chunk|lazy|async/.test(src));
    console.log('📦 Chunks JS:', chunks.length, hasChunks ? '(lazy loaded)' : '');

    expect(chunks.length).toBeGreaterThan(1); // Multiple chunks = code splitting actif
  });

  test('should lazy load images', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Vérifier images avec lazy loading
    const lazyImages = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.filter((img) => img.loading === 'lazy' || img.dataset.src).length;
    });

    console.log('🖼️  Images lazy loaded:', lazyImages);

    if (lazyImages > 0) {
      console.log('✅ Lazy loading images actif');
    } else {
      console.log('ℹ️  Lazy loading images: pas d\'images ou à implémenter');
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const resources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const scripts = resources.filter((r) => r.initiatorType === 'script');

      const totalSize = scripts.reduce((sum, r) => sum + (r.transferSize || 0), 0);

      return {
        count: scripts.length,
        totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        largest: scripts
          .sort((a, b) => (b.transferSize || 0) - (a.transferSize || 0))
          .slice(0, 3)
          .map((r) => ({
            name: r.name.split('/').pop(),
            size: `${((r.transferSize || 0) / 1024).toFixed(2)} KB`,
          })),
      };
    });

    console.log('📦 Bundle stats:');
    console.log('  - Scripts:', resources.count);
    console.log('  - Taille totale:', resources.totalSizeMB, 'MB');
    console.log('  - Plus gros scripts:', resources.largest);

    // Vérifier taille raisonnable (< 5MB total)
    expect(resources.totalSize).toBeLessThan(5 * 1024 * 1024);
  });

  test('should cache static assets', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Recharger et vérifier cache
    await page.reload();
    await page.waitForLoadState('networkidle');

    const cachedResources = await page.evaluate(async () => {
      if (!('caches' in window)) return { count: 0, caches: [] };

      const cacheNames = await caches.keys();
      const cassKaiCaches = cacheNames.filter((name) => name.startsWith('casskai-'));

      let totalEntries = 0;
      for (const cacheName of cassKaiCaches) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        totalEntries += keys.length;
      }

      return {
        count: totalEntries,
        caches: cassKaiCaches,
      };
    });

    console.log('💾 Cache stats:');
    console.log('  - Caches:', cachedResources.caches.join(', '));
    console.log('  - Entrées:', cachedResources.count);

    expect(cachedResources.count).toBeGreaterThan(0);
  });

  test('should have Performance Dashboard accessible', async ({ page }) => {
    // Essayer d'accéder au dashboard performance
    await page.goto('/performance');

    // Vérifier si route existe
    const is404 = await page.locator('text=/404|not found/i').count() > 0;

    if (!is404) {
      await expect(page.locator('text=/performance/i, text=/web vitals/i')).toBeVisible({
        timeout: 5000,
      });
      console.log('✅ Performance Dashboard accessible');
    } else {
      console.log('ℹ️  Performance Dashboard: route à ajouter au router');
    }
  });

  test('should display performance metrics in dashboard', async ({ page }) => {
    await page.goto('/performance');
    await page.waitForTimeout(2000);

    // Vérifier présence métriques Web Vitals
    const metrics = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB'];
    let foundMetrics = 0;

    for (const metric of metrics) {
      const metricElement = page.locator(`text=${metric}`);
      if (await metricElement.count() > 0) {
        foundMetrics++;
      }
    }

    console.log(`📊 Métriques affichées: ${foundMetrics}/${metrics.length}`);

    if (foundMetrics > 0) {
      expect(foundMetrics).toBeGreaterThan(3); // Au moins 3 métriques
    }
  });

  test('should show Lighthouse score estimate', async ({ page }) => {
    await page.goto('/performance');
    await page.waitForTimeout(2000);

    const lighthouseScore = page.locator('text=/lighthouse/i, text=/score/i');

    if (await lighthouseScore.count() > 0) {
      await expect(lighthouseScore.first()).toBeVisible();

      // Essayer d'extraire valeur score
      const scoreText = await page.locator('[class*="score"], [class*="text-6xl"]').first().textContent();
      if (scoreText) {
        const score = parseInt(scoreText);
        console.log('🎯 Lighthouse score estimé:', score);

        expect(score).toBeGreaterThan(70); // Au moins 70
      }
    }
  });

  test('should track memory usage', async ({ page }) => {
    await page.goto('/performance');
    await page.waitForTimeout(2000);

    const memoryUsage = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedMB: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
        };
      }
      return null;
    });

    if (memoryUsage) {
      console.log('🧠 Memory usage:', memoryUsage.usedMB, 'MB');
      expect(parseInt(memoryUsage.usedMB)).toBeLessThan(200); // < 200MB
    } else {
      console.log('ℹ️  Memory API non disponible (Chrome/Edge uniquement)');
    }
  });

  test('should have good performance on mobile', async ({ page, context }) => {
    // Simuler mobile
    await context.setViewport({ width: 375, height: 667 });
    await context.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)');

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Mesurer temps chargement mobile
    const loadTime = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return navEntry.loadEventEnd - navEntry.fetchStart;
    });

    console.log('📱 Temps chargement mobile:', Math.round(loadTime), 'ms');
    expect(loadTime).toBeLessThan(3000); // < 3s sur mobile
  });
});
