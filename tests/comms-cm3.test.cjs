'use strict';
// Communication CM-3: private messages — sent from Comunicación → Mensajes, read privately in Mi espacio.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('sender: Mensajes tab only for those who can post; default recipients = all clinicians; confirm before sending', () => {
  assert.match(app, /\{key:'mensajes',l:'Mensajes',post:true\}/);
  assert.match(html, /v-for="t in COMMS_TABS\.filter\(x=>!x\.post \|\| commsCanPost\)"/);
  assert.match(html, /Todos los clínicos<\/label>/);
  assert.match(app, /const audience=f\.mode==='clinicians'\?\{clinicians:true\}/);
  assert.match(app, /window\.confirm\('Send this private message\?/);
  assert.match(html, /\{\{ m\.recipient_count \}\} received · \{\{ m\.read_count \}\} opened/);   // counts only, never who
});

test('recipient: own copies in Mi espacio, unread first-class, opening marks read, archive / restore; badge in the sidebar', () => {
  assert.match(html, /<section v-if="currentView === 'mi_espacio' &amp;&amp; \(inbox\.list\.length \|\| inbox\.showArchived\)" class="nd-inbox"/);
  assert.match(app, /API\.request\('\/api\/me\/messages\/'\+encodeURIComponent\(m\.id\)\+'\/read'/);
  assert.match(html, /@click="inboxArchive\(m, !!m\.archived_at\)"/);
  assert.match(html, /<span v-if="inbox\.unread" class="nmsb-badge"/);
  assert.match(app, /watch\(\(\)=>currentView\.value,v=>\{if\(v==='mi_espacio'\)inboxLoad\(\)\}\)/);
});

test('template safety', () => {
  const seg = html.slice(html.indexOf('<!-- CM-3: my private messages'), html.indexOf('<mi-espacio-view'));
  assert.deepEqual(seg.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  for (const fn of ['msg', 'inbox', 'msgSend', 'inboxOpen', 'inboxArchive', 'inboxVisible'])
    assert.match(app, new RegExp('\\b' + fn + ', [^\\n]*opsRoom, OPS_QUESTIONS,'), fn);
});
