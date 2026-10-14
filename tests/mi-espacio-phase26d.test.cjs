'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const nav=require('../mi-espacio/mi-espacio-workspace.js');
test('verified research and publications have one active contextual workspace',()=>{
 for(const kind of ['research','publications']){
  const n=nav.create();n.dispatch({type:'OPEN_WORKSPACE',workspace:kind,origin:{focusId:'trigger',scrollY:123}});
  assert.equal(n.get().workspace,kind);assert.equal(n.dispatch({type:'BACK'}).view,'overview');
  assert.match(src,new RegExp("openPortfolio\\('"+kind+"'\\)"));
 }
});
test('research handoff is permission-gated and payload comes from personal context',()=>{
 assert.match(src,/v-if="can\('research'\)"/);
 assert.match(src,/if\(!linked.value\|\|!state.activity/);
 assert.match(src,/researchItems/);assert.match(src,/state.activity.publications.items/);
 assert.doesNotMatch(src,/\/api\/medical-staff\/.*publications/);
});
