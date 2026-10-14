'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const s=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('clinical operations are presentation-only and independently revealed',()=>{
 for(const k of ['guardias','absences','supervision']){
  assert.ok(s.includes('state.operationsOpen.'+k+'=!state.operationsOpen.'+k),k);
  assert.ok(s.includes('aria-controls="me-v28c-'+k+'"'),k);
 }
 for(const k of ['agenda.guardias','agenda.absences','supervisedRotations','fmtPeriod(a.start,a.end)','guardiaRole'])assert.ok(s.includes(k),k);
});
test('on-call date label never claims active shift or inferred availability',()=>{
 assert.ok(s.includes("upcomingGuardias[0].date===localToday"));
 assert.ok(s.includes("GUARDIA REGISTRADA HOY"));
 assert.ok(s.includes("PRÓXIMA GUARDIA"));
 assert.ok(s.includes("state.operationsOpen={guardias:false,absences:false,supervision:false,rotations:false,otherRotations:false}"));
});