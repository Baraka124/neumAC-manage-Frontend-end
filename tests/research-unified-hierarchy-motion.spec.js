const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const js=fs.readFileSync(path.join(root,'app.js'),'utf8');
const VUE=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
test('one canonical Research section nav and no top-level duplicate back strips',()=>{
 expect((html.match(/aria-label="Research sections"/g)||[])).toHaveLength(1);
 expect(html).toContain('rv31-nav--workspace');
 expect(html).toContain('research-workspace-hierarchy.css');
 expect(js).toContain('const resetResearchScroll = () =>');
 expect(js).toContain('Vue.nextTick(() => {');
 expect(html).not.toContain('<div class="rv32-context-bar"><button class="rv32-back" @click="goToOverview">');
});
async function load(page,width){
 await page.setViewportSize({width,height:750});
 await page.route('**/*',route=>{
  const url=new URL(route.request().url());
  if(url.href.includes('vue.global.prod.js'))return route.fulfill({body:VUE,contentType:'application/javascript'});
  if(url.pathname.includes('/api/'))return route.fulfill({json:{success:true,data:[]}});
  if(url.origin==='http://localhost:8080'){
   const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
   if(fs.existsSync(file)&&fs.statSync(file).isFile()){
    const types={'.js':'application/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
    return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   }
  }
  return route.fulfill({status:404,body:''});
 });
 await page.goto('http://localhost:8080/index.html');
 await page.waitForFunction(()=>Boolean(document.querySelector('#app')?.__vue_app__));
 await page.evaluate(()=>{
   const app=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;
   app.currentUser={id:'research-layout-qa',full_name:'Synthetic QA',user_role:'attending_physician'};
   app.entry.state='ready';
   app.researchLines=[{id:'qa-line',line_number:1,name:'Synthetic research programme',active:true}];
   app.clinicalTrials=Array.from({length:18},(_,i)=>({id:'qa-study-'+i,title:'Synthetic study '+i,status:'active',study_type:'Observational',phase:'Phase II',target_diseases:[]}));
   app.innovationProjects=Array.from({length:6},(_,i)=>({id:'qa-project-'+i,title:'Synthetic project '+i,current_stage:'pilot'}));
   for(const key of ['lines','studies','projects']){app.researchSources[key].status='ready';app.researchSources[key].loaded=true}
   app.currentView='research_hub';app.openResearchPage('overview');
 });
 await expect(page.locator('.rv31-overview')).toBeVisible();
}
for(const width of [390,1366]){
 test('Research navigation position and header rhythm stable at '+width,async({page})=>{
   await load(page,width);
   const nav=page.locator('.rv31-nav--workspace');
   const measure=async()=>page.evaluate(()=>{
     const nav=document.querySelector('.rv31-nav--workspace');
     const hero=document.querySelector('.research-hub .rv31-overview, .research-hub .rv32-collection, .research-hub .rv33-intelligence');
     const header=hero?.querySelector('.module-header');
     const nr=nav.getBoundingClientRect(),hr=header?.getBoundingClientRect();
     return {navTop:nr.top,navHeight:nr.height,headerTop:hr?.top,headerHeight:hr?.height,scrollWidth:document.documentElement.scrollWidth};
   });
   const first=await measure();
   await nav.getByRole('button',{name:'Clinical studies'}).click();
   await expect(page.locator('.rv32-studies')).toBeVisible();
   const second=await measure();
   await nav.getByRole('button',{name:'Clinical innovation'}).click();
   await expect(page.locator('.rv32-innovation')).toBeVisible();
   const third=await measure();
   for(const m of [second,third]){
     expect(Math.abs(m.navTop-first.navTop)).toBeLessThanOrEqual(2);
     expect(Math.abs(m.navHeight-first.navHeight)).toBeLessThanOrEqual(2);
     expect(Math.abs(m.headerTop-first.headerTop)).toBeLessThanOrEqual(3);
     expect(Math.abs(m.headerHeight-first.headerHeight)).toBeLessThanOrEqual(width<640?120:3);
     expect(m.scrollWidth).toBeLessThanOrEqual(width+1);
   }
   expect(await page.locator('.rv31-nav--workspace').count()).toBe(1);
 });
}
