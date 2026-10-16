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
const nextDay=d=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+1);return x.toISOString().slice(0,10);};

// Resolve a resident label against staff with saved mappings and ambiguity reporting.
// Mirrors the Guardias resolver: one exact/first-token hit resolves; zero or many
// are reported (with candidates) for the reviewer to choose — never auto-picked.
function resolveResident(label,staff,mappings={}){
 const n=norm(label); if(!n)return {empty:true};
 const active=(staff||[]).filter(s=>!s.deleted_at);
 const chosen=mappings[label];
 if(chosen==='skip')return {skip:true};
 if(chosen){const s=active.find(s=>s.id===chosen);return s?{id:s.id,name:s.full_name}:{issue:'Saved mapping is no longer active'};}
 let hits=active.filter(s=>norm(s.full_name)===n);
 if(!hits.length)hits=active.filter(s=>norm(s.full_name).split(' ').includes(n));
 return hits.length===1?{id:hits[0].id,name:hits[0].full_name}
   :{issue:hits.length?'Ambiguous name':'Name not matched',candidates:hits.map(s=>({id:s.id,name:s.full_name}))};
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

root.NeumRotationImport={norm,MONTHS,UNIT_CODES,isCohort,resolveResident,cellUnits,parseCohort,mergeContiguous,translate};
if(typeof module!=='undefined')module.exports=root.NeumRotationImport;
})(typeof window!=='undefined'?window:globalThis);
