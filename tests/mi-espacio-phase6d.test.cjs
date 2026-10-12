'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
test('personal detail focus only scrolls when off screen',()=>{assert.match(src,/rect\.top<96 \|\| rect\.bottom>window\.innerHeight-18/);assert.match(src,/focus\(\{preventScroll:true\}\)/);});
test('detail controls restore record focus, support Escape, and retain Phase 6A/B',()=>{
 assert.match(src,/function onEscape\(event\)/);assert.match(src,/@keydown\.esc="onEscape"/);assert.match(src,/class="me-duty-row" :data-index="index"/);assert.match(src,/focusDuty\('\.me-duty-row\[data-index=/);
 assert.match(src,/function selectResearch\(index\)/);assert.match(src,/function selectPublication\(index\)/);
});
test('claim shortcut targets a labelled form control',()=>{
 assert.match(src,/focusDuty\('#me-report-subject'\)/);assert.match(src,/for="me-report-subject"/);assert.match(src,/id="me-report-subject"/);
 assert.match(src,/for="me-report-details"/);assert.match(src,/id="me-report-details"/);
});
test('unavailable authorship distinguished from verified empty personal list',()=>{
 assert.match(src,/!state\.activity\.publications\.available/);assert.match(src,/información de autorías no está disponible/);
});
