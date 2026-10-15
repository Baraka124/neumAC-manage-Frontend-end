'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
for(const kind of ['clinician','biomedical_engineer'])for(const width of [390,768,1366]){
 test('Phase 29 production styles: typography and workspace geometry '+kind+' at '+width,async({page})=>{
  await page.setViewportSize({width,height:width===390?720:width===768?840:768});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;height:auto;overflow:auto"><main id="app" style="height:auto;overflow:visible"></main></body></html>');
  for(const match of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g)){
   if(!match[1].startsWith('http'))await page.addStyleTag({content:read(match[1])});
  }
  for(const content of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content});
  await page.evaluate(kind=>{
   const context={id:'synthetic',account_status:'active',full_name:'Profesional de prueba',email:'synthetic@example.invalid',medical_staff_id:'staff-x',linked_staff:{id:'staff-x',full_name:'Profesional de prueba',staff_type:kind}};
   const activity={agenda:{guardias:[{id:'one',date:'2026-10-22',shift:'on_call_present',role:'primary'}],rotations:[],absences:[]},research:{lines:[{id:'line-1',name:'Línea de investigación',role:'coordinator'}],studies:[{id:'study-1',title:'Investigación respiratoria multicéntrica',role:'PI'}],projects:[]},publications:{available:true,items:[]}};
   if(kind==='biomedical_engineer'){activity.agenda.guardias=[];activity.research.projects=[{id:'project-test',title:'Proyecto de innovación biomédica para el seguimiento de la función respiratoria',role:'lead'}];}
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
  },kind);
  const app=page.locator('.mi-espacio');
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  for(const selector of ['.me-v22-designation','.mi-espacio-person-email','.me-v22-name-line h3','.me-approved-record-main strong']){
   const type=await app.locator(selector).first().evaluate(el=>({family:getComputedStyle(el).fontFamily,size:parseFloat(getComputedStyle(el).fontSize)}));
   expect(type.family).toContain('DM Sans');expect(type.family).not.toMatch(/Mono|monospace/);expect(type.size).toBeGreaterThanOrEqual(14);
  }
  for(const button of await app.locator('.me-v20-quick-bar>button').all())expect((await button.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await expect(app.getByRole('heading',{name:'Investigación',exact:true})).toBeVisible();
  await expect(app.locator('.me-v22-name-line h3')).toHaveCSS('font-weight','600');
  await expect(app.locator('#me-v9-research-title')).toHaveCSS('font-size','21px');
  await page.screenshot({path:test.info().outputPath('overview.png'),fullPage:true});
  if(kind==='biomedical_engineer' && width===1366){
   await page.evaluate(()=>{window.open=()=>({document:{write:html=>window.__dossier=html,close:()=>{}},print:()=>{}})});
   await app.getByRole('button',{name:'Dossier PDF',exact:true}).click();
   const dossier=await page.evaluate(()=>window.__dossier);
   expect(dossier).toContain(' — Responsable');expect(dossier).not.toContain(' — lead');
   const printPage=await page.context().newPage();await printPage.setContent(dossier);await printPage.emulateMedia({media:'print'});
   await expect(printPage.locator('h1')).toHaveCSS('font-size','32px');
   await printPage.screenshot({path:test.info().outputPath('dossier.png'),fullPage:true});await printPage.close();
  }
  for(const kind of [
    {open:'Abrir calendario',panel:'.me-v26b-workspace',back:'Volver a Mi espacio'},
    {open:'Directorio',panel:'.me-v26b-workspace',back:'Volver a Mi espacio'}
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
