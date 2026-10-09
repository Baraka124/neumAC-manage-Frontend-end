const {test,expect}=require('@playwright/test');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const styles=[...index.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)]
 .map(m=>path.join(root,m[1])).filter(f=>fs.existsSync(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
test('Both portfolio preview headers retain readable titles and reachable controls',async({page})=>{
 const headers=await page.evaluate(html=>{
  const doc=new DOMParser().parseFromString(html,'text/html');
  return [...doc.querySelectorAll('.research-preview-toolbar')].map(el=>{
   el.querySelectorAll('[v-if]').forEach(e=>{if(e.tagName==='DIV')e.remove()});
   return el.outerHTML.replace(/\{\{[^}]+\}\}/g,'18');
  });
 },index);
 expect(headers).toHaveLength(2);
 for(const width of [1440,1366,900,640,390]){
  await page.setViewportSize({width,height:950});
  for(const header of headers){
   await page.setContent(`<style>${styles}</style><style>html,body{height:auto!important;overflow:visible!important;margin:0}#app{height:auto!important} .preview-test{max-width:1180px;margin:28px;background:white}</style><div id="app"><div class="research-hub"><div class="preview-test">${header}</div></div></div>`);
   const metrics=await page.locator('.research-preview-toolbar').evaluate(el=>{
    const title=el.firstElementChild.getBoundingClientRect(),select=el.querySelector('select').getBoundingClientRect();
    const children=[...el.children].map(e=>e.getBoundingClientRect());
    const overlaps=children.some((a,i)=>children.slice(i+1).some(b=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1));
    return {titleWidth:title.width,titleHeight:title.height,selectWidth:select.width,overlaps,overflow:document.documentElement.scrollWidth>innerWidth};
   });
   expect(metrics.overlaps).toBe(false);
   expect(metrics.overflow).toBe(false);
   expect(metrics.titleWidth).toBeGreaterThan(250);
   expect(metrics.titleHeight).toBeLessThan(110);
   if(width>480)expect(metrics.selectWidth).toBeLessThanOrEqual(161);
   await expect(page.getByRole('button',{name:'Close',exact:true})).toBeInViewport();
  }
 }
});
