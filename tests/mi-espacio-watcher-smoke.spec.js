const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','mi-espacio','mi-espacio.js'),'utf8');
test('Mi espacio immediate watcher mounts without an iterable previous value',async({page})=>{
 await page.setContent('<div id="app"></div>');
 await page.addScriptTag({content:fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8')});
 await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'..','mi-espacio','mi-espacio-data.js'),'utf8')});
 await page.addScriptTag({content:source});
 const result=await page.evaluate(()=>{
  const errors=[];window.addEventListener('error',e=>errors.push(e.message));
  const component=window.NeumMiEspacio.createView({Vue,API:{request:async()=>({})}});
  const app=Vue.createApp(component,{active:false,user:null,canOpenView:()=>true});
  app.config.errorHandler=e=>errors.push(String(e));
  app.mount('#app');
  return {errors,heading:document.querySelector('#mi-espacio-title')?.textContent};
 });
 expect(result.errors).toEqual([]);
 expect(result.heading).toBe('Mi espacio');
});
