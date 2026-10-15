'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const fixtures={
 research:{agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[{id:'p',title:'Proyecto de prueba',role:'lead'}]},publications:{available:true,items:[]}},
 researchUnavailable:{agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[{id:'p',title:'Proyecto de prueba',role:'lead'}]},publications:{available:false,items:[]}},
 clinical:{agenda:{guardias:[{id:'g',date:'2026-10-22',shift:'on_call_present',role:'primary'}],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}}
};
for(const width of [390,768,1366])for(const role of Object.keys(fixtures)){
 test('Phase 34 adaptive authenticated-shape presentation '+role+' '+width,async({page})=>{
  await page.setViewportSize({width,height:850});await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
  for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
  await page.evaluate(({role,activity})=>{
   const context={id:'test',account_status:'active',full_name:'Persona de prueba',email:'test@example.invalid',medical_staff_id:'staff1',linked_staff:{id:'staff1',full_name:'Persona de prueba',staff_type:role==='clinical'?'clinician':'biomedical_engineer'}};
   const request=u=>{
    if(u==='/api/auth/me')return Promise.resolve(context);
    if(u==='/api/me/context')return Promise.resolve(activity);
    if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    if(u==='/api/me/colleagues')return Promise.resolve([]);
    if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
    throw Error('Unexpected '+u);
   };
   window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
   const comp=NeumMiEspacio.createView({Vue,API:{request}});
   const app=Vue.createApp(comp,{active:true,user:{id:'test'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  },{role,activity:fixtures[role]});
  const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();
  await expect(app).toHaveClass(role==='clinical'?/me-v34-clinical-first/:/me-v34-research-only/);
  // Empty confirmed results should not occupy the overview; unavailable sources remain explicit.
  if(fixtures[role].publications.available){
   await expect(app.locator('.me-v34-empty-publications')).toHaveCount(0);
   await expect(app.locator('.me-v9-lower-grid')).toHaveClass(/me-v39-secondary-solo/);
  } else {
   await expect(app.locator('.me-v34-empty-publications')).toBeVisible();
   await expect(app.locator('.me-v34-empty-publications')).toContainText('La información de publicaciones no está disponible actualmente.');
  }
  const out=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,errors:window.__errors}));
  expect(out.width).toBeLessThanOrEqual(out.viewport+2);expect(out.errors).toEqual([]);
 });
}
