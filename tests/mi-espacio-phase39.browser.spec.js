'use strict';
// Phase 39: role-aware Mi Espacio, isolated Vue mount and illustrative test records only.
// No live sessions, hospital data, or production API changes.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const empty=()=>({agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}});
function upcoming(n){const d=new Date();d.setDate(d.getDate()+n);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
async function mount(page,staffType,activity,opts={}){
 await page.setViewportSize({width:opts.width||1366,height:opts.width===390?844:900});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="app"></div></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
 await page.evaluate(({staffType,activity})=>{
  const ctx={id:'phase39-user',account_status:'active',full_name:'Profesional de prueba',medical_staff_id:'staff39',linked_staff:{id:'staff39',full_name:'Profesional de prueba',staff_type:staffType}};
  const requests=[];const request=u=>{
   requests.push(u);
   if(u==='/api/auth/me')return Promise.resolve(ctx);
   if(u==='/api/me/context')return Promise.resolve(activity);
   if(u==='/api/me/dashboard')return Promise.resolve({active_studies:1,active_projects:2});
   if(u==='/api/me/discrepancies'||u==='/api/me/activity'||u==='/api/me/notifications'||u.startsWith('/api/discrepancies'))return Promise.resolve([]);
   if(u==='/api/me/colleagues')return Promise.resolve([]);
   if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
   throw Error('Unexpected endpoint '+u);
  };
  window.__phase39=[];window.__requests39=requests;
  window.addEventListener('error',e=>window.__phase39.push(String(e.message)));
  const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'phase39-user'},canOpenView:()=>false});
  app.config.errorHandler=e=>window.__phase39.push(String(e));
  app.mount('#app');
 },{staffType,activity});
 const el=page.locator('.mi-espacio');await expect(el.locator('.me-v9-overview')).toBeVisible();return el;
}
for(const width of [390,1366]){
 test('resident without linked activity receives truthful, actionable clinical training context '+width,async({page})=>{
  const app=await mount(page,'medical_resident',empty(),{width});
  await expect(app.locator('.me-v39-resident-empty')).toBeVisible();
  await expect(app.locator('#me-v9-agenda-title')).toHaveText('Formación y agenda');
  await expect(app.locator('.me-v39-resident-empty')).toContainText('Si tienes una asignación, puedes comunicarla para que se revise');
  await expect(app.locator('.me-v9-publications')).toHaveCount(0);
  await expect(app.locator('.me-v23-photo-nudge')).toHaveCount(0);
  await app.getByRole('button',{name:/Comunicar una rotación que falta/}).click();
  await expect(app.locator('#me-report-subject')).toHaveValue('rotation');
  await expect(app.locator('.me-report')).toBeVisible();
  const state=await page.evaluate(()=>({errors:window.__phase39,over:document.documentElement.scrollWidth-innerWidth,requests:window.__requests39}));
  expect(state.errors).toEqual([]);expect(state.over).toBeLessThanOrEqual(2);
  expect(state.requests.every(x=>!x.startsWith('/api/medical-staff/'))).toBe(true);
 });
}
test('clinical commitment appears once and personal indicators stay optional',async({page})=>{
 const a=empty();a.agenda.guardias=[{id:'g1',date:upcoming(3),shift:'on_call_present',role:'primary'}];
 const app=await mount(page,'clinician',a,{width:1366});
 await expect(app.locator('.me-v8-upnext')).toBeVisible();
 await expect(app.locator('.me-v23-event').filter({hasText:'Guardia'})).toHaveCount(0);
 await expect(app.locator('.me-v23-photo-nudge')).toHaveCount(0);
 await expect(app.locator('.me-v39-metrics')).toBeVisible();
 await expect(app.locator('.me-v39-metrics')).not.toHaveAttribute('open',/.+/);
 await app.locator('.me-v39-metrics>summary').click();
 await expect(app.locator('.me-v39-metrics')).toHaveAttribute('open','');
 expect(await page.evaluate(()=>window.__phase39)).toEqual([]);
});
test('research-only engineer gets prioritized inline evidence without empty publication cards',async({page})=>{
 const a=empty();a.research.projects=[{id:'p1',title:'Proyecto institucional de investigación',stage:'in_progress',role:'lead'}];
 const app=await mount(page,'biomedical_engineer',a,{width:1366});
 await expect(app.locator('.me-v8-agenda')).toHaveCount(0);
 await expect(app.locator('.me-v8-research')).toBeVisible();
 await expect(app.locator('.me-v9-publications')).toHaveCount(0);
 await expect(app.locator('.me-approved-record')).toContainText('Proyecto institucional de investigación');
 await app.locator('.me-approved-record>summary').click();
 await expect(app.locator('.me-approved-record dl')).toContainText('En desarrollo');
 expect(await page.evaluate(()=>window.__phase39)).toEqual([]);
});
