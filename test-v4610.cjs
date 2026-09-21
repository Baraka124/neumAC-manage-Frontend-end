const fs=require('fs')
const assert=require('assert')
global.sessionStorage=(()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})()
const Core=require('./grounded-core.js')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8')
const garch=fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')
const readme=fs.readFileSync('README-V46.10.md','utf8')
const tests=[
 ['V46.10 markers and core version',()=>{assert(/neumDesk · V46\.(?:10|11|12)/.test(html));assert(/46\.(?:10-leave-action-integrity|11-rotation-action-integrity|12-clinical-units)/.test(html));assert(/^46\.(?:10|11|12)$/.test(Core.VERSION))}],
 ['leave has explicit pending task state',()=>{assert(app.includes('pendingLeave: null'));assert(app.includes("pend.awaiting==='date'"));assert(app.includes("pend.awaiting==='subject'"))}],
 ['leave identity extraction uses ambiguity-aware resolver',()=>{const b=app.slice(app.indexOf('const askBarExtractLeave'),app.indexOf('// Deterministic date parsing'));assert(b.includes('askBarResolveStaffClarified'));assert(b.includes('subjectAmbiguous'));assert(b.includes('coveringAmbiguous'))}],
 ['leave clarification chips resume exact task',()=>{assert(app.includes('leaveClarifyIdentity'));assert(app.includes("c.leaveClarifyIdentity==='subject'"));assert(app.includes("c.leaveClarifyIdentity==='covering'"))}],
 ['leave semantic tool set is registered',()=>{['leave.person_records','leave.check_window','leave.propose_absence','leave.commit_absence'].forEach(n=>assert(app.includes(`name:'${n}'`)))}],
 ['leave hard validation detects overlap and invalid identities',()=>{['overlapping_leave','invalid_date_window','covering_same_as_subject','covering_staff_inactive'].forEach(x=>assert(app.includes(x)))}],
 ['operational collisions are warnings rather than automatic blocks',()=>{const b=app.slice(app.indexOf("name:'leave.check_window'"),app.indexOf("name:'leave.propose_absence'"));assert(b.includes('onCallConflicts'));assert(b.includes('rotationConflicts'));assert(!b.includes("blocked.push('oncall"));assert(!b.includes("blocked.push('rotation"))}],
 ['leave proposal runs through PROPOSE tool',()=>{assert(app.includes("groundedInvokeTool('leave.propose_absence'"));assert(app.includes("name:'leave.propose_absence', access:GroundedCore.ACCESS.PROPOSE"))}],
 ['leave confirmed write runs through WRITE tool',()=>{assert(app.includes("name:'leave.commit_absence', access:GroundedCore.ACCESS.WRITE"));assert(app.includes("groundedInvokeTool('leave.commit_absence'"));assert(app.includes('{traceId,confirmed:true}'))}],
 ['leave write revalidates immediately before API mutation',()=>{const b=app.slice(app.indexOf("name:'leave.commit_absence'"),app.indexOf('// V46.9 · On-call'));assert(b.includes("leave.propose_absence"));assert(b.includes('if(proposal.blocked.length)'));assert(b.indexOf('leave.propose_absence')<b.indexOf("API.request('/api/absence-records'"))}],
 ['leave trace spans confirmation and commit',()=>{assert(app.includes("human_confirmation',{confirmed:true,action:'record_leave'"));assert(app.includes("kind:'leave',entityKeys"));assert(app.includes('_traceId:traceId'))}],
 ['blocked leave proposal cannot be confirmed in UI',()=>{assert(html.includes(':disabled="turn.writing || turn.proposal.blocked"'));assert(html.includes("turn.proposal.blockReason"))}],
 ['Grounded architecture records Leave as third adapter',()=>{assert(/Leave.*V46\.10|Leave is the third|Leave \(V46\.10\)/.test(garch));assert(garch.includes('leave.commit_absence'));assert(garch.includes('Resident Rotation action integrity') || garch.includes('V46.11'))}],
 ['DepartmentOS living ledger records V46.10',()=>{assert(/Implementation checkpoint: V46\.(?:10|11|12)/.test(arch));assert(arch.includes('Leave Action Integrity'));assert(arch.includes('Resident Rotation Action Integrity'))}],
 ['release notes preserve V46.9 baseline',()=>{assert(readme.includes('built directly on V46.9'));assert(readme.includes('DepartmentOS_Architecture.md'))}],
 ['write confirmation enforcement remains generic',()=>{const reg=Core.createToolRegistry({permissionCheck:()=>true});reg.register({name:'leave.write',access:Core.ACCESS.WRITE,module:'staff_absence',run:()=>1});assert.throws(()=>reg.invoke('leave.write'),e=>e.code==='GROUND_CONFIRMATION_REQUIRED');assert.strictEqual(reg.invoke('leave.write',{}, {confirmed:true}),1)}]
]
let passed=0
for(const [name,fn] of tests){try{fn();console.log('PASS',name);passed++}catch(e){console.error('FAIL',name);console.error(e.stack||e);process.exitCode=1;break}}
if(!process.exitCode)console.log(`${passed} V46.10 Leave Action Integrity checks passed.`)
