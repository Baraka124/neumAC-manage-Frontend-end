'use strict';
// Mi espacio · Phase 3 — the claim/verify adapter contract (pure; runs in `check`).
const assert = require('node:assert/strict');
const { test } = require('node:test');
const data = require('../mi-espacio/mi-espacio-data.js');

test('buildReport clamps to allowed enums and includes only given optionals', () => {
  const full = data.buildReport({ subject_type: 'line', kind: 'missing', subject_id: 'L2', subject_label: 'Vía aérea', message: 'falta' });
  assert.deepEqual(full, { subject_type: 'line', kind: 'missing', subject_id: 'L2', subject_label: 'Vía aérea', message: 'falta' });
  const clamped = data.buildReport({ subject_type: 'bogus', kind: 'nope' });
  assert.equal(clamped.subject_type, 'other');
  assert.equal(clamped.kind, 'other');
  assert.equal('subject_id' in clamped, false);   // empty optionals omitted
  assert.equal('message' in clamped, false);
  assert.equal(data.buildReport(null).subject_type, 'other');  // never throws
});

test('submitDiscrepancy POSTs the built report to the endpoint', async () => {
  const seen = []; const ac = new AbortController();
  await data.submitDiscrepancy((p, o) => { seen.push({ p, o }); return { id: 'x' }; },
    { subject_type: 'study', kind: 'incorrect', message: 'm' }, ac.signal);
  assert.equal(seen[0].p, '/api/me/discrepancies');
  assert.equal(seen[0].o.method, 'POST');
  assert.deepEqual(seen[0].o.body, { subject_type: 'study', kind: 'incorrect', message: 'm' });
  assert.equal(seen[0].o.signal, ac.signal);
});

test('loadMyReports normalizes rows and is defensive', async () => {
  const rows = await data.loadMyReports(async () => ([
    { id: 'r1', subject_type: 'line', subject_label: 'Vía aérea', kind: 'missing', status: 'open', created_at: '2026-10-11' },
    null, 'junk'
  ]));
  assert.equal(rows.length, 3);
  assert.equal(rows[0].subjectType, 'line');
  assert.equal(rows[0].status, 'open');
  assert.equal(rows[1].status, 'open');    // junk → safe defaults, no throw
  assert.deepEqual(await data.loadMyReports(async () => 'not-an-array'), []);
});

test('claim adapters require an authenticated request service', async () => {
  await assert.rejects(() => data.submitDiscrepancy(null, {}), /authenticated request service/i);
  await assert.rejects(() => data.loadMyReports(null), /authenticated request service/i);
});
