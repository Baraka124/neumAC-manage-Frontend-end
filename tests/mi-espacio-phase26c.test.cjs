'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const data=require('../mi-espacio/mi-espacio-data.js'),nav=require('../mi-espacio/mi-espacio-workspace.js');
const src=fs.readFileSync('mi-espacio/mi-espacio.js','utf8');
const css=fs.readFileSync('mi-espacio/mi-espacio.css','utf8');
const baseline={mobilePhone:'600',publicBio:'Biografía',orcidId:'',scholarUrl:'',researchgateUrl:'',pubmedQuery:'',isPublic:true,indexedPublicationsCount:null,hIndex:0};
test('editable profile fields are allowlisted; institutional data cannot be submitted',()=>{
 const d=data.profileDraft(baseline);
 assert.deepEqual(Object.keys(d),data.PROFILE_EDIT_KEYS);
 const res=data.validateProfileDraft({...d,professional_email:'unauthorized',full_name:'changed',h_index:4});
 assert.equal(res.valid,true);assert.ok(!('professional_email' in res.fields));assert.ok(!('full_name' in res.fields));
});
test('drafts distinguish real edits from whitespace and null formatting',()=>{
 const d=data.profileDraft(baseline);assert.equal(data.profileChanged({...d},d),false);
 assert.equal(data.profileChanged({...d,public_bio:' Biografía '},d),false);
 assert.equal(data.profileChanged({...d,public_bio:'Nueva'},d),true);
 assert.equal(data.profileChanged({...d,h_index:'0'},d),false);
});
test('validation blocks invalid academic, url and ORCID metadata',()=>{
 const d=data.profileDraft(baseline);
 assert.equal(data.validateProfileDraft({...d,scholar_url:'javascript:alert(1)'}).valid,false);
 assert.equal(data.validateProfileDraft({...d,researchgate_url:'https://u:p@example.org'}).valid,false);
 assert.equal(data.validateProfileDraft({...d,orcid_id:'not-orcid'}).valid,false);
 assert.equal(data.validateProfileDraft({...d,h_index:2.2}).valid,false);
 assert.equal(data.validateProfileDraft({...d,indexed_publications_count:-2}).valid,false);
 assert.equal(data.validateProfileDraft({...d,public_bio:'x'.repeat(2001)}).valid,false);
});
test('workspace protects dirty edits, refetches saved data and avoids duplicate saves',()=>{
 for(const s of ['profileDirty.value||state.profile.saving||state.profile.photoUploading',
  "if(profileDirty.value){profileConfirm.value=true;return;}",
  "if(!linked.value||!state.profile.edit||!state.profile.data?.id||state.profile.saving)return",
  'validateProfileDraft(state.profile.edit)',"navigateWorkspace({type:'SAVE_SUCCESS'})",
  "Cambios guardados. No se pudo actualizar la vista"])assert.ok(src.includes(s),s);
 assert.match(src,/ticket===profileRequest\|\|/);
 assert.match(src,/requestSeq===seq&&props.active&&linked.value/);
});
test('profile uses a single contextual surface, with deterministic cancel and responsive keyboard affordances',()=>{
 for(const s of ['class="me-v15-profile-panel me-v26c-profile"','v-if="profileActive && linked"',
  'role="group" aria-labelledby="me-v26c-discard-title"', 'profileConfirm','discardProfile',
  '<template v-if="linked && !isContextWorkspace && !profileActive">'])assert.ok(src.includes(s),s);
 assert.match(css,/\.me-v26c-profile/);assert.match(css,/@media\(max-width:640px\)/);
 const n=nav.create();n.dispatch({type:'OPEN_WORKSPACE',workspace:'profile'});n.dispatch({type:'SET_DIRTY',value:true});
 assert.equal(n.get().workspace,'profile');assert.equal(n.dispatch({type:'CLOSE'}).workspace,'profile');
 assert.equal(n.dispatch({type:'CLOSE',confirmDiscard:true}).view,'overview');
});
