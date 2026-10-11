const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','research-persistent-navigation.css'),'utf8');
test('Research navigation exists outside individual nested page branches',()=>{
 const pos=html.indexOf('class="rv31-nav rv31-nav--persistent rv31-nav--workspace"');
 expect(pos).toBeGreaterThan(-1);
 expect(pos).toBeLessThan(html.indexOf("researchHubPage === 'overview'"));
 for(const name of ['allstudies','allprojects','analytics'])expect(html.slice(pos,pos+2100)).toContain("openResearchPage('"+name+"')");
 expect(html).toContain('research-persistent-navigation.css');
});
test('nested research section tabs remain reachable without document overflow',async({page})=>{
 const fragment=await page.evaluate(source=>new DOMParser().parseFromString(source,'text/html').querySelector('.rv31-nav--persistent').outerHTML,html);
 for(const width of [390,640,800,1366,1440,2048]){
  await page.setViewportSize({width,height:800});
  await page.setContent('<style>'+css+'</style><div id="app"><section class="research-hub">'+fragment+'</section></div>');
  const v=await page.evaluate(()=>{const n=document.querySelector('nav');return {overflow:document.documentElement.scrollWidth-innerWidth,items:n.querySelectorAll('button').length,scrollWidth:n.scrollWidth,clientWidth:n.clientWidth}});
  expect(v.items).toBe(4);expect(v.overflow).toBeLessThanOrEqual(1);
 }
});
