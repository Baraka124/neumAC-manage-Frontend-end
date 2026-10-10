/* neumDESK · Mi espacio · Phase 1. Existing-app Vue component, no separate application. */
(function(root) {
  'use strict';
  function createView({Vue,API}) {
    return {
      props: { active: Boolean, user: Object, canOpenView: Function },
      emits: ['navigate'],
      setup(props,{emit}) {
        const state=Vue.reactive({busy:false,error:'',context:null});
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
        return {state,linked,initials,destinations,can,refresh:load,navigate:view=>can(view)&&emit('navigate',view)};
      },
      template: 
      '<section class="mi-espacio" aria-labelledby="mi-espacio-title">' +
        '<header class="mi-espacio-head">' +
          '<div><p class="mi-espacio-eyebrow">ÁREA PERSONAL · neumDESK</p>' +
          '<h2 id="mi-espacio-title" tabindex="-1">Mi actividad profesional</h2>' +
          '<p>Tu perfil institucional y acceso a las áreas relacionadas con tu actividad.</p></div>' +
          '<button v-if="state.context||state.error" type="button" class="mi-espacio-refresh" :disabled="state.busy" @click="refresh">Actualizar identidad</button>' +
        '</header>' +
        '<p v-if="state.busy" class="mi-espacio-state" role="status">Verificando tu cuenta y vinculación profesional…</p>' +
        '<div v-else-if="state.error" class="mi-espacio-state" role="alert"><strong>No se puede cargar Mi espacio.</strong><p>{{state.error}}</p><button type="button" class="mi-espacio-refresh" @click="refresh">Reintentar</button></div>' +
        '<template v-else-if="state.context">' +
          '<div v-if="state.context.testSession" class="mi-espacio-notice" role="status">Sesión de prueba. Comprueba que la identidad y los permisos corresponden a la cuenta seleccionada.</div>' +
          '<section class="mi-espacio-person" aria-label="Identidad institucional verificada">' +
            '<span class="mi-espacio-avatar" aria-hidden="true">{{initials}}</span>' +
            '<div class="mi-espacio-person-main"><p class="mi-espacio-eyebrow">IDENTIDAD DE LA CUENTA</p>' +
              '<h3>{{state.context.staff?.name || state.context.account.name}}</h3>' +
              '<p>{{state.context.staff?.specialization || state.context.staff?.staffType || state.context.account.role || "Cuenta institucional"}}</p>' +
              '<p class="mi-espacio-person-email">{{state.context.staff?.professionalEmail || state.context.account.email}}</p>' +
            '</div>' +
            '<span class="mi-espacio-link-state" :class="linked?\"is-linked\":\"is-unlinked\"">{{linked?"Perfil vinculado":state.context.linkState==="unlinked"?"Vinculación pendiente":"Vinculación no disponible"}}</span>' +
          '</section>' +
          '<div v-if="!linked" class="mi-espacio-notice" role="status"><strong>Tu cuenta está activa, pero no podemos verificar su vínculo con la ficha profesional.</strong><p>La actividad personal no se mostrará hasta que se confirme la vinculación. Contacta con la persona responsable de accesos; no se asignarán datos por coincidencias de nombres.</p></div>' +
          '<div v-if="linked" class="mi-espacio-guidance"><h3>Tu actividad, en un solo lugar</h3><p>La agenda, las participaciones en investigación y las publicaciones personales se integrarán progresivamente mediante relaciones verificadas. Hasta entonces, utiliza los módulos institucionales para consultar sus registros.</p></div>' +
          '<section class="mi-espacio-links" aria-labelledby="mi-espacio-shortcuts">' +
            '<div class="mi-espacio-section-heading"><h3 id="mi-espacio-shortcuts">Acceso a módulos</h3><p>Las mismas herramientas institucionales, según tus permisos.</p></div>' +
            '<div class="mi-espacio-link-list">' +
              '<button v-for="item in destinations.filter(d=>can(d.id))" :key="item.id" type="button" class="mi-espacio-link" @click="navigate(item.id)"><span><strong>{{item.label}}</strong><small>{{item.desc}}</small></span><span aria-hidden="true">↗</span></button>' +
              '<p v-if="!destinations.some(d=>can(d.id))" class="mi-espacio-empty">No hay otros módulos disponibles para esta cuenta.</p>' +
            '</div>' +
          '</section>' +
        '</template>' +
      '</section>'
    };
  }
  root.NeumMiEspacio={createView};
})(typeof window!=='undefined'?window:globalThis);
