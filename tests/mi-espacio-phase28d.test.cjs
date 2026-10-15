'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
const data=fs.readFileSync('mi-espacio/mi-espacio-data.js','utf8');
test('rotations unfold independently and resets remain account-scoped',()=>{
 for(const key of ['rotations','otherRotations']){
  assert.ok(source.includes('state.operationsOpen.'+key+'=!state.operationsOpen.'+key));
  assert.ok(source.includes('state.operationsOpen.'+key));
 }
 assert.ok(source.includes('state.operationsOpen={guardias:false,absences:false,supervision:false,rotations:false,otherRotations:false}'));
 assert.match(source,/aria-controls="me-v28d-rotations"/);
 assert.match(source,/aria-controls="me-v28d-other-rotations"/);
});
test('resident rotation content uses only existing normalized fields',()=>{
 for(const s of ["r.unit||'Rotación asignada'","fmtPeriod(r.start,r.end)","Estado: {{rotationStatusLabel(r.status)}}"])assert.ok(source.includes(s),s);
 assert.match(data,/id: id\(r && r.id\), unit: safe\(r && r.unit\), resident: safe\(r && r.resident\)/);
 assert.doesNotMatch(source,/r\.supervisorName|r\.supervisingClinician|r\.supervisor_email/);
});
test('resident layout avoids narrow-screen overflow and retains an explicit disclosure',()=>{
 assert.match(css,/\.me-v28d-rotation-list/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(source,/class="me-v28-disclosure-toggle"/);
});