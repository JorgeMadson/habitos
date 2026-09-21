import test from 'node:test';
import assert from 'node:assert/strict';
import {predictNext,validateEntries,summarize,transitions,rankedActions,actions,entriesToCsv,suggestCycleLevel,assessCycleRisk,recurringSequences,cycleInsights} from './model.js';
const radar={category:'routine',energy:null,emotion:null,context:null,alone:null,nextActionDefined:null,avoidedTask:null,cycleLevel:null,trigger:null,intervention:null,interventionResult:null,apathyScore:null,fatigueScore:null,sadnessScore:null,anxietyScore:null,guiltScore:null,focusDifficultyScore:null,recoveryMinutes:null,aftermathRecorded:false};
const entry=(id,action,previousId=null,minute=0)=>({schemaVersion:2,id,action,previousId,at:new Date(Date.UTC(2026,8,11,12,minute)).toISOString(),impacts:[{goal:'concurso',value:'positive'},{goal:'dinheiro',value:'negative'}],minutes:0,note:'',relation:'yes',...radar});
test('prediction uses counts and needs five observed transitions',()=>{const es=[];for(let i=0;i<5;i++){es.push(entry('a'+i,'Enrolei',null,i*2));es.push(entry('b'+i,i<3?'Estudei':'Comi','a'+i,i*2+1));}assert.equal(predictNext(es.slice(0,8),'Enrolei').ready,false);const p=predictNext(es,'Enrolei');assert.equal(p.ready,true);assert.deepEqual(p.items[0],{action:'Estudei',count:3,percent:60});});
test('prediction ignores long gaps and missing previous records',()=>{assert.equal(predictNext([entry('a','Enrolei'),entry('b','Comi','a',121),entry('c','Comi','missing')],'Enrolei').total,0);});
test('goal impacts remain independent and explicit links form patterns',()=>{const es=[entry('a','Enrolei'),entry('b','Estudei','a',10)];assert.equal(summarize(es,'concurso').positive,2);assert.equal(summarize(es,'dinheiro').negative,2);assert.deepEqual(transitions(es),[['Enrolei → Estudei',1]]);});
test('backup rejects invalid or duplicate data',()=>{assert.throws(()=>validateEntries([entry('a','Comi'),entry('a','Comi')]));assert.throws(()=>validateEntries([{...entry('a','Comi'),minutes:-1}]));assert.throws(()=>validateEntries([{...entry('a','Comi'),impacts:[{goal:'fake',value:'positive'}]}]));assert.equal(validateEntries([entry('a','Comi')]).length,1);});

test('action ranking includes custom actions and keeps the other button last', () => {
 const history = ['Caminhei', 'Estudei', 'Caminhei', 'Dormi', 'Estudei', 'Caminhei'].map((action, index) => entry(String(index), action));
 const names = rankedActions(history).map(([, name]) => name);
 assert.deepEqual(names.slice(0, 3), ['Caminhei', 'Estudei', 'Dormi']);
 assert.equal(names.at(-1), 'Outra ação');
 assert.equal(names.filter(name => name === 'Caminhei').length, 1);
 assert.deepEqual(rankedActions([]), actions);
});
test('ranking follows current history after deletion and backup restoration', () => {
 const history = [entry('1', 'Estudei'), entry('2', 'Comi'), entry('3', 'Estudei')];
 assert.equal(rankedActions(validateEntries(JSON.parse(JSON.stringify(history))))[0][1], 'Estudei');
 assert.equal(rankedActions(history.slice(0, 2))[0][1], 'Comi');
 assert.equal(rankedActions([entry('4', 'Outra ação')]).at(-1)[1], 'Outra ação');
});

test('CSV exports each goal, quotes user text and neutralizes spreadsheet formulas', () => {
 const csv=entriesToCsv([{...entry('csv','Estudei'),note:'=SUM(1;2)\n"texto"'}]);
 assert.ok(csv.startsWith('\uFEFF'));
 assert.ok(csv.includes('"Concurso";"Positivo"'));
 assert.ok(csv.includes('"Juntar dinheiro";"Negativo"'));
 assert.ok(csv.includes('"\'=SUM(1;2)\n""texto"""'));
});
test('backup rejects IDs that cannot safely become Firestore paths', () => {
 assert.throws(()=>validateEntries([entry('a/b','Comi')]));
});
test('actions can be recorded without an affected goal', () => {
 const noGoal = {...entry('no-goal','Fap / porn'), impacts: []};
 assert.equal(validateEntries([noGoal]).length, 1);
});

