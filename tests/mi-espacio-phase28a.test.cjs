'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8'),css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
test('profile unfolds inside identity with semantic chevron, not detached footer',()=>{
 assert.match(src,/me-v28-profile-toggle/);assert.match(src,/:aria-expanded="profileActive"/);
 assert.match(src,/aria-controls="me-v28-profile-panel"/);
 assert.match(src,/id="me-v28-profile-panel"/);
 assert.match(src,/me-v28-inline-profile/);
 assert.doesNotMatch(src,/class="me-v22-identity-footer"/);
});
test('profile save and protected discard preserved; overview hidden while profile active',()=>{
 for(const s of ['profileDirty.value','validateProfileDraft','discardProfile','profileConfirm','loadProfile','profileBaseline'])assert.ok(src.includes(s),s);
 assert.match(src,/<template v-if="linked && !isContextWorkspace && !profileActive">/);
 assert.match(css,/grid-template-columns:auto minmax\(0,1fr\) auto/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});