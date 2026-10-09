const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const VUE=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
test('Library owns Ctrl+K while Research retains the global palette',async({page})=>{
 await page.route('**/*',r=>{
  const u=new URL(r.request().url());
  if(u.href.includes('vue.global.prod.js'))return r.fulfill({body:VUE,contentType:'application/javascript'});
  if(u.pathname.includes('/api/'))return r.fulfill({json:{data:[]}});
  if(u.origin==='http://localhost:8080'){
   const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);
   if(fs.existsSync(f))return r.fulfill({body:fs.readFileSync(f),contentType:f.endsWith('.js')?'application/javascript':f.endsWith('.css')?'text/css':f.endsWith('.svg')?'image/svg+xml':'text/html'});
  }
  return r.fulfill({body:''});
 });
 await page.goto('http://localhost:8080/index.html');
 await page.waitForFunction(()=>document.querySelector('#app').__vue_app__);
 const state=()=>page.evaluate(()=>{const a=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;return {global:a.cmdPaletteOpen,library:a.newsCommand.show}});
 await page.evaluate(()=>{const a=document.querySelector('#app').__vue_app__._container._vnode.component.proxy;a.currentView='news';a.cmdPaletteOpen=false;a.newsCommand.show=false});
 await page.keyboard.press('Control+k');
 await expect.poll(state).toEqual({global:false,library:true});
 await page.keyboard.press('Escape');
 await expect.poll(state).toEqual({global:false,library:false});
 await page.evaluate(()=>{document.querySelector('#app').__vue_app__._container._vnode.component.proxy.currentView='research_hub'});
 await page.keyboard.press('Control+k');
 await expect.poll(state).toEqual({global:true,library:false});
});
test('Library can clear a line, author or year filter on its own',async({page})=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const template=await page.evaluate(html=>new DOMParser().parseFromString(html,'text/html').querySelector('.news-v25-filter-panel').outerHTML,html);
 for(const key of ['line','author','year']){
  await page.setContent('<div id="test"></div>');await page.addScriptTag({content:VUE});
  await page.evaluate(({template,key})=>{window.fixture=Vue.createApp({data:()=>({newsLibraryFiltersOpen:true,newsFilters:{type:'',status:'',scope:'',search:'',line:'',author:'',year:'',[key]:'selected'}}),template}).mount('#test')},{template,key});
  await page.getByRole('button',{name:'Clear filters',exact:true}).click();
  expect(await page.evaluate(()=>Object.values(window.fixture.newsFilters).every(v=>v===''))).toBe(true);
  await expect(page.getByRole('button',{name:'Clear filters',exact:true})).toHaveCount(0);
 }
});
