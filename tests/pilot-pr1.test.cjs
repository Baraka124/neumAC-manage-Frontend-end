'use strict';
// PR-1 · Estado del sistema + browser error reporting.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('every on-screen error is also reported, capped, without auth headers', () => {
  assert.match(app, /function showOnScreenError\(title, err, extra\) \{\n\s+__ndReportError\(title, err, extra\)/);
  const r = app.slice(app.indexOf('function __ndReportError'), app.indexOf('function showOnScreenError'));
  assert.match(r, /__ndReported >= 10/); assert.match(r, /\/api\/public\/client-errors/); assert.match(r, /keepalive: true/);
  assert.doesNotMatch(r, /Authorization/);
});

test('status panel is first in Configuración (admin only) and loads with it', () => {
  const cfg = html.indexOf('aria-label="Configuración"'), sys = html.indexOf('Estado del sistema'), ic = html.indexOf('Interconsulta response targets');
  assert.ok(cfg > 0 && sys > cfg && sys < ic);
  assert.match(app, /if\(key==='config'\)\{opsLoadCat\(\);impLoad\(\);sysLoad\(\)\}/);
  for (const u of ['/api/admin/status', '/api/admin/errors?days=7', '/api/admin/backup', '/api/admin/backups/link?path=']) assert.ok(app.includes(u), u);
});

test('bindings exposed; no < inside interpolations', () => {
  const ret = app.slice(app.indexOf('sys, SYS_LEVEL,'), app.indexOf('opsRoom, OPS_QUESTIONS,'));
  for (const n of ['sysLoad', 'sysBackup', 'sysDownload', 'sysRunJob', 'sysJobs', 'sysKb']) assert.ok(ret.includes(n + ','), n);
  const a = html.indexOf('PR-1 · Estado del sistema'), b = html.indexOf('Interconsulta response targets');
  for (const m of html.slice(a, b).matchAll(/\{\{([\s\S]*?)\}\}/g)) assert.ok(!m[1].includes('<'), m[1]);
});
