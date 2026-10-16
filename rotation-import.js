/* Pure rotations-matrix parser + translator for the "MIR NML <year>" workbook.
   No writes, no automatic fuzzy guessing: ambiguous residents and unknown unit
   codes are REPORTED for a human to resolve, exactly like the Guardias import.
   Converts a resident × month matrix into flat rotation periods that match the
   resident_rotations model. Works in the browser and in Node. */
(function(root){'use strict';
const norm=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().trim().replace(/^dra?\.?\s+/,'').replace(/\s+/g,' ').trim();
const MONTHS={ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,oct:10,nov:11,dic:12};

// Excel unit code -> canonical DB training_units.unit_code. Codes absent here are
// surfaced as unmatched so a human maps or creates them (never silently dropped).
const UNIT_CODES={
 'SALA NML':'HOSP-NEUM','UCI':'UCI','UCRI':'UCRI','PFR':'PFR','UTB':'UTB','CARDIO':'CARDIO',
 'ROT EXT':'ROT-EXT','TXP':'TRANSP','SUEÑO':'SUEÑO','MI':'MED-INT','MII':'MED-INT','RX':'RAD-TORAX',
 'CTO':'CIR-TORAX','BFC':'BFC','CCEE':'CCEE','CONSULTA':'CCEE','ANESTESIA':'ANESTESIA'
};

const lastDay=(y,m)=>new Date(Date.UTC(y,m,0)).getUTCDate();
const iso=(y,m,d)=>`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
const sheetYear=t=>{const m=/(\d{4})/.exec(String(t||''));return m?parseInt(m[1],10):null;};
const isCohort=t=>/^mir nml\s+\d{4}$/.test(norm(t));
// Where a period sits relative to today: history, running now, coming up, or far-future
// planning (> 12 months ahead — e.g. a "MIR NML 2028" sheet read in 2026).
const localToday=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const addMonthsIso=(isoDate,n)=>{const d=new Date(isoDate+'T12:00:00Z');d.setUTCMonth(d.getUTCMonth()+n);return d.toISOString().slice(0,10);};
function timeBand(start,end,today=localToday()){
 if(!start||!end)return 'upcoming';
 if(end<today)return 'past';
 if(start<=today)return 'current';
 if(start>addMonthsIso(today,12))return 'far';
 return 'upcoming';
}
const nextDay=d=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10);};

// Only people registered as residents (MIR) can receive a rotation, so names are
// matched against ACTIVE RESIDENTS ONLY — an attending who shares a first name is
// never offered. Same staff-type rule as the decision engine (decision51.js).
const RESIDENT_TYPE=/resident|fellow|mir/i;
const isResident=s=>RESIDENT_TYPE.test(String(s&&s.staff_type||''));
const isActive=s=>s&&!s.deleted_at&&(s.employment_status||'active')==='active';
const residentPool=staff=>(staff||[]).filter(s=>isActive(s)&&isResident(s));
function matchName(n,pool){
 let hits=pool.filter(s=>norm(s.full_name)===n);                                  // exact
 if(!hits.length)hits=pool.filter(s=>norm(s.full_name).split(' ').includes(n));   // one-word label ("Iria")
 if(!hits.length){const t=n.split(' ');if(t.length>1)hits=pool.filter(s=>{const f=norm(s.full_name).split(' ');return t.every(x=>f.includes(x));});} // "Laura Yoris" → "Laura Yoris Marin"
 return hits;
}
// Resolve a resident label with saved mappings and ambiguity reporting.
// One hit resolves; zero or many are reported for the reviewer — never auto-picked.
function resolveResident(label,staff,mappings={}){
 const n=norm(label); if(!n)return {empty:true};
 const residents=residentPool(staff);
 const chosen=mappings[label];
 if(chosen==='skip')return {skip:true};
 if(chosen){const s=residents.find(s=>s.id===chosen);return s?{id:s.id,name:s.full_name}:{issue:'Saved mapping is not an active resident'};}
 const hits=matchName(n,residents);
 if(hits.length===1)return {id:hits[0].id,name:hits[0].full_name};
 if(hits.length)return {issue:'Ambiguous name',candidates:hits.map(s=>({id:s.id,name:s.full_name}))};
 // Not a resident: say whether the name belongs to someone registered with another role.
 const others=matchName(n,(staff||[]).filter(s=>isActive(s)&&!isResident(s)));
 if(others.length)return {issue:'Registered, but not as a resident',candidates:[],nonResidents:others.map(s=>({id:s.id,name:s.full_name,staff_type:s.staff_type||''}))};
 return {issue:'Not registered as a resident',candidates:[]};
}

// A cell may name several units ("UTB / SALA NML"): split into ordered codes.
const cellUnits=raw=>String(raw||'').split('/').map(x=>x.trim()).filter(Boolean);

// Parse one cohort sheet (resident × month matrix) -> rotation periods.
function parseCohort(title,aoa){
 const year=sheetYear(title),periods=[],unmatchedUnits=new Set();
 if(!year)return {periods,unmatchedUnits:[]};
 let hdr=-1;for(let i=0;i<aoa.length;i++){if((aoa[i]||[]).some(c=>norm(c)==='residente')){hdr=i;break;}}
 if(hdr<0)return {periods,unmatchedUnits:[]};
 const colMonth=aoa[hdr].map(c=>{const mm=MONTHS[norm(c).slice(0,3)];return mm?{year,month:mm}:null;});
 for(let r=hdr+1;r<aoa.length;r++){
  const row=aoa[r];if(!row)continue;const resident=String(row[0]||'').trim();if(!resident)continue;
  const seq=[];for(let c=0;c<row.length;c++){if(!colMonth[c])continue;seq.push({cm:colMonth[c],raw:String(row[c]||'').trim()||null});}
  let run=null;
  const flush=end=>{
   if(!run)return;
   const s=seq[run.i].cm,e=seq[end].cm,parts=cellUnits(run.raw),split=parts.length>1;
   parts.forEach((code,idx)=>{
    const dbc=UNIT_CODES[code]||null; if(!dbc)unmatchedUnits.add(code);
    const sDays=lastDay(s.year,s.month),eDays=lastDay(e.year,e.month);
    const sd=iso(s.year,s.month, split?1+Math.floor(idx*sDays/parts.length):1);
    const ed=iso(e.year,e.month, split?Math.floor((idx+1)*eDays/parts.length):eDays);
    periods.push({source_sheet:title,resident,unit_excel:code,unit_code:dbc,
      start_date:sd,end_date:ed,months:end-run.i+1,matched:!!dbc,split});
   });
   run=null;
  };
  for(let i=0;i<seq.length;i++){const cell=seq[i].raw;if(!cell){flush(i-1);continue;}
   if(run&&run.raw===cell)continue;flush(i-1);run={raw:cell,i};}
  flush(seq.length-1);
 }
 return {periods,unmatchedUnits:[...unmatchedUnits]};
}

// Merge periods contiguous across a sheet/year boundary (Dec->Jan, same resident+unit).
// Split-month periods are never merged — they stay as the reviewer sees them.
function mergeContiguous(periods){
 const splits=periods.filter(p=>p.split),normal=periods.filter(p=>!p.split),byKey={};
 normal.forEach(p=>{const k=p.resident+'|'+p.unit_excel;(byKey[k]=byKey[k]||[]).push(p);});
 const out=[];
 Object.values(byKey).forEach(list=>{
  list.sort((a,b)=>a.start_date<b.start_date?-1:1);let cur=null;
  list.forEach(p=>{if(cur&&nextDay(cur.end_date)===p.start_date){cur.end_date=p.end_date;cur.months+=p.months;}else{if(cur)out.push(cur);cur={...p};}});
  if(cur)out.push(cur);
 });
 return out.concat(splits).sort((a,b)=>a.resident<b.resident?-1:a.resident>b.resident?1:(a.start_date<b.start_date?-1:1));
}

function translate(sheets,opts={}){
 const periods=[],unmatched=new Set();
 for(const [title,aoa] of Object.entries(sheets||{})){if(!isCohort(title))continue;const r=parseCohort(title,aoa);periods.push(...r.periods);r.unmatchedUnits.forEach(u=>unmatched.add(u));}
 const merged=opts.merge===false?periods:mergeContiguous(periods);
 return {periods:merged,unmatchedUnits:[...unmatched].sort(),residents:[...new Set(merged.map(p=>p.resident))].sort()};
}

// Resolve translated periods against live staff + units into commit-ready records,
// reporting the residents and unit codes a human must still decide. Nothing is guessed:
// an ambiguous/unknown resident or an unmapped unit marks the row 'blocked'.
function plan(periods,staff,units,opts={}){
 const residentMappings=opts.residentMappings||{}, unitChoices=opts.unitChoices||{}, today=opts.today||localToday();
 const bands={past:0,current:0,upcoming:0,far:0};
 const byCode={}, byId={}; (units||[]).forEach(u=>{if(!u)return; if(u.unit_code)byCode[String(u.unit_code)]=u; if(u.id)byId[String(u.id)]=u;});
 const records=[], unmatchedResidents={}, unmatchedUnits={}; let ready=0,blocked=0,skipped=0;
 for(const p of periods){
  const codeKey=p.unit_code||p.unit_excel;
  const rec={...p, key:[p.source_sheet,p.resident,p.unit_excel,p.start_date].join('|'), code_key:codeKey, band:timeBand(p.start_date,p.end_date,today)};
  bands[rec.band]++;
  const rr=resolveResident(p.resident,staff,residentMappings);
  if(rr.skip){rec.status='skipped';skipped++;records.push(rec);continue;}
  rec.resident_id=rr.id||null; rec.resident_name=rr.name||null; rec.resident_issue=rr.issue||null;
  if(rr.issue)(unmatchedResidents[p.resident]=unmatchedResidents[p.resident]||{label:p.resident,issue:rr.issue,candidates:rr.candidates||[],nonResidents:rr.nonResidents||[],cohortYear:sheetYear(p.source_sheet),count:0}).count++;
  // A saved/explicit choice for the Excel code wins over the built-in code table.
  const choice=unitChoices[p.unit_excel]!==undefined?unitChoices[p.unit_excel]:unitChoices[codeKey], unit=byCode[codeKey];
  if(choice==='skip'){rec.status='skipped';skipped++;records.push(rec);continue;}
  else if(choice&&choice!=='create'&&byId[choice]){rec.training_unit_id=choice;rec.unit_name=byId[choice].unit_name;}
  else if(unit){rec.training_unit_id=unit.id;rec.unit_name=unit.unit_name;}
  else if(choice==='create'){rec.create_unit={unit_code:codeKey,unit_name:p.unit_excel};}
  else {rec.unit_issue='Unmapped unit';(unmatchedUnits[codeKey]=unmatchedUnits[codeKey]||{code:codeKey,count:0}).count++;}
  if(rec.resident_issue||rec.unit_issue){rec.status='blocked';blocked++;}
  else{rec.status='ready';ready++;}
  records.push(rec);
 }
 return {records:records.sort((a,b)=>a.start_date<b.start_date?-1:a.start_date>b.start_date?1:String(a.resident).localeCompare(String(b.resident))),unmatchedResidents:Object.values(unmatchedResidents),unmatchedUnits:Object.values(unmatchedUnits),counts:{ready,blocked,skipped,bands}};
}

// Commit/check payload from the ready records the reviewer selected.
function payload(records,selection){
 return (records||[]).filter(r=>selection[r.key]&&r.status==='ready').map(r=>({
  resident_id:r.resident_id,
  training_unit_id:r.training_unit_id||undefined,
  create_unit:r.create_unit||undefined,
  start_date:r.start_date, end_date:r.end_date,
  rotation_category:'clinical_rotation',
  source_sheet:r.source_sheet,
  sync_key:'rotations:'+r.key,
  replaces:r.replaces||undefined
 }));
}

// Re-import as sync (Phase D). Compares planned records with what neumDesk already holds for the
// same residents (existing rows carry sync_source when an earlier import created them):
//  - unchanged: same resident, unit and dates already exist → status 'unchanged' (nothing to send)
//  - changed:   exactly one imported row of that resident overlaps exactly one ready file row →
//               the file row carries `replaces` (the backend swaps them, with rollback)
//  - removed:   imported rows of residents in this file, inside that resident's file span, that
//               no file row covers any more → proposed for removal (never pre-selected)
// Manually entered rows (no sync_source) are never replaced or proposed for removal.
function diff(records,existing){
 const s10=x=>String(x||'').slice(0,10), endOf=e=>s10(e.actual_end_date||e.end_date);
 const ex=(existing||[]).filter(e=>e&&e.id&&!e.deleted_at&&e.rotation_status!=='cancelled');
 const overlap=(r,e)=>s10(e.start_date)<=r.end_date&&r.start_date<=endOf(e);
 const out=(records||[]).map(r=>({...r})), claimed=new Set(); let unchanged=0,changed=0;
 for(const r of out){
  if(!r.resident_id)continue;
  const same=ex.find(e=>String(e.resident_id)===String(r.resident_id)&&s10(e.start_date)===r.start_date&&s10(e.end_date)===r.end_date&&r.training_unit_id&&String(e.training_unit_id)===String(r.training_unit_id));
  if(same){claimed.add(same.id);r.existing_id=same.id;if(r.status==='ready'){r.status='unchanged';r.sync='unchanged';unchanged++}}
 }
 const fileRowsOver=e=>out.filter(r=>r.resident_id&&String(r.resident_id)===String(e.resident_id)&&r.status!=='skipped'&&overlap(r,e));
 for(const r of out){
  if(r.status!=='ready'||!r.resident_id)continue;
  const over=ex.filter(e=>String(e.resident_id)===String(r.resident_id)&&!claimed.has(e.id)&&overlap(r,e));
  if(over.length!==1||!over[0].sync_source)continue;
  const e=over[0]; if(fileRowsOver(e).length!==1)continue;              // one-to-one only; anything else is a human call
  claimed.add(e.id);changed++;
  Object.assign(r,{replaces:e.id,sync:'changed',previous:{unit_name:e.unit?.unit_name||null,start_date:s10(e.start_date),end_date:s10(e.end_date),rotation_id:e.rotation_id||null}});
 }
 // A row whose first days collide with a rotation neumDesk already records (typically one that was
 // terminated early, or is still running) → suggest starting the day after that rotation's EFFECTIVE end.
 // Same rule as the DB: any non-cancelled rotation occupies the resident up to actual_end_date || end_date.
 for(const r of out){
  if(!r.resident_id||r.replaces||r.status==='unchanged'||r.status==='skipped')continue;
  const head=ex.filter(e=>String(e.resident_id)===String(r.resident_id)&&!claimed.has(e.id)&&overlap(r,e)&&s10(e.start_date)<=r.start_date);
  if(!head.length)continue;
  const last=head.reduce((a,b)=>endOf(b)>endOf(a)?b:a), from=nextDay(endOf(last));
  if(from>r.end_date)continue;                                           // fully covered: nothing sensible to trim to
  if(ex.some(e=>String(e.resident_id)===String(r.resident_id)&&!claimed.has(e.id)&&s10(e.start_date)>r.start_date&&overlap({start_date:from,end_date:r.end_date},e)))continue;   // still collides later on
  r.trim={start_date:from,because:{unit_name:last.unit?.unit_name||null,start_date:s10(last.start_date),end_date:endOf(last),status:last.rotation_status||null}};
 }
 const span={};for(const r of out){if(!r.resident_id||r.status==='skipped')continue;const k=String(r.resident_id),x=span[k]||(span[k]={from:r.start_date,to:r.end_date});if(r.start_date<x.from)x.from=r.start_date;if(r.end_date>x.to)x.to=r.end_date}
 const removed=ex.filter(e=>e.sync_source&&!claimed.has(e.id)&&span[String(e.resident_id)]&&s10(e.start_date)>=span[String(e.resident_id)].from&&s10(e.end_date)<=span[String(e.resident_id)].to&&!fileRowsOver(e).length)
  .map(e=>({id:e.id,rotation_id:e.rotation_id||null,resident_id:e.resident_id,resident_name:(out.find(r=>String(r.resident_id)===String(e.resident_id))||{}).resident_name||null,unit_name:e.unit?.unit_name||null,start_date:s10(e.start_date),end_date:s10(e.end_date),file:e.sync_source&&e.sync_source.file||null}))
  .sort((a,b)=>a.start_date<b.start_date?-1:1);
 return {records:out,removed,counts:{unchanged,changed,removed:removed.length}};
}

root.NeumRotationImport={norm,MONTHS,UNIT_CODES,isCohort,isResident,residentPool,timeBand,resolveResident,cellUnits,parseCohort,mergeContiguous,translate,plan,diff,payload};
if(typeof module!=='undefined')module.exports=root.NeumRotationImport;
})(typeof window!=='undefined'?window:globalThis);
