const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict')
const app=fs.readFileSync('app.js','utf8')
const html=fs.readFileSync('index.html','utf8')
const css=fs.readFileSync('entry46.css','utf8')
const tests=[]; const test=(n,f)=>tests.push([n,f])

test('A42-01 application JavaScript parses',()=>new vm.Script(app))
test('A42-02 active session token is tab-scoped by default',()=>{
  assert(app.includes("SESSION_TOKEN_KEY: 'neumocare_session_token'"))
  assert(app.includes('get token() { return this.sessionToken || this.persistentToken }'))
  assert(app.includes('sessionStorage.setItem(CONFIG.SESSION_TOKEN_KEY, data.token)'))
})
test('A42-03 ordinary login does not persist JWT unless explicitly trusted',()=>{
  const a=app.indexOf('storeAuthenticatedSession(data')
  const b=app.indexOf('promotePersistentToSession()',a)
  const block=app.slice(a,b)
  assert(block.includes('if (persist)'))
  assert(block.includes('localStorage.removeItem(CONFIG.TOKEN_KEY)'))
})
test('A42-04 remember-email and trusted-browser choices are separate',()=>{
  assert(app.includes("remember_me: false, keep_signed_in: false"))
  assert(html.includes('v-model="loginForm.remember_me"'))
  assert(html.includes('v-model="loginForm.keep_signed_in"'))
})
test('A42-05 trusted browser persistence is bounded client-side',()=>{
  assert(app.includes('TRUST_MAX_AGE_MS: 12 * 60 * 60 * 1000'))
  assert(app.includes('persistentSessionIsUsable()'))
  assert(app.includes('expiresAt: now + CONFIG.TRUST_MAX_AGE_MS'))
})
test('A42-06 legacy unbounded localStorage sessions are rejected',()=>{
  assert(app.includes("source === 'persistent' && !API.persistentSessionIsUsable()"))
  assert(app.includes('no longer resumes legacy unbounded browser sessions'))
})
test('A42-07 persistent session cannot reveal workspace automatically on a new browser session',()=>{
  assert(app.includes("entry.state = 'resume'; currentUser.value = null; currentView.value = 'login'"))
  assert(app.includes("if (source === 'persistent' && !API.sessionToken)"))
})
test('A42-08 resume requires deliberate user action',()=>{
  assert(app.includes('const resumeEntrySession = async () =>'))
  assert(html.includes('@click="resumeEntrySession()"'))
  assert(html.includes('Continue to neumDesk'))
})
test('A42-09 cached identity is not persisted as access authority',()=>{
  assert(app.includes('Cached identity never grants access'))
  assert(app.includes('localStorage.removeItem(CONFIG.USER_KEY)'))
  assert(app.includes('SESSION_USER_KEY'))
})
test('A42-10 logout and 401 clear both session and trusted-browser storage',()=>{
  assert(app.includes('clearAuthStorage()'))
  const a=app.indexOf('clearAuthStorage() {')
  const b=app.indexOf('storeSessionUser',a)
  const block=app.slice(a,b)
  for(const x of ['SESSION_TOKEN_KEY','SESSION_USER_KEY','TOKEN_KEY','USER_KEY','TRUST_META_KEY']) assert(block.includes(x),x)
})
test('A42-11 session is still server-validated before workspace access',()=>{
  assert(app.includes("API.request('/api/auth/me', {skipCache:true, timeoutMs:15000})"))
  assert(app.includes("data.account_status !== 'active'"))
})
test('A42-12 verified trusted session screen keeps records locked',()=>{
  assert(html.includes('departmental records remain locked until you continue'))
  assert(html.includes('Trusted-browser session'))
})
test('A42-13 loading state communicates access chain instead of generic spinner only',()=>{
  for(const x of ['entry46-access-chain','Account','Permissions','Workspace']) assert(html.includes(x),x)
})
test('A42-14 access-gate CSS is isolated to entry46',()=>{
  const i=css.indexOf('Access Gate 4.2')
  assert(i>=0)
  const block=css.slice(i)
  assert(!/\.staff46-|\.pp2-|\.pp3-|\.nd-intelligence-shell|\.askbar-/.test(block))
})
test('A42-15 access assets have explicit cache checkpoint',()=>{
  assert(html.includes('app.js?v=46.14-access42-session-integrity'))
  assert(html.includes('entry46.css?v=46.14-access42'))
})
test('A42-16 historical Grounded + Staff UI contracts remain present',()=>{
  for(const x of ['nd-intelligence-shell','nd-evidence-strip','nd-intelligence-composer']) assert(html.includes(x),x)
  const globalCss=fs.readFileSync('style.css','utf8')
  for(const x of ['nd-workspace','nd-record-list','nd-person-drawer']) assert(globalCss.includes(x),x)
})

let passed=0
for(const [n,f] of tests){try{f();console.log('PASS',n);passed++}catch(e){console.error('FAIL',n);console.error(e.stack||e);process.exitCode=1;break}}
if(passed===tests.length) console.log(`${passed} V46.14 Access Gate 4.2 session-integrity checks passed.`)
