'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),view=fs.readFileSync(path.join(root,'mi-espacio','mi-espacio.js'),'utf8'),css=fs.readFileSync(path.join(root,'mi-espacio','mi-espacio.css'),'utf8');
test('Mi Espacio training state requires authenticated resident staff role',()=>{
 assert.match(view,/const isResident=Vue\.computed/);
 assert.match(view,/state\.context\?\.staff\?\.staffType/);
 assert.match(view,/Ahora mismo no aparecen rotaciones ni guardias en tu espacio/);
 assert.match(view,/Esto no confirma que no existan asignaciones/);
 assert.match(view,/reportMissingRotation/);
 assert.match(view,/state\.report\.subject_type='rotation'/);
});
test('Independent clinical, research and publication views retain their original sources',()=>{
 assert.match(view,/root\.NeumMiEspacioData\.loadActivity/);
 assert.match(view,/const showPublications=Vue\.computed/);
 assert.match(view,/!showPublications/);
 assert.match(view,/me-approved-record/);
 assert.match(view,/me-v39-metrics/);
 assert.match(view,/showPhotoNudge && state\.toolsOpen/);
 assert.doesNotMatch(view,/role-switch|visualizar como/i);
});
test('Guardia has one primary date, with secondary dashboard still accessible',()=>{
 assert.doesNotMatch(view,/events\.push\(\{icon:'🩺'/);
 assert.match(view,/upcomingGuardias\.value/);
 assert.match(view,/me-approved-date/);
 assert.match(view,/<details v-if="linked && state\.dashboard\.data/);
 assert.match(css,/me-v39-metrics>summary:focus-visible/);
 assert.match(css,/@media\(max-width:850px\)/);
});