test('V2 requires the complete radar shape and rejects legacy entries', () => {
 const complete=entry('v2','Trabalhei');
 assert.equal(validateEntries([complete])[0].schemaVersion,2);
 const {schemaVersion,...legacy}=complete;
 assert.throws(()=>validateEntries([legacy]));
 const {emotion,...incomplete}=complete;
 assert.throws(()=>validateEntries([incomplete]));
 assert.throws(()=>validateEntries([{...complete,unexpected:true}]));
 assert.throws(()=>validateEntries([{...complete,previousId:'invalid/path'}]));
 assert.throws(()=>validateEntries([null]));
});

test('cycle level suggestion is explainable and can be manually overridden', () => {
 assert.equal(suggestCycleLevel({energy:null,emotion:null,context:null,alone:null,nextActionDefined:null,avoidedTask:null}),null);
 assert.equal(suggestCycleLevel({energy:'low',nextActionDefined:false}),1);
 assert.equal(suggestCycleLevel({energy:'normal',emotion:'neutral',nextActionDefined:true}),0);
 assert.equal(suggestCycleLevel({energy:'low',nextActionDefined:false,cycleLevel:2}),2);
});

test('risk only exposes a percentage after five comparable situations', () => {
 const history=[];
 for(let index=0;index<5;index++){
  const vulnerable={...entry(`before-${index}`,'Peguei o celular',null,index*60),energy:'low',context:'alone',alone:true,nextActionDefined:false};
  const cycle={...entry(`cycle-${index}`,'Comecei a navegar',vulnerable.id,index*60+10),category:'browsing',cycleLevel:2};
  history.push(vulnerable,cycle);
 }
 const current={energy:'low',context:'alone',alone:true,nextActionDefined:false};
 assert.equal(assessCycleRisk(history.slice(0,8),current).ready,false);
 const risk=assessCycleRisk(history,current);
 assert.equal(risk.ready,true);
 assert.equal(risk.level,'high');
 assert.equal(risk.percent,100);
 assert.deepEqual(risk.features,['sozinho','sem próxima ação','energia baixa']);
});

test('risk does not use an active cycle as a pre-cycle sample', () => {
 const active=Array.from({length:6},(_,index)=>({...entry(`active-${index}`,'Naveguei',null,index*10),energy:'low',alone:true,nextActionDefined:false,cycleLevel:2}));
 assert.equal(assessCycleRisk(active,{energy:'low',alone:true,nextActionDefined:false}).ready,false);
});

test('recurring sequences and recovery cost are derived from linked events', () => {
 const history=[];
 for(let index=0;index<2;index++){
  const start=entry(`a-${index}`,'Fiquei sozinho',null,index*180);
  const browse=entry(`b-${index}`,'Naveguei',start.id,index*180+5);
  const cycle={...entry(`c-${index}`,'Fap / porn',browse.id,index*180+10),category:'sexual',cycleLevel:3,trigger:'browsing',recoveryMinutes:40};
  history.push(start,browse,cycle);
 }
 assert.deepEqual(recurringSequences(history)[0],['Fiquei sozinho → Naveguei → Fap / porn',2]);
 const insights=cycleInsights(history);
 assert.equal(insights.recoveryAverage,40);
 assert.deepEqual(insights.triggers[0],['browsing',2]);
});

test('cycle context insight uses the linked event before the cycle', () => {
 const before={...entry('before','Fiquei sem direção'),context:'home',alone:true,nextActionDefined:false};
 const cycle={...entry('cycle','Naveguei','before',10),context:'bathroom',cycleLevel:2};
 assert.deepEqual(cycleInsights([before,cycle]).contexts[0],['home',1]);
});
