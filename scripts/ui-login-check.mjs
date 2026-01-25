import { chromium } from 'playwright';

async function run() {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  if (!email || !password) {
    console.error('TEST_EMAIL and TEST_PASSWORD must be provided');
    process.exit(2);
  }
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // capture console logs for debugging
  page.on('console', msg => console.log('PAGE_LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.toString()));
  // Log network requests/responses for debugging journal entries fetches
  page.on('request', req => {
    try {
      const url = req.url();
      if (url.includes('/rest/v1/journal_entries')) {
        console.log('NETWORK_REQUEST:', req.method(), url, req.postData() || '');
      }
    } catch (e) {}
  });
  page.on('response', async res => {
    try {
      const url = res.url();
      // Log any response from supabase domain to inspect payloads
      if (url.includes('supabase.co') || url.includes('/rest/v1/journal_entries')) {
        const status = res.status();
        const headers = {};
        try {
          for (const [k, v] of res.headers()) headers[k] = v;
        } catch (e) {}
        const text = await res.text().catch(() => '[no-text]');
        console.log('NETWORK_RESPONSE:', status, url, 'headers:', headers, 'bodySnippet:', text.substring(0, 2000));
      }
    } catch (e) {}
  });
  const url = process.env.APP_URL || 'http://localhost:5173';
  console.log('Opening', url);
  // Pre-seed cookie preferences to avoid rendering the cookie consent banner
  await page.addInitScript(() => {
    try {
      localStorage.setItem('casskai_cookie_preferences', JSON.stringify({ analytics: false, marketing: false, functional: true, timestamp: new Date().toISOString() }));
      document.cookie = 'casskai_cookie_consent=accepted; path=/; max-age=31536000';
    } catch (e) {
      // ignore
    }
  });

  await page.goto(url + '/login', { waitUntil: 'domcontentloaded' });
  // Allow client scripts to mount
  await page.waitForTimeout(1500);
  // Wait for login form
  await page.waitForSelector('#email-signin', { timeout: 45000 });
  await page.fill('#email-signin', email);
  await page.fill('#password-signin', password);
  // Dismiss cookie consent overlays if present
  await page.evaluate(() => {
    try {
      const banners = Array.from(document.querySelectorAll('[class*="CookieConsent"], .cookie-banner, .cookie-consent'));
      if (banners.length > 0) banners.forEach(b => b.remove());
      // Click any visible button whose text includes common accept words
      const buttons = Array.from(document.querySelectorAll('button'));
      for (const b of buttons) {
        const txt = (b.textContent || '').toLowerCase();
        if (txt.includes('accepter') || txt.includes('tout accepter') || txt.includes("j'accepte") || txt.includes('accept')) {
          try { b.click(); } catch (e) {}
        }
      }
    } catch (e) {}
  }).catch(() => {});
  await Promise.all([
    page.click('button:has-text("Se connecter")'),
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
  ]);
  // Wait for dashboard AI analysis to appear (mock text)
  const aiSelector = `text=Analyse synthétique (mode développement)`;
  const found = await page.waitForSelector(aiSelector, { timeout: 15000 }).then(() => true).catch(() => false);
  if (found) {
    console.log('AI analysis mock content found on dashboard');
  } else {
    console.warn('AI analysis mock not found; listing some page text for debugging');
    const body = await page.textContent('body');
    console.log('Body snapshot (first 1000 chars):', body ? body.substring(0, 1000) : '');
    await page.screenshot({ path: 'tmp/dashboard-error.png', fullPage: true }).catch(()=>{});
    console.log('Saved screenshot to tmp/dashboard-error.png');
  }
  // Try navigation to Journal Entries page to confirm entries visible
  await page.goto(url + '/accounting/journal-entries', { waitUntil: 'domcontentloaded' }).catch(() => {});
  // Ensure the entries tab is activated (navigation uses tabs and dropdowns)
  try {
    // Try to click the direct "Écritures" button (French label used in UI)
    await page.click('button:has-text("Écritures")', { timeout: 2000 }).catch(() => {});
    // Some UIs nest it inside a dropdown; attempt to open parent then click subitem
    await page.click('button:has-text("Opérations")', { timeout: 1000 }).catch(() => {});
    await page.click('button:has-text("Écritures")', { timeout: 2000 }).catch(() => {});
  } catch (e) {
    // ignore if navigation controls differ
  }
  // Inspect localStorage to find supabase session and try a direct fetch as the authenticated user
  try {
    const lsKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('LOCAL_STORAGE_KEYS:', lsKeys.join(', '));
    const sessionInfo = await page.evaluate(() => {
      for (const k of Object.keys(localStorage)) {
        try {
          const raw = localStorage.getItem(k);
          const v = JSON.parse(raw);
          if (v && (v.access_token || (v.currentSession && v.currentSession.access_token) || v.currentSession)) {
            return { key: k, value: v, raw };
          }
        } catch (e) {
          // fallback: return raw if it contains an access_token-like substring
          try {
            const raw = localStorage.getItem(k);
            if (typeof raw === 'string' && raw.includes('access_token')) return { key: k, value: null, raw };
          } catch (e) {}
        }
      }
      return null;
    });
    console.log('LOCAL_STORAGE_SESSION_ITEM:', sessionInfo ? sessionInfo.key : 'none');
    if (sessionInfo) {
      console.log('LOCAL_STORAGE_SESSION_VALUE:', sessionInfo.raw ? sessionInfo.raw.substring(0, 2000) : JSON.stringify(sessionInfo.value).substring(0,2000));
    }
    if (sessionInfo && (sessionInfo.value || sessionInfo.raw)) {
      let token = null;
      if (sessionInfo.value) token = sessionInfo.value.access_token || (sessionInfo.value.currentSession && sessionInfo.value.currentSession.access_token) || null;
      if (!token && sessionInfo.raw) {
        // try to extract access_token from raw string via regex
        const m = sessionInfo.raw.match(/access_token"?:\s*"([A-Za-z0-9-_\.\=]+)"/);
        if (m && m[1]) token = m[1];
      }
      console.log('EXTRACTED_TOKEN:', token ? (token.substring(0,20) + '...') : 'null');
      if (token) {
          try {
            // Attempt a Node-side fetch using the extracted token to bypass any page-level interception
            const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co');
            const nodeRes = await fetch(`${supabaseUrl}/rest/v1/journal_entries?select=id,entry_date,entry_number,description&company_id=eq.3321651c-1298-4611-8883-9cbf81c1227d&limit=50`, { headers: { Authorization: `Bearer ${token}`, apikey: process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '' } }).catch(e => ({ error: String(e) }));
            if (nodeRes && nodeRes.error) {
              console.log('NODE_DIRECT_FETCH_ERROR:', nodeRes.error);
            } else {
              const nodeJson = await nodeRes.json().catch(() => null);
              console.log('NODE_DIRECT_FETCH_RESULT:', { status: nodeRes.status, length: Array.isArray(nodeJson) ? nodeJson.length : null, sample: Array.isArray(nodeJson) ? nodeJson.slice(0,3) : nodeJson });
            }
          } catch (e) {
            console.log('NODE_DIRECT_FETCH_EXCEPTION:', String(e));
          }
        // perform a direct fetch to the REST endpoint from page context using the session token
        const companyId = (await page.evaluate(() => {
          try {
            const v = JSON.parse(localStorage.getItem('casskai_current_company'));
            return v?.id || null;
          } catch (e) { return null; }
        })) || '3321651c-1298-4611-8883-9cbf81c1227d';
        const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://smtdtgrymuzwvctattmx.supabase.co');
        const fetchResult = await page.evaluate(async (supabaseUrl, token, companyId) => {
          try {
            const url = `${supabaseUrl}/rest/v1/journal_entries?select=id,entry_date,entry_number,description&company_id=eq.${companyId}&limit=50`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json().catch(() => null);
            return { status: res.status, ok: res.ok, length: Array.isArray(json) ? json.length : null, sample: Array.isArray(json) ? json.slice(0,3) : json };
          } catch (e) { return { error: String(e) }; }
        }, supabaseUrl, token, companyId);
        console.log('DIRECT_FETCH_RESULT:', fetchResult);
      } else {
        console.log('DIRECT_FETCH_RESULT: no token extracted');
      }
    }
  } catch (e) {
    // ignore inspection errors
  }
  // Check for seed entry description text
  // Check for any table rows in the journal entries table
  const rowCount = await page.evaluate(() => {
    try {
      const rows = document.querySelectorAll('table tbody tr');
      return rows.length;
    } catch (e) {
      return 0;
    }
  });
  console.log('Journal entries table row count:', rowCount);
  await browser.close();
}

run().catch(err => { console.error(err); process.exit(1); });
