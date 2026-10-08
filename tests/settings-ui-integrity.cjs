// Settings regression gate: inspect the real component and compile its Vue template.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { compile } = require('@vue/compiler-dom');
const ROOT = path.join(__dirname, '..');
const component = require(path.join(ROOT, 'access.js')).createCenter({ Vue: {}, API: {} });
assert.equal(typeof component.template, 'string', 'Access-center template is exported');
const errors = [];
compile(component.template, { onError: e => errors.push(e.message) });
assert.deepEqual(errors, [], 'The Settings Vue template compiles');
for (const needle of [
  'ac-team-directory', 'ac-team-person', 'choosePerson(person)',
  'ac-person-heading', 'ac-identity-panel', 'ac-account-panels',
  'ac-login-section', 'ac-role-panel', 'ac-permissions',
  'ac-activity-panel', 'state.events.slice(0,4)',
  'setOverride', 'savePills', 'replacePassword', 'lifecycle'
]) {
  assert.ok(component.template.includes(needle) || fs.readFileSync(path.join(ROOT, 'access.js'), 'utf8').includes(needle), 'Access functionality/layout is present: ' + needle);
}
const css = fs.readFileSync(path.join(ROOT, 'access.css'), 'utf8');
for (const needle of ['ac-team-workspace', 'ac-account-panels', 'ac-activity-list', '@media(max-width:900px)', '@media(max-width:640px)'])
  assert.ok(css.includes(needle), 'Responsive Settings style present: ' + needle);
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert.match(index, /access\.js\?v=20261009-settings-overview-1/);
assert.match(index, /access\.css\?v=20261009-settings-overview-1/);
console.log('SETTINGS UI INTEGRITY: OK (Vue template, existing actions, responsive composition, fresh asset keys)');
