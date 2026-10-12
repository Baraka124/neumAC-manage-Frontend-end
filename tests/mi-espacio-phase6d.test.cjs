'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('claims retain accessible labels and verified user focus',()=>{
 for(const id of ['me-report-subject','me-report-kind','me-report-details']){assert.match(src,new RegExp('id="'+id+'"'));assert.match(src,new RegExp('for="'+id+'"'));}
 assert.match(src,/focusDuty\('#me-report-subject'\)/);
});
test('unavailable publications remain distinct from an empty verified list',()=>{assert.match(src,/!state\.activity\.publications\.available/);});