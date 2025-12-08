const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

async function runLighthouseAudit(url, outputPath) {
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless', '--disable-gpu']});
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      }
    }
  };
  
  const runnerResult = await lighthouse(url, options);
  
  // Save the result
  const reportJson = runnerResult.report;
  fs.writeFileSync(outputPath, reportJson);
  
  await chrome.kill();
  
  // Parse and return key metrics
  const report = JSON.parse(reportJson);
  return {
    performance: report.categories.performance.score * 100,
    fcp: report.audits['first-contentful-paint'].displayValue,
    lcp: report.audits['largest-contentful-paint'].displayValue,
    tbt: report.audits['total-blocking-time'].displayValue,
    cls: report.audits['cumulative-layout-shift'].displayValue,
    speedIndex: report.audits['speed-index'].displayValue
  };
}

async function main() {
  try {
    console.log('🔍 Running performance audit on Dashboard...');
    const dashboardMetrics = await runLighthouseAudit(
      'http://localhost:3000',
      'lighthouse-dashboard.json'
    );
    
    console.log('\n📊 Dashboard Performance Results:');
    console.log(`Performance Score: ${dashboardMetrics.performance}/100`);
    console.log(`First Contentful Paint: ${dashboardMetrics.fcp}`);
    console.log(`Largest Contentful Paint: ${dashboardMetrics.lcp}`);
    console.log(`Total Blocking Time: ${dashboardMetrics.tbt}`);
    console.log(`Cumulative Layout Shift: ${dashboardMetrics.cls}`);
    console.log(`Speed Index: ${dashboardMetrics.speedIndex}`);
    
    console.log('\n🔍 Running performance audit on Invoicing...');
    const invoicingMetrics = await runLighthouseAudit(
      'http://localhost:3000/#/invoicing',
      'lighthouse-invoicing.json'
    );
    
    console.log('\n📊 Invoicing Performance Results:');
    console.log(`Performance Score: ${invoicingMetrics.performance}/100`);
    console.log(`First Contentful Paint: ${invoicingMetrics.fcp}`);
    console.log(`Largest Contentful Paint: ${invoicingMetrics.lcp}`);
    console.log(`Total Blocking Time: ${invoicingMetrics.tbt}`);
    console.log(`Cumulative Layout Shift: ${invoicingMetrics.cls}`);
    console.log(`Speed Index: ${invoicingMetrics.speedIndex}`);
    
    // Performance recommendations
    console.log('\n🚀 Performance Analysis Summary:');
    const avgScore = (dashboardMetrics.performance + invoicingMetrics.performance) / 2;
    
    if (avgScore >= 90) {
      console.log('✅ Excellent performance! Application is well-optimized.');
    } else if (avgScore >= 70) {
      console.log('⚠️  Good performance, but room for improvement.');
    } else {
      console.log('❌ Performance needs optimization.');
    }
    
  } catch (error) {
    console.error('❌ Error running performance audit:', error.message);
  }
}

if (require.main === module) {
  main();
}