const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const css=fs.readFileSync(path.join(__dirname,'..','research-library-controls-pass1.css'),'utf8');
test('clinical-study rows remain readable, keyboard-visible and contained',async({page})=>{
 for(const width of [390,640,800,1180,1366,1440,2048]){
  await page.setViewportSize({width,height:850});
  await page.setContent(`<style>${css}</style><style>*{box-sizing:border-box}body{margin:0}.research-hub{width:100%;padding:16px}.rv32-study-row{display:flex;gap:12px;padding:12px}.rv32-row-state{flex:0 0 110px}.rv32-row-main{flex:1}</style><div id="app"><div class="research-hub"><div class="rv32-record-list"><article class="rv32-study-row" role="button" tabindex="0"><div class="rv32-row-state">Recruitment status</div><div class="rv32-row-main"><h2>Prospective clinical respiratory study: detailed protocol and substantially extended research description</h2></div></article></div></div></div>`);
  const row=page.locator('.rv32-study-row');
  await row.focus();
  const v=await row.evaluate(el=>{const title=el.querySelector('h2');return {overflow:document.documentElement.scrollWidth-innerWidth,titleSize:parseFloat(getComputedStyle(title).fontSize),outline:getComputedStyle(el).outlineStyle,rowRight:el.getBoundingClientRect().right}});
  expect(v.overflow).toBeLessThanOrEqual(1);
  expect(v.rowRight).toBeLessThanOrEqual(width+1);
  expect(v.titleSize).toBeGreaterThanOrEqual(15);
  expect(v.outline).not.toBe('none');
 }
});
