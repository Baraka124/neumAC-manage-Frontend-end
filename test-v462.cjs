const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync(__dirname+'/app.js','utf8');
const start=src.indexOf('    function useTrainingUnits('),end=src.indexOf('    function useComms(',start);
const ref=value=>({value});const c={ref,reactive:x=>x,computed:f=>({get value(){return f()}}),watch:()=>{},Utils:{debounce:f=>f},staffTypeMap:ref({}),console};
vm.createContext(c);vm.runInContext(src.slice(start,end)+'\nthis.make=useTrainingUnits;',c);
const data={showToast:()=>{},showConfirmation:()=>{},rotations:ref([]),trainingUnits:ref([]),medicalStaff:ref([]),allStaffLookup:ref([]),allDepartmentsLookup:ref([])};
const unit=c.make(data);let n=0;function test(label,fn){fn();console.log('PASS '+label);n++}
test('empty directory and missing resident do not crash',()=>assert.equal(unit.getResidentShortName('missing'),'—'));
test('staff directory fallback is in scope',()=>{data.medicalStaff.value=[{id:'r',full_name:'Alex Example'}];assert.equal(unit.getResidentShortName('r'),'Alex E.')});
test('joined rotation resident remains a fallback',()=>{data.rotations.value=[{resident_id:'joined',resident:{full_name:'Taylor Sample'}}];assert.equal(unit.getResidentShortName('joined'),'Taylor S.')});
test('shared directory refresh remains reactive',()=>{data.allStaffLookup.value=[{id:'r',full_name:'Robin Updated'}];assert.equal(unit.getResidentShortName('r'),'Robin U.')});
test('timeline renders occupied slot with missing directory entry',()=>{data.rotations.value=[{training_unit_id:'u',resident_id:'unknown',rotation_status:'active',start_date:'2000-01-01',end_date:'2099-12-31'}];assert.equal(unit.getUnitSlots('u',1,1).length,1)});
test('clinician assignment reads the injected staff list',()=>{data.trainingUnits.value=[{id:'u',department_id:'d',unit_status:'active'}];data.medicalStaff.value=[{id:'a',department_id:'d',staff_type:'attending_physician',employment_status:'active'}];unit.assignAttendingToUnit(data.medicalStaff.value[0]);assert.equal(unit.unitCliniciansModal.allStaff[0].id,'a');assert.equal(unit.unitCliniciansModal.show,true)});
test('application wires the staff ref into Clinical Units',()=>assert(src.includes('useTrainingUnits({ showToast, showConfirmation, trainingUnits, rotations, medicalStaff, allStaffLookup,')));
console.log(`${n} V46.2 regression checks passed.`);
