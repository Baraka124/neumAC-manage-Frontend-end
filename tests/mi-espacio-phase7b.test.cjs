'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.css'),'utf8');
test('personal records expand inline with accessible controls and no repeated record heading',()=>{
 for(const name of ['me-duty-detail-','me-research-detail-','me-publication-detail-'])assert.ok(src.includes(name),name);
 assert.match(src,/class="me-duty-detail me-inline-detail"/);
 assert.match(src,/class="me-portfolio-detail me-inline-detail"/);
 assert.match(src,/:aria-expanded="state\.researchIndex===i"/);
 assert.match(src,/:aria-expanded="state\.publicationIndex===i"/);
 assert.doesNotMatch(src,/me-publication-detail-title|me-portfolio-detail-title|me-duty-detail-title/);
});
test('inline details keep lists visible even under mobile selection',()=>{
 assert.match(css,/\.me-duty-master-detail\.has-selection \.me-duty-list,/);
 assert.match(css,/\.me-portfolio-layout\.has-selection \.me-portfolio-entries\{display:block\}/);
 assert.match(css,/\.me-inline-detail/);
});
test('role-scoped content and existing forms remain intact',()=>{
 for(const part of ['selectedDuty.role','selectedResearch.status','selectedResearch.category','selectedPublication.order','selectedPublication.corresponding','@click="claimPublication"','function resolveItem(reportId, status)'])assert.ok(src.includes(part),part);
 assert.doesNotMatch(src,/Acceso a módulos/);
});
