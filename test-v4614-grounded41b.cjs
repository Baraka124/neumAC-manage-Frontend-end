const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict')
const html=fs.readFileSync('index.html','utf8')
const app=fs.readFileSync('app.js','utf8')
const css=fs.readFileSync('style.css','utf8')
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8')
const garch=fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')
const ui=fs.readFileSync('UI-SYSTEM-V46.14.md','utf8')
const val=fs.readFileSync('VALIDATION-V46.14-GROUNDED-PHASE41B.md','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])

test('G41B-01 application JavaScript parses',()=>new vm.Script(app))
test('G41B-02 app and style cache markers advance together',()=>{
  assert(html.includes('app.js?v=46.14-grounded-phase41b-ui-convergence'))
  assert(html.includes('style.css?v=46.14-grounded-phase41b-ui-convergence'))
})
test('G41B-03 Grounded is a labelled modal intelligence workspace',()=>{
  assert(html.includes('class="grounded-overlay nd-intelligence-overlay" role="dialog" aria-modal="true" aria-labelledby="grounded-dialog-title" tabindex="-1"'))
  assert(html.includes('id="grounded-dialog-title"'))
  assert(html.includes('nd-intelligence-shell'))
})
test('G41B-04 visible mist nodes are removed',()=>{
  assert(!/<span[^>]+class="grounded-mist/.test(html))
  assert(css.includes('.grounded-mist{display:none !important;}'))
})
test('G41B-05 Phase 4.1B block explicitly removes backdrop blur',()=>{
  const i=css.indexOf('V46.14 · GROUNDED PHASE 4.1B — INTELLIGENCE UI CONVERGENCE')
  assert(i>0)
  const b=css.slice(i)
  assert(b.includes('backdrop-filter:none !important'))
  assert(!/backdrop-filter\s*:\s*blur\(/.test(b))
})
test('G41B-06 primary header is simplified and secondary tools are grouped',()=>{
  assert(html.includes('<details class="grounded-tools-menu">'))
  ;['Personal activity','Activity','Trace','Teach Grounded'].forEach(x=>assert(html.includes(x),x))
  assert(css.includes('.grounded-tools-popover'))
})
test('G41B-07 primary interaction rhythm uses Phase 4 40px control token',()=>{
  const i=css.indexOf('V46.14 · GROUNDED PHASE 4.1B')
  const b=css.slice(i)
  assert(b.includes('var(--nd-control-h,40px)'))
  assert(b.includes('min-height:40px !important'))
})
test('G41B-08 source readiness and active context use reusable contracts',()=>{
  assert(html.includes('gr431-readiness nd-source-health'))
  assert(html.includes('gr43-contextbar nd-context-strip'))
})
test('G41B-09 answer surface exposes reusable intelligence contracts',()=>{
  ;['nd-answer-question','nd-answer','nd-answer-card','nd-answer-scope','nd-proposal','nd-evidence-strip','nd-evidence-records','nd-intelligence-composer'].forEach(x=>assert(html.includes(x),x))
})
test('G41B-10 structured knowledge envelope is rendered directly',()=>{
  assert(html.includes("turn.knowledge.complete ? 'Verified source scope' : 'Partial source scope'"))
  assert(html.includes('turn.knowledge.checkedSources'))
  assert(html.includes('turn.confidenceReason'))
  assert(html.includes('turn.knowledge.unavailableSources'))
})
test('G41B-11 answer scope includes explicit temporal meaning',()=>{
  assert(html.includes("turn.reviewScope || turn.timeScope || 'Department records'"))
})
test('G41B-12 dialog keyboard lifecycle includes trap Escape and focus return',()=>{
  assert(app.includes('const askBarOnKeydown = (ev) =>'))
  assert(app.includes("if (ev.key === 'Escape')"))
  assert(app.includes("if (ev.key !== 'Tab') return"))
  assert(app.includes('askBarReturnFocus'))
  assert(app.includes("document.querySelector('.nd-intelligence-overlay')?.focus()"))
  assert(app.includes('closeAskBar, askBarOnKeydown, askBarReset'))
})
test('G41B-13 meaningful Grounded support text receives 11px floor overrides',()=>{
  const i=css.indexOf('V46.14 · GROUNDED PHASE 4.1B')
  const b=css.slice(i)
  ;['.askbar-trust-state','.askbar-trust-src','.askbar-followup-label','.gr43-contextcopy>span','.askbar-profile-sechead'].forEach(sel=>{
    assert(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'[^{}]*\\{[^{}]*font-size:11px !important').test(b),sel)
  })
})
test('G41B-14 evidence remains visible but subordinate',()=>{
  assert(css.includes('/* Evidence is visible but subordinate to the answer. */'))
  assert(css.includes('.nd-evidence-reason'))
  assert(css.includes('.nd-evidence-warning'))
})
test('G41B-15 responsive and reduced-motion contracts are present',()=>{
  const i=css.indexOf('V46.14 · GROUNDED PHASE 4.1B')
  const b=css.slice(i)
  ;['@media(max-width:900px)','@media(max-width:760px)','@media(max-width:440px)','@media(prefers-reduced-motion:reduce)'].forEach(x=>assert(b.includes(x),x))
})
test('G41B-16 Phase 4.1A knowledge contract remains intact',()=>{
  ;["schema:'grounded.answer.v1'",'groundedSourceGate','askBarRequiredSourceKeys','askBarConfidenceReason'].forEach(x=>assert(app.includes(x),x))
  assert(/routing_scope:\s*'v4614-safe'/.test(app))
})
test('G41B-17 operational write integrity remains confirmation-gated',()=>{
  assert(app.includes('access:GroundedCore.ACCESS.WRITE'))
  assert(/confirmed\s*:\s*true/.test(app))
  assert(garch.includes('human confirmation'))
})
test('G41B-18 architecture and UI contract record the convergence checkpoint',()=>{
  assert(arch.includes('Architecture v2.9'))
  assert(arch.includes('Grounded Phase 4.1B — Intelligence UI convergence'))
  assert(garch.includes('Grounded Phase 4.1B — Intelligence UI convergence'))
  assert(ui.includes('Grounded intelligence extension — Phase 4.1B'))
  assert(val.includes('Still requires deployed validation'))
})

let passed=0
for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);console.error(e.stack||e);process.exitCode=1;break}}
if(passed===tests.length) console.log(`${passed} V46.14 Grounded Phase 4.1B UI convergence checks passed.`)
