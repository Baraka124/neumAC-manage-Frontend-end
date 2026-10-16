'use strict';
// Pneumo Ops Room OR-1: view wiring (units + "¿Quién está?"), access, honesty of unbuilt questions.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const access = fs.readFileSync(path.join(__dirname, '..', 'access.js'), 'utf8');

test('Ops Room is its own view, opened with Units read access; communications keeps its own entry', () => {
  assert.match(access, /opsroom:'training_units'/);
  assert.match(html, /@click\.prevent="switchView\('opsroom'\); mobileMenuOpen = false"\s*\n\s*v-if="hasPermission\('training_units', 'read'\)"/);
  assert.match(html, /aria-label="Communications" :aria-current="currentView === 'communications'/);
  assert.match(app, /if \(view === 'opsroom'\) \{\s*currentView\.value = 'opsroom'\s*opsRoom\.unit = null\s*opsLoad\(\)/);
});

test('purpose and the six questions are the structure of a unit', () => {
  assert.match(html, /Sala de Operaciones de Neumología/);
  for (const q of ['¿Quién está?', '¿Con qué contamos?', '¿Qué hemos hecho?', '¿Qué está pendiente?', '¿Qué ha fallado?', '¿Cumplimos?']) assert.ok(app.includes(`q:'${q}'`), q);
  assert.match(html, /:disabled="!opsQuestionOn\(opsRoom\.unit,q\)"/);          // only the unit's own capabilities
});

test('roster: managed with Units write, permanent delete only for admins, residents from Rotations', () => {
  assert.match(app, /const opsCanManage=computed\(\(\)=>hasPermission\('training_units','write'\)\)/);
  assert.match(app, /const opsIsAdmin=computed\(\(\)=>\['system_admin','department_head'\]\.includes/);
  assert.match(html, /<button v-if="opsIsAdmin" type="button" class="btn btn-secondary btn-sm" title="Delete permanently/);
  assert.match(app, /!\/resident\|fellow\|mir\/i\.test\(s\.staff_type\|\|''\)/);
  assert.match(html, /RESIDENTS THIS WEEK <span class="opsr-src">from Rotations<\/span>/);
  assert.match(app, /'\/api\/ops\/units\/'\+encodeURIComponent\(opsRoom\.unit\.id\)\+'\/staff'/);
});

test('questions not built yet say so and show nothing simulated', () => {
  assert.match(html, /Not built yet — nothing here is simulated\./);
});
