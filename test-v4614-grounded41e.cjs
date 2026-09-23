const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('style.css','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])

test('G41E-01 application JavaScript parses',()=>new vm.Script(app))
test('G41E-02 delivery cache marker advances to 4.1E',()=>{
  assert(html.includes('app.js?v=46.14-grounded-phase41e-oncall-precision'))
  assert(html.includes('style.css?v=46.14-grounded-phase41e-oncall-precision'))
})
test('G41E-03 named on-call follow-ups preserve explicit temporal scope',()=>{
  assert(app.includes("const callRange = topicCall ? askBarParseRange(q) : null"))
  assert(app.includes("start:callRange?.start||null"))
  assert(app.includes("end:callRange?.end||callRange?.start||null"))
})
test('G41E-04 on-call today answers today before volunteering the next shift',()=>{
  const a=app.indexOf("if (fu.kind === 'staff_oncall')")
  const b=app.indexOf("if (fu.kind === 'staff_rotation')",a)
  const block=app.slice(a,b)
  assert(block.includes('if (fu.start)'))
  assert(block.includes('is not on call ${isToday?\'today\''))
  assert(block.includes('Next scheduled on-call:'))
  assert(block.includes('Yes — ${fu.name} is on call ${isToday?\'today\''))
})
test('G41E-05 named schedule requests return the person schedule rather than only next shift',()=>{
  assert(app.includes("const callListScope = topicCall && /\\b(schedule|shifts?|days?|list|all|upcoming|scheduled)\\b/.test(q)"))
  assert(app.includes("if (fu.mode === 'schedule')"))
  assert(app.includes("visual:{type:'reslist',items,initialExpanded:true,lockExpanded:true}"))
})
test('G41E-06 broad on-call collection requests cannot inherit the pinned person',()=>{
  assert(app.includes('const broadCallScope = topicCall'))
  assert(app.includes('const broadOperationalScope = broadPersonScope || broadCallScope'))
  assert(app.includes('const shortTopicRef = !broadOperationalScope'))
})
test('G41E-07 explicit all/list requests do not truncate upcoming on-call to four',()=>{
  const a=app.indexOf("if (intent === 'oncall_upcoming')")
  const b=app.indexOf("if (intent === 'rotations_active')",a)
  const block=app.slice(a,b)
  assert(block.includes('up = askBarWantsFull(q) ? upcoming : upcoming.slice(0, 4)'))
  assert(block.includes('const fullRoster = !dayLabel && askBarWantsFull(q)'))
  assert(block.includes('(fullRoster ? up : up.slice(0,7)).map'))
})
test('G41E-08 full upcoming collection reports collection cardinality',()=>{
  assert(app.includes('scheduled on-call shift${up.length===1?\'\':\'s\'} from today onward.'))
})
test('G41E-09 broad roster answers no longer pin the first clinician as conversation context',()=>{
  assert(app.includes("if (up.length===1 && up[0]?.primary_physician_id)"))
  assert(app.includes("askBar.context = { type:'oncall'"))
})
test('G41E-10 roster answers use the compact collection scope treatment',()=>{
  assert(html.includes("['reslist','roster'].includes(turn.visual.type)\" class=\"nd-collection-scope\""))
  assert(html.includes("['reslist','roster'].includes(turn.visual.type) && turn.knowledge && turn.knowledge.complete ? 'Sources verified'"))
})
test('G41E-11 roster density CSS is Grounded-only',()=>{
  const marker='GROUNDED PHASE 4.1E · ON-CALL PRECISION + ROSTER DENSITY'
  const i=css.indexOf(marker); assert(i>=0)
  const block=css.slice(i)
  assert(block.includes('.nd-intelligence-shell .askbar-turn--collection .askbar-roster'))
  assert(!/\.staff46-|\.pp2-|\.pp3-|\.nd-workspace|\.nd-person-drawer/.test(block))
})
test('G41E-12 meaningful roster text respects Phase 4 readability floor',()=>{
  const i=css.indexOf('GROUNDED PHASE 4.1E · ON-CALL PRECISION + ROSTER DENSITY')
  const block=css.slice(i)
  assert(block.includes('.askbar-roster-date{font-size:11px'))
  assert(block.includes('.askbar-roster-name{font-size:12px'))
  assert(block.includes('.askbar-roster-backup'))
})
test('G41E-13 action/write contracts remain present',()=>{
  for(const s of ['oncall.commit_assignment','leave.commit_absence','resident_rotations.commit_assignment']) assert(app.includes(s),s)
})
test('G41E-14 Phase 4 Staff and Grounded shell contracts remain present',()=>{
  for(const x of ['nd-intelligence-shell','nd-evidence-strip','nd-intelligence-composer']) assert(html.includes(x),x)
  for(const x of ['nd-workspace','nd-record-list','nd-person-drawer']) assert(css.includes(x),x)
})

let passed=0
for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);console.error(e.stack||e);process.exitCode=1;break}}
if(passed===tests.length) console.log(`${passed} V46.14 Grounded Phase 4.1E on-call precision checks passed.`)
