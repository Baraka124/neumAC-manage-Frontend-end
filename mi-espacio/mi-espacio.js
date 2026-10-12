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
  const GUARDIA = { primary:'Principal', backup:'Refuerzo', resident:'Residente' };
  const ROTATION = { resident:'Residente', supervisor:'Supervisión' };
  const STUDY = { PI:'IP', 'co-investigator':'Co-investigador', 'sub-investigator':'Sub-investigador' };
  const LINE = { coordinator:'Coordinación', member:'Miembro' };
  const PROJECT = { lead:'Responsable', 'co-investigator':'Co-investigador' };
  const ABSENCE = { pending:'Pendiente', active:'En curso', approved:'Aprobada' };
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
        const state=Vue.reactive({busy:false,error:'',context:null,activityBusy:false,activityError:'',activity:null,dutyMode:'overview',dutyIndex:null,researchGroup:'lines',researchIndex:null,publicationIndex:null,toolsOpen:false,
          reports:[],report:{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:'',subject_id:'',subject_label:''},
          picker:{busy:false,items:[],forType:''},
          review:{can:false,busy:false,error:'',notice:'',filter:'open',items:[],acting:'',notes:{}}});
        let seq=0, controller=null;
        const can = view => typeof props.canOpenView === 'function' && props.canOpenView(view);
        const linked=Vue.computed(()=>state.context?.linkState==='linked');
        const initials=Vue.computed(()=>String(state.context?.staff?.name||state.context?.account?.name||'')
          .split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('').toLocaleUpperCase()||'·');
        function clear(){
          ++seq;
          if(controller)controller.abort();
          controller=null;
          state.context=null;state.error='';state.busy=false;
          state.activity=null;state.activityError='';state.activityBusy=false;state.toolsOpen=false;state.dutyMode='overview';state.dutyIndex=null;state.researchGroup='lines';state.researchIndex=null;state.publicationIndex=null;
          state.reports=[];
          Object.assign(state.report,{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:'',subject_id:'',subject_label:''});
          Object.assign(state.picker,{busy:false,items:[],forType:''});
          Object.assign(state.review,{can:false,busy:false,error:'',notice:'',filter:'open',items:[],acting:'',notes:{}});
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
          const t=state.report.subject_type;
          state.report.subject_id='';state.report.subject_label='';
          if(t!=='line'&&t!=='publication'){ state.picker.items=[];state.picker.forType=''; return; }
          if(state.picker.forType===t&&state.picker.items.length) return;
          state.picker.busy=true;state.picker.forType=t;state.picker.items=[];
          try {
            const loader=t==='line'?root.NeumMiEspacioData.loadLineOptions:root.NeumMiEspacioData.loadPublicationOptions;
            const items=await loader((p,o)=>API.request(p,o),controller&&controller.signal);
            if(state.report.subject_type===t) state.picker.items=items;
          } catch(err){ if(state.report.subject_type===t) state.picker.items=[]; }
          finally { if(state.report.subject_type===t) state.picker.busy=false; }
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
          const f=state.report;
          if(!f.subject_type||!f.kind){ f.error='Indica sobre qué y qué ocurre.'; return; }
          if((f.subject_type==='line'||f.subject_type==='publication')&&!f.subject_id){ f.error='Elige cuál de la lista.'; return; }
          f.busy=true;f.error='';
          try {
            await root.NeumMiEspacioData.submitDiscrepancy(
              (p,o)=>API.request(p,o),{subject_type:f.subject_type,kind:f.kind,message:f.message,subject_id:f.subject_id,subject_label:f.subject_label},controller&&controller.signal);
            f.done=true;f.open=false;f.subject_type='';f.kind='';f.message='';f.subject_id='';f.subject_label='';
            state.picker.items=[];state.picker.forType='';
            loadReports(seq, String(props.user?.id||''));
          } catch(err){ f.error=err?.message||'No se ha podido enviar la comunicación.'; }
          finally { f.busy=false; }
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
        async function resolveItem(reportId, status){
          if(state.review.acting)return;
          state.review.acting=reportId;state.review.error='';state.review.notice='';
          try {
            const result=await root.NeumMiEspacioData.resolveReport(
              (p,o)=>API.request(p,o), reportId, {status, resolution_note:state.review.notes[reportId]||''}, controller&&controller.signal);
            const outcome=root.NeumMiEspacioData.reviewOutcome(result,status);
            state.review.notice=outcome.message;
            delete state.review.notes[reportId];
            await loadReviewQueue(seq, String(props.user?.id||''));
            if(status==='accepted' && !outcome.needsAttention && (result.linked==='line_member' || result.linked==='publication_author')){
              await loadActivity(seq, String(props.user?.id||''));
            }
          } catch(err){ if(err?.name!=='AbortError')state.review.error=err?.message||'No se ha podido actualizar la comunicación.'; }
          finally { state.review.acting=''; }
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
            if(result.linkState==='linked'){ loadActivity(requestSeq, identity); loadReports(requestSeq, identity); }
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
          state.dutyMode='duties';
          const entries=state.activity?.agenda?.guardias || [];
          state.dutyIndex=Number.isInteger(index)&&index>=0&&index<entries.length ? index : null;
          focusDuty(state.dutyIndex===null ? '.me-duty-heading' : '.me-duty-row[data-index="'+state.dutyIndex+'"]');
        }
        function selectDuty(index) {
          const entries=state.activity?.agenda?.guardias || [];
          if(!Number.isInteger(index)||index<0||index>=entries.length)return;
          if(state.dutyIndex===index){closeDutyDetail();return;}
          state.dutyIndex=index; // Keep the clicked record in place.
        }
        function closeDutyDetail(){
          const index=state.dutyIndex;state.dutyIndex=null;
          focusDuty('.me-duty-row[data-index="'+index+'"]');
        }
        function backToAgenda(){state.dutyMode='overview';state.dutyIndex=null;focusDuty('.me-v9-agenda-title');}
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
          if(state.researchGroup==='studies')return r.code || '';
          return r.stage || '';
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
        function onEscape(event){
          // Only nested personal disclosures; keep global shell shortcuts untouched.
          const target=event.target;
          if(!target || typeof target.closest!=='function')return;
          if(target.closest('.me-duty-list') && selectedDuty.value){closeDutyDetail();event.stopPropagation();}
          else if(target.closest('.me-publication-layout') && selectedPublication.value){closePublication();event.stopPropagation();}
          else if(target.closest('.me-portfolio:not(.me-publications)') && selectedResearch.value){closeResearch();event.stopPropagation();}
        }
        return {
          state,linked,initials,can,refresh:load,selectedDuty,
          openDuties,selectDuty,closeDutyDetail,backToAgenda,fmtDutyDate,
          dutyShift:root.NeumMiEspacioData.formatDutyShift,
          researchGroups,researchItems,selectedResearch,selectedPublication,
          researchRecordTitle,researchRecordMeta,researchRecordRole,
          changeResearchGroup,selectResearch,closeResearch,selectPublication,closePublication,onEscape,
          navigate:view=>can(view)&&emit('navigate',view),
          fmtDate,
          guardiaRole:k=>label(GUARDIA,k), rotationRole:k=>label(ROTATION,k),
          studyRole:k=>label(STUDY,k), lineRole:k=>label(LINE,k), projectRole:k=>label(PROJECT,k),
          absenceStatus:k=>label(ABSENCE,k),
          subjectLabel:k=>label(SUBJECT_LABELS,k), kindLabel:k=>label(KIND_LABELS,k), reportStatus:k=>label(REPORT_STATUS,k),
          subjectOptions:SUBJECT_OPTIONS, kindOptions:KIND_OPTIONS,
          openReportForm, submitReport, onSubjectTypeChange, onSubjectPick, claimPublication,
          reviewFilters:REVIEW_FILTERS, setReviewFilter, resolveItem,
          emptyLabel:f=>EMPTY_BY_FILTER[f]||'por revisar'
        };
      },
      template: `
      <section class="mi-espacio mi-espacio--v8 mi-espacio--v9" aria-labelledby="mi-espacio-title" @keydown.esc="onEscape">
        <header class="mi-espacio-head me-v9-accessible-head"><h2 id="mi-espacio-title" tabindex="-1">Mi espacio</h2></header>
        <p v-if="state.busy" class="mi-espacio-state" role="status">Verificando tu perfil…</p>
        <div v-else-if="state.error" class="mi-espacio-notice" role="alert">{{state.error}} <button type="button" @click="refresh">Reintentar</button></div>
        <template v-else-if="state.context">
          <div v-if="state.context.testSession" class="mi-espacio-notice" role="status">Sesión de prueba. Verifica la identidad de esta cuenta.</div>
          <section class="mi-espacio-person me-v9-identity" aria-label="Identidad institucional verificada">
            <span class="mi-espacio-avatar" aria-hidden="true">{{initials}}</span>
            <div class="mi-espacio-person-main">
              <div class="me-v9-name-line">
                <h3>{{state.context.staff?.name || state.context.account.name}}</h3>
                <span class="mi-espacio-link-state" :class="linked?'is-linked':'is-unlinked'"><span v-if="linked" aria-hidden="true">✓</span> {{linked?'Perfil vinculado':state.context.linkState==='unlinked'?'Vinculación pendiente':'Vinculación no disponible'}}</span>
              </div>
              <p>{{state.context.staff?.specialization || state.context.staff?.staffType || state.context.account.role || 'Cuenta institucional'}}</p>
              <p class="mi-espacio-person-email">{{state.context.staff?.professionalEmail || state.context.account.email}}</p>
            </div>
            <button type="button" class="mi-espacio-refresh me-v9-refresh" :disabled="state.busy" @click="refresh">Actualizar</button>
          </section>
          <div v-if="!linked" class="mi-espacio-notice" role="status">La actividad personal no se muestra hasta verificar la vinculación de esta cuenta con una ficha profesional. Contacta con la persona responsable de accesos.</div>
          <template v-if="linked">
            <div v-if="state.activityBusy" class="me-activity me-activity-placeholder" role="status">Cargando actividad vinculada…</div>
            <div v-else-if="state.activityError" class="mi-espacio-notice" role="alert">{{state.activityError}} <button type="button" @click="refresh">Reintentar</button></div>
            <template v-else-if="state.activity">
              <div v-if="state.dutyMode==='overview'" class="me-v8-overview me-v9-overview">
                <section class="me-v8-column me-v8-agenda me-v9-panel" aria-labelledby="me-v9-agenda-title">
                  <div class="me-v9-panel-heading"><div><p class="mi-espacio-eyebrow">AGENDA PERSONAL</p><h3 id="me-v9-agenda-title" class="me-v9-agenda-title" tabindex="-1">Mi agenda</h3></div><span v-if="state.activity.counts.guardias" class="me-v9-verified-count">{{state.activity.counts.guardias}} próximas</span></div>
                  <div v-if="state.activity.agenda.guardias.length" class="me-v8-commitments">
                    <div class="me-v8-upnext me-v9-feature"><span class="me-v8-kicker">PRÓXIMA GUARDIA</span><strong>{{fmtDutyDate(state.activity.agenda.guardias[0].date)}}</strong><span>{{dutyShift(state.activity.agenda.guardias[0].shift)}} · {{guardiaRole(state.activity.agenda.guardias[0].role)}}</span></div>
                    <ol v-if="state.activity.agenda.guardias.length>1" class="me-v8-timeline me-v9-timeline"><li v-for="(g,index) in state.activity.agenda.guardias.slice(1,3)" :key="g.id||index"><span>{{fmtDutyDate(g.date)}}</span><small>{{dutyShift(g.shift)}} · {{guardiaRole(g.role)}}</small></li></ol>
                    <button v-if="state.activity.agenda.guardias.length>3" type="button" class="me-duty-open me-v9-inline-action" @click="openDuties()">Ver todas mis guardias <span aria-hidden="true">→</span></button>
                  </div>
                  <p v-else class="me-v8-quiet me-v9-empty">No tienes próximas guardias registradas.</p>
                  <div v-if="state.activity.agenda.rotations.length || state.activity.agenda.absences.length" class="me-v8-secondary-agenda">
                    <div v-if="state.activity.agenda.rotations.length"><h4>Rotaciones</h4><ul><li v-for="r in state.activity.agenda.rotations" :key="r.id">{{r.unit||r.resident||'Rotación'}} <small>{{fmtDate(r.start)}}–{{fmtDate(r.end)}}</small></li></ul></div>
                    <div v-if="state.activity.agenda.absences.length"><h4>Ausencias</h4><ul><li v-for="a in state.activity.agenda.absences" :key="a.id">{{a.type||'Ausencia'}} <small>{{fmtDate(a.start)}}–{{fmtDate(a.end)}}</small></li></ul></div>
                  </div>
                </section>
                <section class="me-v8-column me-v8-research me-v9-panel" aria-labelledby="me-v9-research-title">
                  <div class="me-v9-panel-heading"><div><p class="mi-espacio-eyebrow">PARTICIPACIÓN VERIFICADA</p><h3 id="me-v9-research-title">Mi investigación</h3></div></div>
                  <div v-if="state.activity.counts.lines+state.activity.counts.studies+state.activity.counts.projects" class="me-v8-research-groups">
                    <div v-if="state.activity.research.lines.length"><h4>Líneas de investigación <span>{{state.activity.counts.lines}}</span></h4><ul><li v-for="l in state.activity.research.lines" :key="l.id"><span>{{l.name}}</span><small>{{lineRole(l.role)}}</small></li></ul></div>
                    <div v-if="state.activity.research.studies.length"><h4>Estudios <span>{{state.activity.counts.studies}}</span></h4><ul><li v-for="s in state.activity.research.studies" :key="s.id"><span>{{s.title}}</span><small>{{studyRole(s.role)}}<template v-if="s.code"> · {{s.code}}</template></small></li></ul></div>
                    <div v-if="state.activity.research.projects.length"><h4>Proyectos <span>{{state.activity.counts.projects}}</span></h4><ul><li v-for="p in state.activity.research.projects" :key="p.id"><span>{{p.title}}</span><small>{{projectRole(p.role)}}<template v-if="p.stage"> · {{p.stage}}</template></small></li></ul></div>
                  </div>
                  <p v-else class="me-v8-quiet me-v9-empty">No hay líneas, estudios o proyectos vinculados a tu perfil.</p>
                </section>
              </div>
              <section v-else class="me-v8-all-duties" aria-label="Mis guardias">
                <button type="button" class="me-duty-back" @click="backToAgenda">← Volver a mi espacio</button>
                <h3 class="me-duty-heading" tabindex="-1">Mis guardias</h3>
                <ol class="me-v8-timeline"><li v-for="g in state.activity.agenda.guardias" :key="g.id"><span>{{fmtDutyDate(g.date)}}</span><small>{{dutyShift(g.shift)}} · {{guardiaRole(g.role)}}</small></li></ol>
                <button v-if="can('oncall_schedule')" type="button" class="me-duty-institutional" @click="navigate('oncall_schedule')">Abrir cuadrante departamental ↗</button>
              </section>
              <div v-if="state.dutyMode==='overview'" class="me-v9-lower-grid">
                <section class="me-v9-publications" aria-label="Mis publicaciones">
                  <div class="me-v9-panel-heading"><div><p class="mi-espacio-eyebrow">PRODUCCIÓN CIENTÍFICA</p><h3>Mis publicaciones <span v-if="state.activity.counts.publications" class="me-v9-verified-count">{{state.activity.counts.publications}}</span></h3></div><button type="button" class="me-pubs-claim" @click="claimPublication">Reivindicar una publicación</button></div>
                  <ol v-if="state.activity.publications.items.length" class="me-v8-publication-list"><li v-for="p in state.activity.publications.items" :key="p.id"><strong>{{p.title}}</strong><span v-if="p.byline">{{p.byline}}</span><small v-if="p.order!==null">Posición de autoría: {{p.order}}<template v-if="p.corresponding"> · Autoría de correspondencia</template></small><small v-else-if="p.corresponding">Autoría de correspondencia</small></li></ol>
                  <p v-else-if="!state.activity.publications.available" class="me-v8-quiet" role="status">La información de publicaciones no está disponible actualmente.</p><p v-else class="me-v8-quiet">No hay publicaciones vinculadas a tu perfil.</p>
                </section>
                <section class="me-v9-services" aria-label="Comunicaciones y gestiones">
                  <div class="me-v9-panel-heading"><div><p class="mi-espacio-eyebrow">GESTIÓN PERSONAL</p><h3>Comunicaciones</h3></div></div>
                  <p>Consultas y correcciones de tu información profesional.</p><p v-if="state.reports.length" class="me-v9-service-meta">Comunicaciones enviadas · {{state.reports.length}}</p>
                  <button type="button" class="me-v8-tools-toggle" :aria-expanded="state.toolsOpen" aria-controls="me-v8-administration" @click="state.toolsOpen=!state.toolsOpen">{{state.toolsOpen?'Cerrar gestiones':'Comunicaciones y gestiones'}} <span aria-hidden="true">{{state.toolsOpen?'−':'→'}}</span></button>
                </section>
              </div>
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
                <h4>Mis comunicaciones</h4>
                <ul class="me-list">
                  <li v-for="r in state.reports.slice(0,5)" :key="r.id">
                    <span class="me-item-main">{{subjectLabel(r.subjectType)}} · {{kindLabel(r.kind)}}<small v-if="r.subjectLabel"> · {{r.subjectLabel}}</small></span>
                    <span class="me-chip" :data-tone="r.status">{{reportStatus(r.status)}}</span>
                  </li>
                </ul>
              </div>
            </section>
                            
                <section v-if="state.toolsOpen && state.review.can && state.dutyMode==='overview'" class="me-review" aria-label="Comunicaciones del equipo por revisar">
            <div class="mi-espacio-section-heading"><h3>Comunicaciones por revisar</h3><p>Reportes de discrepancias del equipo. Al aceptar una reivindicación de línea o autoría, se intentará registrar automáticamente la vinculación. Otros casos pueden necesitar una corrección manual.</p></div>
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
