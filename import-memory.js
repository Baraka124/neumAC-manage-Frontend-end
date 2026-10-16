/* Import memory helpers (Phase B). Pure, browser + Node.
   - key():        same normalisation as the backend's import_aliases.source_key
   - mappingFor(): turn saved aliases into the {label: id|'skip'} maps the parsers already accept
   - layout*():    a stable description of a workbook's structure, so a changed template is
                   reported instead of silently mis-parsed. Years in sheet names are generalised
                   ("MIR NML 2026" → "MIR NML ####") so a new academic year is not a "change". */
(function(root){'use strict';
const key=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/^dra?\.?\s+/,'').replace(/\s+/g,' ').trim();

// aliases: [{source_key, action, target_id}] ; labels: labels present in this file
function mappingFor(labels,aliases){
 const byKey=new Map((aliases||[]).map(a=>[a.source_key,a]));
 const out={},remembered=[];
 for(const label of labels||[]){
  const a=byKey.get(key(label)); if(!a)continue;
  out[label]=a.action==='skip'?'skip':a.target_id;
  remembered.push({label,id:a.id,action:a.action,target_id:a.target_id||null});
 }
 return {mapping:out,remembered};
}

const genericSheet=n=>String(n||'').trim().replace(/\d{4}/g,'####');
const headerOf=(aoa,marker)=>{
 const rows=aoa||[]; const i=rows.findIndex(r=>(r||[]).some(c=>key(c)===marker));
 return i<0?[]:(rows[i]||[]).map(c=>key(c)).filter(Boolean).map(c=>/^\d{4}$/.test(c)?'####':c);
};
// rotations: all sheets (generalised), plus the header row of the cohort sheets
function layoutRotations(sheets){
 const names=[...new Set(Object.keys(sheets||{}).map(genericSheet))].sort();
 const cohort=Object.keys(sheets||{}).find(n=>/^mir nml\s+\d{4}$/.test(key(n)));
 return {sheets:names,header:cohort?headerOf(sheets[cohort],'residente'):[]};
}
// guardias: the dated sheet's (generalised) name and its header row
function layoutOncall(sheetName,aoa){return {sheets:[genericSheet(sheetName)],header:headerOf(aoa,'fecha')};}

function fingerprint(layout){
 const s=JSON.stringify(layout||{}); let h=5381;
 for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))>>>0;
 return 'v1-'+h.toString(16);
}
// Human-readable differences between the last confirmed layout and this file.
function diffLayout(prev,next){
 if(!prev)return [];
 const out=[], d=(a,b)=>(a||[]).filter(x=>!(b||[]).includes(x));
 d(next.sheets,prev.sheets).forEach(x=>out.push(`New sheet “${x}”`));
 d(prev.sheets,next.sheets).forEach(x=>out.push(`Sheet “${x}” is no longer in the file`));
 d(next.header,prev.header).forEach(x=>out.push(`New column “${x}”`));
 d(prev.header,next.header).forEach(x=>out.push(`Column “${x}” is missing`));
 if(!out.length&&JSON.stringify(prev.header)!==JSON.stringify(next.header))out.push('Columns are in a different order');
 return out;
}

root.NeumImportMemory={key,mappingFor,layoutRotations,layoutOncall,fingerprint,diffLayout};
if(typeof module!=='undefined')module.exports=root.NeumImportMemory;
})(typeof window!=='undefined'?window:globalThis);
