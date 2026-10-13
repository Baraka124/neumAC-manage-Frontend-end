'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const js=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('attention only appears for authorized verified pending review queue',()=>{
 assert.match(js,/state\.review\.can && !state\.review\.busy && !state\.review\.error && state\.review\.filter==='open' && state\.review\.items\.length/);
 assert.match(js,/function openPendingReviews\(\)/);
 assert.match(js,/state\.toolsOpen=true;/);
 assert.match(js,/focusDuty\('\.me-review h3'\)/);
 assert.match(js,/Comunicaciones por revisar<\/h3>/);
 assert.doesNotMatch(js,/class="me-v10-review-indicator"/);
});
