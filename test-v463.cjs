const fs = require('fs')
const assert = require('assert')

const app = fs.readFileSync('app.js', 'utf8')
const html = fs.readFileSync('index.html', 'utf8')

const tests = [
  ['strict list loader exists for critical sources', () => assert(app.includes('async getListStrict(path, options = {})'))],
  ['medical staff uses the strict loader path', () => assert(app.includes("this.getListStrict('/api/medical-staff?limit=500'"))],
  ['staff loader identifies V46.3 hardening', () => assert(app.includes('V46.3 STAFF-LOAD HARDENING'))],
  ['critical staff is published before auxiliary context', () => {
    const publish = app.indexOf('medicalStaff.value = cleanStaff')
    const aux = app.indexOf('const [allStaffResult, hospitalsResult, unitsResult] = await Promise.allSettled')
    assert(publish >= 0 && aux > publish)
  }],
  ['auxiliary staff context cannot cancel critical staff load', () => assert(app.includes('Promise.allSettled([') && app.includes('all-status staff lookup unavailable; using active staff fallback'))],
  ['startup primary loaders use allSettled isolation', () => assert(app.includes('const primaryLoads = await Promise.allSettled(['))],
  ['startup operational loaders use allSettled isolation', () => assert(app.includes('const operationalLoads = await Promise.allSettled(['))],
  ['HTML carries a V46.3-or-later build and cache marker', () => {
    assert(html.includes('neumDesk · V46.3') || html.includes('neumDesk · V46.4') || html.includes('neumDesk · V46.5') || html.includes('neumDesk · V46.6') || html.includes('neumDesk · V46.7') || html.includes('neumDesk · V46.8') || html.includes('neumDesk · V46.9') || html.includes('neumDesk · V46.10') || html.includes('neumDesk · V46.11') || html.includes('neumDesk · V46.12') || html.includes('neumDesk · V46.13') || html.includes('neumDesk · V46.14'))
    assert(html.includes('app.js?v=46.3-staff-loader') || html.includes('app.js?v=46.4-clinical-units') || html.includes('app.js?v=46.5-clinical-units') || html.includes('app.js?v=46.6-clinical-units-detail') || html.includes('app.js?v=46.7-clinical-units-adaptive') || html.includes('app.js?v=46.8-grounded-architecture') || html.includes('app.js?v=46.9-grounded-action-integrity') || html.includes('app.js?v=46.10-leave-action-integrity') || html.includes('app.js?v=46.11-rotation-action-integrity') || html.includes('app.js?v=46.12-clinical-units') || html.includes('app.js?v=46.13-portfolio-intelligence') || (html.includes('app.js?v=46.14-personal-activity-workspace') || (html.includes('app.js?v=46.14-grounded-presentation-convergence') || (html.includes('app.js?v=46.14-interaction-focus-convergence') || (html.includes('app.js?v=46.14-leave-temporal-semantics') || (html.includes('app.js?v=46.14-leave-workspace-scope-convergence') || (html.includes('app.js?v=46.14-staff-phase1-directory') || (html.includes('app.js?v=46.14-staff-phase2-person-profile') || (html.includes('app.js?v=46.14-staff-phase31-profile-integrity') || (html.includes('app.js?v=46.14-grounded-phase41a-knowledge-contract') || html.includes('app.js?v=46.14-grounded-phase41b-ui-convergence')))))))))))
  }],
]

let passed = 0
for (const [name, fn] of tests) {
  try { fn(); console.log('PASS', name); passed++ }
  catch (e) { console.error('FAIL', name); console.error(e.stack || e); process.exitCode = 1 }
}
if (!process.exitCode) console.log(`${passed} V46.3 regression checks passed.`)
