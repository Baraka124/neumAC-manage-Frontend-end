'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const nav=require('../mi-espacio/mi-espacio-workspace.js');
const view=fs.readFileSync(require.resolve('../mi-espacio/mi-espacio.js'),'utf8');
const css=fs.readFileSync(require.resolve('../mi-espacio/mi-espacio.css'),'utf8');
test('Calendar and Directory are one navigation workspace, with stepwise return',()=>{
 const a=nav.create();a.dispatch({type:'OPEN_WORKSPACE',workspace:'calendar',origin:{focusId:'me-v26b-calendar-trigger',scrollY:200}});
 a.dispatch({type:'OPEN_DETAIL',detail:{type:'date',id:'2026-10-14'}});
 assert.equal(a.get().detail.id,'2026-10-14');
 a.dispatch({type:'BACK'});assert.equal(a.get().workspace,'calendar');assert.equal(a.get().detail,null);
 a.dispatch({type:'OPEN_WORKSPACE',workspace:'directory'});assert.equal(a.get().workspace,'directory');
 a.dispatch({type:'OPEN_DETAIL',detail:{type:'staff',id:'staff-1'}});
 a.dispatch({type:'BACK'});assert.equal(a.get().detail,null);
 a.dispatch({type:'BACK'});assert.equal(a.get().view,'overview');
});
test('Calendar prevents out-of-order month writes and account leakage',()=>{
 assert.match(view,/ticket===calendarRequest&&requestSeq===seq&&props.active&&linked.value/);
 assert.match(view,/state.calendar.month===m/);
 assert.match(view,/state.calendar.events=\[\];state.calendar.month=m/);
 assert.match(view,/if\(current\(\)\)state.calendar.events=result.events/);
 assert.match(view,/\+\+calendarRequest; \+\+directoryRequest;/);
});
test('Directory is constrained to authorized normalized records and identity',()=>{
 assert.match(view,/NeumMiEspacioData.loadColleagues/);
 assert.match(view,/ticket===directoryRequest&&requestSeq===seq&&props.active&&linked.value/);
 assert.match(view,/selectedColleague/);
 assert.match(view,/me-v26b-staff-detail/);
 assert.doesNotMatch(view,/selectedColleague\.(?:professionalEmail|privateEmail|phone|salary|birthDate)/);
});
test('Accessible detail controls and overview suppression exist',()=>{
 assert.match(view,/:aria-pressed="selectedDate===cell.date"/);
 assert.match(view,/:aria-pressed="selectedColleague\?\.id===c.id"/);
 assert.match(view,/<template v-if="linked && !isContextWorkspace">/);
 assert.match(view,/returnToOverview/);
 assert.match(view,/backContextDetail/);
 assert.match(view,/No hay eventos registrados para esta fecha/);
 assert.match(css,/@media\(max-width:760px\)/);
});
