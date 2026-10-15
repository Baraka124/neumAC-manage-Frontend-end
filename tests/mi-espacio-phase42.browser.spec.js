'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=read('node_modules/vue/dist/vue.global.prod.js');
const fixtures=[
 {kind:'resident',type:'medical_resident',agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]}},
 {kind:'clinical',type:'clinician',agenda:{guardias:[{id:'g',date:'2026-11-01',shift:'presencial',role:'primary'}],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]}},
 {kind:'research',type:'biomedical_engineer',agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[{id:'l',name:'Línea de prueba',role:'coordinator'}],studies:Array.from({length:11},(_,i)=>({id:'s'+i,title:'Estudio de evaluación '+i,role:'co-investigator',status:i===10?'completed':'ongoing'})),projects:Array.from({length:13},(_,i)=>({id:'p'+i,title:'Proyecto de investigación biomédica '+i,role:'lead',stage:'ongoing'}))}}
];
for(const width of [390,768,1366,1920])for(const item of fixtures){
 test('Phase 42 inclusive role and collection audit '+item.kind+' '+width,async({page})=>{
  await page.setViewportSize({width,height:860});await page.emulateMedia({reducedMotion:'reduce'});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
  for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
  await page.evaluate(f=>{
   const user={id:'test',account_status:'active',full_name:'Profesional de prueba',medical_staff_id:'s',linked_staff:{id:'s',full_name:'Profesional de prueba',staff_type:f.type}};
   const activity={agenda:f.agenda,research:f.research,publications:{available:true,items:[]}};
   const request=u=>{if(u==='/api/auth/me')return Promise.resolve(user);if(u==='/api/me/context')return Promise.resolve(activity);if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies'))return Promise.resolve([]);throw Error('Unexpected '+u)};
   window.__errors=[];const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'test'},canOpenView:()=>false});app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  },item);
  const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();
  await expect(app.locator('.me-v18-capabilities,.me-v19-leadership')).toHaveCount(0);
  if(item.kind==='resident'){await expect(app.locator('.me-v39-resident-empty')).toContainText('Ahora mismo no aparecen rotaciones');await expect(app.locator('.me-v39-resident-link').last()).toContainText('Comunicar una rotación que falta')}
  if(item.kind==='clinical')await expect(app.locator('.me-v8-upnext')).toBeVisible();
  if(item.kind==='research'){
    await expect(app.locator('.me-v42-affiliations-title')).toHaveText('LÍNEAS DE INVESTIGACIÓN');
    await expect(app.locator('.me-approved-affiliations li')).toHaveCount(1);
    await expect(app.locator('#me-v28-studies>li')).toHaveCount(2);
    await app.getByRole('button',{name:/Estudios 11/}).click();
    await expect(app.locator('#me-v28-studies>li')).toHaveCount(7);
    await app.locator('#me-v28-studies>li').first().locator('summary').click();
    await expect(app.locator('#me-v28-studies>li').first().locator('dl')).toBeVisible();
  }
  const result=await page.evaluate(()=>({errors:window.__errors,overflow:document.documentElement.scrollWidth-innerWidth}));
  expect(result.errors).toEqual([]);expect(result.overflow).toBeLessThanOrEqual(2);
 });
}
