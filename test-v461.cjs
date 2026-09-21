const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const code=fs.readFileSync(__dirname+'/app.js','utf8');
const section=(a,b)=>code.slice(code.indexOf(a),code.indexOf(b,code.indexOf(a)));
const ref=()=>({value:[]});
const c={console,AbortController,setTimeout,clearTimeout,currentUser:{value:{id:'u'}},askBar:{turns:[],context:{type:'research_record',id:'paper'}},medicalStaff:ref(),onCallSchedule:ref(),absences:ref(),rotations:ref(),trainingUnits:ref(),newsPosts:ref(),researchOps:{researchLines:ref(),clinicalTrials:ref(),innovationProjects:ref()},Utils:{normalizeDate:v=>v},askBarNow:()=> '12:00',API:{request:async p=>{if(p.includes('/oncall'))throw Error('A server error occurred.');return {data:[{id:'fresh'}]}}},Vue:{reactive:x=>x},hasPermission:()=>true,askBarMatchIntent:()=> 'unknown',askBarIntentModule:{},askBarBuildFollowup:()=>({text:'Verified publication',sources:['Research Library']}),askBarBuildAnswer:()=>{throw Error('unexpected builder')},askBarStreamTurn:(t,text)=>t.text=text};
vm.createContext(c);
vm.runInContext(section('      let askBarRefreshGeneration = 0','      const openAskBar  =')+'\nthis.refresh=askBarRefreshRecords;',c);
vm.runInContext(section('      const askBarPartialReply =','      const askBarResolve =')+'\nthis.reply=askBarPartialReply;',c);
(async()=>{
 await c.refresh();assert.equal(c.newsPosts.value[0].id,'fresh');assert.equal(c.medicalStaff.value[0].id,'fresh');assert.equal(c.askBar.sourceHealth.filter(s=>s.ready).length,8);console.log('PASS a failed duty source does not discard eight successful sources');
 assert.match(c.askBar.sourceHealth[1].error,/server error/);assert.match(c.askBar.refreshError,/8 of 9/);console.log('PASS named source failure and partial state exposed');
 c.reply('publication details');assert.equal(c.askBar.turns.at(-1).text,'Verified publication');console.log('PASS publication reads survive unrelated duty source failure');
 c.reply('delete this duty');assert.match(c.askBar.turns.at(-1).text,/cannot verify/);console.log('PASS unsupported and write requests stay blocked');
 c.askBar.sourceHealth.find(s=>s.label==='Research Library').ready=false;c.reply('publication details');assert.match(c.askBar.turns.at(-1).text,/cannot verify/);console.log('PASS publication read blocked when its required source is unavailable');
 c.askBar.sourceHealth.find(s=>s.label==='Research Library').ready=true;c.hasPermission=()=>false;c.reply('publication details');assert.match(c.askBar.turns.at(-1).text,/cannot verify/);console.log('PASS degraded read retains permission gate');
 const html=fs.readFileSync(__dirname+'/index.html','utf8');const input=html.match(/<input v-model="askBar.query"[^>]+>/)[0];assert(!input.includes('refreshError'));assert(!input.includes('refreshing'));console.log('PASS typing stays enabled during refresh and errors');
 console.log('7 V46.1 checks passed. Live source failure still needs the deployed diagnostic.');
})().catch(e=>{console.error(e);process.exitCode=1});
