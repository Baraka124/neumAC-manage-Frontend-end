'use strict';
// IM-1 · Importar datos (Ops Room → Configuración).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the import panel lives in Configuración (head of department only) and loads with it', () => {
  const cfg = html.indexOf('aria-label="Configuración"'), panel = html.indexOf('Importar datos del hospital'), end = html.indexOf('</section>', cfg);
  assert.ok(cfg > 0 && panel > cfg && panel < end, 'inside the admin-only Configuración section');
  assert.match(app, /if\(key==='config'\)\{opsLoadCat\(\);impLoad\(\)\}/);
});

test('preview before commit; commit only after a clean preview; undo per batch', () => {
  assert.match(html, /@click="impPreview">/);
  assert.match(html, /v-if="imp\.preview &amp;&amp; !imp\.preview\.fatal"[^>]*@click="impCommit"/);
  assert.match(html, /!!imp\.preview\.already_imported/);
  assert.match(app, /'\/api\/ops\/import\/preview'/); assert.match(app, /'\/api\/ops\/import\/commit'/);
  assert.match(app, /'\/api\/ops\/import\/batches\/'\+b\.id\+'\/undo'/);
});

test('says the rules out loud: counts only, manual values kept', () => {
  assert.match(html, /Counts only\. A file with a column that could hold patient data/);
  assert.match(html, /Values entered by hand are never overwritten/);
  assert.match(html, /kept \(entered by hand\)/);
});

test('a measure with a breakdown requires a category per key', () => {
  assert.match(app, /impCats\(f\.unit_id,f\.type_id\)\.length&&!f\.category_code/);
});

test('every import binding is exposed', () => {
  const ret = app.slice(app.indexOf('imp, impLoad,'), app.indexOf('opsRoom, OPS_QUESTIONS,'));
  for (const n of ['impLoad', 'impTypes', 'impType', 'impUnitName', 'impCats', 'impSystems', 'impMapAdd', 'impMapToggle', 'impMapRemove', 'impFile', 'impPreview', 'impCommit', 'impUndo', 'impSample'])
    assert.ok(ret.includes(n + ','), n);
});

test('no < inside interpolations in the panel', () => {
  const a = html.indexOf('IM-1 · Importar datos'), b = html.indexOf('</details>', html.indexOf('4 · Automatic feed'));
  for (const m of html.slice(a, b).matchAll(/\{\{([\s\S]*?)\}\}/g)) assert.ok(!m[1].includes('<'), m[1]);
});
