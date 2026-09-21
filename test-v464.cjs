const fs = require('fs')
const assert = require('assert')
const app = fs.readFileSync('app.js','utf8')
const html = fs.readFileSync('index.html','utf8')
const css = fs.readFileSync('style.css','utf8')
const readme = fs.readFileSync('README-V46.4.md','utf8')

const tests = [
  ['V46.4 build marker and cache key', () => { assert(html.includes('neumDesk · V46.4') || html.includes('neumDesk · V46.5') || html.includes('neumDesk · V46.6') || html.includes('neumDesk · V46.7') || html.includes('neumDesk · V46.8') || html.includes('neumDesk · V46.9') || html.includes('neumDesk · V46.10') || html.includes('neumDesk · V46.11')); assert(html.includes('app.js?v=46.4-clinical-units') || html.includes('app.js?v=46.5-clinical-units') || html.includes('app.js?v=46.6-clinical-units-detail') || html.includes('app.js?v=46.7-clinical-units-adaptive') || html.includes('app.js?v=46.8-grounded-architecture') || html.includes('app.js?v=46.9-grounded-action-integrity') || html.includes('app.js?v=46.10-leave-action-integrity') || html.includes('app.js?v=46.11-rotation-action-integrity')) }],
  ['Clinical Units has three explicit operational lenses', () => { assert(html.includes('Rotation capacity')); assert(html.includes('Team & availability')); assert(html.includes('Unit directory')) }],
  ['resident capacity is month-first', () => { assert(app.includes('getUnitCapacityWindow')); assert(app.includes('getPlanningMonths')); assert(html.includes('Month-by-month')) }],
  ['capacity is interval-based rather than month-touch counting', () => { assert(app.includes('const boundaries = new Set')); assert(app.includes('two sequential')); assert(app.includes('segments.some(s=>s.free>0)')) }],
  ['over-capacity assignments remain visible', () => { assert(app.includes('an over-capacity assignment must remain visible')); assert(app.includes('overflow:true')) }],
  ['weekly view is real clinical-team availability', () => { assert(app.includes('clinicalUnitWeeklyTeamGrid')); assert(app.includes('absentMembers')); assert(!app.includes('const weeklyStaffingGrid = computed')) }],
  ['legacy undefined weeklyGridOffset is gone', () => { assert(!html.includes('weeklyGridOffset')) }],
  ['team load failure is distinct from an empty team', () => { assert(app.includes('unitStaffErrors')); assert(html.includes('Team unavailable')); assert(html.includes('Retry')) }],
  ['Grounded understands month-first availability questions', () => { assert(app.includes("intent === 'unit_forecast'")); assert(app.includes('which units are free and which month')); assert(app.includes('getUnitCapacityWindow(namedUnit.id')) }],
  ['V46.4 visual system is present', () => { assert(css.includes('V46.4 · Clinical Units — Operational Workspace')); assert(css.includes('.cu46-matrix')); assert(css.includes('.cu46-team-grid')) }],
  ['README documents separate resident and team time scales', () => { assert(readme.includes('Resident rotations:')); assert(readme.includes('Clinical-team readiness:')) }],
]
let passed=0
for (const [name,fn] of tests) { try { fn(); console.log('PASS',name); passed++ } catch(e) { console.error('FAIL',name); console.error(e.stack||e); process.exitCode=1 } }
if (!process.exitCode) console.log(`${passed} V46.4 regression checks passed.`)
