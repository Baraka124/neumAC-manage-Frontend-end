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
 await page.addScriptTag({content:read('mi-espacio/mi-espacio-workspace.js')});
 await page.addScriptTag({content:read('mi-espacio/mi-espacio.js')});
 await page.evaluate(({a,staffType})=>{
  const context={id:'test-user',account_status:'active',full_name:'Persona de Prueba',email:'test@example.invalid',medical_staff_id:'staff-1',linked_staff:{id:'staff-1',full_name:'Persona de Prueba',staff_type:staffType}};
  const request=endpoint=>{
   if(endpoint==='/api/auth/me')return Promise.resolve(context);
   if(endpoint==='/api/me/context')return Promise.resolve(a);
   if(endpoint==='/api/me/discrepancies')return Promise.resolve([]);
   if(endpoint==='/api/me/profile')return Promise.resolve({
     id:'staff-1',full_name:'Persona de Prueba',professional_email:'professional@example.invalid',
     public_bio:'Texto verificado',is_public:false,notification_prefs:{}
   });
   if(endpoint==='/api/me/certificates')return Promise.resolve([]);
   if(endpoint.startsWith('/api/me/calendar')){
     const month=new URL('https://test.invalid'+endpoint).searchParams.get('month') ||
       new Date().getFullYear()+'-'+String(new Date().getMonth()+1).padStart(2,'0');
     return Promise.resolve({month,events:[{id:'c-1',date:month+'-14',title:'Guardia verificada',type:'guardia',status:'confirmada'}]});
   }
   if(endpoint==='/api/me/colleagues')return Promise.resolve([{id:'staff-2',name:'Profesional Visible',title:'Neumología',department:'Servicio autorizado',bio:'Información profesional pública'}]);
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
 for(const viewport of [{width:390,height:844,label:'phone'},{width:768,height:1024,label:'tablet'},{width:1366,height:900,label:'desktop'}]){
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
   // Phase 22: context pills replaced the old .me-v12c-context plain text line
   const contextPills=page.locator('.me-v22-context-pills');
   const nonempty=(a.agenda.guardias.length?1:0)+(a.agenda.rotations.filter(r=>r.role==='resident').length?1:0)+(a.agenda.rotations.filter(r=>r.role==='supervisor').length?1:0)+(a.research.studies.length?1:0)+(a.research.projects.length?1:0)+(a.research.lines.length?1:0)+(a.publications.items.length?1:0);
   if(nonempty===0)await expect(contextPills).toHaveCount(0);
   else {
     await expect(contextPills).toBeVisible();
     const pills=await page.locator('.me-v22-context-pill').count();
     expect(pills).toBe(Math.min(nonempty,3));
     const overflow=page.locator('.me-v22-context-more');
     if(nonempty>3)await expect(overflow).toContainText('+'+(nonempty-3)+' áreas vinculadas');
     else await expect(overflow).toHaveCount(0);
   }
   if(name==='head' || name==='clinician'){
     const app=page.locator('.mi-espacio');
     await page.getByRole('button',{name:'Abrir calendario'}).click();
     await expect(app.locator('.me-v21-calendar.me-v26b-workspace')).toBeVisible();
     await expect(app.locator('.me-v9-overview')).toHaveCount(0);
     await expect(app.locator('.me-v26b-workspace-title')).toBeFocused();
     // Selecting a verified day opens a contextual detail without reopening the overview.
     const withEvent=app.locator('.me-v26b-day').filter({hasText:'eventos'}).first();
     await withEvent.click();
     await expect(app.locator('.me-v26b-detail')).toContainText('Guardia verificada');
     await page.keyboard.press('Escape');
     await expect(app.locator('.me-v26b-detail')).toContainText('Selecciona un día');
     await page.getByRole('button',{name:'Directorio',exact:true}).click();
     await expect(app.locator('.me-v20-colleagues.me-v26b-workspace')).toBeVisible();
     await expect(app.locator('.me-v21-calendar')).toHaveCount(0);
     await expect(app.locator('.me-v9-overview')).toHaveCount(0);
     await app.getByRole('button',{name:/Profesional Visible/}).click();
     await expect(app.locator('.me-v26b-staff-detail')).toContainText('Información profesional pública');
     await app.getByRole('button',{name:'← Volver a resultados'}).click();
     await expect(app.locator('.me-v26b-staff-detail')).toContainText('Selecciona un profesional');
     await page.getByRole('button',{name:'Notificaciones'}).click();
     await expect(app.locator('.me-v21-notifications')).toBeVisible();
     await expect(app.locator('.me-v20-colleagues')).toHaveCount(0);
     await expect(app.locator('.me-v9-overview')).toBeVisible();
   }
   if(name==='head' || name==='clinician'){
     const app=page.locator('.mi-espacio');
     await page.getByRole('button',{name:/Mi perfil completo/}).click();
     await expect(app.locator('.me-v26c-profile')).toBeVisible();
     await expect(app.locator('.me-v9-overview')).toHaveCount(0);
     await expect(app.locator('.me-readonly-value')).toContainText('professional@example.invalid');
     await app.locator('#me-profile-bio').fill('Biografía modificada');
     await expect(app.getByText('Tienes cambios sin guardar.')).toBeVisible();
     await app.getByRole('button',{name:'Volver a Mi espacio'}).click();
     await expect(app.getByText('Cambios sin guardar')).toBeVisible();
     await app.getByRole('button',{name:'Seguir editando'}).click();
     await expect(app.locator('#me-profile-bio')).toHaveValue('Biografía modificada');
     await app.getByRole('button',{name:'Cancelar',exact:true}).click();
     await app.getByRole('button',{name:'Descartar y salir'}).click();
     await expect(app.locator('.me-v26c-profile')).toHaveCount(0);
     await expect(app.locator('.me-v9-overview')).toBeVisible();
   }
   if(name==='head' && viewport.width>850){
     await expect(page.locator('.mi-espacio')).toHaveClass(/me-v25-leadership/);
     const sizes=await page.evaluate(()=>({
       agenda:document.querySelector('.me-v8-agenda').getBoundingClientRect().width,
       research:document.querySelector('.me-v8-research').getBoundingClientRect().width
     }));
     expect(sizes.research).toBeGreaterThan(sizes.agenda);
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
