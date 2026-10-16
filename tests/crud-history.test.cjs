'use strict';
// Delete-anytime + Historial guards (structural).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('rotations table hides past rotations unless Historial or a status filter is on', () => {
  assert.match(app, /history: false \}/);
  assert.match(app, /if \(!rotationFilters\.history && !rotationFilters\.status\) f = f\.filter\(r => !rotationIsPast\(r\)\)/);
  assert.match(app, /r\.actual_end_date \|\| r\.end_date/);           // effective end, not just planned end
  assert.match(html, /v-model="rotationFilters\.history"/);
});

test('any rotation can be deleted; permanent delete only for admins / head of department', () => {
  assert.match(html, /@click\.stop="removeRotation\(rotation\)" v-if="hasPermission\('resident_rotations','delete'\)"/);
  assert.match(html, /@click\.stop="removeRotation\(rotation, true\)" v-if="canPurgeRecords"/);
  assert.match(app, /\['system_admin', 'department_head'\]\.includes\(currentUser\?\.value\?\.user_role\)/);
  assert.match(app, /permanent \? \{ permanent: true \} : \{ mode: 'remove' \}/);
});

test('past absences can be deleted without rewriting their status', () => {
  assert.match(html, /@click\.stop="removeAbsence\(absence\)"/);
  assert.match(app, /API\.deleteAbsence\(absence\.id, \{ mode: 'remove' \}\)/);
  assert.match(html, /\['system_admin','department_head'\]\.includes\(currentUser\.user_role\) && \['returned_to_duty','cancelled'\]/);
});

test('short dates show the year when it is not the current one', () => {
  assert.match(app, /if \(date\.getFullYear\(\) !== new Date\(\)\.getFullYear\(\)\) opts\.year = 'numeric'/);
  const d = new Date('2028-10-01T00:00:00');
  assert.match(d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }), /2028/);
});
