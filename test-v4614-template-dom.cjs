const fs = require('fs');
const assert = require('assert');
const html = fs.readFileSync('index.html', 'utf8');

let checks = 0;
function ok(value, msg) { assert.ok(value, msg); checks++; }
function eq(a,b,msg){ assert.strictEqual(a,b,msg); checks++; }

// In-DOM Vue templates are parsed by the browser before Vue compiles them.
// A literal '<' inside an HTML attribute or interpolation expression can be
// interpreted as markup and destroy v-if/v-else adjacency.
const rawLessAttr = /[:@\w.-]+="[^"]*<[^"]*"/g;
const rawLessMoustache = /\{\{[^}]*<[^}]*\}\}/g;

eq((html.match(rawLessAttr) || []).length, 0,
  'No raw < comparison may remain inside quoted template attributes');
eq((html.match(rawLessMoustache) || []).length, 0,
  'No raw < comparison may remain inside interpolation expressions');

ok(html.includes("new Date(cert.expiry_date)&lt;new Date()"),
  'Certificate expiry class comparison is browser-safe');
ok(html.includes("new Date(cert.expiry_date) &lt; new Date() ? 'Expired' : 'Expires'"),
  'Certificate expiry label comparison is browser-safe');

// Phase 3.1 profile integrity details retained while repairing template safety.
eq((html.match(/External contact email<\/span>/g) || []).length, 1,
  'External contact email row is not duplicated');
eq((html.match(/External contact phone<\/span>/g) || []).length, 1,
  'External contact phone row is not duplicated');

ok(html.includes('v-else class="pp2-empty">No certificates on record.</div>'),
  'Certificate empty-state branch remains present');

console.log(`V46.14 DOM-template safety: ${checks} checks passed`);
