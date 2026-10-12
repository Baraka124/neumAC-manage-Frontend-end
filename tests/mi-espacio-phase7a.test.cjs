'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('sparse profiles do not render unused cards or research/publishing prompts',()=>{
 assert.match(src,/v-if="state.activity.agenda.rotations.length/);
 assert.match(src,/v-if="state.activity.research.lines.length/);
 assert.match(src,/v-if="state.activity.publications.items.length/);
 assert.match(css,/\.mi-espacio--v8 \.me-v8-overview/);
 assert.doesNotMatch(src,/Selecciona un registro para consultar tu participación/);
});