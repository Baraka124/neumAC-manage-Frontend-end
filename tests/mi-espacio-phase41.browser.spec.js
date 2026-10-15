'use strict';
const {test,expect}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
for(const width of [390,1366]){
 test('Phase 41 verified leadership profile is concise with expandable research history '+width,async({page})=>{
 await page.setViewportSize({width,height:850});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
 for(const m of read('index.html').matchAll(/<link[^>]+href="([^"]+\.css)(?:\?[^"]*)?"/g))if(!m[1].startsWith('http'))await page.addStyleTag({content:read(m[1])});
 for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
 await page.evaluate(()=>{
 const user={id:'u',account_status:'active',full_name:'Persona de prueba',medical_staff_id:'staff1',linked_staff:{id:'staff1',full_name:'Persona de prueba',staff_type:'clinician'}};
 const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[{id:'l',name:'Línea verificada',role:'coordinator'}],studies:Array.from({length:11},(_,i)=>({id:'s'+i,title:'Estudio '+i,role:'PI',status:i>=8?'completed':'active'})),projects:[{id:'p',title:'Proyecto dirigido',role:'lead',stage:'active'}]},publications:{available:true,items:[]}};
 const request=u=>{if(u==='/api/auth/me')return Promise.resolve(user);if(u==='/api/me/context')return Promise.resolve(activity);if(u==='/api/me/profile')return Promise.resolve({id:'staff1',full_name:'Persona de prueba',can_be_pi:true,can_supervise_residents:true});if(u==='/api/me/certificates')return Promise.resolve([]);if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies?'))return Promise.resolve([]);throw Error('Unexpected '+u)};
 window.__errors=[];const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'u'},canOpenView:()=>false});app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app')});
 const app=page.locator('.mi-espacio');await expect(app.locator('.me-v9-overview')).toBeVisible();
 await app.getByRole('button',{name:'Perfil profesional',exact:true}).click();
 const profile=app.locator('#me-v28-profile-panel');
 await expect(profile.locator('.me-v18-capabilities, .me-v19-leadership')).toHaveCount(0);
 await expect(profile.getByText('Capacidades reconocidas')).toHaveCount(0);
 await expect(profile.locator('.me-v41-science')).toBeVisible();
 await expect(profile.locator('.me-v35-records').first()).toBeHidden();
 await profile.locator('.me-v41-science>summary').click();
 await expect(profile.locator('.me-v35-records').first().locator('li')).toHaveCount(3);
 await profile.locator('.me-v41-more').first().click();
 await expect(profile.locator('.me-v35-records').first().locator('li')).toHaveCount(8);
 await profile.locator('.me-v41-more').first().click();
 await expect(profile.locator('.me-v35-records').first().locator('li')).toHaveCount(9);
 await profile.getByRole('button',{name:/Participación finalizada/}).click();
 await expect(profile.locator('#me-v35-history-records li')).toHaveCount(3);
 const state=await page.evaluate(()=>({errors:window.__errors,overflow:document.documentElement.scrollWidth-innerWidth}));
 expect(state.errors).toEqual([]);expect(state.overflow).toBeLessThanOrEqual(2);
 });
}
