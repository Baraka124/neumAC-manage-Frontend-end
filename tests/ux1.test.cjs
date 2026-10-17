'use strict';
// UX-1: shareable focused views · quick log (chips) · steppers · shared components.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'access.css'), 'utf8');

test('shareable views: ?view= routes are whitelisted; only that view is shown; sign-in still required', () => {
  // Evaluate the real whitelist line from app.js.
  const line = app.split('\n').find(l => l.trim().startsWith('const ND_VIEW_RE=')); assert.ok(line, 'route whitelist');
  const re = new Function('ND_ID', 'return ' + line.trim().replace(/^const ND_VIEW_RE=/, ''))('[0-9a-f-]{36}');
  const id = '11111111-1111-4111-8111-111111111111';
  for (const ok of ['hoy', 'interconsultas', `unit:${id}`, `unit:${id}:activity`, `report:dept:${id}`, 'parte:2026-10-17', `meeting:${id}`, `post:${id}`, `informes:${id}`]) assert.ok(re.test(ok), ok);
  for (const bad of ['config', 'unit:abc', `unit:${id}:hack`, 'javascript:alert(1)', 'hoy;drop']) assert.ok(!re.test(bad), bad);
  assert.match(html, /<div v-else class="app-layout" :class="\{'nd-focus': ndFocus\.on\}">/);
  assert.match(css, /\.nd-focus \.sidebar,\.nd-focus \.top-navbar,\.nd-focus \.mobile-bottom-nav/);
  assert.match(html, /@click="ndExitFocus">Open full neumDesk<\/button>/);
  // Applied only once the workspace is ready (after sign-in and data load)
  assert.match(app, /watch\(\(\)=>entry\.state,s=>\{if\(s!=='ready'\)return;const r=ndReadRoute\(\)/);
});

test('share this view: link to exactly what is on screen (unit + tab, report, Parte, event)', () => {
  assert.match(app, /if\(s==='units'&&opsRoom\.unit\)return 'unit:'\+opsRoom\.unit\.id/);
  assert.match(app, /return 'report:'\+\(r\.scope==='department'\?'dept':r\.unitId\)\+':'\+r\.open\.id/);
  assert.match(app, /if\(t==='parte'\)return 'parte:'\+/);
  assert.equal((html.match(/class="nd-share-view"/g) || []).length, 2);
  assert.match(app, /u\.searchParams\.set\('view',route\)/);
});

test('quick log: chips for channel, service (most used first), priority / outcome, minutes; remembers choices', () => {
  assert.match(html, /<button v-for="c in QL_CHANNELS"/);
  assert.match(html, /<button v-for="sv in qlChips"/);
  assert.match(html, /<button v-for="m in QL_MINUTES"/);
  assert.match(app, /localStorage\.setItem\(ND_QL_KEY,JSON\.stringify\(\{channel:ql\.channel,priority:ql\.priority,outcome:ql\.outcome,minutes:ql\.minutes\}\)\)/);
  assert.match(app, /try\{return JSON\.parse\(localStorage\.getItem\(ND_QL_KEY\)\|\|'\{\}'\)\|\|\{\}\}catch\{return \{\}\}/);   // storage may be blocked
  assert.match(html, /@click="qlOpen\('phone'\)">\+ Call<\/button>/);
  assert.match(html, /Now, by you\. No patient names or record numbers\./);
});

test('steppers on every count input; never below zero; 40px+ targets', () => {
  assert.ok((html.match(/class="nd-step"/g) || []).length >= 4);
  assert.match(app, /const opsStep=\(obj,key,d\)=>\{const v=\(Number\(obj\[key\]\)\|\|0\)\+d;obj\[key\]=v<0\?0:v\}/);
  assert.match(css, /\.nd-step>button\{width:40px;min-height:40px/);
  assert.match(css, /\.nd-chip\{min-height:40px/);
});

test('template safety', () => {
  const body = html.slice(html.indexOf('<div id="app"'));
  const seg = body.slice(body.indexOf('<!-- UX-1: focus frame'), body.indexOf('<!-- ══ PNEUMO OPS ROOM'));
  assert.deepEqual(seg.match(/\{\{[^}]*<[^}]*\}\}/g) || [], []);
  for (const fn of ['ql', 'qlOpen', 'qlSave', 'qlChips', 'opsStep', 'ndFocus', 'ndExitFocus', 'ndShareHere', 'ndRouteHere'])
    assert.match(app, new RegExp('\\b' + fn + ', [^\\n]*opsRoom, OPS_QUESTIONS,'), fn);
});
