'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const n=require('../mi-espacio/mi-espacio-workspace.js');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('duty workspace returns via shared state and retains origin',()=>{
 const a=n.create();a.dispatch({type:'OPEN_WORKSPACE',workspace:'duties',origin:{focusId:'me-v26g-duties-trigger',scrollY:700}});
 a.dispatch({type:'OPEN_DETAIL',detail:{type:'duty',id:'0'}});
 assert.equal(a.get().detail?.type,'duty');
 a.dispatch({type:'BACK'});assert.equal(a.get().detail,null);a.dispatch({type:'BACK'});assert.equal(a.get().view,'overview');assert.equal(a.get().origin.focusId,'me-v26g-duties-trigger');
});
test('duty selection is limited to linked personal context and host permissions',()=>{
 assert.match(src,/if\(!linked.value\|\|!state.activity\|\|!activateSecondary\('duties'\)\)return/);
 assert.match(src,/const entries=state.activity\?\.agenda\?\.guardias \|\| \[\]/);
 assert.match(src,/if\(!linked.value\|\|workspaceState.value.workspace!=='duties'/);
 assert.match(src,/v-if="can\('oncall_schedule'\)"/);
 assert.match(src,/role=".*"/);
});
test('responsive duty selection and focus return are visible',()=>{
 for(const marker of ['me-v26g-duty-detail','me-v26g-duty-title','me-v26g-duty-row','closeDutyDetail','returnToOverview'])assert.ok(src.includes(marker),marker);
 assert.match(css,/\.me-v26g-duty-layout/);assert.match(css,/max-width:800px/);assert.match(css,/focus-visible/);
});
