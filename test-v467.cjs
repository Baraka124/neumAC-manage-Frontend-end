const fs = require('fs')
const assert = require('assert')
const html = fs.readFileSync('index.html','utf8')
const app = fs.readFileSync('app.js','utf8')
const css = fs.readFileSync('style.css','utf8')
const readme = fs.readFileSync('README-V46.7.md','utf8')

const tests = [
  ['V46.7 build/cache markers', () => {
    assert(html.includes('neumDesk · V46.7') || html.includes('neumDesk · V46.8') || html.includes('neumDesk · V46.9') || html.includes('neumDesk · V46.10') || html.includes('neumDesk · V46.11') || html.includes('neumDesk · V46.12'))
    assert(html.includes('app.js?v=46.7-clinical-units-adaptive') || html.includes('app.js?v=46.8-grounded-architecture') || html.includes('app.js?v=46.9-grounded-action-integrity') || html.includes('app.js?v=46.10-leave-action-integrity') || html.includes('app.js?v=46.11-rotation-action-integrity') || html.includes('app.js?v=46.12-clinical-units'))
    assert(html.includes('style.css?v=46.7-clinical-units-adaptive') || html.includes('style.css?v=46.8-grounded-architecture') || html.includes('style.css?v=46.9-grounded-action-integrity') || html.includes('style.css?v=46.10-leave-action-integrity') || html.includes('style.css?v=46.11-rotation-action-integrity') || html.includes('style.css?v=46.12-clinical-units'))
  }],
  ['user-facing module name is Clinical Units', () => {
    assert(app.includes("training_units:        'Clinical Units'"))
    assert(html.includes('Clinical Units'))
  }],
  ['timeline hero metrics are portfolio-level rather than duplicated month summary', () => {
    assert(app.includes("label:'Incoming residents'"))
    assert(app.includes("label:'Attending-link setup'"))
    assert(app.includes("label:'Active conflicts'"))
    assert(html.includes('cu46-month-summary'))
  }],
  ['attention is aggregated and actionable', () => {
    assert(app.includes('Data setup ·'))
    assert(!app.includes('a default supervisor`})'))
    assert(html.includes("@click=\"item.view && (trainingUnitView=item.view)\""))
  }],
  ['adaptive team setup state exists', () => {
    assert(app.includes('clinicalUnitTeamSetupState'))
    assert(app.includes('clinicalUnitTeamSetupExpanded'))
    assert(html.includes('cu467-team-setup-state'))
    assert(html.includes('Show weekly matrix anyway'))
  }],
  ['teleported drawer rules are intentionally unscoped from app', () => {
    assert(css.includes('Teleported Unit Detail Drawer'))
    assert(css.includes('.udd466-overview.udd467-overview{display:grid!important'))
    assert(!css.includes('#app .udd466-overview.udd467-overview{display:grid!important'))
  }],
  ['drawer backdrop has no visual blur', () => {
    assert(css.includes('backdrop-filter:none!important'))
    assert(css.includes('-webkit-backdrop-filter:none!important'))
  }],
  ['12-month drawer capacity strip does not use horizontal scrolling', () => {
    assert(css.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important'))
    assert(css.includes('overflow:visible!important'))
  }],
  ['vacant-slot card repetition removed', () => {
    assert(!html.includes("Slot {{ getUnitActiveRotationCount(unitDetailDrawer.unit.id) + i }} — vacant"))
    assert(html.includes('udd467-resident-empty'))
    assert(html.includes('resident place{{ unitDetailDrawer.unit.maximum_residents===1'))
  }],
  ['duplicated next-available callout removed from drawer', () => {
    assert(!html.includes('Next available: {{ getNextFreeWindow(unitDetailDrawer.unit.id)?.label }}'))
    assert(html.includes('udd467-next-opening'))
    assert(html.includes('Plan here →'))
  }],
  ['Clinical Units dates use a consistent English locale', () => {
    assert(app.includes("toLocaleDateString('en-GB', { month:'short' })"))
    assert(app.includes("toLocaleDateString('en-GB',{weekday:'short',day:'numeric'})"))
  }],
  ['sticky Clinical Units context exists', () => {
    assert(html.includes('cu467-sticky-context'))
    assert(css.includes('#app .cu467-sticky-context{position:sticky'))
  }],
  ['V46.7 release notes document teleport/root cause and crisp visual rule', () => {
    assert(readme.includes('Vue Teleport selector scope'))
    assert(readme.includes('crisp, not cloudy'))
  }]
]
let passed = 0
for (const [name, fn] of tests) {
  try { fn(); console.log('PASS', name); passed++ }
  catch (e) { console.error('FAIL', name); console.error(e.stack || e); process.exitCode = 1 }
}
if (!process.exitCode) console.log(`${passed} V46.7 regression checks passed.`)
