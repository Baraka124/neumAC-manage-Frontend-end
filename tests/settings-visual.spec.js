const {test,expect}=require('@playwright/test');
const fs=require('fs');
const VUE=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
test('Settings renders account and access at laptop, workstation and phone sizes', async ({browser})=>{
 for(const width of [1440,1366,390]){
  const page=await browser.newPage({viewport:{width,height:950},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',err=>errors.push(String(err)));
  await page.route(/unpkg\.com\/vue/,r=>r.fulfill({status:200,contentType:'application/javascript',body:VUE}));
  await page.route(/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com/,r=>r.fulfill({status:200,body:'',contentType:'text/css'}));
  await page.goto('/tests/settings-visual.html',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.ac-team-person')).toHaveCount(7,{timeout:10000});
  await expect(page.locator('.ac-welcome h3')).toHaveText('Select a person');
  const person=page.locator('.ac-team-person').first();
  await person.click();
  await expect(page.locator('.ac-person-heading h3')).toHaveText('Elena García');
  await expect(page.locator('.ac-info-panel')).toHaveCount(3);
  await expect(page.locator('.ac-activity-list li')).toHaveCount(3);
  const metrics=await page.evaluate(()=>{
   const panel=x=>{const e=document.querySelector(x),r=e.getBoundingClientRect(),s=getComputedStyle(e);return {x:r.x,y:r.y,width:r.width,height:r.height,fontFamily:s.fontFamily,fontSize:s.fontSize,display:s.display}};
   return {directory:panel('.ac-team-directory'),detail:panel('.ac-workspace-detail'),identity:panel('.ac-identity-panel'),login:panel('.ac-login-section'),role:panel('.ac-role-panel'),qualification:panel('.ac-identity-facts dd'),viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}
  });
  expect(errors,JSON.stringify(errors)).toEqual([]);
  expect(metrics.scrollWidth,'Settings should not cause horizontal document overflow').toBeLessThanOrEqual(width+3);
  expect(metrics.qualification.fontFamily.toLowerCase(),'Identity values should never be monospace').not.toContain('mono');
  if(width>900){
   expect(metrics.directory.width,'Directory must be useful width').toBeGreaterThan(300);
   expect(metrics.detail.width,'Account detail must be useful width').toBeGreaterThan(550);
   expect(Math.abs(metrics.directory.y-metrics.detail.y),'Directory and detail must start at same top').toBeLessThan(5);
  }else{
   expect(metrics.detail.y,'Mobile detail must follow the directory').toBeGreaterThan(metrics.directory.y);
  }
  if(width===1440){
   const jpg=await page.locator('.admin-studio').screenshot({type:'jpeg',quality:62});
   console.log('SETTINGS_VISUAL_PREVIEW_JPEG_BASE64:'+jpg.toString('base64'));
   console.log('SETTINGS_VISUAL_METRICS:'+JSON.stringify(metrics));
  }
  await page.close();
 }
});