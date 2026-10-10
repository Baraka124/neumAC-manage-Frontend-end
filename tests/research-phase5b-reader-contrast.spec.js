const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)]
  .map(match => path.join(root, match[1]))
  .filter(fs.existsSync)
  .map(file => fs.readFileSync(file, 'utf8'))
  .join('\n');

function contrast(foreground, background) {
  const channel = value => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = color => {
    const rgb = color.match(/[\d.]+/g).slice(0, 3).map(Number);
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

test('highlight reader keeps Institutional connections accessible and scrollable', async ({ page }) => {
  const section = await page.evaluate(source => {
    const parsed = new DOMParser().parseFromString(source, 'text/html');
    const original = [...parsed.querySelectorAll('template')]
      .map(element => element.content.querySelector('.nrd-v28-connections'))
      .find(Boolean);
    if (!original) throw new Error('Research Library connections markup missing');
    return original.outerHTML.replace(/\{\{[\s\S]*?\}\}/g, 'Clinical research');
  }, html);

  for (const [width, height] of [[1366, 768], [800, 450], [390, 600]]) {
    await page.setViewportSize({ width, height });
    await page.setContent(
      '<style>' + css + '</style>' +
      '<div id="app"><section class="nrd-drawer nrd-v23 nrd-v27 nrd--highlight">' +
      '<header class="nrd-v27-readingbar">Research Library</header>' +
      '<div class="nrd-v23-scroll nrd-v27-scroll">' +
      '<article class="nrd-v23-highlight nrd-v27-highlight has-fallback"><div class="nrd-v23-highlight-copy"><h1>Clinical research highlight</h1><p>A representative institutional research record.</p></div></article>' +
      section + '</div></section></div>'
    );
    const heading = page.locator('.nrd-v28-connections>header span').first();
    const count = page.locator('.nrd-v28-connections>header strong').first();
    await heading.scrollIntoViewIfNeeded();
    const result = await page.evaluate(() => {
      const heading = document.querySelector('.nrd-v28-connections>header span');
      const count = document.querySelector('.nrd-v28-connections>header strong');
      const reader = document.querySelector('.nrd-v27.nrd--highlight');
      const scroller = document.querySelector('.nrd-v27-scroll');
      return {
        foreground: getComputedStyle(heading).color,
        supporting: getComputedStyle(count).color,
        background: getComputedStyle(reader).backgroundColor,
        scrollTop: scroller.scrollTop,
        overflow: getComputedStyle(scroller).overflowY,
        documentOverflow: document.documentElement.scrollWidth - innerWidth,
      };
    });
    const titleRatio = contrast(result.foreground, result.background);
    const countRatio = contrast(result.supporting, result.background);
    console.log('Reader highlight', width, height, JSON.stringify(result), 'contrasts', titleRatio.toFixed(2), countRatio.toFixed(2));
    expect(titleRatio, 'connections heading contrast at ' + width).toBeGreaterThanOrEqual(4.5);
    expect(countRatio, 'related-record count contrast at ' + width).toBeGreaterThanOrEqual(4.5);
    expect(result.documentOverflow, 'no horizontal overflow at ' + width).toBeLessThanOrEqual(1);
    expect(result.overflow).toMatch(/auto|scroll/);
    await expect(heading).toBeVisible();
  }
});
