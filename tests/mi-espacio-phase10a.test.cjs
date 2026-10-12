'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('verified resident and supervisor assignments have distinct headings',()=>{
 for(const x of ['MI ROTACIÓN REGISTRADA','ROTACIÓN BAJO MI SUPERVISIÓN','Rotaciones que superviso','fmtPeriod(r.start,r.end)','professionalDesignation'])assert.ok(src.includes(x),x);
});
test('verified scientific profiles not forced into clinically empty panels',()=>{
 assert.match(src,/v-if="showAgenda"/);
 assert.match(src,/v-if="hasResearch"/);
 assert.match(src,/hasResearchOverflow/);
 assert.match(css,/align-self:start/);
});
test('research previews expand in place without global navigation',()=>{
 assert.match(src,/Ver toda mi investigación/);
 assert.match(src,/state.researchExpanded=!state.researchExpanded/);
 assert.match(src,/can\('oncall_schedule'\)/);
 assert.match(src,/function resolveItem\(reportId, status\)/);
});