'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const d=require('../mi-espacio/mi-espacio-data.js');
test('Phase 37 research lifecycle label always uses recorded source',()=>{
 assert.equal(d.participationStatus('recruiting'),'En reclutamiento');
 assert.equal(d.participationStatus('Completado'),'Completado');
 assert.equal(d.participationStatus(''),'Estado no registrado');
 assert.equal(d.participationStatus('unknown-custom'),'unknown-custom');
});
test('Phase 37 own research does not infer Co-IP from co-investigator',()=>{
 const a=d.normalizeActivity({research:{studies:[{id:'s',title:'Protocolo',role:'co-investigator',status:'active'}]}});
 const p=d.buildScientificParticipation(a);
 assert.equal(p.current.length,1);
 assert.equal(p.current[0].role,'Coinvestigador/a');
 assert.doesNotMatch(p.current[0].role,/Co-IP/);
});
