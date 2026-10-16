'use strict';
// Ops Room interface pass: status first (unit cards + six-question control panel) and the "Hoy" department screen.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'opsroom'" class="opsr">`), html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`));

test('unit cards: level, reasons, sorted by urgency, from the backend pulse', () => {
  assert.match(view, /<button v-for="u in opsUnitsSorted" :key="u\.id" type="button" class="opsr-card" :data-level="opsLevel\(u\)"/);
  assert.match(view, /v-for="\(r,ri\) in opsReasons\(u\)\.slice\(0,3\)"/);
  assert.match(app, /const OPS_LEVEL=\{alert:'Needs action',watch:'Watch',ok:'In order'\}/);
  assert.match(app, /const opsLevel=u=>\{if\(u\?\.pulse\)return u\.pulse\.level;/);
  assert.match(app, /OPS_LEVEL_RANK\[opsLevel\(a\)\]-OPS_LEVEL_RANK\[opsLevel\(b\)\]/);
});

test('control panel: each of the six questions shows a live value; status refreshes after writes', () => {
  assert.match(view, /<b class="opsr-tab-val">\{\{ opsQStatus\(opsRoom\.unit,q\.key\)\.value \}\}<\/b>/);
  for (const k of ['who', 'resources', 'activity', 'pending', 'incidents', 'indicators']) assert.match(app, new RegExp(`if\\(key==='${k}'\\)`));
  assert.ok((app.match(/opsRefreshPulse\(\)/g) || []).length >= 8);
});

test('forms are tucked away until needed', () => {
  for (const label of ['+ Add to the team', '+ Add a resource', '+ Record an incident'])
    assert.match(view, new RegExp(`<details v-if="opsCanManage" class="opsr-drawer"><summary>\\${label}</summary>`));
});

test('Hoy: the department daily screen opens first and is built from the same pieces', () => {
  assert.match(view, /@click="opsSection\('today'\)">Hoy<\/button>/);
  assert.match(view, /<section v-if="opsRoom\.section==='today'" class="opsr-today"/);
  assert.match(view, /opsTodayItems\('alert'\)/);
  assert.match(view, /opsTodayItems\('watch'\)/);
  assert.match(view, /v-for="i in opsTodayOffTrack"/);
  assert.match(view, /v-for="u in opsUnitsSorted" :key="u\.id" type="button" class="opsr-unit-row"/);
  assert.match(app, /section:'today',/);
});

test('in-DOM template safety', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  for (const fn of ['OPS_LEVEL', 'opsLevel', 'opsReasons', 'opsUnitsSorted', 'opsLevelCount', 'opsAgo', 'opsQStatus', 'opsTodayItems', 'opsTodayOffTrack', 'opsTodayOpenUnit'])
    assert.match(app, new RegExp('opsRoom, OPS_QUESTIONS,[^\\n]*\\b' + fn + '\\b'), fn);
});
