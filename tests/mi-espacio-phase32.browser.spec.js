'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
for(const width of [390,768,1366,1920]){
 test('Phase 32 consolidated tools and return navigation '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
  for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
  await page.evaluate(()=>{
   const context={id:'test',account_status:'active',full_name:'Profesional de prueba',email:'test@example.invalid',medical_staff_id:'st',linked_staff:{id:'st',full_name:'Profesional de prueba',staff_type:'biomedical_engineer'}};
   const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[{id:'p',title:'Proyecto de ensayo',role:'lead'}]},publications:{available:true,items:[]}};
   const request=u=>{
    if(u==='/api/auth/me')return Promise.resolve(context);
    if(u==='/api/me/context')return Promise.resolve(activity);
    if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    if(u==='/api/me/colleagues')return Promise.resolve([]);
    if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
    throw Error('Unexpected '+u);
   };
   window.__errors=[];window.addEventListener('error',e=>window.__errors.push(e.message));
   const view=NeumMiEspacio.createView({Vue,API:{request}});const app=Vue.createApp(view,{active:true,user:{id:'test'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  });
  const app=page.locator('.mi-espacio');
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  await expect(app.getByRole('button',{name:'Exportar CV'})).toHaveCount(0);
  await expect(app.locator('.me-v21-extras-bar')).toHaveCount(0);
  const toggle=app.getByRole('button',{name:'Acciones rápidas'});
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(app.getByRole('button',{name:'Resumen',exact:true})).toBeVisible();
  await expect(app.getByRole('button',{name:'Exportar CV'})).toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(app.getByRole('button',{name:'Exportar CV'})).toHaveCount(0);
  const result=await app.evaluate(el=>({overflow:document.documentElement.scrollWidth-innerWidth,errors:window.__errors,items:el.querySelectorAll('.me-v21-extras-bar').length}));
  expect(result.errors).toEqual([]);expect(result.overflow).toBeLessThanOrEqual(2);expect(result.items).toBe(0);
 });
}
