'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
test('scholarly preview retains verified record details and a personal expansion control',()=>{
 assert.match(src,/hasPublicationOverflow/);
 assert.match(src,/state.publicationsExpanded=!state.publicationsExpanded/);
 assert.match(src,/listControlText\('publications'/);
 assert.match(src,/p\.byline/);
 assert.match(src,/p\.order/);
});
test('review indicator requires verified reviewer permission and actually returned open records',()=>{
 assert.match(src,/state.review.can && !state.review.busy && !state.review.error && state.review.filter==='open' && state.review.items.length/);
 assert.match(src,/REQUIERE TU ATENCIÓN/);
 assert.match(src,/function openPendingReviews\(\)/);
 assert.match(src,/Revisar comunicaciones/);
 assert.match(src,/function resolveItem\(reportId, status\)/);
});