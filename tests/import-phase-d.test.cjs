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
  assert.equal(r.status, 'replacement'); assert.equal(r.sync, 'changed'); assert.equal(r.auto, true); assert.equal(r.replaces, 'e-2026-11-01');
  assert.equal(r.replace_confirmed, undefined);                          // earlier import: no manual confirmation needed
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
  assert.match(app, /T\.diff\(planned,rotationImport\.existing,rotationImport\.choices\)/);
  assert.match(app, /importMemory\.existing\('rotations'/);
  assert.match(app, /importMemory\.existing\('oncall'/);
  assert.match(app, /'\/api\/rotations\/'\+encodeURIComponent\(r\.id\)\+'\?mode=remove'/);
  assert.match(app, /removeSel:\{\}/);
  assert.match(app, /importMemory\.logRun\('rotations'/);
  assert.match(app, /importMemory\.logRun\('oncall'/);
  assert.match(app, /oncallSyncAcceptSwap=sw=>/);
  assert.match(html, /No longer in this file/);
  assert.match(html, /Swaps detected/);
  assert.match(html, /<option value="unchanged">Already matches<\/option>/);
});

test('a row colliding with an early-terminated rotation is offered "start after it" (Cristina, 16 Oct 2026)', () => {
  const existing = [ex({ id: 'uci', start_date: '2026-09-01', end_date: '2026-10-02', actual_end_date: '2026-09-04', rotation_status: 'terminated_early', sync_source: null, unit: { unit_name: 'UCI' } })];
  const d = R.diff([rec({ start_date: '2026-09-01', end_date: '2026-11-30' })], existing);
  const r = d.records[0];
  assert.equal(r.replaces, undefined);                                   // hand-entered: never replaced
  assert.deepEqual(r.trim, { start_date: '2026-09-05', because: { unit_name: 'UCI', start_date: '2026-09-01', end_date: '2026-09-04', status: 'terminated_early' } });
  // after trimming the start, nothing collides any more
  assert.equal(R.diff([rec({ start_date: '2026-09-05', end_date: '2026-11-30' })], existing).records[0].trim, undefined);
});

test('no trim when the row is fully covered, or would still collide later', () => {
  const full = [ex({ id: 'a', start_date: '2026-09-01', end_date: '2026-12-31', sync_source: null })];
  assert.equal(R.diff([rec({ start_date: '2026-10-01', end_date: '2026-11-30' })], full).records[0].trim, undefined);
  const later = [ex({ id: 'a', start_date: '2026-09-01', end_date: '2026-09-10', sync_source: null }), ex({ id: 'b', start_date: '2026-10-01', end_date: '2026-10-31', sync_source: null })];
  assert.equal(R.diff([rec({ start_date: '2026-09-01', end_date: '2026-11-30' })], later).records[0].trim, undefined);
});

test('trim wiring: file end kept, only start moves; engine copy matches the DB rule', () => {
  assert.match(app, /trimmed_from:r\.start_date,trim_because:t\.because,start_date:t\.start_date/);
  assert.match(html, /@click="rotationImportTrim\(r\)"/);
  const engine = fs.readFileSync(path.join(__dirname, '..', 'decision51.js'), 'utf8');
  assert.match(engine, /occupiesResident\(r\.rotation_status\)/);
});

// ── Guardia-style decisions on rotation conflicts (16 Oct 2026) ──
const manual = (o) => ex({ sync_source: null, unit: { unit_name: 'UCI' }, ...o });

test('a row overlapping a hand-entered rotation is a Conflict showing the current schedule; nothing is sent until decided', () => {
  const d = R.diff([rec({ start_date: '2026-09-01', end_date: '2026-11-30' })], [manual({ id: 'uci', start_date: '2026-09-01', end_date: '2026-10-02', actual_end_date: '2026-09-04', rotation_status: 'terminated_early' })]);
  const r = d.records[0];
  assert.equal(r.status, 'conflict'); assert.equal(r.can_replace, true);
  assert.deepEqual(r.current.map(c => [c.unit_name, c.start_date, c.end_date, c.planned_end, c.status, c.imported]), [['UCI', '2026-09-01', '2026-09-04', '2026-10-02', 'terminated_early', false]]);
  assert.equal(r.trim.start_date, '2026-09-05');
  assert.equal(R.sendable(r), false);
  assert.deepEqual(R.payload(d.records, { [r.key]: true }), []);
  assert.equal(d.counts.conflicts, 1);
});

test('Approve replacement of a hand-entered rotation sends replaces + replace_confirmed; Keep current sends nothing; Undo restores the conflict', () => {
  const rows = [rec({ start_date: '2026-09-01', end_date: '2026-11-30' })], existing = [manual({ id: 'uci', start_date: '2026-09-01', end_date: '2026-10-02' })];
  const k = rows[0].key;
  const rep = R.diff(rows, existing, { [k]: 'replace' }).records[0];
  assert.equal(rep.status, 'replacement'); assert.equal(rep.sync, 'manual'); assert.equal(rep.auto, false);
  const p = R.payload([rep], { [k]: true })[0];
  assert.equal(p.replaces, 'uci'); assert.equal(p.replace_confirmed, true);
  assert.equal(R.diff(rows, existing, { [k]: 'keep' }).records[0].status, 'kept');
  assert.equal(R.diff(rows, existing, { [k]: '' }).records[0].status, 'conflict');
});

test('an earlier import is pre-approved but can be kept instead', () => {
  const rows = [rec({ start_date: '2026-11-01', end_date: '2027-01-31' })], existing = [ex({ start_date: '2026-11-01', end_date: '2026-12-31' })];
  assert.equal(R.diff(rows, existing).records[0].status, 'replacement');
  assert.equal(R.diff(rows, existing, { [rows[0].key]: 'keep' }).records[0].status, 'kept');
});

test('two recorded rotations under one row → conflict without Approve replacement', () => {
  const r = R.diff([rec({ start_date: '2026-09-01', end_date: '2026-12-31' })], [manual({ id: 'a', start_date: '2026-09-01', end_date: '2026-09-30' }), manual({ id: 'b', start_date: '2026-11-01', end_date: '2026-11-30' })]).records[0];
  assert.equal(r.status, 'conflict'); assert.equal(r.can_replace, false); assert.equal(r.current.length, 2);
});

test('preview wiring: Current schedule column, guardia words, capacity advice with open units', () => {
  assert.match(html, /<th scope="col">Current schedule<\/th><th scope="col">From Excel<\/th>/);
  assert.match(html, /@click="rotationImportChoice\(r,'keep'\)">Keep current/);
  assert.match(html, /@click="rotationImportChoice\(r,'replace'\)">Approve replacement/);
  assert.match(html, /is full as per policy \(max/);
  assert.match(html, /@click="rotationImportUseUnit\(r,u\.id\)"/);
  assert.match(app, /for\(let i=0;i<body\.length;i\+=300\)\{/);       // one check request: same-file rows count
  assert.match(app, /window\.NeumRotationImport\.sendable\(r\)/);
});

test('start-after chains past rotations touching the start (Iria, 16 Oct 2026: HOSP ends 1 Sep, UCI 2→8 Sep)', () => {
  const r = R.diff([rec({ start_date: '2026-09-01', end_date: '2026-11-30' })], [
    manual({ id: 'hosp', start_date: '2026-08-01', end_date: '2026-09-01', rotation_status: 'completed', unit: { unit_name: 'Hospitalización' } }),
    manual({ id: 'uci', start_date: '2026-09-02', end_date: '2026-10-02', actual_end_date: '2026-09-08', rotation_status: 'terminated_early' })]).records[0];
  assert.equal(r.status, 'conflict'); assert.equal(r.can_replace, false);
  assert.equal(r.trim.start_date, '2026-09-09'); assert.equal(r.trim.because.unit_name, 'UCI');
});
