export const goals = [['dieta','Emagrecer','Alimentação e escolhas'],['fit','Corpo em movimento','Academia e exercício'],['chines','Chinês','Um idioma, novas possibilidades'],['concurso','Concurso','Estudo, questões e provas'],['carreira','Carreira','Aprender e progredir'],['renda','Renda extra','Novas fontes de renda'],['esposa','Minha esposa','Presença e conexão'],['saas','Meu SaaS','Construir, planejar e vender'],['dinheiro','Juntar dinheiro','Escolhas financeiras'],['tcg','TCG','Hobby e comunidade'],['musica','Aprender música','Tirar o teclado do armário']];
export const actions = [['◒','Comi'],['▤','Estudei'],['☾','Dormi'],['↗','Me exercitei'],['⌘','Trabalhei'],['♡','Tempo a dois'],['◇','Gastei dinheiro'],['♧','Joguei TCG'],['♫','Toquei música'],['◌','Enrolei'],['≈','Fap / porn'],['＋','Outra ação']];
export const impactLabels = {positive:'Positivo',negative:'Negativo',neutral:'Neutro'};
export function validateEntries(data) {
 if (!Array.isArray(data) || data.length > 100000) throw new Error('Backup inválido.');
 const ids = new Set();
 for (const e of data) {
  if (!e || typeof e.id !== 'string' || ids.has(e.id) || typeof e.action !== 'string' || !e.action.trim() || e.action.length > 100 || !Number.isFinite(Date.parse(e.at)) || !Array.isArray(e.impacts) || e.impacts.length === 0 || e.impacts.some(i=>!goals.some(g=>g[0]===i.goal) || !impactLabels[i.value]) || new Set(e.impacts.map(i=>i.goal)).size !== e.impacts.length || typeof e.note !== 'string' || e.note.length > 2000 || !Number.isFinite(e.minutes) || e.minutes < 0 || e.minutes > 1440 || !['yes','no','unsure'].includes(e.relation) || !(e.previousId === null || typeof e.previousId === 'string')) throw new Error('Backup inválido. Os dados atuais foram preservados.');
  ids.add(e.id);
 }
 return data;
}
export function summarize(entries, goal) { return entries.flatMap(e=>e.impacts).filter(i=>i.goal===goal).reduce((a,i)=>(a[i.value]++,a),{positive:0,negative:0,neutral:0}); }
export function transitions(entries) {
 const map = new Map(entries.map(e=>[e.id,e])); const counts = new Map();
 for(const e of entries) { const prev=map.get(e.previousId); if(e.relation!=='yes'||!prev) continue; const key=prev.action+' → '+e.action; counts.set(key,(counts.get(key)||0)+1); }
 return [...counts].sort((a,b)=>b[1]-a[1]);
}
// Only nearby consecutive logs count; overnight gaps are not behavioral evidence.
export function predictNext(entries, action, minimum=5) {
 const byId=new Map(entries.map(e=>[e.id,e]));const counts=new Map();let total=0;
 for(const entry of entries){const previous=byId.get(entry.previousId);if(!previous||previous.action!==action)continue;const gap=Date.parse(entry.at)-Date.parse(previous.at);if(gap<0||gap>2*60*60*1000)continue;counts.set(entry.action,(counts.get(entry.action)||0)+1);total++;}
 return {total,ready:total>=minimum,items:[...counts].sort((a,b)=>b[1]-a[1]).map(([action,count])=>({action,count,percent:Math.round(count/total*100)}))};
}

export function rankedActions(entries) {
 const other = actions.find(([, name]) => name === 'Outra ação');
 const options = new Map(actions.filter(option => option !== other).map(([icon, name]) => [name, icon]));
 const counts = new Map();
 for (const {action} of entries) {
  if (action === other[1]) continue;
  if (!options.has(action)) options.set(action, '◌');
  counts.set(action, (counts.get(action) || 0) + 1);
 }
 // Stable ties preserve the initial order; custom actions follow first appearance.
 return [...options].sort(([a], [b]) => (counts.get(b) || 0) - (counts.get(a) || 0))
  .map(([name, icon]) => [icon, name]).concat([other]);
}
