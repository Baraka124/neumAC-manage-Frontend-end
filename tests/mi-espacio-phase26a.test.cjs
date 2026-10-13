'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const nav=require('../mi-espacio/mi-espacio-workspace.js');
test('overview to workspace and back retains origin',()=>{
 const s=nav.transition(nav.empty(),{type:'OPEN_WORKSPACE',workspace:'calendar',origin:{focusId:'calendar-button',scrollY:310}});
 assert.equal(s.workspace,'calendar');assert.equal(s.view,'workspace');assert.equal(s.origin.scrollY,310);
 const back=nav.transition(s,{type:'BACK'});assert.equal(back.view,'overview');assert.deepEqual(back.origin,s.origin);
});
test('detail is scoped to an active workspace, back is stepwise',()=>{
 let s=nav.empty();assert.equal(nav.transition(s,{type:'OPEN_DETAIL',detail:{type:'date',id:'2026-10-14'}}),s);
 s=nav.transition(s,{type:'OPEN_WORKSPACE',workspace:'calendar'});
 s=nav.transition(s,{type:'OPEN_DETAIL',detail:{type:'date',id:'2026-10-14'}});
 assert.equal(s.detail.id,'2026-10-14');s=nav.transition(s,{type:'BACK'});assert.equal(s.workspace,'calendar');assert.equal(s.detail,null);
});
test('single active workspace and dirty-change guard',()=>{
 const a=nav.create();a.dispatch({type:'OPEN_WORKSPACE',workspace:'profile'});
 a.dispatch({type:'SET_DIRTY',value:true});const before=a.get();
 assert.equal(a.dispatch({type:'OPEN_WORKSPACE',workspace:'directory'}),before);
 assert.equal(a.dispatch({type:'CLOSE'}),before);
 a.dispatch({type:'SAVE_SUCCESS'});a.dispatch({type:'OPEN_WORKSPACE',workspace:'directory'});
 assert.equal(a.get().workspace,'directory');assert.equal(a.get().dirty,false);
});
test('account reset removes private detail and origin',()=>{
 const n=nav.create();n.dispatch({type:'OPEN_WORKSPACE',workspace:'directory',origin:{focusId:'x',scrollY:40}});
 n.dispatch({type:'OPEN_DETAIL',detail:{type:'staff',id:'staff-7'}});
 const s=n.reset();assert.equal(s.view,'overview');assert.equal(s.workspace,null);assert.equal(s.detail,null);assert.equal(s.origin,null);assert.ok(s.revision>0);
});
test('reject invalid workspaces and detail identifiers',()=>{
 const a=nav.empty();assert.equal(nav.transition(a,{type:'OPEN_WORKSPACE',workspace:'admin'}),a);
 const b=nav.transition(a,{type:'OPEN_WORKSPACE',workspace:'calendar'});
 assert.equal(nav.transition(b,{type:'OPEN_DETAIL',detail:{type:'staff',id:''}}),b);
});