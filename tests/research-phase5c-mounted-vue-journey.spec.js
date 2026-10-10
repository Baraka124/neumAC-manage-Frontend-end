// Phase 5C — mounted Vue integration; synthetic publications, no real credentials/API.
const {test, expect} = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const VUE = fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'), 'utf8');

const fixtures = [
  {id:'phase5c-a',title:'Phase 5C Fixture Origin A',post_type:'publication',status:'published',
    is_public:true,body:'Nonclinical research integration fixture A.',
    research_line_id:'phase5c-line',published_at:'2026-10-01'},
  {id:'phase5c-b',title:'Phase 5C Fixture Connected B',post_type:'publication',status:'published',
    is_public:true,body:'Nonclinical research integration fixture B.',
    research_line_id:'phase5c-line',published_at:'2026-10-02'}
];

async function mountSyntheticLibrary(page, width) {
  await page.setViewportSize({width,height:width<=640?720:900});
  await page.route('**/*', route => {
    const url=new URL(route.request().url());
    if (url.href.includes('vue.global.prod.js')) {
      return route.fulfill({body:VUE,contentType:'application/javascript'});
    }
    if (url.pathname.includes('/api/')) return route.fulfill({json:{data:[]}});
    if (url.origin==='http://localhost:8080') {
      const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        const ext=path.extname(file);
        const types={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.html':'text/html',
          '.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
        return route.fulfill({body:fs.readFileSync(file),contentType:types[ext]||'application/octet-stream'});
      }
    }
    return route.fulfill({status:404,body:''});
  });
  await page.goto('http://localhost:8080/index.html');
  await page.waitForFunction(()=>Boolean(document.querySelector('#app')?.__vue_app__));
  await page.evaluate(data=>{
    const app=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;
    app.newsPosts=data;
    app.newsLoaded=true;
    app.newsLoading=false;
    app.newsLensMode='browse';
    app.newsFilters.type='';
    app.newsFilters.status='';
    app.newsFilters.scope='';
    app.newsFilters.search='';
    app.newsFilters.line='';
    app.newsFilters.author='';
    app.newsFilters.year='';
    app.currentView='news';
  },fixtures);
  await expect(page.locator('.news-view .knowledge-card')).toHaveCount(2);
}

async function selectedId(page) {
  return page.evaluate(()=>document.querySelector('#app').__vue_app__._container._vnode.component.proxy.newsDrawer.post?.id??null);
}

for (const width of [390,1366]) {
  test('mounted Library keeps original record and keyboard focus across related navigation at '+width,async({page})=>{
    await mountSyntheticLibrary(page,width);
    const origin=page.locator('.knowledge-card[data-news-record-id="phase5c-a"]');
    await origin.focus();
    await origin.press('Enter');
    await expect(page.locator('.nrd-drawer')).toBeVisible();
    expect(await selectedId(page)).toBe('phase5c-a');

    // The related item is rendered by the actual Vue reader, not a cloned template.
    await page.locator('.nrd-v23-related-item').filter({hasText:'Phase 5C Fixture Connected B'}).click();
    expect(await selectedId(page)).toBe('phase5c-b');

    await page.locator('.nrd-v27-back').click();
    await expect(page.locator('.nrd-drawer')).toHaveCount(0);
    await expect(origin).toBeFocused();
    await expect(origin).toHaveClass(/is-return-focus/);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  });
}

test('mounted reader returns to accessible Library control if origin is filtered away',async({page})=>{
  await mountSyntheticLibrary(page,1366);
  const origin=page.locator('.knowledge-card[data-news-record-id="phase5c-a"]');
  await origin.click();
  await page.locator('.nrd-v23-related-item').filter({hasText:'Phase 5C Fixture Connected B'}).click();
  expect(await selectedId(page)).toBe('phase5c-b');
  await page.evaluate(()=>{
    const app=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;
    app.newsFilters.search='Connected B';
  });
  await expect(origin).toHaveCount(0);
  await page.locator('.nrd-v27-back').click();
  await expect(page.locator('.news-v25-search input')).toBeFocused();
  await expect(page.locator('.news-v25-search input')).toHaveValue('Connected B');
  expect(await selectedId(page)).toBe(null);
});

// These tests exercise actual mounted Vue, card/button clicks and focus.
// They intentionally mock authentication/data; real staging auth, role and API
// persistence are separate Phase 4C/5C release gates.
