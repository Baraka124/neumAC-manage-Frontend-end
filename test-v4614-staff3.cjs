const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const app=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('style.css','utf8');
const life=fs.readFileSync('STAFF-DOMAIN-LIFECYCLE-V46.14.md','utf8');
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8');
const tests=[]; const test=(n,f)=>tests.push([n,f]);
test('P3-01 phase marker and cache keys advance',()=>{assert(html.includes('STAFF PROFILE DRAWER · V46.14 PHASE 3'));assert(html.includes('app.js?v=46.14-staff-phase31-profile-integrity'));assert((html.includes('style.css?v=46.14-staff-phase31-profile-integrity') || html.includes('style.css?v=46.14-staff-phase4-ui-foundation')))});
test('P3-02 canonical Person shell is preserved',()=>{['Overview','Work &amp; training','Schedule','Research','Profile'].forEach(x=>assert(html.includes(x)));assert(html.includes('Canonical Person identity rail'))});
test('P3-03 all three resident variants are explicit',()=>{['department_internal','rotating_other_dept','external_resident'].forEach(x=>assert(html.includes(x)));['internal','rotating','external'].forEach(x=>assert(app.includes(x)))});
test('P3-04 resident adaptive training relationship surface exists',()=>{assert(html.includes('TRAINING RELATIONSHIP'));assert(html.includes('pp3-resident-overview'));assert(css.includes('STAFF PHASE 3 — ADAPTIVE RESIDENT PROFILE'))});
test('P3-05 origin to host route is rendered',()=>{assert(html.includes('pp3-route'));assert(html.includes('Current host unit')||html.includes('hostLabel'));assert(html.includes('originLabel'))});
test('P3-06 resident management is separate from rotation supervisor',()=>{assert(html.includes('Recorded rotation supervisor'));assert(html.includes('Resident management'));assert(app.includes('is_resident_manager'))});
test('P3-07 internal resident programme fields remain visible',()=>{assert(html.includes('Programme start'));assert(html.includes('Calculated programme end'))});
test('P3-08 rotating resident home department remains source-backed',()=>{assert(html.includes("resident_category==='rotating_other_dept'"));assert(app.includes('home_department_id'))});
test('P3-09 external resident origin/contact remain represented',()=>{assert(html.includes('Home institution'));assert(html.includes('External contact'));assert(app.includes('external_institution'))});
test('P3-10 legacy calendar year is normalised for display',()=>{assert(app.includes('_normalizeResidentYearValue'));assert(app.includes('Calculated from legacy start year'));assert(app.includes('currentYear - startYear + 1'))});
test('P3-11 residency start can compute effective R-year',()=>{assert(app.includes('_residentYearFromStartDate'));assert(app.includes('Calculated from programme start'))});
test('P3-12 manual override still wins',()=>{const i=app.indexOf('static effectiveResidentYear(staff)');const b=app.slice(i,i+900);assert(b.indexOf('residency_year_override')<b.indexOf('residency_year_calc'));assert(b.indexOf('residency_year_calc')<b.indexOf('_residentYearFromStartDate'))});
test('P3-13 current rotation includes extended lifecycle state',()=>{assert(app.includes("['active','extended'].includes(r.rotation_status)"));assert(app.includes("['active', 'scheduled', 'extended'].includes(r.rotation_status)"))});
test('P3-14 Grounded reuses effective resident year',()=>{assert(app.includes('const rYear = (s) => Utils.effectiveResidentYear(s)'))});
test('P3-15 lifecycle doc records display-only legacy normalization',()=>{assert(life.includes('stored legacy value is not overwritten'));assert(life.includes('Phase 3 implementation — adaptive resident profile'))});
test('P3-16 architecture advances to Staff Phase 3',()=>{assert(arch.includes('Architecture v2.5')||arch.includes('Architecture v2.6')||arch.includes('Architecture v2.7'));assert(arch.includes('Staff Phase 3 — Adaptive resident profile'))});
test('P3-17 security/sync remain deferred contracts',()=>{assert(fs.existsSync('PERMISSIONS_ARCHITECTURE.md'));assert(fs.existsSync('SYNC_ARCHITECTURE.md'));assert(fs.existsSync('SUPABASE_SCHEMA.sql'))});
test('P3-18 resident rail fallback avoids fragile v-else adjacency',()=>{assert(!html.includes('<div class="pp2-context" v-else>'));assert(html.includes('v-if="!isResidentType(staffProfileModal.staff.staff_type) || !getResidentTrainingContext(staffProfileModal.staff)"'))});
test('P3-19 profile summary fallback avoids fragile v-else adjacency',()=>{assert(!html.includes('<p v-else>Current operational context, clinical relationships and professional record.</p>'));assert(html.includes('<p v-if="!isResidentType(staffProfileModal.staff.staff_type) || !getResidentTrainingContext(staffProfileModal.staff)">Current operational context, clinical relationships and professional record.</p>'))});
let passed=0;for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n,e.message);process.exit(1)}}
console.log(`${passed} V46.14 Staff Phase 3 checks passed.`)
