'use strict';
// Pneumo Ops Room OR-2b (interconsultas) + OR-3 (¿Cumplimos?) — view wiring and honesty rules.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'opsroom'" class="opsr">`), html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`));

test('three sections: Unidades · Interconsultas · ¿Cumplimos? Objetivos', () => {
  for (const k of ['units', 'interconsults', 'objectives']) assert.match(view, new RegExp(`@click="opsSection\\('${k}'\\)"`));
  assert.match(view, /<section v-if="opsRoom\.section==='interconsults'" class="opsr-ic"/);
  assert.match(view, /<section v-if="opsRoom\.section==='objectives'" class="opsr-panel"/);
});

test('interconsultas: provisional targets stated, no patient data, assignee or manager acts', () => {
  assert.match(view, /Targets \(provisional, to be confirmed by the department\)/);
  assert.match(view, /No patient names or record numbers\./);
  assert.match(app, /const opsIcCanAct=ic=>opsCanManage\.value\|\|opsIcMine\(ic\)/);
  assert.match(app, /'\/api\/ops\/interconsults\/'\+encodeURIComponent\(ic\.id\)\+'\/action'/);
});

test('¿Cumplimos?: live in the unit; suggestions never invent a target; department indicators admin-only', () => {
  assert.match(view, /v-else-if="opsRoom\.tab==='indicators'"/);
  assert.doesNotMatch(view, /Not built yet — nothing here is simulated\./);          // every question is now built
  assert.match(app, /const opsIndSuggestions=computed\(/);
  assert.doesNotMatch(app.slice(app.indexOf('const opsIndSuggestions'), app.indexOf('const opsIndStart')), /target:/);
  assert.match(view, /Leave the target empty until the department sets it\./);
  assert.match(view, /<button v-if="opsIsAdmin &amp;&amp; !opsRoom\.dept\.form"/);
});

test('in-DOM template safety: no "<" inside {{ }}', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
});
