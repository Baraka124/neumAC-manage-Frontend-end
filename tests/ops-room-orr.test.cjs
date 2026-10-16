'use strict';
// Pneumo Ops Room OR-R: clinical counts by category, calls from other departments, Informes (unit + department).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'access.css'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'opsroom'" class="opsr">`), html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`));

test('breakdowns: one list per measure, counts per category, sum shown, lists editable in Configuración', () => {
  assert.match(view, /<option value="">Total only<\/option><option value="clinical_condition">By condition<\/option><option value="age_band">By age band<\/option><option value="sex">By sex<\/option>/);
  assert.match(view, /v-model="opsRoom\.meas\.bd\[m\.type_id\]\[c\.code\]"/);
  assert.match(view, /= \{\{ opsBdSum\(opsRoom\.meas\.bd\[m\.type_id\]\) \}\}/);
  assert.match(view, /opsBdList\(m\.by_category,m\.breakdown\)/);
  assert.match(app, /breakdown:n\.breakdown\|\|undefined/);
  assert.match(app, /\{type_id,breakdown:m\.bd\[type_id\],measured_on:m\.date\}/);
  assert.match(app, /const OPS_CATALOG_ORDER=\[[^\]]*'clinical_condition','age_band','sex'\]/);
  assert.match(view, /One breakdown per measure, counts only/);
});

test('calls: channel chooser, outcome + minutes, logged resolved, counted apart from response times', () => {
  assert.match(view, /v-model="opsRoom\.ic\.form\.channel"/);
  assert.match(view, /v-model="opsRoom\.ic\.form\.outcome"/);
  assert.match(view, /v-model="opsRoom\.ic\.form\.duration_min"/);
  assert.match(app, /channel:f\.channel,requesting_service/);
  assert.match(app, /take:!call&&/);
  assert.match(view, /never change interconsulta response times/);
  assert.match(view, /CALLS AND IN-PERSON REQUESTS/);
  assert.match(view, /<span v-if="!opsIcIsCall\(ic\)" :class="ic\.clock\.over/);     // no "over target" on calls
  assert.match(view, /v-if="opsRoom\.ind\.form\.kind==='calls_total'" v-model="opsRoom\.ind\.form\.outcome"/);
  assert.match(app, /f\.kind==='calls_total'&&f\.outcome\?\{outcome:f\.outcome\}/);
});

test('Informes: department or one unit, weekly / monthly snapshots, generate on demand, printable', () => {
  assert.match(view, /@click="opsSection\('reports'\)">Informes<\/button>/);
  assert.match(view, /<section v-if="opsRoom\.section==='reports'" class="opsr-panel opsr-reports"/);
  assert.match(view, /<option value="department">Departamento \(todas las unidades\)<\/option>/);
  assert.match(view, /@click="opsRepFromUnit">Informes de la unidad<\/button>/);
  assert.match(app, /'\/api\/ops\/units\/'\+encodeURIComponent\(opsRoom\.rep\.unitId\)\+'\/reports':'\/api\/ops\/reports'/);
  assert.match(app, /opsRepUrl\(\)\+'\/generate',\{method:'POST',body\}/);
  assert.match(app, /const opsRepCanGenerate=computed\(\(\)=>opsRoom\.rep\.scope==='department'\?opsIsAdmin\.value:opsCanManage\.value\)/);
  assert.match(view, /TARGET IN FORCE AT THE END OF THE PERIOD/);
  assert.match(view, /counts only, no patient data/);
  assert.match(css, /@media print\{[\s\S]*\.opsr-report,\.opsr-report \*\{visibility:visible\}/);
});

test('in-DOM template safety holds for the new markup', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  assert.doesNotMatch(view, /v-model="[^"]*\|\|=/);
  for (const fn of ['opsBdItems', 'opsBdList', 'opsBdSum', 'opsIcIsCall', 'opsLoadRep', 'opsRepScope', 'opsRepOpen', 'opsRepGenerate', 'opsRepFromUnit', 'opsRepTitle', 'opsPct', 'opsRepPrint'])
    assert.match(app, new RegExp('opsRoom, OPS_QUESTIONS,[^\\n]*\\b' + fn + '\\b'), fn + ' exposed to the template');
});
