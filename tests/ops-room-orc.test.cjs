'use strict';
// Pneumo Ops Room OR-C: catalogue-driven lists, target history, Configuración (admins only).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'opsroom'" class="opsr">`), html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`));

test('lists come from the department catalogues (built-in values only until loaded)', () => {
  assert.match(app, /const opsLoadCat=async\(\)=>\{const c=opsRoom\.cat;try\{const d=await API\.request\('\/api\/ops\/catalog'/);
  assert.match(app, /const OPS_ROLES=computed\(/);
  assert.match(app, /const OPS_INC_CAT=computed\(/);
  assert.match(view, /<option v-for="r in opsRoleOptions\(e\.role\)"/);                         // a switched-off role still shows for people who have it
  assert.match(view, /<option v-for="c in opsIncCatOptions"/);
  assert.match(view, /<option v-for="sv in opsRoom\.ic\.services\.filter\(x=>x\.active\)" :key="sv\.code" :value="sv\.code">/);
  assert.match(view, /opsRoom\.ic\.service_labels\[ic\.requesting_service\] \|\| ic\.requesting_service/);
});

test('Configuración: head of department / admin only; units are not configured here', () => {
  assert.match(view, /<button v-if="opsIsAdmin" type="button" :class="\['opsr-section',\{active:opsRoom\.section==='config'\}\]"/);
  assert.match(view, /<section v-if="opsRoom\.section==='config' &amp;&amp; opsIsAdmin &amp;&amp; opsRoom\.cat\.loaded"/);
  assert.match(view, /Units are created and configured in the clinical units module\./);
  assert.match(view, /<button v-if="!it\.locked"/);                                               // locked items cannot be switched off
});

test('target history: change from a date, the past keeps its target', () => {
  assert.match(view, /From that date on\. Earlier periods keep their own target\./);
  assert.match(app, /'\/targets'\):'\/api\/ops\/indicators\/'\+encodeURIComponent\(i\.id\)\+'\/targets'\),\{method:'POST'/);
  assert.match(app, /Interconsultas received from that date are measured against it\. Earlier ones keep their target\./);
});

test('in-DOM template safety: no "<" inside {{ }} and no "||=" in v-model', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  assert.doesNotMatch(view, /v-model="\([^"]*\|\|=/);
});
