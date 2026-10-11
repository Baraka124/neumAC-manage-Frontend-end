const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const css=fs.readFileSync(path.join(__dirname,'..','research-persistent-navigation.css'),'utf8');
test('Research tabs and back strip stay in document flow during scrolling',async({page})=>{
 for(const width of [390,800,1366]){
  await page.setViewportSize({width,height:600});
  await page.setContent(`<style>#app .rv31-nav,#app .rv32-context-bar{position:sticky;top:0;z-index:24}</style><style>${css}</style><div id="app"><main class="research-hub"><nav class="rv31-nav rv31-nav--persistent"><button class="rv31-nav-item on">Clinical studies</button></nav><div class="rv32-context-bar">Research · Clinical evidence</div><section style="height:1500px">Study records</section></main></div>`);
  await page.evaluate(()=>window.scrollTo(0,0));
  const before=await page.locator('.rv32-context-bar').evaluate(e=>({position:getComputedStyle(e).position,top:e.getBoundingClientRect().top}));
  expect(before.position).toBe('static');
  await page.evaluate(()=>window.scrollTo(0,500));
  const after=await page.locator('.rv32-context-bar').evaluate(e=>({top:e.getBoundingClientRect().top,scrollY:window.scrollY}));
  expect(after.scrollY).toBeGreaterThanOrEqual(450);
  expect(after.top-before.top).toBeLessThan(-450);
 }
});