'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..'),read=x=>fs.readFileSync(path.join(root,x),'utf8');
const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const duty=(i)=>({id:'d'+i,date:'2026-10-'+String(18+i).padStart(2,'0'),shift:'on_call_present',role:'primary'});
const long='Estudio multicéntrico de caracterización longitudinal respiratoria y validación de biomarcadores en cohortes hospitalarias complejas';
const pub=i=>({id:'p'+i,title:long+' · publicación '+i,byline:'García M, Fernández A, López B, Rodríguez C, et al.',author_order:i,corresponding:i===1});
const base=()=>({agenda:{guardias:[],rotations:[],absences:[]},research:{lines:[],studies:[],projects:[]},publications:{available:true,items:[]}});
const cases={
 resident:()=>{const a=base();a.agenda.rotations=[{id:'r1',role:'resident',unit:'UCI',start:'2026-11-01',end:'2027-01-03'}];return {a,staffType:'medical_resident'};},
 clinician:()=>({a:base(),staffType:'clinician'}),
 supervisor:()=>{const a=base();a.agenda.rotations=[{id:'r2',role:'supervisor',resident:'Persona residente',unit:'Neumología',start:'2026-11-01',end:'2026-11-01'}];return {a,staffType:'clinician'};},
 dutyOrder:()=>{const a=base();a.agenda.guardias=[{...duty(3)},{...duty(0)},{...duty(2)}];return {a,staffType:'clinician'};},
 mixed:()=>{const a=base();a.agenda.guardias=[duty(0)];a.research.lines=[{id:'l1',name:'Fisiología respiratoria',role:'member'}];a.research.studies=[0,1].map(i=>({id:'s'+i,title:long+' '+i,role:'co-investigator'}));a.research.projects=[{id:'p1',title:'Programa de innovación respiratoria',role:'lead'}];a.publications.items=[1,2,3,4].map(pub);return {a,staffType:'clinician'};},
 engineer:()=>{const a=base();a.research.studies=[{id:'s1',title:long,role:'co-investigator',protocol_id:'ST-001'}];return {a,staffType:'biomedical_engineer'};},
 head:()=>{const a=base();a.agenda.guardias=[duty(0),duty(1),duty(2),duty(3)];a.research.lines=[{id:'l1',name:long,role:'coordinator'}];a.research.studies=[0,1,2,3].map(i=>({id:'s'+i,title:long+' '+i,role:'PI'}));a.research.projects=[0,1,2].map(i=>({id:'i'+i,title:long+' '+i,role:'lead',stage:'pilot'}));a.publications.items=[1,2,3,4].map(pub);return {a,staffType:'clinician'};}
};
async function mount(page,kind){
 const {a,staffType}=cases[kind]();
 await page.setContent('<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#fafcfb;font-family:Arial,sans-serif"><main id="app"></main></body></html>');
 await page.addStyleTag({content:read('mi-espacio/mi-espacio.css')});
 await page.addScriptTag({content:vue});
 await page.addScriptTag({content:read('mi-espacio/mi-espacio-data.js')});
 await page.addScriptTag({content:read('mi-espacio/mi-espacio.js')});
 await page.evaluate(({a,staffType})=>{
  const context={id:'test-user',account_status:'active',full_name:'Persona de Prueba',email:'test@example.invalid',medical_staff_id:'staff-1',linked_staff:{id:'staff-1',full_name:'Persona de Prueba',staff_type:staffType}};
  const request=endpoint=>{
   if(endpoint==='/api/auth/me')return Promise.resolve(context);
   if(endpoint==='/api/me/context')return Promise.resolve(a);
   if(endpoint==='/api/me/discrepancies')return Promise.resolve([]);
   if(endpoint.startsWith('/api/discrepancies?'))return Promise.resolve([]);
   throw new Error('Unexpected endpoint '+endpoint);
  };
  window.__issues=[];window.addEventListener('error',e=>window.__issues.push(e.message));
  const view=window.NeumMiEspacio.createView({Vue,API:{request}});
  const app=Vue.createApp(view,{active:true,user:{id:'test-user',admin_level:0},canOpenView:()=>false});
  app.config.errorHandler=e=>window.__issues.push(String(e));app.mount('#app');
 },{a,staffType});
 await expect(page.locator('.me-v9-identity')).toBeVisible();
 await expect(page.locator('.me-activity-placeholder')).toHaveCount(0);
}
for(const [name,scenario] of Object.entries(cases)){
 for(const viewport of [{width:390,height:844,label:'phone'},{width:1366,height:900,label:'desktop'}]){
  test(name+' personal role display '+viewport.label,async({page},info)=>{
   test.setTimeout(45000);
   await page.setViewportSize({width:viewport.width,height:viewport.height});
   await mount(page,name);
   const a=scenario().a;
   await expect(page.locator('.me-v9-identity')).toBeVisible();
   if(name==='dutyOrder'){
     await expect(page.locator('.me-v8-upnext')).toContainText('18 de octubre de 2026');
     await expect(page.locator('.me-v9-timeline li').first()).toContainText('20 de octubre de 2026');
   }
   if(name==='resident'){await expect(page.locator('.me-v10-rotation-feature')).toContainText('UCI');await expect(page.locator('.me-v9-identity')).toContainText('Médico/a residente');}
   if(name==='supervisor')await expect(page.locator('.me-v10-supervision-feature')).toContainText('Persona residente');
   if(name==='engineer'){await expect(page.locator('.me-v8-agenda')).toHaveCount(0);await expect(page.locator('.me-v8-research')).toBeVisible();await expect(page.locator('.me-v9-identity')).toContainText('Ingeniería biomédica');}
   if(name==='clinician'){await expect(page.locator('.me-v8-research')).toHaveCount(0);await expect(page.locator('.me-v8-agenda')).toBeVisible();}
   if(name==='mixed'){
    await expect(page.locator('.me-v9-overview')).toHaveClass(/me-v12-research-priority/);
    const measurements=await page.evaluate(()=>{
      const agenda=document.querySelector('.me-v8-agenda').getBoundingClientRect();
      const research=document.querySelector('.me-v8-research').getBoundingClientRect();
      const publications=document.querySelector('.me-v9-publications').getBoundingClientRect();
      const communications=document.querySelector('.me-v9-services').getBoundingClientRect();
      return {agenda:agenda.width,research:research.width,publications:publications.width,communications:communications.width};
    });
    if(viewport.width>850){
      expect(measurements.research).toBeGreaterThan(measurements.agenda);
      expect(Math.abs(measurements.publications-measurements.communications)).toBeLessThanOrEqual(2);
    }else{
      expect(Math.abs(measurements.research-measurements.agenda)).toBeLessThanOrEqual(2);
      expect(Math.abs(measurements.publications-measurements.communications)).toBeLessThanOrEqual(2);
    }
   }
   const context=page.locator('.me-v12c-context');
   const categories=['guardias','rotaciones','supervisiones','estudios','proyectos','líneas de investigación','publicaciones'];
   const nonempty=(a.agenda.guardias.length?1:0)+(a.agenda.rotations.filter(r=>r.role==='resident').length?1:0)+(a.agenda.rotations.filter(r=>r.role==='supervisor').length?1:0)+(a.research.studies.length?1:0)+(a.research.projects.length?1:0)+(a.research.lines.length?1:0)+(a.publications.items.length?1:0);
   if(nonempty===0)await expect(context).toHaveCount(0);
   else {
     await expect(context).toBeVisible();
     const txt=await context.innerText();
     if(nonempty>3)expect(txt).toContain((nonempty-3)+' áreas más');
     else expect(txt).not.toContain('áreas más');
   }
   if(name==='head'){
    await expect(page.locator('.me-v8-research-groups li')).toHaveCount(5);
    await page.getByRole('button',{name:/Ver toda mi investigación/}).click();
    await expect(page.locator('.me-v8-research-groups li')).toHaveCount(8);
    await expect(page.locator('.me-v8-publication-list li')).toHaveCount(3);
    await page.getByRole('button',{name:/Ver todas mis publicaciones/}).click();
    await expect(page.locator('.me-v8-publication-list li')).toHaveCount(4);
   }
   if(a.publications.items.length>0)await expect(page.getByText('No hay publicaciones vinculadas a tu perfil.')).toHaveCount(0);
   const geo=await page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,issues:window.__issues}));
   expect(geo.width).toBeLessThanOrEqual(geo.viewport+2);expect(geo.issues).toEqual([]);
   await info.attach(name+'-'+viewport.label+'.png',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  });
 }
}
