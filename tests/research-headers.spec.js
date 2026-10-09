const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>path.join(root,m[1])).filter(fs.existsSync).map(f=>fs.readFileSync(f,'utf8')).join('\n');
test('Research header family wraps long titles, notices and actions',async({page})=>{
 const headers=await page.evaluate(html=>[...new DOMParser().parseFromString(html,'text/html').querySelectorAll('.rv31-line-hero,.rv32-collection-hero,.rv32-record-hero')].map(e=>{
  e.querySelector('h1').textContent='Clinical research programme for respiratory disease and personalised patient care';
  e.querySelectorAll('button').forEach(b=>{if(!b.className)b.textContent='Public on website'});
  return e.outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'Research');
 }),html);
 expect(headers).toHaveLength(6);
 for(const width of [390,640,1366,1440,2048]){
  await page.setViewportSize({width,height:1000});
  for(const header of headers){
   await page.setContent(`<style>${css}</style><style>html,body{height:auto!important;overflow:visible!important;margin:0}#app .content-area{margin:0!important;padding:16px!important;width:100%;box-sizing:border-box} .research-hub{min-width:0}</style><div id="app"><div class="content-area"><div class="research-hub">${header}</div></div></div>`);
   const m=await page.locator('.module-header').evaluate(e=>{const r=e.getBoundingClientRect();return {bg:getComputedStyle(e).backgroundColor,title:getComputedStyle(e.querySelector('h1')).color,overflow:document.documentElement.scrollWidth>innerWidth,escaped:[...e.querySelectorAll('button,h1,.ac-notice')].some(x=>{const a=x.getBoundingClientRect();return a.right>r.right+1||a.left<r.left-1})}});
   if(header.includes('ac-notice'))await expect(page.locator('.ac-notice')).toHaveCSS('color','rgb(23, 52, 73)');
   expect(m.bg).toBe('rgb(16, 45, 64)');expect(m.title).toBe('rgb(243, 248, 250)');expect(m.overflow).toBe(false);expect(m.escaped).toBe(false);
  }
 }
});

test('Library toolbar preserves readable search and accessible overflow at narrow widths',async({page})=>{
 const fragment=await page.evaluate(html=>{const doc=new DOMParser().parseFromString(html,'text/html');return ['.news-v25-masthead','.news-v25-commandbar','.news-v28-lensbar','.news-v25-filter-panel'].map(s=>doc.querySelector(s).outerHTML).join('').replace(/\{\{[\s\S]*?\}\}/g,'12')},html);
 for(const width of [390,640,1366,1440,2048]){
  await page.setViewportSize({width,height:1000});
  await page.setContent(`<style>${css}</style><style>html,body{height:auto!important;overflow:visible!important;margin:0}.news-view{width:100%;box-sizing:border-box}</style><div id="app"><div class="content-area" style="margin:0;padding:0"><div class="news-view news-studio news-v23 nd-l183">${fragment}</div></div></div>`);
  await expect(page.locator('.news-v25-search input')).toHaveCSS('font-size','16px');
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,search:document.querySelector('.news-v25-search').getBoundingClientRect().width}));
  expect(layout.overflow).toBe(false);expect(layout.search).toBeGreaterThan(180);
 }
});
