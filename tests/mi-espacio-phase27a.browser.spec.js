'use strict';
// Phase 27A: real Mi Espacio Vue component, synthetic identities/data only.
// No cookies, tokens, clinical records, or staff details are stored.
const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const empty=()=>({agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}});
const cases={
 head:{role:'head_of_department',type:'clinician',activity:(()=>{let a=empty();a.research.studies=[{id:'s-head',title:'Estudio verificado por liderazgo',role:'PI'}];a.research.lines=[{id:'l-head',name:'Línea institucional verificada',role:'coordinator'}];a.publications.items=[{id:'p-head',title:'Publicación científica verificada',byline:'Autores de prueba'}];return a})()},
 clinician:{role:'clinician',type:'clinician',activity:(()=>{let a=empty();a.agenda.guardias=[{id:'g1',date:'2026-10-21',shift:'on_call_present',role:'primary'}];a.agenda.rotations=[{id:'r-supervise',role:'supervisor',resident:'Residente de prueba',unit:'Neumología',start:'2026-11-01',end:'2026-12-01'}];return a})()},
 resident:{role:'resident',type:'medical_resident',activity:(()=>{let a=empty();a.agenda.rotations=[{id:'r-test',role:'resident',unit:'Unidad de prueba UCI',start:'2026-11-01',end:'2026-12-01'}];return a})()},
 engineer:{role:'biomedical_engineer',type:'biomedical_engineer',activity:(()=>{let a=empty();a.research.studies=[{id:'s-eng',title:'Estudio de ingeniería verificado',role:'co-investigator'}];return a})()}
};
async function mount(page,kind,{deny=false}={}){
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const content of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content});
 await page.evaluate(({kind,fixture,deny})=>{
   const context={id:'role-test',account_status:'active',full_name:'Personal sintético',email:'placeholder@example.invalid',job_title:fixture.role,medical_staff_id:'staff-test',linked_staff:{id:'staff-test',full_name:'Personal sintético',staff_type:fixture.type}};
   const requests=[];
   const request=(uri)=>{
     requests.push(uri);
     if(uri==='/api/auth/me')return Promise.resolve(context);
     if(uri==='/api/me/context')return Promise.resolve(fixture.activity);
     if(uri==='/api/me/discrepancies'||uri.startsWith('/api/discrepancies?'))return Promise.resolve([]);
     if(uri.startsWith('/api/me/calendar')||uri==='/api/me/colleagues'){
       if(deny){const err=Error('Acceso denegado por el servidor');err.status=403;return Promise.reject(err)}
       if(uri==='/api/me/colleagues')return Promise.resolve([{id:'staff-public',full_name:'Profesional público autorizado',title:'Clínico de prueba',department:'Servicio de prueba'}]);
       return Promise.resolve({events:[{id:'event-1',date:'2026-10-14',title:'Evento de prueba',type:'guardia'}]});
     }
     throw Error('Unexpected endpoint '+uri);
   };
   window.__errors=[];window.__requests=requests;
   window.addEventListener('error',e=>window.__errors.push(e.message));
   const comp=window.NeumMiEspacio.createView({Vue,API:{request}});
   const app=Vue.createApp(comp,{active:true,user:{id:'role-test',admin_level:0},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors.push(String(e));
   app.mount('#app');
 },{kind,fixture:cases[kind],deny});
 await expect(page.locator('.me-v9-identity')).toBeVisible();
 await expect(page.locator('.me-activity-placeholder')).toHaveCount(0);
}
for(const kind of Object.keys(cases)){
 for(const width of [390,1366]){
  test(kind+' role evidence & personal-only navigation '+width,async({page})=>{
   await page.setViewportSize({width,height:width===390?844:900});
   await mount(page,kind);
   const app=page.locator('.mi-espacio');
   if(kind==='head'||kind==='engineer'){
     await expect(app.locator('.me-v8-research')).toBeVisible();
     await app.getByRole('button',{name:/Explorar mi investigación/}).click();
     await expect(app.locator('.me-v26d-workspace')).toContainText(kind==='head'?'Estudio verificado por liderazgo':'Estudio de ingeniería verificado');
     await expect(app.locator('.me-v9-overview')).toHaveCount(0);
     await expect(app.getByRole('button',{name:/Ir al módulo de investigación/})).toHaveCount(0);
     await app.getByRole('button',{name:/Volver a Mi espacio/}).click();
     await expect(app.locator('.me-v9-overview')).toBeVisible();
     await expect(app.locator('.me-v26d-workspace')).toHaveCount(0);
     await expect(app.locator('.me-v8-upnext')).toHaveCount(0);
   }
   if(kind==='clinician'){
     await expect(app.locator('.me-v8-agenda')).toContainText('21 de octubre de 2026');
     await expect(app.locator('.me-v8-agenda')).toContainText('Residente de prueba');
     await app.getByRole('button',{name:/Ver mis guardias/}).first().click();
     await expect(app.locator('.me-v26g-duties')).toBeVisible();
     await app.locator('.me-v26g-duty-row').first().click();
     await expect(app.locator('.me-v26g-duty-detail')).toContainText('Guardia presencial');
     await app.getByRole('button',{name:/Volver a Mi espacio/}).first().click();
     await expect(app.locator('.me-v9-overview')).toBeVisible();
     await expect(app.locator('.me-v26g-duties')).toHaveCount(0);
   }
   if(kind==='resident'){
     await expect(app.locator('.me-v10-rotation-feature')).toContainText('Unidad de prueba UCI');
     await expect(app.locator('.me-v8-research')).toHaveCount(0);
     await expect(app.getByRole('button',{name:/Ver mis guardias/})).toHaveCount(0);
   }
   const result=await page.evaluate(()=>({errors:window.__errors,requests:window.__requests,width:document.documentElement.scrollWidth,viewport:window.innerWidth}));
   expect(result.errors).toEqual([]);
   expect(result.width).toBeLessThanOrEqual(result.viewport+2);
   expect(result.requests.some(x=>x.startsWith('/api/medical-staff/'))).toBe(false);
  });
 }
}
test('403 Calendar and Directory stay denied, never display fabricated records',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await mount(page,'clinician',{deny:true});
 const app=page.locator('.mi-espacio');
 await app.getByRole('button',{name:'Abrir calendario'}).click();
 await expect(app.locator('.me-v21-calendar')).toContainText('Acceso denegado por el servidor');
 await expect(app.locator('.me-v26b-day')).toHaveCount(0);
 await app.getByRole('button',{name:'Directorio',exact:true}).click();
 await expect(app.locator('.me-v26b-directory')).toContainText('Acceso denegado por el servidor');
 await expect(app.locator('.me-v20-colleague-card')).toHaveCount(0);
 expect(await page.evaluate(()=>window.__errors)).toEqual([]);
});
