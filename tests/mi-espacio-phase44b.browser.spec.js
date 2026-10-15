'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const vue=read('node_modules/vue/dist/vue.global.prod.js');
const isoAfter=days=>{const d=new Date();d.setDate(d.getDate()+days);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};

async function mount(page,number,width){
 await page.setViewportSize({width,height:840});
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0"><div id="app"></div></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const code of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:code});
 const dutyDates=Array.from({length:number},(_,i)=>isoAfter(3+i*2));
 await page.evaluate(dates=>{
   const account={id:'phase44b',account_status:'active',full_name:'Personal clínico de prueba',medical_staff_id:'clinical44b',linked_staff:{id:'clinical44b',full_name:'Personal clínico de prueba',staff_type:'clinician'}};
   const context={agenda:{guardias:dates.map((date,i)=>({id:'duty'+i,date,shift:'on_call_present',role:'primary'})),rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}};
   const request=u=>{
    if(u==='/api/auth/me')return Promise.resolve(account);
    if(u==='/api/me/context')return Promise.resolve(context);
    if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies'))return Promise.resolve([]);
    throw Error('Unexpected '+u);
   };
   window.__errors44b=[];const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'phase44b'},canOpenView:()=>false});
   app.config.errorHandler=e=>window.__errors44b.push(String(e));app.mount('#app');
 },dutyDates);
 const area=page.locator('.mi-espacio');
 await expect(area.locator('.me-v9-overview')).toBeVisible();
 return {area,dutyDates};
}

for(const width of [390,1366]){
 for(const number of [0,1,3,4,12]){
  test('Phase 44B authenticated guardia composition '+number+' items at '+width+'px',async({page})=>{
   const {area,dutyDates}=await mount(page,number,width);
   const featured=area.locator('.me-v44b-next-duty'),rows=area.locator('#me-v28c-guardias>li'),more=area.locator('.me-v44b-guardias-toggle');
   if(!number){await expect(featured).toHaveCount(0);await expect(more).toHaveCount(0);}
   else{
    await expect(featured).toBeVisible();
    await expect(featured.locator('time')).toHaveAttribute('datetime',dutyDates[0]);
    const full=new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'long',year:'numeric'}).format(new Date(Number(dutyDates[0].slice(0,4)),Number(dutyDates[0].slice(5,7))-1,Number(dutyDates[0].slice(8,10))));
    await expect(featured.locator('.me-v44b-date-context small')).toHaveText(full);
    await expect(area.locator('.me-v9-verified-count')).toContainText(number+' guardia');
    await expect(rows).toHaveCount(Math.min(number-1,2));
    if(number>1)await expect(rows.first().locator('time')).toHaveAttribute('datetime',dutyDates[1]);
    if(number<=3)await expect(more).toHaveCount(0);
    else{
     await expect(more).toBeVisible();
     await expect(more).toHaveAttribute('aria-expanded','false');
     await expect(more).toContainText('Ver '+Math.min(number-3,5)+' guardia');
     await more.focus();await page.keyboard.press('Enter');
     await expect(more).toHaveAttribute('aria-expanded','true');
     await expect(rows).toHaveCount(Math.min(number-1,7));
     if(number>8){await more.click();await expect(rows).toHaveCount(number-1);}
     await more.click();await expect(rows).toHaveCount(2);
     await expect(more).toHaveAttribute('aria-expanded','false');
    }
   }
   const state=await page.evaluate(()=>({errors:window.__errors44b,overflow:document.documentElement.scrollWidth-innerWidth}));
   expect(state.errors).toEqual([]);expect(state.overflow).toBeLessThanOrEqual(2);
  });
 }
}
