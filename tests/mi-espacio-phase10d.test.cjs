'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('account transition resets personal and review data before new load',()=>{
 for(const t of ['state.context=null','state.activity=null','state.reports=[]','state.review','controller.abort()','id!==oldId'])assert.ok(src.includes(t),t);
});
test('loading geometry follows overview shape without exposing old data',()=>{
 assert.match(src,/v-if="state.activityBusy" class="me-activity me-activity-placeholder me-v10d-loading"/);
 assert.match(css,/me-v10d-loading-grid/);
 assert.match(css,/max-width:850px/);
});
test('review and activity continue to require session and identity checks',()=>{
 assert.match(src,/requestSeq!==seq\|\|!props.active\|\|String\(props.user\?\.id\)!==identity/);
 assert.match(src,/state.review.can && !state.review.busy && !state.review.error && state.review.filter==='open' && state.review.items.length/);
});
test('claim-picker async results are rejected after a session transition',()=>{
 const start=src.indexOf('async function onSubjectTypeChange()');
 const end=src.indexOf('function onSubjectPick()',start);
 assert.ok(start>=0&&end>start);
 const picker=src.slice(start,end);
 assert.match(picker,/const requestSeq=seq, identity=String\(props\.user\?\.id\|\|''\)/);
 assert.match(picker,/requestSeq===seq && props\.active && String\(props\.user\?\.id\|\|''\)===identity/);
 assert.match(picker,/if\(stillCurrent\(\)&&state\.report\.subject_type===t\) state\.picker\.items=items/);
});

test('discrepancy and review mutations ignore stale account responses',()=>{
 for(const name of ['submitReport','resolveItem']){
  const start=src.indexOf('async function '+name+'(');
  const end=src.indexOf(name==='submitReport'?'// Reviewer queue':'async function loadActivity(',start);
  const section=src.slice(start,end);
  assert.match(section,/const requestSeq=seq, identity=String\(props\.user\?\.id\|\|''\)/);
  assert.match(section,/if\(!stillCurrent\(\)\)return/);
  assert.match(section,/if\(stillCurrent\(\)\)/);
 }
});
