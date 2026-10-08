const { test, expect } = require('@playwright/test');
const fs = require('fs');

// index.html loads Vue from a CDN. To keep this smoke test hermetic and fast
// (independent of CDN uptime and of any backend), we serve a pinned local copy
// of the same Vue build, stub API calls to an empty success, and swallow the
// cosmetic CDN assets (icon font, web fonts, xlsx). What remains under test is
// the real payload: the ~17 bundled scripts load, app.js runs, and Vue mounts
// the shell into #app WITHOUT any uncaught error. A syntax slip in app.js —
// which would white-screen the whole app in production — fails here instead.
const VUE = fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8');

test('app boots and Vue mounts without a fatal error', async ({ page }) => {
  const fatal = [];
  page.on('pageerror', (e) => fatal.push(String(e)));

  await page.route(/unpkg\.com\/vue/, (r) =>
    r.fulfill({ status: 200, contentType: 'application/javascript', body: VUE })
  );
  await page.route(/\/api\/|api\.neumact\.org/, (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: '{"data":[]}' })
  );
  await page.route(/cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com/, (r) =>
    r.fulfill({ status: 200, contentType: 'text/css', body: '' })
  );

  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });

  // Once Vue mounts, #app is no longer empty (login gate / shell renders).
  await expect(page.locator('#app')).not.toBeEmpty({ timeout: 15000 });

  expect(fatal, 'Uncaught JS errors during boot:\n' + fatal.join('\n')).toEqual([]);
});
