(function(root){
'use strict';
function eligibility(record={},now=Date.now()){
 if(record.deleted_at)return {eligible:false,label:'Excluded from the public feed',reason:'This record has been deleted.'};
 if(record.is_public!==true)return {eligible:false,label:'Internal',reason:'This record is not available to the public feed.'};
 if(record.status!=='published')return {eligible:false,label:'Public visibility · not published',reason:'Draft and archived records are excluded from the public feed.'};
 if(record.expires_at){const expiry=Date.parse(record.expires_at);if(!Number.isFinite(expiry)||expiry<=now)return {eligible:false,label:'Public visibility · expired or invalid expiry',reason:'This record is excluded from the public feed. Review its expiry date.'};}
 return {eligible:true,label:'Eligible for the public feed',reason:'Published, public and unexpired. Website display has not been verified.'};
}
const api={eligibility};if(typeof module==='object'&&module.exports)module.exports=api;root.NeumPublishing10=api;
})(typeof window!=='undefined'?window:globalThis);
