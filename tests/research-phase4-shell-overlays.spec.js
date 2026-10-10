// Phase 4: full-shell responsive overlay regression, using real repository
// markup and linked styles. These tests intentionally do not mock Vue events
// or claim authenticated workflow coverage.
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const stylesheets = [...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)]
  .map(match => path.join(root, match[1]))
  .filter(fs.existsSync);
const css = stylesheets.map(file => fs.readFileSync(file, 'utf8')).join('\n');
const expressions = [
  'researchLineModal.show',
  'clinicalTrialModal.show',
  'innovationProjectModal.show',
  'trialDetailModal.show && trialDetailModal.trial',
  'newsModal.show'
];
const title = 'Research record with an extended clinical and scientific title';

function extract(vif) {
  // Parse the real template rather than recreating component HTML.
  // Missing selectors should fail the test instead of silently skipping it.
  const source = new DOMParser().parseFromString(html, 'text/html');
  const element = [...source.querySelectorAll('[v-if]')]
    .find(candidate => candidate.getAttribute('v-if') === vif);
  if (!element) throw new Error('Missing overlay: ' + vif);
  return element.outerHTML.replace(/\{\{[\s\S]*?\}\}/g, title);
}

test('Research and Library dialogs stay above the shell at phone and short-laptop sizes', async ({ page }) => {
  for (const [width, height] of [[390, 600], [640, 720], [800, 450], [1366, 768]]) {
    await page.setViewportSize({ width, height });
    for (const expression of expressions) {
      const surface = await page.evaluate(extract.toString().startsWith('function') ?
        ({ html, expression, title }) => {
          const source = new DOMParser().parseFromString(html, 'text/html');
          const element = [...source.querySelectorAll('[v-if]')]
            .find(candidate => candidate.getAttribute('v-if') === expression);
          if (!element) throw new Error('Missing overlay: ' + expression);
          return element.outerHTML.replace(/\{\{[\s\S]*?\}\}/g, title);
        } : null, { html, expression, title });
      await page.setContent(`<style>${css}</style><div id="app"><div class="app-layout"><main class="main-content"><header class="top-navbar shell2">neumDESK</header><div class="content-area"><div class="research-hub"><header class="module-header">Research</header></div><div class="news-view">Library</div></div></main></div>${surface}</div>`);
      const overlay = page.locator('.modal-overlay,.news-v27-editor-overlay').first();
      await expect(overlay, expression).toBeVisible();
      const hit = await page.evaluate(() => {
        const el = document.elementFromPoint(innerWidth / 2, 24);
        return !!el?.closest('.modal-overlay,.news-v27-editor-overlay');
      });
      expect(hit, `${expression} at ${width}x${height} must cover the shell header`).toBe(true);
    }
  }
});
