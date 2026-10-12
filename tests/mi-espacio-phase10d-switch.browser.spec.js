'use strict';
const {test,expect}=require('@playwright/test'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const read=x=>fs.readFileSync(path.join(root,x),'utf8');
test('switching identities clears prior professional activity and rejects stale request',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><main id="app"></main></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const content of [fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8'),read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content});
 await page.evaluate(()=>{
  const records={
   a:{agenda:{guardias:[{id:'duty-a',date:'2026-10-21',shift:'on_call_present',role:'primary'}],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}},
   b:{agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}}
  };
  const makeContext=k=>({id:k,account_status:'active',full_name:k==='a'?'Perfil Antiguo':'Perfil Nuevo',email:k+'@example.invalid',medical_staff_id:'staff-'+k,linked_staff:{id:'staff-'+k,full_name:k==='a'?'Perfil Antiguo':'Perfil Nuevo',staff_type:'clinician'}});
  window.__errors=[];
  const state=Vue.reactive({active:true,user:{id:'a',admin_level:0}});
  let completeOld;
  const oldResponse=new Promise(resolve=>completeOld=resolve);
  const request=(endpoint)=>{
   if(endpoint==='/api/auth/me')return Promise.resolve(makeContext(state.user.id));
   if(endpoint==='/api/me/context')return state.user.id==='a'?oldResponse:Promise.resolve(records.b);
   if(endpoint==='/api/me/discrepancies')return Promise.resolve([]);
   throw Error('Unexpected '+endpoint);
  };
  const view=window.NeumMiEspacio.createView({Vue,API:{request}});
  const App={setup(){return {state}},components:{Personal:view},template:'<Personal :active="state.active" :user="state.user" :canOpenView="()=>false"/>'};
  const app=Vue.createApp(App);app.config.errorHandler=e=>window.__errors.push(String(e));app.mount('#app');
  window.__switchToB=()=>{state.user={id:'b',admin_level:0};};
  window.__completeOld=()=>completeOld(records.a);
 });
 await expect(page.locator('.mi-espacio-person-main')).toContainText('Perfil Antiguo');
 await page.evaluate(()=>window.__switchToB());
 await expect(page.locator('.mi-espacio-person-main')).toContainText('Perfil Nuevo');
 await expect(page.locator('.me-v8-upnext')).toHaveCount(0);
 await page.evaluate(()=>window.__completeOld());
 await expect(page.locator('.me-v8-upnext')).toHaveCount(0);
 await expect(page.locator('.mi-espacio-person-main')).not.toContainText('Perfil Antiguo');
 expect(await page.evaluate(()=>window.__errors)).toEqual([]);
});
