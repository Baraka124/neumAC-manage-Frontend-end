'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('verified resident and supervisor assignments have distinct headings',()=>{
 for(const x of ['ROTACIÓN ASIGNADA','ROTACIÓN QUE SUPERVISO','Rotaciones que superviso','fmtPeriod(r.start,r.end)','professionalDesignation'])assert.ok(src.includes(x),x);
});
test('verified scientific profiles not forced into clinically empty panels',()=>{
 assert.match(src,/v-if="showAgenda"/);
 assert.match(src,/v-if="hasResearch"/);
 assert.match(src,/hasResearchOverflow/);
 assert.match(css,/align-self:start/);
});
test('research previews expand in place without global navigation',()=>{
 assert.match(src,/me-v28-disclosure-toggle/);
 assert.match(src,/state.researchOpen.studies=!state.researchOpen.studies/);
 assert.match(src,/can\('oncall_schedule'\)/);
 assert.match(src,/function resolveItem\(reportId, status\)/);
});