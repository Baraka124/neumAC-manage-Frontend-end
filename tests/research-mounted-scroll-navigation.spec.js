// Research navigation / scroll gate against mounted application, not extracted CSS.
// Synthetic nonclinical records only; authenticated release gates remain separate.
const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const VUE=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
const studies=Array.from({length:24},(_,i)=>({
  id:'research-scroll-fixture-'+i,title:'Synthetic respiratory research study '+(i+1),
  protocol_id:'TEST-'+(i+1),research_line_id:null,status:i%4?'active':'recruiting',
  phase:'Phase II',study_type:'Observational',target_diseases:[],
  protocol_finalized:false,ethics_status:null,principal_investigator_id:null
}));
async function mount(page,width){
  await page.setViewportSize({width,height:680});
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.href.includes('vue.global.prod.js'))
      return route.fulfill({body:VUE,contentType:'application/javascript'});
    if(url.pathname.startsWith('/api/'))
      return route.fulfill({json:{success:true,data:[]}});
    if(url.origin==='http://localhost:8080'){
      const file=path.join(root,url.pathname==='/'?'index.html':url.pathname);
      if(fs.existsSync(file)&&fs.statSync(file).isFile()){
        const types={'.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml',
          '.html':'text/html','.json':'application/json','.png':'image/png','.woff2':'font/woff2'};
        return route.fulfill({body:fs.readFileSync(file),contentType:types[path.extname(file)]||'application/octet-stream'});
      }
    }
    return route.fulfill({status:404,body:''});
  });
  await page.goto('http://localhost:8080/index.html');
  await page.waitForFunction(()=>Boolean(document.querySelector('#app')?.__vue_app__));
  await page.evaluate(records=>{
    const app=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;
    app.currentUser={id:'research-nav-qa',full_name:'QA Fixture',user_role:'attending_physician'};
    app.entry.state='ready';
    app.researchLines=[];
    app.clinicalTrials=records;
    app.innovationProjects=[{id:'project-fixture',title:'Synthetic innovation project',current_stage:'pilot',research_line_id:null}];
    for(const key of ['lines','studies','projects']){
      app.researchSources[key].status='ready';
      app.researchSources[key].loaded=true;
    }
    app.currentView='research_hub';
    app.openResearchPage('allstudies');
  },studies);
  await expect(page.locator('.rv32-studies .rv32-study-row')).toHaveCount(studies.length);
  await expect(page.locator('.rv31-nav--persistent')).toBeVisible();
}
for(const width of [390,1366]){
 test('mounted Research switches sections and keeps navigation out of scrolled records at '+width,async({page})=>{
  await mount(page,width);
  const navigation=page.locator('.rv31-nav--persistent');
  await expect(navigation.getByRole('button',{name:'Clinical studies'})).toHaveAttribute('aria-current','page');
  await navigation.getByRole('button',{name:'Clinical innovation'}).click();
  await expect(page.locator('.rv32-innovation')).toBeVisible();
  await navigation.getByRole('button',{name:'Clinical studies'}).click();
  await expect(page.locator('.rv32-studies .rv32-study-row')).toHaveCount(studies.length);
  const before=await page.evaluate(()=>{
    const bar=document.querySelector('.rv32-studies .rv32-context-bar');
    const nav=document.querySelector('.rv31-nav--persistent');
    const states={nav:getComputedStyle(nav).position,context:getComputedStyle(bar).position};
    let target=bar.parentElement;
    while(target && target!==document.body){
      const css=getComputedStyle(target);
      if(/auto|scroll/.test(css.overflowY) && target.scrollHeight>target.clientHeight+200)break;
      target=target.parentElement;
    }
    const isElement=!!(target&&target!==document.body);
    const scroller=isElement?target:document.scrollingElement;
    window.__researchScrollElement=scroller;
    return {top:bar.getBoundingClientRect().top,states,isElement,
      scrollable:scroller.scrollHeight-scroller.clientHeight};
  });
  expect(before.states.nav).toBe('static');
  expect(before.states.context).toBe('static');
  expect(before.scrollable).toBeGreaterThan(250);
  const after=await page.evaluate(()=>{
    const el=window.__researchScrollElement;
    el.scrollTop=450;
    const bar=document.querySelector('.rv32-studies .rv32-context-bar');
    return {scrollTop:el.scrollTop,barTop:bar.getBoundingClientRect().top};
  });
  expect(after.scrollTop).toBeGreaterThan(300);
  expect(after.barTop-before.top).toBeLessThan(-300);
 });
}
