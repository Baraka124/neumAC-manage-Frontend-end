'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
function future(days){const d=new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
async function mount(page,width){
 await page.setViewportSize({width,height:850});await page.emulateMedia({reducedMotion:'reduce'});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
 const guardias=Array.from({length:6},(_,i)=>({id:'g'+i,date:future(4+i*3),shift:'on_call_present',role:'primary'}));
 await page.evaluate(guardias=>{
  const user={id:'phase44a',account_status:'active',full_name:'Profesional de prueba',medical_staff_id:'staff44a',linked_staff:{id:'staff44a',full_name:'Profesional de prueba',staff_type:'clinician'}};
  const activity={agenda:{guardias,rotations:[],absences:[]},research:{
   lines:[{id:'l1',name:'Línea 1',role:'coordinator'},{id:'l2',name:'Línea 2',role:'member'},{id:'l3',name:'Línea 3',role:'member'}],
   studies:Array.from({length:10},(_,i)=>({id:'s'+i,title:'Estudio de prueba '+i,status:'active',role:'co-investigator'})),
   projects:Array.from({length:12},(_,i)=>({id:'p'+i,title:'Proyecto de prueba '+i,stage:'ongoing',role:'lead'}))},
   publications:{available:true,items:[]}};
  const request=u=>{
   if(u==='/api/auth/me')return Promise.resolve(user);
   if(u==='/api/me/context')return Promise.resolve(activity);
   if(u==='/api/me/profile')return Promise.resolve({id:'staff44a',full_name:'Profesional de prueba'});
   if(u==='/api/me/certificates')return Promise.resolve([]);
   if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies'))return Promise.resolve([]);
   throw Error('Unexpected endpoint '+u);
  };
  window.__errors44=[];const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'phase44a'},canOpenView:()=>false});
  app.config.errorHandler=e=>window.__errors44.push(String(e));app.mount('#app');
 },guardias);
 const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();return app;
}
for(const width of [390,1366]){
 test('44A institutional disclosure controls: keyboard, focus, independent lists '+width,async({page})=>{
  const app=await mount(page,width);
  const studies=app.locator('#me-v28-studies>li'),projects=app.locator('#me-v28-projects>li');
  await expect(studies).toHaveCount(5);await expect(projects).toHaveCount(5);
  const toggle=app.locator('.me-v44c-collection-toggle').first();
  await toggle.focus();await expect(toggle).toBeFocused();
  const style=await toggle.evaluate(el=>{
   const icon=el.querySelector('svg.me-v28-chevron'),c=getComputedStyle(icon),focus=getComputedStyle(el);
   return {width:c.width,height:c.height,border:c.borderTopWidth,transition:c.transitionDuration,outline:focus.outlineStyle,outlineWidth:focus.outlineWidth};
  });
  expect(style.width).toBe('32px');expect(style.height).toBe('32px');expect(style.border).toBe('1px');
  expect(style.transition.split(',').every(s=>s.trim()==='0s')).toBe(true);
  expect(style.outline).not.toBe('none');expect(parseFloat(style.outlineWidth)).toBeGreaterThanOrEqual(2);
  await page.keyboard.press('Enter');await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(studies).toHaveCount(10);await expect(projects).toHaveCount(5);
  const record=studies.first().locator('.me-approved-record');const summary=record.locator('summary');
  await summary.focus();await page.keyboard.press('Enter');
  await expect(record).toHaveAttribute('open','');
  await expect(record.locator('dl')).toBeVisible();
  expect(await summary.locator('svg.me-approved-plus').count()).toBe(1);
  await page.keyboard.press('Enter');await expect(record).not.toHaveAttribute('open',/.+/);
  await toggle.click();await expect(studies).toHaveCount(5);
  await toggle.click();await expect(studies).toHaveCount(10);
  const state=await page.evaluate(()=>({errors:window.__errors44,overflow:document.documentElement.scrollWidth-innerWidth}));
  expect(state.errors).toEqual([]);expect(state.overflow).toBeLessThanOrEqual(2);
 });
 test('44A professional profile uses same disclosure with preserved focus '+width,async({page})=>{
  const app=await mount(page,width);
  const profileToggle=app.getByRole('button',{name:'Perfil profesional',exact:true});
  await profileToggle.focus();
  const icon=profileToggle.locator('svg.me-v28-chevron');
  await expect(icon).toBeVisible();
  expect(await icon.evaluate(el=>getComputedStyle(el).width)).toBe('32px');
  await page.keyboard.press('Enter');await expect(profileToggle).toHaveAttribute('aria-expanded','true');
  const panel=app.locator('#me-v28-profile-panel');await expect(panel).toBeVisible();
  const science=panel.locator('.me-v41-science>summary');await expect(science).toBeVisible();
  await science.focus();await page.keyboard.press('Enter');
  await expect(panel.locator('.me-v41-science')).toHaveAttribute('open','');
  await expect(science).toBeFocused();
  const result=await page.evaluate(()=>({errors:window.__errors44,overflow:document.documentElement.scrollWidth-innerWidth}));
  expect(result.errors).toEqual([]);expect(result.overflow).toBeLessThanOrEqual(2);
 });
}
