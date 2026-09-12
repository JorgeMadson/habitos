import test from 'node:test';
import assert from 'node:assert/strict';
import {predictNext,validateEntries,summarize,transitions,rankedActions,actions,entriesToCsv} from './model.js';
const entry=(id,action,previousId=null,minute=0)=>({id,action,previousId,at:new Date(Date.UTC(2026,8,11,12,minute)).toISOString(),impacts:[{goal:'concurso',value:'positive'},{goal:'dinheiro',value:'negative'}],minutes:0,note:'',relation:'yes'});
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
