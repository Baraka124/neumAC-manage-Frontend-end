'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('portfolio directly shows verified lines, studies, projects and publications',()=>{
 for(const part of ['state.activity.research.lines','state.activity.research.studies','state.activity.research.projects','state.activity.publications.items','lineRole(l.role)','studyRole(s.role)','projectRole(p.role)','@click="claimPublication"'])assert.ok(src.includes(part),part);
 assert.doesNotMatch(src,/Acceso a módulos|Las mismas herramientas institucionales/);
});