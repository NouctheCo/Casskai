#!/usr/bin/env node

/**
 * Comprehensive Test Runner for CassKai Application
 * Runs all critical tests to ensure 100% functional reliability
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  output: string;
  error?: string;
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime = Date.now();

  constructor() {
    console.log('🚀 Starting Comprehensive CassKai Test Suite\n');
  }

  private async runCommand(command: string, suite: string): Promise<TestResult> {
    const start = Date.now();
    
    try {
      console.log(`📋 Running ${suite}...`);
      const output = execSync(command, { 
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const duration = Date.now() - start;
      console.log(`✅ ${suite} completed in ${duration}ms`);
      
      return {
        suite,
        passed: true,
        duration,
        output
      };
    } catch (error: any) {
      const duration = Date.now() - start;
      console.log(`❌ ${suite} failed in ${duration}ms`);
      
      return {
        suite,
        passed: false,
        duration,
        output: error.stdout || '',
        error: error.stderr || error.message
      };
    }
  }

  async runUnitTests(): Promise<void> {
    console.log('\n=== 🧪 Unit Tests ===');
    
    const unitTests = [
      {
        command: 'npm test -- src/services/__tests__/invoicingService.test.ts --run',
        suite: 'Invoice Service Tests'
      },
      {
        command: 'npm test -- src/services/__tests__/accountingService.test.ts --run',
        suite: 'Accounting Service Tests'
      },
      {
        command: 'npm test -- src/services/__tests__/bankReconciliationService.test.ts --run',
        suite: 'Bank Reconciliation Tests'
      },
      {
        command: 'npm test -- src/services/__tests__/subscriptionService.test.ts --run',
        suite: 'Subscription Service Tests'
      },
      {
        command: 'npm test -- src/services/__tests__/stripe-integration.test.ts --run',
        suite: 'Stripe Integration Tests'
      }
    ];

    for (const test of unitTests) {
      const result = await this.runCommand(test.command, test.suite);
      this.results.push(result);
    }
  }

  async runIntegrationTests(): Promise<void> {
    console.log('\n=== 🔗 Integration Tests ===');
    
    // Check if integration tests exist
    const integrationTestsPath = path.join(process.cwd(), 'src', 'test');
    if (existsSync(integrationTestsPath)) {
      const result = await this.runCommand(
        'npm run test:integration',
        'Database Integration Tests'
      );
      this.results.push(result);
    } else {
      console.log('⚠️  No integration tests found, skipping...');
    }
  }

  async runE2ETests(): Promise<void> {
    console.log('\n=== 🎭 E2E Tests ===');
    
    // Check if Playwright is configured
    if (existsSync(path.join(process.cwd(), 'playwright.config.ts'))) {
      const e2eTests = [
        {
          command: 'npx playwright test tests/e2e/onboarding-to-first-invoice.spec.ts --project=chromium',
          suite: 'Onboarding to First Invoice Flow'
        },
        {
          command: 'npx playwright test tests/e2e/login-bank-reconciliation.spec.ts --project=chromium',
          suite: 'Bank Reconciliation Workflow'
        },
        {
          command: 'npx playwright test tests/e2e/client-quote-invoice-workflow.spec.ts --project=chromium',
          suite: 'Sales Workflow (Client → Quote → Invoice)'
        },
        {
          command: 'npx playwright test tests/e2e/company-settings-management.spec.ts --project=chromium',
          suite: 'Company Settings Management'
        }
      ];

      for (const test of e2eTests) {
        const result = await this.runCommand(test.command, test.suite);
        this.results.push(result);
      }
    } else {
      console.log('⚠️  Playwright not configured, skipping E2E tests...');
    }
  }

  async runStripeTests(): Promise<void> {
    console.log('\n=== 💳 Stripe Payment Tests ===');
    
    // Only run if Stripe test keys are configured
    if (process.env.STRIPE_SECRET_KEY_TEST && process.env.STRIPE_PUBLISHABLE_KEY_TEST) {
      const result = await this.runCommand(
        'npx playwright test tests/e2e/stripe-payment-flow.spec.ts --project=chromium',
        'Stripe Payment Integration'
      );
      this.results.push(result);
    } else {
      console.log('⚠️  Stripe test keys not configured, skipping payment tests...');
      console.log('   Set STRIPE_SECRET_KEY_TEST and STRIPE_PUBLISHABLE_KEY_TEST to run these tests');
    }
  }

  async runTypeChecking(): Promise<void> {
    console.log('\n=== 📝 Type Checking ===');
    
    const typeCheckTests = [
      {
        command: 'npm run type-check:app',
        suite: 'Application Type Check'
      },
      {
        command: 'npm run type-check:vitest',
        suite: 'Vitest Type Check'
      },
      {
        command: 'npm run type-check:playwright',
        suite: 'Playwright Type Check'
      }
    ];

    for (const test of typeCheckTests) {
      const result = await this.runCommand(test.command, test.suite);
      this.results.push(result);
    }
  }

  async runLinting(): Promise<void> {
    console.log('\n=== 🔍 Code Quality Checks ===');
    
    const lintResult = await this.runCommand('npm run lint', 'ESLint Check');
    this.results.push(lintResult);
  }

  async runBuildTest(): Promise<void> {
    console.log('\n=== 🏗️  Build Test ===');
    
    const buildResult = await this.runCommand('npm run build', 'Production Build');
    this.results.push(buildResult);
  }

  generateReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Duration: ${Math.round(totalDuration / 1000)}s`);
    console.log('='.repeat(60));

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  • ${r.suite}`);
          if (r.error) {
            console.log(`    Error: ${r.error.split('\n')[0]}`);
          }
        });
    }

    console.log('\n✅ PASSED TESTS:');
    this.results
      .filter(r => r.passed)
      .forEach(r => {
        console.log(`  • ${r.suite} (${r.duration}ms)`);
      });

    // Critical tests that must pass
    const criticalTests = [
      'Invoice Service Tests',
      'Accounting Service Tests',
      'Subscription Service Tests',
      'Application Type Check'
    ];

    const criticalFailures = this.results.filter(r => 
      !r.passed && criticalTests.includes(r.suite)
    );

    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL TEST FAILURES DETECTED!');
      console.log('The following tests are essential for financial data integrity:');
      criticalFailures.forEach(r => console.log(`  • ${r.suite}`));
      console.log('\n❌ APPLICATION NOT READY FOR PRODUCTION DEPLOYMENT');
      process.exit(1);
    } else if (failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! APPLICATION IS PRODUCTION READY! 🎉');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some non-critical tests failed. Review before deployment.');
      process.exit(1);
    }
  }

  async run(): Promise<void> {
    try {
      await this.runTypeChecking();
      await this.runLinting();
      await this.runUnitTests();
      await this.runIntegrationTests();
      await this.runBuildTest();
      await this.runE2ETests();
      await this.runStripeTests();
    } catch (error) {
      console.error('Test runner encountered an error:', error);
    } finally {
      this.generateReport();
    }
  }
}

// Run the comprehensive test suite
const runner = new TestRunner();
runner.run().catch(console.error);