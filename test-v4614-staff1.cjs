const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const style=fs.readFileSync('style.css','utf8');
const dept=fs.readFileSync('DepartmentOS_Architecture.md','utf8');
const lifecycle=fs.readFileSync('STAFF-DOMAIN-LIFECYCLE-V46.14.md','utf8');
const tests=[];const test=(n,fn)=>tests.push([n,fn]);

test('S1 Staff primary breadcrumb is removed in consolidated shell',()=>{const m=html.match(/v-if="!\[([^\]]+)\]\.includes\(currentView\)"/);assert(m&&m[1].includes("'medical_staff'"));assert(html.includes('WORKFORCE DIRECTORY'))});
test('S2 staff hero uses truthful active staff language not availability proxy',()=>{assert(html.includes('{{ deptPulseStats.active }} active staff'));assert(html.includes('<span>Active staff</span>'));assert(!html.includes('<div class="dpb-label">Available</div>'))});
test('S3 visible view controls separate Table People Compact',()=>{assert(html.includes("staffView='table'"));assert(html.includes("staffView='people'"));assert(html.includes("staffView='compact'"));assert(style.includes('.staff46-view-switch button.active'))});
test('S4 People view is top-level reachable rather than nested inside Compact',()=>{const people=html.indexOf('<div v-if="staffView===\'people\'" class="staff46-people">');const compact=html.indexOf('<div v-if="staffView===\'compact\'" class="staff46-compact">');assert(people>0&&compact>people);const prefix=html.slice(Math.max(0,people-300),people);assert(!prefix.includes('staffView === \'compact\''))});
test('S5 resident categories use full semantic labels',()=>{['Resident · Internal','Resident · Rotating','Resident · External'].forEach(x=>assert(html.includes(x)));assert(app.includes("label: `Resident · ${category}`"))});
test('S6 effective resident year precedence is preserved',()=>{assert(app.includes('if (staff.residency_year_override) return staff.residency_year_override'));assert(app.includes('if (staff.residency_year_calc) return staff.residency_year_calc'));assert(lifecycle.includes('residency_year_override` → calculated `residency_year_calc` → legacy `training_year`'))});
test('S7 first operational Staff table has task-oriented columns',()=>{['Staff member','Role','Current / next','Record status'].forEach(x=>assert(html.includes(x)));assert(!html.includes('<th>Rotation</th>'))});
test('S8 row actions preserve record activity edit and guarded removal',()=>{assert(html.includes('Open record'));assert(html.includes('Personal activity'));assert(html.includes('Edit profile'));assert(html.includes('Remove from active staff'));assert(app.includes('const deleteMedicalStaff = (staff) =>'))});
test('S9 Staff search now includes role specialty department and origin data',()=>{assert(app.includes('const resident = isResidentType(x.staff_type) ? Utils.formatResidentCategoryDetailed(x)'));assert(app.includes('x.specialization'));assert(app.includes('x.home_department'));assert(app.includes('x.external_institution'))});
test('S10 directory current context composes live absence on-call and rotation data',()=>{assert(app.includes('const getStaffDirectoryContextItems'));assert(app.includes("type: 'leave'"));assert(app.includes("type: 'oncall'"));assert(app.includes("type: 'rotation'"))});
test('S11 active record status is distinct from current absence',()=>{assert(app.includes('const getStaffDirectoryRecordState'));assert(app.includes("label: 'Away today'"));assert(app.includes("label: 'Active'"));assert(lifecycle.includes('Do not equate these concepts'))});
test('S12 backend lifecycle is intentionally untouched and documented',()=>{assert(lifecycle.includes('Staff type transition'));assert(lifecycle.includes('automatically terminates active/scheduled resident rotations'));assert(lifecycle.includes('soft-delete'));assert(dept.includes('V46.14 Staff Phase 1 — preservation-first directory redesign'))});
test('S13 Staff phase does not replace registration edit workflow',()=>{assert(html.includes('@click="showAddMedicalStaffModal"'));assert(app.includes('const editMedicalStaff = (staff) =>'));assert(app.includes('const saveMedicalStaff = async'));assert(lifecycle.includes('registration/edit workflow and full Person profile remain functionally intact')||fs.readFileSync('README-V46.14.md','utf8').includes('registration/edit form and full Person profile remain functionally intact'))});
test('S14 Staff phase cache marker is active',()=>{assert(/app\.js\?v=46\.14-staff-phase(?:1-directory|2-person-profile)/.test(html));assert(/style\.css\?v=46\.14-staff-phase(?:1-directory|2-person-profile)/.test(html))});

let passed=0;for(const [n,fn] of tests){try{fn();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);throw e}}console.log(`${passed} V46.14 Staff Phase 1 checks passed.`);
