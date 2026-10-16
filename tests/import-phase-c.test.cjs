'use strict';
// Import Phase C — cross-checks wired into both import previews.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('both checks call the whole-import review after the per-row dry run', () => {
  assert.match(app, /importReview\('rotations',recs\.map/);
  assert.match(app, /importReview\('oncall',shifts\.map/);
  assert.match(app, /\/api\/imports\/review/);
});

test('verdict: blocked comes only from the dry run; review findings give ⚠ but never block', () => {
  const line = app.split('\n').find(l => l.includes('const importVerdict='));
  const importVerdict = eval('(' + line.replace(/^\s*const importVerdict=/, '') + ')');
  assert.equal(importVerdict(null, []), null);
  assert.equal(importVerdict({ status: 'needs_attention' }, []), 'blocked');
  assert.equal(importVerdict({ status: 'ready' }, [{ severity: 'info' }]), 'ready');
  assert.equal(importVerdict({ status: 'ready' }, [{ severity: 'review' }]), 'review');
  // apply still gated only by the dry run (review rows remain committable)
  assert.match(app, /rotationImportSelectedKeys\.value\.every\(r=>rotationImport\.checkResults\[r\.key\]\?\.status==='ready'\)/);
});

test('impact summaries and per-row findings are rendered; review failure is stated, not hidden', () => {
  assert.equal((html.match(/class="import-impact"/g) || []).length, 2);
  assert.match(html, /day\(s\) with no guardia in this period/);
  assert.match(html, /pair\(s\) of rows in this file overlap each other/);
  assert.match(html, /Cross-checks unavailable/);
  assert.match(html, /class="import-findings"/);
});

test('a changed selection clears the previous review', () => {
  const w = app.split('\n').find(l => l.includes('watch(oncallSyncCheckKey,'));
  assert.ok(w && w.includes("oncallSync.review={rows:{},summary:null,error:''}"));
});
