const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('style.css','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])
const sha=s=>crypto.createHash('sha256').update(s).digest('hex')

test('G41C-01 application JavaScript parses',()=>new vm.Script(app))
test('G41C-02 cache marker advances without presentation markup rewrite',()=>{
  assert(/app\.js\?v=46\.14-grounded-phase41[c-e]-/.test(html))
  assert(/style\.css\?v=46\.14-grounded-phase41[c-e]-/.test(html))
})
test('G41C-03 clinical unit overview uses existing structured collection renderer',()=>{
  const a=app.indexOf("if (intent === 'units_overview')")
  const b=app.indexOf("if (intent === 'rotations_deep')",a)
  const block=app.slice(a,b)
  assert(block.includes("type: 'reslist'"))
  assert(block.includes('initialExpanded: full'))
  assert(block.includes('clinical unit'))
  assert(!block.includes("names.join(', ')"))
  assert(!block.includes('ask "list all units"'))
})
test('G41C-04 explicit list-all requests can start expanded',()=>{
  assert(app.includes('listExpanded: !!(ans.visual && ans.visual.initialExpanded)'))
  assert(html.includes("turn.listExpanded ? turn.visual.items : turn.visual.items.slice(0,5)"))
})
test('G41C-05 alternate clinical-unit intent converges on same structured answer',()=>{
  const a=app.indexOf("if (intent === 'clinical_units_overview')")
  const b=app.indexOf("if (intent === 'coverage_areas_overview')",a)
  assert(app.slice(a,b).includes("return _askBarBuildAnswerRaw('units_overview')"))
})
test('G41C-06 list rows carry concise operational metadata',()=>{
  const a=app.indexOf("if (intent === 'units_overview')")
  const b=app.indexOf("if (intent === 'rotations_deep')",a)
  const block=app.slice(a,b)
  assert(block.includes('u.unit_code || null'))
  assert(block.includes('Capacity ${cap} resident'))
  assert(block.includes("tone:status==='active'?'active':'default'"))
})
test('G41C-07 no new collection CSS system was introduced',()=>{
  assert(!css.includes('GROUNDED PHASE 4.1C'))
})
test('G41C-08 Phase 4.1B intelligence and Phase 4 Staff contracts remain present',()=>{
  ;['nd-intelligence-shell','nd-evidence-strip','nd-proposal','nd-intelligence-composer'].forEach(x=>assert(html.includes(x),x))
  ;['nd-workspace','nd-record-list','nd-person-drawer'].forEach(x=>assert(css.includes(x),x))
})

test('G41C-09 common directory-style list intents use the existing structured renderer',()=>{
  for(const intent of ['staff_can_pi','staff_roster','staff_with_phd','departments_overview','hospitals_overview','coverage_areas_overview']){
    const a=app.indexOf(`if (intent === '${intent}')`)
    assert(a>=0,intent)
    const tail=app.slice(a,a+6500)
    assert(tail.includes("type:'reslist'") || tail.includes("type: 'reslist'"),intent)
  }
})
test('G41C-10 collection hardening stays in answer data rather than new CSS chrome',()=>{
  assert(!css.includes('GROUNDED PHASE 4.1C'))
  assert(html.includes('askbar-reslist'))
  assert(html.includes('askbar-inline-more--list'))
})

let passed=0
for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);console.error(e.stack||e);process.exitCode=1;break}}
if(passed===tests.length) console.log(`${passed} V46.14 Grounded Phase 4.1C collection-rendering checks passed.`)
