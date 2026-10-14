'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');

test('public-only asset parity reads CSS and JS query keys', async () => {
  const { findAssets, compareVersions } = await import('../scripts/mi-espacio-deployment-parity.mjs');
  const local = '<link rel="stylesheet" href="mi-espacio/mi-espacio.css?v=20261014-phase30-editorial">' +
    '<script src="mi-espacio/mi-espacio.js?v=20261014-phase30-editorial"></script>';
  assert.equal(findAssets(local).size, 2);
  assert.deepEqual(compareVersions(local, local).map(x=>x.match), [true,true]);
  const stale = local.replace('mi-espacio.js?v=20261014-phase30-editorial','mi-espacio.js?v=old');
  assert.deepEqual(compareVersions(local, stale).map(x=>x.match), [true,false]);
});

test('does not include unrelated credentials or API URLs', async () => {
  const { findAssets } = await import('../scripts/mi-espacio-deployment-parity.mjs');
  const html = '<a href="/api/me/context?token=secret">link</a><script src="/mi-espacio/mi-espacio.js?v=phase30"></script>';
  const assets = findAssets(html);
  assert.equal(assets.size,1);
  assert.equal(assets.get('mi-espacio/mi-espacio.js').version,'phase30');
  assert.equal([...assets.values()].some(x=>JSON.stringify(x).includes('secret')),false);
});

test('missing assets are not incorrectly considered matched', async () => {
  const { compareVersions } = await import('../scripts/mi-espacio-deployment-parity.mjs');
  assert.ok(compareVersions('', '').every(x=>x.match===false));
});
