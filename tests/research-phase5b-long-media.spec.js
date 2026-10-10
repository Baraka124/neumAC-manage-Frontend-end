const { test, expect } = require('@playwright/test');
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)]
  .map(match => path.join(root, match[1])).filter(fs.existsSync)
  .map(file => fs.readFileSync(file, 'utf8')).join('\n');

for (const alignment of ['is-copy-left', 'is-copy-right']) {
  test('long image-backed Highlight keeps readable content, media and connected records: ' + alignment, async ({page}) => {
    const article = await page.evaluate(({source,alignment}) => {
      const doc = new DOMParser().parseFromString(source, 'text/html');
      const node = [...doc.querySelectorAll('template')]
        .map(t => t.content.querySelector('article.nrd-v27-highlight')).find(Boolean);
      if (!node) throw Error('Highlight reader source template missing');
      const fragment = node.cloneNode(true);
      fragment.classList.remove('has-fallback','is-copy-left','is-copy-right');
      fragment.classList.add(alignment);
      fragment.querySelector('.nrd-v26-highlight-fallback')?.remove();
      const media = fragment.querySelector('.nrd-v23-highlight-media');
      if (!media) throw Error('Highlight media region missing');
      const image = 'data:image/svg+xml,'+encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><rect width="1200" height="675" fill="#1e5263"/><circle cx="910" cy="280" r="190" fill="#458d91"/></svg>'
      );
      media.innerHTML = '<img class="is-primary" alt="Research demonstration" src="'+image+'"><img alt="Research context" src="'+image+'">';
      fragment.querySelector('h1').textContent =
        'Clinical innovation and longitudinal research across pulmonary medicine';
      const body = fragment.querySelector('.nrd-v23-highlight-copy p');
      if (!body) throw Error('Highlight body paragraph missing');
      body.textContent = ('Longitudinal clinical programmes require reliable data, scientific context and documented outcomes. ').repeat(85);
      return fragment.outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'Research');
    },{source:html,alignment});

    for (const [width,height] of [[1366,768],[800,450],[640,720],[390,600]]) {
      await page.setViewportSize({width,height});
      await page.setContent('<style>'+css+'</style><div id="app"><section class="nrd-drawer nrd-v23 nrd-v27 nrd--highlight">'+
        '<header class="nrd-v27-readingbar">Research Library</header><div class="nrd-v23-scroll nrd-v27-scroll">'+article+
        '<section class="nrd-v28-connections"><header><span>Institutional connections</span></header></section>'+
        '</div></section></div>');
      await page.locator('.nrd-v23-highlight-media img.is-primary').evaluate(img => img.decode());
      const result = await page.evaluate(() => {
        const stage = document.querySelector('.nrd-v27-highlight');
        const media = stage.querySelector('.nrd-v23-highlight-media');
        const copy = stage.querySelector('.nrd-v23-highlight-copy');
        const body = copy.querySelector('p');
        const scroller = document.querySelector('.nrd-v27-scroll');
        const bounds = el => {const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom}};
        return {
          stage:bounds(stage),media:bounds(media),copy:bounds(copy),
          columns:getComputedStyle(stage).gridTemplateColumns,
          bodyOverflow:body.scrollWidth-body.clientWidth,
          stageOverflow:stage.scrollWidth-stage.clientWidth,
          documentOverflow:document.documentElement.scrollWidth-innerWidth,
          scrollerOverflow:getComputedStyle(scroller).overflowY,
          scrollerNeedsScroll:scroller.scrollHeight>scroller.clientHeight+5
        };
      });
      console.log('LONG IMAGE HIGHLIGHT',alignment,width,height,JSON.stringify(result));
      expect(result.documentOverflow,'document width').toBeLessThanOrEqual(1);
      expect(result.stageOverflow,'stage horizontal overflow').toBeLessThanOrEqual(1);
      expect(result.bodyOverflow,'body text must wrap').toBeLessThanOrEqual(1);
      expect(result.copy.left,'copy inside stage').toBeGreaterThanOrEqual(result.stage.left-1);
      expect(result.copy.right,'copy inside stage').toBeLessThanOrEqual(result.stage.right+1);
      expect(result.copy.bottom,'long text increases stage height').toBeLessThanOrEqual(result.stage.bottom+1);
      expect(result.media.left,'media inside stage').toBeGreaterThanOrEqual(result.stage.left-1);
      expect(result.media.right,'media inside stage').toBeLessThanOrEqual(result.stage.right+1);
      expect(result.scrollerOverflow).toMatch(/auto|scroll/);
      expect(result.scrollerNeedsScroll,'long record remains scrollable').toBe(true);
      if (width<=640) expect(result.columns.trim().split(/\s+/).length).toBe(1);
      await page.locator('.nrd-v28-connections').scrollIntoViewIfNeeded();
      await expect(page.locator('.nrd-v28-connections')).toBeVisible();
    }
  });
}
