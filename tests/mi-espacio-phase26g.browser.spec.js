'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');

for(const size of [{width:390,height:844},{width:768,height:1024},{width:1366,height:900}]){
 test('Phase 26G personal guardia select → detail → back '+size.width,async({page})=>{
  await page.setViewportSize(size);
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"></main></body></html>');
  await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
  for(const v of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:v});
  await page.evaluate(()=>{
   const user={id:'u-guardias',account_status:'active',full_name:'Persona Clínica',email:'a@example.invalid',medical_staff_id:'staff-a',linked_staff:{id:'staff-a',full_name:'Persona Clínica',staff_type:'clinician'}};
   const activity={agenda:{guardias:[{id:'d-1',date:'2026-10-21',shift:'on_call_present',role:'primary'},{id:'d-2',date:'2026-10-26',shift:'on_call_home',role:'backup'}],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}};
   const request=path=>{
    if(path==='/api/auth/me')return Promise.resolve(user);
    if(path==='/api/me/context')return Promise.resolve(activity);
    if(path==='/api/me/discrepancies'||path.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    throw Error('Unexpected request '+path);
   };
   window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
   const comp=window.NeumMiEspacio.createView({Vue,API:{request}});
   const app=Vue.createApp(comp,{active:true,user:{id:'u-guardias'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));
   app.mount('#app');
  });
  const app=page.locator('.mi-espacio');
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  await app.getByRole('button',{name:/Consultar guardias/}).first().click();
  await expect(app.locator('.me-v26g-duties')).toBeVisible();
  await expect(app.locator('.me-v9-overview')).toHaveCount(0);
  await app.locator('.me-v26g-duty-row').first().click();
  await expect(app.locator('.me-v26g-duty-detail h4')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(app.locator('.me-v26g-duty-detail')).toContainText('Selecciona una guardia');
  await app.getByRole('button',{name:/Volver a Mi espacio/}).click();
  await expect(app.locator('.me-v26g-duties')).toHaveCount(0);
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  const result=await page.evaluate(()=>({errors:window.__errors,width:document.documentElement.scrollWidth,viewport:window.innerWidth}));
  expect(result.errors).toEqual([]);
  expect(result.width).toBeLessThanOrEqual(result.viewport+2);
 });
}
