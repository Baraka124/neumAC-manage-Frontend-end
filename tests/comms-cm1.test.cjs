'use strict';
// Communication CM-1: Feed (entradas briefed to the team) · Parte del día · Agenda · Pendientes · WhatsApp sharing.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'access.css'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`), html.indexOf('<!-- ============ SYSTEM SETTINGS VIEW ============ -->'));

test('four tabs in the Communication view; loads its overview on entry', () => {
  assert.match(app, /const COMMS_TABS=\[\{key:'feed',l:'Feed'\},\{key:'parte',l:'Parte del día'\},\{key:'agenda',l:'Agenda'\},\{key:'pendientes',l:'Pendientes'\}\]/);
  for (const t of ['feed', 'parte', 'agenda', 'pendientes']) assert.ok(view.includes(`v-if="comms.tab==='${t}'"`), t);
  assert.match(app, /if \(v === 'communications'\)\s*\{ commsOps\.loadAnnouncements\(\); commsOps\.loadOpsMetrics\(\); commsLoad\(\) \}/);
  assert.doesNotMatch(view, /briefingForm\.show = true/);                       // the dead "Edit & post briefing" rail is gone
});

test('entrada: from which service, what came in, category, who it concerns, follow-up; interconsulta logged once', () => {
  assert.match(view, /v-model="comms\.compose\.source_service"/);
  assert.match(view, /v-model="comms\.compose\.audience\.units"/);
  assert.match(view, /v-model="comms\.compose\.audience\.oncall_today"/);
  assert.match(view, /v-model="comms\.compose\.action\.text"/);
  assert.match(view, /Also log it in Interconsultas \(Ops Room\)/);
  assert.match(app, /if\(c\.category==='interconsulta'&&c\.log_interconsult\)\{body\.log_interconsult=true/);
  assert.match(view, /No names or record numbers\./);
  assert.match(view, /v-for="f in COMMS_FILTERS"/);
  assert.match(app, /\{key:'mine',l:'Para mí'\}/);
});

test('sharing: WhatsApp link + copy, link back into neumDesk, privacy reminder; deep links open the item', () => {
  assert.match(app, /const commsWa=text=>'https:\/\/wa\.me\/\?text='\+encodeURIComponent/);
  // The share sheet is global since UX-1 (posts, agenda, Parte and shared views use it).
  assert.match(html, /<a :href="comms\.share\.wa" target="_blank" rel="noopener"/);
  assert.match(html, /Check there is no patient data before sharing outside the hospital\./);
  assert.match(app, /const r=p\.get\('view'\)\|\|p\.get\('c'\)/);             // legacy ?c= links still open the item
});

test('Parte del día: editable message, sections to include, send posts it; never the absence reason', () => {
  assert.match(view, /v-model="comms\.bf\.notes"/);
  assert.match(view, /@change="commsBriefToggle\(s\[0\]\)"/);
  assert.match(app, /API\.request\('\/api\/comms\/brief\/send',\{method:'POST'/);
  assert.match(view, /Absence reasons are never shown\./);
  assert.doesNotMatch(view, /absence_reason/);
});

test('Agenda: meetings with ordered items, guests, materials, minutes, follow-ups; post to feed; print', () => {
  assert.match(view, /v-for="\(it,ii\) in comms\.mt\.form\.items"/);
  assert.match(view, /v-model="it\.presenter_name"/);
  assert.match(view, /v-model="comms\.mt\.form\.minutes"/);
  assert.match(view, /@click="commsMtAnnounce">Post to feed<\/button>/);
  assert.match(view, /@submit\.prevent="commsActionAdd\(\{meeting_id:comms\.mt\.open\.meeting\.id\}\)"/);
  assert.match(view, /type="datetime-local" v-model="comms\.mt\.form\.starts_at"/);
});

test('Pendientes: owner, due date, overdue first-class; done / cancel / reopen', () => {
  assert.match(app, /const COMMS_ACTION_STATE=\{overdue:'Overdue',due_today:'Due today'/);
  assert.match(view, /@click="commsActionSet\(a,'done'\)">Done<\/button>/);
  assert.match(view, /@click="commsActionSet\(a,'open'\)">Reopen<\/button>/);
  assert.match(css, /\.cm-actions-list li\[data-state="overdue"\]\{border-left:4px solid #c8442c\}/);
});

test('in-DOM template safety and contrast fix', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  assert.match(css, /html body #app \.cm-seg label\.active,html body #app \.opsr-seg label\.active\{color:#fff!important/);
  for (const fn of ['comms', 'commsLoad', 'commsPost', 'commsPlain', 'commsBriefSend', 'commsMtSave', 'commsActionSet', 'commsDayTitle'])
    assert.match(app, new RegExp('\\b' + fn + ', [^\\n]*opsRoom, OPS_QUESTIONS,'), fn + ' exposed');
});
