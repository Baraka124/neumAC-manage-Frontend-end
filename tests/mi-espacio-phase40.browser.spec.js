'use strict';const {test,expect}=require('@playwright/test'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
test('large Mi Espacio research collections reveal progressively in place at desktop and mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.setContent('<main id="app"></main>');await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 for(const x of [vue,read('mi-espacio/mi-espacio-data.js'),read('mi-espacio/mi-espacio-workspace.js'),read('mi-espacio/mi-espacio.js')])await page.addScriptTag({content:x});
 await page.evaluate(()=>{const context={id:'p',account_status:'active',full_name:'Test user',medical_staff_id:'s',linked_staff:{id:'s',full_name:'Test user',staff_type:'biomedical_engineer'}};
 const activity={agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:Array.from({length:12},(_,i)=>({id:'s'+i,title:'Estudio '+i,role:'co-investigator',status:i===11?'active':'planned'})),projects:Array.from({length:13},(_,i)=>({id:'p'+i,title:'Proyecto '+i,role:'lead',stage:i===12?'completed':'active'}))},publications:{available:true,items:[]}};
 const request=u=>{if(u==='/api/auth/me')return Promise.resolve(context);if(u==='/api/me/context')return Promise.resolve(activity);if(u==='/api/me/discrepancies'||u.startsWith('/api/discrepancies'))return Promise.resolve([]);throw Error('Unexpected '+u)};
 window.__issues=[];const app=Vue.createApp(NeumMiEspacio.createView({Vue,API:{request}}),{active:true,user:{id:'p'},canOpenView:()=>false});app.config.errorHandler=e=>window.__issues.push(String(e));app.mount('#app')});
 const studies=page.locator('#me-v28-studies>li'),projects=page.locator('#me-v28-projects>li');
 await expect(studies).toHaveCount(2);await expect(studies.first()).toContainText('Estudio 11');await expect(projects).toHaveCount(2);
 const more=page.getByRole('button',{name:/Estudios 12/});await more.click();await expect(studies).toHaveCount(7);await more.click();await expect(studies).toHaveCount(12);await studies.first().locator('summary').click();await expect(studies.first().locator('dl')).toBeVisible();
 await more.click();await expect(studies).toHaveCount(2);await expect(projects).toHaveCount(2);
 const state=await page.evaluate(()=>({issues:window.__issues,overflow:document.documentElement.scrollWidth-innerWidth}));expect(state.issues).toEqual([]);expect(state.overflow).toBeLessThanOrEqual(2);
});