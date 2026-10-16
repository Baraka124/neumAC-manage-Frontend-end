'use strict';
// Contract for the rotations-matrix translator: the resident × month grid becomes
// flat rotation periods, consecutive months collapse, cross-year stays merge, split
// cells split, unknown units are reported, and ambiguous residents are never guessed.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const RI = require('../rotation-import.js');

// A minimal cohort sheet: header + two residents, mirroring the real layout.
const cohort2026 = [
  ['Residentes NML 2026'],
  ['Resumen'],
  [],
  ['Residente','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  ['Iria','UCRI','MII','SALA NML','BFC','BFC','BFC','UCRI'],
  ['Efrén','UTB / SALA NML','SALA NML', null, 'RX','RX', null, 'TXP'],
];
const cohort2027 = [
  [],[],[],
  ['Residente','Ene','Feb','Mar','Abr','May'],
  ['Iria','UCRI','SALA NML','ROT EXT','ROT EXT','CCEE'],
];

test('consecutive identical months collapse into one period with correct dates', () => {
  const { periods } = RI.parseCohort('MIR NML 2026', cohort2026);
  const bfc = periods.find(p => p.resident==='Iria' && p.unit_excel==='BFC');
  assert.equal(bfc.start_date, '2026-09-01');
  assert.equal(bfc.end_date, '2026-11-30');   // Sep+Oct+Nov collapsed
  assert.equal(bfc.months, 3);
  const jun = periods.find(p => p.resident==='Iria' && p.unit_excel==='UCRI' && p.start_date==='2026-06-01');
  assert.equal(jun.end_date, '2026-06-30');
});

test('unit codes map to DB unit_code; all known codes resolve', () => {
  const { periods } = RI.parseCohort('MIR NML 2026', cohort2026);
  assert.equal(periods.find(p=>p.unit_excel==='SALA NML').unit_code, 'HOSP-NEUM');
  assert.equal(periods.find(p=>p.unit_excel==='MII').unit_code, 'MED-INT');
  assert.equal(periods.find(p=>p.unit_excel==='BFC').unit_code, 'BFC');
  assert.ok(periods.filter(p=>p.unit_excel!=='UTB'&&p.unit_excel!=='SALA NML').every(p=>p.matched));
});

test('an unknown unit code is reported, not silently dropped', () => {
  const { periods, unmatchedUnits } = RI.parseCohort('MIR NML 2026', [
    ['Residente','Jun'],['Iria','ZZZ']
  ]);
  assert.deepEqual(unmatchedUnits, ['ZZZ']);
  assert.equal(periods[0].matched, false);
  assert.equal(periods[0].unit_code, null);
});

test('a split cell becomes two flagged half-month periods in order', () => {
  const { periods } = RI.parseCohort('MIR NML 2026', cohort2026);
  const splits = periods.filter(p=>p.resident==='Efrén' && p.split);
  assert.equal(splits.length, 2);
  assert.equal(splits[0].unit_excel, 'UTB');
  assert.equal(splits[0].start_date, '2026-06-01');
  assert.equal(splits[0].end_date, '2026-06-15');
  assert.equal(splits[1].unit_excel, 'SALA NML');
  assert.equal(splits[1].start_date, '2026-06-16');
  assert.equal(splits[1].end_date, '2026-06-30');
});

test('cross-year contiguous stays merge (Dec 2026 UCRI + ... only when truly adjacent)', () => {
  // Iria: 2026 Dic=UCRI, 2027 Ene=UCRI would merge; here 2027 Ene=UCRI is adjacent to Dic UCRI.
  const merged = RI.mergeContiguous([
    {resident:'Iria',unit_excel:'UCRI',unit_code:'UCRI',start_date:'2026-12-01',end_date:'2026-12-31',months:1,split:false},
    {resident:'Iria',unit_excel:'UCRI',unit_code:'UCRI',start_date:'2027-01-01',end_date:'2027-01-31',months:1,split:false},
  ]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].start_date, '2026-12-01');
  assert.equal(merged[0].end_date, '2027-01-31');
  assert.equal(merged[0].months, 2);
});

