const fs = require('fs')
const assert = require('assert')
const app = fs.readFileSync('app.js','utf8')
const html = fs.readFileSync('index.html','utf8')
const css = fs.readFileSync('style.css','utf8')
const readme = fs.readFileSync('README-V46.5.md','utf8')

const tests = [
  ['V46.5 build marker and cache key', () => { assert(html.includes('neumDesk · V46.5') || html.includes('neumDesk · V46.6') || html.includes('neumDesk · V46.7') || html.includes('neumDesk · V46.8') || html.includes('neumDesk · V46.9') || html.includes('neumDesk · V46.10') || html.includes('neumDesk · V46.11') || html.includes('neumDesk · V46.12') || html.includes('neumDesk · V46.13') || html.includes('neumDesk · V46.14')); assert(html.includes('app.js?v=46.5-clinical-units') || html.includes('app.js?v=46.6-clinical-units-detail') || html.includes('app.js?v=46.7-clinical-units-adaptive') || html.includes('app.js?v=46.8-grounded-architecture') || html.includes('app.js?v=46.9-grounded-action-integrity') || html.includes('app.js?v=46.10-leave-action-integrity') || html.includes('app.js?v=46.11-rotation-action-integrity') || html.includes('app.js?v=46.12-clinical-units') || html.includes('app.js?v=46.13-portfolio-intelligence') || (html.includes('app.js?v=46.14-personal-activity-workspace') || (html.includes('app.js?v=46.14-grounded-presentation-convergence') || (html.includes('app.js?v=46.14-interaction-focus-convergence') || (html.includes('app.js?v=46.14-leave-temporal-semantics') || (html.includes('app.js?v=46.14-leave-workspace-scope-convergence') || (html.includes('app.js?v=46.14-staff-phase1-directory') || (html.includes('app.js?v=46.14-staff-phase2-person-profile') || (html.includes('app.js?v=46.14-staff-phase31-profile-integrity') || (html.includes('app.js?v=46.14-grounded-phase41a-knowledge-contract') || html.includes('app.js?v=46.14-grounded-phase41b-ui-convergence'))))))))))); assert(html.includes('style.css?v=46.5-clinical-units') || html.includes('style.css?v=46.6-clinical-units-detail') || html.includes('style.css?v=46.7-clinical-units-adaptive') || html.includes('style.css?v=46.8-grounded-architecture') || html.includes('style.css?v=46.9-grounded-action-integrity') || html.includes('style.css?v=46.10-leave-action-integrity') || html.includes('style.css?v=46.11-rotation-action-integrity') || (html.includes('style.css?v=46.12-clinical-units') || (html.includes('style.css?v=46.14-grounded-presentation-convergence') || (html.includes('style.css?v=46.14-interaction-focus-convergence') || (html.includes('style.css?v=46.14-leave-workspace-scope-convergence') || (html.includes('style.css?v=46.14-staff-phase1-directory') || (html.includes('style.css?v=46.14-staff-phase2-person-profile') || (html.includes('style.css?v=46.14-staff-phase31-profile-integrity') || (html.includes('style.css?v=46.14-staff-phase4-ui-foundation') || html.includes('style.css?v=46.14-grounded-phase41b-ui-convergence')))))))))) }],
  ['getUnitAttendingCount render crash is wired through root setup', () => {
    assert(app.includes('loadUnitStaff, getUnitAttendingCount'))
    const rootReturn = app.lastIndexOf('unitStaffCache, unitStaffLoading, unitStaffErrors, loadUnitStaff, getUnitAttendingCount')
    assert(rootReturn > 0)
    assert(html.includes('{{ getUnitAttendingCount(unit.id) }}'))
  }],
  ['dashboard-aligned command header exists', () => { assert(html.includes('cu465-command-hero')); assert(css.includes('V46.5 · Clinical Units — Operational Intelligence')); assert(html.includes('clinicalUnitAttentionItems')) }],
  ['resident placement advisor is date-range based', () => { assert(app.includes('placementAdvisor')); assert(app.includes('placementRecommendations')); assert(html.includes('Find a rotation that fits the requested dates')); assert(html.includes('Only show units with space throughout')) }],
  ['placement advisor uses exact interval-capacity engine', () => { assert(app.includes('const state = getUnitCapacityWindow(unit.id, start, end)')); assert(app.includes('state.minFree > 0') || app.includes('state.minFree>0')) }],
  ['capacity month cells open exact inspector', () => { assert(html.includes('@click="openCapacityInspector(row.unit,month)"')); assert(app.includes('capacityInspector')); assert(html.includes('Residents affecting this period')) }],
  ['exact next opening is interval-based', () => { assert(app.includes('const getNextFreeWindow')); assert(html.includes('Next exact opening')); assert(html.includes('getNextFreeWindow(unit.id)?.label')) }],
  ['team-day drilldown separates present and absent members', () => { assert(app.includes('presentMembers')); assert(html.includes('openClinicalUnitTeamDay')); assert(html.includes('Recorded absence')) }],
  ['resident and clinical-team time scales remain separated', () => { assert(readme.includes('Resident planning stays month-first')); assert(readme.includes('Clinical-team readiness remains a separate weekly/day-scale concept')) }],
  ['new workflow still delegates final assignment to normal rotation modal', () => { assert(app.includes('rotationOps.showAddRotationModal(resident, unit)')); assert(app.includes('rotationOps.rotationModal.form.start_date = placementAdvisor.startDate')) }],
  ['no backend source is bundled by release design', () => { assert(readme.includes('No backend source file is included or modified')) }],
]
let passed=0
for (const [name,fn] of tests) { try { fn(); console.log('PASS',name); passed++ } catch(e) { console.error('FAIL',name); console.error(e.stack||e); process.exitCode=1 } }
if (!process.exitCode) console.log(`${passed} V46.5 regression checks passed.`)
