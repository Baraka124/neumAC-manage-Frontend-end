const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('Research collections explain filtered zero results and offer complete reset',async({page})=>{
 const items=await page.evaluate(src=>{
  const d=new DOMParser().parseFromString(src,'text/html');
  return [...d.querySelectorAll('.rv32-record-list .rv32-empty')].slice(0,2).map(x=>x.outerHTML);
 },html);
 expect(items).toHaveLength(2);
 const cases=[
  {fragment:items[0],rows:'clinicalTrials',filters:'trialFilters',reset:'Clear study filters',fields:['search','line','phase','status']},
  {fragment:items[1],rows:'innovationProjects',filters:'projectFilters',reset:'Clear project filters',fields:['search','research_line_id','funding_status','stage','category']}
 ];
 for(const c of cases){
  await page.setContent('<div id="mount"></div>');
  const vue=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');
  await page.addScriptTag({content:vue});
  await page.evaluate(c=>{
   const reactive=Object.fromEntries(c.fields.map(k=>[k,'']));
   reactive[c.fields[0]]='does-not-match';
   const component={data(){return {[c.rows]:[{id:'synthetic'}],[c.filters]:reactive,filteredTrialsAll:[],filteredProjectsAll:[],researchSources:{studies:{status:'ready'},projects:{status:'ready'}}}},template:c.fragment};
   window.fixture=Vue.createApp(component).mount('#mount');
  },c);
  await expect(page.getByRole('button',{name:c.reset})).toBeVisible();
  await page.getByRole('button',{name:c.reset}).click();
  const reset=await page.evaluate(fields=>fields.every(k=>window.fixture[c.filters]?.[k]===''),c.fields).catch(()=>false);
  // Read component state without depending on the DOM of the larger app.
  const values=await page.evaluate(({filters,fields})=>fields.map(k=>window.fixture[filters][k]),c);
  expect(values).toEqual(c.fields.map(()=>''));
 }
});
