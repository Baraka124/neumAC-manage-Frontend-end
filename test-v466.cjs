const fs=require('fs'), assert=require('assert'), vm=require('vm')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('style.css','utf8')
const readme=fs.readFileSync('README-V46.6.md','utf8')
const tests=[
 ['V46.6 build and cache markers',()=>{assert(html.includes('neumDesk · V46.6')||html.includes('neumDesk · V46.7'));assert(html.includes('app.js?v=46.6-clinical-units-detail')||html.includes('app.js?v=46.7-clinical-units-adaptive'));assert(html.includes('style.css?v=46.6-clinical-units-detail')||html.includes('style.css?v=46.7-clinical-units-adaptive'))}],
 ['application JavaScript parses',()=>{new vm.Script(app)}],
 ['canonical unit operational snapshot is exposed',()=>{assert(app.includes('const unitDetailSnapshot = computed'));assert(app.includes('unitDetailSnapshot, unitDetailCapacityMonths'));assert(html.includes('Resident capacity today'));assert(html.includes('Clinical team today'))}],
 ['unit drawer has a 12-month exact capacity strip',()=>{assert(app.includes('const unitDetailCapacityMonths = computed'));assert(html.includes('12-month resident capacity'));assert(html.includes('openCapacityInspector(unitDetailDrawer.unit,m)'))}],
 ['unit team error remains distinct from empty membership',()=>{assert(html.includes('Clinical-team data could not be loaded'));assert(html.includes('No clinical team assigned to this unit'));assert(html.includes("loadUnitStaff(unitDetailDrawer.unit.id,{force:true})"))}],
 ['Grounded can inherit and reopen unit context',()=>{assert(app.includes("currentView.value === 'training_units' && unitDetailDrawer?.show"));assert(app.includes("return { type:'unit', id:x.id"));assert(app.includes("if (c.type === 'unit')"));assert(html.includes('Ask Grounded'))}],
 ['Grounded understands month-scale planning language',()=>{assert(app.includes('next month|pr[oó]ximo mes|mes que viene'));assert(app.includes('const monthDefs = ['));assert(app.includes('November to January'))}],
 ['placement advisor blocks overlapping resident assignments',()=>{assert(app.includes('const residentConflicts = selectedResidentId'));assert(app.includes("const residentConflict = residentConflicts.length > 0"));assert(html.includes('Resident already assigned'))}],
 ['placement readiness distinguishes operational readiness',()=>{assert(app.includes('const operationalReady = fullFit && supervisorReady && teamCount > 0'));assert(html.includes('Operationally ready'));assert(css.includes('.cu465-placement-readiness .is-ready'))}],
 ['Grounded resident placement is exact-range capacity aware',()=>{assert(app.includes("if (intent === 'place_resident')"));assert(app.includes('const range = askBarParseRange(asked)'));assert(app.includes('const state=getUnitCapacityWindow(u.id,range.start,range.end)'));assert(app.includes('already has a recorded rotation overlapping'))}],
 ['unit drawer surfaces attention states',()=>{assert(app.includes("title:'Resident capacity exceeded'"));assert(app.includes("title:'Supervisor not assigned'"));assert(html.includes('unitDetailSnapshot?.alerts?.length'))}],
 ['release keeps backend separate',()=>{assert(readme.includes('No backend source file is included or modified'))}],
]
let passed=0
for(const [name,fn] of tests){try{fn();console.log('PASS',name);passed++}catch(e){console.error('FAIL',name);console.error(e.stack||e);process.exitCode=1}}
if(!process.exitCode)console.log(`${passed} V46.6 regression checks passed.`)
