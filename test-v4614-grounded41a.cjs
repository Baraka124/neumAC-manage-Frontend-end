const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict')
const app=fs.readFileSync('app.js','utf8')
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8')
const garch=fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])

test('G41A-01 application JavaScript parses',()=>{ new vm.Script(app) })
test('G41A-02 cache marker advances for Grounded runtime delivery',()=>{ assert(/app\.js\?v=46\.14-grounded-phase41(?:a-knowledge-contract|b-ui-convergence)/.test(fs.readFileSync('index.html','utf8'))) })
test('G41A-03 per-intent source contract exists',()=>{
  assert(app.includes("schema:'grounded.answer.v1'"))
  assert(app.includes('const askBarRequiredSourceKeys'))
  assert(app.includes('const groundedSourceGate'))
})
test('G41A-03 leave reads depend only on staff plus leave',()=>{
  assert(app.includes("if (group==='leave') return ['staff','leave']"))
  assert(app.includes("if (/^staff_leave(?:_schedule|_on_date)?$/.test(key)) return ['staff','leave']"))
})
test('G41A-04 cross-domain risks retain exact broader dependencies',()=>{
  assert(app.includes("['coverage_gaps','absence_coverage_risk','find_replacement','recommend_backup','workload_analysis']"))
  assert(app.includes("return ['staff','oncall','leave','rotations']"))
})
test('G41A-05 degraded read no longer uses one universal eight-source gate',()=>{
  const part=app.slice(app.indexOf('const askBarPartialReply ='),app.indexOf('const askBarResolve =',app.indexOf('const askBarPartialReply =')))
  assert(part.includes('askBarRequiredSourceKeys'))
  assert(part.includes('groundedSourceGate'))
  assert(!part.includes("const needs=publication?"))
})
test('G41A-06 refresh copy states dependency-aware behavior',()=>{
  assert(app.includes('resolved request does not depend on the unavailable records'))
})
test('G41A-07 taught vocabulary cannot override strong conflicting route',()=>{
  const block=app.slice(app.indexOf('const askBarMatchTableOnly'),app.indexOf('const askBarMatchIntent ='))
  assert(block.indexOf('const best = askBarMatchTableOnly') < block.indexOf('if (taught) return'))
  assert(!block.includes('priority: 999'))
  assert(block.includes('taughtCollision'))
})
test('G41A-08 Teach UI blocks strong routing collisions before save',()=>{
  const b=app.slice(app.indexOf('const teachSubmit ='),app.indexOf('const getBrain ='))
  assert(b.includes('askBarMatchTableOnly'))
  assert(b.includes('collision.priority >= 50'))
  assert(b.includes('Not saved'))
})
test('G41A-09 person ambiguity uses a near-tie margin not exact equality only',()=>{
  const b=app.slice(app.indexOf('const askBarResolveStaffClarified'),app.indexOf('const askBarResolveNamedOperationalStaff'))
  assert(b.includes('<= 0.31'))
  assert(b.includes('margin:'))
})
test('G41A-10 answer envelope carries knowledge and explicit confidence reason',()=>{
  const b=app.slice(app.indexOf('const askBarFinalizeAnswer'),app.indexOf('const askBarBuildAnswer ='))
  assert(b.includes('knowledge'))
  assert(b.includes('confidenceReason'))
  assert(b.includes('reviewScope'))
  assert(b.includes('timeScope'))
})
test('G41A-11 zero-result confidence is source-derived rather than automatically uncertain',()=>{
  assert(app.includes('All required sources were verified and no matching records were found.'))
})
test('G41A-12 ranking semantics expose the current all-recorded period without changing results',()=>{
  assert((app.match(/timeScope:'All recorded records'/g)||[]).length>=2)
})
test('G41A-13 unrelated failed Innovation source does not block a Leave read',()=>{
  const sourceSection=app.slice(app.indexOf('      const GROUNDED_SOURCE_LABELS'),app.indexOf('      // Audit trail:',app.indexOf('      const GROUNDED_SOURCE_LABELS')))
  const partial=app.slice(app.indexOf('      const askBarPartialReply ='),app.indexOf('      const askBarResolve =',app.indexOf('      const askBarPartialReply =')))
  const health=['Staff directory','On-call schedule','Leave records','Rotations','Training units','Research programmes','Clinical studies','Innovation projects','Research Library'].map(label=>({label,ready:label!=='Innovation projects',error:label==='Innovation projects'?'down':''}))
  const c={console,askBar:{sourceHealth:health,context:null,subject:null,turns:[],snapshotCapturedAt:'2026-09-23T09:00:00Z'},askBarIntentModule:{absent_now:'staff_absence'},hasPermission:()=>true,askBarMatchIntent:()=> 'absent_now',askBarBuildFollowup:()=>null,_askBarBuildAnswerRaw:()=>({text:'No one is absent today.',sources:['leave records','staff'],confidence:'high'}),askBarFinalizeAnswer:(raw)=>raw,askBarNow:()=> '11:00',Vue:{reactive:x=>x},askBarStreamTurn:(t,txt)=>t.text=txt}
  vm.createContext(c)
  vm.runInContext(sourceSection,c)
  vm.runInContext(partial+'\nthis.reply=askBarPartialReply;',c)
  c.reply('who is absent today?')
  assert.equal(c.askBar.turns.at(-1).text,'No one is absent today.')
  assert.equal(c.askBar.turns.at(-1).confidence,'high')
})
test('G41A-14 required failed Leave source blocks that Leave read',()=>{
  const sourceSection=app.slice(app.indexOf('      const GROUNDED_SOURCE_LABELS'),app.indexOf('      // Audit trail:',app.indexOf('      const GROUNDED_SOURCE_LABELS')))
  const partial=app.slice(app.indexOf('      const askBarPartialReply ='),app.indexOf('      const askBarResolve =',app.indexOf('      const askBarPartialReply =')))
  const health=['Staff directory','On-call schedule','Leave records','Rotations','Training units','Research programmes','Clinical studies','Innovation projects','Research Library'].map(label=>({label,ready:label!=='Leave records',error:label==='Leave records'?'down':''}))
  const c={console,askBar:{sourceHealth:health,context:null,subject:null,turns:[],snapshotCapturedAt:'2026-09-23T09:00:00Z'},askBarIntentModule:{absent_now:'staff_absence'},hasPermission:()=>true,askBarMatchIntent:()=> 'absent_now',askBarBuildFollowup:()=>null,_askBarBuildAnswerRaw:()=>({text:'SHOULD NOT RUN',sources:['leave records'],confidence:'high'}),askBarFinalizeAnswer:(raw)=>raw,askBarNow:()=> '11:00',Vue:{reactive:x=>x},askBarStreamTurn:(t,txt)=>t.text=txt}
  vm.createContext(c)
  vm.runInContext(sourceSection,c)
  vm.runInContext(partial+'\nthis.reply=askBarPartialReply;',c)
  c.reply('who is absent today?')
  assert.match(c.askBar.turns.at(-1).text,/cannot verify/i)
  assert.equal(c.askBar.turns.at(-1).confidence,'low')
})
test('G41A-15 architecture records knowledge-contract checkpoint',()=>{
  assert(arch.includes('Grounded Phase 4.1A'))
  assert(garch.includes('Grounded Phase 4.1A'))
})

let n=0
for(const [name,fn] of tests){try{fn();console.log('PASS',name);n++}catch(e){console.error('FAIL',name,e.stack||e);process.exit(1)}}
console.log(`${n} V46.14 Grounded Phase 4.1A knowledge-contract checks passed.`)
