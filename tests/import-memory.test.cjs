'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../import-memory.js');

test('key matches the backend normalisation', () => {
  assert.equal(M.key('  SUEÑO '), 'sueno');
  assert.equal(M.key('Dra. Ana   Santalla'), 'ana santalla');
});

test('saved aliases become parser mappings and are reported as remembered', () => {
  const aliases = [{ id: 'x1', source_key: 'ana', action: 'map', target_id: 'a1' }, { id: 'x2', source_key: 'zzz', action: 'skip', target_id: null }];
  const { mapping, remembered } = M.mappingFor(['Ana', 'ZZZ', 'Iria'], aliases);
  assert.deepEqual(mapping, { Ana: 'a1', ZZZ: 'skip' });
  assert.deepEqual(remembered.map(r => r.label), ['Ana', 'ZZZ']);
});

test('layout ignores a new academic year but reports real template changes', () => {
  const hdr = [['Residente', 'Jun', 'Jul', 'Ago']];
  const y26 = M.layoutRotations({ 'MIR NML 2026': hdr, 'MIR NML 2027': hdr, Externos: [] });
  const y27 = M.layoutRotations({ 'MIR NML 2027': hdr, 'MIR NML 2028': hdr, Externos: [] });
  assert.equal(M.fingerprint(y26), M.fingerprint(y27));                 // just the next year: no warning
  const changed = M.layoutRotations({ 'MIR NML 2027': [['Residente', 'Unidad', 'Jun', 'Jul']], Externos: [] });
  assert.notEqual(M.fingerprint(y26), M.fingerprint(changed));
  assert.ok(M.diffLayout(y26, changed).some(d => /New column “unidad”/.test(d)));
  assert.ok(M.diffLayout(y26, changed).some(d => /Column “ago” is missing/.test(d)));
  assert.deepEqual(M.diffLayout(null, y26), []);                       // first import: nothing to compare
});

test('guardia layout uses the Fecha header row', () => {
  const l = M.layoutOncall('2026+', [['title'], ['Fecha', 'Día', 'Nombre STAFF', 'Tipo Guardia STAFF', 'Nombre MIR']]);
  assert.deepEqual(l.sheets, ['####+']);
  assert.deepEqual(l.header, ['fecha', 'dia', 'nombre staff', 'tipo guardia staff', 'nombre mir']);
});

test('guardias match by column role: STAFF → attendings, MIR → residents', () => {
  const S = require('../oncall-sync.js');
  const staff = [
    { id: 'a1', full_name: 'Adela Antelo del Río', staff_type: 'attending_physician', employment_status: 'active' },
    { id: 'r1', full_name: 'Ana Santalla', staff_type: 'medical_resident', employment_status: 'active' },
    { id: 'a2', full_name: 'Ana Souto Alonso', staff_type: 'attending_physician', employment_status: 'active' },
  ];
  const rows = [
    { date: '2026-11-02', surname: 'ANTELO', mir: 'Ana', shiftType: 'on_call_home', source_sheet: '2026+', source_row: 5 },
    { date: '2026-11-03', surname: 'Ana', mir: '', shiftType: 'on_call_home', source_sheet: '2026+', source_row: 6 },
  ];
  const p = S.plan(rows, staff, [], {}, {});
  assert.equal(p.entries[0].residentId, 'r1');   // "Ana" in the MIR column → the resident
  assert.equal(p.entries[1].staffId, 'a2');      // "Ana" in the STAFF column → the attending
  // a saved mapping to the wrong role is rejected, not silently used
  const bad = S.plan([{ ...rows[0], mir: 'Ana' }], staff, [], { Ana: 'a2' }, {});
  assert.equal(bad.entries[0].status, 'blocked');
  assert.ok(bad.unmatched.some(u => u.surname === 'Ana' && u.role === 'mir'));
});

test('rotations: a saved unit choice wins over the built-in code table', () => {
  const RI = require('../rotation-import.js');
  const staff = [{ id: 'i1', full_name: 'Iria Horjales', staff_type: 'medical_resident' }];
  const units = [{ id: 'u-rad', unit_code: 'RAD-TORAX', unit_name: 'Radiología Tórax' }, { id: 'u-new', unit_code: 'RX-INT', unit_name: 'Radiología Intervencionista' }];
  const periods = [{ source_sheet: 'MIR NML 2026', resident: 'Iria', unit_excel: 'RX', unit_code: 'RAD-TORAX', start_date: '2026-11-01', end_date: '2026-11-30', split: false }];
  assert.equal(RI.plan(periods, staff, units).records[0].training_unit_id, 'u-rad');                              // default
  assert.equal(RI.plan(periods, staff, units, { unitChoices: { RX: 'u-new' } }).records[0].training_unit_id, 'u-new'); // remembered remap
  assert.equal(RI.plan(periods, staff, units, { unitChoices: { RX: 'skip' } }).records[0].status, 'skipped');
});

test('app wiring: saved mappings applied, choices remembered, layout checked and saved', () => {
  const fs = require('node:fs'), path = require('node:path');
  const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(app, /importMemory\.aliases\('rotation_resident'\),importMemory\.aliases\('rotation_unit'\)/);
  assert.match(app, /importMemory\.aliases\('oncall_staff'\)/);
  assert.match(app, /rotationImportRemember\('resident',label,id\)/);
  assert.match(app, /rotationImportRemember\('unit',code,choice\)/);
  assert.match(app, /legacyItems/);                                   // browser-only mappings migrated to the DB
  assert.match(app, /importMemory\.layoutSave\('rotations'/);
  assert.match(app, /importMemory\.layoutSave\('oncall'/);
  assert.match(html, /Applied from saved mappings/);
  assert.match(html, /This file's layout differs from the last import/);
  assert.match(html, /<script src="import-memory\.js\?v=/);
});
