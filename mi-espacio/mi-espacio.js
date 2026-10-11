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
        const state=Vue.reactive({busy:false,error:'',context:null,activityBusy:false,activityError:'',activity:null,
          reports:[],report:{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:''},
          review:{can:false,busy:false,error:'',filter:'open',items:[],acting:'',notes:{}}});
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
          state.activity=null;state.activityError='';state.activityBusy=false;
          state.reports=[];
          Object.assign(state.report,{open:false,busy:false,error:'',done:false,subject_type:'',kind:'',message:''});
          Object.assign(state.review,{can:false,busy:false,error:'',filter:'open',items:[],acting:'',notes:{}});
        }
        async function loadReports(requestSeq, identity){
          try {
            const rows=await root.NeumMiEspacioData.loadMyReports((p,o)=>API.request(p,o),controller&&controller.signal);
            if(requestSeq!==seq||!props.active||String(props.user?.id)!==identity)return;
            state.reports=rows;
          } catch(err){ if(err?.name!=='AbortError'){/* non-fatal: the list simply stays empty */} }
        }
        function openReportForm(){ state.report.open=true;state.report.done=false;state.report.error=''; }
        async function submitReport(){
          const f=state.report;
          if(!f.subject_type||!f.kind){ f.error='Indica sobre qué y qué ocurre.'; return; }
          f.busy=true;f.error='';
          try {
            await root.NeumMiEspacioData.submitDiscrepancy(
              (p,o)=>API.request(p,o),{subject_type:f.subject_type,kind:f.kind,message:f.message},controller&&controller.signal);
            f.done=true;f.open=false;f.subject_type='';f.kind='';f.message='';
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
          state.review.filter=value;
          loadReviewQueue(seq, String(props.user?.id||''));
        }
        async function resolveItem(reportId, status){
          if(state.review.acting)return;
          state.review.acting=reportId;state.review.error='';
          try {
            await root.NeumMiEspacioData.resolveReport(
              (p,o)=>API.request(p,o), reportId, {status, resolution_note:state.review.notes[reportId]||''}, controller&&controller.signal);
            delete state.review.notes[reportId];
            await loadReviewQueue(seq, String(props.user?.id||''));
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
        const destinations=[
          {id:'oncall_schedule',label:'Guardias',desc:'Consultar el cuadrante institucional'},
          {id:'resident_rotations',label:'Rotaciones',desc:'Consultar las asignaciones registradas'},
          {id:'research_hub',label:'Investigación',desc:'Acceder a estudios y proyectos'},
          {id:'news',label:'Biblioteca',desc:'Consultar el registro de publicaciones'}
        ];
        return {
          state,linked,initials,destinations,can,refresh:load,
          navigate:view=>can(view)&&emit('navigate',view),
          fmtDate,
          guardiaRole:k=>label(GUARDIA,k), rotationRole:k=>label(ROTATION,k),
          studyRole:k=>label(STUDY,k), lineRole:k=>label(LINE,k), projectRole:k=>label(PROJECT,k),
          absenceStatus:k=>label(ABSENCE,k),
          subjectLabel:k=>label(SUBJECT_LABELS,k), kindLabel:k=>label(KIND_LABELS,k), reportStatus:k=>label(REPORT_STATUS,k),
          subjectOptions:SUBJECT_OPTIONS, kindOptions:KIND_OPTIONS,
          openReportForm, submitReport,
          reviewFilters:REVIEW_FILTERS, setReviewFilter, resolveItem,
          emptyLabel:f=>EMPTY_BY_FILTER[f]||'por revisar'
        };
      },
      template: `
      <section class="mi-espacio" aria-labelledby="mi-espacio-title">
        <header class="mi-espacio-head">
          <div><p class="mi-espacio-eyebrow">ÁREA PERSONAL · neumDESK</p>
          <h2 id="mi-espacio-title" tabindex="-1">Mi actividad profesional</h2>
          <p>Tu perfil institucional y tu actividad verificada, reunidos en un solo lugar.</p></div>
          <button v-if="state.context||state.error" type="button" class="mi-espacio-refresh" :disabled="state.busy" @click="refresh">Actualizar</button>
        </header>
        <p v-if="state.busy" class="mi-espacio-state" role="status">Verificando tu cuenta y vinculación profesional…</p>
        <div v-else-if="state.error" class="mi-espacio-state" role="alert"><strong>No se puede cargar Mi espacio.</strong><p>{{state.error}}</p><button type="button" class="mi-espacio-refresh" @click="refresh">Reintentar</button></div>
        <template v-else-if="state.context">
          <div v-if="state.context.testSession" class="mi-espacio-notice" role="status">Sesión de prueba. Comprueba que la identidad y los permisos corresponden a la cuenta seleccionada.</div>
          <section class="mi-espacio-person" aria-label="Identidad institucional verificada">
            <span class="mi-espacio-avatar" aria-hidden="true">{{initials}}</span>
            <div class="mi-espacio-person-main"><p class="mi-espacio-eyebrow">IDENTIDAD DE LA CUENTA</p>
              <h3>{{state.context.staff?.name || state.context.account.name}}</h3>
              <p>{{state.context.staff?.specialization || state.context.staff?.staffType || state.context.account.role || "Cuenta institucional"}}</p>
              <p class="mi-espacio-person-email">{{state.context.staff?.professionalEmail || state.context.account.email}}</p>
            </div>
            <span class="mi-espacio-link-state" :class="linked ? 'is-linked' : 'is-unlinked'">{{linked?"Perfil vinculado":state.context.linkState==="unlinked"?"Vinculación pendiente":"Vinculación no disponible"}}</span>
          </section>
          <div v-if="!linked" class="mi-espacio-notice" role="status"><strong>Tu cuenta está activa, pero no podemos verificar su vínculo con la ficha profesional.</strong><p>La actividad personal no se mostrará hasta que se confirme la vinculación. Contacta con la persona responsable de accesos; no se asignarán datos por coincidencias de nombres.</p></div>

          <template v-if="linked">
            <div v-if="state.activityBusy" class="me-activity" aria-hidden="true">
              <div class="me-skel-head"></div>
              <div class="me-cards"><div class="me-card me-skel" v-for="n in 3" :key="n"><div class="me-skel-line"></div><div class="me-skel-line short"></div><div class="me-skel-line short"></div></div></div>
            </div>
            <div v-else-if="state.activityError" class="mi-espacio-notice" role="status"><strong>No se ha podido cargar tu actividad ahora mismo.</strong><p>Tu identidad está verificada; vuelve a intentarlo en un momento.</p><button type="button" class="mi-espacio-refresh" @click="refresh">Reintentar</button></div>

            <template v-else-if="state.activity">
              <section class="me-activity" aria-label="Mi agenda">
                <div class="mi-espacio-section-heading"><h3>Mi agenda</h3><p>Tus próximos compromisos asistenciales.</p></div>
                <div class="me-cards">
                  <article class="me-card">
                    <header class="me-card-head"><h4>Próximas guardias</h4><span class="me-count">{{state.activity.counts.guardias}}</span></header>
                    <ul v-if="state.activity.agenda.guardias.length" class="me-list">
                      <li v-for="g in state.activity.agenda.guardias.slice(0,6)" :key="g.id || g.date">
                        <span class="me-item-main">{{fmtDate(g.date)}}<small v-if="g.shift"> · {{g.shift}}</small></span>
                        <span class="me-chip" :data-tone="g.role">{{guardiaRole(g.role)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin guardias próximas.</p>
                  </article>
                  <article class="me-card">
                    <header class="me-card-head"><h4>Rotaciones</h4><span class="me-count">{{state.activity.counts.rotations}}</span></header>
                    <ul v-if="state.activity.agenda.rotations.length" class="me-list">
                      <li v-for="r in state.activity.agenda.rotations" :key="r.id">
                        <span class="me-item-main">{{r.unit || r.resident || 'Rotación'}}<small v-if="r.start"> · {{fmtDate(r.start)}}–{{fmtDate(r.end)}}</small></span>
                        <span class="me-chip" :data-tone="r.role">{{rotationRole(r.role)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin rotaciones activas.</p>
                  </article>
                  <article class="me-card">
                    <header class="me-card-head"><h4>Ausencias</h4><span class="me-count">{{state.activity.counts.absences}}</span></header>
                    <ul v-if="state.activity.agenda.absences.length" class="me-list">
                      <li v-for="a in state.activity.agenda.absences" :key="a.id">
                        <span class="me-item-main">{{a.type || 'Ausencia'}}<small v-if="a.start"> · {{fmtDate(a.start)}}–{{fmtDate(a.end)}}</small></span>
                        <span class="me-chip" :data-tone="a.status">{{absenceStatus(a.status)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin ausencias registradas.</p>
                  </article>
                </div>
              </section>

              <section class="me-activity" aria-label="Mi investigación">
                <div class="mi-espacio-section-heading"><h3>Mi investigación</h3><p>Tu participación verificada en la actividad científica.</p></div>
                <div class="me-cards">
                  <article class="me-card">
                    <header class="me-card-head"><h4>Líneas</h4><span class="me-count">{{state.activity.counts.lines}}</span></header>
                    <ul v-if="state.activity.research.lines.length" class="me-list">
                      <li v-for="l in state.activity.research.lines" :key="l.id || l.name">
                        <span class="me-item-main"><small v-if="l.number" class="me-ord">L{{l.number}}</small> {{l.name}}</span>
                        <span class="me-chip" :data-tone="l.role">{{lineRole(l.role)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin líneas asignadas.</p>
                  </article>
                  <article class="me-card">
                    <header class="me-card-head"><h4>Estudios</h4><span class="me-count">{{state.activity.counts.studies}}</span></header>
                    <ul v-if="state.activity.research.studies.length" class="me-list">
                      <li v-for="s in state.activity.research.studies" :key="s.id">
                        <span class="me-item-main">{{s.title}}<small v-if="s.code"> · {{s.code}}</small></span>
                        <span class="me-chip" :data-tone="s.role">{{studyRole(s.role)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin estudios asignados.</p>
                  </article>
                  <article class="me-card">
                    <header class="me-card-head"><h4>Proyectos</h4><span class="me-count">{{state.activity.counts.projects}}</span></header>
                    <ul v-if="state.activity.research.projects.length" class="me-list">
                      <li v-for="p in state.activity.research.projects" :key="p.id">
                        <span class="me-item-main">{{p.title}}<small v-if="p.stage"> · {{p.stage}}</small></span>
                        <span class="me-chip" :data-tone="p.role">{{projectRole(p.role)}}</span>
                      </li>
                    </ul>
                    <p v-else class="mi-espacio-empty">Sin proyectos asignados.</p>
                  </article>
                </div>
                <p class="mi-espacio-empty me-note">Tus publicaciones se mostrarán aquí cuando la autoría esté estructurada y verificada.</p>
              </section>
            </template>

            <section class="me-report" aria-label="Comunicar una discrepancia">
              <div class="mi-espacio-section-heading"><h3>¿Falta algo o hay un error?</h3><p>Comunícalo y lo revisará la persona responsable. No se modifica ningún registro directamente.</p></div>
              <div v-if="state.report.done" class="mi-espacio-notice" role="status"><strong>Gracias, tu comunicación se ha registrado.</strong><p>La revisará la persona responsable de accesos o coordinación.</p><button type="button" class="mi-espacio-refresh" @click="openReportForm">Comunicar otra</button></div>
              <template v-else>
                <button v-if="!state.report.open" type="button" class="mi-espacio-refresh" @click="openReportForm">Comunicar una discrepancia</button>
                <form v-else class="me-report-form" @submit.prevent="submitReport">
                  <div class="me-field"><label>¿Sobre qué?</label><select v-model="state.report.subject_type"><option value="">Selecciona…</option><option v-for="o in subjectOptions" :key="o.value" :value="o.value">{{o.label}}</option></select></div>
                  <div class="me-field"><label>¿Qué ocurre?</label><select v-model="state.report.kind"><option value="">Selecciona…</option><option v-for="o in kindOptions" :key="o.value" :value="o.value">{{o.label}}</option></select></div>
                  <div class="me-field me-field-wide"><label>Detalles (opcional)</label><textarea v-model="state.report.message" rows="3" maxlength="2000" placeholder="Describe brevemente qué debería corregirse."></textarea></div>
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

          <section v-if="state.review.can" class="me-review" aria-label="Comunicaciones del equipo por revisar">
            <div class="mi-espacio-section-heading"><h3>Comunicaciones por revisar</h3><p>Reportes de discrepancias del equipo. Al aceptar uno, la corrección se gestiona en el módulo correspondiente; nada se modifica automáticamente.</p></div>
            <div class="me-review-filters" role="tablist" aria-label="Estado de las comunicaciones">
              <button v-for="f in reviewFilters" :key="f.value" type="button" role="tab" class="me-review-tab" :class="{'is-active':state.review.filter===f.value}" :aria-selected="state.review.filter===f.value" @click="setReviewFilter(f.value)">{{f.label}}</button>
            </div>
            <p v-if="state.review.error" class="me-form-error" role="alert">{{state.review.error}}</p>
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

          <section class="mi-espacio-links" aria-labelledby="mi-espacio-shortcuts">
            <div class="mi-espacio-section-heading"><h3 id="mi-espacio-shortcuts">Acceso a módulos</h3><p>Las mismas herramientas institucionales, según tus permisos.</p></div>
            <div class="mi-espacio-link-list">
              <button v-for="item in destinations.filter(d=>can(d.id))" :key="item.id" type="button" class="mi-espacio-link" @click="navigate(item.id)"><span><strong>{{item.label}}</strong><small>{{item.desc}}</small></span><span aria-hidden="true">↗</span></button>
              <p v-if="!destinations.some(d=>can(d.id))" class="mi-espacio-empty">No hay otros módulos disponibles para esta cuenta.</p>
            </div>
          </section>
        </template>
      </section>`
    };
  }
  root.NeumMiEspacio={createView};
})(typeof window!=='undefined'?window:globalThis);
