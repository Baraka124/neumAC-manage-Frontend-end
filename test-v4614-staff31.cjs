const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8');
const life=fs.readFileSync('STAFF-DOMAIN-LIFECYCLE-V46.14.md','utf8');
const tests=[]; const test=(n,f)=>tests.push([n,f]);

test('P31-01 phase 3.1 cache markers and CDN runtime',()=>{
  assert(html.includes('app.js?v=46.14-staff-phase31-profile-integrity'));
  assert((html.includes('style.css?v=46.14-staff-phase31-profile-integrity') || html.includes('style.css?v=46.14-staff-phase4-ui-foundation')));
  assert(html.includes('https://unpkg.com/vue@3.4.21/dist/vue.global.prod.js'));
  assert(!html.includes('<script src="vue.global.js"></script>'));
});
test('P31-02 transient Person state resets before a new staff record opens',()=>{
  assert(app.includes('resetStaffProfileTransientState()'));
  ['researchProfile = null','supervisionData = null','leaveBalance = null','certificates = []','units = []'].forEach(x=>assert(app.includes(x)));
});
test('P31-03 async profile loads are token-guarded against person crossover',()=>{
  assert(app.includes('let staffProfileLoadSeq = 0'));
  assert(app.includes('isActiveStaffProfileLoad'));
  assert(app.includes('const profileLoadToken = ++staffProfileLoadSeq'));
  assert(app.includes('loadStaffCertificates(staff.id, profileLoadToken)'));
  assert(app.includes('loadStaffUnits(staff.id, profileLoadToken)'));
});
test('P31-04 unknown resident category is never inferred as Internal',()=>{
  assert(app.includes("})[staff.resident_category] || 'unknown'"));
  assert(app.includes('Resident category not recorded'));
  assert(app.includes("Resident · Category not recorded"));
  assert(app.includes('will not infer Internal, Rotating or External'));
});
test('P31-05 current and next rotations have distinct display semantics',()=>{
  ['Current host unit','Next host unit','Current rotation window','Next rotation window','Recorded next-rotation supervisor'].forEach(x=>assert(app.includes(x)));
  assert(html.includes('hostLabel'));
  assert(html.includes('windowLabel'));
  assert(html.includes('supervisorLabel'));
});
test('P31-06 current leave cannot also be returned as upcoming leave',()=>{
  const i=app.indexOf('const getUpcomingLeave'); const b=app.slice(i,i+700);
  assert(b.includes('Utils.normalizeDate(a.start_date) > today'));
  assert(b.includes("['cancelled','returned_to_duty']"));
  assert(!b.includes('>= today'));
});
test('P31-07 external resident contact phone is preserved in the Person profile',()=>{
  assert((html.match(/external_contact_phone/g)||[]).length>=2);
  assert(app.includes("external_contact_phone: 'basic'"));
});
test('P31-08 resident host attending context uses existing unit staff links',()=>{
  assert(app.includes('const getResidentHostTeam'));
  assert(app.includes('loadUnitStaff(residentCtx.rotation.training_unit_id)'));
  assert(html.includes('Host attending team'));
  assert(html.includes('not a formal supervision rule'));
});
test('P31-09 attending upcoming events include future resident supervision',()=>{
  assert(app.includes('Resident supervision begins'));
  assert(app.includes('Resident supervision active'));
  assert(app.includes('r.supervising_attending_id'));
});
test('P31-10 Staff Research uses actual research module permissions',()=>{
  assert(app.includes("['clinical_trials','research_lines','innovation_projects']"));
  assert(html.includes('v-if="canReadStaffResearch()"'));
  const profile=html.slice(html.indexOf('STAFF PROFILE DRAWER · V46.14 PHASE 3'));
  assert(!profile.includes("hasPermission('analytics','read')"));
});
test('P31-11 Person drawer has dialog semantics and focus trap baseline',()=>{
  assert(html.includes('role="dialog" aria-modal="true" aria-labelledby="pp2-profile-title" tabindex="-1"'));
  assert(html.includes('@keydown="trapStaffProfileFocus"'));
  assert(html.includes('role="tablist"'));
  assert((html.match(/role="tabpanel"/g)||[]).length>=5);
  assert(app.includes('const trapStaffProfileFocus'));
});
test('P31-12 Phase 3 adaptive taxonomy is still preserved',()=>{
  ['department_internal','rotating_other_dept','external_resident'].forEach(x=>assert(html.includes(x)||app.includes(x)));
  assert(app.includes("['active','extended'].includes(r.rotation_status)"));
});
test('P31-13 security and sync remain deferred contracts, not mixed into this UI fix',()=>{
  assert(fs.existsSync('PERMISSIONS_ARCHITECTURE.md'));
  assert(fs.existsSync('SYNC_ARCHITECTURE.md'));
  assert(fs.existsSync('SUPABASE_SCHEMA.sql'));
});
test('P31-14 architecture and lifecycle docs record Phase 3.1 integrity pass',()=>{
  assert(arch.includes('Staff Phase 3.1'));
  assert(life.includes('Phase 3.1'));
});

let passed=0;for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n,e.message);process.exit(1)}}
console.log(`${passed} V46.14 Staff Phase 3.1 integrity checks passed.`);
