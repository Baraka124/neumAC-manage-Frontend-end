'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('Mi Espacio primary actions keep accessible touch targets',()=>{
 const start=css.indexOf('/* Phase 14B');assert.ok(start>=0);
 const phase=css.slice(start);
 for(const selector of ['.me-duty-open','.me-v10-research-toggle','.me-v10-publications-toggle','.me-v8-tools-toggle','.me-v13b-attention-action'])assert.ok(phase.includes(selector),selector);
 assert.match(phase,/min-height:44px/);
 assert.match(phase,/max-width:640px/);
 assert.match(phase,/prefers-reduced-motion:reduce/);
});
