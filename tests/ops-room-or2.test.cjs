'use strict';
// Pneumo Ops Room OR-2: the four operational questions are live and honest.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'opsroom'" class="opsr">`), html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`));

test('four questions have live panels (and ¿Cumplimos? since OR-3)', () => {
  for (const t of ['resources', 'activity', 'pending', 'incidents', 'indicators']) assert.match(view, new RegExp(`v-else-if="opsRoom\\.tab==='${t}'"`));
  assert.match(app, /const opsTab=key=>\{opsRoom\.tab=key;if\(key==='resources'\)opsLoadRes\(\);if\(key==='activity'\|\|key==='pending'\)opsLoadMeas\(\);/);
});

test('in-DOM template safety: no "<" inside {{ }} in the Ops Room view (the browser would read it as a tag)', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
});

test('resources: state follows recorded events; lending only devices; calibration/loans only where the unit uses them', () => {
  assert.match(app, /opsUnitUrl\('resources\/'\+encodeURIComponent\(res\.id\)\+'\/events'\)/);
  assert.match(view, /<option v-if="r\.kind==='device'&&r\.status!=='lent'" value="loan_out">Lend out<\/option>/);
  assert.match(view, /<th v-if="opsHas\('calibration'\)" scope="col">Calibration<\/th><th v-if="opsHas\('loans'\)" scope="col">Loan<\/th>/);
});

test('activity and pending: counts only, no future days, one request per save', () => {
  assert.match(view, /Counts only — no patient data\./);
  assert.match(view, /<input type="date" v-model="opsRoom\.meas\.date" :max="opsRoom\.today"/);
  assert.match(app, /opsUnitUrl\('measures'\),\{method:'PUT',body:\{items\}\}/);
});

test('incidents: resolving asks how; free text warns against patient data; admins delete permanently', () => {
  assert.match(view, /placeholder="How was it resolved\?"/);
  assert.match(view, /placeholder="Details \(no patient data\)"/);
  assert.match(view, /<button v-if="opsIsAdmin" type="button" class="btn btn-secondary btn-sm" @click="opsRemoveInc\(i,true\)">Delete<\/button>/);
});

test('unit cards show what needs attention', () => {
  for (const k of ['out_of_service', 'calibration_overdue', 'loans_overdue']) assert.ok(view.includes(`u.alerts.resources.${k}`), k);
  assert.match(view, /u\.alerts\.incidents\.open/);
});
