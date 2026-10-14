'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
for(const width of [390,1366]){
 test('Phase 35 verified project/study roles and history on profile '+width,async({page})=>{
  await page.setViewportSize({width,height:850});
  await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
  for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
  for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
  await page.evaluate(()=>{
   const user={id:'test',account_status:'active',full_name:'Profesional de prueba',email:'test@example.invalid',medical_staff_id:'staff1',linked_staff:{id:'staff1',full_name:'Profesional de prueba',staff_type:'biomedical_engineer'}};
   const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[{id:'s1',title:'Estudio clínico verificado',role:'co-investigator',status:'recruiting',study_type:'clinical_trial'},{id:'s2',title:'Estudio finalizado',role:'PI',status:'completed'}],projects:[{id:'p1',title:'Proyecto activo verificado',role:'co_pi',stage:'active'}]},publications:{available:true,items:[]}};
   const request=u=>{
    if(u==='/api/auth/me')return Promise.resolve(user);
    if(u==='/api/me/context')return Promise.resolve(activity);
    if(u==='/api/me/profile')return Promise.resolve({id:'staff1',full_name:'Profesional de prueba',professional_email:'test@example.invalid'});
    if(u==='/api/me/certificates')return Promise.resolve([]);
    if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);
    if(u==='/api/me/colleagues')return Promise.resolve([]);
    if(u.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
    throw Error('Unexpected '+u);
   };
   window.__errors=[];window.__requests=[];
   const comp=NeumMiEspacio.createView({Vue,API:{request:(u,...args)=>{window.__requests.push(u);return request(u,...args)}}});
   const app=Vue.createApp(comp,{active:true,user:{id:'test'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  });
  const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();
  await app.getByRole('button',{name:'Perfil profesional',exact:true}).click();
  const panel=app.locator('#me-v28-profile-panel');
  await expect(panel.locator('.me-v35-participation')).toBeVisible();
  await expect(panel.locator('.me-v35-records').first()).toContainText('Estudio clínico verificado');
  await expect(panel.locator('.me-v35-records').first()).toContainText('Coinvestigador/a');
  await expect(panel.locator('.me-v35-records').first()).toContainText('En reclutamiento');
  await expect(panel.locator('.me-v35-records').first()).toContainText('Co-IP');
  await expect(panel).not.toContainText('Estudio finalizado');
  await panel.getByRole('button',{name:/Participación finalizada/}).click();
  await expect(panel.locator('#me-v35-history-records')).toContainText('Estudio finalizado');
  const errors=await page.evaluate(()=>({errors:window.__errors,requests:window.__requests}));
  expect(errors.errors).toEqual([]);
  expect(errors.requests.some(u=>u.startsWith('/api/medical-staff/'))).toBe(false);
 });
}
