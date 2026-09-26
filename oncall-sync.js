/* Pure Guardias parser and diff. No writes or automatic fuzzy matching. */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/^dra?\.?\s+/,'').replace(/\s+/g,' ').trim();
const absent=s=>!norm(s)||['-','—','sin mir','sin residente'].includes(norm(s));
function resolve(name,staff,mappings){if(absent(name))return {id:null,empty:true};const active=staff.filter(s=>s.employment_status==='active'&&!s.deleted_at);const chosen=mappings[name];if(chosen==='skip')return {skip:true};if(chosen){const s=active.find(s=>s.id===chosen);return s?{id:s.id,name:s.full_name}:{issue:'Saved mapping is no longer active'}}const n=norm(name);let hits=active.filter(s=>norm(s.full_name)===n);if(!hits.length)hits=active.filter(s=>norm(s.full_name).split(' ').includes(n));return hits.length===1?{id:hits[0].id,name:hits[0].full_name}:{issue:hits.length?'Ambiguous name':'Name not matched'}}
const types={localizada:'on_call_home',mixta:'on_call_mixed',presencial:'on_call_present'};
function date(value){if(value instanceof Date)return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;const s=String(value||'');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(Date.parse(s))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s?s:null}
const signature=s=>({id:s.id,primary_physician_id:s.primary_physician_id,resident_physician_id:s.resident_physician_id||null,shift_type:s.shift_type,updated_at:s.updated_at});
function parse(aoa,sheet){const hr=aoa.findIndex(r=>r&&norm(r[0])==='fecha');if(hr<0)throw Error('Select the active Guardias sheet with a Fecha header.');const h=aoa[hr].map(norm),cS=h.indexOf('nombre staff'),cT=h.indexOf('tipo guardia staff'),cM=h.indexOf('nombre mir');if(cS<0||cT<0||cM<0)throw Error('Expected Fecha, Nombre STAFF, Tipo Guardia STAFF and Nombre MIR columns.');const rows=[];for(let i=hr+1;i<aoa.length;i++){const r=aoa[i]||[];if(absent(r[cS])&&absent(r[cM]))continue;const d=date(r[0]);rows.push({date:d,surname:String(r[cS]||'').trim(),mir:String(r[cM]||'').trim(),shiftType:types[norm(r[cT])]||null,source_sheet:sheet,source_row:i+1,issue:!d?'Invalid date':!types[norm(r[cT])]?'Unknown shift type':absent(r[cS])?'Staff assignment is missing':null})}return rows}
function plan(rows,staff,existing,mappings,choices={}){
 const toAdd=[],toUpdate=[],conflicts=[],unmatched={},blocked=[],entries=[],counts={unchanged:0,skipped:0};
 const freq={};rows.forEach(r=>freq[r.date]=(freq[r.date]||0)+1);
 for(const original of rows){
  const r={...original,key:original.source_sheet+':'+original.source_row};
  const found=existing.filter(s=>String(s.duty_date).slice(0,10)===r.date&&!s.deleted_at);
  r.current=found.length===1?signature(found[0]):null;
  r.currentName=found.length===1?(staff.find(s=>s.id===found[0].primary_physician_id)?.full_name||'Existing staff'):null;
  r.currentResident=found.length===1?(staff.find(s=>s.id===found[0].resident_physician_id)?.full_name||null):null;
  const record=(status,list)=>{r.status=status;entries.push(r);if(list)list.push(r)};
  if(r.issue||freq[r.date]>1){r.issue=r.issue||'Repeated date in source';record('blocked',blocked);continue}
  const a=resolve(r.surname,staff,mappings),m=resolve(r.mir,staff,mappings);
  if(a.skip||m.skip){counts.skipped++;record('skipped');continue}
  for(const [n,x]of [[r.surname,a],[r.mir,m]])if(x.issue)unmatched[n]=(unmatched[n]||0)+1;
  if(!a.id||m.issue){r.issue='Resolve staff and resident names';record('blocked',blocked);continue}
  if(a.id===m.id){r.issue='Staff and resident must be different people';record('blocked',blocked);continue}
  Object.assign(r,{staffId:a.id,staffName:a.name,residentId:m.id,residentName:m.name||null});
  if(!found.length){record('new',toAdd);continue}
  if(found.length!==1){r.issue='Multiple existing shifts: review in On-call';record('conflict',conflicts);continue}
  const ex=found[0];
  if(ex.primary_physician_id===r.staffId&&(ex.resident_physician_id||null)===(r.residentId||null)&&ex.shift_type===r.shiftType){counts.unchanged++;record('matching');continue}
  r.expected=signature(ex);r.wasName=r.currentName;
  if(choices[r.date]==='replace')record('replacement',toUpdate);
  else if(choices[r.date]==='keep'){counts.skipped++;record('kept')}
  else{r.issue='Existing assignment differs';record('conflict',conflicts)}
 }
 return {toAdd,toUpdate,conflicts,blocked,entries,unmatched:Object.entries(unmatched).map(([surname,count])=>({surname,count})),counts};
}
function visible(entries,filter){const q=norm(filter.search);return entries.filter(r=>(!filter.start||r.date>=filter.start)&&(!filter.end||r.date<=filter.end)&&(!filter.status||r.status===filter.status)&&(!q||norm([r.staffName,r.residentName,r.surname,r.mir,r.currentName,r.currentResident].join(' ')).includes(q)))}
function selected(entries,filter,selection){return visible(entries,filter).filter(r=>selection[r.key]&&['new','replacement'].includes(r.status))}
root.NeumOncallSync={norm,resolve,parse,plan,signature,visible,selected};if(typeof module!=='undefined')module.exports=root.NeumOncallSync;
})(typeof window!=='undefined'?window:globalThis);
