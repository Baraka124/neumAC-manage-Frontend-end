const test=require('node:test'),assert=require('node:assert/strict');
const {collect}=require('../scripts/audit-clinical-study-fields');
test('collects property refs and evidence line locations without values',()=>{
 const input=['clinicalTrials filteredTrialsAll openStudy( trialStatusKey( researchSources.studies',
 '<div class="rv32-row-governance">protocol</div>',
 '<div class="rv32-row-recruitment">recruitment</div>',
 'trial.title; trial?.ethics_status; selectedTrial.protocol_version;'].join('\n');
 const result=collect(input);
 assert.equal(result.referencePoints[0].location.line,1);
 assert.deepEqual(result.referencedStudyProperties,['ethics_status','protocol_version','title']);
 assert.deepEqual(result.evidenceReferences.protocol,[2,4]);
 assert.deepEqual(result.evidenceReferences.recruit,[3]);
 assert.ok(!JSON.stringify(result).includes('protocol_version;'));
});
test('missing markers are recorded as null, not fabricated',()=>{
 const result=collect('no study records');
 assert.equal(result.referencePoints[0].location,null);
 assert.deepEqual(result.referencedStudyProperties,[]);
});
