'use strict';
const assert=require('node:assert/strict');
const {test}=require('node:test');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
test('authenticated clinician can open Mi espacio and Overview without module-specific privileges',()=>{
 const context={};context.window=context;vm.runInNewContext(fs.readFileSync(path.join(root,'access.js'),'utf8'),context);
 const policy=context.NeumAccess;
 const access={decisions:{},modules:{},legacy:{}};
 assert.equal(policy.canOpenView(access,'mi_espacio'),true);
 assert.equal(policy.canOpenView(access,'dashboard'),true);
 assert.equal(policy.canOpenView(access,'research_hub'),false);
 assert.equal(policy.canOpenView(access,'system_settings'),false);
 assert.equal(policy.canOpenView(null,'mi_espacio'),false);
});
test('access policy script version reflects personal-space rollout',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const match=html.match(/<script src="access\.js\?v=([^"]+)"><\/script>/);
 assert.ok(match,'access.js needs explicit cache version');
 assert.match(match[1],/^20\d{6}-/,'access.js cache version should be a dated, bumped token');
 assert.match(html,/currentView === 'mi_espacio'/);
});
