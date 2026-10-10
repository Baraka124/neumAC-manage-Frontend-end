/* neumDESK clinical-study source field inventory.
 * Run: node scripts/audit-clinical-study-fields.js
 * Read-only. No clinical status inference and no patient data output.
 */
const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function locate(token){const at=source.indexOf(token);return at<0?null:{line:source.slice(0,at).split('\n').length,offset:at};}
const tokens=['clinicalTrials','filteredTrialsAll','openStudy(','trialStatusKey(','researchSources.studies','rv32-row-governance','rv32-row-recruitment','selectedTrial','study.ethics','trial.ethics'];
const references=tokens.map(token=>({token,location:locate(token)}));
const studyExpressions=new Set();
for(const match of source.matchAll(/(?:trial|selectedTrial)\.([A-Za-z_$][\w$]*)/g))studyExpressions.add(match[1]);
const report={generatedBy:'scripts/audit-clinical-study-fields.js',source:'index.html',sourceLength:source.length,referencePoints:references,referencedStudyProperties:[...studyExpressions].sort(),warning:'UI property references are NOT authoritative database schema, verification evidence, or approval rules. Review source API and roles before introducing clinical readiness.'};
process.stdout.write(JSON.stringify(report,null,2)+'\n');
if(references.filter(x=>x.location).length<4){process.stderr.write('Insufficient study UI markers; investigate source layout changes.\n');process.exitCode=1;}
