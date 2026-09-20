const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const A=require('./activity45.js');
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
const person={id:'s1',full_name:'Dr. Alex Example',staff_type:'resident',professional_email:'private@example.test',mobile_phone:'SECRET_PHONE'};
function fixture(){
  const s=Object.fromEntries(A.specs.map(x=>[x.key,{label:x.label,state:'ready',checkedAt:'2026-09-20T12:00:00Z',rows:[]} ]));
  s.staff.rows=[person]; s.units.rows=[{id:'u1',unit_name:'Respiratory medicine'}];
  s.oncall.rows=[{id:'o1',primary_physician_id:'s1',duty_date:'2026-09-22',shift_type:'on_call_present',start_time:'08:00',end_time:'20:00',coverage_notes:'SECRET_NOTE'},{id:'o2',backup_physician_id:'s1',duty_date:'2026-09-25',shift_type:'backup_call'},{id:'other',primary_physician_id:'s2',duty_date:'2026-09-22'}];
  s.rotations.rows=[{id:'r1',resident_id:'s1',training_unit_id:'u1',rotation_status:'active',start_date:'2026-08-20',end_date:'2026-09-30'}];
  s.studies.rows=[{id:'t1',title:'Respiratory outcomes cohort',principal_investigator_id:'s2',sub_investigators:['s1'],status:'Recruiting',start_date:'2026-01-01',end_date:'2027-01-01',milestones:[{label:'Study team review',date:'2026-09-24',done:false}]}];
  s.projects.rows=[{id:'p1',title:'Home monitoring feasibility',lead_investigator_id:'s1',current_stage:'validation',start_date:'2026-06-01',estimated_end_date:'2027-04-01',milestones:[{label:'Prototype review',date:'2026-09-29',done:false}]}];
  s.lines.rows=[{id:'l1',name:'Respiratory innovation',coordinator_id:'s1',active:true}]; return s;
}
const build=s=>A.build(person,'2026-09-01','2026-09-30',s);
test('explicit identity and primary/backup roles',()=>{const m=build(fixture());assert.equal(m.events.filter(x=>x.kind==='oncall').length,2);assert.deepEqual(m.events.filter(x=>x.kind==='oncall').map(x=>x.role),['Primary','Backup']);assert(!m.events.some(x=>x.ref==='other'))});
test('overlapping rotation keeps original dates',()=>{const m=build(fixture());assert.equal(m.events[0].start,'2026-08-20');assert.equal(m.events[0].end,'2026-09-30')});
test('supervision is distinguished from residency',()=>{let s=fixture();s.rotations.rows[0].resident_id='other';s.rotations.rows[0].supervising_attending_id='s1';assert.equal(build(s).events[0].role,'Supervisor')});
test('research membership includes legacy arrays, manager and explicit team roles',()=>{const s=fixture();s.studies.rows[0].sub_investigators='["s1"]';s.studies.rows[0].data_manager_id='s1';s.studies.rows[0].team_roles={s1:'Research engineer'};const role=build(s).studies[0].role;assert.match(role,/Sub-investigator/);assert.match(role,/Data manager/);assert.match(role,/Research engineer/)});
test('shared milestones are not personal appointments',()=>{const m=build(fixture());const x=m.events.find(x=>x.kind==='project');assert.equal(x.role,'Shared milestone');assert.match(x.detail,/Personal ownership not established/)});
test('undated research remains visible with uncertainty',()=>{const s=fixture();delete s.projects.rows[0].start_date;delete s.projects.rows[0].estimated_end_date;const m=build(s);assert.equal(m.projects.length,1);assert.match(m.projects[0].timing,/unverified/);assert(m.issues.length)});
test('out-of-period portfolios are excluded',()=>{const s=fixture();s.projects.rows[0].start_date='2027-01-01';assert.equal(build(s).projects.length,0)});
test('missing rotation end and terminated rotations are not fabricated spans',()=>{const s=fixture();delete s.rotations.rows[0].end_date;assert(!build(s).events.some(x=>x.kind==='rotation'));s.rotations.rows[0].end_date='2026-09-30';s.rotations.rows[0].rotation_status='terminated_early';assert(!build(s).events.some(x=>x.kind==='rotation'))});
test('cancelled assignments are omitted',()=>{const s=fixture();s.oncall.rows[0].status='cancelled';s.rotations.rows[0].rotation_status='cancelled';const m=build(s);assert.equal(m.events.filter(x=>x.kind==='oncall').length,1);assert(!m.events.some(x=>x.kind==='rotation'))});
test('restricted and unavailable sources do not leak retained records',()=>{const s=fixture();s.projects.state='restricted';s.oncall.state='unavailable';const m=build(s);assert.equal(m.projects.length,0);assert(!m.events.some(x=>x.kind==='oncall'));assert.match(A.render(m),/Partial view/);assert(!A.render(m).includes('Home monitoring feasibility'))});
test('section selection excludes data from document',()=>{const m=A.build(person,'2026-09-01','2026-09-30',fixture(),{oncall:true,rotations:false,studies:false,projects:false,lines:false});assert.equal(m.events.length,2);assert(!A.render(m).includes('Respiratory outcomes cohort'));assert(!m.sources.some(x=>x.key==='projects'))});
test('invalid and oversized periods are rejected; leap day is valid',()=>{assert.equal(A.date('2026-02-30'),'');assert.equal(A.date('2028-02-29'),'2028-02-29');assert.throws(()=>A.build(person,'2026-09-30','2026-09-01',fixture()));assert.throws(()=>A.build(person,'2026-01-01','2027-01-02',fixture()))});
test('untrusted labels are escaped; secrets and executable content are absent',()=>{const s=fixture();s.projects.rows[0].title='<script>alert("x")</script>';const html=A.render(build(s));assert(html.includes('&lt;script&gt;'));assert(!html.includes('<script>'));assert(!html.includes('SECRET_NOTE'));assert(!html.includes('SECRET_PHONE'));assert(!html.includes('private@example.test'));assert(html.includes("default-src 'none'"))});
test('calendar covers a month boundary without shifting dates',()=>{const m=A.build(person,'2026-12-31','2027-01-01',fixture());const html=A.render(m);assert(html.includes('December 2026'));assert(html.includes('January 2027'))});
test('Grounded completion does not scroll, animate or defer reading',()=>{const src=fs.readFileSync(__dirname+'/app.js','utf8');const start=src.indexOf('      const askBarStreamTurn =');const end=src.indexOf('      // ── Phase 1:',start);const c={askBar:{refreshedAt:'12:00',context:{name:'A study'}}};vm.createContext(c);vm.runInContext(src.slice(start,end)+'\nthis.complete=askBarStreamTurn',c);const turn={isDraft:true};c.complete(turn,'Ready');assert.equal(turn.text,'Ready');assert.equal(turn.streaming,false);assert.equal(turn.reviewOpen,false);assert.equal(turn.reviewScope,'A study')});
(async()=>{
  let paths=[];const request=async(path)=>{paths.push(path);return {data:[],pagination:{total:0}}};
  await A.load(request,()=>true,null,{directoryOnly:true});assert.equal(paths.length,1);count++;console.log('PASS opening the selector retrieves only the directory');
  paths=[];let sources=await A.load(request,m=>m!=='innovation_projects',null,{personId:'s1',start:'2026-09-01',end:'2026-09-30',selected:{oncall:true,projects:true}});assert.equal(sources.projects.state,'restricted');assert(!paths.some(p=>p.includes('innovation')));assert(paths.some(p=>p.includes('physician_id=s1&start_date=2026-09-01')));count++;console.log('PASS permission checks and scoped duty requests');
  sources=await A.load(async path=>{if(path.includes('clinical-trials'))throw Error('offline');return []},()=>true);assert.equal(sources.studies.state,'unavailable');assert.equal(sources.projects.state,'ready');count++;console.log('PASS one failed source does not block other sources');
  const rows=await A.fetchRows(async path=>({data:[{id:path.includes('page=2')?'b':'a'}],pagination:{total:2}}),'/api/test?limit=1');assert.equal(rows.length,2);count++;console.log('PASS full pagination');
  await assert.rejects(()=>A.fetchRows(async()=>({data:[{id:'a'}],pagination:{total:2}}),'/api/test'));count++;console.log('PASS repeated pages rejected');
  await assert.rejects(()=>A.fetchRows(async()=>({data:[],pagination:{total:2}}),'/api/test'));count++;console.log('PASS incomplete pagination rejected');
  await assert.rejects(()=>A.fetchRows(async()=>({data:[{}]}),'/api/test'));count++;console.log('PASS malformed records rejected');
  await assert.rejects(()=>A.fetchRows(async()=>Array.from({length:1000},(_,id)=>({id})), '/api/test'));count++;console.log('PASS unpaginated cap disclosed as unavailable');
  function integration(){
    const src=fs.readFileSync(__dirname+'/app.js','utf8');const begin=src.indexOf('      const activity45 = reactive(');const end=src.indexOf('\n        return {',begin);
    const c={reactive:x=>x,watch:()=>{},Vue:{nextTick:()=>{}},document:{activeElement:null},currentUser:{value:{id:'u1'}},hasPermission:()=>true,API:{request:()=>{}},Activity45:{...A},AbortController,setTimeout,clearTimeout};vm.createContext(c);vm.runInContext(src.slice(begin,end)+'\nthis.state=activity45;this.read=activity45Read;this.close=activity45Close;',c);c.state.open=true;return c;
  }
  let c=integration(),release;c.Activity45.load=()=>new Promise(r=>release=r);let pending=c.read();c.close();release(fixture());await pending;assert.equal(c.state.open,false);assert.equal(c.state.people.length,0);count++;console.log('PASS closing prevents a late document snapshot from returning');
  c=integration();c.Activity45.load=()=>new Promise(r=>release=r);pending=c.read();c.currentUser.value={id:'u2'};release(fixture());await pending;assert.equal(c.state.people.length,0);count++;console.log('PASS account change rejects the prior snapshot');
  c=integration();c.Activity45.load=()=>new Promise(r=>release=r);pending=c.read();const older=release;c.Activity45.load=async()=>{const f=fixture();f.staff.rows=[{id:'new',full_name:'New snapshot'}];return f};await c.read();older(fixture());await pending;assert.equal(c.state.people[0].id,'new');count++;console.log('PASS older document refresh cannot overwrite a newer one');
  const demo=build(fixture());demo.generatedAt='2026-09-20T12:00:00Z';
  if(process.argv.includes('--demo'))fs.writeFileSync(__dirname+'/EXAMPLE-personal-activity.html',A.render(demo,true));
  console.log(`${count} V45 tests passed. Live browser, printing and authenticated end-to-end checks are still required.`);
})().catch(e=>{console.error(e);process.exitCode=1});
