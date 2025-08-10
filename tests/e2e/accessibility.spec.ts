import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page and inject axe
    await page.goto('/');
    await injectAxe(page);
  });

  test('should be accessible on landing page', async ({ page }) => {
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should be accessible on authentication pages', async ({ page }) => {
    await page.goto('/auth');
    
    // Check login form accessibility
    await checkA11y(page, '.auth-form', {
      rules: {
        // Custom rules for form accessibility
        'label': { enabled: true },
        'color-contrast': { enabled: true },
        'keyboard': { enabled: true },
      },
    });

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    expect(await focusedElement.count()).toBeGreaterThan(0);
  });

  test('should be accessible on dashboard', async ({ page }) => {
    // Login first (assuming we have auth state)
    await page.goto('/dashboard');
    
    // Check dashboard accessibility
    await checkA11y(page, null, {
      exclude: ['[role="presentation"]'], // Exclude decorative elements
      rules: {
        'heading-order': { enabled: true },
        'landmark-one-main': { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    });
  });

  test('should be accessible on forms (enterprise creation)', async ({ page }) => {
    await page.goto('/settings/enterprise');
    
    // Wait for form to load
    await page.waitForSelector('form', { timeout: 10000 });
    
    // Check form accessibility
    const violations = await getViolations(page, 'form');
    
    // Ensure no violations
    expect(violations).toHaveLength(0);
    
    // Test form labels and inputs
    const inputs = page.locator('input, select, textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const ariaLabel = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      
      // Each input should have either an aria-label or associated label
      if (!ariaLabel && id) {
        const associatedLabel = page.locator(`label[for="${id}"]`);
        expect(await associatedLabel.count()).toBeGreaterThan(0);
      } else if (!ariaLabel && !id) {
        // Input without proper labeling - this should fail the test
        expect(ariaLabel).toBeTruthy();
      }
    }
  });

  test('should be accessible on data tables', async ({ page }) => {
    await page.goto('/accounting');
    
    // Wait for table to load
    await page.waitForSelector('table', { timeout: 10000 });
    
    await checkA11y(page, 'table', {
      rules: {
        'table': { enabled: true },
        'th-has-data-cells': { enabled: true },
        'td-headers-attr': { enabled: true },
        'table-fake-caption': { enabled: true },
      },
    });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation through interactive elements
    const interactiveElements = page.locator('button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const elementCount = await interactiveElements.count();
    
    if (elementCount > 0) {
      // Start from first element
      await page.keyboard.press('Tab');
      
      for (let i = 0; i < Math.min(elementCount, 10); i++) {
        const focusedElement = page.locator(':focus');
        const tagName = await focusedElement.evaluate(el => el.tagName.toLowerCase());
        
        // Verify element can receive focus and is visible
        expect(await focusedElement.isVisible()).toBe(true);
        expect(['button', 'a', 'input', 'select', 'textarea'].some(tag => tagName.includes(tag))).toBe(true);
        
        await page.keyboard.press('Tab');
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'color-contrast': { enabled: true },
        'color-contrast-enhanced': { enabled: true },
      },
    });
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'heading-order': { enabled: true },
        'empty-heading': { enabled: true },
        'page-has-heading-one': { enabled: true },
      },
    });
  });

  test('should provide alternative text for images', async ({ page }) => {
    await checkA11y(page, null, {
      rules: {
        'image-alt': { enabled: true },
        'image-redundant-alt': { enabled: true },
      },
    });
  });

  test('should be accessible on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await checkA11y(page, null, {
      rules: {
        'target-size': { enabled: true }, // Touch targets should be large enough
        'meta-viewport': { enabled: true },
      },
    });
  });

  test('should handle focus management in modals', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Open a modal (assuming there's a button to open one)
    const modalTrigger = page.locator('[data-testid="open-modal"], .modal-trigger').first();
    
    if (await modalTrigger.count() > 0) {
      await modalTrigger.click();
      
      // Wait for modal to appear
      await page.waitForSelector('[role="dialog"], .modal', { timeout: 5000 });
      
      // Focus should be trapped within modal
      const modal = page.locator('[role="dialog"], .modal').first();
      
      // Check modal accessibility
      await checkA11y(modal, null, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'tabindex': { enabled: true },
        },
      });
      
      // Test focus trap
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      const isInsideModal = await focusedElement.evaluate((el, modal) => {
        return modal.contains(el);
      }, await modal.elementHandle());
      
      expect(isInsideModal).toBe(true);
    }
  });

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check for ARIA live regions
    const liveRegions = page.locator('[aria-live], [role="status"], [role="alert"]');
    const liveRegionCount = await liveRegions.count();
    
    if (liveRegionCount > 0) {
      await checkA11y(page, null, {
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'aria-valid-attr': { enabled: true },
        },
      });
    }
    
    // Test that dynamic updates are announced
    const refreshButton = page.locator('[data-testid="refresh"], button:has-text("Actualiser")').first();
    if (await refreshButton.count() > 0) {
      await refreshButton.click();
      
      // Should have loading or success state announced
      const announcements = page.locator('[aria-live="polite"], [aria-live="assertive"], [role="status"]');
      expect(await announcements.count()).toBeGreaterThan(0);
    }
  });

  test('should provide skip links', async ({ page }) => {
    await page.goto('/');
    
    // Test skip to main content link
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a:has-text("Passer au contenu"), a:has-text("Skip to content"), .skip-link').first();
    
    if (await skipLink.count() > 0) {
      expect(await skipLink.isVisible()).toBe(true);
      
      // Click skip link and verify focus moves to main content
      await skipLink.click();
      const mainContent = page.locator('main, [role="main"], #main-content').first();
      
      if (await mainContent.count() > 0) {
        const isFocused = await mainContent.evaluate(el => document.activeElement === el || el.contains(document.activeElement));
        expect(isFocused).toBe(true);
      }
    }
  });

  test('should work with screen readers', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper semantic markup
    await checkA11y(page, null, {
      rules: {
        'region': { enabled: true },
        'landmark-one-main': { enabled: true },
        'landmark-complementary-is-top-level': { enabled: true },
        'landmark-no-duplicate-banner': { enabled: true },
        'landmark-no-duplicate-contentinfo': { enabled: true },
      },
    });
    
    // Verify page has proper document structure
    const main = page.locator('main, [role="main"]');
    expect(await main.count()).toBeGreaterThan(0);
    
    const navigation = page.locator('nav, [role="navigation"]');
    expect(await navigation.count()).toBeGreaterThan(0);
  });
});

// Helper test for generating accessibility reports
test('generate accessibility report', async ({ page }, testInfo) => {
  const pages = ['/', '/auth', '/dashboard', '/accounting'];
  const results = [];
  
  for (const pagePath of pages) {
    try {
      await page.goto(pagePath);
      await injectAxe(page);
      
      const violations = await getViolations(page);
      results.push({
        page: pagePath,
        violations: violations.length,
        issues: violations.map(v => ({
          id: v.id,
          impact: v.impact,
          description: v.description,
          nodes: v.nodes.length,
        })),
      });
    } catch (error) {
      results.push({
        page: pagePath,
        error: error.message,
      });
    }
  }
  
  // Save report as test artifact
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalPages: pages.length,
      totalViolations: results.reduce((sum, r) => sum + (r.violations || 0), 0),
      pagesWithIssues: results.filter(r => r.violations > 0).length,
    },
  };
  
  await testInfo.attach('accessibility-report.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  
  // Fail test if there are violations
  expect(report.summary.totalViolations).toBe(0);
});