'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('research disclosure categories have independent presentation state',()=>{
 assert.ok(src.includes('state.researchOpen.lines=!state.researchOpen.lines'));
 for(const k of ['studies','projects']){
  assert.ok(src.includes("stepLargeList('"+k+"',state.activity.research."+k+".length)"));
  assert.ok(src.includes('aria-controls="me-v28-'+k+'"'));
 }
 assert.ok(src.includes('aria-controls="me-v28-lines"'));
 assert.ok(src.includes('state.publicationsExpanded=!state.publicationsExpanded'));
 assert.ok(src.includes('aria-controls="me-v28-publications"'));
});
test('existing authorized data arrays are reused without changing the normalizer',()=>{
 assert.ok(src.includes('state.activity.research.lines.slice('));
 assert.ok(src.includes("orderedResearch(state.activity.research.studies,'status').slice("));
 assert.ok(src.includes("orderedResearch(state.activity.research.projects,'stage').slice("));
 assert.ok(src.includes('state.activity.publications.items.slice('));
 assert.ok(src.includes("state.researchOpen={lines:false,studies:false,projects:false}"));
});