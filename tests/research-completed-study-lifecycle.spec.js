const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
test('completed study list row is archival, while active study requirements stay available',async({page})=>{
 const fragment=await page.evaluate(source=>new DOMParser().parseFromString(source,'text/html').querySelector('.rv32-study-row').outerHTML,src);
 await page.setContent('<main id="mount"></main>');
 await page.addScriptTag({content:fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8')});
 await page.evaluate(fragment=>{
  window.study=Vue.createApp({data:()=>({trial:{id:1,title:'Finished study',protocol_finalized:false,ethics_status:null,principal_investigator_id:null}}),methods:{trialStatusKey(){return 'done'},trialEnrollment(){return null},getResearchLineName(){return ''},openStudy(){},formatEthicsStatus(v){return v}},template:fragment.replace('v-for="trial in filteredTrialsAll"','')}).mount('#mount');
 },fragment);
 await expect(page.getByText('Study record')).toBeVisible();
 await expect(page.getByText('Study lifecycle')).toBeVisible();
 await expect(page.getByText('Protocol pending')).toHaveCount(0);
 await expect(page.getByText('Target not recorded')).toHaveCount(0);
});
test('completed state is conditional, not removal of operational requirements',()=>{
 expect(src).toContain('trialStatusKey(trial)===\'done\' ? \'Study record\' : \'Study requirements\'');
 expect(src).toContain('v-else><b :class="{ok:trial.protocol_finalized}"');
});
