const fs=require('fs'),assert=require('assert'),vm=require('vm')
const app=fs.readFileSync('app.js','utf8'), html=fs.readFileSync('index.html','utf8'), css=fs.readFileSync('style.css','utf8')
const dept=fs.readFileSync('DepartmentOS_Architecture.md','utf8'), grd=fs.readFileSync('GROUNDED-ARCHITECTURE.md','utf8')
const tests=[
 ['V46.12 markers',()=>{assert(html.includes('neumDesk · V46.12')||html.includes('neumDesk · V46.13')||html.includes('neumDesk · V46.14'));assert(html.includes('app.js?v=46.12-clinical-units')||html.includes('app.js?v=46.13-portfolio-intelligence')||(html.includes('app.js?v=46.14-personal-activity-workspace') || html.includes('app.js?v=46.14-grounded-presentation-convergence')));assert((html.includes('style.css?v=46.12-clinical-units') || html.includes('style.css?v=46.14-grounded-presentation-convergence')))}],
 ['app parses',()=>new vm.Script(app)],
 ['Clinical Units hides duplicate breadcrumb',()=>assert(html.includes("'training_units'" ) && html.includes("!['dashboard','resident_rotations','training_units'"))],
 ['hero is contextual rather than duplicate Clinical Units title',()=>{assert(html.includes("trainingUnitView==='timeline' ? clinicalUnitHeaderContext"));assert(!html.includes('<h1>Clinical Units</h1>'))}],
 ['attending physicians are the unit staff concept',()=>{assert(html.includes('<strong>Attending physicians</strong>'));assert(html.includes('No attending physicians linked'))}],
 ['unit editor has no supervising attending field',()=>assert(!html.includes('<div class="sm-label">Supervising Attending</div>'))],
 ['rotation UI treats supervisor as formal rotation role',()=>assert(html.includes('Formal resident supervisor'))],
 ['unit selection does not auto-fill formal supervisor',()=>assert(app.includes('Clinical Unit selection never auto-assigns formal resident supervision'))],
 ['unit staff save writes membership only',()=>{assert(app.includes("role:'attending'"));assert(!app.includes("role: staffId === unitCliniciansModal.supervisorId ? 'primary' : 'secondary'"))}],
 ['placement hard constraints exclude unit supervisor readiness',()=>{assert(app.includes('const operationalReady = fullFit'));assert(!app.includes('const operationalReady = fullFit && supervisorReady'))}],
 ['unit supervisor gap query explains correct semantics',()=>assert(app.includes('Clinical Units do not require a unit-level resident supervisor'))],
 ['Grounded attending context does not expose unit supervisor requirement',()=>{assert(app.includes('attendingPhysicians:members.map'));assert(!app.includes('ready:members.length>0 && !!supervisor'))}],
 ['crisp no-cloud visual rule',()=>{assert(css.includes('Crisp surfaces only'));assert(css.includes('.cu465-command-hero::after{display:none!important}'))}],
 ['living architecture advanced',()=>{assert(dept.includes('Implementation checkpoint: V46.12')||dept.includes('Implementation checkpoint: V46.13')||dept.includes('Implementation checkpoint: V46.14'));assert(dept.includes('Personal Activity / Portfolio Intelligence'))}],
 ['Grounded contract records Clinical Units semantics',()=>assert(grd.includes('Clinical Units semantic contract (V46.12)'))],
]
let n=0;for(const[t,f]of tests){try{f();console.log('PASS',t);n++}catch(e){console.error('FAIL',t);console.error(e.stack||e);process.exitCode=1}}
if(!process.exitCode)console.log(`${n} V46.12 Clinical Units consolidation checks passed.`)
