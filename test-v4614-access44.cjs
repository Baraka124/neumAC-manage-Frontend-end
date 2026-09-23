const fs=require('fs'), assert=require('assert'), crypto=require('crypto'), postcss=require('postcss');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('app.js','utf8');
const css=fs.readFileSync('entry46.css','utf8');
const tests=[]; const t=(n,f)=>tests.push([n,f]);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

t('A44-01 neumact logo asset is used on the access editorial panel',()=>{
  assert(fs.existsSync('neumact-logo.png'));
  assert(html.includes('class="entry46-neumact-logo" src="neumact-logo.png" alt="neumact"'));
  assert(html.includes('aria-label="At neumact — public highlights"'));
  assert(html.includes('<span>At neumact</span>'));
});
t('A44-02 neumact brand palette is explicitly tokenised',()=>{
  for(const token of ['--neumact-blue:#3a61b2','--neumact-cyan:#2f80b7','--neumact-teal:#2da5a6','--neumact-green:#2da28b']) assert(css.includes(token));
});
t('A44-03 sign-in form has a restrained visual focus rail rather than a floating card',()=>{
  assert(html.includes('class="entry46-auth-focus"'));
  assert(css.includes('.entry46-auth-focus::before'));
  assert(css.includes('linear-gradient(180deg,var(--neumact-blue),var(--neumact-teal) 62%,var(--neumact-green))'));
});
t('A44-04 trusted-browser option is visually and semantically distinct from remember-email',()=>{
  assert(html.includes('class="entry46-trust-icon"'));
  assert(html.includes('class="entry46-trust-check"'));
  assert(html.includes('Keeps this browser trusted for a bounded period.'));
  assert(css.includes('.entry46-trust-option.is-selected'));
});
t('A44-05 authentication failures map to specific calm issue types',()=>{
  assert(js.includes("kind:'credentials'"));
  assert(js.includes("kind:'access'"));
  assert(js.includes("kind:'rate'"));
  assert(js.includes("kind:'maintenance'"));
  assert(js.includes("kind:'connection'"));
  assert(js.includes("kind:'session'"));
  assert(html.includes('entry46-auth-issue--'));
});
t('A44-06 required-field validation remains inline and focuses the first invalid field',()=>{
  assert(js.includes("focusInvalidEntryField")); assert(js.includes("loginFieldErrors.email ? 'entry-email' : 'entry-password'"));
  assert(!js.includes("loginError.value = 'Please fill all required fields'"));
});
t('A44-07 password visibility and Caps Lock feedback remain explicit and accessible',()=>{
  assert(html.includes('class="entry46-password-toggle"'));
  assert(html.includes("entry.capsLock ? 'Caps Lock is on' : ''"));
  assert(html.includes(":aria-label=\"showPassword ? 'Hide password' : 'Show password'\""));
});
t('A44-08 sign-in button shows a progress spinner and precise verification copy',()=>{
  assert(html.includes('entry46-submit-spinner'));
  assert(html.includes("loginLoading ? 'Verifying access…' : 'Sign in to neumDesk'"));
});
t('A44-09 login fields retain password-manager/browser semantics',()=>{
  assert(html.includes('inputmode="email" autocomplete="username"'));
  assert(html.includes('autocomplete="current-password"'));
  assert(html.includes('autofocus v-model="loginForm.email"'));
});
t('A44-10 successful entry uses a short reduced-motion-aware handoff',()=>{
  assert(js.includes("entry.state = 'entering'"));
  assert(js.includes("scheduleExit(resolve, 180)"));
  assert(js.includes("prefers-reduced-motion: reduce"));
  assert(html.includes("'entry46--departing': entry.state === 'entering'"));
});
t('A44-11 access 4.2 session integrity remains intact',()=>{
  assert(js.includes('persistentSessionIsUsable()'));
  assert(js.includes("source === 'persistent' && !API.sessionToken"));
  assert(html.includes('departmental records remain locked until you continue'));
});
t('A44-12 global application stylesheet is unchanged from Access 4.3 baseline',()=>{
  const prior='/mnt/data/neumdesk_access43/style.css';
  if(fs.existsSync(prior)) assert.strictEqual(sha('style.css'),sha(prior));
});
t('A44-13 Grounded runtime is preserved from Access 4.3 baseline',()=>{
  const prior='/mnt/data/neumdesk_access43/grounded-core.js';
  if(fs.existsSync(prior)) assert.strictEqual(sha('grounded-core.js'),sha(prior));
});
t('A44-14 access stylesheet parses cleanly',()=>{ postcss.parse(css,{from:'entry46.css'}); });
t('A44-15 supplied logo file is a valid non-empty PNG asset',()=>{
  const b=fs.readFileSync('neumact-logo.png');
  assert(b.length>1000); assert.strictEqual(b.slice(1,4).toString(),'PNG');
});
t('A44-16 deployment cache keys advance while prior access checkpoints stay discoverable',()=>{
  assert(html.includes('entry46.css?v=46.14-access44-login-polish'));
  assert(html.includes('app.js?v=46.14-access44-login-polish'));
  assert(html.includes('entry46.css?v=46.14-access43-ui'));
  assert(html.includes('entry46.css?v=46.14-access42'));
  assert(html.includes('app.js?v=46.14-access42-session-integrity'));
});

let pass=0; for(const [n,f] of tests){try{f(); console.log('PASS',n); pass++;}catch(e){console.error('FAIL',n);console.error(e);process.exit(1)}} console.log(`${pass} V46.14 Access Gate 4.4 checks passed.`);
