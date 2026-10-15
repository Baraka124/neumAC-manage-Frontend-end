'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),js=fs.readFileSync(path.join(root,'mi-espacio/mi-espacio.js'),'utf8'),css=fs.readFileSync(path.join(root,'mi-espacio/mi-espacio.css'),'utf8');
test('44B: a verified featured duty precedes two compact dated records',()=>{
 assert.match(js,/upcomingGuardias\[0\]\.date/);
 assert.match(js,/class="me-v8-upnext me-v9-feature me-v44b-next-duty"/);
 assert.match(js,/listLimit\('guardias',upcomingGuardias\.length\)/);
 assert.match(js,/upcomingGuardias\.slice\(1,/);
 assert.match(js,/datetime="upcomingGuardias\[0\]\.date"/);
 assert.match(js,/dutyDateParts\(upcomingGuardias\[0\]\.date\)\.fullDate/);
});
test('44B: three visible duties by default; lists reveal five more independently',()=>{
 assert.match(js,/guardias:3,studies:2,projects:2,publications:3/);
 assert.match(js,/function guardiasControlText\(total\)/);
 assert.match(js,/guardiasControlText\(upcomingGuardias\.length\)/);
 assert.match(js,/stepLargeList\('guardias',upcomingGuardias\.length\)/);
 assert.match(js,/:aria-expanded="state\.operationsOpen\.guardias"/);
 assert.match(js,/aria-controls="me-v28c-guardias"/);
});
test('44B: typography, data precision and breakpoints stay within Mi Espacio',()=>{
 assert.match(css,/\.me-v44b-next-duty/);
 assert.match(css,/\.me-v44b-guardias li/);
 assert.match(css,/@media\(max-width:1000px\)/);
 assert.match(css,/@media\(max-width:480px\)/);
 assert.match(js,/aria-label="fmtDutyDate\(g\.date\)"/);
 assert.match(js,/dutyCompactShift\(g\.shift\)/);
 assert.doesNotMatch(js,/upcomingGuardias\[0\]\.date\s*===\s*localToday\s*\?\s*'EN GUARDIA'/);
});
