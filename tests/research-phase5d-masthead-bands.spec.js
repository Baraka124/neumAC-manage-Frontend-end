const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const links=[...html.matchAll(/<link[^>]+href="([^"?]+\.css)(?:\?[^" ]*)?"/g)].map(m=>path.join(root,m[1])).filter(fs.existsSync);
const css=links.map(p=>fs.readFileSync(p,'utf8')).join('\n');
test('Research and Library mastheads read as restrained institutional bands',async({page})=>{
 const fixtures=await page.evaluate(src=>{
   const doc=new DOMParser().parseFromString(src,'text/html');
   return ['.rv31-masthead','.news-v25-masthead'].map(selector=>doc.querySelector(selector).outerHTML.replace(/\{\{[\s\S]*?\}\}/g,'12'));
 },html);
 for(const width of [390,640,800,1366,1440,2048]){
   await page.setViewportSize({width,height:width===800?450:900});
   for(const [i,fixture] of fixtures.entries()){
     const parent=i===0?'research-hub':'news-view';
     await page.setContent(`<style>${css}</style><style>html,body{margin:0;overflow:visible!important}#app .content-area{width:100%;box-sizing:border-box;padding:16px!important}</style><div id="app"><div class="content-area"><section class="${parent}">${fixture}</section></div></div>`);
     const header=page.locator('.module-header');
     const computed=await header.evaluate(el=>{
       const cs=getComputedStyle(el);const bounds=el.getBoundingClientRect();
       return {radius:parseFloat(cs.borderTopLeftRadius),bg:cs.backgroundColor,border:parseFloat(cs.borderBottomWidth),
         overflow:document.documentElement.scrollWidth-innerWidth,
         actionEscape:[...el.querySelectorAll('button')].some(x=>{const r=x.getBoundingClientRect();return r.left<bounds.left-1||r.right>bounds.right+1})};
     });
     expect(computed.radius).toBeLessThanOrEqual(5);
     expect(computed.bg).toBe('rgb(16, 45, 64)');
     expect(computed.border).toBeGreaterThanOrEqual(2);
     expect(computed.overflow).toBeLessThanOrEqual(1);
     expect(computed.actionEscape).toBe(false);
   }
 }
});
