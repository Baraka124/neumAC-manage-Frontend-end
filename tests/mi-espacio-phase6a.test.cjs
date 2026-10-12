'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const data=require('../mi-espacio/mi-espacio-data.js');
test('personal duties display verified modalities, role and optional departmental exit',()=>{
 assert.equal(data.formatDutyShift('on_call_present'),'Guardia presencial');
 assert.match(src,/state\.activity\.agenda\.guardias/);
 assert.match(src,/guardiaRole\(g\.role\)/);
 assert.match(src,/can\('oncall_schedule'\)/);
 assert.match(src,/function openDuties\(index\)/);
});