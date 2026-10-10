const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const css=fs.readFileSync(path.join(__dirname,'..','research-library-controls-pass1.css'),'utf8');
test('study governance and recruitment metadata wrap without clipping',async({page})=>{
 for(const width of [390,640,800,1366,1440,2048]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${css}</style><style>*{box-sizing:border-box}body{margin:0}.research-hub{padding:14px}.rv32-study-row{display:flex;gap:12px;padding:12px}.rv32-row-main{min-width:0;flex:1}</style><div id="app"><section class="research-hub"><div class="rv32-record-list"><article class="rv32-study-row"><div class="rv32-row-main"><h2>Respiratory study</h2><div class="rv32-row-governance"><span>Ethics documentation pending institutional validation and administrative review</span></div><div class="rv32-row-recruitment"><span>Recruitment information awaiting verified update</span><small>Clinical operations status as recorded</small></div></div></article></div></section></div>`);
  const m=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,gov:getComputedStyle(document.querySelector('.rv32-row-governance span')).fontSize,rec:getComputedStyle(document.querySelector('.rv32-row-recruitment small')).fontSize}));
  expect(m.overflow).toBeLessThanOrEqual(1);
  expect(parseFloat(m.gov)).toBeGreaterThanOrEqual(13);
  expect(parseFloat(m.rec)).toBeGreaterThanOrEqual(12);
 }
});