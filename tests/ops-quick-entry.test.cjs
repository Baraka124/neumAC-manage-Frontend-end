'use strict';
// Quick entry: a sentence becomes a DRAFT of the unit's counts. Uses the real seeded measures of the units.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Q = require('../ops-quick-entry.js');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const today = '2026-10-17';
const mk = (code, label, kind = 'flow', breakdown = null) => ({ type_id: code, code, label, kind, breakdown });

const BRONCO = [mk('broncoscopia', 'Broncoscopias'), mk('ebus', 'EBUS'), mk('lista_espera', 'Lista de espera', 'stock')];
const PFR = [mk('espirometria', 'Espirometrías'), mk('pletismografia', 'Pletismografías'), mk('dlco', 'DLCO'), mk('test_marcha', 'Test de marcha 6 min'), mk('lista_espera', 'Lista de espera', 'stock')];
const HOSP = [mk('ingresos', 'Ingresos'), mk('altas', 'Altas'), mk('altas_pendientes', 'Altas pendientes', 'stock')];
const CCEE = [mk('primeras', 'Primeras visitas'), mk('sucesivas', 'Visitas sucesivas'), mk('lista_espera', 'Lista de espera', 'stock')];

test('counts, waiting list and date from one sentence', () => {
  const r = Q.parse('hoy 6 broncoscopias, 1 EBUS, lista de espera 40', BRONCO, { today });
  assert.equal(r.date, today);
  assert.deepEqual(r.values, { broncoscopia: 6, ebus: 1 });
  assert.deepEqual(r.stocks, { lista_espera: 40 });
  assert.deepEqual(r.unknown, []);
});

test('number before or after, words for numbers, short names people use', () => {
  assert.deepEqual(Q.parse('broncos 5 ebus 2', BRONCO, { today }).values, { broncoscopia: 5, ebus: 2 });
  assert.deepEqual(Q.parse('tres fibro y una ebus', BRONCO, { today }).values, { broncoscopia: 3, ebus: 1 });
  assert.deepEqual(Q.parse('3 espiros, 2 pletis, 1 dlco', PFR, { today }).values, { espirometria: 3, pletismografia: 2, dlco: 1 });
});

test('a number inside a name ("6 min") is not taken as the count', () => {
  const r = Q.parse('2 test de marcha 6 min', PFR, { today });
  assert.deepEqual(r.values, { test_marcha: 2 });
});

test('the longer, more specific name wins (Altas vs Altas pendientes)', () => {
  const r = Q.parse('altas 5, altas pendientes 3, 4 ingresos', HOSP, { today });
  assert.deepEqual(r.values, { altas: 5, ingresos: 4 });
  assert.deepEqual(r.stocks, { altas_pendientes: 3 });
});

test('never guesses: an equal match is ambiguous, an unknown activity is reported', () => {
  const r = Q.parse('5 visitas, 2 primeras', CCEE, { today });
  assert.deepEqual(r.values, { primeras: 2 });
  assert.equal(r.ambiguous.length, 1);
  assert.deepEqual(r.ambiguous[0].options.sort(), ['Primeras visitas', 'Visitas sucesivas']);
  const u = Q.parse('7 polisomnografias', BRONCO, { today });
  assert.deepEqual(u.values, {});
  assert.deepEqual(u.unknown, ['polisomnografias']);
});

test('dates: ayer / anteayer / dd/mm; a future date is refused', () => {
  assert.equal(Q.parse('ayer 2 ebus', BRONCO, { today }).date, '2026-10-16');
  assert.equal(Q.parse('anteayer 2 ebus', BRONCO, { today }).date, '2026-10-15');
  assert.equal(Q.parse('el 14/10 2 ebus', BRONCO, { today }).date, '2026-10-14');
  const f = Q.parse('20/10 2 ebus', BRONCO, { today });
  assert.equal(f.date, null);
  assert.match(f.notes[0], /future/);
});

test('breakdown measures: counts per category after the measure name', () => {
  const M = [mk('ingresos', 'Ingresos', 'flow', 'clinical_condition'), mk('altas', 'Altas')];
  const breakdowns = { clinical_condition: [{ code: 'epoc_agudizado', label: 'EPOC agudizada' }, { code: 'neumonia', label: 'Neumonía' }, { code: 'tep', label: 'TEP' }] };
  const r = Q.parse('ingresos: 3 EPOC, 2 neumonía y 1 TEP. 4 altas', M, { today, breakdowns });
  assert.deepEqual(r.bd, { ingresos: { epoc_agudizado: 3, neumonia: 2, tep: 1 } });
  assert.deepEqual(r.values, { altas: 4 });
  // a total for a measure counted by category is not invented into categories
  const t = Q.parse('5 ingresos', M, { today, breakdowns });
  assert.deepEqual(t.bd, {});
  assert.match(t.notes[0], /counted by clinical condition/);
});

test('UI: quick entry fills the form only (Save stays with the person), same-as-last and suggestions wired', () => {
  assert.match(html, /<script src="ops-quick-entry\.js\?v=[^"]+"><\/script>/);
  assert.match(html, /@click="opsQuickApply"/);
  assert.match(html, /@click="opsCopyLast"/);
  assert.match(html, /@click="opsSugAdd\(s\)"/);
  const apply = app.slice(app.indexOf('const opsQuickApply'), app.indexOf('const opsCopyLast'));
  assert.ok(apply.length > 0);
  assert.doesNotMatch(apply, /API\.request\(opsUnitUrl\('measures'\),\{method:'PUT'/);   // never saves
  assert.match(app, /opsQuickApply, opsCopyLast, opsQuickSummary, opsSugLoad, opsSugAdd/);
});

test('UI: Google Sheets source on both imports', () => {
  assert.match(html, /@click="sheetLoad\('rotations'\)"/);
  assert.match(html, /@click="sheetLoad\('oncall'\)"/);
  assert.match(app, /'\/api\/import\/sheet-source\/'\+kind/);
  assert.match(app, /if\(kind==='rotations'\)await rotationImportParse\(file\);else await oncallSyncParse\(file\)/);
});
