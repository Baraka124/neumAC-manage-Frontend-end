'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('adaptive priority derives from verified activity, not role labels',()=>{
 assert.match(js,/const researchPriority=Vue\.computed/);
 assert.match(js,/hasResearch\.value && hasAgenda\.value/);
 assert.match(js,/counts\?\.guardias\|\|0/);
 assert.match(js,/me-v12-research-priority/);
 assert.doesNotMatch(js.slice(js.indexOf('const researchPriority='),js.indexOf('const researchPriority=')+400),/staffType|professionalDesignation/);
});
test('desktop priority remains responsive and retains all sections',()=>{
 assert.match(css,/@media\(min-width:851px\)/);
 assert.match(css,/\.me-v9-overview\.me-v12-research-priority/);
 assert.match(js,/v-if="showAgenda"/);
 assert.match(js,/v-if="hasResearch"/);
});
