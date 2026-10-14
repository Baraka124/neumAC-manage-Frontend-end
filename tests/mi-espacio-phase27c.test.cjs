'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const nav=require('../mi-espacio/mi-espacio-workspace.js');
const data=require('../mi-espacio/mi-espacio-data.js');
const doc=fs.readFileSync('docs/mi-espacio-phase27c-release-audit.md','utf8');
const workflow=fs.readFileSync('.github/workflows/frontend-integrity.yml','utf8');
test('identity changes purge contextual detail and uncommitted profile state',()=>{
 const a=nav.create();a.dispatch({type:'OPEN_WORKSPACE',workspace:'duties',origin:{focusId:'me-v26g-duties-trigger',scrollY:99}});
 a.dispatch({type:'OPEN_DETAIL',detail:{type:'duty',id:'0'}});
 a.dispatch({type:'RESET_ON_IDENTITY_CHANGE'});
 assert.equal(a.get().view,'overview');assert.equal(a.get().detail,null);assert.equal(a.get().origin,null);
 for(const marker of ['++calendarRequest; ++directoryRequest; ++profileRequest','profileBaseline.value=null','controller.abort()','state.context=null','state.activity=null','state.colleagues'])assert.ok(src.includes(marker),marker);
});
test('personal context fetch remains authoritative and no new bypass endpoints added',()=>{
 assert.match(src,/NeumMiEspacioData.loadContext/);
 assert.match(src,/if\(!linked.value\|\|!state.activity\|\|!activateSecondary\('duties'\)\)return/);
 assert.match(src,/v-if="can\('oncall_schedule'\)"/);
 assert.match(src,/v-if="can\('research'\)"/);
 assert.match(src,/NeumMiEspacioData.loadColleagues/);
 assert.match(src,/NeumMiEspacioData.loadCalendar/);
 const check=data.validateProfileDraft({...data.profileDraft({}),professional_email:'admin-only'});
 assert.equal(Object.hasOwn(check.fields,'professional_email'),false);
});
test('release audit refuses to certify real profiles or invent rollback target',()=>{
 for(const role of ['head of department','clinician','resident','biomedical engineer'])assert.match(doc,new RegExp(role,'i'));
 assert.match(doc,/NO-GO/);assert.match(doc,/previous known-good deployment SHA/);
 assert.match(doc,/actual deployment\/rollback identifiers remain unverified/);
 assert.match(doc,/No patient records/);
});
test('CI keeps 26A-26G contracts and real browser suite',()=>{
 for(const p of ['phase26a','phase26b','phase26c','phase26d','phase26e','phase26f','phase26g'])assert.ok(workflow.includes(p),p);
 assert.match(workflow,/npx playwright test/);
});
