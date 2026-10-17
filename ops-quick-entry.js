/* Ops Room quick entry — a sentence becomes a DRAFT of the unit's counts. Pure, rule-based, no AI.
   "hoy 6 broncoscopias, 1 EBUS, lista de espera 40"  →  Broncoscopias 6 · EBUS 1 · Lista de espera 40.
   Matches only the unit's own measures (and their breakdown categories). Anything unclear is reported, never guessed:
   an unknown phrase goes to `unknown`, a phrase matching two measures equally goes to `ambiguous`.
   Nothing is saved here — the screen fills the form and the person presses Save. Works in the browser and in Node. */
(function(root){'use strict';
const base=s=>String(s||'').normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
  .replace(/(\d+)\s*(min|mins|minutos?)\b/g,'$1min');            // '6 min' is part of a name, not a count
const norm=s=>base(s).replace(/[^a-z0-9/:\s]/g,' ').replace(/\s+/g,' ').trim();                       // names
const normText=s=>base(s).replace(/[\n.]/g,',').replace(/[^a-z0-9/:,;\s]/g,' ').replace(/[ \t]+/g,' ').trim(); // sentences keep , ;
const STOP=new Set(['de','del','la','las','el','los','en','para','por','a','al','con','y','e','hoy','ayer','anteayer','total','hemos','hecho','hizo','se','han','hay','son','fueron','realizado','realizadas','realizados']);
const stem=t=>t.length>4&&t.endsWith('es')?t.slice(0,-2):(t.length>3&&t.endsWith('s')?t.slice(0,-1):t);
const toks=s=>norm(s).split(' ').filter(t=>t&&!STOP.has(t)).map(stem);
const WORDS={cero:0,ningun:0,ninguno:0,ninguna:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,
  once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20};
// Extra words people use for the seeded measures (keyed by measure code). Custom measures still match by their label.
const SYN={broncoscopia:['bronco','broncos','fibro','fibrobroncoscopia','fbs'],espirometria:['espiro','espiros'],pletismografia:['pleti','pletis','pletismo'],
  dlco:['difusion','transferencia'],test_marcha:['tm6m','tm6','6mwt','marcha'],polisomnografia:['psg'],poligrafia:['pg','poligrafo'],
  toracocentesis:['toraco'],biopsia_pleural:['biopsia'],drenaje:['tubo','drenaje'],dias_vmni:['vmni','vni','ventilacion'],
  ingresos:['ingreso'],altas:['alta'],primeras:['primera','nueva','nuevas'],sucesivas:['sucesiva','revision','revisiones'],
  visitas:['visita'],pendientes_informar:['informar','pendiente'],lista_espera:['lista','espera','le']};
const iso=d=>d.toISOString().slice(0,10);
const addDays=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return iso(x)};
const tokenMatch=(t,m)=>t===m||(t.length>=4&&m.startsWith(t))||(m.length>=4&&t.startsWith(m));

function vocab(measure){return [...new Set([...toks(measure.label),...toks(String(measure.code||'').replace(/_/g,' ')),...(SYN[measure.code]||[]).map(stem)])];}

// Best measure for a phrase: coverage of the phrase counts most, then how much of the measure name it covers.
function bestMatch(words,cands){
  if(!words.length)return {none:true};
  const scored=cands.map(c=>{const v=c.vocab,nameTok=c.nameTok;const hit=words.filter(w=>v.some(m=>tokenMatch(w,m))).length;
    const nameHit=nameTok.filter(m=>words.some(w=>tokenMatch(w,m))).length;
    return {c,score:hit?2*hit/words.length+(nameTok.length?nameHit/nameTok.length:0):0}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  if(!scored.length)return {none:true};
  if(scored[1]&&Math.abs(scored[0].score-scored[1].score)<1e-9)return {ambiguous:scored.filter(x=>Math.abs(x.score-scored[0].score)<1e-9).map(x=>x.c)};
  return {hit:scored[0].c};
}

function parseDate(text,today){
  let date=null,warning=null,t=' '+normText(text)+' ';
  const dm=/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/.exec(t);
  if(dm){const y=dm[3]?(dm[3].length===2?'20'+dm[3]:dm[3]):today.slice(0,4);const d=`${y}-${dm[2].padStart(2,'0')}-${dm[1].padStart(2,'0')}`;
    if(!isNaN(Date.parse(d+'T12:00:00Z'))&&iso(new Date(d+'T12:00:00Z'))===d)date=d;t=t.replace(dm[0],' ');}
  if(/\banteayer\b/.test(t))date=addDays(today,-2);else if(/\bayer\b/.test(t))date=addDays(today,-1);else if(/\bhoy\b/.test(t))date=today;
  if(date&&date>today){warning='That date is in the future — counts were not moved to it.';date=null;}
  t=t.replace(/\b(anteayer|ayer|hoy)\b/g,' ');
  return {date,warning,rest:t.trim()};
}

// Split a segment with several numbers ("broncoscopias 6 ebus 1" or "6 broncoscopias 1 ebus") into number+phrase chunks.
function chunks(seg){
  const raw=seg.split(/\s+/).filter(Boolean),isNum=w=>/^\d+$/.test(w)||Object.prototype.hasOwnProperty.call(WORDS,w);
  const val=w=>/^\d+$/.test(w)?Number(w):WORDS[w];
  const idx=raw.map((w,i)=>isNum(w)?i:-1).filter(i=>i>=0);
  if(!idx.length)return [{n:null,words:raw}];
  if(idx.length===1)return [{n:val(raw[idx[0]]),words:raw.filter((_,i)=>i!==idx[0])}];
  const out=[],numFirst=idx[0]===0;
  idx.forEach((ix,k)=>{const words=numFirst?raw.slice(ix+1,idx[k+1]??raw.length):raw.slice(k===0?0:idx[k-1]+1,ix);out.push({n:val(raw[ix]),words});});
  return out;
}

/* measures: [{type_id, label, code, kind:'flow'|'stock', breakdown:null|kind}]
   opts: {today:'YYYY-MM-DD', breakdowns:{kind:[{code,label}]}} */
function parse(text,measures,opts={}){
  const today=opts.today||iso(new Date()),bds=opts.breakdowns||{};
  const res={date:null,values:{},bd:{},stocks:{},matched:[],unknown:[],ambiguous:[],notes:[]};
  const input=String(text||'').slice(0,500);if(!input.trim())return res;
  const d=parseDate(input,today);res.date=d.date;if(d.warning)res.notes.push(d.warning);
  const cands=(measures||[]).map(m=>({...m,vocab:vocab(m),nameTok:toks(m.label)}));
  const cats=[];for(const m of cands)if(m.breakdown)for(const it of (bds[m.breakdown]||[]))cats.push({m,code:it.code,label:it.label,vocab:[...new Set([...toks(it.label),...toks(String(it.code).replace(/_/g,' '))])],nameTok:toks(it.label)});
  let context=null;
  const segs=d.rest.split(/[,;\n.]|\s+y\s+/).map(s=>s.trim()).filter(Boolean);
  for(let seg of segs){
    const colon=seg.indexOf(':');
    if(colon>=0){const head=toks(seg.slice(0,colon)),b=bestMatch(head,cands);context=b.hit||context;seg=seg.slice(colon+1).trim();if(!seg)continue;}
    for(const {n,words:rawWords} of chunks(seg)){
      const words=rawWords.filter(w=>!STOP.has(w)).map(stem),phrase=rawWords.join(' ');
      if(n===null){const b=bestMatch(words,cands);if(b.hit)context=b.hit;else if(words.length)res.unknown.push(phrase);continue;}
      // category of a measure counted by breakdown ("3 EPOC" after "ingresos:")
      const catPool=context&&context.breakdown?cats.filter(c=>c.m.type_id===context.type_id):cats;
      const cm=catPool.length?bestMatch(words,catPool):{none:true};
      const mm=bestMatch(words,cands);
      if(cm.hit&&!(mm.hit&&mm.hit.type_id!==cm.hit.m.type_id&&!mm.hit.breakdown&&!context)){
        const t=cm.hit.m.type_id;(res.bd[t]=res.bd[t]||{})[cm.hit.code]=n;res.matched.push({label:cm.hit.m.label,category:cm.hit.label,value:n,kind:cm.hit.m.kind});continue;}
      if(cm.ambiguous&&!mm.hit){res.ambiguous.push({phrase,options:cm.ambiguous.map(c=>c.m.label+' · '+c.label)});continue;}
      if(mm.ambiguous){res.ambiguous.push({phrase,options:mm.ambiguous.map(c=>c.label)});continue;}
      if(!mm.hit){res.unknown.push(phrase||String(n));continue;}
      const m=mm.hit;
      if(m.breakdown){res.notes.push(`${m.label} is counted by ${m.breakdown.replace('_',' ')} — give the count for each one.`);context=m;continue;}
      if(m.kind==='stock')res.stocks[m.type_id]=n;else res.values[m.type_id]=n;
      res.matched.push({label:m.label,value:n,kind:m.kind});context=null;
    }
  }
  return res;
}

root.NeumOpsQuick={parse,norm,stem};if(typeof module!=='undefined')module.exports=root.NeumOpsQuick;
})(typeof window!=='undefined'?window:globalThis);
