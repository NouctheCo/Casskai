import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const url = process.env.APP_URL || 'http://localhost:5173';
  console.log('Opening page', url);
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    // Allow some time for Vite client + app scripts to initialize and install dev shims
    await page.waitForTimeout(1500);
  } catch (err) {
    console.error('Failed to load app:', err);
    await browser.close();
    process.exit(2);
  }

  const result = await page.evaluate(async () => {
    try {
      const resp = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      const text = await resp.text();
      return { status: resp.status, ok: resp.ok, text };
    } catch (e) {
      return { error: String(e) };
    }
  });

  console.log('Dev AI route result:', result);
  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
