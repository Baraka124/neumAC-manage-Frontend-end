'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('every operational and research disclosure shares one SVG chevron',()=>{
 assert.equal(src.split('class="me-v28-chevron me-v28e-chevron"').length-1,9);
 assert.doesNotMatch(src,/<span class="me-v28-chevron" aria-hidden="true">⌄<\/span>/);
 assert.match(css,/\.me-v28-disclosure-toggle\[aria-expanded=true\] \.me-v28e-chevron/);
});
test('disclosure retains viewport position and focus without changing request handling',()=>{
 for(const s of ['anchorInlineDisclosure','@click.capture="anchorInlineDisclosure"','Vue.nextTick','control.isConnected','window.scrollBy({top:delta,behavior:\'auto\'})'])assert.ok(src.includes(s),s);
 for(const s of ['me-v28-profile-toggle','profileConfirm','profileDirty.value','validateProfileDraft'])assert.ok(src.includes(s),s);
});
test('reduced motion and phone overflow keep all personal lists readable',()=>{
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/@media\(max-width:768px\)/);
 assert.match(css,/overflow-wrap:anywhere/);
 assert.match(css,/focus-visible/);
});