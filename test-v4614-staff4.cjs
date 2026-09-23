const fs=require('fs');
const crypto=require('crypto');
const assert=require('assert');
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('style.css','utf8');
const ui=fs.readFileSync('UI-SYSTEM-V46.14.md','utf8');
const arch=fs.readFileSync('DepartmentOS_Architecture.md','utf8');
const life=fs.readFileSync('STAFF-DOMAIN-LIFECYCLE-V46.14.md','utf8');
const tests=[];
const test=(name,fn)=>tests.push([name,fn]);
const sha=(f)=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

test('P4-01 phase 4 presentation marker and CSS cache key',()=>{
  assert(html.includes('data-ui-foundation="staff-phase4"'));
  assert(html.includes('style.css?v=46.14-staff-phase4-ui-foundation'));
  assert(html.includes('app.js?v=46.14-staff-phase31-profile-integrity'));
});

test('P4-02 Staff workspace exposes reusable shell contract',()=>{
  ['nd-workspace','nd-context-strip','nd-hero','nd-toolbar','nd-segmented','nd-filterbar','nd-search'].forEach(x=>assert(html.includes(x),x));
});

test('P4-03 operational table exposes reusable data grammar',()=>{
  ['nd-table-shell','nd-table','nd-identity','nd-context-list','nd-context-item','nd-status','nd-menu--row'].forEach(x=>assert(html.includes(x),x));
});

test('P4-04 People and Compact views share canonical browse components',()=>{
  ['nd-card-grid','nd-person-card','nd-chip-row','nd-compact-list','nd-compact-row'].forEach(x=>assert(html.includes(x),x));
});

test('P4-05 Person renderer exposes reusable component vocabulary',()=>{
  ['nd-person-drawer','nd-person-rail','nd-person-main','nd-person-head','nd-person-body','nd-tabs','nd-section','nd-section-head'].forEach(x=>assert(html.includes(x),x));
});

test('P4-06 Person record patterns are reusable',()=>{
  ['nd-state-grid','nd-state-card','nd-timeline','nd-timeline-item','nd-kv-grid','nd-record-list','nd-record-row','nd-record-meta','nd-contact-grid','nd-empty-state','nd-tag'].forEach(x=>assert(html.includes(x),x));
});

test('P4-07 compatibility hooks are preserved during extraction',()=>{
  ['staff46-page','staff46-table','person-profile-v2','pp2-section','pp2-list-row','pp3-resident-overview'].forEach(x=>assert(html.includes(x),x));
});

test('P4-08 generic UI tokens define one control and typography rhythm',()=>{
  ['--nd-control-h:40px','--nd-control-r:9px','--nd-type-meta:11px','--nd-type-label:11px','--nd-focus-ring'].forEach(x=>assert(css.includes(x),x));
});

test('P4-09 migrated support typography has an 11px floor',()=>{
  assert(css.includes('.nd-section-head small'));
  assert(css.includes('font-size:var(--nd-type-label) !important'));
  assert(css.includes('.nd-record-meta em'));
  assert(css.includes('font-size:11px !important'));
});

test('P4-10 focus treatment is keyboard-visible across core components',()=>{
  ['.nd-btn:focus-visible','.nd-segmented button:focus-visible','.nd-table tbody tr:focus-visible','.nd-person-card:focus-visible','.nd-tabs button:focus-visible','.nd-person-drawer button:focus-visible'].forEach(x=>assert(css.includes(x),x));
});

test('P4-11 status semantics remain explicit and not availability-labelled',()=>{
  assert(css.includes('--nd-status-active-bg'));
  assert(css.includes('.nd-status.is-away'));
  const staffBlock=html.slice(html.indexOf('CLINICAL STAFF VIEW'),html.indexOf('ON-CALL SCHEDULE VIEW'));
  assert(!staffBlock.includes('>Available<'));
});

test('P4-12 responsive foundation exists without replacing existing breakpoints',()=>{
  assert(css.includes('@media (max-width:980px)'));
  assert(css.includes('@media (max-width:720px)'));
  assert(css.includes('.nd-tabs{scroll-snap-type:x proximity;}'));
});

test('P4-13 crisp presentation contract does not introduce backdrop blur',()=>{
  const p4=css.slice(css.indexOf('STAFF PHASE 4 CANDIDATE'));
  assert(p4.length>0);
  assert(!/backdrop-filter\s*:/.test(p4));
});

test('P4-14 app runtime is byte-for-byte preserved',()=>{
  assert.strictEqual(sha('app.js'),'35f9bddab97ffc58bcaa0707184664be75e2ca82d34994d32b171a4c8631e10b');
});

test('P4-15 Grounded and Personal Activity runtimes are preserved',()=>{
  assert.strictEqual(sha('grounded-core.js'),'738ed64d64f02358079b94635591b63bf3f5a227301c5e46f473acc98697220b');
  assert.strictEqual(sha('activity45.js'),'c943857ad57655cfea16a505957587eb5cd00ec119c3696d98961ce2c80aaedb');
});

test('P4-16 UI contract explicitly preserves lifecycle schema permissions and sync boundaries',()=>{
  ['presentation-only','Supabase schema','permissions contract','sync contract','One Person model'].forEach(x=>assert(ui.includes(x),x));
});

test('P4-17 Phase 4 remains an honest candidate pending four-profile browser validation',()=>{
  ['Attending','Internal Resident','Rotating Resident','External Resident'].forEach(x=>assert(ui.includes(x),x));
  assert(ui.includes('candidate checkpoint'));
});

test('P4-18 architecture and lifecycle carry the candidate checkpoint',()=>{
  assert(arch.includes('Staff Phase 4 candidate — reusable UI foundation'));
  assert(life.includes('Staff Phase 4 candidate — reusable UI foundation'));
});

let passed=0;
for(const [name,fn] of tests){
  try{fn(); console.log('PASS',name); passed++;}
  catch(e){console.error('FAIL',name); console.error(e.stack||e); process.exitCode=1; break;}
}
if(passed===tests.length) console.log(`${passed} V46.14 Staff Phase 4 UI Foundation checks passed.`);
