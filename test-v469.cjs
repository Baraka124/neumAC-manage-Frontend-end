const fs=require('fs'), assert=require('assert'), vm=require('vm')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('style.css','utf8')
const readme=fs.readFileSync('README-V46.9.md','utf8')
const tests=[
 ['V46.9 build/cache markers',()=>{assert(html.includes('neumDesk · V46.9'));assert(html.includes('app.js?v=46.9-clinical-units-domain'));assert(html.includes('style.css?v=46.9-clinical-units-domain'))}],
 ['application JavaScript parses',()=>{new vm.Script(app)}],
 ['Clinical Units uses Overview dashboard hero grammar',()=>{assert(html.includes('class="dbh-frame cu469-hero"'));assert(html.includes('clinicalUnitHeroModel.kicker'));assert(html.includes('clinicalUnitHeroModel.title'));assert(css.includes('DASHBOARD HEADER ALIGNMENT'))}],
 ['Clinical Units is excluded from generic breadcrumb band',()=>{assert(html.includes("'resident_rotations','training_units','research_hub'"))}],
 ['hero is lens-aware rather than repeating module title',()=>{assert(app.includes("kicker:'Unit staff'"));assert(app.includes("kicker:'Unit structure'"));assert(app.includes("kicker:'Resident rotations'"));assert(!html.includes('<div class="dbh-date">Clinical Units</div>'))}],
 ['unit staff lens is attending-physician semantics',()=>{assert(html.includes('<strong>Attending physicians</strong>'));assert(html.includes('Links · leave context'));assert(html.includes('Formal resident supervision is assigned at rotation / department level'))}],
 ['missing attending links are data setup not operational attention',()=>{assert(app.includes('const clinicalUnitDataSetupItems = computed'));assert(app.includes('no attending physicians linked'));assert(!app.includes("clinicalUnitAttentionItems") || !app.slice(app.indexOf('const clinicalUnitAttentionItems'),app.indexOf('const clinicalUnitDataSetupItems')).includes('no attending physicians linked'))}],
 ['unit-level default supervisor is not a Clinical Units alert',()=>{const block=app.slice(app.indexOf('const clinicalUnitAttentionItems'),app.indexOf('const clinicalUnitDataSetupItems'));assert(!block.includes('default supervisor'));assert(!block.includes('Supervisor not assigned'))}],
 ['training-unit save does not persist supervisor fields',()=>{const block=app.slice(app.indexOf('const saveTrainingUnit'),app.indexOf('// Weekly clinical-team availability'));assert(!block.includes('supervisor_id'));assert(!block.includes('supervising_attending_id'))}],
 ['attending-link save does not update training-unit supervisor',()=>{const block=app.slice(app.indexOf('const saveUnitClinicians'),app.indexOf('const viewUnitResidents'));assert(!block.includes('updateTrainingUnit'));assert(block.includes("role: 'primary'"))}],
 ['unit selection does not auto-assign resident supervisor',()=>{const p=app.indexOf('Unit selection never auto-assigns a resident supervisor');assert(p>0);const block=app.slice(p,p+500);assert(block.includes('checkRotationAvailability()'));assert(!block.includes('supervising_attending_id ='))}],
 ['rotation supervisor selector prioritizes department supervision not unit membership',()=>{assert(html.includes('Department resident supervisors'));assert(html.includes('Other eligible attendings'));assert(!html.includes('─ Unit clinical team ─'))}],
 ['department staff unit links use unit_staff cache semantics',()=>{assert(app.includes('const getStaffLinkedClinicalUnits'));assert(html.includes('getStaffLinkedClinicalUnits(s.id, deptPanel.dept?.id)'));assert(html.includes('no unit links'))}],
 ['department unit cards show attending-link count not legacy unit supervisor',()=>{assert(html.includes("getUnitAttendingCount(unit.id) }} attending"));const unitsTab=html.slice(html.indexOf('<!-- TAB: UNITS -->'),html.indexOf('<!-- TAB: ROTATIONS -->')>0?html.indexOf('<!-- TAB: ROTATIONS -->'):html.indexOf('<!-- ══ DEPARTMENT'));assert(!unitsTab.includes('getUnitSupervisorName(unit)'))}],
 ['unit drawer separates attending physicians current residents and department supervision',()=>{assert(html.includes('<span>Attending physicians</span>'));assert(html.includes('<span>Current residents</span>'));assert(html.includes('Resident programme supervision')); assert(html.includes('No attending physicians linked to this unit.'))}],
 ['resident placement is gated by overlap and capacity only',()=>{assert(app.includes('const fullFit = capacityFit && !residentConflict'));assert(!app.includes('const operationalReady = fullFit && supervisorReady'));assert(app.includes("blocked.push('resident_overlap')"));assert(app.includes("blocked.push('unit_capacity')"))}],
 ['Grounded Clinical Units adapter carries attending context without gating capacity',()=>{assert(app.includes("name:'clinical_units.attending_context'"));assert(app.includes('contextOnly:true'));assert(app.includes('attendingContext,capacityFit'));assert(!app.includes("blocked.push('unit_supervisor')"))}],
 ['legacy unit-supervisor question is corrected semantically',()=>{assert(app.includes("if (intent === 'unit_supervisor_gap')"));assert(app.includes('Clinical Units do not require a unit-level resident supervisor. Formal resident supervision is assigned at the rotation / department level.'))}],
 ['release docs state domain model and no backend change',()=>{assert(readme.includes('Clinical Unit ↔ attending physicians'));assert(readme.includes('Resident supervision'));assert(readme.includes('No backend source file is included or modified'))}],
 ['crisp header avoids cloudy decorative haze',()=>{assert(css.includes('.cu469-hero::after{display:none!important;content:none!important;}'));assert(css.includes('backdrop-filter:none!important'))}],
]
let passed=0
for(const [name,fn] of tests){try{fn();console.log('PASS',name);passed++}catch(e){console.error('FAIL',name);console.error(e.stack||e);process.exitCode=1}}
if(!process.exitCode)console.log(`${passed} V46.9 Clinical Units domain-semantics checks passed.`)
