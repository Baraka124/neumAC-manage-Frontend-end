const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>path.join(root,m[1])).filter(fs.existsSync).map(f=>fs.readFileSync(f,'utf8')).join('\n');
for(const kind of ['review','command','set'])test(`${kind} keeps its actions reachable on short screens`,async({page})=>{
 const fragment=await page.evaluate(({html,kind})=>{const doc=new DOMParser().parseFromString(html,'text/html');const e=doc.querySelector({review:'.news-v27-publish-review',command:'.news-v28-command-layer',set:'.news-v28-set-layer'}[kind]);e.querySelectorAll('details').forEach(d=>d.open=true);if(kind==='command'){const r=e.querySelector('.news-v28-command-results');r.innerHTML=Array.from({length:25},(_,i)=>`<button><span>Research record ${i}</span><small>Publication</small></button>`).join('')}return e.outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'Research publication with a long descriptive title')},{html,kind});
 for(const [width,height] of [[1366,768],[800,450],[390,600]]){
  await page.setViewportSize({width,height});
  const content=kind==='review'?`<div id="app"><div class="news-v24-studio-overlay news-v27-editor-overlay"><section class="news-v24-studio news-v27-editor">${fragment}</section></div></div>`:fragment;
  await page.setContent(`<style>${css}</style>${content}`);
  const panel=page.locator(kind==='review'?'.news-v27-publish-review>section':kind==='command'?'.news-v28-command':'.news-v28-set-layer>section');
  const b=await panel.boundingBox();expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(height+1);
  const target=kind==='command'?page.locator('.news-v28-command-results button').last():panel.locator('footer button').last();
  await target.scrollIntoViewIfNeeded();await target.click({timeout:2000});
 }
});
test('Research dialogs and Library surfaces cover the shell header',async({page})=>{
 const surfaces=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return ['researchLineModal.show','clinicalTrialModal.show','innovationProjectModal.show','trialDetailModal.show && trialDetailModal.trial','newsModal.show'].map(v=>[...d.querySelectorAll('[v-if]')].find(e=>e.getAttribute('v-if')===v).outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'Research'))},html);
 surfaces.push(await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');const t=[...d.querySelectorAll('template')].find(t=>t.content.querySelector('.nrd-v27')).content;return t.querySelector('.nrd-backdrop--v23').outerHTML+t.querySelector('.nrd-v27').outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'Research')},html));
 await page.setViewportSize({width:1366,height:768});
 for(const surface of surfaces){
  await page.setContent(`<style>${css}</style><div id="app"><div class="app-layout"><main class="main-content"><header class="top-navbar shell2"><h1>Research</h1></header><div class="content-area"><div class="research-hub"><header class="module-header">Research</header>${surface.includes('newsModal.show')?surface:''}</div></div></main></div>${surface.includes('newsModal.show')?'':surface}</div>`);
  await page.waitForTimeout(200);
  const layer=page.locator('.modal-overlay,.news-v27-editor-overlay,.nrd-backdrop--v23').first();
  expect(await layer.evaluate(e=>e.contains(document.elementFromPoint(innerWidth/2,25)) || !!document.elementFromPoint(innerWidth/2,25)?.closest('.nrd-v27')),'Dialog backdrop must cover shell header').toBe(true);
 }
});
