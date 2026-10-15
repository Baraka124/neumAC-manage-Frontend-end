'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
// Exercise pure presentation helpers without mounting or contacting the application.
const sandbox={};vm.runInNewContext(source.replace('root.NeumMiEspacio={createView};','root.NeumMiEspacio={createView,researchTone,dutyDateParts};'),sandbox);
const {researchTone,dutyDateParts}=sandbox.NeumMiEspacio;
test('recorded completion is green, active work yellow, other states stay neutral',()=>{
 for(const status of ['completed','Finalizado','COMPLETADA'])assert.equal(researchTone(status),'completed');
 for(const status of ['active','ongoing','En desarrollo','En ejecución','recruiting'])assert.equal(researchTone(status),'ongoing');
 for(const status of ['',null,'cancelled','suspended','archived','closed','planned','unknown'])assert.equal(researchTone(status),'neutral');
});
test('compact duty date preserves the recorded calendar date and rejects invalid dates',()=>{
 const p=dutyDateParts('2026-11-02');assert.equal(p.day,'02');assert.equal(p.weekday,'lunes');assert.match(p.month,/noviembre.*2026/);
 assert.equal(dutyDateParts('2026-02-31').day,'');assert.equal(dutyDateParts('').day,'');
});
