'use strict';
// Import Phase D — re-import as sync: unchanged / changed / removed upstream, guardia swaps.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = require('../rotation-import.js');
const O = require('../oncall-sync.js');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const rec = (o) => ({ status: 'ready', resident_id: 'ana', training_unit_id: 'u1', source_sheet: 'MIR NML 2025', resident: 'Ana', unit_excel: 'NML', key: 'k-' + o.start_date, ...o });
const ex = (o) => ({ id: 'e-' + o.start_date, resident_id: 'ana', training_unit_id: 'u1', rotation_status: 'scheduled', sync_source: { file: 'old.xlsx' }, ...o });

test('identical rotation already in neumDesk is "unchanged" and never sent', () => {
  const d = R.diff([rec({ start_date: '2026-11-01', end_date: '2026-12-31' })], [ex({ start_date: '2026-11-01', end_date: '2026-12-31' })]);
  assert.equal(d.records[0].status, 'unchanged');
  assert.equal(d.counts.unchanged, 1);
  assert.deepEqual(R.payload(d.records, { [d.records[0].key]: true }), []);
  assert.deepEqual(d.removed, []);
});

test('a changed period of an earlier IMPORTED rotation becomes a one-to-one replacement', () => {
  const d = R.diff([rec({ start_date: '2026-11-01', end_date: '2027-01-31' })], [ex({ start_date: '2026-11-01', end_date: '2026-12-31', unit: { unit_name: 'Neumo' } })]);
  const r = d.records[0];
  assert.equal(r.status, 'ready'); assert.equal(r.sync, 'changed'); assert.equal(r.replaces, 'e-2026-11-01');
  assert.equal(r.previous.end_date, '2026-12-31');
  const p = R.payload(d.records, { [r.key]: true })[0];
  assert.equal(p.replaces, 'e-2026-11-01');
  assert.equal(p.sync_key, 'rotations:' + r.key);
});

test('hand-entered rotations (no sync_source) are never replaced nor proposed for removal', () => {
  const d = R.diff([rec({ start_date: '2026-11-01', end_date: '2027-01-31' })], [ex({ start_date: '2026-11-01', end_date: '2026-12-31', sync_source: null }), ex({ id: 'manual2', start_date: '2027-03-01', end_date: '2027-03-31', sync_source: null })]);
  assert.equal(d.records[0].replaces, undefined);
  assert.deepEqual(d.removed, []);
});

test('one imported row overlapped by two file rows is left to the human (no replace)', () => {
  const d = R.diff([rec({ start_date: '2026-11-01', end_date: '2026-11-30' }), rec({ start_date: '2026-12-01', end_date: '2026-12-31' })], [ex({ start_date: '2026-11-01', end_date: '2026-12-31' })]);
  assert.ok(d.records.every(r => !r.replaces));
  assert.deepEqual(d.removed, []);                       // still overlapped → a conflict, not a removal
});

test('imported rotation inside the resident\'s file span that the file no longer lists → removed (not other residents, not outside span)', () => {
  const d = R.diff(
    [rec({ start_date: '2026-10-01', end_date: '2026-10-31' }), rec({ start_date: '2027-02-01', end_date: '2027-02-28' })],
    [ex({ start_date: '2026-12-01', end_date: '2026-12-31' }), ex({ start_date: '2027-06-01', end_date: '2027-06-30' }), ex({ resident_id: 'other', start_date: '2026-12-01', end_date: '2026-12-31', id: 'o1' })]);
  assert.deepEqual(d.removed.map(x => x.id), ['e-2026-12-01']);
  assert.equal(d.counts.removed, 1);
});

test('guardias: imported shifts inside the file period but missing from the file are removed upstream', () => {
  const rows = [{ date: '2026-11-01' }, { date: '2026-11-03' }];
  const existing = [
    { id: 'a', duty_date: '2026-11-02', sync_source: { file: 'x' } },          // gap date, imported → removed
    { id: 'b', duty_date: '2026-11-02T00:00:00', sync_source: null },          // hand-entered → kept
    { id: 'c', duty_date: '2026-11-05', sync_source: { file: 'x' } },          // outside period → kept
    { id: 'd', duty_date: '2026-11-03', sync_source: { file: 'x' } }];         // still in file
  assert.deepEqual(O.removedUpstream(rows, existing).map(s => s.id), ['a']);
  assert.deepEqual(O.removedUpstream([], existing), []);
});

test('guardias: A↔B trade across two dates is detected as one swap', () => {
  const e = (key, date, was, now) => ({ key, date, status: 'conflict', expected: { primary_physician_id: was, resident_physician_id: null }, staffId: now, residentId: null });
  const s = O.swaps([e('1', '2026-11-04', 'A', 'B'), e('2', '2026-11-09', 'B', 'A'), e('3', '2026-11-10', 'C', 'D')]);
  assert.equal(s.length, 1);
  assert.deepEqual(s[0].keys, ['1', '2']); assert.deepEqual(s[0].people, ['A', 'B']); assert.equal(s[0].role, 'staff');
  assert.equal(O.swaps([e('1', '2026-11-04', 'A', 'B'), e('3', '2026-11-10', 'C', 'A')]).length, 0);
});

test('app wiring: diff on rebuild, removals never pre-selected, import runs logged', () => {
  assert.match(app, /window\.NeumRotationImport\.diff\(p\.records,rotationImport\.existing\)/);
  assert.match(app, /importMemory\.existing\('rotations'/);
  assert.match(app, /importMemory\.existing\('oncall'/);
  assert.match(app, /'\/api\/rotations\/'\+encodeURIComponent\(r\.id\)\+'\?mode=remove'/);
  assert.match(app, /removeSel:\{\}/);
  assert.match(app, /importMemory\.logRun\('rotations'/);
  assert.match(app, /importMemory\.logRun\('oncall'/);
  assert.match(app, /oncallSyncAcceptSwap=sw=>/);
  assert.match(html, /No longer in this file/);
  assert.match(html, /Swaps detected/);
  assert.match(html, /<option value="unchanged">Already in neumDesk<\/option>/);
});
