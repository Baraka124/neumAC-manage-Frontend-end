const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)]
  .map(m => path.join(root, m[1])).filter(fs.existsSync)
  .map(f => fs.readFileSync(f, 'utf8')).join('\n');

test('sparse Highlight reader keeps an editorial stage without oversized void or clipped phone column', async ({ page }) => {
  const article = await page.evaluate(source => {
    const doc = new DOMParser().parseFromString(source, 'text/html');
    const node = [...doc.querySelectorAll('template')]
      .map(t => t.content.querySelector('article.nrd-v27-highlight')).find(Boolean);
    if (!node) throw Error('Highlight reader template missing');
    const fragment = node.cloneNode(true);
    fragment.classList.add('has-fallback');
    fragment.querySelector('.nrd-v23-highlight-media')?.remove(); // no-photo case
    fragment.querySelector('.nrd-v23-highlight-copy h1').textContent = 'Thoracic surgery innovation';
    fragment.querySelector('.nrd-v23-highlight-copy p').textContent =
      'Clinical research improving decisions and patient outcomes.';
    return fragment.outerHTML.replace(/\{\{[\s\S]*?\}\}/g, 'Research');
  }, html);

  for (const [width, height] of [[1366, 768], [800, 450], [640, 720], [390, 600]]) {
    await page.setViewportSize({ width, height });
    await page.setContent(
      '<style>' + css + '</style><div id="app">' +
      '<section class="nrd-drawer nrd-v23 nrd-v27 nrd--highlight">' +
      '<header class="nrd-v27-readingbar">Research Library</header>' +
      '<div class="nrd-v23-scroll nrd-v27-scroll">' + article +
      '<section class="nrd-v28-connections"><header><span>Institutional connections</span><strong>8 related records</strong></header></section>' +
      '</div></section></div>'
    );
    const result = await page.evaluate(() => {
      const stage = document.querySelector('.nrd-v27-highlight');
      const scroller = document.querySelector('.nrd-v27-scroll');
      const connections = document.querySelector('.nrd-v28-connections');
      const rect = stage.getBoundingClientRect();
      const connectionRect = connections.getBoundingClientRect();
      return {
        height: rect.height, width: rect.width, stageScrollWidth:stage.scrollWidth,
        stageClientWidth:stage.clientWidth,
        columns:getComputedStyle(stage).gridTemplateColumns,
        stageMinHeight:getComputedStyle(stage).minHeight,
        scrollOverflow:getComputedStyle(scroller).overflowY,
        documentOverflow:document.documentElement.scrollWidth - innerWidth,
        connectionsOffset:connectionRect.top - rect.bottom,
      };
    });
    console.log('HIGHLIGHT GEOMETRY', width, height, JSON.stringify(result));
    expect(result.documentOverflow, 'No document overflow at ' + width).toBeLessThanOrEqual(1);
    expect(result.stageScrollWidth - result.stageClientWidth, 'No clipped stage at ' + width).toBeLessThanOrEqual(1);
    expect(result.scrollOverflow, 'Reader keeps independent scroll at ' + width).toMatch(/auto|scroll/);
    if (width <= 640) {
      expect(result.columns.trim().split(/\s+/).length, 'Single column on phone/small tablet').toBe(1);
    }
    if (width === 1366) {
      expect(result.height, 'Short highlight must not fill almost entire desktop viewport').toBeLessThanOrEqual(height * 0.78);
    }
    await page.locator('.nrd-v28-connections').scrollIntoViewIfNeeded();
    await expect(page.locator('.nrd-v28-connections')).toBeVisible();
  }
});
