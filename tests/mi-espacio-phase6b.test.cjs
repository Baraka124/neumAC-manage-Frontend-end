'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.css'),'utf8');
test('no duplicate module shortcut section or automatic research route',()=>{
 assert.doesNotMatch(src,/Acceso a módulos|Las mismas herramientas institucionales|const destinations=/);
 assert.match(src,/researchGroups=Object.freeze/);
 assert.match(src,/function selectResearch\(index\)/);
 assert.match(src,/function selectPublication\(index\)/);
 assert.match(src,/aria-label="Mi investigación"/);
 assert.match(src,/aria-label="Mis publicaciones"/);
});
test('read-only portfolio uses existing verified record fields and retains claims',()=>{
 for(const field of ['selectedResearch.status','selectedResearch.category','selectedPublication.byline','selectedPublication.order','selectedPublication.corresponding'])assert.ok(src.includes(field),field);
 assert.match(src,/@click="claimPublication"/);
 assert.match(src,/function resolveItem\(reportId, status\)/);
 assert.match(src,/function openDuties\(index\)/);
 assert.match(src,/v-if="can\('oncall_schedule'\)"/);
});
test('responsive personal detail selection and return focus stay within Mi espacio',()=>{
 assert.match(css,/me-portfolio-layout\.has-selection \.me-portfolio-entries\{display:none\}/);
 assert.match(src,/function closeResearch\(/);
 assert.match(src,/function closePublication\(/);
 assert.match(src,/data-index="i"/);
});
