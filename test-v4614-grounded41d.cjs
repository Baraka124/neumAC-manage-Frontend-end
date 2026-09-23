const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('style.css','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])

test('G41D-01 application JavaScript parses',()=>new vm.Script(app))
test('G41D-02 cache marker advances only Grounded delivery assets',()=>{
  assert(/app\.js\?v=46\.14-grounded-phase41[de]-/.test(html))
  assert(/style\.css\?v=46\.14-grounded-phase41[de]-/.test(html))
})
test('G41D-03 structured collections use a compact scope line',()=>{
  assert(html.includes("['reslist','roster'].includes(turn.visual.type)\" class=\"nd-collection-scope\"") || html.includes("turn.visual.type === 'reslist'\" class=\"nd-collection-scope\""))
  assert(html.includes('aria-label="Answer scope and retrieval time"'))
  const compact=html.indexOf('class="nd-collection-scope"')
  const legacy=html.indexOf('class="gr45-review-control nd-answer-scope"')
  assert(compact>=0 && legacy>compact)
})
test('G41D-04 collection scope no longer carries a hide-detail control',()=>{
  const a=html.indexOf('class="nd-collection-scope"')
  const b=html.indexOf('v-else-if="turn.visual',a)
  const block=html.slice(a,b)
  assert(!block.includes('Hide detail'))
  assert(!block.includes('Show details'))
})
test('G41D-05 default collection remains a five-record preview',()=>{
  assert(html.includes('turn.visual.items.slice(0,5)'))
  assert(html.includes("'Show ' + (turn.visual.items.length - 5) + ' more'"))
})
test('G41D-06 explicit full clinical-unit request starts expanded and stays full',()=>{
  const a=app.indexOf("if (intent === 'units_overview')")
  const b=app.indexOf("if (intent === 'rotations_deep')",a)
  const block=app.slice(a,b)
  assert(block.includes("initialExpanded: full, lockExpanded: full"))
  assert(html.includes('!turn.visual.initialExpanded && !turn.visual.lockExpanded'))
})
test('G41D-07 manually expanded previews say Collapse list rather than Show fewer',()=>{
  assert(html.includes("turn.listExpanded ? 'Collapse list'"))
  assert(!html.includes("turn.listExpanded ? 'Show fewer'"))
})
test('G41D-08 record identity and code receive a two-column collection layout',()=>{
  assert(css.includes('.askbar-turn--collection .askbar-reslist-main'))
  assert(css.includes('grid-template-columns:minmax(0,1fr) auto'))
  assert(css.includes('.askbar-turn--collection .askbar-reslist-badge'))
  assert(css.includes('justify-self:end'))
})
test('G41D-09 collection rows are denser without violating the 11px support-text floor',()=>{
  assert(css.includes('.askbar-turn--collection .askbar-reslist-row'))
  assert(css.includes('padding:8px 12px'))
  assert(css.includes('.askbar-turn--collection .askbar-reslist-meta'))
  assert(css.includes('font-size:11px'))
})
test('G41D-10 verified collection provenance is compressed but partial warnings remain possible',()=>{
  assert(html.includes("? 'Sources verified'"))
  assert(html.includes("turn.confidenceReason && !(turn.visual && ['reslist','roster'].includes(turn.visual.type) && turn.knowledge && turn.knowledge.complete)") || html.includes("turn.confidenceReason && !(turn.visual && turn.visual.type === 'reslist' && turn.knowledge && turn.knowledge.complete)"))
  assert(html.includes('nd-evidence-warning'))
})
test('G41D-11 new CSS is strictly scoped to Grounded collection answers',()=>{
  const marker='GROUNDED PHASE 4.1D · COLLECTION DENSITY'
  const i=css.indexOf(marker)
  assert(i>=0)
  const block=css.slice(i)
  assert(!/\.staff46-|\.pp2-|\.pp3-|\.nd-workspace|\.nd-person-drawer/.test(block))
  const selectors=block.split('{').slice(0,-1).map(x=>x.split('}').pop().trim()).filter(x=>x && !x.startsWith('@'))
  for(const sel of selectors){
    if(sel.includes('html body #app')) assert(sel.includes('.nd-intelligence-shell'), sel)
  }
})
test('G41D-12 Grounded shell and Staff Phase 4 contracts remain present',()=>{
  for(const x of ['nd-intelligence-shell','nd-evidence-strip','nd-intelligence-composer']) assert(html.includes(x),x)
  for(const x of ['nd-workspace','nd-record-list','nd-person-drawer']) assert(css.includes(x),x)
})

let passed=0
for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);console.error(e.stack||e);process.exitCode=1;break}}
if(passed===tests.length) console.log(`${passed} V46.14 Grounded Phase 4.1D collection-density checks passed.`)
