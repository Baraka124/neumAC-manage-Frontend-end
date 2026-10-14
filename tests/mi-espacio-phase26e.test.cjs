'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
const rule=css.slice(css.indexOf('/* Phase 26E'));
test('all three workspace families share calm geometry and focus',()=>{
 for(const part of ['me-v26b-workspace','me-v26c-profile','me-v26d-workspace','min-width:0','overflow-wrap','focus-visible'])assert.ok(rule.includes(part),part);
 assert.match(rule,/--me26-focus/);assert.match(rule,/scroll-margin-top/);
});
test('small phone, tablet, and reduced-motion media rules are present',()=>{
 for(const size of ['max-width:768px','max-width:390px','prefers-reduced-motion:reduce'])assert.ok(rule.includes(size),size);
});
