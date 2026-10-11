'use strict';
// Mi espacio · Phase 2 — the personal-activity adapter contract.
// Pure (no browser, no Vue); runs in the CI `check` job like phase 1.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const data = require('../mi-espacio/mi-espacio-data.js');

test('normalizeActivity shapes agenda + research from the resolver payload', () => {
  const a = data.normalizeActivity({
    agenda: {
      guardias: [{ id: 'g1', date: '2026-10-14', shift: '24h', role: 'primary' }, { role: 'backup' }],
      rotations: [{ id: 'r1', unit: 'UCI', start: '2026-10-01', end: '2026-10-30', role: 'resident' }],
      absences: [{ id: 'a1', type: 'Vacaciones', start: '2026-12-01', end: '2026-12-10', status: 'pending' }]
    },
    research: {
      lines: [{ id: 'l1', line_number: 2, name: 'Vía aérea', role: 'coordinator' }],
      studies: [{ id: 's1', title: 'X', protocol_id: 'P1', status: 'active', role: 'PI' }],
      projects: [{ id: 'p1', title: 'Y', stage: 'pilot', role: 'lead' }]
    },
    publications: { available: false, note: 'pending' }
  });
  assert.equal(a.counts.guardias, 1);           // the entry with no date is dropped
  assert.equal(a.agenda.guardias[0].role, 'primary');
  assert.equal(a.agenda.rotations[0].unit, 'UCI');
  assert.equal(a.research.lines[0].number, 2);
  assert.equal(a.research.studies[0].role, 'PI');
  assert.equal(a.research.projects[0].stage, 'pilot');
  assert.equal(a.publications.available, false);
});

test('normalizeActivity never throws on garbage and returns an empty shape', () => {
  for (const junk of [null, undefined, 'x', 42, { agenda: 'nope' }, { research: 5 }]) {
    const a = data.normalizeActivity(junk);
    assert.equal(a.counts.guardias, 0);
    assert.deepEqual(a.agenda.rotations, []);
    assert.deepEqual(a.research.studies, []);
    assert.equal(a.publications.available, false);
  }
});

test('loadActivity calls the resolver with cache bypass and an abort signal', async () => {
  const seen = []; const ac = new AbortController();
  await data.loadActivity((p, o) => { seen.push({ p, o }); return {}; }, ac.signal);
  assert.equal(seen[0].p, '/api/me/context');
  assert.equal(seen[0].o.skipCache, true);
  assert.equal(seen[0].o.signal, ac.signal);
});

test('loadActivity requires an authenticated request service', async () => {
  await assert.rejects(() => data.loadActivity(null), /authenticated request service/i);
});
