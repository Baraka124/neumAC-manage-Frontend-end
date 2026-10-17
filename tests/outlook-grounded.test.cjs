'use strict';
// Outlook (Próximas semanas), Coming up on Hoy, report narrative, Grounded × Ops Room.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// Evaluate the real route table and the real matcher.
const a = app.indexOf('const ASKBAR_ROUTES = ['), b = app.indexOf('\n      ]', a);
const ROUTES = new Function('return ' + app.slice(a + 'const ASKBAR_ROUTES = '.length, b + 8))();
const match = q => { q = q.toLowerCase(); let best = null; for (const r of ROUTES) { if (r.anti && r.anti.some(x => x.test(q))) continue; if (r.require && !r.require.some(x => x.test(q))) continue; const h = r.patterns.filter(x => x.test(q)).length; if (!h) continue; const s = r.priority + (h - 1) * 2; if (!best || s > best.p) best = { i: r.intent, p: s }; } return best && best.i; };

test('Grounded routes the new questions to the department snapshot', () => {
  const cases = {
    'Which units need attention?': 'ops_units_status', 'how are the units doing': 'ops_units_status', '¿cómo están las unidades?': 'ops_units_status',
    'what is coming in the next weeks': 'ops_outlook', 'outlook for the department': 'ops_outlook', 'próximas semanas': 'ops_outlook',
    'how are interconsultas going': 'ops_ic_status', 'any interconsults overdue?': 'ops_ic_status',
    'how did we do last month?': 'ops_month_review', 'monthly summary': 'ops_month_review', '¿cómo nos ha ido este mes?': 'ops_month_review',
    'parte del día': 'ops_parte', 'draft the daily brief': 'ops_parte' };
  for (const [q, want] of Object.entries(cases)) assert.equal(match(q), want, q);
  // Existing questions keep their routes
  assert.equal(match("what's happening today?"), 'today_snapshot');
  assert.notEqual(match('which units will be empty next month'), 'ops_outlook');
});

test('answers come only from the snapshot, with sources; actions open the exact section', () => {
  assert.match(app, /if \(\['ops_units_status','ops_ic_status','ops_outlook','ops_month_review','ops_parte'\]\.includes\(intent\)\) \{\s*const g = opsGround\.data/);
  assert.match(app, /sources: src/);
  assert.match(app, /if \(action\.route\) \{ askBarLog\('action', \{ label: action\.label, route: action\.route \}\); closeAskBar\(\); myDayGo\(action\.route\); return \}/);
  assert.match(app, /if \(hasPermission\('training_units','read'\)\) opsGroundLoad\(\)/);
  assert.match(app, /API\.request\('\/api\/ops\/grounded',\{skipCache:true\}\)/);
});

test('Próximas semanas: section, unit filter, 4/8/12 weeks, trends against set targets; Coming up on Hoy; shareable', () => {
  assert.match(html, /@click="opsSection\('outlook'\)">Próximas semanas<\/button>/);
  assert.match(html, /<section v-if="opsRoom\.section==='outlook'" class="nd-outlook"/);
  assert.match(html, /v-model="outlook\.unit"/);
  assert.match(html, /Flagged only against targets the department set\./);
  assert.match(html, /COMING UP · NEXT 2 WEEKS/);
  assert.match(app, /new RegExp\('\^\(mensajes\|proximas\|hoy\|/);
});

test('report narrative shown at the top of every report; template safety', () => {
  assert.match(html, /<div v-if="opsRoom\.rep\.open\.narrative" class="nd-narrative">/);
  assert.match(html, /Causes are not guessed\./);
  const seg = html.slice(html.indexOf('<!-- Próximas semanas'), html.indexOf('<!-- Units -->'));
  assert.deepEqual(seg.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
});
