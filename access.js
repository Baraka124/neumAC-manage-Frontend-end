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
  props:{access:Object,currentId:String,staff:{type:Array,default:()=>[]},departments:{type:Array,default:()=>[]}},
  setup(props) {
    const {ref,reactive,computed,watch}=Vue;
    const state=reactive({loaded:false,loading:false,busy:false,error:'',notice:'',users:[],query:'',status:'',role:'',selected:null,snapshot:null,events:[],catalog:[],invites:false,detailLoading:false});
    const draft=reactive({user_role:'clinician',medical_staff_id:'',department_id:'',job_title:''});
    const exception=reactive({permission_key:'',effect:'deny',scope:'department',visibility:'summary',reason:'',expires_at:''});
    const invitation=reactive({medical_staff_id:'',email:'',user_role:'clinician',department_id:'',reason:''});
    const reason=ref(''),scope=ref('department');
    const roles=['system_admin','department_head','coordinator','clinician','resident'];
    const statuses=['active','invited','suspended','locked','archived'];
    const can=(key)=>allowed(props.access,key,true);
    const view=()=>allowed(props.access,'identity.users.view');
    const self=computed(()=>state.selected?.id===props.currentId);
    const rows=computed(()=>state.users.filter(u=>(!state.status||u.account_status===state.status)&&(!state.role||u.user_role===state.role)&&`${u.full_name} ${u.email}`.toLowerCase().includes(state.query.toLowerCase())));
    const decisions=computed(()=>state.catalog.map(p=>({...p,decision:state.snapshot?.capabilities?.decisions?.[p.key]?.[scope.value]})));
    let requestGeneration=0;
    async function load(){
      if(!view()) return;
      state.loading=true;state.error='';
      try {
        const [users,catalog,config]=await Promise.all([API.request('/api/identity/users',{skipCache:true}),API.request('/api/authority/catalog',{skipCache:true}),API.request('/api/identity/config',{skipCache:true})]);
        state.users=users.data||[];state.catalog=catalog.permissions||[];state.invites=config.invitations_enabled===true;state.loaded=true;
      }catch(e){state.error=e.message}finally{state.loading=false}
    }
    async function select(user){
      const generation=++requestGeneration;state.selected=user;state.snapshot=null;state.events=[];state.error='';state.detailLoading=true;reason.value='';
      Object.assign(draft,{user_role:user.user_role,medical_staff_id:user.medical_staff_id||'',department_id:user.department_id||'',job_title:user.job_title||''});
      try {
        const [snapshot,events]=await Promise.all([API.request(`/api/authority/users/${user.id}`,{skipCache:true}),API.request(`/api/identity/users/${user.id}/events`,{skipCache:true})]);
        if(generation!==requestGeneration) return;
        state.snapshot=snapshot;state.events=events.data||[];
      }catch(e){if(generation===requestGeneration)state.error=e.message}finally{if(generation===requestGeneration)state.detailLoading=false}
    }
    async function run(fn,message){
      if(state.busy) return;
      state.busy=true;state.error='';state.notice='';
      const selectedId=state.selected?.id;
      try{await fn();API.clearCache();state.notice=message;await load();const u=state.users.find(u=>u.id===selectedId);if(u)await select(u)}catch(e){state.error=e.message}finally{state.busy=false}
    }
    const save=()=>run(()=>API.request(`/api/identity/users/${state.selected.id}`,{method:'PUT',body:{...draft,medical_staff_id:draft.medical_staff_id||null,department_id:draft.department_id||null}}),'Account updated. Identity changes require a fresh sign-in.');
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
    const invite=()=>run(()=>API.request('/api/identity/invitations',{method:'POST',body:{...invitation,department_id:invitation.department_id||null,...(!invitation.email?{email:undefined}:{})}}),'Invitation created. Check the configured email delivery.');
    const resend=()=>run(()=>API.request(`/api/identity/users/${state.selected.id}/resend-invitation`,{method:'POST',body:{}}),'Invitation resent.');
    watch(()=>view(),visible=>{if(visible&&!state.loaded)load()},{immediate:true});
    const label=s=>String(s||'').replaceAll('_',' ');
    return {state,draft,exception,invitation,reason,scope,roles,statuses,can,view,self,rows,decisions,load,select,save,lifecycle,setOverride,removeOverride,invite,resend,label};
  },
  template:`
<section v-if="view()" class="ac-center" aria-labelledby="access-title">
  <header class="ac-head"><div><p class="ac-eyebrow">Department administration</p><h2 id="access-title">Access &amp; Identity</h2><p>People, account status and the permissions behind each action.</p></div><button class="btn btn-secondary" @click="load" :disabled="state.loading||state.busy">{{state.loading?'Loading…':'Refresh'}}</button></header>
  <p v-if="state.error" role="alert" class="ac-alert">{{state.error}}</p><p v-if="state.notice" role="status" class="ac-notice">{{state.notice}}</p>
  <div class="ac-filters"><label>Find an account<input v-model="state.query" placeholder="Name or email"></label><label>Role<select v-model="state.role"><option value="">All roles</option><option v-for="r in roles" :value="r">{{label(r)}}</option></select></label><label>Status<select v-model="state.status"><option value="">All statuses</option><option v-for="s in statuses" :value="s">{{label(s)}}</option></select></label></div>
  <div class="ac-layout"><div class="ac-accounts" aria-label="Accounts"><p v-if="state.loaded&&!rows.length">No accounts match these filters.</p><button v-for="u in rows" :key="u.id" @click="select(u)" :disabled="state.busy" :class="['ac-account',{'ac-selected':state.selected?.id===u.id}]" :aria-pressed="state.selected?.id===u.id"><strong>{{u.full_name}}</strong><span>{{u.email}}</span><span class="ac-meta">{{label(u.user_role)}} · {{label(u.account_status)}}</span><small>{{u.linked_staff?.full_name||'No linked staff profile'}}</small></button></div>
  <section class="ac-detail" aria-live="polite"><p v-if="!state.selected" class="ac-empty">Select an account to inspect its identity and access.</p><template v-else><h3>{{state.selected.full_name}}</h3><p class="ac-meta">{{state.selected.email}} · Last sign-in: {{state.selected.last_login_at ? new Date(state.selected.last_login_at).toLocaleString() : 'Not recorded'}}</p><p v-if="state.detailLoading">Loading account access…</p>
  <p v-if="!state.selected.medical_staff_id" class="ac-notice">This account has no linked staff profile. Actions scoped to “own” records are unavailable.</p>
  <form v-if="can('identity.users.manage')" @submit.prevent="save"><fieldset :disabled="state.busy||self"><legend>Identity and role</legend><div class="ac-form-grid"><label>Role<select v-model="draft.user_role"><option v-for="r in roles" :value="r">{{label(r)}}</option></select></label><label>Department<select v-model="draft.department_id"><option value="">No department</option><option v-for="d in departments" :value="d.id">{{d.name||d.department_name}}</option></select></label><label>Staff profile<select v-model="draft.medical_staff_id"><option value="">Unlinked</option><option v-for="s in staff" :value="s.id">{{s.full_name}}</option></select></label><label>Job title<input v-model="draft.job_title" maxlength="160"></label></div><button class="btn btn-primary" type="submit">Save identity</button></fieldset><p v-if="self" class="ac-meta">Another administrator must change your own identity and role.</p></form>
  <details open v-if="state.snapshot"><summary>Access by scope</summary><label>Inspect scope<select v-model="scope"><option value="department">Department</option><option value="own">Own records</option><option value="all">All records</option></select></label><p class="ac-meta">These decisions describe this scope. The server checks the actual record again for every action.</p><div class="ac-table-wrap"><table><thead><tr><th>Action</th><th>Decision</th><th>Visibility</th><th>Reason</th></tr></thead><tbody><tr v-for="p in decisions" :key="p.key"><td>{{p.label}}</td><td>{{p.decision?.decision||'DENY'}}</td><td>{{p.decision?.visibility||'none'}}</td><td>{{p.decision?.reason||'Required identity relationship is missing.'}}</td></tr></tbody></table></div></details>
  <details v-if="state.snapshot"><summary>Permission exceptions ({{state.snapshot.overrides?.length||0}})</summary><div v-for="o in state.snapshot.overrides" :key="o.id" class="ac-exception"><strong>{{o.permission_key}}</strong><p>{{o.effect}} · {{o.scope}} · {{o.visibility}}</p><p>{{o.reason}}</p><small>Expires: {{o.expires_at?new Date(o.expires_at).toLocaleString():'No expiry'}}</small><button v-if="can('identity.overrides.manage')&&!self" class="btn btn-secondary" :disabled="state.busy" @click="removeOverride(o)">Remove exception</button></div><form v-if="can('identity.overrides.manage')&&!self" @submit.prevent="setOverride"><fieldset :disabled="state.busy"><legend>Add or replace an exception</legend><div class="ac-form-grid"><label>Action<select required v-model="exception.permission_key"><option value="" disabled>Select action</option><option v-for="p in state.catalog" :value="p.key">{{p.label}}</option></select></label><label>Effect<select v-model="exception.effect"><option>deny</option><option>allow</option></select></label><label>Scope<select v-model="exception.scope"><option>own</option><option>department</option><option>all</option></select></label><label>Visibility<select v-model="exception.visibility"><option>summary</option><option>operational</option><option>full</option></select></label><label>Expiry (optional)<input type="datetime-local" v-model="exception.expires_at"></label><label>Reason<textarea required minlength="8" maxlength="1000" v-model="exception.reason"></textarea></label></div><button class="btn btn-primary">Save exception</button></fieldset></form></details>
  <details v-if="can('identity.users.lifecycle')&&!self"><summary>Account status</summary><label>Reason<textarea v-model="reason" maxlength="1000" placeholder="Explain the account status change"></textarea></label><div class="ac-actions"><button v-if="state.selected.account_status==='active'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('suspend')">Suspend</button><button v-if="state.selected.account_status==='active'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('lock')">Lock</button><button v-if="['suspended','locked','archived'].includes(state.selected.account_status)" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('reactivate')">Reactivate</button><button v-if="state.selected.account_status!=='archived'" class="btn btn-secondary" :disabled="state.busy" @click="lifecycle('archive')">Archive</button><button v-if="state.selected.account_status==='invited'&&state.invites&&can('identity.users.invite')" class="btn btn-secondary" :disabled="state.busy" @click="resend">Resend invitation</button></div></details>
  <details><summary>Account history</summary><p v-if="!state.events.length">No events recorded.</p><ol class="ac-history"><li v-for="e in state.events" :key="e.id"><strong>{{label(e.event_type)}}</strong><time>{{new Date(e.created_at).toLocaleString()}}</time><p v-if="e.reason">{{e.reason}}</p><small>Actor: {{state.users.find(u=>u.id===e.actor_user_id)?.full_name||e.actor_user_id||'System'}}</small></li></ol></details>
  </template></section></div>
  <details v-if="can('identity.users.invite')" class="ac-invite"><summary>Invite a colleague</summary><p v-if="!state.invites">Invitation delivery is disabled in this deployment.</p><form v-else @submit.prevent="invite"><fieldset :disabled="state.busy"><div class="ac-form-grid"><label>Staff profile<select required v-model="invitation.medical_staff_id"><option value="" disabled>Select staff member</option><option v-for="s in staff.filter(s=>!state.users.some(u=>u.medical_staff_id===s.id))" :value="s.id">{{s.full_name}}</option></select></label><label>Email (optional override)<input type="email" v-model="invitation.email"></label><label>Role<select v-model="invitation.user_role"><option v-for="r in roles" :value="r">{{label(r)}}</option></select></label><label>Department<select v-model="invitation.department_id"><option value="">Use staff department</option><option v-for="d in departments" :value="d.id">{{d.name||d.department_name}}</option></select></label></div><button class="btn btn-primary">Send invitation</button></fieldset></form></details>
</section>`
};
}
function createInvitation({Vue,API}) {
return {setup(){
 const token=Vue.ref(new URLSearchParams(window.location.search).get('invite_token')||'');
 const state=Vue.reactive({password:'',confirm:'',busy:false,error:'',done:false});
 if(token.value){const url=new URL(window.location.href);url.searchParams.delete('invite_token');history.replaceState({},'',url.pathname+url.search+url.hash)}
 async function submit(){if(state.password!==state.confirm){state.error='Passwords do not match.';return}state.busy=true;state.error='';try{await API.request('/api/auth/accept-invitation',{method:'POST',body:{token:token.value,new_password:state.password}});token.value='';state.password='';state.confirm='';state.done=true}catch(e){state.error=e.message}finally{state.busy=false}}
 return {token,state,submit};
},template:`<div v-if="token||state.done" class="ac-setup"><section class="ac-setup-card" aria-labelledby="setup-title"><h1 id="setup-title">Set up your Neumact account</h1><template v-if="state.done"><p role="status">Your account is active. You can now sign in.</p><button class="btn btn-primary" @click="state.done=false">Continue to sign in</button></template><form v-else @submit.prevent="submit"><p>Choose your password to accept the invitation.</p><p v-if="state.error" role="alert" class="ac-alert">{{state.error}}</p><label>Password<input type="password" autocomplete="new-password" minlength="10" required v-model="state.password"></label><label>Confirm password<input type="password" autocomplete="new-password" minlength="10" required v-model="state.confirm"></label><p class="ac-meta">Use at least 10 characters.</p><button class="btn btn-primary" :disabled="state.busy">{{state.busy?'Activating…':'Activate account'}}</button></form></section></div>`};
}
root.NeumAccess={allowed,hasPermission,canRecord,createSelfProfile,createCenter,createInvitation};
if(typeof module!=='undefined')module.exports=root.NeumAccess;
})(typeof window!=='undefined'?window:globalThis);
