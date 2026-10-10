'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {test}=require('node:test');
const adapter=require('../mi-espacio/mi-espacio-data.js');
const base={id:'account-a',full_name:'Example A',email:'a@example.test',account_status:'active',medical_staff_id:'staff-a',
  linked_staff:{id:'staff-a',full_name:'Dr. Example A',staff_type:'attending_physician',professional_email:'doctor@example.test'}};

test('verified staff link matches session-provided staff ID',()=>{
 const result=adapter.normalizeContext(base,'account-a');
 assert.equal(result.linkState,'linked');
 assert.equal(result.staff.id,'staff-a');
 assert.equal(result.staff.name,'Dr. Example A');
 assert.equal(result.account.id,'account-a');
});
test('unlinked accounts never guess staff from account name or email',()=>{
 const result=adapter.normalizeContext({...base,medical_staff_id:null,linked_staff:null},'account-a');
 assert.equal(result.linkState,'unlinked');assert.equal(result.staff,null);
});
test('mismatched staff link is not displayed as verified',()=>{
 const result=adapter.normalizeContext({...base,linked_staff:{id:'staff-b',full_name:'Dr. B'}},'account-a');
 assert.equal(result.linkState,'unavailable');assert.equal(result.staff,null);
});
test('mismatched account, missing account and suspended account are rejected',()=>{
 for(const value of [{...base,id:'account-b'}, {...base,account_status:'suspended'},null]){
  assert.throws(()=>adapter.normalizeContext(value,'account-a'),/session could not be verified/i);
 }
});
test('identity request uses authenticated session API with cache bypass and signal',async()=>{
 const ac=new AbortController();
 const seen=[];
 const state=await adapter.loadContext(async(p,options)=>{seen.push({p,options});return base;},'account-a',ac.signal);
 assert.equal(state.linkState,'linked');assert.equal(seen[0].p,'/api/auth/me');
 assert.equal(seen[0].options.skipCache,true);assert.equal(seen[0].options.signal,ac.signal);
});
test('shell registration and same-app navigation exist',()=>{
 const root=path.resolve(__dirname,'..');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const access=fs.readFileSync(path.join(root,'access.js'),'utf8');
 assert.match(index,/currentView === 'mi_espacio'/);
 assert.match(index,/<mi-espacio-view\b/);
 assert.match(index,/mi-espacio\/mi-espacio-data\.js/);
 assert.match(index,/mi-espacio\/mi-espacio\.js/);
 assert.match(app,/mi_espacio:\s+'Mi espacio'/);
 assert.match(app,/app\.component\('mi-espacio-view'/);
 assert.match(access,/view==='mi_espacio'/);
 assert.ok(index.indexOf('mi-espacio/mi-espacio.js')<index.indexOf('src="app.js?'));
});
test('no guessed activity metrics or user-selected person authority',()=>{
 const code=fs.readFileSync(path.resolve(__dirname,'../mi-espacio/mi-espacio.js'),'utf8');
 assert.doesNotMatch(code,/activity45Generate|personId:selectedId|medical-staff\?limit=500/);
 assert.match(code,/state\.context/);
 assert.match(code,/props\.user\?\.id/);
});
