// Entry-state regression tests. Extracts shipped handlers; no live login or network.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
function section(a,b){return src.slice(src.indexOf(a),src.indexOf(b,src.indexOf(a)))}
const ref=value=>({value});
function harness(){
 const storage=new Map();
 const s={console,currentUser:ref(null),currentView:ref('login'),entry:{state:'signin',mode:'signin',message:''},loginForm:{email:'user@example.com',password:'example',remember_me:false},loginLoading:ref(false),loginError:ref(''),loginFieldErrors:{},showPassword:ref(false),CONFIG:{TOKEN_KEY:'token',USER_KEY:'user'},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},API:{token:'token',request:async()=>({id:'real',account_status:'active'}),login:async()=>({token:'token',user:{id:'real'}}),clearCache:()=>{}},maybeShowPreviewIntro:()=>{},showToast:()=>{},loadAllData:async()=>{},loadBrain:()=>{}};
 s.entryBusy={get value(){return s.loginLoading.value||['checking','opening'].includes(s.entry.state)}};
 vm.createContext(s);vm.runInContext(section('        const handleLogin = async','        const handleLogout =')+'\nthis.login=handleLogin;this.validate=validateEntrySession;this.other=useAnotherEntryAccount;',s);return s;
}
(async()=>{
 let n=0;const pass=t=>{n++;console.log('PASS '+t)};
 let s=harness();s.API.token=null;await s.validate();assert.equal(s.entry.state,'signin');assert.equal(s.currentUser.value,null);pass('no token opens sign-in');
 s=harness();let release;s.API.request=()=>new Promise(r=>release=r);const work=s.validate();assert.equal(s.entry.state,'checking');assert.equal(s.currentUser.value,null);release({id:'verified',account_status:'active'});await work;assert.equal(s.entry.state,'ready');assert.equal(s.currentUser.value.id,'verified');pass('identity hidden until verification');
 s=harness();s.API.request=async()=>{throw Error('offline')};await s.validate();assert.equal(s.entry.state,'unavailable');assert.equal(s.API.token,'token');assert.equal(s.currentUser.value,null);pass('network failure retains retryable session');
 s.API.request=async()=>({id:'real',account_status:'active'});await s.validate();assert.equal(s.entry.state,'ready');pass('retry opens verified workspace');
 s=harness();s.API.request=async()=>{s.API.token=null;throw Error('expired')};await s.validate();assert.equal(s.entry.state,'signin');assert.ok(s.loginError.value.includes('expired'));pass('expired session returns to sign-in');
 s=harness();s.API.request=async()=>({id:'real',account_status:'inactive'});await s.validate();assert.equal(s.currentUser.value,null);assert.notEqual(s.entry.state,'ready');pass('inactive account never opens workspace');
 s=harness();s.API.request=()=>new Promise(r=>release=r);const late=s.validate();s.other();release({id:'old',account_status:'active'});await late;assert.equal(s.currentUser.value,null);assert.equal(s.entry.state,'signin');pass('late validation ignored after account switch');
 s=harness();s.loginForm.email=' invalid ';let calls=0;s.API.login=async()=>{calls++};await s.login();assert.equal(calls,0);assert.ok(s.loginFieldErrors.email);pass('invalid email blocked locally');
 s=harness();s.loginForm.email=' USER@EXAMPLE.COM ';s.API.login=async(email)=>{calls++;assert.equal(email,'user@example.com');return new Promise(r=>release=r)};calls=0;const login=s.login();await s.login();assert.equal(calls,1);release({token:'token',user:{id:'real'}});await login;assert.equal(s.entry.state,'ready');assert.equal(s.loginForm.password,'');pass('duplicate submit prevented and password cleared');
 s=harness();s.API.login=async()=>({token:'token'});await s.login();assert.equal(s.currentUser.value,null);assert.equal(s.entry.state,'signin');assert.ok(s.loginError.value.includes('incomplete'));pass('malformed login response rejected');
 s=harness();s.loginForm.remember_me=true;await s.login();assert.equal(s.localStorage.getItem('neumdesk_entry_email'),'user@example.com');pass('remember email stores only email preference');
 console.log(n+' entry tests passed. Live backend and browser testing still required.');
})().catch(e=>{console.error(e);process.exitCode=1});
