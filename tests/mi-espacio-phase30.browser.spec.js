'use strict';
// Phase 30C: isolated role fixtures verify presentation only; never production data.
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const roleCases={
 head:{role:'head_of_department',type:'clinician'},
 clinician:{role:'clinician',type:'clinician'},
 resident:{role:'resident',type:'medical_resident'},
 engineer:{role:'biomedical_engineer',type:'biomedical_engineer'}
};
for(const [role,identity] of Object.entries(roleCases)){
 for(const width of [390,768,1366]){
  test('Phase 30 institutional composition: '+role+' '+width,async({page})=>{
   await page.setViewportSize({width,height:width===390?844:width===768?900:850});
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
   // Use the same complete production cascade as the Phase 29 tests.
   for(const match of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g)){
    if(!match[1].startsWith('http'))await page.addStyleTag({content:read(match[1])});
   }
   for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
   await page.evaluate(({identity,role})=>{
    const context={id:'phase30-test',account_status:'active',full_name:'Personal de prueba',email:'phase30@example.invalid',job_title:identity.role,medical_staff_id:'staff-phase30',linked_staff:{id:'staff-phase30',full_name:'Personal de prueba',staff_type:identity.type}};
    const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}};
    if(role==='head'){activity.research.lines=[{id:'l',name:'Línea respiratoria',role:'coordinator'}];activity.research.studies=[{id:'s',title:'Estudio institucional',role:'PI'}]}
    if(role==='clinician'){activity.agenda.guardias=[{id:'g',date:'2026-10-22',shift:'on_call_present',role:'primary'}];activity.agenda.rotations=[{id:'sr',role:'supervisor',resident:'Residente de prueba',unit:'Unidad de neumología',start:'2026-11-01',end:'2026-12-01'}]}
    if(role==='resident'){activity.agenda.rotations=[{id:'r',role:'resident',unit:'Unidad de prueba',start:'2026-11-01',end:'2026-12-01'}]}
    if(role==='engineer'){activity.research.projects=[{id:'p',title:'Proyecto de investigación en ingeniería',role:'lead'}]}
    const request=uri=>{
     if(uri==='/api/auth/me')return Promise.resolve(context);
     if(uri==='/api/me/context')return Promise.resolve(activity);
     if(uri==='/api/me/discrepancies'||uri.startsWith('/api/discrepancies?'))return Promise.resolve([]);
     if(uri==='/api/me/colleagues')return Promise.resolve([]);
     if(uri.startsWith('/api/me/calendar'))return Promise.resolve({month:'2026-10',events:[]});
     throw Error('Unexpected endpoint: '+uri);
    };
    window.__phase30errors=[];window.addEventListener('error',e=>window.__phase30errors.push(e.message));
    const comp=window.NeumMiEspacio.createView({Vue,API:{request}});
    const app=Vue.createApp(comp,{active:true,user:{id:'phase30-test'},canOpenView:()=>false});
    app.config.errorHandler=e=>window.__phase30errors.push(String(e));app.mount('#app');
   },{identity,role});
   const app=page.locator('.mi-espacio');
   await expect(app.locator('.me-v22-identity')).toBeVisible();
   await expect(app.locator('.me-v9-overview')).toBeVisible();
   const css=await app.evaluate(el=>{
    const style=e=>getComputedStyle(e);
    const q=s=>el.querySelector(s);
    const panel=q('.me-v9-panel'),quick=q('.me-v20-quick-bar');
    return {font:style(el).fontFamily,line:parseFloat(style(el).lineHeight),panelBorderLeft:style(panel).borderLeftWidth,
     panelBackground:style(panel).backgroundColor,quickDisplay:style(quick).display,
     doc:document.documentElement.scrollWidth,viewport:innerWidth,errors:window.__phase30errors};
   });
   expect(css.font).toContain('DM Sans');
   expect(css.line).toBeGreaterThanOrEqual(22);
   expect(css.quickDisplay).toBe('grid');
   expect(css.doc).toBeLessThanOrEqual(css.viewport+2);
   expect(css.errors).toEqual([]);
   const buttons=await app.locator('.me-v20-quick-bar>button').all();
   for(const b of buttons){const rect=await b.boundingBox();expect(rect.height).toBeGreaterThanOrEqual(44)}
   if(width<=768)expect(css.panelBorderLeft).toBe('0px');
   await app.getByRole('button',{name:'Perfil profesional',exact:true}).click();
   await expect(app.locator('#me-v28-profile-panel')).toBeVisible();
   await expect(app.locator('#me-v26c-profile-trigger')).toHaveAttribute('aria-expanded','true');
   await app.locator('#me-v26c-profile-trigger').click();
   await expect(app.locator('#me-v28-profile-panel')).toHaveCount(0);
   await page.screenshot({path:test.info().outputPath(role+'-'+width+'.png'),fullPage:true});
  });
 }
}
