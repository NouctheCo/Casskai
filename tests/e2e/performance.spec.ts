// @ts-nocheck
import { test, expect } from '@playwright/test';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

test.describe('Performance Tests with Lighthouse', () => {
  test('should meet Lighthouse performance standards for dashboard', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Get Chrome DevTools Protocol endpoint
      const context = page.context();
      const client = await context.newCDPSession(page);
      
      // Run Lighthouse audit
      const { lhr } = await lighthouse('/dashboard', {
        port: 9222,
        output: 'json',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        settings: {
          formFactor: 'desktop',
          throttling: {
            rttMs: 40,
            throughputKbps: 10240,
            cpuSlowdownMultiplier: 1,
          },
          screenEmulation: {
            mobile: false,
            width: 1350,
            height: 940,
            deviceScaleFactor: 1,
          },
          onlyAudits: [
            'first-contentful-paint',
            'largest-contentful-paint',
            'cumulative-layout-shift',
            'total-blocking-time',
            'speed-index',
            'interactive',
          ],
        },
      });
      
      // Extract metrics
      const metrics = lhr.audits;
      const scores = lhr.categories;
      
      // Performance assertions
      expect(scores.performance.score).toBeGreaterThan(0.9); // > 90%
      expect(metrics['first-contentful-paint'].numericValue).toBeLessThan(1500); // < 1.5s
      expect(metrics['largest-contentful-paint'].numericValue).toBeLessThan(2500); // < 2.5s
      expect(metrics['cumulative-layout-shift'].numericValue).toBeLessThan(0.1); // < 0.1
      expect(metrics['total-blocking-time'].numericValue).toBeLessThan(300); // < 300ms
      expect(metrics['speed-index'].numericValue).toBeLessThan(3000); // < 3s
      expect(metrics['interactive'].numericValue).toBeLessThan(3800); // < 3.8s
      
      // Accessibility and best practices
      expect(scores.accessibility.score).toBeGreaterThan(0.95); // > 95%
      expect(scores['best-practices'].score).toBeGreaterThan(0.9); // > 90%
      
      console.log('📊 Lighthouse Performance Results:');
      console.log(`- Performance: ${Math.round(scores.performance.score * 100)}%`);
      console.log(`- Accessibility: ${Math.round(scores.accessibility.score * 100)}%`);
      console.log(`- Best Practices: ${Math.round(scores['best-practices'].score * 100)}%`);
      console.log(`- SEO: ${Math.round(scores.seo.score * 100)}%`);
      console.log('📈 Core Web Vitals:');
      console.log(`- FCP: ${Math.round(metrics['first-contentful-paint'].numericValue)}ms`);
      console.log(`- LCP: ${Math.round(metrics['largest-contentful-paint'].numericValue)}ms`);
      console.log(`- CLS: ${metrics['cumulative-layout-shift'].numericValue}`);
      console.log(`- TBT: ${Math.round(metrics['total-blocking-time'].numericValue)}ms`);
      
    } finally {
      await browser.close();
    }
  });
  
  test('should meet performance standards for mobile', async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Mobile-specific Lighthouse audit
      const { lhr } = await lighthouse('/dashboard', {
        port: 9222,
        output: 'json',
        onlyCategories: ['performance'],
        settings: {
          formFactor: 'mobile',
          throttling: {
            rttMs: 150,
            throughputKbps: 1600,
            cpuSlowdownMultiplier: 4,
          },
          screenEmulation: {
            mobile: true,
            width: 375,
            height: 667,
            deviceScaleFactor: 2,
          },
        },
      });
      
      const scores = lhr.categories;
      const metrics = lhr.audits;
      
      // Mobile performance should still be good (slightly lower threshold)
      expect(scores.performance.score).toBeGreaterThan(0.85); // > 85%
      expect(metrics['first-contentful-paint'].numericValue).toBeLessThan(2000); // < 2s
      expect(metrics['largest-contentful-paint'].numericValue).toBeLessThan(4000); // < 4s
      
      console.log('📱 Mobile Performance Results:');
      console.log(`- Performance: ${Math.round(scores.performance.score * 100)}%`);
      console.log(`- FCP: ${Math.round(metrics['first-contentful-paint'].numericValue)}ms`);
      console.log(`- LCP: ${Math.round(metrics['largest-contentful-paint'].numericValue)}ms`);
      
    } finally {
      await browser.close();
    }
  });
  
  test('should have optimal bundle size', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Monitor network requests to check bundle sizes
    const resources = [];
    page.on('response', response => {
      if (response.url().includes('.js') || response.url().includes('.css')) {
        resources.push({
          url: response.url(),
          size: response.headers()['content-length'] ? parseInt(response.headers()['content-length']) : 0,
          type: response.url().includes('.js') ? 'js' : 'css'
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Check bundle sizes
    const jsResources = resources.filter(r => r.type === 'js');
    const cssResources = resources.filter(r => r.type === 'css');
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + r.size, 0);
    
    // Bundle size assertions
    expect(totalJSSize).toBeLessThan(500 * 1024); // < 500KB JS
    expect(totalCSSSize).toBeLessThan(50 * 1024); // < 50KB CSS
    
    // Check for code splitting
    expect(jsResources.length).toBeGreaterThan(2); // Should have multiple chunks
    
    console.log('📦 Bundle Analysis:');
    console.log(`- Total JS: ${Math.round(totalJSSize / 1024)}KB`);
    console.log(`- Total CSS: ${Math.round(totalCSSSize / 1024)}KB`);
    console.log(`- JS Chunks: ${jsResources.length}`);
  });
  
  test('should load images efficiently', async ({ page }) => {
    await page.goto('/dashboard');
    
    const imageResources = [];
    page.on('response', response => {
      if (response.url().match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        imageResources.push({
          url: response.url(),
          size: response.headers()['content-length'] ? parseInt(response.headers()['content-length']) : 0,
          status: response.status()
        });
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Check image optimization
    const totalImageSize = imageResources.reduce((sum, img) => sum + img.size, 0);
    const failedImages = imageResources.filter(img => img.status >= 400);
    
    expect(totalImageSize).toBeLessThan(200 * 1024); // < 200KB total images
    expect(failedImages).toHaveLength(0); // No broken images
    
    // Check for modern formats (WebP, AVIF)
    const modernFormats = imageResources.filter(img => 
      img.url.includes('.webp') || img.url.includes('.avif')
    );
    
    console.log('🖼️ Image Analysis:');
    console.log(`- Total Images: ${imageResources.length}`);
    console.log(`- Total Size: ${Math.round(totalImageSize / 1024)}KB`);
    console.log(`- Modern Formats: ${modernFormats.length}`);
    console.log(`- Failed Images: ${failedImages.length}`);
  });
  
  test('should have efficient caching', async ({ page }) => {
    // First visit
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const firstVisitResources = [];
    page.on('response', response => {
      firstVisitResources.push({
        url: response.url(),
        fromCache: response.fromServiceWorker() || response.status() === 304,
        cacheHeaders: response.headers()['cache-control']
      });
    });
    
    // Reload page to test caching
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that static resources are cached
    const staticResources = firstVisitResources.filter(r => 
      r.url.includes('.js') || r.url.includes('.css') || r.url.includes('.woff')
    );
    
    const cachedResources = staticResources.filter(r => r.fromCache);
    const cacheEfficiency = cachedResources.length / staticResources.length;
    
    expect(cacheEfficiency).toBeGreaterThan(0.8); // > 80% cache hit rate
    
    console.log('💾 Caching Analysis:');
    console.log(`- Static Resources: ${staticResources.length}`);
    console.log(`- Cached Resources: ${cachedResources.length}`);
    console.log(`- Cache Efficiency: ${Math.round(cacheEfficiency * 100)}%`);
  });
  
  test('should handle concurrent users efficiently', async () => {
    const browsers = [];
    const pages = [];
    
    try {
      // Simulate 5 concurrent users
      for (let i = 0; i < 5; i++) {
        const browser = await chromium.launch();
        browsers.push(browser);
        
        const page = await browser.newPage();
        pages.push(page);
      }
      
      // Measure concurrent load time
      const startTime = Date.now();
      
      // All users navigate to dashboard simultaneously
      await Promise.all(pages.map(page => 
        page.goto('/dashboard').then(() => page.waitForLoadState('networkidle'))
      ));
      
      const endTime = Date.now();
      const totalLoadTime = endTime - startTime;
      
      // Should handle concurrent users without significant degradation
      expect(totalLoadTime).toBeLessThan(5000); // < 5s for all users
      
      // Check that all pages loaded successfully
      for (const page of pages) {
        await expect(page.locator('main')).toBeVisible();
      }
      
      console.log('👥 Concurrent User Test:');
      console.log(`- Users: 5`);
      console.log(`- Total Load Time: ${totalLoadTime}ms`);
      console.log(`- Avg Time per User: ${Math.round(totalLoadTime / 5)}ms`);
      
    } finally {
      // Clean up browsers
      await Promise.all(browsers.map(browser => browser.close()));
    }
  });
  
  test('should have minimal memory usage', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Get memory usage
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        };
      }
      return null;
    });
    
    if (metrics) {
      const heapUsageMB = metrics.usedJSHeapSize / (1024 * 1024);
      
      // Memory usage should be reasonable
      expect(heapUsageMB).toBeLessThan(50); // < 50MB heap usage
      
      console.log('🧠 Memory Analysis:');
      console.log(`- Heap Usage: ${Math.round(heapUsageMB)}MB`);
      console.log(`- Total Heap: ${Math.round(metrics.totalJSHeapSize / (1024 * 1024))}MB`);
    }
  });
});