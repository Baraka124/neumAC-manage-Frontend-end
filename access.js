/* NeumDesk Access & Identity. Stable runtime filename. */
(function(root){
'use strict';
const allowed=(access,key,write=false)=>Object.values(access?.decisions?.[key]||{}).some(d=>write?d.decision==='ALLOW':d.decision==='ALLOW'||d.decision==='ALLOW_LIMITED');
const hasPermission=(access,module,action='read')=>{
  if(!access) return false;
  const mapping=access.modules?.[module];
  if(mapping) {
    const key=mapping[action] || (action==='write'?mapping.update:undefined);
    return !!key && allowed(access,key,action!=='read');
  }
  const legacy=access.legacy?.[module];
  return action==='read'?legacy?.read===true:legacy?.write===true;
};
function canRecord(access,key,records) {
 if(!access) return false;
 return records.length>0 && records.every(record=>{
   const scopes=['all'];
   if(record?.id && record.id===access.actor?.staff_id) scopes.push('own');
   if(record?.department_id && record.department_id===access.actor?.department_id) scopes.push('department');
   const ds=scopes.map(scope=>access.decisions?.[key]?.[scope]).filter(Boolean);
   if(ds.some(d=>d.source==='user_override_deny')) return false;
   return ds.some(d=>d.decision==='ALLOW');
 });
}
function createSelfProfile({Vue,API}) {return {
 setup(){
  const s=Vue.reactive({open:false,id:null,email:'',mobile:'',bio:'',busy:false,error:''});
  const open=e=>{Object.assign(s,{open:true,id:e.detail.id,email:e.detail.professional_email||'',mobile:e.detail.mobile_phone||'',bio:e.detail.public_bio||'',error:''})};
  Vue.onMounted(()=>window.addEventListener('neumact:edit-own-profile',open));
  Vue.onUnmounted(()=>window.removeEventListener('neumact:edit-own-profile',open));
  async function save(){s.busy=true;s.error='';try{await API.request('/api/medical-staff/'+s.id,{method:'PUT',body:{professional_email:s.email,mobile_phone:s.mobile,public_bio:s.bio}});API.clearCache();window.location.reload()}catch(e){s.error=e.message}finally{s.busy=false}}
  return {s,save};
 },template:`<div v-if="s.open" class="ac-setup"><section class="ac-setup-card" role="dialog" aria-modal="true" aria-labelledby="own-title"><h2 id="own-title">Edit my contact details</h2><p v-if="s.error" role="alert">{{s.error}}</p><form @submit.prevent="save"><label>Professional email<input type="email" v-model="s.email"></label><label>Mobile phone<input maxlength="40" v-model="s.mobile"></label><label>Biography<textarea maxlength="2000" v-model="s.bio"></textarea></label><div class="ac-actions"><button class="btn btn-primary" :disabled="s.busy">Save changes</button><button type="button" class="btn btn-secondary" :disabled="s.busy" @click="s.open=false">Cancel</button></div></form></section></div>`
};}
function createCenter({Vue,API}) {
return {
  props:{active:{type:Boolean,default:true},access:Object,currentId:String,staff:{type:Array,default:()=>[]},departments:{type:Array,default:()=>[]}},
  emits:['test-user'],
  setup(props,{emit}) {
    const {ref,reactive,computed,watch}=Vue;
    const state=reactive({loaded:false,loading:false,busy:false,error:'',notice:'',users:[],query:'',status:'',role:'',selected:null,snapshot:null,events:[],catalog:[],invites:false,devEnabled:false,passwordStatus:null,testEnabled:false,roster:[],tab:'team',teamQuery:'',teamStatus:'',teamDepartment:'',focusDomain:'staff',staffQuery:'',staffId:'',mode:'invitation',temporaryPassword:'',detailLoading:false});
    const draft=reactive({user_role:'clinician',medical_staff_id:'',department_id:'',job_title:''});
    const exception=reactive({permission_key:'',effect:'deny',scope:'department',visibility:'summary',reason:'',expires_at:''});
    const invitation=reactive({medical_staff_id:'',email:'',user_role:'clinician',department_id:'',reason:''});
    const reason=ref(''),scope=ref('department');
    const pending=reactive({}), credentials=reactive({email:'',password:'',visible:false,copied:false});
    const revealPassword=ref(false);
    const domainNames={staff:'Staff directory',rotations:'Rotations',leave:'Leave & absence',oncall:'On-call',units:'Clinical units',research:'Research',publications:'Publications',grounded:'Grounded'};
    const simpleCatalog=computed(()=>state.catalog.filter(p=>domainNames[p.domain]));
    const accessGroups=computed(()=>Object.entries(domainNames).map(([domain,name])=>({domain,name,permissions:simpleCatalog.value.filter(p=>p.domain===domain)})).filter(g=>g.permissions.length));
    const focusedGroup=computed(()=>accessGroups.value.find(g=>g.domain===state.focusDomain)||accessGroups.value[0]);
    const permissionBundles=group=>[
      {name:'View',test:k=>k.endsWith('.view')||k==='grounded.ask'},
      {name:'Manage',test:k=>/\.(create|edit|assign|propose)$/.test(k)},
      {name:'Approve exceptions',test:k=>k.endsWith('.approve_exception')}
    ].map(b=>({...b,permissions:group.permissions.filter(p=>b.test(p.key))})).filter(b=>b.permissions.length);
    const bundleState=b=>{const n=b.permissions.filter(p=>isEnabled(p.key)).length;return n===0?'Off':n===b.permissions.length?'On':'Partial'};
    const bundleLocked=b=>self.value||state.busy||draft.user_role!==state.selected?.user_role||!can('identity.overrides.manage')||b.permissions.some(p=>blockedElsewhere(p.key))||(bundleState(b)!=='On'&&b.permissions.some(p=>props.access?.decisions?.[p.key]?.[scope.value]?.decision!=='ALLOW'));
    const bundleHint=b=>draft.user_role!==state.selected?.user_role?'Apply or undo the role change before editing permissions.':self.value?'Another administrator manages your access.':!can('identity.overrides.manage')?'You do not have permission to change access.':b.permissions.some(p=>blockedElsewhere(p.key))?'A rule at another scope blocks this group. Review individual actions.':bundleLocked(b)?'This group exceeds the access you can grant at this scope.':b.permissions.some(p=>decisionFor(p.key)?.decision==='ALLOW_LIMITED')?'Includes limited visibility. See individual actions for detail.':'Uses the saved rules and pending changes at this scope.';
    const toggleBundle=b=>{if(bundleLocked(b))return;const next=bundleState(b)==='On'?'deny':'allow';for(const p of b.permissions){const original=['ALLOW','ALLOW_LIMITED'].includes(decisionFor(p.key)?.decision)?'allow':'deny';if(next===original)delete pending[p.key];else pending[p.key]=next}};
    const pendingCount=computed(()=>Object.keys(pending).length);
    const pendingSummary=computed(()=>Object.entries(pending).map(([key,effect])=>({key,text:(effect==='allow'?'Allow full access: ':'Block: ')+(state.catalog.find(p=>p.key===key)?.label||key)})));
    const readiness=computed(()=>{const u=state.selected;if(!u)return [];const issues=[],staff=state.roster.find(s=>s.id===u.medical_staff_id);if(!u.medical_staff_id)issues.push('Link a staff profile to enable actions on own records.');else if(!staff)issues.push('Linked staff profile is unavailable. Review the profile link.');else{if(staff.employment_status!=='active')issues.push('The linked staff profile is inactive. Review employment status.');if((staff.department_id||null)!==(u.department_id||null))issues.push('Account and staff departments differ. Review Profile links.')}if(u.password_reset_required)issues.push('Individual password setup is required before sign-in.');if(u.account_status!=='active')issues.push('Sign-in is unavailable while the account is '+u.account_status+'.');return issues});
    const savedSummary=computed(()=>{const entries=simpleCatalog.value.filter(p=>['ALLOW','ALLOW_LIMITED'].includes(decisionFor(p.key)?.decision));if(!entries.length)return 'No module actions are currently allowed at this scope.';return entries.slice(0,4).map(p=>p.label+(decisionFor(p.key)?.decision==='ALLOW_LIMITED'?' (limited details)':'')).join(' · ')+(entries.length>4?' · '+(entries.length-4)+' more actions shown below.':'.')});
    const discard=()=>{for(const key of Object.keys(pending))delete pending[key]};
    const decisionFor=key=>state.snapshot?.capabilities?.decisions?.[key]?.[scope.value];
    const isEnabled=key=>pending[key]?pending[key]==='allow':['ALLOW','ALLOW_LIMITED'].includes(decisionFor(key)?.decision);
    const actionLabel=p=>({ 'staff.directory.view':'Directory','staff.profile.view':'Profile','staff.profile.edit':'Edit profile','grounded.ask':'Ask','grounded.propose':'Propose','grounded.commit':'Confirm changes','research.catalog.view':'View partners','research.catalog.edit':'Edit partners' }[p.key]||p.key.split('.').at(-1).replaceAll('_',' '));
    const togglePermission=p=>{if(state.busy||self.value||draft.user_role!==state.selected?.user_role||!state.snapshot||blockedElsewhere(p.key))return;const next=isEnabled(p.key)?'deny':'allow';const original=['ALLOW','ALLOW_LIMITED'].includes(decisionFor(p.key)?.decision)?'allow':'deny';if(next===original)delete pending[p.key];else pending[p.key]=next};
    const blockedElsewhere=key=>decisionFor(key)?.source==='user_override_deny'&&decisionFor(key)?.matched_scope&&decisionFor(key)?.matched_scope!==scope.value;
    const accessCaption=key=>blockedElsewhere(key)?'Blocked at '+decisionFor(key).matched_scope+' scope':pending[key]?'Pending '+(pending[key]==='allow'?'full access':'block'):decisionFor(key)?.decision==='ALLOW_LIMITED'?'Limited view':decisionFor(key)?.source==='system_admin_recovery'?'Protected system access':decisionFor(key)?.source==='role'?'Role default':decisionFor(key)?.source==='user_override_deny'?'Explicit block':decisionFor(key)?.source==='user_override_allow'?'Custom access':'Unavailable';
    const clearCredentials=()=>{credentials.email='';credentials.password='';credentials.visible=false;credentials.copied=false};
    const generatedPassword=()=>{const bytes=new Uint8Array(18);window.crypto.getRandomValues(bytes);return Array.from(bytes,b=>'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'[b%64]).join('')};
    const generate=()=>{state.temporaryPassword=generatedPassword();revealPassword.value=true};
    const copyPassword=async()=>{try{await window.navigator.clipboard.writeText(credentials.password||state.temporaryPassword);credentials.copied=true}catch{state.error='Copy is unavailable here. Reveal the password and copy it manually.'}};
    watch(()=>state.tab,()=>{clearCredentials();discard()});
    watch(()=>props.active,active=>{if(!active){clearCredentials();state.temporaryPassword='';revealPassword.value=false}});
    watch(scope,discard);
    Vue.onUnmounted(()=>{clearCredentials();state.temporaryPassword=''})
    const roles=['system_admin','department_head','coordinator','clinician','resident'];
    const statuses=['active','invited','suspended','locked','archived'];
    const can=(key)=>allowed(props.access,key,true);
    const view=()=>allowed(props.access,'identity.users.view');
    const self=computed(()=>state.selected?.id===props.currentId);
    const passwordAvailability=computed(()=>state.devEnabled?'Ready to generate development passwords.':({system_admin_required:'Only a system administrator can generate development passwords.',development_required:'Password generation is unavailable: the running backend is not in development mode.',flag_required:'Password generation is switched off on the running backend.'}[state.passwordStatus?.status]||'Password generation is unavailable. This backend does not report why; deploy the updated backend and refresh.'));
    const passwordBlocked=computed(()=>{
      const u=state.selected;
      if(!state.loaded)return 'Refresh account availability before generating a password.';
      if(!can('identity.users.security'))return 'You do not have permission to manage passwords.';
      if(!u)return 'Select an account.';
      if(self.value)return 'Use your own password reset flow to change your administrator password.';
      if(!['clinician','resident'].includes(u.user_role))return 'Development passwords are available for clinicians and residents only.';
      if(u.account_status!=='active')return 'The account must be active before a replacement can be generated.';
      if(!u.development_credentials)return 'This account uses individual credentials. Use Password & sessions to request an email reset.';
      if(!state.devEnabled)return passwordAvailability.value;
      if(hasUnsaved.value)return 'Save or undo your pending changes first.';
      return '';
    });
    const rows=computed(()=>state.users.filter(u=>(state.tab!=='attention'||needsAttention(u))&&(!state.status||u.account_status===state.status)&&(!state.role||u.user_role===state.role)&&`${u.full_name} ${u.email}`.toLowerCase().includes(state.query.toLowerCase())));
    const hasUnsaved=computed(()=>pendingCount.value>0||!!state.selected&&['user_role','medical_staff_id','department_id','job_title'].some(k=>String(draft[k]||'')!==String(state.selected[k]||'')));
    const decisions=computed(()=>state.catalog.map(p=>({...p,decision:state.snapshot?.capabilities?.decisions?.[p.key]?.[scope.value]})));
    let requestGeneration=0;
    async function load(){
      if(!view()) return;
      state.loading=true;state.error='';state.loaded=false;
      try {
        const [users,catalog,config,roster]=await Promise.all([API.request('/api/identity/users',{skipCache:true}),API.request('/api/authority/catalog',{skipCache:true}),API.request('/api/identity/config',{skipCache:true}),API.request('/api/identity/staff',{skipCache:true})]);
        state.passwordStatus=config.development_passwords||null;state.users=users.data||[];state.catalog=catalog.permissions||[];state.testEnabled=config.development_test_sessions_enabled===true;state.invites=config.invitations_enabled===true;state.devEnabled=config.development_passwords_enabled===true;state.roster=roster.data||[];if(state.devEnabled&&!state.invites)state.mode='development';state.loaded=true;
      }catch(e){state.error=e.message}finally{state.loading=false}
    }
    async function select(user,discardConfirmed=false){
      if(!discardConfirmed&&hasUnsaved.value&&!window.confirm('Discard your unsaved role, profile or access changes?'))return false;discard();
      const generation=++requestGeneration;state.selected=user;state.snapshot=null;state.events=[];state.error='';state.detailLoading=true;reason.value='';
      Object.assign(draft,{user_role:user.user_role,medical_staff_id:user.medical_staff_id||'',department_id:user.department_id||'',job_title:user.job_title||''});
      try {
        const [snapshot,events]=await Promise.all([API.request(`/api/authority/users/${user.id}`,{skipCache:true}),API.request(`/api/identity/users/${user.id}/events`,{skipCache:true})]);
        if(generation!==requestGeneration) return false;
        state.snapshot=snapshot;state.events=events.data||[];return true;
      }catch(e){if(generation===requestGeneration)state.error=e.message}finally{if(generation===requestGeneration)state.detailLoading=false}
    }
    async function run(fn,message){
      if(state.busy) return;
      state.busy=true;state.error='';state.notice='';
      const selectedId=state.selected?.id,selectedStaffId=state.staffId;
      try{const result=await fn();API.clearCache();state.notice=result?.delivery?.delivered===false?'Account updated, but the email was not delivered. Check delivery configuration and resend.':message;await load();const u=state.users.find(u=>u.id===selectedId||selectedStaffId&&u.medical_staff_id===selectedStaffId);if(u){Object.assign(draft,{user_role:u.user_role,medical_staff_id:u.medical_staff_id||'',department_id:u.department_id||'',job_title:u.job_title||''});await select(u,true);state.staffId=''}}catch(e){state.error=e.message}finally{state.busy=false}
    }
    const save=()=>{if(draft.user_role==='system_admin'&&state.selected.user_role!=='system_admin'&&!window.confirm('Grant full system administration to this person?'))return;return run(()=>API.request(`/api/identity/users/${state.selected.id}`,{method:'PUT',body:{...draft,medical_staff_id:draft.medical_staff_id||null,department_id:draft.department_id||null}}),'Account updated. Identity changes require a fresh sign-in.')};
    const savePills=()=>{
      if(!pendingCount.value)return;
      if(draft.user_role!==state.selected?.user_role){state.error='Apply or undo the role change before saving permissions.';return}
      if(scope.value==='all'&&!window.confirm('Apply these changes across all departments?'))return;
      const changes=Object.entries(pending).map(([key,effect])=>({key,effect}));
      return run(async()=>{const result=await API.request(`/api/identity/users/${state.selected.id}/access-pills`,{method:'PUT',body:{scope:scope.value,changes}});discard();return result},'Access updated. The saved scope decisions are shown below.');
    };
    const restoreDefaults=()=>{
      if(!focusedGroup.value||!window.confirm('Restore '+focusedGroup.value.name+' defaults at this scope? Other modules and scopes will stay unchanged.'))return;
      return run(async()=>{const result=await API.request(`/api/identity/users/${state.selected.id}/access-pills`,{method:'PUT',body:{scope:scope.value,restore:true,changes:focusedGroup.value.permissions.map(p=>({key:p.key,effect:'allow'}))}});discard();return result},'Custom module rules at this scope removed.');
    };
    const replacePassword=()=>{
      if(state.busy||passwordBlocked.value){state.error=passwordBlocked.value;return}
      if(!window.confirm('Generate a replacement development password and end all existing sessions?'))return;
      const password=generatedPassword(),email=state.selected.email;
      return run(async()=>{const result=await API.request(`/api/identity/users/${state.selected.id}/development-password`,{method:'POST',body:{password}});Object.assign(credentials,{email,password,visible:true,copied:false});return result},'Temporary password replaced. Copy it before leaving this workspace.');
    };
    const lifecycle=action=>{
      if(action!=='reactivate'&&reason.value.trim().length<5){state.error='Enter a reason of at least five characters.';return}
      if(!window.confirm(`${action.charAt(0).toUpperCase()+action.slice(1)} ${state.selected.full_name}?`))return;
      return run(()=>API.request(`/api/identity/users/${state.selected.id}/${action}`,{method:'POST',body:action==='reactivate'?{}:{reason:reason.value}}),'Account status updated.');
    };
    const setOverride=()=>run(()=>API.request(`/api/authority/users/${state.selected.id}/overrides`,{method:'PUT',body:{...exception,expires_at:exception.expires_at?new Date(exception.expires_at).toISOString():null}}),'Permission exception saved.');
    const removeOverride=o=>{
      if(!window.confirm(`Remove this ${o.effect} exception for ${o.permission_key}? Role defaults will apply.`))return;
      return run(()=>API.request(`/api/authority/users/${state.selected.id}/overrides/${o.id}`,{method:'DELETE'}),'Exception removed.');
    };
    const needsAttention=u=>u.password_reset_required||u.development_credentials||['invited','locked','suspended'].includes(u.account_status)||!u.medical_staff_id;
    watch(()=>state.tab,()=>{state.temporaryPassword=''});
    const normalized=v=>String(v||'').trim().toLowerCase();
    const onboarding=computed(()=>state.roster.map(staff=>{
      const account=state.users.find(u=>u.medical_staff_id===staff.id);
      const email=normalized(staff.professional_email);
      const conflict=!!email&&(state.roster.some(other=>other.id!==staff.id&&normalized(other.professional_email)===email)||state.users.some(u=>u.medical_staff_id!==staff.id&&normalized(u.email)===email));
      const issue=account?'Already linked':staff.employment_status!=='active'?'Inactive staff':! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?'Email needed':conflict?'Email conflict':'';
      return {...staff,email,account,issue};
    }));
    const staffRows=computed(()=>onboarding.value.filter(s=>!s.account&&`${s.full_name} ${s.email}`.toLowerCase().includes(state.staffQuery.toLowerCase())));
    const team=computed(()=>[
      ...onboarding.value.map(p=>({...p,key:'staff:'+p.id,status:p.account?.account_status||'no_login'})),
      ...state.users.filter(u=>!state.roster.some(p=>p.id===u.medical_staff_id)).map(u=>({key:'account:'+u.id,id:null,full_name:u.full_name,email:u.email,department_id:u.department_id,account:u,status:u.account_status,issue:'No available staff profile'}))
    ].filter(p=>(!state.teamStatus||p.status===state.teamStatus)&&(!state.teamDepartment||p.department_id===state.teamDepartment)&&normalized(p.full_name+' '+p.email).includes(normalized(state.teamQuery))).sort((a,b)=>String(a.full_name).localeCompare(String(b.full_name))));
    const loginLabel=p=>p.status==='no_login'?'No login':p.status==='active'?'Active':p.status==='invited'?'Awaiting activation':'Disabled · '+label(p.status);
    async function choosePerson(person){if(state.busy)return;if(person.account){const accepted=await select(person.account);if(accepted===false)return;state.staffId='';clearCredentials();state.temporaryPassword=''}else pickStaff(person)}
    const selectedStaff=computed(()=>onboarding.value.find(s=>s.id===state.staffId));
    const counts=computed(()=>({active:state.users.filter(u=>u.account_status==='active').length,pending:state.users.filter(u=>u.account_status==='invited').length,unlinked:onboarding.value.filter(s=>!s.account).length,attention:state.users.filter(needsAttention).length}));
    function pickStaff(staff){if(state.busy)return;if(hasUnsaved.value&&!window.confirm('Discard your unsaved role, profile or access changes?'))return;discard();clearCredentials();requestGeneration++;state.selected=null;state.snapshot=null;state.events=[];state.detailLoading=false;state.staffId=staff.id;state.temporaryPassword='';state.error='';Object.assign(invitation,{medical_staff_id:staff.id,email:staff.email,user_role:'clinician',department_id:staff.department_id||'',reason:''})}
    const provision=()=>{
      if(!state.loaded||!selectedStaff.value||selectedStaff.value.issue){state.error='Choose an active staff member with a unique professional email.';return}
      if(state.mode==='development'&&!state.devEnabled){state.error=passwordAvailability.value;return}
      return run(async()=>{const issuedPassword=state.temporaryPassword;let result;try{result=await API.request(state.mode==='development'?'/api/identity/development-accounts':'/api/identity/invitations',{method:'POST',body:state.mode==='development'?{medical_staff_id:state.staffId,user_role:invitation.user_role,password:state.temporaryPassword}:{...invitation,department_id:invitation.department_id||null}})}finally{state.temporaryPassword=''}if(state.mode==='development')Object.assign(credentials,{email:result.user?.email||selectedStaff.value?.email,password:issuedPassword,visible:true,copied:false});state.staffId='';return result},state.mode==='development'?'Development login enabled. Sign in using the staff email and the temporary password you entered.':'Invitation created and accepted by the email provider.');
    };
    const resend=()=>run(()=>API.request(`/api/identity/users/${state.selected.id}/resend-invitation`,{method:'POST',body:{}}),'Invitation accepted by the email provider.');
    const security=action=>{
      if(reason.value.trim().length<5){state.error='Enter a reason of at least five characters.';return}
      if(!window.confirm(action==='require_password_reset'?'End existing sessions and require an individual password from the emailed link?':'End all current sessions for this account?'))return;
      return run(()=>API.request(`/api/identity/users/${state.selected.id}/security`,{method:'POST',body:{action,reason:reason.value}}),action==='require_password_reset'?'Password reset required. The email provider accepted the reset message.':'All previous sessions revoked.');
    };
    watch(()=>state.mode,()=>{state.temporaryPassword='';invitation.user_role='clinician'});
    watch(()=>view(),visible=>{if(visible&&!state.loaded)load()},{immediate:true});
    const label=s=>String(s||'').replaceAll('_',' ');
    return {passwordAvailability,passwordBlocked,pendingSummary,readiness,testUser:()=>{if(state.selected&&state.testEnabled&&!state.busy&&!hasUnsaved.value)emit('test-user',state.selected)},team,loginLabel,choosePerson,hasUnsaved,focusedGroup,permissionBundles,bundleState,bundleLocked,bundleHint,toggleBundle,state,draft,exception,invitation,reason,scope,roles,statuses,can,view,self,rows,decisions,load,select,save,lifecycle,setOverride,removeOverride,resend,security,provision,pickStaff,onboarding,staffRows,selectedStaff,counts,label,pending,pendingCount,savedSummary,discard,accessGroups,simpleCatalog,isEnabled,actionLabel,togglePermission,accessCaption,blockedElsewhere,savePills,restoreDefaults,credentials,revealPassword,generate,copyPassword,clearCredentials,replacePassword};
  },
  template:`
<section v-if="view()" class="ac-center" aria-labelledby="access-title">
  <header class="ac-head"><div><p class="ac-eyebrow">Neumact · Administration</p><h2 id="access-title">People & access</h2><p>Manage login, roles and permissions for existing staff.</p></div><button class="btn btn-secondary" @click="load" :disabled="state.loading||state.busy||hasUnsaved">{{state.loading?'Loading…':'Refresh'}}</button></header>
  <p v-if="state.error" role="alert" class="ac-alert">{{state.error}}</p><p v-if="state.notice" role="status" class="ac-notice">{{state.notice}}</p>
  <section v-if="credentials.password" class="ac-credential-receipt" aria-label="New login credentials"><div><p class="ac-eyebrow">LOGIN READY · COPY NOW</p><h3>{{credentials.email}}</h3><p>This password is shown only in this session. After dismissal, generate a replacement if needed.</p></div><label>Temporary password<input :type="credentials.visible?'text':'password'" :value="credentials.password" readonly autocomplete="off"></label><div class="ac-actions"><button class="btn btn-secondary" @click="credentials.visible=!credentials.visible">{{credentials.visible?'Hide':'Show'}}</button><button class="btn btn-primary" @click="copyPassword">{{credentials.copied?'Copied':'Copy password'}}</button><button class="btn btn-secondary" @click="clearCredentials">Dismiss</button></div></section>
  <div v-if="state.loaded" class="ac-login-card" aria-label="Password availability"><div><strong>Development passwords · {{state.devEnabled?'Available':'Unavailable'}}</strong><p class="ac-meta">{{passwordAvailability}}</p><details v-if="!state.devEnabled&&state.passwordStatus?.checks"><summary>Server setup</summary><p class="ac-meta">On the development backend service, set NODE_ENV=development and IDENTITY_DEV_PASSWORDS_ENABLED=true, then redeploy and select Refresh above.</p><ul class="ac-meta"><li>Development mode: {{state.passwordStatus.checks.development_mode?'ready':'not active'}}</li><li>Password flag: {{state.passwordStatus.checks.password_flag?'ready':'not enabled'}}</li></ul><p class="ac-meta">These checks come from the server this application is connected to. If the settings look correct in Railway, check the selected service and environment and confirm the latest deployment is active.</p></details></div></div>
  <div class="ac-metrics" aria-label="Access overview">
    <button :disabled="state.busy||hasUnsaved" @click="state.tab='accounts';state.status='active'"><span>Active accounts</span><strong>{{counts.active}}</strong><small>Active account status</small></button>
    <button :disabled="state.busy||hasUnsaved" @click="state.tab='accounts';state.status='invited'"><span>Awaiting activation</span><strong>{{counts.pending}}</strong><small>Invitation in progress</small></button>
    <button :disabled="state.busy||hasUnsaved" @click="state.tab='onboarding'"><span>Staff without access</span><strong>{{counts.unlinked}}</strong><small>Start with an existing profile</small></button>
    <button :disabled="state.busy||hasUnsaved" @click="state.tab='attention';state.status=''"><span>Needs attention</span><strong>{{counts.attention}}</strong><small>Review credentials and identity</small></button>
  </div>
  <nav class="ac-tabs" aria-label="Identity workspace"><button v-for="t in [{id:'team',name:'Everyone'},{id:'onboarding',name:'Enable login'},{id:'accounts',name:'Accounts'},{id:'attention',name:'Needs attention'}]" :key="t.id" :disabled="state.busy||hasUnsaved" :aria-pressed="state.tab===t.id" :class="{active:state.tab===t.id}" @click="state.tab=t.id;state.status='';state.query='';state.role=''">{{t.name}}</button></nav>
  <div :class="{'ac-team-workspace':state.tab==='team'}">
  <aside v-if="state.tab==='team'" class="ac-team-directory" aria-label="People roster"><label>Find a person<input type="search" v-model="state.teamQuery" placeholder="Name or email"></label><div class="ac-team-filters"><label>Login<select v-model="state.teamStatus"><option value="">All statuses</option><option value="no_login">No login</option><option v-for="status in statuses" :key="status" :value="status">{{label(status)}}</option></select></label><label>Department<select v-model="state.teamDepartment"><option value="">All departments</option><option v-for="d in departments" :key="d.id" :value="d.id">{{d.name||d.department_name}}</option></select></label></div><p class="ac-meta">{{team.length}} people · Select to manage access</p><div class="ac-team-list"><button v-for="person in team" :key="person.key" class="ac-team-person" :class="{'ac-selected':person.account?state.selected?.id===person.account.id:state.staffId===person.id}" :aria-pressed="person.account?state.selected?.id===person.account.id:state.staffId===person.id" :disabled="state.busy" @click="choosePerson(person)"><span class="ac-avatar" aria-hidden="true">{{(person.full_name||'?').split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('')}}</span><span><strong>{{person.full_name}}</strong><small>{{person.email||'Professional email needed'}}</small><span class="ac-chip">{{loginLabel(person)}}</span></span></button></div><p v-if="state.loaded&&!team.length" class="ac-empty">No people match these filters.</p></aside>
  <div class="ac-workspace-detail">
  <section v-if="state.tab==='onboarding'||state.tab==='team'&&!state.selected" class="ac-onboarding" :class="{'ac-team-single':state.tab==='team'}">
    <div v-if="state.tab!=='team'" class="ac-roster"><div class="ac-section-title"><div><h3>One profile. One account.</h3><p class="ac-meta">Staff details are already here. Choose who gets access next.</p></div><span class="ac-count">{{staffRows.length}}</span></div>
      <label>Find staff<input v-model="state.staffQuery" placeholder="Search name or professional email" type="search"></label>
      <p v-if="state.loading" role="status">Loading staff…</p><p v-else-if="!staffRows.length" class="ac-empty">{{state.staffQuery?'No staff match this search.':'Every available staff profile is linked to an account.'}}</p>
      <div class="ac-roster-list"><button v-for="person in staffRows" :key="person.id" :disabled="state.busy" @click="pickStaff(person)" :aria-pressed="state.staffId===person.id" :class="['ac-person',{'ac-selected':state.staffId===person.id}]"><span class="ac-avatar" aria-hidden="true">{{(person.full_name||'?').split(' ').filter(Boolean).slice(0,2).map(n=>n[0]).join('')}}</span><span class="ac-person-info"><strong>{{person.full_name}}</strong><small>{{person.email||'No professional email'}}</small><span>{{departments.find(d=>d.id===person.department_id)?.name||'No department'}}</span></span><span :class="['ac-chip',{'ac-chip-warning':person.issue}]">{{person.issue||'Ready'}}</span></button></div>
    </div>
    <aside class="ac-provision"><p class="ac-eyebrow">Enable login</p><template v-if="selectedStaff"><h3>{{selectedStaff.full_name}}</h3><p class="ac-meta">{{selectedStaff.email||'Email needed'}}</p><p v-if="selectedStaff.issue" class="ac-alert">{{selectedStaff.issue}}. Resolve this in the staff profile before enabling login.</p><form v-else @submit.prevent="provision"><fieldset :disabled="state.busy"><label>Access role<select v-model="invitation.user_role"><option v-for="r in (state.mode==='development'?['clinician','resident']:roles)" :value="r">{{label(r)}}</option></select></label><p class="ac-meta">Department and identity come from the staff profile. Role permissions apply immediately after activation.</p>
      <label>Activation method<select v-model="state.mode"><option value="invitation">Individual email invitation</option><option :disabled="!state.devEnabled" value="development">Development test password</option></select></label>
      <template v-if="state.mode==='development'"><p class="ac-notice">Development only. You may use the same temporary password for your selected test accounts. Each account keeps its own identity and permissions.</p><label>Temporary test password<input :type="revealPassword?'text':'password'" autocomplete="new-password" required minlength="8" maxlength="72" v-model="state.temporaryPassword"></label><div class="ac-actions"><button type="button" class="btn btn-secondary" @click="generate">Generate password</button><button type="button" class="btn btn-secondary" @click="revealPassword=!revealPassword">{{revealPassword?'Hide':'Show'}}</button></div><small class="ac-meta">At least 8 characters. Copy the login details after activation.</small></template>
      <p v-else class="ac-meta">A single-use invitation lets this person choose their own password. No registration form to repeat.</p>
      <p v-if="state.mode==='invitation'&&!state.invites" class="ac-alert">Invitation delivery is disabled in this deployment.</p>
      <button class="btn btn-primary ac-enable" :disabled="state.busy||!state.loaded||!can('identity.users.invite')||(state.mode==='invitation'&&!state.invites)||(state.mode==='development'&&!state.devEnabled)">{{state.busy?'Enabling…':state.mode==='development'?'Enable test login':'Send activation invitation'}}</button>
    </fieldset></form></template><div v-else class="ac-welcome"><span class="ac-welcome-mark" aria-hidden="true">↗</span><h3>Open the door to your team.</h3><p>Select a staff member to review their email and choose how they activate access.</p><ol><li>Choose an existing profile</li><li>Review the access role</li><li>Send activation or enable a test login</li></ol></div>
    <p v-if="!state.invites" class="ac-meta">Invitation delivery is disabled in this deployment.</p></aside>
  </section>
  <template v-else>
  <div v-if="state.tab!=='team'" class="ac-filters"><label>Find an account<input v-model="state.query" placeholder="Name or email"></label><label>Role<select v-model="state.role"><option value="">All roles</option><option v-for="r in roles" :value="r">{{label(r)}}</option></select></label><label>Status<select v-model="state.status"><option value="">All statuses</option><option v-for="s in statuses" :value="s">{{label(s)}}</option></select></label></div>
  <div class="ac-layout" :class="{'ac-team-single':state.tab==='team'}"><div v-if="state.tab!=='team'" class="ac-accounts" aria-label="Accounts"><p v-if="state.loaded&&!rows.length">No accounts match these filters.</p><button v-for="u in rows" :key="u.id" @click="select(u)" :disabled="state.busy" :class="['ac-account',{'ac-selected':state.selected?.id===u.id}]" :aria-pressed="state.selected?.id===u.id"><strong>{{u.full_name}}</strong><span>{{u.email}}</span><span class="ac-meta">{{label(u.user_role)}} · {{label(u.account_status)}}</span><small>{{u.linked_staff?.full_name||'No linked staff profile'}}</small></button></div>
  <section class="ac-detail" aria-live="polite"><p v-if="!state.selected" class="ac-empty">Select an account to inspect its identity and access.</p><template v-else><h3>{{state.selected.full_name}}</h3><p class="ac-meta">{{state.selected.email}} · Last sign-in: {{state.selected.last_login_at ? new Date(state.selected.last_login_at).toLocaleString() : 'Not recorded'}}</p><p v-if="state.detailLoading">Loading account access…</p>
  <p v-if="!state.selected.medical_staff_id" class="ac-notice">This account has no linked staff profile. Actions scoped to “own” records are unavailable.</p>
  <div v-if="readiness.length" class="ac-notice"><strong>Account readiness</strong><ul><li v-for="issue in readiness" :key="issue">{{issue}}</li></ul></div>
  <div class="ac-account-status"><span class="ac-chip">{{label(state.selected.account_status)}}</span><span v-if="state.selected.development_credentials" class="ac-chip ac-chip-warning">Development credentials</span><span v-if="state.selected.password_reset_required" class="ac-chip ac-chip-warning">Password setup required</span></div>
  <div v-if="state.testEnabled&&!self&&state.selected.user_role!=='system_admin'&&state.selected.account_status==='active'&&!state.selected.password_reset_required" class="ac-login-card"><div><strong>Test this person's access</strong><p class="ac-meta">Use the normal application with their permissions. Your administrator session stays available. Lasts 15 minutes; changes affect development records.</p></div><button class="btn btn-secondary" :disabled="state.busy||hasUnsaved" @click="testUser">Test as user</button></div>
  <div v-if="can('identity.users.security')" class="ac-login-card"><div><strong>Password</strong><p class="ac-meta">{{passwordBlocked||'Generate a replacement, then copy the new password here. Existing sessions will end.'}}</p></div><button class="btn btn-secondary" :disabled="state.busy||!!passwordBlocked" @click="replacePassword">Generate replacement</button></div>
  <details v-if="can('identity.users.security')&&!self&&state.selected.account_status==='active'"><summary>Password &amp; sessions</summary><p class="ac-meta">Require an individual password to replace development credentials. This ends existing sessions and sends a one-hour reset link.</p><label>Reason<textarea v-model="reason" maxlength="1000" placeholder="Why is this action needed?"></textarea></label><div class="ac-actions"><button class="btn btn-primary" :disabled="state.busy" @click="security('require_password_reset')">Require individual password</button><button class="btn btn-secondary" :disabled="state.busy" @click="security('revoke_sessions')">Revoke sessions</button></div></details>
  <div v-if="state.selected.account_status==='invited'&&can('identity.users.invite')" class="ac-actions"><button class="btn btn-primary" :disabled="state.busy||!state.invites" @click="resend">Resend activation</button></div>
  <section class="ac-role-panel" v-if="can('identity.users.manage')"><div class="ac-section-title"><div><p class="ac-eyebrow">RESPONSIBILITY</p><h3>Start with a role.</h3></div><button class="btn btn-secondary" :disabled="state.busy||self||pendingCount>0||draft.user_role===state.selected.user_role" @click="save">Apply role</button></div><div class="ac-role-pills"><button v-for="r in roles" :key="r" :disabled="state.busy||self||pendingCount>0" :aria-pressed="draft.user_role===r" :class="{active:draft.user_role===r}" @click="draft.user_role=r">{{label(r)}}</button></div><p class="ac-meta">Role defaults set the starting access. Your linked clinical profile remains connected. Existing custom permissions remain in place.</p><p v-if="draft.user_role!==state.selected.user_role" class="ac-notice">Role change is not saved. Apply role to update the account.</p><p v-if="self" class="ac-meta">Another administrator manages changes to your own role and access.</p></section>
  <section v-if="state.snapshot" class="ac-permissions"><div class="ac-section-title"><div><p class="ac-eyebrow">EVERYDAY ACCESS</p><h3>What can this person do?</h3></div><span class="ac-count">{{pendingCount?pendingCount+' pending':'Saved access'}}</span></div><div class="ac-scope-pills" aria-label="Permission scope"><button v-for="item in [{id:'own',name:'Own records'},{id:'department',name:'Their department'},{id:'all',name:'All departments'}]" :key="item.id" :class="{active:scope===item.id}" :aria-pressed="scope===item.id" :disabled="state.busy||hasUnsaved" @click="scope=item.id">{{item.name}}</button></div><p class="ac-meta">Highlighted actions are allowed at this scope. Select a pill to change it, then save. New grants allow full detail; explicit blocks and record relationships still take precedence.</p>
  <p class="ac-permission-summary"><strong>Saved access · {{scope==='own'?'own records':scope==='department'?'their department':'all departments'}}</strong><br>{{savedSummary}}</p>
  <nav class="ac-module-nav" aria-label="Permission modules"><button v-for="group in accessGroups" :key="group.domain" :class="{active:focusedGroup?.domain===group.domain}" :aria-pressed="focusedGroup?.domain===group.domain" @click="state.focusDomain=group.domain">{{group.name}}<small>{{group.permissions.filter(p=>isEnabled(p.key)).length}} / {{group.permissions.length}} allowed<span v-if="group.permissions.some(p=>pending[p.key])"> · pending</span></small></button></nav>
  <article v-if="focusedGroup" class="ac-module-card ac-focused-module"><div class="ac-module-title"><h4>{{focusedGroup.name}}</h4><span>{{scope==='own'?'Own records':scope==='department'?'Their department':'All departments'}}</span></div><div class="ac-bundle-pills"><button v-for="bundle in permissionBundles(focusedGroup)" :key="bundle.name" :disabled="bundleLocked(bundle)" :title="bundleHint(bundle)" :aria-pressed="bundleState(bundle)==='Partial'?'mixed':bundleState(bundle)==='On'" :class="{active:bundleState(bundle)==='On',partial:bundleState(bundle)==='Partial'}" @click="toggleBundle(bundle)"><strong>{{bundle.name}}</strong><span>{{bundleState(bundle)}}</span><small>{{bundle.permissions.map(p=>p.label).join(' · ')}}</small><small>{{bundleHint(bundle)}}</small></button></div><p class="ac-meta">Manage groups creation and editing where available. Archive, cancellation, permanent deletion and Grounded write confirmation remain individual controls below. Limited visibility remains visible in the detailed controls.</p>
  <details class="ac-permission-details"><summary>Individual actions &amp; explanations</summary><div class="ac-action-pills"><button v-for="p in focusedGroup.permissions" :key="p.key" :disabled="self||state.busy||draft.user_role!==state.selected?.user_role||blockedElsewhere(p.key)||!can('identity.overrides.manage')" :aria-pressed="isEnabled(p.key)" :class="{active:isEnabled(p.key),pending:pending[p.key]}" @click="togglePermission(p)"><span>{{actionLabel(p)}}<small>{{accessCaption(p.key)}}</small></span></button></div><dl class="ac-access-reasons"><template v-for="p in focusedGroup.permissions" :key="p.key"><dt>{{p.label}} · {{accessCaption(p.key)}}</dt><dd>{{state.snapshot?.capabilities?.decisions?.[p.key]?.[scope]?.reason||'No permission is available at this scope.'}}</dd></template></dl></details><p v-if="focusedGroup.domain==='grounded'" class="ac-meta">Grounded also checks permission for each underlying record.</p></article>
  <section v-if="pendingSummary.length" class="ac-notice" aria-label="Permission change preview"><strong>Changes to apply · {{scope==='own'?'Own records':scope==='department'?'Their department':'All departments'}}</strong><ul><li v-for="change in pendingSummary" :key="change.key">{{change.text}}</li></ul><p>Other permissions stay unchanged. Record-specific restrictions still apply.</p></section>
  <div class="ac-save-bar" v-if="can('identity.overrides.manage')&&!self"><div><strong>{{pendingCount?pendingCount+' access changes to review':'Access is up to date'}}</strong><small>{{pendingCount?'Review the highlighted pills before saving.':'Changes are checked on the server for every action.'}}</small></div><div class="ac-actions"><button class="btn btn-secondary" :disabled="state.busy||!pendingCount" @click="discard">Undo changes</button><button class="btn btn-primary" :disabled="state.busy||!pendingCount" @click="savePills">{{state.busy?'Saving…':'Save access'}}</button></div></div>
  <button v-if="can('identity.overrides.manage')&&!self" class="ac-text-button" :disabled="state.busy||!simpleCatalog.length" @click="restoreDefaults">Restore {{focusedGroup?.name||'module'}} defaults at this scope</button></section>
  <details class="ac-advanced"><summary>Advanced · profile links, exceptions &amp; diagnostics</summary>
  <form v-if="can('identity.users.manage')" @submit.prevent="save"><fieldset :disabled="state.busy||self"><legend>Profile links</legend><div class="ac-form-grid"><label>Department<select v-model="draft.department_id"><option value="">No department</option><option v-for="d in departments" :value="d.id">{{d.name||d.department_name}}</option></select></label><label>Staff profile<select v-model="draft.medical_staff_id"><option value="">Unlinked</option><option v-for="s in staff" :value="s.id">{{s.full_name}}</option></select></label><label>Job title<input v-model="draft.job_title" maxlength="160"></label></div><button class="btn btn-primary">Save profile links</button></fieldset></form>
  <details v-if="state.snapshot"><summary>Access by scope</summary><label>Inspect scope<select :disabled="state.busy||hasUnsaved" v-model="scope"><option value="department">Department</option><option value="own">Own records</option><option value="all">All records</option></select></label><p class="ac-meta">These decisions describe this scope. The server checks the actual record again for every action.</p><div class="ac-table-wrap"><table><thead><tr><th>Action</th><th>Decision</th><th>Visibility</th><th>Reason</th></tr></thead><tbody><tr v-for="p in decisions" :key="p.key"><td>{{p.label}}</td><td>{{p.decision?.decision||'DENY'}}</td><td>{{p.decision?.visibility||'none'}}</td><td>{{p.decision?.reason||'Required identity relationship is missing.'}}</td></tr></tbody></table></div></details>
  <details v-if="state.snapshot"><summary>Permission exceptions ({{state.snapshot.overrides?.length||0}})</summary><div v-for="o in state.snapshot.overrides" :key="o.id" class="ac-exception"><strong>{{o.permission_key}}</strong><p>{{o.effect}} · {{o.scope}} · {{o.visibility}}</p><p>{{o.reason}}</p><small>Expires: {{o.expires_at?new Date(o.expires_at).toLocaleString():'No expiry'}}</small><button v-if="can('identity.overrides.manage')&&!self" class="btn btn-secondary" :disabled="state.busy" @click="removeOverride(o)">Remove exception</button></div><form v-if="can('identity.overrides.manage')&&!self" @submit.prevent="setOverride"><fieldset :disabled="state.busy"><legend>Add or replace an exception</legend><div class="ac-form-grid"><label>Action<select required v-model="exception.permission_key"><option value="" disabled>Select action</option><option v-for="p in state.catalog" :value="p.key">{{p.label}}</option></select></label><label>Effect<select v-model="exception.effect"><option>deny</option><option>allow</option></select></label><label>Scope<select v-model="exception.scope"><option>own</option><option>department</option><option>all</option></select></label><label>Visibility<select v-model="exception.visibility"><option>summary</option><option>operational</option><option>full</option></select></label><label>Expiry (optional)<input type="datetime-local" v-model="exception.expires_at"></label><label>Reason<textarea required minlength="8" maxlength="1000" v-model="exception.reason"></textarea></label></div><button class="btn btn-primary">Save exception</button></fieldset></form></details>
  </details>
  <details v-if="can('identity.users.lifecycle')&&!self"><summary>Account status</summary><label>Reason<textarea v-model="reason" maxlength="1000" placeholder="Explain the account status change"></textarea></label><div class="ac-actions"><button v-if="state.selected.account_status==='active'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('suspend')">Suspend</button><button v-if="state.selected.account_status==='active'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('lock')">Lock</button><button v-if="['suspended','locked','archived'].includes(state.selected.account_status)" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('reactivate')">Reactivate</button><button v-if="state.selected.account_status!=='archived'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('archive')">Archive</button><button v-if="state.selected.account_status==='invited'&&state.invites&&can('identity.users.invite')" class="btn btn-secondary" :disabled="state.busy" @click="resend">Resend invitation</button></div></details>
  <details><summary>Account history</summary><p v-if="!state.events.length">No events recorded.</p><ol class="ac-history"><li v-for="e in state.events" :key="e.id"><strong>{{label(e.event_type)}}</strong><time>{{new Date(e.created_at).toLocaleString()}}</time><p v-if="e.reason">{{e.reason}}</p><small>Actor: {{state.users.find(u=>u.id===e.actor_user_id)?.full_name||e.actor_user_id||'System'}}</small></li></ol></details>
  </template></section></div>
  </template>
  </div></div>
</section>`
};
}
function createInvitation({Vue,API}) {
return {setup(){
 const params=new URLSearchParams(window.location.search);
 const reset=!!params.get('reset_token');
 const token=Vue.ref(params.get(reset?'reset_token':'invite_token')||'');
 const state=Vue.reactive({password:'',confirm:'',busy:false,error:'',done:false});
 if(token.value){const url=new URL(window.location.href);url.searchParams.delete('invite_token');url.searchParams.delete('reset_token');history.replaceState({},'',url.pathname+url.search+url.hash)}
 async function submit(){if(state.password!==state.confirm){state.error='Passwords do not match.';return}state.busy=true;state.error='';try{await API.request(reset?'/api/auth/reset-password':'/api/auth/accept-invitation',{method:'POST',body:{token:token.value,new_password:state.password}});token.value='';state.password='';state.confirm='';for(const storage of [window.localStorage,window.sessionStorage]){for(const key of ['neumocare_token','neumocare_user','neumocare_session_token','neumocare_session_user'])storage.removeItem(key)}state.done=true}catch(e){state.error=e.message}finally{state.busy=false}}
 const finish=()=>window.location.reload();
 return {token,state,submit,reset,finish};
},template:`<div v-if="token||state.done" class="ac-setup"><section class="ac-setup-card" aria-labelledby="setup-title"><h1 id="setup-title">{{reset?'Choose your individual password':'Set up your Neumact account'}}</h1><template v-if="state.done"><p role="status">Your password is set. You can now sign in.</p><button class="btn btn-primary" @click="finish">Continue to sign in</button></template><form v-else @submit.prevent="submit"><p>{{reset?'Choose a new password to restore access.':'Choose your password to accept the invitation.'}}</p><p v-if="state.error" role="alert" class="ac-alert">{{state.error}}</p><label>Password<input type="password" autocomplete="new-password" minlength="10" maxlength="72" required v-model="state.password"></label><label>Confirm password<input type="password" autocomplete="new-password" minlength="10" maxlength="72" required v-model="state.confirm"></label><p class="ac-meta">Use at least 10 characters.</p><button class="btn btn-primary" :disabled="state.busy">{{state.busy?'Saving…':reset?'Set password':'Activate account'}}</button></form></section></div>`};
}
root.NeumAccess={allowed,hasPermission,canRecord,createSelfProfile,createCenter,createInvitation};
if(typeof module!=='undefined')module.exports=root.NeumAccess;
})(typeof window!=='undefined'?window:globalThis);
