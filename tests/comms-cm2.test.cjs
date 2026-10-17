'use strict';
// Communication CM-2: events in a month calendar, banner / flyer, internal or public.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const view = html.slice(html.indexOf(`<div v-if="currentView === 'communications'" class="ops-view">`), html.indexOf('<!-- ============ SYSTEM SETTINGS VIEW ============ -->'));

test('Agenda: calendar (Monday first) or list; month navigation; events placed on their local day', () => {
  assert.match(app, /const COMMS_WEEKDAYS=\['L','M','X','J','V','S','D'\]/);
  assert.match(view, /<div v-for="\(wk,wi\) in commsCalGrid" :key="wi" class="cm-cal-week" role="row">/);
  assert.match(view, /@click="commsCalShift\(-1\)"/); assert.match(view, /@click="commsCalShift\(1\)"/);
  assert.match(app, /const commsLocalDay=ts=>\{const d=new Date\(ts\)/);
  assert.match(app, /if\(key==='agenda'&&comms\.mt\.view==='calendar'\)commsCalLoad\(\)/);
});

test('events: internal or public with a description; public shows only safe fields (stated in the form)', () => {
  assert.match(view, /<select v-model="comms\.mt\.form\.visibility" class="form-select"><option value="internal">/);
  assert.match(view, /v-model="comms\.mt\.form\.description"/);
  assert.match(view, /never the minutes, follow-ups or who it concerns/);
  assert.match(app, /visibility:f\.visibility,description:f\.description\|\|null/);
});

test('banner and flyer: upload as multipart, type hints, remove; banner shown on the event and in the calendar', () => {
  assert.match(app, /'\/files\/'\+kind,\{method:'POST',body:fd,raw:true\}/);
  assert.match(view, /accept="image\/jpeg,image\/png,image\/webp"/);
  assert.match(view, /accept="application\/pdf,image\/jpeg,image\/png,image\/webp"/);
  assert.match(view, /<img v-if="comms\.mt\.open\.meeting\.banner_url" :src="comms\.mt\.open\.meeting\.banner_url" :alt=/);
  assert.match(view, /<img v-if="ev\.banner_url" :src="ev\.banner_url" alt="" class="cm-cal-thumb" loading="lazy">/);
  assert.match(view, /@click="commsMtFileRemove\('flyer'\)"/);
});

test('template safety', () => {
  assert.deepEqual(view.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  for (const fn of ['commsCalGrid', 'commsCalShift', 'commsMtFile', 'commsMtFileRemove', 'commsAgendaView', 'COMMS_WEEKDAYS'])
    assert.match(app, new RegExp('\\b' + fn + ', [^\\n]*opsRoom, OPS_QUESTIONS,'), fn);
});
