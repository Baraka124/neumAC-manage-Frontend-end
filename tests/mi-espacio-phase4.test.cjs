'use strict';
// Mi espacio · Phase 4 — the reviewer-queue adapter contract (pure; runs in `check`).
const assert = require('node:assert/strict');
const { test } = require('node:test');
const data = require('../mi-espacio/mi-espacio-data.js');

test('normalizeReviewItem lifts the reporter name and is defensive', () => {
  const it = data.normalizeReviewItem({
    id: 'r1', subject_type: 'line', subject_label: 'Vía aérea', kind: 'missing',
    message: 'me falta', status: 'open', created_at: '2026-10-11',
    reporter: { full_name: 'Pedro Marcos' }
  });
  assert.equal(it.id, 'r1');
  assert.equal(it.reporterName, 'Pedro Marcos');
  assert.equal(it.subjectType, 'line');
  assert.equal(it.status, 'open');
  const bare = data.normalizeReviewItem(null);
  assert.equal(bare.status, 'open');        // safe default, never throws
  assert.equal(bare.reporterName, '');      // no reporter embed → empty, not undefined
});

test('loadReviewQueue clamps the status filter and maps rows', async () => {
  const seen = [];
  const rows = await data.loadReviewQueue((p, o) => { seen.push({ p, o }); return [
    { id: 'a', status: 'open', reporter: { full_name: 'X' } }, null, 'junk'
  ]; }, 'accepted');
  assert.equal(seen[0].p, '/api/discrepancies?status=accepted');
  assert.equal(seen[0].o.skipCache, true);
  assert.equal(rows.length, 3);
  assert.equal(rows[0].reporterName, 'X');
  assert.equal(rows[1].status, 'open');     // junk → safe defaults
});

test('loadReviewQueue drops an unknown status rather than forwarding it', async () => {
  const seen = [];
  await data.loadReviewQueue((p) => { seen.push(p); return []; }, 'bogus');
  assert.equal(seen[0], '/api/discrepancies');   // no ?status= when not an allowed enum
  assert.deepEqual(await data.loadReviewQueue(async () => 'not-an-array'), []);
});

test('buildResolve keeps only allowed status + a non-empty note', () => {
  assert.deepEqual(data.buildResolve({ status: 'accepted', resolution_note: ' done ' }), { status: 'accepted', resolution_note: 'done' });
  assert.deepEqual(data.buildResolve({ status: 'nope', resolution_note: '' }), {});   // bad status + blank note → empty patch
  assert.deepEqual(data.buildResolve(null), {});
});

test('resolveReport PUTs the clamped patch to the report endpoint', async () => {
  const seen = []; const ac = new AbortController();
  await data.resolveReport((p, o) => { seen.push({ p, o }); return { id: 'r1', status: 'rejected' }; },
    'r1', { status: 'rejected', resolution_note: 'duplicada' }, ac.signal);
  assert.equal(seen[0].p, '/api/discrepancies/r1');
  assert.equal(seen[0].o.method, 'PUT');
  assert.deepEqual(seen[0].o.body, { status: 'rejected', resolution_note: 'duplicada' });
  assert.equal(seen[0].o.signal, ac.signal);
});

test('resolveReport refuses a missing id or an empty patch', async () => {
  await assert.rejects(() => data.resolveReport(() => ({}), '', { status: 'accepted' }), /report id is required/i);
  await assert.rejects(() => data.resolveReport(() => ({}), 'r1', { status: 'bogus' }), /nothing to update/i);
});

test('reviewer adapters require an authenticated request service', async () => {
  await assert.rejects(() => data.loadReviewQueue(null, 'open'), /authenticated request service/i);
  await assert.rejects(() => data.resolveReport(null, 'r1', {}), /authenticated request service/i);
});
