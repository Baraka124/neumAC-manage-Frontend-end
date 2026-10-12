'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const data=require('../mi-espacio/mi-espacio-data.js');
const source=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.css'),'utf8');

test('known guardia types get human Spanish labels; unknown values are not invented',()=>{
  assert.equal(data.formatDutyShift('on_call_present'),'Guardia presencial');
  assert.equal(data.formatDutyShift('on_call_mixed'),'Guardia mixta');
  assert.equal(data.formatDutyShift('on_call_home'),'Guardia localizada');
  assert.equal(data.formatDutyShift('24h'),'24h');
  assert.equal(data.formatDutyShift(null),'Modalidad no indicada');
});
test('duty list and selection are entirely inside Mi espacio, with explicit institutional exit',()=>{
  assert.match(source,/dutyMode:'overview'/);
  assert.match(source,/function openDuties\(index\)/);
  assert.match(source,/function selectDuty\(index\)/);
  assert.match(source,/function backToAgenda\(\)/);
  assert.match(source,/@click="openDuties\(0\)"/);
  assert.match(source,/@click="selectDuty\(index\)"/);
  assert.match(source,/@click="backToAgenda"/);
  assert.match(source,/v-if="can\('oncall_schedule'\)"/);
  assert.doesNotMatch(source,/\{id:'oncall_schedule',label:'Guardias'/);
  assert.match(source,/v-if="state\.dutyMode==='overview'".*aria-label="Mi investigación"/);
});
test('personal detail only exposes existing verified fields and retains mobile focus/selection',()=>{
  assert.match(source,/selectedDuty\.date/);
  assert.match(source,/selectedDuty\.shift/);
  assert.match(source,/selectedDuty\.role/);
  assert.match(source,/focus\(\{preventScroll:true\}\)/);
  assert.match(css,/@media\(max-width:800px\)/);
  assert.match(css,/\.me-duty-master-detail\.has-selection \.me-duty-list\{display:none\}/);
});
