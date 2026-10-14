'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=read('node_modules/vue/dist/vue.global.prod.js');
for(const width of [390,768,1024,1366]){
 test('Phase 31B1 professional profile and directory composition at '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
  for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
  await page.evaluate(()=>{
   const context={id:'31b1-test',account_status:'active',full_name:'Persona de prueba',email:'test@example.invalid',medical_staff_id:'staff1',linked_staff:{id:'staff1',full_name:'Persona de prueba',staff_type:'biomedical_engineer'}};
   const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[{id:'p1',title:'Proyecto de prueba',role:'lead'}]},publications:{available:true,items:[]}};
   const request=u=>{
    if(u==='/api/auth/me')return Promise.resolve(context);
    if(u==='/api/me/context')return Promise.resolve(activity);
    if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    if(u==='/api/me/colleagues')return Promise.resolve([{id:'staff2',full_name:'Colega de prueba',title:'Personal autorizado'}]);
    if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
    if(u==='/api/me/profile')return Promise.resolve({full_name:'Persona de prueba'});
    throw Error('Unexpected '+u);
   };
   window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
   const view=NeumMiEspacio.createView({Vue,API:{request}});
   const app=Vue.createApp(view,{active:true,user:{id:'31b1-test'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  });
  const app=page.locator('.mi-espacio');
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  await app.getByRole('button',{name:'Directorio',exact:true}).click();
  await expect(app.locator('#me-v26b-directory')).toBeVisible();
  const css=await app.evaluate(el=>({
   quick:getComputedStyle(el.querySelector('.me-v20-quick-bar')).gridTemplateColumns.split(' ').length,
   listBorder:getComputedStyle(el.querySelector('.me-v20-colleague-card')).borderTopWidth,
   split:getComputedStyle(el.querySelector('.me-v26b-split')).gridTemplateColumns.split(' ').length,
   overflow:document.documentElement.scrollWidth-innerWidth,errors:window.__errors
  }));
  expect(css.quick).toBe(width<=480?2:width<=1120?3:5);
  expect(css.listBorder).toBe('0px');
  expect(css.split).toBe(width<=799?1:2);
  expect(css.overflow).toBeLessThanOrEqual(2);expect(css.errors).toEqual([]);
  await app.getByRole('button',{name:/Volver a Mi espacio/}).first().click();
  await expect(app.locator('.me-v9-overview')).toBeVisible();
 });
}
