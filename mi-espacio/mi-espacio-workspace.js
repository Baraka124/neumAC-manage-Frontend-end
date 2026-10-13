/* Mi Espacio Phase 26A — deterministic navigation core (no DOM, no permissions). */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NeumMiEspacioWorkspace=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const WORKSPACES=Object.freeze(['profile','calendar','directory','digest','notifications','duties','communications']);
  const DETAILS=Object.freeze(['date','research','publication','staff']);
  const empty=()=>({view:'overview',workspace:null,detail:null,origin:null,dirty:false,revision:0});
  const validOrigin=x=>x&&typeof x==='object'?{
    focusId:typeof x.focusId==='string'?x.focusId.slice(0,160):null,
    scrollY:Number.isFinite(x.scrollY)?Math.max(0,x.scrollY):0
  }:null;
  const transition=(s,event)=>{
    const old=s||empty(),e=event||{};
    if(e.type==='RESET_ON_IDENTITY_CHANGE')return {...empty(),revision:old.revision+1};
    if(e.type==='OPEN_WORKSPACE'){
      if(!WORKSPACES.includes(e.workspace))return old;
      if(old.dirty&&old.workspace!==e.workspace)return old;
      if(old.view==='workspace'&&old.workspace===e.workspace)return old;
      return {...old,view:'workspace',workspace:e.workspace,detail:null,
        origin:old.view==='overview'?validOrigin(e.origin):old.origin,dirty:false,revision:old.revision+1};
    }
    if(e.type==='OPEN_DETAIL'){
      if(old.view!=='workspace'||!DETAILS.includes(e.detail?.type)||!String(e.detail?.id||'').trim())return old;
      return {...old,detail:{type:e.detail.type,id:String(e.detail.id)},revision:old.revision+1};
    }
    if(e.type==='SET_DIRTY'){
      if(old.view!=='workspace')return old;
      return {...old,dirty:!!e.value};
    }
    if(e.type==='SAVE_SUCCESS')return {...old,dirty:false};
    if(e.type==='BACK'||e.type==='CLOSE'){
      if(old.dirty&&!e.confirmDiscard)return old;
      if(old.detail)return {...old,detail:null,dirty:false,revision:old.revision+1};
      if(old.view==='workspace')return {...empty(),origin:old.origin,revision:old.revision+1};
    }
    return old;
  };
  const create=()=>{let state=empty();return{
    get:()=>state,
    dispatch:e=>(state=transition(state,e)),
    reset:()=>state=transition(state,{type:'RESET_ON_IDENTITY_CHANGE'})
  }};
  return Object.freeze({WORKSPACES,DETAILS,empty,transition,create});
});