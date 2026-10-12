'use strict';
// Mi espacio · Phase 5 — subject-picker options + structured publications (pure; `check`).
const assert = require('node:assert/strict');
const { test } = require('node:test');
const data = require('../mi-espacio/mi-espacio-data.js');

test('normalizeActivity lifts structured publications from items', () => {
  const a = data.normalizeActivity({ publications: { available: true, items: [
    { id: 'p1', title: 'Paper A', byline: 'Marcos PJ, et al.', author_order: 3, corresponding: true },
    { id: null, title: '' }, null
  ] } });
  assert.equal(a.publications.available, true);
  assert.equal(a.publications.items.length, 1);           // blank/empty dropped
  assert.equal(a.publications.items[0].title, 'Paper A');
  assert.equal(a.publications.items[0].order, 3);
  assert.equal(a.publications.items[0].corresponding, true);
  assert.equal(a.counts.publications, 1);
  // defensive: no publications block → empty, available false, never throws
  const b = data.normalizeActivity({});
  assert.deepEqual(b.publications.items, []);
  assert.equal(b.counts.publications, 0);
});

test('loadLineOptions labels lines and tolerates {data} or array', async () => {
  const opts = await data.loadLineOptions(async () => ({ data: [
    { id: 'L2', line_number: 2, short_name: 'Vía aérea' },
    { id: 'L3', research_line_name: 'Sueño' },
    { id: '', short_name: 'skip-me' }
  ] }));
  assert.deepEqual(opts, [{ id: 'L2', label: 'L2 · Vía aérea' }, { id: 'L3', label: 'Sueño' }]);
  assert.deepEqual(await data.loadLineOptions(async () => 'nope'), []);
});

test('loadPublicationOptions maps title and filters empties', async () => {
  const seen = [];
  const opts = await data.loadPublicationOptions((p) => { seen.push(p); return [
    { id: 'n1', title: 'EPOC study' }, { id: 'n2', title: '' }
  ]; });
  assert.equal(seen[0], '/api/news?type=publication');
  assert.deepEqual(opts, [{ id: 'n1', label: 'EPOC study' }]);
});

test('picker adapters require an authenticated request service', async () => {
  await assert.rejects(() => data.loadLineOptions(null), /authenticated request service/i);
  await assert.rejects(() => data.loadPublicationOptions(null), /authenticated request service/i);
});
