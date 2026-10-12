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
        const state=Vue.reactive({busy:false,error:'',context:null,activityBusy:false,activityError:'',activity:null,dutyMode:'overview',dutyIndex:null,researchGroup:'lines',researchIndex:null,publicationIndex:null,
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
          state.activity=null;state.activityError='';state.activityBusy=false;state.dutyMode='overview';state.dutyIndex=null;state.researchGroup='lines';state.researchIndex=null;state.publicationIndex=null;
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
          state.report.open=true;state.report.done=false;state.report.error='';
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
        function backToAgenda(){state.dutyMode='overview';state.dutyIndex=null;focusDuty('.me-duty-open');}
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
      <section class="mi-espacio" aria-labelledby="mi-espacio-title" @keydown.esc="onEscape">
        <header class="mi-espacio-head">
          <div><p class="mi-espacio-eyebrow">ACTIVIDAD PERSONAL</p>
          <h2 id="mi-espacio-title" tabindex="-1">Mi espacio</h2>
          <p>Agenda, investigación y publicaciones vinculadas a tu perfil.</p></div>
          <button v-if="state.context||state.error" type="button" class="mi-espacio-refresh" :disabled="state.busy" @click="refresh">Actualizar</button>
        </header>
        <p v-if="state.busy" class="mi-espacio-state" role="status">Verificando tu cuenta y vinculación profesional…</p>
        <div v-else-if="state.error" class="mi-espacio-state" role="alert"><strong>No se puede cargar Mi espacio.</strong><p>{{state.error}}</p><button type="button" class="mi-espacio-refresh" @click="refresh">Reintentar</button></div>
        <template v-else-if="state.context">
          <div v-if="state.context.testSession" class="mi-espacio-notice" role="status">Sesión de prueba. Comprueba que la identidad y los permisos corresponden a la cuenta seleccionada.</div>
          <section class="mi-espacio-person" aria-label="Identidad institucional verificada">
            <span class="mi-espacio-avatar" aria-hidden="true">{{initials}}</span>
            <div class="mi-espacio-person-main"><p class="mi-espacio-eyebrow">PERFIL PROFESIONAL</p>
              <h3>{{state.context.staff?.name || state.context.account.name}}</h3>
              <p>{{state.context.staff?.specialization || state.context.staff?.staffType || state.context.account.role || "Cuenta institucional"}}</p>
              <p class="mi-espacio-person-email">{{state.context.staff?.professionalEmail || state.context.account.email}}</p>
            </div>
            <span class="mi-espacio-link-state" :class="linked ? 'is-linked' : 'is-unlinked'">{{linked?"Perfil vinculado":state.context.linkState==="unlinked"?"Vinculación pendiente":"Vinculación no disponible"}}</span>
          </section>
          <div v-if="!linked" class="mi-espacio-notice" role="status"><strong>Tu cuenta está activa, pero no podemos verificar su vínculo con la ficha profesional.</strong><p>La actividad personal no se mostrará hasta que se confirme la vinculación. Contacta con la persona responsable de accesos; no se asignarán datos por coincidencias de nombres.</p></div>

          <template v-if="linked">
            <div v-if="state.activityBusy" class="me-activity me-activity-placeholder" role="status" aria-label="Cargando tu actividad personal">
              <div class="me-skel-head" aria-hidden="true"></div>
              <div class="me-loading-agenda" aria-hidden="true">
                <div class="me-loading-primary"><div class="me-skel-line"></div><div class="me-skel-line short"></div><div class="me-skel-line"></div></div>
                <div class="me-loading-secondary"><div class="me-skel-line"></div><div class="me-skel-line short"></div></div>
              </div>
              <div class="me-loading-research" aria-hidden="true"><div class="me-skel-line"></div><div class="me-skel-line short"></div></div>
            </div>
            <div v-else-if="state.activityError" class="mi-espacio-notice" role="status"><strong>No se ha podido cargar tu actividad ahora mismo.</strong><p>Tu identidad está verificada; vuelve a intentarlo en un momento.</p><button type="button" class="mi-espacio-refresh" @click="refresh">Reintentar</button></div>

            <template v-else-if="state.activity">
              <section class="me-activity me-agenda" aria-label="Mi agenda">
                <div v-if="state.dutyMode==='overview'" class="mi-espacio-section-heading"><p class="mi-espacio-eyebrow">ACTIVIDAD ASISTENCIAL</p><h3>Mi agenda</h3><p>Las asignaciones vinculadas a tu perfil institucional.</p></div>
                <div v-if="state.dutyMode==='overview'" class="me-agenda-layout">
                  <article class="me-agenda-feature">
                    <header class="me-card-head"><h4>Próximas guardias</h4><span class="me-count">{{state.activity.counts.guardias}}</span></header>
                    <button v-if="state.activity.agenda.guardias.length" type="button" class="me-duty-next" @click="openDuties(0)">
                      <span class="me-duty-next-label">PRÓXIMA ASIGNACIÓN</span>
                      <strong>{{fmtDutyDate(state.activity.agenda.guardias[0].date)}}</strong>
                      <span>{{dutyShift(state.activity.agenda.guardias[0].shift)}} · {{guardiaRole(state.activity.agenda.guardias[0].role)}}</span>
                      <span class="me-duty-next-arrow" aria-hidden="true">↗</span>
                    </button>
                    <p v-else class="mi-espacio-empty">Sin guardias próximas registradas.</p>
                    <button class="me-duty-open" type="button" @click="openDuties()">Ver mis guardias <span aria-hidden="true">→</span></button>
                  </article>
                  <div class="me-agenda-secondary" aria-label="Otras asignaciones personales">
                    <article v-if="state.activity.agenda.rotations.length" class="me-card">
                      <header class="me-card-head"><h4>Rotaciones</h4><span class="me-count">{{state.activity.counts.rotations}}</span></header>
                      <ul class="me-list"><li v-for="r in state.activity.agenda.rotations" :key="r.id"><span class="me-item-main">{{r.unit || r.resident || 'Rotación'}}<small v-if="r.start"> · {{fmtDate(r.start)}}–{{fmtDate(r.end)}}</small></span><span class="me-chip" :data-tone="r.role">{{rotationRole(r.role)}}</span></li></ul>
                    </article>
                    <article v-if="state.activity.agenda.absences.length" class="me-card">
                      <header class="me-card-head"><h4>Ausencias</h4><span class="me-count">{{state.activity.counts.absences}}</span></header>
                      <ul class="me-list"><li v-for="a in state.activity.agenda.absences" :key="a.id"><span class="me-item-main">{{a.type || 'Ausencia'}}<small v-if="a.start"> · {{fmtDate(a.start)}}–{{fmtDate(a.end)}}</small></span><span class="me-chip" :data-tone="a.status">{{absenceStatus(a.status)}}</span></li></ul>
                    </article>
                    <p v-if="!state.activity.counts.rotations && !state.activity.counts.absences" class="me-agenda-status">No hay rotaciones ni ausencias activas registradas.</p>
                    <p v-else-if="!state.activity.counts.rotations" class="me-agenda-status">Sin rotaciones activas.</p>
                    <p v-else-if="!state.activity.counts.absences" class="me-agenda-status">Sin ausencias registradas.</p>
                  </div>
                </div>
                <div v-else class="me-duty-workspace" aria-label="Mis guardias">
                  <div class="me-duty-workspace-head"><button type="button" class="me-duty-back" @click="backToAgenda">← Mi agenda</button><h4 class="me-duty-heading" tabindex="-1">Mis guardias</h4><p>Tu lista personal de asignaciones próximas.</p></div>
                  <div class="me-duty-master-detail" :class="{'has-selection':!!selectedDuty}">
                    <div class="me-duty-list" aria-label="Asignaciones próximas">
                      <ol v-if="state.activity.agenda.guardias.length">
                        <li v-for="(g,index) in state.activity.agenda.guardias" :key="g.id || index" class="me-duty-list-item">
                          <button type="button" class="me-duty-row" :data-index="index" :class="{'is-selected':state.dutyIndex===index}" :aria-expanded="state.dutyIndex===index" :aria-controls="'me-duty-detail-'+index" @click="selectDuty(index)">
                            <span class="me-duty-row-main"><strong>{{fmtDutyDate(g.date)}}</strong><small>{{dutyShift(g.shift)}}</small></span>
                            <span class="me-chip" :data-tone="g.role">{{guardiaRole(g.role)}}</span>
                            <span class="me-disclosure-chevron" aria-hidden="true">⌄</span>
                          </button>
                          <section v-if="selectedDuty && state.dutyIndex===index" class="me-duty-detail me-inline-detail" :id="'me-duty-detail-'+index" :aria-label="'Detalle de guardia del '+fmtDutyDate(selectedDuty.date)">
                            <p class="mi-espacio-eyebrow">DATOS DE TU ASIGNACIÓN</p>
                            <dl class="me-duty-facts"><div><dt>Modalidad</dt><dd>{{dutyShift(selectedDuty.shift)}}</dd></div><div><dt>Tu función</dt><dd>{{guardiaRole(selectedDuty.role)}}</dd></div></dl>
                            <p class="me-duty-provenance">Asignación registrada y vinculada a tu perfil institucional.</p>
                          </section>
                        </li>
                      </ol>
                      <p v-else class="mi-espacio-empty">No tienes guardias próximas registradas.</p>
                    </div>
                  </div>
                  <button v-if="can('oncall_schedule')" type="button" class="me-duty-institutional" @click="navigate('oncall_schedule')">Abrir cuadrante departamental <span aria-hidden="true">↗</span></button>
                </div>
              </section>

              <section v-if="state.dutyMode==='overview'" class="me-activity me-portfolio" aria-label="Mi investigación">
                <div class="mi-espacio-section-heading"><h3>Mi investigación</h3><p>Líneas, estudios y proyectos en los que participas.</p></div>
                <div class="me-portfolio-groups" role="group" aria-label="Tipo de actividad científica">
                  <button v-for="g in researchGroups" :key="g.id" type="button" class="me-portfolio-group" :class="{'is-active':state.researchGroup===g.id}" :aria-pressed="state.researchGroup===g.id" @click="changeResearchGroup(g.id)">{{g.label}} <span>{{state.activity.research[g.id].length}}</span></button>
                </div>
                <div class="me-portfolio-layout" :class="{'has-selection':!!selectedResearch}">
                  <div class="me-portfolio-entries">
                    <ul v-if="researchItems.length" class="me-portfolio-list">
                      <li v-for="(r,i) in researchItems" :key="r.id || i" class="me-portfolio-list-item">
                        <button type="button" class="me-portfolio-entry" :data-index="i" :class="{'is-active':state.researchIndex===i}" :aria-expanded="state.researchIndex===i" :aria-controls="'me-research-detail-'+i" @click="selectResearch(i)">
                          <span class="me-portfolio-entry-copy"><small v-if="researchRecordMeta(r)">{{researchRecordMeta(r)}}</small><strong>{{researchRecordTitle(r)}}</strong><span>{{researchRecordRole(r)}}</span></span><span class="me-disclosure-chevron" aria-hidden="true">⌄</span>
                        </button>
                        <section v-if="selectedResearch && state.researchIndex===i" class="me-portfolio-detail me-inline-detail" :id="'me-research-detail-'+i" :aria-label="'Mi participación: '+researchRecordTitle(selectedResearch)">
                          <p class="mi-espacio-eyebrow">MI PARTICIPACIÓN</p>
                          <dl class="me-portfolio-facts">
                            <div><dt>Función verificada</dt><dd>{{researchRecordRole(selectedResearch)}}</dd></div>
                            <div v-if="researchRecordMeta(selectedResearch)"><dt>{{state.researchGroup==='lines'?'Línea':state.researchGroup==='studies'?'Protocolo':'Etapa'}}</dt><dd>{{researchRecordMeta(selectedResearch)}}</dd></div>
                            <div v-if="state.researchGroup==='studies' && selectedResearch.status"><dt>Estado registrado</dt><dd>{{selectedResearch.status}}</dd></div>
                            <div v-if="state.researchGroup==='projects' && selectedResearch.category"><dt>Categoría</dt><dd>{{selectedResearch.category}}</dd></div>
                          </dl>
                        </section>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">No tienes {{state.researchGroup==='lines'?'líneas':state.researchGroup==='studies'?'estudios':'proyectos'}} vinculados.</p>
                  </div>
                </div>
              </section>
              <section v-if="state.dutyMode==='overview'" class="me-activity me-publications" aria-label="Mis publicaciones">
                <div class="mi-espacio-section-heading me-publications-heading"><div><h3>Mis publicaciones</h3><p>Autoría asociada a tu identidad profesional.</p></div><button class="me-pubs-claim" type="button" @click="claimPublication">Reivindicar una publicación</button></div>
                <div class="me-portfolio-layout me-publication-layout" :class="{'has-selection':!!selectedPublication}">
                  <div class="me-portfolio-entries">
                    <ol v-if="state.activity.publications.items.length" class="me-portfolio-list">
                      <li v-for="(p,i) in state.activity.publications.items" :key="p.id || i" class="me-portfolio-list-item">
                        <button type="button" class="me-portfolio-entry me-publication-entry" :data-index="i" :class="{'is-active':state.publicationIndex===i}" :aria-expanded="state.publicationIndex===i" :aria-controls="'me-publication-detail-'+i" @click="selectPublication(i)">
                          <span class="me-portfolio-entry-copy"><strong>{{p.title}}</strong><small v-if="p.byline">{{p.byline}}</small><span v-if="p.corresponding">Autoría de correspondencia</span></span><span class="me-disclosure-chevron" aria-hidden="true">⌄</span>
                        </button>
                        <section v-if="selectedPublication && state.publicationIndex===i" class="me-portfolio-detail me-inline-detail" :id="'me-publication-detail-'+i" :aria-label="'Mi autoría: '+selectedPublication.title">
                          <p class="mi-espacio-eyebrow">DATOS DE AUTORÍA</p>
                          <dl class="me-portfolio-facts">
                            <div v-if="selectedPublication.byline"><dt>Autores</dt><dd>{{selectedPublication.byline}}</dd></div>
                            <div v-if="selectedPublication.order!==null"><dt>Posición de autoría</dt><dd>{{selectedPublication.order}}</dd></div>
                            <div><dt>Autoría de correspondencia</dt><dd>{{selectedPublication.corresponding?'Sí':'No consta'}}</dd></div>
                          </dl>
                        </section>
                      </li>
                    </ol>
                    <p v-else-if="!state.activity.publications.available" class="mi-espacio-empty" role="status">La información de autorías no está disponible en este momento.</p>
                    <p v-else class="mi-espacio-empty">Aún no hay publicaciones vinculadas a tu perfil. Puedes comunicar una autoría pendiente de verificación.</p>
                  </div>
                </div>
              </section>
            </template>

            <section v-if="state.dutyMode==='overview' && !state.activityBusy && !!state.activity" class="me-report" aria-label="Comunicar una discrepancia">
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
          </template>

          <section v-if="state.review.can && !state.activityBusy && state.dutyMode==='overview'" class="me-review" aria-label="Comunicaciones del equipo por revisar">
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


        </template>
      </section>`
    };
  }
  root.NeumMiEspacio={createView};
})(typeof window!=='undefined'?window:globalThis);
