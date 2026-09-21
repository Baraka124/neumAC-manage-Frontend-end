const fs=require('fs')
const assert=require('assert')
global.sessionStorage=(()=>{const m=new Map();return{getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear()}})()
const Core=require('./grounded-core.js')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8')
const garch=fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')
const readme=fs.readFileSync('README-V46.9.md','utf8')
const tests=[
 ['V46.9 markers and core version',()=>{assert(/neumDesk · V46\.(?:9|10|11|12|13|14)/.test(html));assert(/46\.(?:9-grounded-action-integrity|10-leave-action-integrity|11-rotation-action-integrity|12-clinical-units|13-portfolio-intelligence|14-personal-activity-workspace)/.test(html));assert(/^46\.(?:9|10|11|12|13)$/.test(Core.VERSION))}],
 ['record_oncall accepts week-qualified action phrases',()=>{const line=app.match(/\{ intent: 'record_oncall'[^\n]+/)[0];assert(!/anti:[^\n]*week/.test(line));assert(line.includes("intent: 'record_oncall'"))}],
 ['on-call has explicit pending action state',()=>{assert(app.includes('pendingOncall: null'));assert(app.includes("pend.awaiting==='date'"));assert(app.includes("pend.awaiting==='subject'"))}],
 ['multi-question splitting pauses during pending on-call action',()=>{assert(app.includes('!askBar.pendingLeave && !askBar.pendingOncall'))}],
 ['write-safe ambiguity is used for on-call identities',()=>{assert(app.includes('askBarResolveStaffClarified(text)'));assert(app.includes('askBarOncallAmbiguityTurn'));assert(app.includes('oncallClarify'))}],
 ['ambiguous name selection resumes exact on-call task',()=>{assert(app.includes("if (c.oncallClarify && askBar.pendingOncall)"));assert(app.includes("c.oncallClarify === 'subject'"))}],
 ['on-call eligibility is checked before requesting more details',()=>{assert(app.includes("groundedInvokeTool('oncall.check_eligibility',{staffId:ex.subject.id},{traceId:null})"));assert(app.includes("is not configured as on-call eligible"))}],
 ['this-week weekday parser is explicit',()=>{assert(app.includes('Tuesday this week'));assert(app.includes('thisWeekWd=q.match'))}],
 ['on-call semantic tool set is registered',()=>{['oncall.person_shifts','oncall.check_eligibility','oncall.check_slot','oncall.replacement_candidates','oncall.propose_assignment','oncall.commit_assignment'].forEach(n=>assert(app.includes(`name:'${n}'`)))}],
 ['proposal checks leave, duplicate, slot and eligibility',()=>{['leave_conflict','duplicate_person_duty','slot_occupied','not_oncall_eligible','date_in_past'].forEach(x=>assert(app.includes(x)))}],
 ['write tool requires Grounded confirmed write',()=>{assert(app.includes("name:'oncall.commit_assignment', access:GroundedCore.ACCESS.WRITE"));assert(app.includes("{traceId,confirmed:true}"));const reg=Core.createToolRegistry({permissionCheck:()=>true});reg.register({name:'w',access:Core.ACCESS.WRITE,module:'oncall_schedule',run:()=>1});assert.throws(()=>reg.invoke('w'),e=>e.code==='GROUND_CONFIRMATION_REQUIRED');assert.strictEqual(reg.invoke('w',{}, {confirmed:true}),1)}],
 ['confirmed write revalidates proposal before API mutation',()=>{const block=app.slice(app.indexOf("name:'oncall.commit_assignment'"),app.indexOf("groundedToolCatalog.value",app.indexOf("name:'oncall.commit_assignment'")));assert(block.includes("oncall.propose_assignment"));assert(block.includes("if(proposal.blocked.length)"));assert(block.indexOf("oncall.propose_assignment")<block.indexOf("API.request('/api/oncall'"))}],
 ['on-call trace carries proposal to human confirmation and write',()=>{assert(app.includes("GroundedCore?.addTraceEvent(traceId,'human_confirmation',{confirmed:true,action:'schedule_oncall'})"));assert(app.includes("_traceId:traceId"));assert(app.includes("action_committed"))}],
 ['cancelled proposal closes its trace without writing',()=>{assert(app.includes("status:'cancelled',intent:'record_oncall'"));assert(app.includes("confirmed:false,action:'schedule_oncall'"))}],
 ['blocked proposal renders the actual constraint',()=>{assert(html.includes("turn.oncallProposal.blockReason || 'This on-call change is blocked by a recorded constraint.'"))}],
 ['Grounded architecture names On-call as second migrated action module',()=>{assert(garch.includes('On-call'));assert(garch.includes('action integrity'));assert(garch.includes('oncall.propose_assignment'))}],
 ['DepartmentOS living architecture records V46.9 checkpoint',()=>{assert(/Implementation checkpoint: V46\.(?:9|10|11|12|13|14)/.test(arch));assert(arch.includes('Grounded Action Integrity'));assert(/Resident Rotation|What comes next|Next migration/.test(arch))}],
 ['release notes preserve V46.8 as baseline',()=>{assert(readme.includes('built directly on V46.8'));assert(readme.includes('DepartmentOS_Architecture.md'))}]
]
let passed=0
for(const [name,fn] of tests){try{fn();console.log('PASS',name);passed++}catch(e){console.error('FAIL',name);console.error(e.stack||e);process.exitCode=1;break}}
if(!process.exitCode)console.log(`${passed} V46.9 Grounded Action Integrity checks passed.`)
