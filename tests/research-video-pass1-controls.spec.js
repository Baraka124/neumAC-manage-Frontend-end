const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>path.join(root,m[1])).filter(fs.existsSync).map(p=>fs.readFileSync(p,'utf8')).join('\n');
test('study and innovation search remain usable beside bounded selectors',async({page})=>{
  const htmlParts=await page.evaluate(src=>{const d=new DOMParser().parseFromString(src,'text/html');return [...d.querySelectorAll('.research-hub .rv32-control-rail')].map(x=>x.outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'12'))},html);
  expect(htmlParts).toHaveLength(2);
  for(const width of [390,640,800,1180,1366,1440,2048]){
    await page.setViewportSize({width,height:width===800?450:900});
    for(const part of htmlParts){
      await page.setContent(`<style>${css}</style><style>html,body{margin:0;overflow:visible!important}.research-hub{width:100%;box-sizing:border-box;padding:12px}.rv32-page{width:100%}</style><div id="app"><div class="content-area"><section class="research-hub"><div class="rv32-page">${part}</div></section></div></div>`);
      const m=await page.locator('.rv32-control-rail').evaluate(rail=>{
        const search=rail.querySelector('.rv32-search').getBoundingClientRect();
        return {searchWidth:search.width,searchHeight:search.height,overflow:document.documentElement.scrollWidth-innerWidth,
          overlaps:[...rail.querySelectorAll('select')].some(e=>{const a=e.getBoundingClientRect();return a.width<100||!(a.left>=search.right-1||a.top>=search.bottom-1)})};
      });
      expect(m.searchWidth).toBeGreaterThan(220);
      expect(m.searchHeight).toBeGreaterThanOrEqual(43);
      expect(m.overflow).toBeLessThanOrEqual(1);
      expect(m.overlaps).toBe(false);
    }
  }
});
test('Library toolbar preserves tab navigation and visible search without page overflow',async({page})=>{
 const fragment=await page.evaluate(src=>{const d=new DOMParser().parseFromString(src,'text/html');return d.querySelector('.news-v25-commandbar').outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'12')},html);
 for(const width of [390,640,800,1180,1366,1440,2048]){
  await page.setViewportSize({width,height:width===800?450:900});
  await page.setContent(`<style>${css}</style><style>html,body{margin:0;overflow:visible!important}.news-view{width:100%;box-sizing:border-box}</style><div id="app"><div class="content-area"><div class="news-view">${fragment}</div></div></div>`);
  const m=await page.evaluate(()=>{const s=document.querySelector('.news-v25-search'),t=document.querySelector('.news-v25-tabs'),c=document.querySelector('.news-v25-commandbar');return {searchWidth:s.getBoundingClientRect().width,searchDisplay:getComputedStyle(s).display,tabWidth:t.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth-innerWidth,barWidth:c.getBoundingClientRect().width}});
  expect(m.searchDisplay).not.toBe('none');expect(m.searchWidth).toBeGreaterThan(140);expect(m.tabWidth).toBeGreaterThan(140);expect(m.overflow).toBeLessThanOrEqual(1);
 }
});
