'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const data=require('../mi-espacio/mi-espacio-data.js');
test('verified individual roles distinguish IP, Co-IP, coinvestigator and contributor',()=>{
 const activity=data.normalizeActivity({research:{
  studies:[{id:'s1',title:'Estudio A',role:'PI',status:'recruiting',study_type:'clinical_trial'},{id:'s2',title:'Estudio B',role:'co-investigator',status:'completed'}],
  projects:[{id:'p1',title:'Proyecto C',role:'co_pi',stage:'active'},{id:'p2',title:'Proyecto D',role:'contributor',stage:'planned'}]
 }});
 const p=data.buildScientificParticipation(activity);
 assert.equal(p.total,4);
 assert.equal(p.current[0].kind,'Ensayo clínico');
 assert.match(p.current[0].role,/principal \(IP\)/);
 assert.equal(p.current[0].status,'En reclutamiento');
 assert.match(p.current[1].role,/Co-IP/);
 assert.match(p.current[2].role,/Colaborador/);
 assert.equal(p.history[0].title,'Estudio B');
 assert.equal(p.history[0].role,'Coinvestigador/a');
 assert.doesNotMatch(p.history[0].role,/Co-IP/);
});
test('no trial inference, unknown role/status not fabricated',()=>{
 const a=data.normalizeActivity({research:{studies:[{id:'x',title:'Random clinical trial in title',role:'unknown_kind',status:''}],projects:[{id:'p',title:'Project',role:'',stage:''}]}});
 const p=data.buildScientificParticipation(a);
 assert.equal(p.current[0].kind,'Estudio');
 assert.equal(p.current[0].role,'unknown_kind');
 assert.equal(p.current[0].status,'Estado no registrado');
 assert.equal(p.current[1].role,'Rol no registrado');
 assert.equal(p.history.length,0);
});
test('empty and excluded participation is not invented',()=>{
 assert.equal(data.buildScientificParticipation(null).total,0);
 assert.equal(data.buildScientificParticipation(data.normalizeActivity({research:{studies:[{title:''}],projects:[{title:''}]}})).total,0);
});
