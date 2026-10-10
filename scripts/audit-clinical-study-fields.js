/* neumDESK · read-only Clinical Studies frontend reference audit.
   Usage: node scripts/audit-clinical-study-fields.js [path/to/index.html]
   Output contains source code references only, never study/patient data.
*/
const fs=require('fs'),path=require('path');
function collect(source){
 const lines=source.split(/\r?\n/);
 const tokens=['clinicalTrials','filteredTrialsAll','openStudy(','trialStatusKey(','researchSources.studies','rv32-row-governance','rv32-row-recruitment','selectedTrial','study.ethics','trial.ethics'];
 const locate=token=>{const i=source.indexOf(token);return i<0?null:{line:source.slice(0,i).split('\n').length,offset:i}};
 const referencedStudyProperties=[...new Set([...source.matchAll(/\b(?:trial|selectedTrial)(?:\?\.)?\.([A-Za-z_$][\w$]*)/g)].map(m=>m[1]))].sort();
 const evidenceTerms=['protocol','ethic','approval','recruit','investigator','sponsor','consent','governance'];
 const evidenceReferences=Object.fromEntries(evidenceTerms.map(term=>[term,lines.flatMap((line,i)=>line.toLowerCase().includes(term)?[i+1]:[]).slice(0,40)]));
 const references=tokens.map(token=>({token,location:locate(token)}));
 return {sourceLength:source.length,referencePoints:references,referencedStudyProperties,evidenceReferences,warning:'Code references are not an authoritative schema, verified approval evidence, or clinical readiness. Check API, database, permissions, audit trail and the actual clinical workflow.'};
}
if(require.main===module){
 const filename=process.argv[2]||path.join(__dirname,'..','index.html');
 const report=collect(fs.readFileSync(filename,'utf8'));
 process.stdout.write(JSON.stringify({source:path.basename(filename),...report},null,2)+'\n');
 if(report.referencePoints.filter(x=>x.location).length<4){process.stderr.write('Insufficient study UI markers; inspect source layout.\n');process.exitCode=1;}
}
module.exports={collect};
