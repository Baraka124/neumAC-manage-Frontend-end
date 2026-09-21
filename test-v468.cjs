const fs = require('fs')
const assert = require('assert')

// Minimal sessionStorage mock for core runtime tests.
global.sessionStorage = (() => {
  const m = new Map()
  return { getItem:k=>m.has(k)?m.get(k):null, setItem:(k,v)=>m.set(k,String(v)), removeItem:k=>m.delete(k), clear:()=>m.clear() }
})()

const Core = require('./grounded-core.js')
const html = fs.readFileSync('index.html','utf8')
const app = fs.readFileSync('app.js','utf8')
const css = fs.readFileSync('style.css','utf8')
const readme = fs.readFileSync('README-V46.8.md','utf8')
const arch = fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')

const tests = [
  ['V46.8 build and core load order', () => {
    assert(html.includes('neumDesk · V46.8'))
    assert(html.includes('grounded-core.js?v=46.8-grounded-architecture'))
    assert(html.includes('app.js?v=46.8-grounded-architecture'))
    assert(html.indexOf('grounded-core.js?v=46.8-grounded-architecture') < html.indexOf('app.js?v=46.8-grounded-architecture'))
  }],
  ['core exposes architecture contracts', () => {
    assert.strictEqual(Core.VERSION,'46.8')
    ;['buildContextEnvelope','createToolRegistry','runBoundedPlan','startTrace','finishTrace','evaluateTrace'].forEach(k=>assert.strictEqual(typeof Core[k],'function'))
    assert.strictEqual(Core.ACCESS.WRITE,'write')
  }],
  ['context envelope is compact and credential-safe', () => {
    const c=Core.buildContextEnvelope({view:'training_units',subject:{type:'unit',id:'u1',name:'UCRI',token:'secret'},user:{role:'resident_manager',password:'nope'},module:{capacity:3}})
    assert.strictEqual(c.schema,'grounded.context.v1')
    assert.strictEqual(c.subject.name,'UCRI')
    assert(!('token' in c.subject))
    assert(!('password' in c.user))
  }],
  ['read/propose/write guardrail contract', () => {
    const reg=Core.createToolRegistry({permissionCheck:()=>true})
    reg.register({name:'read.x',access:Core.ACCESS.READ,module:'x',run:()=>42})
    reg.register({name:'propose.x',access:Core.ACCESS.PROPOSE,module:'x',run:()=>({proposal:true})})
    reg.register({name:'write.x',access:Core.ACCESS.WRITE,module:'x',run:()=>true})
    assert.strictEqual(reg.invoke('read.x'),42)
    assert.strictEqual(reg.invoke('propose.x').proposal,true)
    assert.throws(()=>reg.invoke('write.x',{},{}),e=>e.code==='GROUND_CONFIRMATION_REQUIRED')
    assert.strictEqual(reg.invoke('write.x',{}, {confirmed:true}),true)
  }],
  ['permissions block tool invocation', () => {
    const reg=Core.createToolRegistry({permissionCheck:()=>false})
    reg.register({name:'read.blocked',access:Core.ACCESS.READ,module:'medical_staff',run:()=>1})
    assert.throws(()=>reg.invoke('read.blocked'),e=>e.code==='GROUND_PERMISSION_DENIED')
  }],
  ['trace captures tools/outcomes but sanitizes secrets', () => {
    sessionStorage.clear()
    const id=Core.startTrace({query:'which units are free?',context:{token:'secret',subject:{name:'UCRI'}}})
    Core.addTraceEvent(id,'tool_start',{tool:'clinical_units.capacity_window',password:'secret'})
    Core.finishTrace(id,{status:'ok',intent:'unit_forecast',sources:['units','rotations'],confidence:'high'})
    const t=Core.recentTraces(1)[0]
    assert.strictEqual(t.status,'ok')
    assert.strictEqual(t.events[0].data.tool,'clinical_units.capacity_window')
    assert(!('password' in t.events[0].data))
    assert(!('token' in t.context))
  }],
  ['bounded plan stops and obeys cap', async () => {
    const seen=[]
    const steps=Array.from({length:10},(_,i)=>({run:async()=>{seen.push(i); return i===2?{stop:true}:{}}}))
    const out=await Core.runBoundedPlan({steps,maxSteps:6})
    assert.strictEqual(out.length,3)
    assert.deepStrictEqual(seen,[0,1,2])
  }],
  ['Clinical Units registered as first semantic tool adapter', () => {
    ;['clinical_units.capacity_window','clinical_units.available_units','clinical_units.team_readiness','resident_rotations.conflicts','resident_rotations.propose_assignment'].forEach(n=>assert(app.includes(`name:'${n}'`)))
    assert(app.includes("groundedInvokeTool('resident_rotations.conflicts'"))
    assert(app.includes("groundedInvokeTool('clinical_units.available_units'"))
  }],
  ['Grounded context builder includes task scope and source health', () => {
    assert(app.includes('askBarBuildContextEnvelope'))
    assert(app.includes("kind:'resident_rotation_month'"))
    assert(app.includes("kind:'clinical_team_week'"))
    assert(app.includes('sourceHealth: (askBar.sourceHealth || [])'))
  }],
  ['confirmed writes are traceable as human-approved actions', () => {
    assert(app.includes("GroundedCore.addTraceEvent(traceId,'human_confirmation',{confirmed:true})"))
    assert(app.includes("actionClass:'write'"))
    assert(html.includes('Confirm & schedule'))
  }],
  ['admin Trace UI is operational telemetry not chain-of-thought', () => {
    assert(html.includes("askBar.view === 'trace'"))
    assert(html.includes('Hidden reasoning is never recorded.'))
    assert(html.includes("hasPermission('audit_logs','read')"))
    assert(css.includes('V46.8 · GROUNDED ARCHITECTURE OBSERVABILITY'))
  }],
  ['architecture deliberately keeps one orchestrator for now', () => {
    assert(arch.includes('Multi-agent architecture is intentionally deferred'))
    assert(arch.includes('Human in the loop'))
    assert(arch.includes('Observability and tracing'))
    assert(readme.includes('same neumDesk product surface'))
  }]
]

;(async()=>{
  let passed=0
  for (const [name,fn] of tests) {
    try { await fn(); console.log('PASS',name); passed++ }
    catch(e){ console.error('FAIL',name); console.error(e.stack||e); process.exitCode=1; break }
  }
  if(!process.exitCode) console.log(`${passed} V46.8 Grounded architecture checks passed.`)
})()
