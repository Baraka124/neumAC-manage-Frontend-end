/* Read-only operational review. Uses only records already authorized by the API. */
(function(root){'use strict';
const day=v=>String(v||'').slice(0,10);
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function findings({rotations=[],absences=[],oncall=[],date=today()}){
 const out=[];
 for(const r of rotations){
  if(r.rotation_status==='terminated_early'&&!r.actual_end_date)out.push({id:'date:'+r.id,kind:'Dates',view:'resident_rotations',title:'Actual rotation end is missing',detail:`Planned ${day(r.start_date)} to ${day(r.end_date)}. Review the actual end date; do not infer it from the planned end.`,subject:r.resident_id});
  if(['active','scheduled','extended'].includes(r.rotation_status)&&day(r.end_date)&&day(r.end_date)<date)out.push({id:'close:'+r.id,kind:'Lifecycle',view:'resident_rotations',title:'Rotation passed its planned end',detail:`Planned end ${day(r.end_date)}. Confirm completion or record an extension.`,subject:r.resident_id});
 }
 const active=absences.filter(a=>!['cancelled','returned_to_duty','completed'].includes(a.current_status));
 for(const shift of oncall.filter(s=>day(s.duty_date)===date))for(const id of new Set([shift.primary_physician_id,shift.resident_physician_id,shift.backup_physician_id].filter(Boolean))){
  const leave=active.find(a=>(a.staff_member_id===id||a.medical_staff_id===id||a.staff_id===id)&&day(a.start_date)<=date&&day(a.actual_return_date||a.end_date)>=date);
  if(leave)out.push({id:'coverage:'+shift.id+':'+id,kind:'Coverage',view:'oncall_schedule',title:'On-call assignment overlaps recorded leave',detail:`${date} · leave ${day(leave.start_date)} to ${day(leave.actual_return_date||leave.end_date)}. Review coverage before making a change.`,subject:id});
 }
 return out;
}
function profileChecks(p={}){return [{label:'Professional biography',ok:!!String(p.public_bio||'').trim()},{label:'Profile photograph',ok:!!p.public_photo_url},{label:'Professional email',ok:!!p.professional_email},{label:'ORCID',ok:!!p.orcid_id}];}
function publicationChecks(p={}){return [{label:'Title',ok:!!String(p.title||'').trim()},{label:'Public visibility selected',ok:p.is_public===true},{label:'Published status',ok:p.status==='published'},{label:'DOI (for publications)',ok:p.post_type!=='publication'||!!p.doi}];}
// Availability is independent of array length: failed and forbidden reads are not zero.
function sourceState(states,can,key){return !can(key,'read')?'restricted':(states?.[key]||'pending')}
const stateLabel=s=>({loading:'Updating…',pending:'Not loaded',restricted:'Restricted',unavailable:'Unavailable'})[s]||'Loaded';
function rosterBreakdown(staff,residentType){
 const residents=staff.filter(s=>residentType(s.staff_type)).length;
 const attending=staff.filter(s=>s.staff_type==='attending_physician'&&!residentType(s.staff_type)).length;
 return {attending,residents,other:staff.length-attending-residents};
}
function createSummary({Vue}){return {
 props:{staff:Array,rotations:Array,oncall:Array,research:Array,states:Object,residentType:Function,can:Function},emits:['navigate'],
 setup(p){const date=Vue.ref(today());const timer=setInterval(()=>date.value=today(),60000);Vue.onUnmounted(()=>clearInterval(timer));
 const cards=Vue.computed(()=>{
  const breakdown=rosterBreakdown(p.staff||[],p.residentType);
  const active=(p.rotations||[]).filter(r=>r.rotation_status==='active');
  const shifts=(p.oncall||[]).filter(s=>day(s.duty_date)===date.value);
  const cards=[
   {key:'medical_staff',title:'Medical staff',count:(p.staff||[]).length,detail:`${breakdown.attending} attending · ${breakdown.residents} residents${breakdown.other?' · '+breakdown.other+' other / unclassified':''}`,scope:'Visible roster · all returned statuses'},
   {key:'resident_rotations',title:'Active rotations',count:active.length,detail:'Recorded with active status',scope:'Visible rotation records'},
   {key:'oncall_schedule',title:'On-call today',count:shifts.length,detail:shifts.length?'Scheduled duty records':'No duty records in your visible schedule today',scope:'Scheduled records · not confirmed coverage'},
   {key:'research_lines',view:'research_hub',title:'Research lines',count:(p.research||[]).length,detail:'Lines available to your account',scope:'Visible research catalogue'}
  ];
  return cards.map(c=>({...c,state:sourceState(p.states,p.can,c.key)}));
 });return{cards,stateLabel};},
 template:`<section class="dbsr" aria-label="Visible record summary"><button type="button" class="dbsr-stat" v-for="c in cards" :key="c.key" :disabled="c.state==='restricted'" @click="$emit('navigate',c.view||c.key)"><span class="dbsr-lbl">{{c.title}}</span><span class="dbsr-num">{{c.state==='ready'?c.count:'—'}}</span><span class="dashboard4-detail">{{c.state==='ready'?c.detail:stateLabel(c.state)}}</span><span class="dashboard4-scope">{{c.state==='ready'?c.scope:c.state==='unavailable'?'Open the module to retry.':c.state==='restricted'?'Your access does not include these records.':'Waiting for this source.'}}</span><span class="dbsr-accent"></span></button></section>`
}}
function createReview({Vue}){return{
 props:{rotations:Array,absences:Array,oncall:Array,staff:Array,states:Object,can:Function},emits:['navigate'],
 setup(p){const date=Vue.ref(today());const timer=setInterval(()=>{date.value=today()},60000);Vue.onUnmounted(()=>clearInterval(timer));
 const ready=key=>sourceState(p.states,p.can,key)==='ready';
 const rotationReady=()=>ready('resident_rotations')&&p.states?.terminated_rotations==='ready';
 const overlapReady=()=>ready('staff_absence')&&ready('oncall_schedule');
 const rows=Vue.computed(()=>findings({rotations:rotationReady()?p.rotations:[],absences:overlapReady()?p.absences:[],oncall:overlapReady()?p.oncall:[],date:date.value}));
 const checks=Vue.computed(()=>[
  {label:'Rotation dates',ready:rotationReady(),state:!ready('resident_rotations')?sourceState(p.states,p.can,'resident_rotations'):(p.states?.terminated_rotations||'pending')},
  {label:'Today’s duty / leave overlaps',ready:overlapReady(),state:[sourceState(p.states,p.can,'staff_absence'),sourceState(p.states,p.can,'oncall_schedule')].find(s=>s!=='ready')||'ready'}
 ]);
 const expanded=Vue.ref(false);return{date,rows,checks,stateLabel,expanded,name:id=>p.staff?.find(s=>s.id===id)?.full_name||'Staff record'}},
 template:`<section class="review53" aria-labelledby="review53-title"><header><div><p class="ac-eyebrow">Record checks · {{date}}</p><h2 id="review53-title">Rotation dates & leave overlaps</h2><p>Two checks on accessible records. These do not assess staffing adequacy or overall departmental performance.</p></div><button v-if="rows.length" class="btn btn-secondary" @click="expanded=!expanded" :aria-expanded="expanded">{{expanded?'Hide details':'Review '+rows.length+' items'}}</button></header><div class="dashboard4-checks"><span v-for="check in checks" :key="check.label">{{check.label}} <strong>{{check.ready?'Checked':stateLabel(check.state)+' · not checked'}}</strong></span></div><p v-if="!rows.length" class="review53-clear">{{checks.some(c=>c.ready)?'No findings in the completed checks. Module reminders above cover different conditions.':'Checks will appear when their required records are available.'}}</p><div v-if="expanded&&rows.length" class="review53-list"><article v-for="r in rows" :key="r.id"><span class="ac-chip">{{r.kind}} · Review</span><h3>{{r.title}}</h3><strong>{{name(r.subject)}}</strong><p>{{r.detail}}</p><button class="ac-text-button" @click="$emit('navigate',r.view)">Open {{r.view==='oncall_schedule'?'on-call':'rotations'}} →</button></article></div></section>`}}
function createReadiness({Vue}){return {props:{record:Object,kind:String},setup(p){return{checks:Vue.computed(()=>p.kind==='profile'?profileChecks(p.record):publicationChecks(p.record))}},template:`<details class="readiness53"><summary>{{kind==='profile'?'Professional profile checklist':'Public publishing checklist'}}</summary><p>{{kind==='profile'?'These checks help you complete the profile. Public visibility is controlled separately.':'Review the record and its public preview before publishing. This checklist does not publish or certify the content.'}}</p><ul><li v-for="item in checks" :key="item.label"><span :class="{'is-ready':item.ok}">{{item.ok?'Present':'Review'}}</span>{{item.label}}</li></ul></details>`}}
const api={sourceState,rosterBreakdown,createSummary,findings,profileChecks,publicationChecks,createReview,createReadiness};root.NeumReview53=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
