'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('no redundant personal detail expansions; values are readable directly',()=>{
 assert.match(src,/class="me-v8-timeline"/);
 assert.match(src,/class="me-v8-research-groups"/);
 assert.match(src,/class="me-v8-publication-list"/);
 assert.doesNotMatch(src,/me-inline-detail|me-publication-detail-title/);
 assert.match(css,/\.me-v8-publication-list li/);
});