test('resolveResident resolves one hit, flags ambiguity with candidates, never auto-picks', () => {
  const staff = [
    {id:'a1', full_name:'Ana Santalla'},
    {id:'a2', full_name:'Ana Souto Alonso'},
    {id:'i1', full_name:'Iria Horjales Rodríguez'},
  ];
  assert.equal(RI.resolveResident('Iria', staff).id, 'i1');          // unique first-token hit
  const ana = RI.resolveResident('Ana', staff);
  assert.equal(ana.issue, 'Ambiguous name');                          // two Anas → not guessed
  assert.equal(ana.candidates.length, 2);
  assert.equal(RI.resolveResident('Zzz', staff).issue, 'Name not matched');
  assert.deepEqual(RI.resolveResident('Ana', staff, {Ana:'a1'}), {id:'a1', name:'Ana Santalla'}); // saved mapping wins
  assert.deepEqual(RI.resolveResident('Ana', staff, {Ana:'skip'}), {skip:true});
});

test('plan resolves residents+units, flags unmatched, and payload emits only selected ready rows', () => {
  const staff=[{id:'i1',full_name:'Iria Horjales'},{id:'a1',full_name:'Ana Santalla'},{id:'a2',full_name:'Ana Souto'}];
  const units=[{id:'u-hosp',unit_code:'HOSP-NEUM',unit_name:'Hospitalización'},{id:'u-bfc',unit_code:'BFC',unit_name:'Broncoscopias'}];
  const periods=[
    {source_sheet:'MIR NML 2026',resident:'Iria',unit_excel:'SALA NML',unit_code:'HOSP-NEUM',start_date:'2026-08-01',end_date:'2026-08-31',split:false},
    {source_sheet:'MIR NML 2026',resident:'Ana',unit_excel:'BFC',unit_code:'BFC',start_date:'2026-09-01',end_date:'2026-09-30',split:false}, // Ana ambiguous
    {source_sheet:'MIR NML 2026',resident:'Iria',unit_excel:'ZZZ',unit_code:null,start_date:'2026-10-01',end_date:'2026-10-31',split:false}, // unit unmapped
  ];
  const p1=RI.plan(periods,staff,units);
  assert.equal(p1.records.find(r=>r.resident==='Iria'&&r.unit_excel==='SALA NML').status,'ready');
  assert.equal(p1.unmatchedResidents.length,1);          // the two Anas
  assert.equal(p1.unmatchedResidents[0].candidates.length,2);
  assert.equal(p1.unmatchedUnits[0].code,'ZZZ');         // unmapped unit reported
  assert.equal(p1.records.find(r=>r.unit_excel==='ZZZ').status,'blocked');

  // resolve the ambiguous Ana + choose to create ZZZ → both become ready
  const p2=RI.plan(periods,staff,units,{residentMappings:{Ana:'a1'},unitChoices:{ZZZ:'create'}});
  const anaRow=p2.records.find(r=>r.resident==='Ana');
  assert.equal(anaRow.status,'ready'); assert.equal(anaRow.resident_id,'a1');
  const zzz=p2.records.find(r=>r.unit_excel==='ZZZ');
  assert.equal(zzz.status,'ready'); assert.deepEqual(zzz.create_unit,{unit_code:'ZZZ',unit_name:'ZZZ'});

  // payload: only selected ready rows, with create_unit carried through
  const sel={}; p2.records.forEach(r=>sel[r.key]=true);
  const body=RI.payload(p2.records,sel);
  assert.equal(body.length,3);
  assert.ok(body.find(b=>b.create_unit&&b.create_unit.unit_code==='ZZZ'));
  assert.ok(body.every(b=>b.resident_id&&b.start_date&&b.end_date));
});

test('translate ignores non-cohort sheets and merges across cohort sheets', () => {
  const out = RI.translate({ 'MIR NML 2026': cohort2026, 'MIR NML 2027': cohort2027, 'Broncoscopias': [['Año','Mes']] });
  assert.ok(out.residents.includes('Iria') && out.residents.includes('Efrén'));
  // Iria Dic 2026 UCRI + Ene 2027 UCRI merge → one period
  const iriaUcri = out.periods.filter(p=>p.resident==='Iria' && p.unit_excel==='UCRI' && p.start_date==='2026-12-01');
  assert.equal(iriaUcri.length, 1);
  assert.equal(iriaUcri[0].end_date, '2027-01-31');
});
