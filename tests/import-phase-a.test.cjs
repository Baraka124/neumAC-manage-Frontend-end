'use strict';
// Import Phase A — time-aware, person-centred preview (structural + behaviour).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('preview opens on current & upcoming and pre-selects only that working set', () => {
  assert.match(app, /filter:\{resident:'',status:'',band:'now',person:''\},autoSelect:true/);
  assert.match(app, /r\.status==='ready'&&\['current','upcoming'\]\.includes\(r\.band\)/);   // never history or far-future
  assert.match(html, /<option value="now">Current &amp; upcoming/);
  assert.match(html, /<option value="past">History/);
  assert.match(html, /<option value="far">Beyond 12 months/);
});

test('person view: search one person, compare with neumDesk, accept their rows', () => {
  assert.match(html, /v-model="rotationImport\.filter\.person"/);
  assert.match(html, /ALREADY IN NEUMDESK/);
  assert.match(html, /@click="rotationImportSelectPerson"/);
  assert.match(app, /\/api\/rotations\?limit=500&include_completed=true&resident_id=/);
});

test('selections survive view changes and hidden selections are always stated', () => {
  assert.ok(!/watch\(\(\)=>JSON\.stringify\(rotationImport\.filter\),\(\)=>\{rotationImport\.selection=\{\}\}/.test(app), 'filter changes no longer wipe the selection');
  assert.match(html, /rotationImportHiddenSelected/);
});

test('rows are highlighted by band; guardias beyond 12 months are flagged', () => {
  assert.match(html, /'import-band-'\+\(r\.band\|\|'upcoming'\)/);
  assert.match(app, /'import-band-far' : 'sync-row-future'/);
});
