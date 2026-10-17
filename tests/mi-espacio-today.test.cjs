'use strict';
// Mi espacio — Hoy para ti: one person's operational day; each item opens the right place in the full app.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const seg = html.slice(html.indexOf('<!-- Mi espacio — Hoy para ti'), html.indexOf('<!-- CM-3: my private messages'));

test('card at the top of Mi espacio, from /api/me/today, reloaded on entry', () => {
  assert.match(seg, /<section v-if="currentView === 'mi_espacio' &amp;&amp; myDay\.data &amp;&amp; myDay\.data\.linked" class="nd-today"/);
  assert.match(app, /API\.request\('\/api\/me\/today',\{skipCache:true\}\)/);
  assert.match(app, /watch\(\(\)=>currentView\.value,v=>\{if\(v==='mi_espacio'\)myDayLoad\(\)\}\)/);
  assert.ok(html.indexOf('<!-- Mi espacio — Hoy para ti') < html.indexOf('<mi-espacio-view'));
});
test('what needs you: on call first, follow-ups with one-tap Done, interconsultas, agenda, units, posts for me', () => {
  assert.ok(seg.indexOf('nd-today-box--oncall') < seg.indexOf('Tus pendientes'));
  assert.match(seg, /@click="myDayDone\(a\)">Hecho<\/button>/);
  for (const r of ["myDayGo('interconsultas')", "myDayGo('meeting:'+m.id)", "myDayGo('unit:'+u.id)", "myDayGo('post:'+p.id)"]) assert.ok(seg.includes(r), r);
  assert.match(app, /const myDayGo=async route=>\{await ndApplyRoute\(route\);ndFocus\.on=false\}/);   // full app, not the focus frame
});
test('template safety', () => {
  assert.deepEqual(seg.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  for (const fn of ['myDay', 'myDayGo', 'myDayDone', 'myDayWhen', 'MYDAY_STATE']) assert.match(app, new RegExp('\\b' + fn + ', [^\\n]*opsRoom, OPS_QUESTIONS,'), fn);
});
