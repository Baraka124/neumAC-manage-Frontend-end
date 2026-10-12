'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const js=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.css'),'utf8');
test('only active rota/absence sections get full cards',()=>{
 assert.match(js,/v-if="state\.activity\.agenda\.rotations\.length" class="me-card"/);
 assert.match(js,/v-if="state\.activity\.agenda\.absences\.length" class="me-card"/);
 assert.match(js,/class="me-agenda-status"/);
});
test('research and publication browse states do not reserve blank detail columns',()=>{
 assert.doesNotMatch(js,/Selecciona un registro para consultar tu participación\.<\/div>/);
 assert.doesNotMatch(js,/Selecciona una publicación para consultar tu autoría\.<\/div>/);
 assert.match(css,/\.me-portfolio-layout:not\(\.has-selection\)\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(js,/function selectResearch\(index\)/);
 assert.match(js,/function selectPublication\(index\)/);
});
test('loading skeleton reflects current agenda arrangement and review queue waits',()=>{
 assert.match(js,/class="me-loading-agenda"/);
 assert.match(js,/class="me-loading-research"/);
 assert.match(js,/state\.review\.can && !state\.activityBusy/);
 assert.match(css,/\.me-loading-agenda\{display:grid/);
});
test('Phase 7A preserves personal guardias and review workflows',()=>{
 assert.match(js,/function openDuties\(index\)/);
 assert.match(js,/function resolveItem\(reportId, status\)/);
 assert.match(js,/function claimPublication\(\)/);
 assert.doesNotMatch(js,/Acceso a módulos/);
});