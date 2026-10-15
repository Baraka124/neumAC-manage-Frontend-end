'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('one verified identity, two primary areas and an independent scholarly list',()=>{
 for(const val of ['me-v9-identity','me-v9-overview','me-v9-panel','me-v9-publications','me-v9-services'])assert.ok(js.includes(val),val);
 assert.match(js,/v-if="upcomingGuardias.length"/);
 assert.match(js,/const upcomingGuardias=Vue\.computed/);
 assert.match(js,/v-if="state.activity && state.activity.research.lines.length"/);
 assert.match(js,/v-if="state.activity.publications.items.length"/);
});
test('secondary management stays available without dominating overview',()=>{
 assert.match(js,/state.toolsOpen=true;state.report.open=true/);
 assert.match(js,/v-if="state.dutyMode==='overview' && state.toolsOpen"/);
 assert.match(js,/Comunicaciones y gestiones/);
 assert.match(js,/function resolveItem\(reportId, status\)/);
});
test('responsive visual direction does not alter shell or permission contracts',()=>{
 assert.match(css,/max-width:850px/);
 assert.match(css,/max-width:480px/);
 assert.match(js,/can\('oncall_schedule'\)/);
 assert.doesNotMatch(js,/Acceso a módulos/);
});
