'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const data=require('../mi-espacio/mi-espacio-data.js');
const release=fs.readFileSync('docs/mi-espacio-phase26f-release-acceptance.md','utf8');
test('directory and calendar continue to use permission-scoped endpoints',async()=>{
 let requests=[];
 await data.loadColleagues(async(path,opts)=>{requests.push([path,opts]);return []});
 await data.loadCalendar(async(path,opts)=>{requests.push([path,opts]);return {month:'2026-10',events:[]}},null,'2026-10');
 assert.deepEqual(requests.map(x=>x[0]),['/api/me/colleagues','/api/me/calendar?month=2026-10']);
 for(const [,opts] of requests)assert.equal(opts.skipCache,true);
});
test('denied personal resources surface failure rather than replacing with an authorized empty result',async()=>{
 const deny=async()=>{const err=Error('Forbidden');err.status=403;throw err};
 await assert.rejects(data.loadColleagues(deny,null),/Forbidden/);
 await assert.rejects(data.loadCalendar(deny,null,'2026-10'),/Forbidden/);
 assert.match(src,/state.colleagues.error=err\?\.message/);
 assert.match(src,/state.calendar.error=err\?\.message/);
});
test('research handoff requires host permission and professional profile edit is allowlisted',()=>{
 assert.match(src,/v-if="can\('research'\)"/);
 assert.match(src,/v-if="can\('oncall_schedule'\)"/);
 const x=data.validateProfileDraft({...data.profileDraft({}),professional_email:'not-permitted'});
 assert.ok(!Object.hasOwn(x.fields,'professional_email'));
});
test('release gates explicitly distinguish synthetic CI from actual account acceptance',()=>{
 for(const role of ['Head of department','Clinician','Resident','Biomedical engineer','Real server 403','Account/session change','Responsive + accessibility','Release and rollback'])assert.ok(release.includes(role),role);
 assert.match(release,/PENDING/);assert.match(release,/green synthetic browser run/);
});
