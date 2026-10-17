'use strict';
// Notifications NT-1 (frontend): my email preferences in Mi espacio; admin status + test; email links open Mensajes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('Mi espacio: email preferences per kind, saved immediately, rolled back on error; test mode stated', () => {
  assert.match(html, /<details v-if="currentView === 'mi_espacio' &amp;&amp; emailPrefs\.loaded" class="nd-inbox nd-emailprefs">/);
  assert.match(html, /@change="emailPrefSet\(k,\$event\.target\.checked\)"/);
  assert.match(app, /catch\(e\)\{k\.on=prev;showToast\('Could not save'/);
  assert.match(html, /neumDesk email is in test mode: nothing reaches you yet\./);
});
test('admins: email status and a test email from Comunicación → Mensajes', () => {
  assert.match(html, /<div v-if="opsIsAdmin &amp;&amp; emailAdmin\.status" class="cm-note nd-email-admin">/);
  assert.match(app, /API\.request\('\/api\/admin\/email\/test',\{method:'POST',body:\{\}\}\)/);
});
test('links in message emails (?view=mensajes) open Mi espacio', () => {
  assert.match(app, /new RegExp\('\^\(mensajes\|hoy\|/);
  assert.match(app, /if\(k==='mensajes'\)\{ndFocus\.on=false;await switchView\('mi_espacio'\);inboxLoad\(\);return\}/);
});
