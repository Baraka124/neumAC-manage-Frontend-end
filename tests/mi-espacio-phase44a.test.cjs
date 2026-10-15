'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(root,'mi-espacio/mi-espacio.js'),'utf8'),css=fs.readFileSync(path.join(root,'mi-espacio/mi-espacio.css'),'utf8');
test('44A: record expansion uses the same institutional SVG and never a decorative plus glyph',()=>{
 assert.equal(src.split('class="me-v28-chevron me-approved-plus"').length-1,2);
 assert.doesNotMatch(src,/class="me-approved-plus" aria-hidden="true">＋/);
 assert.match(css,/\.me-approved-record\[open\] \.me-approved-plus\{transform:rotate\(180deg\)/);
});
test('44A: all inline interaction types anchor position without changing role state or data',()=>{
 for(const name of ['me-approved-record > summary','me-v41-science > summary','me-v39-metrics > summary','me-v28-profile-toggle','me-v28-disclosure-toggle','me-v8-tools-toggle'])assert.ok(src.includes(name),name);
 assert.match(src,/Vue\.nextTick/);
 assert.match(src,/window\.scrollBy\(\{top:delta,behavior:'auto'\}\)/);
});
test('44A: one accessible focus, chevron size and reduced-motion system',()=>{
 assert.match(css,/\.mi-espacio\.me-approved-workspace \.me-v28-chevron\{/);
 assert.match(css,/width:32px;height:32px/);
 assert.match(css,/border:1px solid #b9d1c6/);
 assert.match(css,/outline:3px solid #258775/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.doesNotMatch(css,/animation:me28-reveal/);
 assert.match(src,/me-v39-metrics/);
});
