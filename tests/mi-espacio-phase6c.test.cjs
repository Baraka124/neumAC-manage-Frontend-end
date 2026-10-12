'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const data=require('../mi-espacio/mi-espacio-data.js');
const src=fs.readFileSync(path.join(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
test('accepted publication authorship distinguished from accepted without automatic change',()=>{
 assert.match(data.reviewOutcome({status:'accepted',linked:'publication_author'},'accepted').message,/autoría vinculada/);
 assert.match(data.reviewOutcome({status:'accepted',linked:null},'accepted').message,/corrección manual/);
 assert.equal(data.reviewOutcome({status:'accepted',linked:'failed'},'accepted').needsAttention,true);
 assert.equal(data.reviewOutcome({status:'rejected'},'rejected').needsAttention,false);
});
test('unexpected/missing server status cannot be presented as accepted',()=>{
 assert.throws(()=>data.reviewOutcome({},'accepted'),/no ha sido confirmada/);
 assert.throws(()=>data.reviewOutcome({status:'open'},'accepted'),/no ha sido confirmada/);
});
test('review workflow refreshes activity on confirmed links and preserves Guardias and portfolios',()=>{
 assert.match(src,/const outcome=root.NeumMiEspacioData.reviewOutcome\(result,status\)/);
 assert.match(src,/result.linked==='publication_author'/);
 assert.match(src,/await loadActivity\(seq/);
 assert.match(src,/state.review.notice/);
 assert.match(src,/function openDuties\(index\)/);
 assert.match(src,/function selectResearch\(index\)/);
 assert.doesNotMatch(src,/Acceso a módulos/);
});
