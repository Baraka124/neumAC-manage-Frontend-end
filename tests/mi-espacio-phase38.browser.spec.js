'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const cases=[
 {id:'research',research:1,guardia:0,role:'biomedical_engineer'},
 {id:'clinical',research:1,guardia:1,role:'clinician'},
 {id:'empty',research:0,guardia:0,role:'resident'}
];
for(const width of [390,768,1366])for(const fixture of cases){
test('Phase 38 adaptive dossier/disclosure '+fixture.id+' '+width,async({page})=>{
 await page.setViewportSize({width,height:850});await page.emulateMedia({reducedMotion:'reduce'});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
 for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
 for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
 await page.evaluate(f=>{
   const context={id:'test',account_status:'active',full_name:'Persona de prueba',email:'test@example.invalid',medical_staff_id:'staff1',linked_staff:{id:'staff1',full_name:'Persona de prueba',staff_type:f.role}};
   const activity={agenda:{guardias:f.guardia?[{id:'g',date:'2026-11-01',shift:'presencial',role:'primary'}]:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:f.research?[{id:'p',title:'Proyecto vinculado',role:'lead',stage:'active'}]:[]},publications:{available:true,items:[]}};
   const request=u=>{if(u==='/api/auth/me')return Promise.resolve(context);if(u==='/api/me/context')return Promise.resolve(activity);if(u==='/api/me/profile')return Promise.resolve({id:'staff1',full_name:'Persona de prueba'});if(u==='/api/me/certificates')return Promise.resolve([]);if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);if(u==='/api/me/colleagues')return Promise.resolve([]);if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});throw Error('Unexpected '+u)};
   window.__errors=[];const view=NeumMiEspacio.createView({Vue,API:{request}});const app=Vue.createApp(view,{active:true,user:{id:'test'},canOpenView:()=>false});app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
 },fixture);
 const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();
 if(fixture.research){
  await app.getByRole('button',{name:'Perfil profesional',exact:true}).click();
  const profile=app.locator('#me-v28-profile-panel');await expect(profile.locator('.me-v35-participation')).toBeVisible();
  await expect(profile.locator('.me-v18-capabilities, .me-v19-leadership')).toHaveCount(0);
  await expect(profile.locator('.me-v35-records').first()).toBeHidden();
  const sciencePos=await profile.locator('.me-v35-participation').evaluate(e=>e.getBoundingClientRect().top);
  const editPos=await profile.locator('.me-v15-edit-section').evaluate(e=>e.getBoundingClientRect().top);
  expect(sciencePos).toBeLessThan(editPos);
  await profile.getByRole('button',{name:/Volver/}).click();
  await expect(app.locator('.me-v9-overview')).toBeVisible();
  await expect(app.locator('.me-v26d-workspace')).toHaveCount(0);
  await expect(app.locator('#me-v28-projects')).toContainText('Proyecto vinculado');
  await expect(app.locator('.me-v8-research').getByRole('button',{name:/Proyectos/})).toHaveCount(0);
 }
 const out=await page.evaluate(()=>({errors:window.__errors,overflow:document.documentElement.scrollWidth-innerWidth}));
 expect(out.errors).toEqual([]);expect(out.overflow).toBeLessThanOrEqual(2);
});
}
