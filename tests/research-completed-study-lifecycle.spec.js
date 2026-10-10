const {test,expect}=require('@playwright/test');
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const vueSource=fs.readFileSync(require.resolve('vue/dist/vue.global.prod.js'),'utf8');

async function mountStudyFragments(page,status){
  const fragment=await page.evaluate(source=>{
    const root=new DOMParser().parseFromString(source,'text/html').querySelector('.rv32-study-row');
    if(!root)throw new Error('Study row not found');
    const gov=root.querySelector('.rv32-row-governance');
    const recruitment=[...root.children].filter(e=>e.classList.contains('rv32-row-recruitment'));
    if(!gov||recruitment.length!==3)throw new Error('Expected governance and all three recruitment branches');
    return '<section>'+gov.outerHTML+recruitment.map(e=>e.outerHTML).join('')+'</section>';
  },src);
  await page.setContent('<main id="mount"></main>');
  await page.addScriptTag({content:vueSource});
  const state=await page.evaluate(({fragment,status})=>{
    const app=Vue.createApp({
      data:()=>({trial:{id:1,title:'Test study',protocol_finalized:false,ethics_status:null,principal_investigator_id:null}}),
      methods:{trialStatusKey(){return status},trialEnrollment(){return null},formatEthicsStatus(value){return value}},
      template:fragment
    });
    app.config.errorHandler=e=>{window.fixtureError=String(e)};
    app.mount('#mount');
    return {error:window.fixtureError||null,html:document.querySelector('#mount').innerHTML};
  },{fragment,status});
  expect(state.error,state.html).toBeNull();
}

test('completed study shows historical lifecycle rather than active requirements',async({page})=>{
  await mountStudyFragments(page,'done');
  await expect(page.getByText('Study record')).toBeVisible();
  await expect(page.getByText('Study lifecycle')).toBeVisible();
  await expect(page.getByText('Protocol pending')).toHaveCount(0);
  await expect(page.getByText('Target not recorded')).toHaveCount(0);
});

test('active study retains outstanding requirements and recruitment context',async({page})=>{
  await mountStudyFragments(page,'active');
  await expect(page.getByText('Study requirements')).toBeVisible();
  await expect(page.getByText('Protocol pending')).toBeVisible();
  await expect(page.getByText('Target not recorded')).toBeVisible();
  await expect(page.getByText('Study lifecycle')).toHaveCount(0);
});
