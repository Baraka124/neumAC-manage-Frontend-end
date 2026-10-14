'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
for(const width of [390,768,1366]){
 test('Phase 27B workspaces: geometry, return focus and reduced motion at '+width,async({page})=>{
  await page.setViewportSize({width,height:width===390?720:width===768?840:768});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
  for(const content of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content});
  await page.evaluate(()=>{
   const context={id:'synthetic',account_status:'active',full_name:'Profesional de prueba',email:'synthetic@example.invalid',medical_staff_id:'staff-x',linked_staff:{id:'staff-x',full_name:'Profesional de prueba',staff_type:'clinician'}};
   const activity={agenda:{guardias:[{id:'one',date:'2026-10-22',shift:'on_call_present',role:'primary'}],rotations:[],absences:[]},research:{lines:[{id:'line-1',name:'Línea de investigación',role:'coordinator'}],studies:[{id:'study-1',title:'Investigación respiratoria multicéntrica',role:'PI'}],projects:[]},publications:{available:true,items:[]}};
   const request=path=>{
    if(path==='/api/auth/me')return Promise.resolve(context);
    if(path==='/api/me/context')return Promise.resolve(activity);
    if(path==='/api/me/discrepancies'||path.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    if(path==='/api/me/colleagues')return Promise.resolve([{id:'other',full_name:'Profesional público',title:'Investigación'}]);
    if(path.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
    throw Error('Unexpected '+path);
   };
   window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
   const view=window.NeumMiEspacio.createView({Vue,API:{request}});
   const app=Vue.createApp(view,{active:true,user:{id:'synthetic'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  });
  const app=page.locator('.mi-espacio');
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  for(const kind of [
    {open:'Abrir calendario',panel:'.me-v26b-workspace',back:'Volver a Mi espacio'},
    {open:'Directorio',panel:'.me-v26b-workspace',back:'Volver a Mi espacio'},
    {open:'Ver investigación',panel:'.me-v26d-workspace',back:'Volver a Mi espacio'}
  ]){
   await app.getByRole('button',{name:new RegExp(kind.open)}).first().click();
   const panel=app.locator(kind.panel);
   await expect(panel).toBeVisible();
   const box=await panel.boundingBox();
   expect(box).toBeTruthy();
   expect(box.width).toBeGreaterThan(160);
   const geometry=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,vp:window.innerWidth}));
   expect(geometry.doc).toBeLessThanOrEqual(geometry.vp+2);
   await panel.getByRole('button',{name:new RegExp(kind.back)}).first().click();
   await expect(app.locator('.me-v9-overview')).toBeVisible();
  }
  const a=await page.evaluate(()=>({errors:window.__errors,doc:document.documentElement.scrollWidth,vp:innerWidth}));
  expect(a.errors).toEqual([]);expect(a.doc).toBeLessThanOrEqual(a.vp+2);
 });
}
