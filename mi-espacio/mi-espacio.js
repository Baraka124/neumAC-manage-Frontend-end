/* neumDESK · Mi espacio · Phase 2. Existing-app Vue component, no separate application.
   Identity is verified (Phase 1); activity is the server-resolved, permission-scoped
   payload from /api/me/context. Nothing is inferred; empty is a valid answer. */
(function(root) {
  'use strict';
  const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  function fmtDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    return m ? Number(m[3]) + ' ' + (MONTHS[Number(m[2]) - 1] || '') : '';
  }
  function fmtDutyDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return '';
    return new Intl.DateTimeFormat('es-ES', {weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(d);
  }
  const PROFESSIONAL_TYPE = Object.freeze({
    medical_resident:'Médico/a residente', attending_physician:'Personal médico adjunto',
    biomedical_engineer:'Ingeniería biomédica', clinician:'Personal clínico',
    medical_staff:'Personal sanitario', resident:'Médico/a residente'
  });
  const EMPLOYMENT_STATUS = Object.freeze({
    active:'Activo/a', on_leave:'En excedencia', inactive:'Inactivo/a',
    sabbatical:'Sabático/a', retired:'Jubilado/a'
  });
  const AFFILIATION_TYPE = Object.freeze({
    primary:'Adscripción primaria', secondary:'Adscripción secundaria',
    external:'Personal externo', visiting:'Visitante'
  });
  const ABSENCE_REASON = Object.freeze({
    vacation:'Vacaciones', conference:'Congreso/Conferencia', sick_leave:'Baja médica',
    training:'Formación', personal:'Personal', other:'Otro'
  });
  const ABSENCE_STATUS = Object.freeze({
    planned_leave:'Programada', currently_absent:'Ausente ahora', returned_to_duty:'Finalizada', cancelled:'Cancelada'
  });
  function employmentLabel(v){return EMPLOYMENT_STATUS[v]||v||'';}
  function affiliationLabel(v){return AFFILIATION_TYPE[v]||v||'';}
  function absenceReasonLabel(v){return ABSENCE_REASON[v]||v||'';}
  function absenceStatusLabel(v){return ABSENCE_STATUS[v]||v||'';}

  function professionalType(value) {
    const key=String(value||'').trim();
    return PROFESSIONAL_TYPE[key] || key.replace(/_/g,' ');
  }
  function fmtPeriod(from,to) {
    const format=(value)=>{
      const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(value||''));
      if(!m)return '';
      const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
      if(d.getFullYear()!==Number(m[1])||d.getMonth()!==Number(m[2])-1||d.getDate()!==Number(m[3]))return '';
      return new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric'}).format(d);
    };
    const start=format(from),end=format(to);
    return start&&end ? (start===end?start:start+' – '+end) : start||end;
  }
  const GUARDIA = { primary:'Principal', backup:'Refuerzo', resident:'Residente' };
  const ROTATION = { resident:'Residente', supervisor:'Supervisión' };
  const STUDY = { PI:'IP', 'co-investigator':'Co-investigador', 'sub-investigator':'Sub-investigador' };
  const LINE = { coordinator:'Coordinación', member:'Miembro' };
  const PROJECT = { lead:'Responsable', 'co-investigator':'Co-investigador' };
  const ABSENCE = { planned_leave:'Programada', currently_absent:'Ausente ahora', returned_to_duty:'Finalizada', cancelled:'Cancelada' };
  const SUBJECT_LABELS = { guardia:'Guardia', rotation:'Rotación', absence:'Ausencia', line:'Línea', study:'Estudio', project:'Proyecto', publication:'Publicación', profile:'Perfil', other:'Otro' };
  const KIND_LABELS = { missing:'Falta algo', incorrect:'Dato incorrecto', authorship:'Autoría', schedule:'Discrepancia de horario', other:'Otro' };
  const REPORT_STATUS = { open:'Abierta', in_review:'En revisión', accepted:'Aceptada', rejected:'Rechazada' };
  const SUBJECT_OPTIONS = Object.keys(SUBJECT_LABELS).map(k => ({ value:k, label:SUBJECT_LABELS[k] }));
  const KIND_OPTIONS = Object.keys(KIND_LABELS).map(k => ({ value:k, label:KIND_LABELS[k] }));
  const REVIEW_FILTERS = [{ value:'open', label:'Abiertas' }, { value:'in_review', label:'En revisión' }, { value:'accepted', label:'Aceptadas' }, { value:'rejected', label:'Rechazadas' }];
  const EMPTY_BY_FILTER = { open:'abiertas', in_review:'en revisión', accepted:'aceptadas', rejected:'rechazadas' };
  const label = (map, key) => map[key] || (key || '');

  function createView({Vue,API}) {
    return {
      props: { active: Boolean, user: Object, canOpenView: Function },
      emits: ['navigate'],
      setup(props,{emit}) {
        const state=Vue.reactive({busy:false,error:'',context:null,activityBusy:false,activityError:'',activity:null,dutyMode:'overview',dutyIndex:null,researchGroup:'lines',researchIndex:null,publicationIndex:null,toolsOpen:false,researchExpanded:false,researchOpen:{lines:false,studies:false,projects:false},operationsOpen:{guardias:false,absences:false,supervision:false,rotations:false,otherRotations:false},publicationsExpanded:false,
          reports:[],report:{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:'',subject_id:'',subject_label:''},
          picker:{busy:false,items:[],forType:''},
          review:{can:false,busy:false,error:'',notice:'',filter:'open',items:[],acting:'',notes:{}},
          profile:{open:false,busy:false,saving:false,error:'',data:null,edit:null,photoUploading:false,certificates:[],certBusy:false},
          timeline:{busy:false,error:'',entries:[],expanded:false,filter:'all'},
          colleagues:{busy:false,error:'',items:[],search:'',open:false},
          dashboard:{busy:false,error:'',data:null},
          quickActions:false,
          notifications:{busy:false,error:'',items:[],open:false},
          calendar:{busy:false,error:'',month:'',events:[],open:false},
          digest:{busy:false,error:'',data:null,period:'week',open:false},
          cvExport:{busy:false},photoNudgeDismissed:false,dossierBusy:false});
        let seq=0, controller=null;
        const can = view => typeof props.canOpenView === 'function' && props.canOpenView(view);
        const linked=Vue.computed(()=>state.context?.linkState==='linked');
        const initials=Vue.computed(()=>String(state.context?.staff?.name||state.context?.account?.name||'')
          .split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase()||'·');
        const professionalDesignation=Vue.computed(()=>{
          const staff=state.context?.staff;
          return staff?.specialization || professionalType(staff?.staffType || state.context?.account?.role || '') || 'Cuenta institucional';
        });
        // ── Phase 22: identity visual upgrade — role badge + leadership summary ──
        const ROLE_LABELS=Object.freeze({department_head:'Jefe de servicio','Department Head':'Jefe de servicio',head_of_department:'Jefe de servicio',section_chief:'Jefe de sección',coordinator:'Coordinador/a',director:'Director/a',chief:'Jefe/a',supervisor:'Supervisor/a'});
        const roleBadge=Vue.computed(()=>{
          const role=state.context?.account?.role||'';
          return ROLE_LABELS[role]||'';
        });
        const upcomingGuardias=Vue.computed(()=>{
          const today=new Date();
          const localDate=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
          return (state.activity?.agenda?.guardias||[]).filter(g=>/^\d{4}-\d{2}-\d{2}$/.test(g.date)&&g.date>=localDate).slice().sort((a,b)=>a.date.localeCompare(b.date));
        });
        const personalRotations=Vue.computed(()=>(state.activity?.agenda?.rotations||[]).filter(r=>r.role==='resident'));
        const supervisedRotations=Vue.computed(()=>(state.activity?.agenda?.rotations||[]).filter(r=>r.role==='supervisor'));
        const otherRotations=Vue.computed(()=>(state.activity?.agenda?.rotations||[]).filter(r=>r.role!=='resident'&&r.role!=='supervisor'));
        const upcomingAbsenceDaysTotal=Vue.computed(()=>(state.activity?.agenda?.absences||[]).reduce((n,a)=>n+(a.daysAhead||0),0));
        const hasAgenda=Vue.computed(()=>!!((state.activity?.agenda?.guardias?.length||0)+(state.activity?.agenda?.rotations?.length||0)+(state.activity?.agenda?.absences?.length||0)));
        const hasResearch=Vue.computed(()=>!!((state.activity?.research?.lines?.length||0)+(state.activity?.research?.studies?.length||0)+(state.activity?.research?.projects?.length||0)));
        const hasPublicationOverflow=Vue.computed(()=>(state.activity?.publications?.items?.length||0)>3);
        const hasResearchOverflow=Vue.computed(()=>['lines','studies','projects'].some(k=>(state.activity?.research?.[k]?.length||0)>2));
        const showAgenda=Vue.computed(()=>hasAgenda.value || (!hasResearch.value && !(state.activity?.publications?.items?.length||0)));
        const personalContext=Vue.computed(()=>{
          const activity=state.activity;
          if(!activity)return [];
          const agenda=activity.agenda||{}, research=activity.research||{}, pubs=activity.publications||{};
          const items=[];
          const add=(n,singular,plural)=>{if(n>0)items.push(n+' '+(n===1?singular:plural));};
          add((agenda.guardias||[]).length,'guardia','guardias');
          add((agenda.rotations||[]).filter(r=>r.role==='resident').length,'rotación','rotaciones');
          add((agenda.rotations||[]).filter(r=>r.role==='supervisor').length,'supervisión','supervisiones');
          add((research.studies||[]).length,'estudio','estudios');
          add((research.projects||[]).length,'proyecto','proyectos');
          add((research.lines||[]).length,'línea de investigación','líneas de investigación');
          add((pubs.items||[]).length,'publicación','publicaciones');
          return items;
        });
        const personalContextPreview=Vue.computed(()=>personalContext.value.slice(0,3));
        const personalContextRemaining=Vue.computed(()=>Math.max(0,personalContext.value.length-3));
        // Evidence-led leadership lens: never determined from a name or an arbitrary KPI.
        const leadershipFocus=Vue.computed(()=>linked.value && hasResearch.value &&
          (['head_of_department','department_head'].includes(state.context?.account?.role) || leadershipRoles.value.length>=2));
        // Place the actual next confirmed clinical commitment first; otherwise
        // let verified research lead. Counts are never a proxy for urgency.
        const researchPriority=Vue.computed(()=>hasResearch.value && hasAgenda.value &&
          upcomingGuardias.value.length===0 && personalRotations.value.length===0 && supervisedRotations.value.length===0);
        function clear(){
          if(workspaceNav) workspaceState.value=workspaceNav.reset();
          ++calendarRequest; ++directoryRequest; ++profileRequest;
          profileBaseline.value=null;profileConfirm.value=false;profileNotice.value='';
          ++seq;
          if(controller)controller.abort();
          controller=null;
          state.context=null;state.error='';state.busy=false;
          state.activity=null;state.activityError='';state.activityBusy=false;state.toolsOpen=false;state.researchExpanded=false;state.researchOpen={lines:false,studies:false,projects:false};state.operationsOpen={guardias:false,absences:false,supervision:false,rotations:false,otherRotations:false};state.publicationsExpanded=false;state.dutyMode='overview';state.dutyIndex=null;state.researchGroup='lines';state.researchIndex=null;state.publicationIndex=null;
          state.reports=[];
          Object.assign(state.report,{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:'',subject_id:'',subject_label:''});
          Object.assign(state.picker,{busy:false,items:[],forType:''});
          Object.assign(state.review,{can:false,busy:false,error:'',notice:'',filter:'open',items:[],acting:'',notes:{}});
          Object.assign(state.profile,{open:false,busy:false,saving:false,error:'',data:null,edit:null,photoUploading:false,certificates:[],certBusy:false});
          Object.assign(state.timeline,{busy:false,error:'',entries:[],expanded:false,filter:'all'});
          Object.assign(state.colleagues,{busy:false,error:'',items:[],search:'',open:false});
          Object.assign(state.dashboard,{busy:false,error:'',data:null});
          state.quickActions=false;
          Object.assign(state.notifications,{busy:false,error:'',items:[],open:false});
          Object.assign(state.calendar,{busy:false,error:'',month:'',events:[],open:false});
          Object.assign(state.digest,{busy:false,error:'',data:null,period:'week',open:false});
          Object.assign(state.cvExport,{busy:false});
        }
        // ── Phase 15: profile panel ──
        const profileCompleteness=Vue.computed(()=>state.profile.data?.profileCompleteness ?? 0);
        const profilePhotoUrl=Vue.computed(()=>state.profile.data?.publicPhotoUrl || '');
        // Exactly one secondary workspace at a time; core activity stays authoritative.
        const workspaceNav=root.NeumMiEspacioWorkspace?.create?.() || null;
        const workspaceState=Vue.ref(workspaceNav?.get() || {view:'overview',workspace:null,detail:null,origin:null});
        let calendarRequest=0,directoryRequest=0,profileRequest=0;
        const profileBaseline=Vue.ref(null);
        const profileDirty=Vue.computed(()=>root.NeumMiEspacioData.profileChanged(state.profile.edit,profileBaseline.value));
        const profileErrors=Vue.reactive({});
        const profileConfirm=Vue.ref(false);
        const profileNotice=Vue.ref('');
        const profileActive=Vue.computed(()=>workspaceState.value.workspace==='profile'&&state.profile.open);
        function navigateWorkspace(e){const next=workspaceNav?.dispatch(e);if(next)workspaceState.value=next;return next;}
        const isContextWorkspace=Vue.computed(()=>workspaceState.value.view==='workspace' && ['calendar','directory','duties','research','publications'].includes(workspaceState.value.workspace));
        const selectedDate=Vue.computed(()=>workspaceState.value.workspace==='calendar'&&workspaceState.value.detail?.type==='date'?workspaceState.value.detail.id:'');
        const selectedDayEvents=Vue.computed(()=>state.calendar.events.filter(e=>selectedDate.value&&e.date===selectedDate.value));
        const selectedColleague=Vue.computed(()=>workspaceState.value.workspace==='directory'&&workspaceState.value.detail?.type==='staff' ?
          state.colleagues.items.find(c=>c.id===workspaceState.value.detail.id)||null:null);
        function closeSecondary(which){
          if(workspaceState.value.workspace===which)navigateWorkspace({type:'CLOSE'});
          if(which==='profile')state.profile.open=false;
          else if(which==='directory')state.colleagues.open=false;
          else if(which==='calendar')state.calendar.open=false;
          else if(which==='digest')state.digest.open=false;
          else if(which==='notifications')state.notifications.open=false;
        }
        function activateSecondary(which){
          const before=workspaceState.value, contextual=['calendar','directory','duties','research','publications'].includes(which);
          const fallback={calendar:'me-v26b-calendar-trigger',directory:'me-v26b-directory-trigger',research:'me-v26d-research-trigger',publications:'me-v26d-publications-trigger',duties:'me-v26g-duties-trigger'}[which]||'mi-espacio-title';
          const origin=contextual&&before.view==='overview' ? {
            focusId:document.activeElement?.id || fallback,scrollY:window.scrollY
          }:undefined;
          if(before.workspace==='profile' && which!=='profile' && (profileDirty.value||state.profile.saving||state.profile.photoUploading)){
            profileConfirm.value=true;
            Vue.nextTick(()=>document.querySelector('.me-v26c-discard-title')?.focus({preventScroll:true}));
            return false;
          }
          const next=navigateWorkspace({type:'OPEN_WORKSPACE',workspace:which,origin});
          if(before.dirty&&next===before)return false;
          if(which!=='duties' && before.workspace==='duties'){state.dutyMode='overview';state.dutyIndex=null;}
          if(which!=='profile')state.profile.open=false;
          if(which!=='directory')state.colleagues.open=false;
          if(which!=='calendar')state.calendar.open=false;
          if(which!=='digest')state.digest.open=false;
          if(which!=='notifications')state.notifications.open=false;
          Vue.nextTick(()=>{
            const selector=contextual?'.me-v26g-duty-title,.me-v26d-title,.me-v26b-workspace-title':
              {digest:'.me-v21-digest',notifications:'.me-v21-notifications'}[which]; // Profile unfolds in place, never scroll the page.
            const el=selector&&document.querySelector('.mi-espacio '+selector);
            if(el){el.scrollIntoView({behavior:'auto',block:'start'});if(contextual)el.focus({preventScroll:true});}
          });
          return true;
        }
        function returnToOverview(){
          const origin=workspaceState.value.origin,which=workspaceState.value.workspace;
          if(workspaceState.value.detail)navigateWorkspace({type:'BACK'});
          navigateWorkspace({type:'BACK'});
          if(which==='calendar')state.calendar.open=false;
          if(which==='directory')state.colleagues.open=false;
          if(which==='duties'){state.dutyMode='overview';state.dutyIndex=null;}
          Vue.nextTick(()=>{
            const fallback={calendar:'me-v26b-calendar-trigger',directory:'me-v26b-directory-trigger',research:'me-v26d-research-trigger',publications:'me-v26d-publications-trigger',duties:'me-v26g-duties-trigger'}[which]||'mi-espacio-title';
            const control=document.getElementById(origin?.focusId||'')||document.getElementById(fallback);
            if(Number.isFinite(origin?.scrollY))window.scrollTo({top:origin.scrollY,behavior:'auto'});
            control?.focus({preventScroll:true});
          });
        }
        function backContextDetail(){
          const detail=workspaceState.value.detail;if(!detail)return;
          navigateWorkspace({type:'BACK'});
          Vue.nextTick(()=>{
            const id=(detail.type==='date'?'me-v26b-day-':'me-v26b-staff-')+detail.id;
            (document.getElementById(id)||document.querySelector('.me-v26b-workspace-title'))?.focus({preventScroll:true});
          });
        }
        function selectCalendarDate(date){
          if(state.calendar.busy||!calendarDays.value.some(c=>c.day&&c.date===date))return;
          navigateWorkspace({type:'OPEN_DETAIL',detail:{type:'date',id:date}});
          Vue.nextTick(()=>document.querySelector('.mi-espacio .me-v26b-calendar-detail-title')?.focus({preventScroll:true}));
        }
        function selectColleague(person){
          if(!person?.id||!state.colleagues.items.some(c=>c.id===person.id))return;
          navigateWorkspace({type:'OPEN_DETAIL',detail:{type:'staff',id:person.id}});
          Vue.nextTick(()=>document.querySelector('.mi-espacio .me-v26b-staff-detail-title')?.focus({preventScroll:true}));
        }
        function toggleNotifications(){
          if(state.notifications.open){closeSecondary('notifications');return;}
          if(!activateSecondary('notifications'))return;state.notifications.open=true;
        }
        function cancelDiscard(){profileConfirm.value=false;}
        function discardProfile(){
          if(state.profile.saving||state.profile.photoUploading)return;
          profileConfirm.value=false;
          profileBaseline.value=null;
          state.profile.edit=null;
          state.profile.open=false;
          navigateWorkspace({type:'CLOSE',confirmDiscard:true});
          Vue.nextTick(()=>document.getElementById('me-v26c-profile-trigger')?.focus({preventScroll:true}));
        }
        function requestCloseProfile(){
          if(state.profile.saving||state.profile.photoUploading)return;
          if(profileDirty.value){profileConfirm.value=true;return;}
          state.profile.open=false;
          navigateWorkspace({type:'CLOSE'});
          Vue.nextTick(()=>document.getElementById('me-v26c-profile-trigger')?.focus({preventScroll:true}));
        }
        async function openProfile(){
          if(state.profile.open && state.profile.data) return;
          if(!activateSecondary('profile'))return;
          state.profile.open=true;state.profile.busy=true;state.profile.error='';
          const ticket=++profileRequest,requestSeq=seq, identity=String(props.user?.id||'');
          try {
            const [profile, certs]=await Promise.all([
              root.NeumMiEspacioData.loadProfile((p,o)=>API.request(p,o),controller&&controller.signal),
              root.NeumMiEspacioData.loadMyCertificates((p,o)=>API.request(p,o),controller&&controller.signal)
            ]);
            if(ticket!==profileRequest||requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity||!linked.value)return;
            state.profile.data=profile;
            state.profile.certificates=certs;
            state.profile.edit=root.NeumMiEspacioData.profileDraft(profile);
            profileBaseline.value=root.NeumMiEspacioData.profileDraft(profile);
            profileNotice.value='';
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            if(err?.name!=='AbortError') state.profile.error=err?.message||'No se ha podido cargar tu perfil.';
          } finally { if(requestSeq===seq) state.profile.busy=false; }
        }
        function focusProfileEditor(){
          if(!profileActive.value||!state.profile.edit)return;
          Vue.nextTick(()=>{
            const el=document.querySelector('.mi-espacio .me-v34-edit-heading');
            el?.scrollIntoView({behavior:'auto',block:'start'});
            el?.focus({preventScroll:true});
          });
        }
        function closeProfile(){requestCloseProfile();}
        async function saveProfile(){
          if(!linked.value||!state.profile.edit||!state.profile.data?.id||state.profile.saving)return;
          Object.keys(profileErrors).forEach(k=>delete profileErrors[k]);
          const validation=root.NeumMiEspacioData.validateProfileDraft(state.profile.edit);
          if(!validation.valid){
            Object.assign(profileErrors,validation.errors);
            state.profile.error='Revisa los campos señalados.';
            Vue.nextTick(()=>document.querySelector('.me-v26c-profile .me-field [aria-invalid="true"]')?.focus());
            return;
          }
          if(!profileDirty.value){profileNotice.value='No hay cambios pendientes.';return;}
          const ticket=++profileRequest,requestSeq=seq,identity=String(props.user?.id||'');
          const same=()=>ticket===profileRequest&&requestSeq===seq&&props.active&&linked.value&&
            String(props.user?.id||'')===identity&&profileActive.value;
          const submitted={...validation.fields};
          state.profile.saving=true;state.profile.error='';profileNotice.value='';
          try{
            await root.NeumMiEspacioData.updateProfile((p,o)=>API.request(p,o),submitted,state.profile.data.id,controller&&controller.signal);
            if(!same())return;
            // A committed write must not be repeated if the follow-up read fails.
            profileBaseline.value={...submitted};
            state.profile.edit={...submitted};
            navigateWorkspace({type:'SAVE_SUCCESS'});
            try{
              const profile=await root.NeumMiEspacioData.loadProfile((p,o)=>API.request(p,o),controller&&controller.signal);
              if(!same())return;
              state.profile.data=profile;
              state.profile.edit=root.NeumMiEspacioData.profileDraft(profile);
              profileBaseline.value=root.NeumMiEspacioData.profileDraft(profile);
              profileNotice.value='Cambios guardados y perfil actualizado.';
            }catch(readErr){
              if(same())profileNotice.value='Cambios guardados. No se pudo actualizar la vista; vuelve a cargar el perfil.';
            }
          }catch(err){
            if(same()&&err?.name!=='AbortError')state.profile.error=err?.message||'No se ha podido guardar.';
          }finally{if(same())state.profile.saving=false;}
        }
        async function onPhotoSelect(event){
          const file=event?.target?.files?.[0];
          if(!file) return;
          state.profile.photoUploading=true;state.profile.error='';
          const requestSeq=seq, identity=String(props.user?.id||'');
          try {
            const result=await root.NeumMiEspacioData.uploadPhoto(
              (p,o)=>API.request(p,o), file, controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            if(result?.url && state.profile.data) state.profile.data.publicPhotoUrl=result.url;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            if(err?.name!=='AbortError') state.profile.error=err?.message||'No se ha podido subir la foto.';
          } finally {
            if(requestSeq===seq) state.profile.photoUploading=false;
            if(event?.target) event.target.value='';
          }
        }
        // ── Phase 19: notification preferences ──
        async function toggleNotifPref(key){
          if(!state.profile.data) return;
          const prefs=state.profile.data.notificationPrefs;
          const newVal=!prefs[key];
          prefs[key]=newVal;
          const apiKey=key==='notificationsEnabled'?'notifications_enabled':key==='absenceNotifications'?'absence_notifications':'announcement_notifications';
          try { await root.NeumMiEspacioData.updateNotificationPrefs((p,o)=>API.request(p,o),{[apiKey]:newVal},controller&&controller.signal); }
          catch(err){ prefs[key]=!newVal; }
        }
        // Phase 35: leadership must only reflect an explicitly assigned PI,
        // Co-PI, project lead or line coordinator. Co-investigator is distinct
        // from Co-IP and must never be promoted by presentation logic.
        const leadershipRoleKey=role=>String(role||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_');
        const leadershipRoles=Vue.computed(()=>{
          const roles=[];
          const a=state.activity;
          if(!a)return roles;
          const isCoPi=r=>['co_pi','copi','co_principal_investigator'].includes(leadershipRoleKey(r));
          (a.research?.studies||[]).forEach(s=>{
            if(leadershipRoleKey(s.role)==='pi') roles.push({type:'study',label:'IP',name:s.title});
            else if(isCoPi(s.role)) roles.push({type:'study',label:'Co-IP',name:s.title});
          });
          (a.research?.projects||[]).forEach(p=>{
            if(leadershipRoleKey(p.role)==='lead') roles.push({type:'project',label:'Responsable',name:p.title});
            else if(isCoPi(p.role)) roles.push({type:'project',label:'Co-IP',name:p.title});
          });
          (a.research?.lines||[]).forEach(l=>{
            if(l.role==='coordinator') roles.push({type:'line',label:'Coordinador/a',name:l.name});
          });
          return roles;
        });
        const leadershipCount=Vue.computed(()=>leadershipRoles.value.length);
        // ── Phase 19: public profile preview ──
        const publicPreview=Vue.computed(()=>{
          const d=state.profile.data;
          if(!d) return null;
          return {name:d.fullName,title:d.title,department:d.department?.name,specialization:d.specialization,bio:d.publicBio,orcid:d.orcidId,scholar:d.scholarUrl,researchgate:d.researchgateUrl,photo:d.publicPhotoUrl};
        });
        // ── Phase 20: completeness wizard — missing fields with scroll-to hints ──
        const missingFields=Vue.computed(()=>state.profile.data?.missingFields || []);
        const completenessHint=Vue.computed(()=>{
          const m=missingFields.value;
          if(!m.length) return '';
          if(m.length===1) return 'Solo falta: '+m[0].label;
          return 'Faltan '+m.length+' datos: '+m.slice(0,3).map(f=>f.label).join(', ')+(m.length>3?'…':'');
        });
        function scrollToField(key){
          const map={photo:'.me-v15-photo-upload-label',bio:'#me-profile-bio',phone:'#me-profile-phone',orcid:'#me-profile-orcid',scholar:'#me-profile-scholar',researchgate:'#me-profile-rg'};
          const sel=map[key];
          if(!sel)return;
          if(!state.profile.open) openProfile();
          Vue.nextTick(()=>{
            const el=document.querySelector('.mi-espacio '+sel);
            if(el){el.scrollIntoView({block:'center',behavior:'smooth'});try{el.focus();}catch(_){}}
          });
        }
        // ── Phase 20: activity timeline filtering ──
        const TIMELINE_FILTERS=Object.freeze([
          {value:'all',label:'Todo'},
          {value:'research',label:'Investigación'},
          {value:'clinical',label:'Clínico'},
          {value:'training',label:'Formación'}
        ]);
        const RESEARCH_RESOURCES=new Set(['clinical_trials','studies','innovation_projects','projects','research_lines','publications','publication_authors']);
        const CLINICAL_RESOURCES=new Set(['medical_staff','on_call','rotations','absence_records','staff_certificates']);
        const TRAINING_RESOURCES=new Set(['staff_certificates']);
        const filteredTimeline=Vue.computed(()=>{
          const f=state.timeline.filter;
          if(f==='all') return state.timeline.entries;
          const set=f==='research'?RESEARCH_RESOURCES:f==='clinical'?CLINICAL_RESOURCES:TRAINING_RESOURCES;
          return state.timeline.entries.filter(e=>set.has(e.resource)||set.has(e.resourceId));
        });
        // ── Phase 20: quick actions ──
        const quickActionItems=Vue.computed(()=>{
          const items=[];
          if(linked.value){
            items.push({id:'profile',label:'Editar perfil',icon:'✏️'});
            items.push({id:'report',label:'Comunicar discrepancia',icon:'📋'});
            items.push({id:'claim',label:'Reivindicar publicación',icon:'📄'});
          }
          if(can('absence_management')) items.push({id:'absence',label:'Solicitar ausencia',icon:'🗓️'});
          if(can('certificates_management')) items.push({id:'certs',label:'Certificados',icon:'📜'});
          if(can('oncall_schedule')) items.push({id:'oncall',label:'Cuadrante de guardias',icon:'🏥'});
          return items;
        });
        function doQuickAction(id){
          state.quickActions=false;
          if(id==='profile') openProfile();
          else if(id==='report') openReportForm();
          else if(id==='claim') claimPublication();
          else if(id==='absence') emit('navigate','absence_management');
          else if(id==='certs') openProfile();
          else if(id==='oncall') emit('navigate','oncall_schedule');
        }
        // ── Phase 20: colleague directory ──
        async function loadColleagues(){
          if(!activateSecondary('directory'))return;
          if(state.colleagues.items.length){state.colleagues.open=true;return;}
          state.colleagues.open=true;state.colleagues.busy=true;state.colleagues.error='';
          const ticket=++directoryRequest,requestSeq=seq,identity=String(props.user?.id||'');
          const current=()=>ticket===directoryRequest&&requestSeq===seq&&props.active&&linked.value&&
            String(props.user?.id||'')===identity&&workspaceState.value.workspace==='directory';
          try{
            const items=await root.NeumMiEspacioData.loadColleagues((p,o)=>API.request(p,o),controller&&controller.signal);
            if(!current())return;
            state.colleagues.items=items;
            if(workspaceState.value.detail?.type==='staff' &&
              !items.some(c=>c.id===workspaceState.value.detail.id))navigateWorkspace({type:'BACK'});
          }catch(err){
            if(current()&&err?.name!=='AbortError')state.colleagues.error=err?.message||'No se ha podido cargar el directorio.';
          }finally{if(ticket===directoryRequest&&requestSeq===seq)state.colleagues.busy=false;}
        }
        const filteredColleagues=Vue.computed(()=>{
          const q=state.colleagues.search.toLowerCase().trim();
          if(!q) return state.colleagues.items;
          return state.colleagues.items.filter(c=>(c.name+' '+c.department+' '+c.specialization).toLowerCase().includes(q));
        });
        // ── Phase 20: personal dashboard ──
        async function loadDashboardData(requestSeq, identity){
          state.dashboard.busy=true;state.dashboard.error='';
          try {
            const data=await root.NeumMiEspacioData.loadDashboard((p,o)=>API.request(p,o),controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            state.dashboard.data=data;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            if(err?.name!=='AbortError') state.dashboard.error=err?.message||'No se han podido cargar las métricas.';
          } finally { if(requestSeq===seq) state.dashboard.busy=false; }
        }
        // ── Phase 21: Notifications, Calendar, CV Export, Digest ──
        const notificationBadge=Vue.computed(()=>(state.notifications.items||[]).filter(n=>n.severity==='error'||n.severity==='warning').length);

        // ── Phase 23B: 7-day upcoming events strip ──
        const upcomingEvents=Vue.computed(()=>{
          const events=[];
          const now=new Date();
          const today=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
          const in7=new Date(now.getTime()+7*86400000);
          const in7str=[in7.getFullYear(),String(in7.getMonth()+1).padStart(2,'0'),String(in7.getDate()).padStart(2,'0')].join('-');
          // Next guardia
          const guardias=(state.activity?.agenda?.guardias||[]).filter(g=>/^\d{4}-\d{2}-\d{2}$/.test(g.date)&&g.date>=today&&g.date<=in7str).sort((a,b)=>a.date.localeCompare(b.date));
          if(guardias.length){
            events.push({icon:'🩺',title:'Guardia',date:guardias[0].date,urgency:guardias[0].date===today?'warning':''});
          }
          // Next absence
          const absences=(state.activity?.agenda?.absences||[]).filter(a=>a.start&&a.end&&a.end>=today&&a.start<=in7str).sort((a,b)=>a.start.localeCompare(b.start));
          if(absences.length){
            const a0=absences[0];
            events.push({icon:'🏖️',title:a0.current?'Ausente ahora':(absenceReasonLabel(a0.reason)||'Ausencia'),date:a0.current?today:a0.start,urgency:''});
          }
          // Cert expiring soon (within 7 days)
          const urgentCerts=(state.notifications.items||[]).filter(n=>(n.type==='cert_expired'||n.type==='cert_expiring')&&n.date&&n.date>=today&&n.date<=in7str);
          if(urgentCerts.length){
            events.push({icon:'📜',title:urgentCerts[0].message||'Certificado',date:urgentCerts[0].date,urgency:'warning'});
          }
          // Next oncall from notifications
          const oncalls=(state.notifications.items||[]).filter(n=>n.type==='oncall_upcoming'&&n.date&&n.date>=today&&n.date<=in7str).sort((a,b)=>a.date.localeCompare(b.date));
          if(oncalls.length && !guardias.length){
            events.push({icon:'🔔',title:'Guardia programada',date:oncalls[0].date,urgency:oncalls[0].date===today?'warning':''});
          }
          events.sort((a,b)=>a.date.localeCompare(b.date));
          return events;
        });
        // ── Phase 23C: Photo onboarding nudge ──
        const showPhotoNudge=Vue.computed(()=>linked.value && !profilePhotoUrl.value && !state.profile.open && !state.photoNudgeDismissed);

        async function loadNotifications(requestSeq, identity){
          state.notifications.busy=true;state.notifications.error='';
          try {
            const items=await root.NeumMiEspacioData.loadNotifications((p,o)=>API.request(p,o),controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            state.notifications.items=items;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id||'')!==identity)return;
            if(err?.name!=='AbortError') state.notifications.error=err?.message||'Error cargando notificaciones.';
          } finally { if(requestSeq===seq) state.notifications.busy=false; }
        }

        function currentMonth(){
          const n=new Date();return n.getFullYear()+'-'+String(n.getMonth()+1).padStart(2,'0');
        }
        async function openCalendar(month){
          if(!state.calendar.open&&!activateSecondary('calendar'))return;
          const m=month||state.calendar.month||currentMonth();
          if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(m))return;
          if(selectedDate.value)navigateWorkspace({type:'BACK'});
          state.calendar.open=true;state.calendar.busy=true;state.calendar.error='';
          state.calendar.events=[];state.calendar.month=m;
          const ticket=++calendarRequest,requestSeq=seq,identity=String(props.user?.id||'');
          const current=()=>ticket===calendarRequest&&requestSeq===seq&&props.active&&linked.value&&
            String(props.user?.id||'')===identity&&workspaceState.value.workspace==='calendar'&&state.calendar.month===m;
          try{
            const result=await root.NeumMiEspacioData.loadCalendar((p,o)=>API.request(p,o),controller&&controller.signal,m);
            if(current())state.calendar.events=result.events;
          }catch(err){
            if(current()&&err?.name!=='AbortError')state.calendar.error=err?.message||'Error cargando calendario.';
          }finally{if(ticket===calendarRequest&&requestSeq===seq)state.calendar.busy=false;}
        }
        function calendarPrev(){ const [y,m]=state.calendar.month.split('-').map(Number); const pm=m===1?12:m-1; const py=m===1?y-1:y; openCalendar(py+'-'+String(pm).padStart(2,'0')); }
        function calendarNext(){ const [y,m]=state.calendar.month.split('-').map(Number); const nm=m===12?1:m+1; const ny=m===12?y+1:y; openCalendar(ny+'-'+String(nm).padStart(2,'0')); }
        const calendarMonthLabel=Vue.computed(()=>{
          if(!state.calendar.month)return '';
          const [y,m]=state.calendar.month.split('-').map(Number);
          const names=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
          return names[m-1]+' '+y;
        });
        const localToday=Vue.computed(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');});
        const calendarDays=Vue.computed(()=>{
          if(!state.calendar.month)return [];
          const [y,m]=state.calendar.month.split('-').map(Number);
          const daysInMonth=new Date(y,m,0).getDate();
          const firstDow=(new Date(y,m-1,1).getDay()+6)%7; // Mon=0
          const grid=[];
          for(let i=0;i<firstDow;i++) grid.push({day:0,date:'',events:[]});
          for(let d=1;d<=daysInMonth;d++){
            const ds=state.calendar.month+'-'+String(d).padStart(2,'0');
            grid.push({day:d,date:ds,events:state.calendar.events.filter(e=>e.date===ds)});
          }
          return grid;
        });

        async function openDigest(period){
          if(!state.digest.open&&!activateSecondary('digest'))return;
          const p=period||state.digest.period||'week';
          state.digest.open=true;state.digest.busy=true;state.digest.error='';state.digest.period=p;
          try {
            const data=await root.NeumMiEspacioData.loadDigest((p2,o)=>API.request(p2,o),controller&&controller.signal,p);
            state.digest.data=data;
          } catch(err){
            if(err?.name!=='AbortError') state.digest.error=err?.message||'Error cargando resumen.';
          } finally { state.digest.busy=false; }
        }

        const RESOURCE_LABELS_DIGEST=Object.freeze({
          medical_staff:'Perfil',staff_certificates:'Certificados',discrepancy_reports:'Comunicaciones',
          absence_records:'Ausencias',on_call:'Guardias',rotations:'Rotaciones',
          research_lines:'Líneas I+D',studies:'Estudios',projects:'Proyectos',publications:'Publicaciones',app_users:'Cuenta'
        });
        function digestResourceLabel(r){ return RESOURCE_LABELS_DIGEST[r]||r.replace(/_/g,' '); }

        async function exportCV(){
          state.cvExport.busy=true;
          try {
            const profile=state.profile.data;
            const activity=state.activity;
            const certs=state.profile.certificates||[];
            const dash=state.dashboard.data;
            let lines=[];
            lines.push('CURRÍCULUM VITAE');
            lines.push('═'.repeat(40));
            if(profile){
              lines.push('');
              lines.push('NOMBRE: '+(profile.fullName||''));
              if(profile.title) lines.push('TÍTULO: '+profile.title);
              if(profile.specialization) lines.push('ESPECIALIDAD: '+profile.specialization);
              if(profile.department) lines.push('DEPARTAMENTO: '+profile.department);
              if(profile.publicBio) { lines.push(''); lines.push('BIOGRAFÍA:'); lines.push(profile.publicBio); }
              if(profile.orcidId) lines.push('ORCID: '+profile.orcidId);
              if(profile.scholarUrl) lines.push('Google Scholar: '+profile.scholarUrl);
              if(profile.researchgateUrl) lines.push('ResearchGate: '+profile.researchgateUrl);
            }
            if(dash){
              lines.push('');lines.push('MÉTRICAS ACTUALES');lines.push('─'.repeat(30));
              if(dash.activeStudies) lines.push('Estudios activos: '+dash.activeStudies);
              if(dash.activeProjects) lines.push('Proyectos activos: '+dash.activeProjects);
              if(dash.publications) lines.push('Publicaciones: '+dash.publications);
              if(dash.totalCertificates) lines.push('Certificados: '+dash.totalCertificates);
            }
            if(activity?.research?.lines?.length){
              lines.push('');lines.push('LÍNEAS DE INVESTIGACIÓN');lines.push('─'.repeat(30));
              activity.research.lines.forEach(l=>lines.push('• '+l.name+(l.subArea?' ('+l.subArea+')':'')));
            }
            if(activity?.research?.studies?.length){
              lines.push('');lines.push('ESTUDIOS CLÍNICOS');lines.push('─'.repeat(30));
              activity.research.studies.forEach(s=>lines.push('• '+s.title+(s.role?' — '+label(STUDY,s.role):'')));
            }
            if(activity?.research?.publications?.length){
              lines.push('');lines.push('PUBLICACIONES');lines.push('─'.repeat(30));
              activity.research.publications.forEach(p=>lines.push('• '+p.title+(p.year?' ('+p.year+')':'')));
            }
            if(certs.length){
              lines.push('');lines.push('CERTIFICACIONES');lines.push('─'.repeat(30));
              certs.forEach(c=>lines.push('• '+c.name+(c.expiryDate?' — Expira: '+c.expiryDate:'')));
            }
            lines.push('');lines.push('Generado desde Mi Espacio — '+new Date().toLocaleDateString('es-ES'));
            const text=lines.join('\n');
            const blob=new Blob([text],{type:'text/plain;charset=utf-8'});
            const url=URL.createObjectURL(blob);
            const a=document.createElement('a');
            a.href=url;a.download='cv-'+(profile?.fullName||'profesional').toLowerCase().replace(/\s+/g,'-')+'.txt';
            document.body.appendChild(a);a.click();document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch(err){
            console.error('CV export failed:',err);
          } finally { state.cvExport.busy=false; }
        }

        // ── Phase 23D: PDF institutional dossier export ──
        async function exportDossier(){
          state.dossierBusy=true;
          try {
            const profile=state.profile.data;
            const activity=state.activity;
            const dash=state.dashboard.data;
            const certs=state.profile.certificates||[];
            const name=profile?.fullName||'Profesional';
            const now=new Date();
            const dateStr=now.toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});
            // Build HTML for PDF
            const photoHtml=profile?.publicPhotoUrl?'<img src="'+profile.publicPhotoUrl+'" style="width:90px;height:90px;border-radius:50%;object-fit:cover;border:3px solid #158a89">':'<div style="width:90px;height:90px;border-radius:50%;background:linear-gradient(135deg,#158a89,#0d6b6a);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700">'+initials.value+'</div>';
            let html='<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Dossier — '+name+'</title>';
            html+='<style>@page{size:A4;margin:20mm 18mm}body{font-family:Helvetica,Arial,sans-serif;color:#183c49;font-size:11pt;line-height:1.5;margin:0;padding:0}';
            html+='.header{display:flex;align-items:center;gap:20px;padding-bottom:16px;border-bottom:3px solid #158a89;margin-bottom:20px}';
            html+='.header-info h1{font-size:22pt;margin:0 0 2px;color:#183c49}.header-info p{margin:2px 0;font-size:10pt;color:#60747d}';
            html+='.badge{display:inline-block;background:#158a89;color:#fff;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600;margin-top:4px}';
            html+='.section{margin-bottom:18px}.section h2{font-size:13pt;color:#158a89;border-bottom:1px solid #e0e8eb;padding-bottom:4px;margin:0 0 8px}';
            html+='.metrics{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}.metric{flex:1 1 100px;text-align:center;background:#f0f7f7;border-radius:8px;padding:10px 8px}';
            html+='.metric .val{font-size:22pt;font-weight:800;color:#158a89;display:block}.metric .lbl{font-size:8pt;color:#60747d}';
            html+='ul{margin:4px 0;padding-left:18px}li{margin-bottom:3px}';
            html+='.footer{text-align:center;font-size:8pt;color:#999;margin-top:30px;border-top:1px solid #e0e8eb;padding-top:8px}';
            html+='.header{border-bottom:1px solid #b8c9ce;padding-bottom:20px;margin-bottom:24px}.header-info h1{font-size:24pt;font-weight:600;letter-spacing:-.5pt}.header-info p{font-size:11pt;color:#405963}.section{margin-bottom:22px}.section h2{font-size:14pt;font-weight:600;color:#183c49;break-after:avoid}li{margin-bottom:8px;break-inside:avoid;overflow-wrap:anywhere}p{overflow-wrap:anywhere}.metric .val{font-weight:600}.metric .lbl,.footer{font-size:9pt}.footer{color:#60747d}.header,.metrics{break-inside:avoid}';
            html+='</style></head><body>';
            // Header
            html+='<div class="header">'+photoHtml+'<div class="header-info"><h1>'+name+'</h1>';
            if(profile?.title) html+='<p><strong>'+profile.title+'</strong></p>';
            if(profile?.specialization) html+='<p>'+profile.specialization+'</p>';
            if(profile?.department?.name) html+='<p>'+profile.department.name+' — CHUAC</p>';
            if(roleBadge.value) html+='<span class="badge">'+roleBadge.value+'</span>';
            html+='</div></div>';
            // Metrics
            const metrics=[];
            if(dash?.piStudies||dash?.piProjects) metrics.push({val:(dash.piStudies||0)+(dash.piProjects||0),lbl:'IP / Responsable'});
            if(dash?.hIndex) metrics.push({val:dash.hIndex,lbl:'Índice h'});
            if(dash?.publications) metrics.push({val:dash.publications,lbl:'Publicaciones'});
            if(dash?.activeStudies) metrics.push({val:dash.activeStudies,lbl:'Estudios activos'});
            if(dash?.activeProjects) metrics.push({val:dash.activeProjects,lbl:'Proyectos activos'});
            if(metrics.length){
              html+='<div class="metrics">';
              metrics.forEach(m=>{html+='<div class="metric"><span class="val">'+m.val+'</span><span class="lbl">'+m.lbl+'</span></div>';});
              html+='</div>';
            }
            // Bio
            if(profile?.publicBio){html+='<div class="section"><h2>Perfil profesional</h2><p>'+profile.publicBio+'</p></div>';}
            // Research identifiers
            const ids=[];
            if(profile?.orcidId) ids.push('ORCID: '+profile.orcidId);
            if(profile?.scholarUrl) ids.push('Google Scholar: '+profile.scholarUrl);
            if(profile?.researchgateUrl) ids.push('ResearchGate: '+profile.researchgateUrl);
            if(ids.length){html+='<div class="section"><h2>Identificadores de investigación</h2><ul>'+ids.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>';}
            // Leadership roles
            const lr=leadershipRoles.value;
            if(lr.length){html+='<div class="section"><h2>Roles de liderazgo</h2><ul>'+lr.map(r=>'<li><strong>'+r.label+'</strong> — '+r.name+'</li>').join('')+'</ul></div>';}
            // Research lines
            if(activity?.research?.lines?.length){html+='<div class="section"><h2>Líneas de investigación</h2><ul>'+activity.research.lines.map(l=>'<li>'+l.name+(l.subArea?' ('+l.subArea+')':'')+(l.role?' — '+label(LINE,l.role):'')+'</li>').join('')+'</ul></div>';}
            // Studies
            if(activity?.research?.studies?.length){html+='<div class="section"><h2>Estudios clínicos</h2><ul>'+activity.research.studies.map(s=>'<li>'+s.title+(s.role?' — '+label(STUDY,s.role):'')+(s.code?' · '+s.code:'')+'</li>').join('')+'</ul></div>';}
            // Projects
            if(activity?.research?.projects?.length){html+='<div class="section"><h2>Proyectos de innovación</h2><ul>'+activity.research.projects.map(p=>'<li>'+p.title+(p.role?' — '+label(PROJECT,p.role):'')+(p.stage?' · '+p.stage:'')+'</li>').join('')+'</ul></div>';}
            // Publications
            if(activity?.publications?.items?.length){html+='<div class="section"><h2>Publicaciones</h2><ul>'+activity.publications.items.map(p=>'<li>'+p.title+(p.byline?' <small>'+p.byline+'</small>':'')+'</li>').join('')+'</ul></div>';}
            // Certificates
            if(certs.length){html+='<div class="section"><h2>Certificaciones</h2><ul>'+certs.map(c=>'<li>'+c.name+(c.expiryDate?' — Expira: '+c.expiryDate:'')+'</li>').join('')+'</ul></div>';}
            // Footer
            html+='<div class="footer">Dossier generado desde neumDESK — Mi Espacio · '+dateStr+'</div>';
            html+='</body></html>';
            // Print to PDF via new window
            const w=window.open('','_blank','width=800,height=1000');
            if(w){w.document.write(html);w.document.close();setTimeout(()=>{w.print();},400);}
          } catch(err){
            console.error('Dossier export failed:',err);
          } finally { state.dossierBusy=false; }
        }

        // ── Phase 18: research summary from activity data ──
        const researchSummary=Vue.computed(()=>{
          const items=[];
          const activity=state.activity;
          if(!activity)return items;
          const c=activity.counts||{};
          if(c.lines) items.push({label:'Líneas de investigación',value:c.lines});
          if(c.studies) items.push({label:'Estudios',value:c.studies});
          if(c.projects) items.push({label:'Proyectos',value:c.projects});
          if(c.publications) items.push({label:'Publicaciones registradas',value:c.publications});
          return items;
        });
        const scientificParticipation=Vue.computed(()=>root.NeumMiEspacioData.buildScientificParticipation(state.activity));
        const scientificHistoryOpen=Vue.ref(false);
        // ── Phase 16: certificate urgency helpers ──
        const urgentCertificates=Vue.computed(()=>(state.profile.certificates||[]).filter(c=>c.urgency==='expired'||c.urgency==='expiring_soon'));
        const certUrgencyLabel=c=>{
          if(c.urgency==='expired') return 'Caducado';
          if(c.urgency==='expiring_soon'){
            const d=c.daysUntilExpiry;
            return d<=0?'Caduca hoy':d===1?'Caduca mañana':'Caduca en '+d+' días';
          }
          return '';
        };
        // ── Phase 16: personal activity timeline ──
        async function loadTimeline(requestSeq, identity){
          state.timeline.busy=true;state.timeline.error='';
          try {
            const entries=await root.NeumMiEspacioData.loadMyActivity((p,o)=>API.request(p,o),controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.timeline.entries=entries;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            if(err?.name!=='AbortError') state.timeline.error=err?.message||'No se ha podido cargar tu actividad reciente.';
          } finally { if(requestSeq===seq) state.timeline.busy=false; }
        }
        function fmtRelative(iso){
          if(!iso)return '';
          const d=new Date(iso), now=new Date(), diffMs=now-d;
          if(isNaN(d.getTime()))return '';
          const mins=Math.floor(diffMs/60000);
          if(mins<1)return 'Ahora mismo';
          if(mins<60)return 'Hace '+mins+' min';
          const hours=Math.floor(mins/60);
          if(hours<24)return 'Hace '+hours+(hours===1?' hora':' horas');
          const days=Math.floor(hours/24);
          if(days<7)return 'Hace '+days+(days===1?' día':' días');
          return fmtDate(iso);
        }
        async function loadReports(requestSeq, identity){
          try {
            const rows=await root.NeumMiEspacioData.loadMyReports((p,o)=>API.request(p,o),controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.reports=rows;
          } catch(err){ if(err?.name!=='AbortError'){/* non-fatal: the list simply stays empty */} }
        }
        function openReportForm(){
          state.toolsOpen=true;state.report.open=true;state.report.done=false;state.report.error='';
          focusDuty('#me-report-subject');
        }
        // When the subject is a line or a publication, load the pickable options
        // so the claim carries a real subject_id (the server then auto-links on accept).
        async function onSubjectTypeChange(){
          const requestSeq=seq, identity=String(props.user?.id||'');
          const stillCurrent=()=>requestSeq===seq && props.active && String(props.user?.id||'')===identity;
          const t=state.report.subject_type;
          state.report.subject_id='';state.report.subject_label='';
          if(t!=='line'&&t!=='publication'){ state.picker.items=[];state.picker.forType=''; return; }
          if(state.picker.forType===t&&state.picker.items.length) return;
          state.picker.busy=true;state.picker.forType=t;state.picker.items=[];
          try {
            const loader=t==='line'?root.NeumMiEspacioData.loadLineOptions:root.NeumMiEspacioData.loadPublicationOptions;
            const items=await loader((p,o)=>API.request(p,o),controller&&controller.signal);
            if(stillCurrent()&&state.report.subject_type===t) state.picker.items=items;
          } catch(err){ if(stillCurrent()&&state.report.subject_type===t) state.picker.items=[]; }
          finally { if(stillCurrent()&&state.report.subject_type===t) state.picker.busy=false; }
        }
        function onSubjectPick(){
          const opt=state.picker.items.find(o=>o.id===state.report.subject_id);
          state.report.subject_label=opt?opt.label:'';
        }
        function claimPublication(){
          openReportForm();
          state.report.subject_type='publication';state.report.kind='authorship';
          onSubjectTypeChange();
        }
        async function submitReport(){
          const requestSeq=seq, identity=String(props.user?.id||'');
          const stillCurrent=()=>requestSeq===seq && props.active && String(props.user?.id||'')===identity;
          const f=state.report;
          if(!f.subject_type||!f.kind){ f.error='Indica sobre qué y qué ocurre.'; return; }
          if((f.subject_type==='line'||f.subject_type==='publication')&&!f.subject_id){ f.error='Elige cuál de la lista.'; return; }
          f.busy=true;f.error='';
          try {
            await root.NeumMiEspacioData.submitDiscrepancy(
              (p,o)=>API.request(p,o),{subject_type:f.subject_type,kind:f.kind,message:f.message,subject_id:f.subject_id,subject_label:f.subject_label},controller&&controller.signal);
            if(!stillCurrent())return;
            f.done=true;f.open=false;f.subject_type='';f.kind='';f.message='';f.subject_id='';f.subject_label='';
            state.picker.items=[];state.picker.forType='';
            loadReports(seq, String(props.user?.id||''));
          } catch(err){ if(stillCurrent()&&err?.name!=='AbortError')f.error=err?.message||'No se ha podido enviar la comunicación.'; }
          finally { if(stillCurrent())f.busy=false; }
        }
        // Reviewer queue — only probed when the account carries review authority
        // (admin_level ≥ 1, the same threshold the server enforces). A 403 means
        // "not a reviewer": the section stays hidden. The server remains the sole
        // arbiter; this hint only avoids a needless request for every clinician.
        async function loadReviewQueue(requestSeq, identity){
          if(!(Number(props.user&&props.user.admin_level) >= 1)) return;
          state.review.busy=true;state.review.error='';
          try {
            const items=await root.NeumMiEspacioData.loadReviewQueue(
              (p,o)=>API.request(p,o), state.review.filter, controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.review.can=true;state.review.items=items;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            if(err?.name==='AbortError')return;
            if(err?.status===403){ state.review.can=false;state.review.items=[]; return; }
            state.review.can=true;state.review.error=err?.message||'No se ha podido cargar la cola de revisión.';
          } finally { if(requestSeq===seq)state.review.busy=false; }
        }
        function setReviewFilter(value){
          if(state.review.filter===value)return;
          state.review.filter=value;state.review.notice='';
          loadReviewQueue(seq, String(props.user?.id||''));
        }
        function openPendingReviews(){
          if(!state.review.can || state.review.filter!=='open' || !state.review.items.length)return;
          state.toolsOpen=true;
          focusDuty('.me-review h3');
        }
        async function resolveItem(reportId, status){
          const requestSeq=seq, identity=String(props.user?.id||'');
          const stillCurrent=()=>requestSeq===seq && props.active && String(props.user?.id||'')===identity;
          if(state.review.acting)return;
          state.review.acting=reportId;state.review.error='';state.review.notice='';
          try {
            const result=await root.NeumMiEspacioData.resolveReport(
              (p,o)=>API.request(p,o), reportId, {status, resolution_note:state.review.notes[reportId]||''}, controller&&controller.signal);
            if(!stillCurrent())return;
            const outcome=root.NeumMiEspacioData.reviewOutcome(result,status);
            state.review.notice=outcome.message;
            delete state.review.notes[reportId];
            await loadReviewQueue(seq, String(props.user?.id||''));
            if(status==='accepted' && !outcome.needsAttention && (result.linked==='line_member' || result.linked==='publication_author')){
              await loadActivity(seq, String(props.user?.id||''));
            }
          } catch(err){ if(stillCurrent()&&err?.name!=='AbortError')state.review.error=err?.message||'No se ha podido actualizar la comunicación.'; }
          finally { if(stillCurrent())state.review.acting=''; }
        }
        async function loadActivity(requestSeq, identity){
          state.activityBusy=true;state.activityError='';
          try {
            const result=await root.NeumMiEspacioData.loadActivity(
              (path,options)=>API.request(path,options),controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.activity=result;
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            if(err?.name==='AbortError')return;
            state.activityError=err?.message||'No se ha podido cargar tu actividad en este momento.';
          } finally {if(requestSeq===seq)state.activityBusy=false;}
        }
        async function load(){
          clear();
          if(!props.active||!props.user?.id)return;
          const requestSeq=seq, identity=String(props.user.id);
          controller=new AbortController();
          state.busy=true;
          try {
            const result=await root.NeumMiEspacioData.loadContext(
              (path,options)=>API.request(path,options),identity,controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.context=result;
            if(result.linkState==='linked'){ loadActivity(requestSeq, identity); loadReports(requestSeq, identity); loadTimeline(requestSeq, identity); loadDashboardData(requestSeq, identity); loadNotifications(requestSeq, identity); }
            loadReviewQueue(requestSeq, identity);
          } catch(err){
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            if(err?.name==='AbortError')return;
            state.error=err?.message||'No se ha podido verificar tu identidad.';
          } finally {if(requestSeq===seq)state.busy=false;}
        }
        Vue.watch(()=>[props.active,props.user?.id],([active,id],previous)=>{
          const [wasActive,oldId]=Array.isArray(previous)?previous:[];
          if(!active||!id){clear();return;}
          if(!wasActive||id!==oldId)load();
        },{immediate:true});
        Vue.onUnmounted(clear);
        // Phase 6A: read-only duty details always stay in Mi espacio.
        const selectedDuty=Vue.computed(()=>{
          const entries=state.activity?.agenda?.guardias || [];
          return Number.isInteger(state.dutyIndex) ? (entries[state.dutyIndex] || null) : null;
        });
        function focusDuty(selector) {
          Vue.nextTick(()=>{
            const node=document.querySelector('.mi-espacio '+selector);
            if(!node)return;
            try {node.focus({preventScroll:true});} catch(_){node.focus();}
            // Avoid scrolling content that is already visible.
            const rect=node.getBoundingClientRect();
            if(rect.top<96 || rect.bottom>window.innerHeight-18){
              node.scrollIntoView({block:'nearest',behavior:'instant'});
            }
          });
        }
        function openDuties(index) {
          if(!linked.value||!state.activity||!activateSecondary('duties'))return;
          state.dutyMode='duties';
          state.dutyIndex=null;
          const entries=state.activity.agenda.guardias;
          if(Number.isInteger(index)&&index>=0&&index<entries.length)selectDuty(index);
        }
        function selectDuty(index) {
          const entries=state.activity?.agenda?.guardias || [];
          if(!linked.value||workspaceState.value.workspace!=='duties'||!Number.isInteger(index)||index<0||index>=entries.length)return;
          if(state.dutyIndex===index){closeDutyDetail();return;}
          state.dutyIndex=index;
          // The index is scoped to the already authorized /api/me/context array; never fetch a staff-wide record.
          navigateWorkspace({type:'OPEN_DETAIL',detail:{type:'duty',id:String(index)}});
          Vue.nextTick(()=>document.querySelector('.mi-espacio .me-v26g-duty-detail h4')?.focus({preventScroll:true}));
        }
        function closeDutyDetail(){
          const index=state.dutyIndex;
          if(workspaceState.value.workspace==='duties'&&workspaceState.value.detail?.type==='duty')navigateWorkspace({type:'BACK'});
          state.dutyIndex=null;
          if(Number.isInteger(index))focusDuty('.me-v26g-duty-row[data-index="'+index+'"]');
        }
        function backToAgenda(){
          if(workspaceState.value.workspace==='duties'){returnToOverview();return;}
          state.dutyMode='overview';state.dutyIndex=null;focusDuty('.me-v9-agenda-title');
        }
        // Phase 6B: personal, read-only portfolio; never navigates out of Mi espacio.
        const researchGroups=Object.freeze([
          {id:'lines',label:'Líneas'}, {id:'studies',label:'Estudios'}, {id:'projects',label:'Proyectos'}
        ]);
        const researchItems=Vue.computed(()=>state.activity?.research?.[state.researchGroup] || []);
        const selectedResearch=Vue.computed(()=>{
          const items=researchItems.value;
          return Number.isInteger(state.researchIndex)?items[state.researchIndex] || null:null;
        });
        const selectedPublication=Vue.computed(()=>{
          const items=state.activity?.publications?.items || [];
          return Number.isInteger(state.publicationIndex)?items[state.publicationIndex] || null:null;
        });
        const researchRecordTitle=r=>String(r?.name || r?.title || '');
        const researchRecordMeta=r=>{
          if(!r)return '';
          if(state.researchGroup==='lines')return r.number?'L'+r.number:'';
          if(state.researchGroup==='studies')return [r.code?'Protocolo: '+r.code:'', 'Estado: '+root.NeumMiEspacioData.participationStatus(r.status)].filter(Boolean).join(' · ');
          return 'Etapa: '+root.NeumMiEspacioData.participationStatus(r.stage);
        };
        const researchRecordRole=r=>{
          if(!r)return '';
          const dict=state.researchGroup==='lines'?LINE:state.researchGroup==='studies'?STUDY:PROJECT;
          return label(dict,r.role);
        };
        function changeResearchGroup(group){
          if(!researchGroups.some(g=>g.id===group))return;
          state.researchGroup=group;state.researchIndex=null;
        }
        function selectResearch(index){
          if(!Number.isInteger(index)||index<0||index>=researchItems.value.length)return;
          if(state.researchIndex===index){closeResearch();return;}
          state.researchIndex=index; // Reveal contextual metadata below the selected record.
        }
        function closeResearch(){
          const index=state.researchIndex;state.researchIndex=null;
          Vue.nextTick(()=>{
            const node=document.querySelector('.mi-espacio .me-portfolio-entry[data-index="'+index+'"]');
            if(node)node.focus({preventScroll:true});
          });
        }
        function selectPublication(index){
          const items=state.activity?.publications?.items || [];
          if(!Number.isInteger(index)||index<0||index>=items.length)return;
          if(state.publicationIndex===index){closePublication();return;}
          state.publicationIndex=index;
        }
        function closePublication(){
          const index=state.publicationIndex;state.publicationIndex=null;
          focusDuty('.me-publication-entry[data-index="'+index+'"]');
        }
        function openPortfolio(which){
          if(!linked.value||!state.activity||!['research','publications'].includes(which))return;
          activateSecondary(which);
        }
        function closePortfolio(){
          const which=workspaceState.value.workspace;
          if(!['research','publications'].includes(which))return;
          returnToOverview();
        }
        // Phase 28E: preserve the clicked disclosure's viewport position after Vue patches.
        // Read-only presentation behavior only; no data, navigation or authorization changes.
        function anchorInlineDisclosure(event){
          const target=event.target;
          const control=target?.closest?.('.me-v28-disclosure-toggle,.me-v28-profile-toggle');
          if(!control||!event.currentTarget?.contains(control))return;
          const before=control.getBoundingClientRect().top;
          // A microtask lets the bubble handler schedule Vue's render before nextTick.
          Promise.resolve().then(()=>Vue.nextTick(()=>{
            if(!control.isConnected)return;
            const delta=control.getBoundingClientRect().top-before;
            if(Math.abs(delta)>1)window.scrollBy({top:delta,behavior:'auto'});
          }));
        }
        function onEscape(event){
          // Only nested personal disclosures; keep global shell shortcuts untouched.
          const target=event.target;
          if(!target || typeof target.closest!=='function')return;
          if(profileConfirm.value && target.closest('.me-v26c-confirm')){cancelDiscard();event.stopPropagation();return;}
          if(isContextWorkspace.value&&workspaceState.value.detail&&target.closest('.me-v26b-workspace')){
            backContextDetail();event.stopPropagation();return;
          }
          if(target.closest('.me-v26g-duties') && selectedDuty.value){closeDutyDetail();event.stopPropagation();}
          else if(target.closest('.me-duty-list') && selectedDuty.value){closeDutyDetail();event.stopPropagation();}
          else if(target.closest('.me-publication-layout') && selectedPublication.value){closePublication();event.stopPropagation();}
          else if(target.closest('.me-portfolio:not(.me-publications)') && selectedResearch.value){closeResearch();event.stopPropagation();}
        }
        return {
          state,linked,initials,can,refresh:load,selectedDuty,
          professionalDesignation,roleBadge,leadershipCount,upcomingGuardias,personalRotations,supervisedRotations,otherRotations,hasAgenda,hasResearch,hasResearchOverflow,hasPublicationOverflow,showAgenda,researchPriority,personalContext,personalContextPreview,personalContextRemaining,leadershipFocus,fmtPeriod,
          profileCompleteness,profilePhotoUrl,openProfile,closeProfile,saveProfile,onPhotoSelect,
          profileActive,profileDirty,profileConfirm,profileErrors,profileNotice,cancelDiscard,discardProfile,focusProfileEditor,
          researchSummary,scientificParticipation,scientificHistoryOpen,employmentLabel,affiliationLabel,absenceReasonLabel,absenceStatusLabel,upcomingAbsenceDaysTotal,
          toggleNotifPref,leadershipRoles,publicPreview,
          missingFields,completenessHint,scrollToField,
          TIMELINE_FILTERS,filteredTimeline,
          quickActionItems,doQuickAction,
          loadColleagues,filteredColleagues,toggleNotifications,closeSecondary,
          workspaceState,isContextWorkspace,selectedDate,selectedDayEvents,selectedColleague,
          selectCalendarDate,selectColleague,backContextDetail,returnToOverview,
          notificationBadge,upcomingEvents,showPhotoNudge,openCalendar,calendarPrev,calendarNext,calendarMonthLabel,calendarDays,localToday,
          openDigest,digestResourceLabel,exportCV,exportDossier,
          urgentCertificates,certUrgencyLabel,fmtRelative,
          openDuties,selectDuty,closeDutyDetail,backToAgenda,fmtDutyDate,openPortfolio,closePortfolio,
          dutyShift:root.NeumMiEspacioData.formatDutyShift,
          researchGroups,researchItems,selectedResearch,selectedPublication,
          researchRecordTitle,researchRecordMeta,researchRecordRole,
          changeResearchGroup,selectResearch,closeResearch,selectPublication,closePublication,onEscape,anchorInlineDisclosure,
          navigate:view=>can(view)&&emit('navigate',view),
          fmtDate,
          guardiaRole:k=>label(GUARDIA,k), rotationRole:k=>label(ROTATION,k),
          studyRole:k=>label(STUDY,k), lineRole:k=>label(LINE,k), projectRole:k=>label(PROJECT,k),
          absenceStatus:k=>label(ABSENCE,k),
          subjectLabel:k=>label(SUBJECT_LABELS,k), kindLabel:k=>label(KIND_LABELS,k), reportStatus:k=>label(REPORT_STATUS,k),
          subjectOptions:SUBJECT_OPTIONS, kindOptions:KIND_OPTIONS,
          openReportForm, submitReport, onSubjectTypeChange, onSubjectPick, claimPublication,
          reviewFilters:REVIEW_FILTERS, setReviewFilter, resolveItem, openPendingReviews,
          emptyLabel:f=>EMPTY_BY_FILTER[f]||'por revisar'
        };
      },
      template: `
      <section class="mi-espacio mi-espacio--v8 mi-espacio--v9" :class="{'me-v25-leadership':leadershipFocus,'me-v34-research-only':hasResearch && !showAgenda,'me-v34-clinical-first':hasAgenda && !hasResearch,'me-v34-mixed':hasAgenda && hasResearch,'me-v34-no-work':!hasAgenda && !hasResearch}" aria-labelledby="mi-espacio-title" @keydown.esc="onEscape" @click.capture="anchorInlineDisclosure">
        <header class="mi-espacio-head me-v9-accessible-head"><h2 id="mi-espacio-title" tabindex="-1">Mi espacio</h2></header>
        <p v-if="state.busy" class="mi-espacio-state" role="status">Verificando tu perfil…</p>
        <div v-else-if="state.error" class="mi-espacio-notice" role="alert">{{state.error}} <button type="button" @click="refresh">Reintentar</button></div>
        <template v-else-if="state.context">
          <div v-if="state.context.testSession" class="mi-espacio-notice" role="status">Sesión de prueba. Verifica la identidad de esta cuenta.</div>
          <section class="mi-espacio-person me-v9-identity me-v15-identity me-v19-identity me-v22-identity" aria-label="Identidad institucional verificada">
            <div class="me-v22-identity-top">
              <button type="button" class="me-v15-avatar-btn me-v19-avatar-btn me-v22-avatar-btn" :class="{'has-photo':profilePhotoUrl}" @click="linked && openProfile()" :aria-label="linked?'Ver y editar mi perfil':''" :disabled="!linked">
                <img v-if="profilePhotoUrl" :src="profilePhotoUrl" alt="" class="me-v15-avatar-img me-v19-avatar-img me-v22-avatar-img">
                <span v-else class="mi-espacio-avatar me-v19-avatar me-v22-avatar" aria-hidden="true">{{initials}}</span>
              </button>
              <div class="mi-espacio-person-main">
                <div class="me-v9-name-line me-v22-name-line">
                  <h3>{{state.context.staff?.name || state.context.account.name}}</h3>
                  <span class="mi-espacio-link-state" :class="linked?'is-linked':'is-unlinked'"><span v-if="linked" aria-hidden="true">✓</span> {{linked?'Perfil vinculado':state.context.linkState==='unlinked'?'Vinculación pendiente':'Vinculación no disponible'}}</span>
                </div>
                <div class="me-v22-role-line">
                  <span v-if="roleBadge" class="me-v22-role-badge">{{roleBadge}}</span>
                  <span class="me-v22-designation">{{professionalDesignation}}</span>
                </div>
                <p class="mi-espacio-person-email">{{state.context.staff?.professionalEmail || state.context.account.email}}</p>
              </div>
              <div class="me-v28-identity-actions">
                <button v-if="linked" id="me-v26c-profile-trigger" type="button" class="me-v15-profile-link me-v22-profile-link me-v28-profile-toggle" :aria-expanded="profileActive" aria-controls="me-v28-profile-panel" @click="profileActive?closeProfile():openProfile()">
                  <span>Perfil profesional</span><svg class="me-v28-chevron" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
                <button type="button" class="mi-espacio-refresh me-v9-refresh" :disabled="state.busy" @click="refresh">Actualizar</button>
              </div>
            </div>
            <div v-if="(state.activity && personalContext.length) || leadershipCount" class="me-v22-identity-meta">
              <div v-if="state.activity && personalContext.length" class="me-v22-context-pills" aria-label="Actividad profesional vinculada">
                <span v-for="(item,i) in personalContextPreview" :key="i" class="me-v22-context-pill">{{item}}</span>
                <span v-if="personalContextRemaining" class="me-v22-context-more">+{{personalContextRemaining}} áreas vinculadas</span>
              </div>
              <div v-if="leadershipCount" class="me-v22-leadership-summary">
                <span>{{leadershipCount}} {{leadershipCount===1?'rol de liderazgo':'roles de liderazgo'}}</span>
              </div>
            </div>
            <!-- Phase 28A: the authorized profile stays inside its identity surface. -->
            <section v-if="profileActive && linked" id="me-v28-profile-panel" class="me-v15-profile-panel me-v26c-profile me-v28-inline-profile" aria-label="Perfil profesional">
            <div class="me-v15-profile-head">
              <div><h3 class="me-v26c-title" tabindex="-1">Perfil profesional</h3><p>Trayectoria profesional y participación registrada.</p><button v-if="state.profile.edit && !state.profile.busy" type="button" class="me-v34-edit-shortcut" @click="focusProfileEditor">Editar información <span aria-hidden="true">↗</span></button></div>
              <button type="button" class="me-v15-profile-close" @click="closeProfile" aria-label="Volver a Mi espacio">← Volver</button>
            </div>
            <p v-if="state.profile.busy" class="mi-espacio-state" role="status">Cargando perfil…</p>
            <p v-if="state.profile.error" class="me-form-error" role="alert">{{state.profile.error}}</p>
            <div v-if="profileConfirm" class="me-v26c-confirm" role="group" aria-labelledby="me-v26c-discard-title"><h4 id="me-v26c-discard-title" class="me-v26c-discard-title" tabindex="-1">Cambios sin guardar</h4><p>Si sales ahora, perderás los cambios del formulario.</p><button type="button" @click="cancelDiscard">Seguir editando</button><button type="button" @click="discardProfile">Descartar y salir</button></div>
            <template v-else-if="state.profile.data && state.profile.edit">

              <section v-if="scientificParticipation.total" class="me-v15-readonly-section me-v35-participation" aria-labelledby="me-v35-participation-title">
                <div class="me-v35-heading"><h4 id="me-v35-participation-title">Actividad científica y clínica</h4><p>Participación vinculada a los registros autorizados del departamento.</p></div>
                <ul v-if="scientificParticipation.current.length" class="me-v35-records">
                  <li v-for="item in scientificParticipation.current" :key="item.key" class="me-v35-record">
                    <span class="me-v35-kind">{{item.kind}}</span>
                    <strong>{{item.title}}</strong>
                    <span class="me-v35-record-meta">{{item.role}} <span aria-hidden="true">·</span> {{item.status}}</span>
                    <small v-if="item.protocol">Protocolo: {{item.protocol}}</small>
                  </li>
                </ul>
                <p v-else class="me-v8-quiet">No constan actividades en curso vinculadas a este perfil.</p>
                <div v-if="scientificParticipation.history.length" class="me-v35-history">
                  <button type="button" class="me-v35-history-toggle" :aria-expanded="scientificHistoryOpen" aria-controls="me-v35-history-records" @click="scientificHistoryOpen=!scientificHistoryOpen">
                    <span>Participación finalizada <small>{{scientificParticipation.history.length}}</small></span>
                    <svg class="me-v28-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <ul v-if="scientificHistoryOpen" id="me-v35-history-records" class="me-v35-records">
                    <li v-for="item in scientificParticipation.history" :key="item.key" class="me-v35-record">
                      <span class="me-v35-kind">{{item.kind}}</span><strong>{{item.title}}</strong>
                      <span class="me-v35-record-meta">{{item.role}} <span aria-hidden="true">·</span> {{item.status}}</span>
                      <small v-if="item.protocol">Protocolo: {{item.protocol}}</small>
                    </li>
                  </ul>
                </div>
              </section>
              <details class="me-v15-readonly-section me-v34-institutional-details">
                <summary class="me-v34-institutional-summary"><span>Datos institucionales</span><span class="me-v34-institutional-hint">Consultar información registrada</span><svg class="me-v28-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
                <dl class="me-v15-dl">
                  <div><dt>Nombre</dt><dd>{{state.profile.data.fullName}}</dd></div>
                  <div v-if="state.profile.data.title"><dt>Título</dt><dd>{{state.profile.data.title}}</dd></div>
                  <div><dt>Categoría</dt><dd>{{professionalDesignation}}</dd></div>
                  <div v-if="state.profile.data.department"><dt>Departamento</dt><dd>{{state.profile.data.department.name}}</dd></div>
                  <div v-if="state.profile.data.specialization"><dt>Especialización</dt><dd>{{state.profile.data.specialization}}</dd></div>
                  <div v-if="state.profile.data.primaryClinic"><dt>Consulta principal</dt><dd>{{state.profile.data.primaryClinic}}</dd></div>
                  <div v-if="state.profile.data.yearsExperience !== null"><dt>Años de experiencia</dt><dd>{{state.profile.data.yearsExperience}}</dd></div>
                  <div v-if="state.profile.data.trainingYear"><dt>Año formativo</dt><dd>{{state.profile.data.trainingYear}}</dd></div>
                  <div v-if="state.profile.data.trainingLevel"><dt>Nivel formativo</dt><dd>{{state.profile.data.trainingLevel}}</dd></div>
                  <div v-if="state.profile.data.residencyStartDate"><dt>Inicio residencia</dt><dd>{{fmtDate(state.profile.data.residencyStartDate)}}</dd></div>
                  <div v-if="state.profile.data.residentCategory"><dt>Categoría MIR</dt><dd>{{state.profile.data.residentCategory}}</dd></div>
                  <div v-if="state.profile.data.residentType"><dt>Tipo residente</dt><dd>{{state.profile.data.residentType}}</dd></div>
                  <div v-if="state.profile.data.academicDegree"><dt>Titulación</dt><dd>{{state.profile.data.academicDegree}}</dd></div>
                  <div v-if="state.profile.data.hasPhd"><dt>Doctorado</dt><dd>{{state.profile.data.phdField || 'Sí'}}</dd></div>
                  <div v-if="state.profile.data.hasMedicalLicense"><dt>Licencia médica</dt><dd>{{state.profile.data.medicalLicense || 'Sí'}}</dd></div>
                  <div v-if="state.profile.data.employmentStatus && state.profile.data.employmentStatus !== 'active'"><dt>Estado laboral</dt><dd>{{employmentLabel(state.profile.data.employmentStatus)}}</dd></div>
                  <div v-if="state.profile.data.affiliationType && state.profile.data.affiliationType !== 'primary'"><dt>Adscripción</dt><dd>{{affiliationLabel(state.profile.data.affiliationType)}}</dd></div>
                  <div v-if="state.profile.data.primaryDeptName"><dt>Servicio de origen</dt><dd>{{state.profile.data.primaryDeptName}}</dd></div>
                </dl>
              </details>
              <div v-if="state.profile.data.canBePi || state.profile.data.canBeCoi || state.profile.data.canSuperviseResidents" class="me-v15-readonly-section me-v18-capabilities">
                <h4>Capacidades reconocidas</h4>
                <ul class="me-v18-cap-list">
                  <li v-if="state.profile.data.canBePi"><span class="me-v18-cap-check" aria-hidden="true">✓</span> Puede ser IP</li>
                  <li v-if="state.profile.data.canBeCoi"><span class="me-v18-cap-check" aria-hidden="true">✓</span> Puede ser Co-IP</li>
                  <li v-if="state.profile.data.canSuperviseResidents"><span class="me-v18-cap-check" aria-hidden="true">✓</span> Puede supervisar residentes</li>
                </ul>
              </div>
              <div v-if="leadershipRoles.length" class="me-v15-readonly-section me-v19-leadership">
                <h4>Roles de liderazgo activos</h4>
                <ul class="me-v19-leadership-list">
                  <li v-for="(r,i) in leadershipRoles" :key="i"><span class="me-v19-role-badge">{{r.label}}</span> <span class="me-v19-role-name">{{r.name}}</span></li>
                </ul>
              </div>
              <div class="me-v15-completeness me-v20-completeness" role="meter" :aria-valuenow="profileCompleteness" aria-valuemin="0" aria-valuemax="100" :aria-label="'Perfil completo al '+profileCompleteness+'%'">
                <div class="me-v15-completeness-bar"><div class="me-v15-completeness-fill" :style="{width:profileCompleteness+'%'}" :class="{'me-v20-complete':profileCompleteness>=100}"></div></div>
                <span class="me-v15-completeness-label">{{profileCompleteness}}% completo</span>
                <p v-if="profileCompleteness>=100" class="me-v20-completeness-done">¡Perfil completo!</p>
                <div v-else-if="missingFields.length" class="me-v20-missing-hints">
                  <p class="me-v20-missing-title">{{completenessHint}}</p>
                  <div class="me-v20-missing-tags">
                    <button v-for="f in missingFields" :key="f.key" type="button" class="me-v20-missing-tag" @click="scrollToField(f.key)">{{f.label}} <span aria-hidden="true">→</span></button>
                  </div>
                </div>
              </div>
              <form id="me-v34-profile-edit" class="me-v15-edit-section" @submit.prevent="saveProfile" :aria-busy="state.profile.saving">
                <h4 class="me-v34-edit-heading" tabindex="-1">Datos editables</h4>
                <div class="me-v15-photo-section me-v38-photo-tools" aria-label="Fotografía del perfil">
                  <div class="me-v15-photo-actions">
                    <span class="me-v38-photo-label">Fotografía profesional</span>
                    <label class="me-v15-photo-upload-label" :class="{disabled:state.profile.photoUploading}">
                      {{state.profile.photoUploading?'Subiendo…':'Cambiar imagen'}}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="me-v15-photo-input" @change="onPhotoSelect" :disabled="state.profile.photoUploading">
                    </label>
                    <small>Se actualiza al seleccionarla · JPEG, PNG, WEBP o GIF · Máx. 8 MB.</small>
                  </div>
                </div>
                <p class="me-v26c-edit-hint">Solo los campos de esta sección pueden modificarse desde Mi Espacio. El correo profesional es administrativo.</p>
                <div class="me-field me-field-readonly"><label>Correo profesional</label><span class="me-readonly-value">{{state.profile.data?.professionalEmail || '—'}}</span><small class="me-readonly-hint">Solo modificable por administración</small></div>
                <div class="me-field"><label for="me-profile-phone">Teléfono móvil</label><input id="me-profile-phone" type="tel" v-model="state.profile.edit.mobile_phone" maxlength="40"></div>
                <div class="me-field me-field-wide"><label for="me-profile-bio">Biografía pública</label><textarea id="me-profile-bio" v-model="state.profile.edit.public_bio" rows="3" maxlength="2000" placeholder="Presentación profesional breve."></textarea></div>
                <h4>Perfil de investigación</h4>
                <div class="me-field"><label for="me-profile-orcid">ORCID</label><input id="me-profile-orcid" type="text" v-model="state.profile.edit.orcid_id" maxlength="40" placeholder="0000-0000-0000-0000"></div>
                <div class="me-field"><label for="me-profile-scholar">Google Scholar</label><input id="me-profile-scholar" type="url" v-model="state.profile.edit.scholar_url" maxlength="500" placeholder="https://scholar.google.com/…"></div>
                <div class="me-field"><label for="me-profile-rg">ResearchGate</label><input id="me-profile-rg" type="url" v-model="state.profile.edit.researchgate_url" maxlength="500" placeholder="https://www.researchgate.net/…"></div>
                <div class="me-field"><label for="me-profile-pubmed">PubMed query</label><input id="me-profile-pubmed" type="text" v-model="state.profile.edit.pubmed_query" maxlength="500" placeholder="Apellido Nombre[Author]"></div>
                <h4>Métricas académicas</h4>
                <div class="me-v18-metrics-row">
                  <div class="me-field"><label for="me-profile-pubcount">Publicaciones indexadas</label><input id="me-profile-pubcount" type="number" v-model.number="state.profile.edit.indexed_publications_count" min="0" max="9999" step="1" placeholder="—"></div>
                  <div class="me-field"><label for="me-profile-hindex">Índice h</label><input id="me-profile-hindex" type="number" v-model.number="state.profile.edit.h_index" min="0" max="999" step="1" placeholder="—"></div>
                </div>
                <div class="me-field me-field-check"><label><input type="checkbox" v-model="state.profile.edit.is_public"> Visible en la web pública del equipo</label></div>
                <p v-if="state.profile.error" class="me-form-error" role="alert">{{state.profile.error}}</p>
                <p v-if="profileNotice" class="me-v26c-notice" role="status">{{profileNotice}}</p>
                <p v-if="profileDirty" class="me-v26c-dirty" role="status">Tienes cambios sin guardar.</p>
                <div class="me-form-actions"><button type="button" @click="closeProfile" :disabled="state.profile.saving">Cancelar</button><button type="submit" class="me-btn-primary" :disabled="state.profile.saving || !profileDirty">{{state.profile.saving?'Guardando…':'Guardar cambios'}}</button></div>
              </form>
              <div v-if="state.profile.certificates.length" class="me-v15-certificates">
                <h4>Certificados</h4>
                <ul class="me-list"><li v-for="c in state.profile.certificates" :key="c.id" class="me-v16-cert-item" :class="{'me-v16-cert-expired':c.urgency==='expired','me-v16-cert-expiring':c.urgency==='expiring_soon'}">
                  <span class="me-item-main">{{c.name}}<small v-if="c.expiryDate"> · {{fmtDate(c.expiryDate)}}</small></span>
                  <span v-if="c.urgency==='expired'" class="me-v16-cert-badge me-v16-cert-badge--expired">Caducado</span>
                  <span v-else-if="c.urgency==='expiring_soon'" class="me-v16-cert-badge me-v16-cert-badge--expiring">{{certUrgencyLabel(c)}}</span>
                </li></ul>
              </div>
              <div v-if="state.profile.data.notificationPrefs" class="me-v15-readonly-section me-v19-notif-prefs">
                <h4>Preferencias de notificación</h4>
                <div class="me-v19-toggle-group">
                  <label class="me-v19-toggle"><input type="checkbox" :checked="state.profile.data.notificationPrefs.notificationsEnabled" @change="toggleNotifPref('notificationsEnabled')"><span class="me-v19-toggle-label">Notificaciones generales</span></label>
                  <label class="me-v19-toggle"><input type="checkbox" :checked="state.profile.data.notificationPrefs.absenceNotifications" @change="toggleNotifPref('absenceNotifications')"><span class="me-v19-toggle-label">Avisos de ausencias</span></label>
                  <label class="me-v19-toggle"><input type="checkbox" :checked="state.profile.data.notificationPrefs.announcementNotifications" @change="toggleNotifPref('announcementNotifications')"><span class="me-v19-toggle-label">Comunicaciones y anuncios</span></label>
                </div>
              </div>
              <details v-if="state.profile.edit && state.profile.edit.is_public && publicPreview" class="me-v19-public-preview me-v38-public-preview">
                <summary>Vista previa pública <span>Mostrar detalles</span></summary>
                <p class="me-v19-preview-hint">Así se verá tu perfil para otros miembros del equipo.</p>
                <div class="me-v19-preview-card">
                  <div class="me-v19-preview-header">
                    <div><strong>{{publicPreview.name}}</strong><span v-if="publicPreview.title" class="me-v19-preview-title">{{publicPreview.title}}</span></div>
                  </div>
                  <p v-if="publicPreview.department || publicPreview.specialization" class="me-v19-preview-dept">{{[publicPreview.department,publicPreview.specialization].filter(Boolean).join(' · ')}}</p>
                  <p v-if="publicPreview.bio" class="me-v19-preview-bio">{{publicPreview.bio}}</p>
                  <div v-if="publicPreview.orcid || publicPreview.scholar || publicPreview.researchgate" class="me-v19-preview-links">
                    <span v-if="publicPreview.orcid">ORCID</span>
                    <span v-if="publicPreview.scholar">Scholar</span>
                    <span v-if="publicPreview.researchgate">ResearchGate</span>
                  </div>
                </div>
              </details>
            </template>
            </section>
          </section>
          <div v-if="linked && upcomingEvents.length && !isContextWorkspace && !profileActive" class="me-v23-upcoming" aria-label="Próximos 7 días">
            <div v-for="(ev,i) in upcomingEvents" :key="i" class="me-v23-event" :data-urgency="ev.urgency">
              <span class="me-v23-event-icon">{{ev.icon}}</span>
              <div class="me-v23-event-text"><span class="me-v23-event-title">{{ev.title}}</span><span class="me-v23-event-date">{{fmtDate(ev.date)}}</span></div>
            </div>
          </div>
          <div v-if="linked && !state.profile.open" class="me-v20-quick-bar">
            <button type="button" class="me-v20-quick-toggle" @click="state.quickActions=!state.quickActions" :aria-expanded="state.quickActions" aria-controls="me-v32-tool-details"><span>Acciones rápidas</span><svg class="me-v28-chevron me-v32-tool-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            <button type="button" class="me-v21-notif-btn" @click="toggleNotifications" :aria-expanded="state.notifications.open" aria-label="Notificaciones">Notificaciones<span v-if="notificationBadge" class="me-v21-notif-badge">{{notificationBadge}}</span></button>
            <button id="me-v26b-directory-trigger" type="button" class="me-v20-directory-btn" @click="loadColleagues" :aria-expanded="isContextWorkspace && workspaceState.workspace==='directory'" aria-controls="me-v26b-directory">Directorio</button>
            <button id="me-v26b-calendar-trigger" type="button" class="me-v21-cal-btn" @click="openCalendar()" :aria-expanded="isContextWorkspace && workspaceState.workspace==='calendar'" aria-controls="me-v26b-calendar" aria-label="Abrir calendario">Calendario</button>
            <button type="button" class="me-v23-dossier-btn" @click="exportDossier()" :disabled="state.dossierBusy">{{state.dossierBusy?'Generando…':'Dossier PDF'}}</button>
          </div>
          <div v-if="state.quickActions && linked && !isContextWorkspace && !profileActive" id="me-v32-tool-details" class="me-v20-quick-actions me-v32-tools-panel" aria-label="Herramientas adicionales">
            <button v-for="a in quickActionItems" :key="a.id" type="button" class="me-v20-quick-item" @click="doQuickAction(a.id)"><span class="me-v20-quick-icon" aria-hidden="true">{{a.icon}}</span> {{a.label}}</button>
            <div class="me-v21-extras-bar">
              <button type="button" class="me-v21-extras-btn" @click="openDigest()">Resumen</button>
              <button type="button" class="me-v21-extras-btn" @click="exportCV()" :disabled="state.cvExport.busy">{{state.cvExport.busy?'Exportando…':'Exportar CV'}}</button>
            </div>
          </div>
          <section v-if="isContextWorkspace && workspaceState.workspace==='directory'" id="me-v26b-directory" class="me-v26b-workspace me-v20-colleagues" aria-label="Directorio del equipo">
            <div class="me-v26b-topline"><span>Mi espacio / Directorio</span><button type="button" @click="returnToOverview">← Volver a Mi espacio</button></div>
            <h3 class="me-v26b-workspace-title" tabindex="-1">Directorio del equipo</h3>
            <p>Perfiles profesionales visibles para tu cuenta.</p>
            <label for="me-v26b-search">Buscar profesionales</label>
            <input id="me-v26b-search" type="search" class="me-v20-colleagues-search" v-model="state.colleagues.search" placeholder="Nombre, departamento o especialidad…">
            <p v-if="state.colleagues.busy" class="mi-espacio-state" role="status">Cargando directorio…</p>
            <p v-else-if="state.colleagues.error" class="me-form-error" role="alert">{{state.colleagues.error}} <button type="button" @click="loadColleagues">Reintentar</button></p>
            <div v-else class="me-v26b-split">
              <div class="me-v26b-results">
                <p class="me-v26b-count">{{filteredColleagues.length}} profesionales</p>
                <p v-if="!filteredColleagues.length && state.colleagues.search" class="me-v8-quiet">No se encontraron resultados para «{{state.colleagues.search}}».</p>
                <p v-else-if="!state.colleagues.items.length" class="me-v8-quiet">Ningún compañero tiene un perfil público activo.</p>
                <ul v-else class="me-v20-colleagues-list">
                  <li v-for="c in filteredColleagues" :key="c.id" class="me-v20-colleague-card">
                    <button type="button" class="me-v26b-person" :id="'me-v26b-staff-'+c.id" :aria-pressed="selectedColleague?.id===c.id" @click="selectColleague(c)">
                      <span class="me-v20-colleague-avatar"><img v-if="c.photo" :src="c.photo" alt="" class="me-v20-colleague-photo"><span v-else class="me-v20-colleague-initials">{{c.name.split(/\\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase()}}</span></span>
                      <span class="me-v20-colleague-info"><strong>{{c.name}}</strong><span v-if="c.title || c.specialization" class="me-v20-colleague-role">{{c.title || c.specialization}}</span><span v-if="c.department" class="me-v20-colleague-dept">{{c.department}}</span></span><span aria-hidden="true">→</span>
                    </button>
                  </li>
                </ul>
              </div>
              <aside class="me-v26b-detail me-v26b-staff-detail" aria-label="Vista previa profesional">
                <template v-if="selectedColleague">
                  <button type="button" @click="backContextDetail">← Volver a resultados</button>
                  <h4 class="me-v26b-staff-detail-title" tabindex="-1">{{selectedColleague.name}}</h4>
                  <p v-if="selectedColleague.title || selectedColleague.specialization">{{selectedColleague.title || selectedColleague.specialization}}</p>
                  <p v-if="selectedColleague.department">{{selectedColleague.department}}</p>
                  <p v-if="selectedColleague.bio">{{selectedColleague.bio}}</p>
                  <dl v-if="selectedColleague.orcid"><dt>ORCID</dt><dd>{{selectedColleague.orcid}}</dd></dl>
                  <p class="me-v26b-note">Datos autorizados del directorio. No se permite editar otro perfil desde aquí.</p>
                </template>
                <p v-else class="me-v8-quiet">Selecciona un profesional para consultar su perfil público autorizado.</p>
              </aside>
            </div>
          </section>
          <!-- Phase 21: Notification center -->
          <section v-if="state.notifications.open" class="me-v21-notifications" aria-label="Notificaciones">
            <div class="me-v21-notif-head">
              <h3>Notificaciones</h3>
              <button type="button" class="me-v15-profile-close" @click="closeSecondary('notifications')" aria-label="Cerrar">✕</button>
            </div>
            <p v-if="state.notifications.busy" class="mi-espacio-state" role="status">Cargando notificaciones…</p>
            <p v-else-if="state.notifications.error" class="me-form-error" role="alert">{{state.notifications.error}}</p>
            <p v-else-if="!state.notifications.items.length" class="me-v8-quiet" role="status">No hay notificaciones pendientes.</p>
            <ul v-else class="me-v21-notif-list">
              <li v-for="n in state.notifications.items" :key="n.id" class="me-v21-notif-item" :class="'me-v21-sev-'+n.severity">
                <span class="me-v21-notif-icon" aria-hidden="true">●</span>
                <div class="me-v21-notif-body">
                  <strong>{{n.title}}</strong>
                  <span class="me-v21-notif-msg">{{n.message}}</span>
                  <span v-if="n.detail" class="me-v21-notif-detail">{{n.detail}}</span>
                </div>
              </li>
            </ul>
          </section>

          <section v-if="isContextWorkspace && workspaceState.workspace==='calendar'" id="me-v26b-calendar" class="me-v26b-workspace me-v21-calendar" aria-label="Calendario personal">
            <div class="me-v26b-topline"><span>Mi espacio / Calendario</span><button type="button" @click="returnToOverview">← Volver a Mi espacio</button></div>
            <h3 class="me-v26b-workspace-title" tabindex="-1">Calendario</h3>
            <p>Eventos vinculados a tu perfil según los registros disponibles.</p>
            <div class="me-v21-cal-nav"><button type="button" @click="calendarPrev" aria-label="Mes anterior">←</button><span class="me-v21-cal-month">{{calendarMonthLabel}}</span><button type="button" @click="calendarNext" aria-label="Mes siguiente">→</button></div>
            <p v-if="state.calendar.busy" class="mi-espacio-state" role="status">Cargando calendario…</p>
            <p v-else-if="state.calendar.error" class="me-form-error" role="alert">{{state.calendar.error}} <button type="button" @click="openCalendar(state.calendar.month)">Reintentar</button></p>
            <div v-else class="me-v26b-split">
              <div class="me-v26b-month">
                <div class="me-v21-cal-weekdays"><span v-for="d in ['L','M','X','J','V','S','D']" :key="d">{{d}}</span></div>
                <div class="me-v21-cal-grid">
                  <div v-for="(cell,i) in calendarDays" :key="i" class="me-v21-cal-cell" :class="{'me-v21-cal-empty':!cell.day,'me-v21-cal-today':cell.date===localToday}">
                    <button v-if="cell.day" type="button" class="me-v26b-day" :id="'me-v26b-day-'+cell.date" :aria-label="cell.date+' · '+cell.events.length+' eventos registrados'" :aria-pressed="selectedDate===cell.date" @click="selectCalendarDate(cell.date)">
                      <span class="me-v21-cal-day">{{cell.day}}</span><span v-if="cell.events.length" class="me-v26b-count">{{cell.events.length}} eventos</span>
                      <span v-if="cell.events.length" class="me-v21-cal-dots" aria-hidden="true"><span v-for="ev in cell.events.slice(0,3)" :key="ev.id" class="me-v21-cal-dot" :style="{background:ev.color||'#158a89'}"></span></span>
                    </button>
                  </div>
                </div>
                <p class="me-v26b-note">Un día sin eventos registrados no confirma disponibilidad.</p>
              </div>
              <aside class="me-v26b-detail" aria-label="Agenda del día">
                <template v-if="selectedDate">
                  <button type="button" @click="backContextDetail">← Volver al mes</button><h4 class="me-v26b-calendar-detail-title" tabindex="-1">{{fmtDate(selectedDate)}}</h4>
                  <p>{{selectedDayEvents.length}} eventos registrados</p>
                  <ul v-if="selectedDayEvents.length"><li v-for="(ev,i) in selectedDayEvents" :key="ev.id||i"><strong>{{ev.title}}</strong><span v-if="ev.type"> · {{ev.type}}</span><span v-if="ev.status"> · Estado: {{ev.status}}</span></li></ul>
                  <p v-else class="me-v8-quiet">No hay eventos registrados para esta fecha. Esto no confirma disponibilidad.</p>
                </template>
                <p v-else class="me-v8-quiet">Selecciona un día para consultar los eventos registrados.</p>
              </aside>
            </div>
          </section>
          <!-- Phase 21: Activity digest -->
          <section v-if="state.digest.open" class="me-v21-digest" aria-label="Resumen de actividad">
            <div class="me-v21-digest-head">
              <h3>Resumen de actividad</h3>
              <button type="button" class="me-v15-profile-close" @click="closeSecondary('digest')" aria-label="Cerrar">✕</button>
            </div>
            <div class="me-v21-digest-tabs">
              <button type="button" :class="{'is-active':state.digest.period==='week'}" @click="openDigest('week')">Última semana</button>
              <button type="button" :class="{'is-active':state.digest.period==='month'}" @click="openDigest('month')">Último mes</button>
            </div>
            <p v-if="state.digest.busy" class="mi-espacio-state" role="status">Cargando resumen…</p>
            <p v-else-if="state.digest.error" class="me-form-error" role="alert">{{state.digest.error}}</p>
            <template v-else-if="state.digest.data">
              <div class="me-v21-digest-total">
                <span class="me-v20-stat-value">{{state.digest.data.totalActions}}</span>
                <span class="me-v20-stat-label">acciones registradas desde {{state.digest.data.since}}</span>
              </div>
              <ul v-if="state.digest.data.byResource.length" class="me-v21-digest-breakdown">
                <li v-for="r in state.digest.data.byResource" :key="r.resource" class="me-v21-digest-row">
                  <span class="me-v21-digest-res">{{digestResourceLabel(r.resource)}}</span>
                  <span class="me-v21-digest-count">{{r.actions}}</span>
                </li>
              </ul>
              <div v-if="state.digest.data.recentCerts.length" class="me-v21-digest-section">
                <p class="mi-espacio-eyebrow">CERTIFICADOS RECIENTES</p>
                <p v-for="c in state.digest.data.recentCerts" :key="c.name">{{c.name}} <small>({{c.date}})</small></p>
              </div>
              <div v-if="state.digest.data.recentPublications.length" class="me-v21-digest-section">
                <p class="mi-espacio-eyebrow">PUBLICACIONES RECIENTES</p>
                <p v-for="p in state.digest.data.recentPublications" :key="p.title">{{p.title}} <small>({{p.date}})</small></p>
              </div>
            </template>
          </section>

          <div v-if="!linked" class="mi-espacio-notice" role="status">La actividad personal no se muestra hasta verificar la vinculación de esta cuenta con una ficha profesional. Contacta con la persona responsable de accesos.</div>
          <!-- Phase 26G: read-only, session-scoped guardia workspace on the shared navigation contract. -->
          <section v-if="linked && state.activity && isContextWorkspace && workspaceState.workspace==='duties'"
            id="me-v26g-duties" class="me-v26g-duties me-v26d-workspace" aria-labelledby="me-v26g-duty-title">
            <button type="button" class="me-duty-back" @click="backToAgenda">← Volver a Mi espacio</button>
            <h3 id="me-v26g-duty-title" class="me-v26g-duty-title me-duty-heading" tabindex="-1">Guardias</h3>
            <p>Asignaciones vinculadas a tu cuenta según los registros departamentales.</p>
            <div class="me-v26g-duty-layout" :class="{'has-selection':!!selectedDuty}">
              <div class="me-v26g-duty-list">
                <p v-if="!state.activity.agenda.guardias.length" class="me-v8-quiet">No constan guardias vinculadas a tu perfil. Esto no confirma disponibilidad.</p>
                <ol v-else class="me-v26g-duty-entries">
                  <li v-for="(g,index) in state.activity.agenda.guardias" :key="g.id||g.date+'-'+index">
                    <button type="button" class="me-v26g-duty-row me-duty-row" :data-index="index"
                      :aria-pressed="state.dutyIndex===index" @click="selectDuty(index)">
                      <span class="me-duty-row-main">
                        <strong>{{fmtDutyDate(g.date)}}</strong>
                        <small>{{dutyShift(g.shift)}} · {{guardiaRole(g.role)}}</small>
                      </span><span aria-hidden="true">→</span>
                    </button>
                  </li>
                </ol>
              </div>
              <aside class="me-v26g-duty-detail me-duty-detail" aria-label="Detalle de guardia personal">
                <template v-if="selectedDuty">
                  <button type="button" class="me-duty-detail-back" @click="closeDutyDetail">← Volver a guardias</button>
                  <h4 tabindex="-1" class="me-duty-detail-title">{{fmtDutyDate(selectedDuty.date)}}</h4>
                  <dl class="me-duty-facts">
                    <div><dt>Modalidad</dt><dd>{{dutyShift(selectedDuty.shift)}}</dd></div>
                    <div><dt>Asignación</dt><dd>{{guardiaRole(selectedDuty.role)}}</dd></div>
                  </dl>
                  <p class="me-duty-provenance">Información vinculada a tu perfil. Para consultar el cuadrante completo utiliza el módulo autorizado.</p>
                </template>
                <p v-else class="me-duty-unselected">Selecciona una guardia para consultar sus detalles registrados.</p>
              </aside>
            </div>
            <button v-if="can('oncall_schedule')" type="button" class="me-duty-institutional" @click="navigate('oncall_schedule')">Abrir cuadrante departamental ↗</button>
          </section>
          <section v-if="linked && isContextWorkspace && ['research','publications'].includes(workspaceState.workspace)" class="me-v26d-workspace" aria-label="Actividad personal">
            <button type="button" @click="closePortfolio">← Volver a Mi espacio</button>
            <h3 class="me-v26d-title" tabindex="-1">{{workspaceState.workspace==='research'?'Investigación':'Publicaciones'}}</h3>
            <p>Registros vinculados y autorizados para tu cuenta. Esta vista no constituye un historial completo; consulta el módulo institucional para modificaciones.</p>
            <template v-if="workspaceState.workspace==='research'">
              <div class="me-v26d-filters"><button v-for="g in researchGroups" :key="g.id" type="button" @click="changeResearchGroup(g.id)" :aria-pressed="state.researchGroup===g.id">{{g.label}}</button></div>
              <ul class="me-v26d-list me-v38-research-list"><li v-for="(record,index) in researchItems" :key="record.id||index">
                <details class="me-v38-research-disclosure">
                  <summary class="me-v38-research-summary"><span class="me-v38-research-summary-text"><strong>{{researchRecordTitle(record)}}</strong><span>{{researchRecordRole(record)}}</span></span><svg class="me-v28-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>
                  <p class="me-v38-research-meta">{{researchRecordMeta(record) || 'No hay metadatos adicionales registrados.'}}</p>
                </details>
              </li></ul>
              <p v-if="!researchItems.length">No constan registros en esta categoría.</p>
              <button v-if="can('research')" type="button" @click="navigate('research')">Ir al módulo de investigación ↗</button>
            </template>
            <template v-else>
              <ul class="me-v26d-list"><li v-for="record in state.activity.publications.items" :key="record.id"><strong>{{record.title}}</strong><span>{{record.byline}}</span></li></ul>
              <p v-if="!state.activity.publications.items.length">No hay publicaciones vinculadas a tu perfil.</p>
            </template>
          </section>
          <template v-if="linked && !isContextWorkspace && !profileActive">
            <div v-if="state.activityBusy" class="me-activity me-activity-placeholder me-v10d-loading" role="status" aria-label="Cargando actividad profesional">
              <span class="me-v10d-loading-label">Cargando actividad vinculada…</span>
              <div class="me-v10d-loading-grid" aria-hidden="true"><div class="me-v10d-loading-block"></div><div class="me-v10d-loading-block"></div></div>
            </div>
            <div v-else-if="state.activityError" class="mi-espacio-notice" role="alert">{{state.activityError}} <button type="button" @click="refresh">Reintentar</button></div>
            <template v-else-if="state.activity">
              <div v-if="state.dutyMode==='overview' && state.review.can && !state.review.busy && !state.review.error && state.review.filter==='open' && state.review.items.length" class="me-v13b-attention">
                <div><p class="mi-espacio-eyebrow">REQUIERE TU ATENCIÓN</p><p><strong>{{state.review.items.length}} {{state.review.items.length===1?'comunicación pendiente':'comunicaciones pendientes'}}</strong> de revisión</p></div>
                <button type="button" class="me-v13b-attention-action" aria-controls="me-v8-administration" @click="openPendingReviews">Revisar comunicaciones <span aria-hidden="true">→</span></button>
              </div>
              <div v-if="state.dutyMode==='overview'" class="me-v8-overview me-v9-overview" :class="{'me-v10-research-first':!showAgenda,'me-v10-sparse':!hasAgenda && !hasResearch,'me-v12-research-priority':researchPriority}">
                <section v-if="showAgenda" class="me-v8-column me-v8-agenda me-v9-panel" :class="{'me-v10-agenda-sparse':!hasAgenda}" aria-labelledby="me-v9-agenda-title">
                  <div class="me-v9-panel-heading"><div><h3 id="me-v9-agenda-title" class="me-v9-agenda-title" tabindex="-1">Agenda</h3></div><span v-if="state.activity.counts.guardias" class="me-v9-verified-count">{{state.activity.counts.guardias}} guardias</span></div>
                  <div v-if="upcomingGuardias.length" class="me-v8-commitments">
                    <div class="me-v8-upnext me-v9-feature"><span class="me-v8-kicker">{{upcomingGuardias[0].date===localToday?'GUARDIA REGISTRADA HOY':'PRÓXIMA GUARDIA'}}</span><strong>{{fmtDutyDate(upcomingGuardias[0].date)}}</strong><span>{{dutyShift(upcomingGuardias[0].shift)}} · {{guardiaRole(upcomingGuardias[0].role)}}</span></div>
                    <ol v-if="upcomingGuardias.length>1" id="me-v28c-guardias" class="me-v8-timeline me-v9-timeline"><li v-for="(g,index) in upcomingGuardias.slice(1,state.operationsOpen.guardias?upcomingGuardias.length:3)" :key="g.id||index"><span>{{fmtDutyDate(g.date)}}</span><small>{{dutyShift(g.shift)}} · {{guardiaRole(g.role)}}</small></li></ol>
                    <button v-if="upcomingGuardias.length>3" type="button" class="me-v28-disclosure-toggle" aria-controls="me-v28c-guardias" :aria-expanded="state.operationsOpen.guardias" @click="state.operationsOpen.guardias=!state.operationsOpen.guardias"><span>{{state.operationsOpen.guardias?'Mostrar menos guardias':'Mostrar próximas guardias'}}</span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                    <button type="button" id="me-v26g-duties-trigger" class="me-duty-open me-v9-inline-action" @click="openDuties()">Ver guardias <span aria-hidden="true">→</span></button>
                  </div>
                  <div v-else-if="state.activity.agenda.guardias.length && !personalRotations.length && !supervisedRotations.length" class="me-v8-commitments">
                    <p class="me-v8-quiet">No constan guardias próximas. Puedes consultar tu historial de guardias.</p>
                    <button type="button" id="me-v26g-duties-trigger" class="me-duty-open me-v9-inline-action" @click="openDuties()">Ver guardias <span aria-hidden="true">→</span></button>
                  </div>
                  <div v-else-if="personalRotations.length" class="me-v8-upnext me-v9-feature me-v10-rotation-feature">
                    <span class="me-v8-kicker">MI ROTACIÓN REGISTRADA</span>
                    <strong>{{personalRotations[0].unit || 'Rotación asignada'}}</strong>
                    <span v-if="personalRotations[0].start||personalRotations[0].end">{{fmtPeriod(personalRotations[0].start,personalRotations[0].end)}}</span>
                    <small v-if="personalRotations[0].status" class="me-v28d-recorded-status">Estado registrado: {{personalRotations[0].status}}</small>
                  </div>
                  <div v-else-if="supervisedRotations.length" class="me-v8-upnext me-v9-feature me-v10-supervision-feature">
                    <span class="me-v8-kicker">ROTACIÓN BAJO MI SUPERVISIÓN</span>
                    <strong>{{supervisedRotations[0].resident || supervisedRotations[0].unit || 'Asignación supervisada'}}</strong>
                    <span v-if="supervisedRotations[0].unit">{{supervisedRotations[0].unit}}</span>
                    <span v-if="fmtPeriod(supervisedRotations[0].start,supervisedRotations[0].end)">{{fmtPeriod(supervisedRotations[0].start,supervisedRotations[0].end)}}</span>
                  </div>
                  <p v-else-if="!hasAgenda" class="me-v8-quiet me-v9-empty">No constan asignaciones próximas vinculadas a tu perfil.</p>
                  <div v-if="state.activity.agenda.rotations.length || state.activity.agenda.absences.length" class="me-v8-secondary-agenda">
                    <!-- Phase 28D: use only existing, authorized resident rotations; no inferred supervisor name. -->
                    <div v-if="personalRotations.length>(state.activity.agenda.guardias.length?0:1)" class="me-v28-disclosure me-v28d-rotations">
                      <button v-if="personalRotations.length>(state.activity.agenda.guardias.length?1:2)" type="button"
                        class="me-v28-disclosure-toggle" :aria-expanded="state.operationsOpen.rotations"
                        aria-controls="me-v28d-rotations" @click="state.operationsOpen.rotations=!state.operationsOpen.rotations">
                        <span>Rotaciones <small>{{personalRotations.length}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <h4 v-else class="me-v28d-static-title">Rotaciones <small>{{personalRotations.length}}</small></h4>
                      <ul id="me-v28d-rotations" class="me-v28d-rotation-list">
                        <li v-for="(r,i) in personalRotations.slice(state.activity.agenda.guardias.length?0:1,state.operationsOpen.rotations?personalRotations.length:(state.activity.agenda.guardias.length?1:2))" :key="r.id||i">
                          <strong>{{r.unit||'Rotación asignada'}}</strong>
                          <small v-if="r.start||r.end">{{fmtPeriod(r.start,r.end)}}</small>
                          <small v-if="r.status">Estado registrado: {{r.status}}</small>
                        </li>
                      </ul>
                    </div>
                    <div v-if="supervisedRotations.length> (state.activity.agenda.guardias.length||personalRotations.length?0:1)" class="me-v28-disclosure">
                      <button type="button" class="me-v28-disclosure-toggle" :aria-expanded="state.operationsOpen.supervision" aria-controls="me-v28c-supervision" @click="state.operationsOpen.supervision=!state.operationsOpen.supervision"><span>Rotaciones que superviso <small>{{supervisedRotations.length}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                      <ul id="me-v28c-supervision"><li v-for="r in supervisedRotations.slice(state.activity.agenda.guardias.length||personalRotations.length?0:1,state.operationsOpen.supervision?supervisedRotations.length:(state.activity.agenda.guardias.length||personalRotations.length?1:2))" :key="r.id">{{r.resident||r.unit||'Rotación supervisada'}} <small>{{r.resident&&r.unit?r.unit+' · ':''}}{{fmtPeriod(r.start,r.end)}}</small></li></ul>
                    </div>
                    <div v-if="otherRotations.length" class="me-v28-disclosure me-v28d-other-rotations">
                      <button v-if="otherRotations.length>1" type="button" class="me-v28-disclosure-toggle"
                        :aria-expanded="state.operationsOpen.otherRotations" aria-controls="me-v28d-other-rotations"
                        @click="state.operationsOpen.otherRotations=!state.operationsOpen.otherRotations">
                        <span>Otras rotaciones vinculadas <small>{{otherRotations.length}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <h4 v-else class="me-v28d-static-title">Otras rotaciones vinculadas</h4>
                      <ul id="me-v28d-other-rotations" class="me-v28d-rotation-list">
                        <li v-for="(r,i) in otherRotations.slice(0,state.operationsOpen.otherRotations?otherRotations.length:1)" :key="r.id||i">
                          <strong>{{r.unit||r.resident||'Rotación'}}</strong>
                          <small v-if="r.start||r.end">{{fmtPeriod(r.start,r.end)}}</small>
                          <small v-if="r.status">Estado registrado: {{r.status}}</small>
                        </li>
                      </ul>
                    </div>
                    <div v-if="state.activity.agenda.absences.length" class="me-v28-disclosure"><button type="button" class="me-v28-disclosure-toggle" :aria-expanded="state.operationsOpen.absences" aria-controls="me-v28c-absences" @click="state.operationsOpen.absences=!state.operationsOpen.absences"><span>Próximas ausencias <small>{{upcomingAbsenceDaysTotal}} día{{upcomingAbsenceDaysTotal!==1?'s':''}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button><ul id="me-v28c-absences" class="me-v19-absence-list"><li v-for="a in state.activity.agenda.absences.slice(0,state.operationsOpen.absences?state.activity.agenda.absences.length:1)" :key="a.id" class="me-v19-absence-item"><span class="me-v19-absence-reason">{{absenceReasonLabel(a.reason)||a.type||'Ausencia'}}</span><span class="me-v19-absence-dates">{{fmtPeriod(a.start,a.end)}}<template v-if="a.daysAhead"> · {{a.current?'quedan ':''}}{{a.daysAhead}} día{{a.daysAhead!==1?'s':''}}</template></span><span class="me-chip me-v19-absence-status" :data-tone="a.status">{{absenceStatusLabel(a.status)}}</span></li></ul></div>
                  </div>
                </section>
                <section v-if="hasResearch" class="me-v8-column me-v8-research me-v9-panel" aria-labelledby="me-v9-research-title">
                  <div class="me-v9-panel-heading"><div><h3 id="me-v9-research-title">Investigación</h3></div></div>
                  <div v-if="state.activity.counts.lines+state.activity.counts.studies+state.activity.counts.projects" class="me-v8-research-groups">
                    <div v-if="state.activity.research.lines.length" class="me-v28-disclosure">
                      <button v-if="state.activity.research.lines.length>2" type="button" class="me-v28-disclosure-toggle" :aria-expanded="!!state.researchOpen.lines" aria-controls="me-v28-lines" @click="state.researchOpen.lines=!state.researchOpen.lines"><span>Líneas de investigación <small>{{state.activity.counts.lines}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                      <ul id="me-v28-lines"><li v-for="l in state.activity.research.lines.slice(0,state.researchOpen.lines?state.activity.research.lines.length:2)" :key="l.id"><span>{{l.name}}</span><small>{{lineRole(l.role)}}</small></li></ul>
                    </div>
                    <div v-if="state.activity.research.studies.length" class="me-v28-disclosure">
                      <button v-if="state.activity.research.studies.length>2" type="button" class="me-v28-disclosure-toggle" :aria-expanded="!!state.researchOpen.studies" aria-controls="me-v28-studies" @click="state.researchOpen.studies=!state.researchOpen.studies"><span>Estudios <small>{{state.activity.counts.studies}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                      <ul id="me-v28-studies"><li v-for="st in state.activity.research.studies.slice(0,state.researchOpen.studies?state.activity.research.studies.length:2)" :key="st.id"><span>{{st.title}}</span><small>{{studyRole(st.role)}}<template v-if="st.code"> · {{st.code}}</template></small></li></ul>
                    </div>
                    <div v-if="state.activity.research.projects.length" class="me-v28-disclosure">
                      <button v-if="state.activity.research.projects.length>2" type="button" class="me-v28-disclosure-toggle" :aria-expanded="!!state.researchOpen.projects" aria-controls="me-v28-projects" @click="state.researchOpen.projects=!state.researchOpen.projects"><span>Proyectos <small>{{state.activity.counts.projects}}</small></span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                      <ul id="me-v28-projects"><li v-for="p in state.activity.research.projects.slice(0,state.researchOpen.projects?state.activity.research.projects.length:2)" :key="p.id"><span>{{p.title}}</span><small>{{projectRole(p.role)}}<template v-if="p.stage"> · {{p.stage}}</template></small></li></ul>
                    </div>
                  </div>
                  <p class="me-v38-research-guidance">Las líneas, estudios y proyectos se despliegan aquí, sin abrir otra pantalla.</p>

                </section>
              </div>
              <section v-else class="me-v8-all-duties" aria-label="Guardias">
                <button type="button" class="me-duty-back" @click="backToAgenda">← Volver a mi espacio</button>
                <h3 class="me-duty-heading" tabindex="-1">Guardias</h3>
                <ol class="me-v8-timeline"><li v-for="g in state.activity.agenda.guardias" :key="g.id"><span>{{fmtDutyDate(g.date)}}</span><small>{{dutyShift(g.shift)}} · {{guardiaRole(g.role)}}</small></li></ol>
                <button v-if="can('oncall_schedule')" type="button" class="me-duty-institutional" @click="navigate('oncall_schedule')">Abrir cuadrante departamental ↗</button>
              </section>
              <div v-if="state.dutyMode==='overview'" class="me-v9-lower-grid">
                <section class="me-v9-publications" :class="{'me-v34-empty-publications':!state.activity.publications.items.length}" aria-label="Publicaciones">
                  <div class="me-v9-panel-heading"><div><h3>Publicaciones <span v-if="state.activity.counts.publications" class="me-v9-verified-count">{{state.activity.counts.publications}}</span></h3></div><button type="button" class="me-pubs-claim" @click="claimPublication">Reivindicar una publicación</button></div>
                  <ol v-if="state.activity.publications.items.length" id="me-v28-publications" class="me-v8-publication-list"><li v-for="p in state.activity.publications.items.slice(0,state.publicationsExpanded?state.activity.publications.items.length:3)" :key="p.id"><strong>{{p.title}}</strong><span v-if="p.byline">{{p.byline}}</span><small v-if="p.order!==null">Posición de autoría: {{p.order}}<template v-if="p.corresponding"> · Autoría de correspondencia</template></small><small v-else-if="p.corresponding">Autoría de correspondencia</small></li></ol>
                  <p v-if="!state.activity.publications.items.length && !state.activity.publications.available" class="me-v8-quiet" role="status">La información de publicaciones no está disponible actualmente.</p>
                  <p v-else-if="!state.activity.publications.items.length" class="me-v8-quiet">No hay publicaciones vinculadas a tu perfil.</p>
                  <button v-if="state.activity.publications.items.length" id="me-v26d-publications-trigger" type="button" @click="openPortfolio('publications')">Ver publicaciones →</button>
                   <button v-if="hasPublicationOverflow" type="button" class="me-v10-publications-toggle me-v28-disclosure-toggle" :aria-expanded="state.publicationsExpanded" aria-controls="me-v28-publications" @click="state.publicationsExpanded=!state.publicationsExpanded"><span>{{state.publicationsExpanded?'Mostrar menos publicaciones':'Mostrar todas las publicaciones'}}</span><svg class="me-v28-chevron me-v28e-chevron" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
                </section>
                <section class="me-v9-services" aria-label="Comunicaciones y gestiones">
                  <div class="me-v9-panel-heading"><div><h3>Comunicaciones</h3></div></div>
                  <p>Consultas y correcciones de tu información profesional.</p><p v-if="state.reports.length" class="me-v9-service-meta">Comunicaciones enviadas · {{state.reports.length}}</p>
                  <button type="button" class="me-v8-tools-toggle" :aria-expanded="state.toolsOpen" aria-controls="me-v8-administration" @click="state.toolsOpen=!state.toolsOpen">{{state.toolsOpen?'Cerrar gestiones':'Comunicaciones y gestiones'}} <span aria-hidden="true">{{state.toolsOpen?'−':'→'}}</span></button>
                </section>
              </div>
              <!-- Secondary personal metrics/onboarding follow core responsibilities. -->
          <div v-if="showPhotoNudge" class="me-v23-photo-nudge" role="status">
            <div class="me-v23-photo-nudge-body">
              <p>Puedes añadir una foto a tu perfil profesional.</p>
              <div class="me-v23-photo-nudge-actions">
                <button type="button" class="me-v23-photo-nudge-btn" @click="openProfile()">Subir foto</button>
                <button type="button" class="me-v23-photo-nudge-dismiss" @click="state.photoNudgeDismissed=true">Ahora no</button>
              </div>
            </div>
          </div>
          <div v-if="linked && state.dashboard.data && !state.profile.open" class="me-v20-dashboard me-v23-dashboard" aria-label="Métricas personales">
            <div v-if="state.dashboard.data.piStudies || state.dashboard.data.piProjects || state.dashboard.data.hIndex" class="me-v23-impact-row">
              <div class="me-v23-impact-stat" v-if="state.dashboard.data.piStudies || state.dashboard.data.piProjects"><span class="me-v23-impact-value">{{(state.dashboard.data.piStudies||0)+(state.dashboard.data.piProjects||0)}}</span><span class="me-v23-impact-label">IP en {{[state.dashboard.data.piStudies?state.dashboard.data.piStudies+' estudio'+(state.dashboard.data.piStudies!==1?'s':''):'',state.dashboard.data.piProjects?state.dashboard.data.piProjects+' proyecto'+(state.dashboard.data.piProjects!==1?'s':''):''].filter(Boolean).join(', ')}}</span></div>
              <div class="me-v23-impact-stat" v-if="state.dashboard.data.hIndex"><span class="me-v23-impact-value">{{state.dashboard.data.hIndex}}</span><span class="me-v23-impact-label">Índice h</span></div>
            </div>
            <div class="me-v23-ops-row">
              <div class="me-v20-stat" v-if="state.dashboard.data.activeStudies"><span class="me-v20-stat-value">{{state.dashboard.data.activeStudies}}</span><span class="me-v20-stat-label">Estudios</span></div>
              <div class="me-v20-stat" v-if="state.dashboard.data.activeProjects"><span class="me-v20-stat-value">{{state.dashboard.data.activeProjects}}</span><span class="me-v20-stat-label">Proyectos</span></div>
              <div class="me-v20-stat" v-if="state.dashboard.data.publications"><span class="me-v20-stat-value">{{state.dashboard.data.publications}}</span><span class="me-v20-stat-label">Publicaciones</span></div>
              <div class="me-v20-stat" v-if="state.dashboard.data.totalCertificates"><span class="me-v20-stat-value" :class="{'me-v20-stat-warn':state.dashboard.data.expiredCertificates||state.dashboard.data.expiringCertificates}">{{state.dashboard.data.totalCertificates}}</span><span class="me-v20-stat-label">Certificados<template v-if="state.dashboard.data.expiredCertificates"> · {{state.dashboard.data.expiredCertificates}} cad.</template></span></div>
              <div class="me-v20-stat" v-if="state.dashboard.data.upcomingAbsenceDays"><span class="me-v20-stat-value">{{state.dashboard.data.upcomingAbsenceDays}}</span><span class="me-v20-stat-label">Días de ausencia programados</span></div>
            </div>
          </div>
              <section v-if="state.dutyMode==='overview' && state.timeline.entries.length" class="me-v16-timeline" aria-label="Actividad reciente">
                <div class="me-v9-panel-heading"><div><h3>Actividad</h3></div></div>
                <div v-if="state.timeline.entries.length>3" class="me-v20-timeline-filters" role="tablist" aria-label="Filtrar actividad">
                  <button v-for="f in TIMELINE_FILTERS" :key="f.value" type="button" role="tab" class="me-v20-tl-filter" :class="{'is-active':state.timeline.filter===f.value}" :aria-selected="state.timeline.filter===f.value" @click="state.timeline.filter=f.value">{{f.label}}</button>
                </div>
                <p v-if="state.timeline.busy" class="mi-espacio-state" role="status">Cargando…</p>
                <p v-else-if="state.timeline.error" class="me-form-error" role="alert">{{state.timeline.error}}</p>
                <ul v-else class="me-v16-timeline-list">
                  <li v-for="e in filteredTimeline.slice(0,state.timeline.expanded?25:5)" :key="e.id" class="me-v16-timeline-entry">
                    <span class="me-v16-timeline-action">{{e.actionLabel}}</span>
                    <span class="me-v16-timeline-resource">{{e.resourceLabel}}</span>
                    <time class="me-v16-timeline-time">{{fmtRelative(e.createdAt)}}</time>
                  </li>
                </ul>
                <p v-if="!filteredTimeline.length && state.timeline.filter!=='all'" class="me-v8-quiet">No hay actividad de tipo «{{TIMELINE_FILTERS.find(f=>f.value===state.timeline.filter)?.label}}».</p>
                <button v-if="filteredTimeline.length>5" type="button" class="me-v16-timeline-toggle" :aria-expanded="state.timeline.expanded" @click="state.timeline.expanded=!state.timeline.expanded">{{state.timeline.expanded?'Ver menos':'Ver toda la actividad'}} <span aria-hidden="true">{{state.timeline.expanded?'↑':'→'}}</span></button>
              </section>
              <section v-if="state.dutyMode==='overview' && urgentCertificates.length && !state.profile.open" class="me-v16-cert-alert" aria-label="Certificados que requieren atención" role="alert">
                <p class="mi-espacio-eyebrow">CERTIFICADOS</p>
                <ul class="me-v16-cert-alert-list">
                  <li v-for="c in urgentCertificates" :key="c.id" :class="{'me-v16-cert-expired':c.urgency==='expired','me-v16-cert-expiring':c.urgency==='expiring_soon'}">
                    <strong>{{c.name}}</strong>
                    <span>{{certUrgencyLabel(c)}}</span>
                  </li>
                </ul>
                <button type="button" class="me-v15-profile-link" @click="openProfile">Revisar en el perfil <span aria-hidden="true">→</span></button>
              </section>
              <div v-if="state.dutyMode==='overview' && state.toolsOpen" id="me-v8-administration" class="me-v9-administration">
                <section v-if="state.toolsOpen && state.activity && state.dutyMode==='overview'" class="me-report" aria-label="Comunicar una discrepancia">
              <div class="mi-espacio-section-heading"><h3>¿Falta algo o hay un error?</h3><p>Comunícalo y lo revisará la persona responsable. No se modifica ningún registro directamente.</p></div>
              <div v-if="state.report.done" class="mi-espacio-notice" role="status"><strong>Gracias, tu comunicación se ha registrado.</strong><p>La revisará la persona responsable de accesos o coordinación.</p><button type="button" class="mi-espacio-refresh" @click="openReportForm">Comunicar otra</button></div>
              <template v-else>
                <button v-if="!state.report.open" type="button" class="mi-espacio-refresh" @click="openReportForm">Comunicar una discrepancia</button>
                <form v-else class="me-report-form" @submit.prevent="submitReport">
                  <div class="me-field"><label for="me-report-subject">¿Sobre qué?</label><select id="me-report-subject" v-model="state.report.subject_type" @change="onSubjectTypeChange"><option value="">Selecciona…</option><option v-for="o in subjectOptions" :key="o.value" :value="o.value">{{o.label}}</option></select></div>
                  <div class="me-field"><label for="me-report-kind">¿Qué ocurre?</label><select id="me-report-kind" v-model="state.report.kind"><option value="">Selecciona…</option><option v-for="o in kindOptions" :key="o.value" :value="o.value">{{o.label}}</option></select></div>
                  <div v-if="state.report.subject_type==='line'||state.report.subject_type==='publication'" class="me-field me-field-wide">
                    <label for="me-report-target">{{state.report.subject_type==='line'?'¿Cuál línea?':'¿Cuál publicación?'}}</label>
                    <select id="me-report-target" v-model="state.report.subject_id" @change="onSubjectPick" :disabled="state.picker.busy">
                      <option value="">{{state.picker.busy?'Cargando…':'Selecciona…'}}</option>
                      <option v-for="o in state.picker.items" :key="o.id" :value="o.id">{{o.label}}</option>
                    </select>
                  </div>
                  <div class="me-field me-field-wide"><label for="me-report-details">Detalles (opcional)</label><textarea id="me-report-details" v-model="state.report.message" rows="3" maxlength="2000" placeholder="Describe brevemente qué debería corregirse."></textarea></div>
                  <p v-if="state.report.error" class="me-form-error" role="alert">{{state.report.error}}</p>
                  <div class="me-form-actions"><button type="button" class="mi-espacio-refresh" @click="state.report.open=false">Cancelar</button><button type="submit" class="me-btn-primary" :disabled="state.report.busy">{{state.report.busy?'Enviando…':'Enviar'}}</button></div>
                </form>
              </template>
              <div v-if="state.reports.length" class="me-myreports">
                <h4>Comunicaciones</h4>
                <ul class="me-list">
                  <li v-for="r in state.reports.slice(0,5)" :key="r.id">
                    <span class="me-item-main">{{subjectLabel(r.subjectType)}} · {{kindLabel(r.kind)}}<small v-if="r.subjectLabel"> · {{r.subjectLabel}}</small></span>
                    <span class="me-chip" :data-tone="r.status">{{reportStatus(r.status)}}</span>
                  </li>
                </ul>
              </div>
            </section>
                            
                <section v-if="state.toolsOpen && state.review.can && state.dutyMode==='overview'" class="me-review" aria-label="Comunicaciones del equipo por revisar">
            <div class="mi-espacio-section-heading"><h3 tabindex="-1">Comunicaciones por revisar</h3><p>Reportes de discrepancias del equipo. Al aceptar una reivindicación de línea o autoría, se intentará registrar automáticamente la vinculación. Otros casos pueden necesitar una corrección manual.</p></div>
            <div class="me-review-filters" role="tablist" aria-label="Estado de las comunicaciones">
              <button v-for="f in reviewFilters" :key="f.value" type="button" role="tab" class="me-review-tab" :class="{'is-active':state.review.filter===f.value}" :aria-selected="state.review.filter===f.value" @click="setReviewFilter(f.value)">{{f.label}}</button>
            </div>
            <p v-if="state.review.error" class="me-form-error" role="alert">{{state.review.error}}</p><p v-if="state.review.notice" class="me-review-feedback" role="status">{{state.review.notice}}</p>
            <p v-if="state.review.busy" class="mi-espacio-empty" role="status">Cargando la cola…</p>
            <ul v-else-if="state.review.items.length" class="me-review-list">
              <li v-for="it in state.review.items" :key="it.id" class="me-review-item">
                <div class="me-review-top">
                  <span class="me-review-meta"><strong>{{kindLabel(it.kind)}}</strong><small> · {{subjectLabel(it.subjectType)}}</small><small v-if="it.subjectLabel"> · {{it.subjectLabel}}</small></span>
                  <span class="me-chip" :data-tone="it.status">{{reportStatus(it.status)}}</span>
                </div>
                <p v-if="it.message" class="me-review-msg">{{it.message}}</p>
                <p class="me-review-by"><span v-if="it.reporterName">{{it.reporterName}}</span><small v-if="it.createdAt"> · {{fmtDate(it.createdAt)}}</small></p>
                <template v-if="it.status==='open'||it.status==='in_review'">
                  <input class="me-review-note" type="text" maxlength="2000" v-model="state.review.notes[it.id]" :aria-label="'Nota de resolución para '+kindLabel(it.kind)" placeholder="Nota de resolución (opcional)">
                  <div class="me-review-actions">
                    <button type="button" class="mi-espacio-refresh" :disabled="state.review.acting===it.id" @click="resolveItem(it.id,'rejected')">Rechazar</button>
                    <button type="button" class="me-btn-primary" :disabled="state.review.acting===it.id" @click="resolveItem(it.id,'accepted')">{{state.review.acting===it.id?'Guardando…':'Aceptar'}}</button>
                  </div>
                </template>
                <p v-else-if="it.resolutionNote" class="me-review-resolved"><small>Resolución:</small> {{it.resolutionNote}}</p>
              </li>
            </ul>
            <p v-else class="mi-espacio-empty">No hay comunicaciones {{emptyLabel(state.review.filter)}}.</p>
          </section>

              </div>
            </template>
          </template>
        </template>
      </section>`
    };
  }
  root.NeumMiEspacio={createView};
})(typeof window!=='undefined'?window:globalThis);
