const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>path.join(root,m[1])).filter(fs.existsSync).map(f=>fs.readFileSync(f,'utf8')).join('\n');
test('Research search results remain clickable beyond the navbar',async({page})=>{
 for(const moduleClass of ['research-hub','news-view']) for(const width of [1440,1000]){
 await page.setViewportSize({width,height:900});
 await page.setContent(`<style>${css}</style><div id="app"><div class="app-layout"><main class="main-content"><header class="top-navbar shell2 top-navbar--research-context"><div class="navbar-left"><h1 class="navbar-title">Research &amp; Innovation</h1></div><div class="navbar-right"><div class="search-container nd-l008"><div class="search-box"><input class="search-input" value="Pedro"></div><div class="search-results-dropdown"><button class="search-result-item" style="height:100px;width:100%">Pedro · Research result</button></div></div></div></header><div class="content-area"><div class="${moduleClass}"><header class="module-header" style="height:200px;background:#102d40">Research</header></div></div></main></div></div>`);
 await page.waitForTimeout(200);
 const result=page.locator('.search-result-item');
 const hit=await result.evaluate(el=>{const r=el.getBoundingClientRect();const x=r.x+r.width/2,y=r.bottom-10;return {reachable:el.contains(document.elementFromPoint(x,y)),belowHeader:y>document.querySelector('.top-navbar').getBoundingClientRect().bottom,overflow:getComputedStyle(document.querySelector('.top-navbar')).overflowY};});
 expect(hit.belowHeader).toBe(true);
 expect(hit.reachable,'Search dropdown must escape navbar clipping and remain above the module').toBe(true);
 expect(hit.overflow).toBe('visible');
 await result.click();
 }
});
