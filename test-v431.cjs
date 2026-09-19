// Isolated executable tests of the shipped function bodies; no network or writes.
const fs = require('node:fs'); const vm = require('node:vm'); const assert = require('node:assert/strict');
const src = fs.readFileSync(__dirname + '/app.js','utf8');
function section(start,end){return src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));}
const ref = () => ({value:[]});
function harness(){
  const s = {console,AbortController,setTimeout,clearTimeout,currentUser:{value:{id:'test'}},askBar:{turns:[],loading:false},medicalStaff:ref(),onCallSchedule:ref(),absences:ref(),rotations:ref(),trainingUnits:ref(),newsPosts:ref(),researchOps:{researchLines:ref(),clinicalTrials:ref(),innovationProjects:ref()},Utils:{normalizeDate:v=>v?String(v).slice(0,10):''},askBarNow:()=> '12:00',API:{request:async()=>({data:[]})}};
  vm.createContext(s);
  vm.runInContext(section('      let askBarRefreshGeneration = 0','      const openAskBar  =')+'\nthis.refresh=askBarRefreshRecords;',s);
  return s;
}
(async()=>{
  let count=0; function pass(label){count++; console.log('PASS '+label);}
  let s=harness(); let release;
  s.API.request=()=>new Promise(r=>{release=r});
  // A single deferred shared response exercises readiness until all calls finish.
  const pending=[]; s.API.request=(p,o)=>{assert.equal(o.skipCache,true);return new Promise(r=>pending.push(r));};
  const work=s.refresh(); assert.equal(s.askBar.refreshing,true); pending.forEach(r=>r({data:[]})); await work;
  assert.equal(s.askBar.refreshing,false); assert.equal(s.askBar.refreshedAt,'12:00'); pass('fresh GET readiness gate');
  s.API.request=async()=>{throw Error('offline')}; await s.refresh(); assert.ok(s.askBar.refreshError); assert.equal(s.askBar.refreshedAt,null); pass('failure disclosed');
  s.API.request=async()=>({data:[]}); await s.refresh(); assert.equal(s.askBar.refreshError,''); pass('retry recovery');
  s.API.request=async p=>p.startsWith('/api/clinical-trials')?{data:[{id:p.includes('page=2')?'b':'a'}],pagination:{total:2}}:{data:[]};
  await s.refresh(); assert.equal(s.researchOps.clinicalTrials.value.length,2); pass('paginated research loaded');
  s.API.request=async()=>({oops:true}); await s.refresh(); assert.ok(s.askBar.refreshError); assert.equal(s.researchOps.clinicalTrials.value.length,2); pass('malformed response retains previous snapshot');
  const older=[]; s.API.request=()=>new Promise(r=>older.push(r)); const old=s.refresh();
  s.API.request=async()=>({data:[{id:'new'}]}); await s.refresh(); older.forEach(r=>r({data:[{id:'old'}]})); await old;
  assert.equal(s.medicalStaff.value[0].id,'new'); pass('late refresh cannot overwrite newer snapshot');
  s=harness(); s.askBar.subject={id:'old'}; s.askBar.context={id:'old'}; s.askBar.turns=[{}];
  s.openAskBar=()=>{s.askBar.context={id:'visible'};s.askBar.subject={id:'visible'}};
  vm.runInContext(section('      const askBarReset =','      const runSuggestion =')+'\nthis.reset=askBarReset;',s);
  s.reset(); assert.equal(s.askBar.turns.length,0); assert.equal(s.askBar.context.id,'visible'); pass('New re-enters visible context');
  s=harness(); vm.runInContext(section('      const askBarConfirmLeaveEdit =','      const askBarConfirmExtendRotation =')+'\nthis.confirm=askBarConfirmLeaveEdit;',s);
  const record={id:'leave',staff_member_id:'staff',absence_type:'planned',absence_reason:'vacation',start_date:'2026-10-01',end_date:'2026-10-03',coverage_arranged:true,covering_staff_id:'cover',coverage_notes:'Keep',hod_notes:'Keep too',current_status:'scheduled'};
  let written; let writes=0;
  s.API.request=async p=>p==='/api/absence-records/leave'?{data:{...record}}:{data:[]};
  s.API.updateAbsence=async(id,body)=>{writes++; written=body};
  let turn={}; const proposal={id:'leave',name:'Test',original:{...record},changes:{end_date:'2026-10-05'}};
  await s.confirm(proposal,turn); assert.equal(turn.committed,true); assert.equal(written.start_date,record.start_date); assert.equal(written.coverage_notes,'Keep'); assert.equal(written.end_date,'2026-10-05'); pass('complete leave payload preserves untouched fields');
  await s.confirm(proposal,turn); assert.equal(writes,1); pass('duplicate confirm ignored');
  turn={}; await s.confirm({...proposal,original:{...record,coverage_notes:'stale'}},turn); assert.ok(turn.commitError); assert.equal(writes,1); pass('changed record blocks save');
  turn={}; await s.confirm({...proposal,changes:{end_date:'2026-09-01'}},turn); assert.ok(turn.commitError); assert.equal(writes,1); pass('invalid date range blocks save');
  turn={cancelled:true}; await s.confirm(proposal,turn); assert.equal(writes,1); pass('cancelled proposal cannot save');
  console.log(`${count} tests passed. Browser/authenticated end-to-end testing remains required.`);
})().catch(e=>{console.error(e);process.exitCode=1});
