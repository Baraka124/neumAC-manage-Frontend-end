const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const visibilityCss = fs.readFileSync(path.join(root, 'research-visibility.css'), 'utf8');

// This is a scoped CSS-cascade regression, NOT authenticated Library E2E coverage.
// It protects existing operational nav readability while Phase 5C captures real
// computed styles, page screenshots and task-based acceptance separately.
for (const width of [390, 640, 1366, 1440, 2048]) {
  test('Library operational navigation remains readable at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: width <= 640 ? 720 : 900 });
    await page.setContent(`
      <style>${visibilityCss}</style>
      <div id="app">
        <section class="news-view">
          <nav class="news-v25-tabs">
            <button type="button"><span>All records</span></button>
            <button type="button"><span>Publications</span></button>
          </nav>
          <div class="news-v28-lensbar">
            <span class="news-v28-lens-label">View</span>
            <button type="button"><span>Research outputs</span></button>
          </div>
          <span class="news-v25-shown">12 records</span>
          <span class="news-v25-index">01 / 12</span>
        </section>
      </div>`);
    for (const selector of [
      '.news-v25-tabs button span',
      '.news-v28-lensbar button span',
      '.news-v28-lens-label',
      '.news-v25-shown',
      '.news-v25-index'
    ]) {
      const fontSize = await page.locator(selector).first().evaluate(el => parseFloat(getComputedStyle(el).fontSize));
      expect(fontSize, selector + ' must retain existing 14px operational scale').toBeGreaterThanOrEqual(14);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, 'operational navigation must not create document-wide horizontal overflow')
      .toBeLessThanOrEqual(1);
  });
}
