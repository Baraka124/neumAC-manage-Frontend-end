'use strict';
// Mi espacio · Phase 2 — the component template must compile (needs @vue/compiler-dom,
// so this runs in the CI `smoke` job where vue is installed). Guards against a
// hand-written template regression that the login-only smoke test would miss.
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const { compile } = require('@vue/compiler-dom');
const root = path.resolve(__dirname, '..');

const sandbox = {}; sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(root, 'mi-espacio/mi-espacio.js'), 'utf8'), sandbox);
const def = sandbox.NeumMiEspacio.createView({ Vue: {}, API: {} });
assert.equal(typeof def.template, 'string', 'mi-espacio-view must expose a template string');

const errors = [];
compile(def.template, { onError: e => errors.push(e.message) });
assert.deepEqual(errors, [], 'Mi espacio template compiles cleanly');
console.log('MI ESPACIO TEMPLATE: OK (compiles clean)');
