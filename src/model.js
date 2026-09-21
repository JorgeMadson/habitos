export const goals = [['dieta','Emagrecer','Alimentação e escolhas'],['fit','Corpo em movimento','Academia e exercício'],['chines','Chinês','Um idioma, novas possibilidades'],['concurso','Concurso','Estudo, questões e provas'],['carreira','Carreira','Aprender e progredir'],['renda','Renda extra','Novas fontes de renda'],['esposa','Minha esposa','Presença e conexão'],['saas','Meu SaaS','Construir, planejar e vender'],['dinheiro','Juntar dinheiro','Escolhas financeiras'],['tcg','TCG','Hobby e comunidade'],['musica','Aprender música','Tirar o teclado do armário']];
export const actions = [['◒','Comi'],['▤','Estudei'],['☾','Dormi'],['↗','Me exercitei'],['⌘','Trabalhei'],['♡','Tempo a dois'],['◇','Gastei dinheiro'],['♧','Joguei TCG'],['♫','Toquei música'],['◌','Enrolei'],['≈','Fap / porn'],['＋','Outra ação']];
export const impactLabels = {positive:'Positivo',negative:'Negativo',neutral:'Neutro'};

export const stateOptions = {
 energy: [['very_low','Muito baixa'],['low','Baixa'],['normal','Normal'],['high','Alta']],
 emotion: [['neutral','Neutro'],['bored','Entediado'],['anxious','Ansioso'],['sad','Triste'],['frustrated','Frustrado'],['irritated','Irritado'],['lonely','Sozinho'],['overwhelmed','Sobrecarregado'],['aroused','Excitado'],['unknown','Não sei']],
 context: [['alone','Sozinho'],['family','Com esposa / família'],['work','Trabalho'],['home','Casa'],['bed','Cama'],['bathroom','Banheiro'],['transport','Transporte'],['other','Outro']],
 avoidedTask: [['work','Trabalho'],['study','Estudo'],['housework','Tarefa doméstica'],['appointment','Compromisso'],['conversation','Conversa'],['sleep','Dormir'],['none','Não'],['unknown','Não sei']],
};
export const cycleLevels = [
 ['0','Estável','Sei o que estou fazendo e não estou buscando fuga.'],
 ['1','Vulnerável','Estou sem direção, cansado, sozinho, entediado, frustrado ou sem próxima ação clara.'],
 ['2','Entrada no túnel','Comecei a fantasiar, pesquisar, abrir sites, perfis, redes ou procurar estímulo.'],
 ['3','Ciclo ativo','Estou repetindo a ação, buscando mais novidade, perdendo tempo ou tendo dificuldade de parar.'],
 ['4','Queda','Estou cansado, apático, triste ou com dificuldade de voltar às atividades.'],
];
export const triggerOptions = [['alone','Fiquei sozinho'],['directionless','Fiquei sem saber o que fazer'],['task_ended','Terminei uma tarefa e fiquei sem próxima ação'],['procrastination','Comecei a procrastinar'],['boredom','Senti tédio'],['anxiety','Senti ansiedade'],['sadness','Senti tristeza'],['frustration','Senti frustração'],['sexual_arousal','Senti excitação sexual'],['phone','Peguei o celular sem motivo específico'],['browsing','Comecei a navegar na internet'],['sexual_content','Comecei a procurar conteúdo sexual'],['escorts','Comecei a procurar acompanhantes'],['other','Outro']];
export const interventionOptions = {
 stop: [['sit_without_phone','Sentar sem celular'],['breathe','Respirar'],['water','Beber água'],['shower','Tomar banho'],['short_walk','Caminhada curta']],
 arrange: [['dishes','Louça'],['desk','Mesa'],['room','Quarto'],['organize','Organizar algo por 10 minutos']],
 continue: [['next_work_task','Próxima tarefa do trabalho'],['study_10','Estudar 10 minutos'],['exercise','Exercício'],['chosen_task','Tarefa escolhida anteriormente']],
};

const enums = {
 energy: stateOptions.energy.map(([value])=>value), emotion: stateOptions.emotion.map(([value])=>value),
 context: stateOptions.context.map(([value])=>value), avoidedTask: stateOptions.avoidedTask.map(([value])=>value),
 trigger: triggerOptions.map(([value])=>value), interventionResult: ['decreased','same','increased','continued'],
 category: ['routine','work','study','care','leisure','avoidance','sexual','browsing','social','other'],
};
const optionalEnum = (entry,key,values) => !(key in entry) || entry[key] === null || values.includes(entry[key]);
const optionalBoolean = (entry,key) => !(key in entry) || entry[key] === null || typeof entry[key] === 'boolean';
const optionalScore = (entry,key,max=5) => !(key in entry) || entry[key] === null || (Number.isInteger(entry[key]) && entry[key] >= 0 && entry[key] <= max);

export function validateEntries(data) {
 if (!Array.isArray(data) || data.length > 100000) throw new Error('Backup inválido.');
 const ids = new Set();
 for (const e of data) {
  const radarKeys=['category','energy','emotion','context','alone','nextActionDefined','avoidedTask','cycleLevel','trigger','intervention','interventionResult','apathyScore','fatigueScore','sadnessScore','anxietyScore','guiltScore','focusDifficultyScore','recoveryMinutes','aftermathRecorded'];
  const entryKeys=['schemaVersion','id','at','action','impacts','minutes','note','relation','previousId',...radarKeys];
  const validBase = e && typeof e==='object' && Object.keys(e).length===entryKeys.length && entryKeys.every(key=>key in e) && e.schemaVersion === 2 && typeof e.id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(e.id) && !ids.has(e.id) && typeof e.action === 'string' && e.action.trim() && e.action.length <= 100 && typeof e.at==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(e.at) && Number.isFinite(Date.parse(e.at)) && Array.isArray(e.impacts) && e.impacts.length <= 11 && !e.impacts.some(i=>!goals.some(g=>g[0]===i.goal) || !impactLabels[i.value]) && new Set(e.impacts.map(i=>i.goal)).size === e.impacts.length && typeof e.note === 'string' && e.note.length <= 2000 && Number.isFinite(e.minutes) && e.minutes >= 0 && e.minutes <= 1440 && ['yes','no','unsure'].includes(e.relation) && (e.previousId === null || (typeof e.previousId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(e.previousId)));
  const validRadar = typeof e==='object' && e!==null && radarKeys.every(key=>key in e) && enums.category.includes(e.category) && optionalEnum(e,'energy',enums.energy) && optionalEnum(e,'emotion',enums.emotion) && optionalEnum(e,'context',enums.context) && optionalBoolean(e,'alone') && optionalBoolean(e,'nextActionDefined') && optionalEnum(e,'avoidedTask',enums.avoidedTask) && optionalScore(e,'cycleLevel',4) && optionalEnum(e,'trigger',enums.trigger) && (e.intervention === null || (typeof e.intervention === 'string' && e.intervention.length <= 100)) && optionalEnum(e,'interventionResult',enums.interventionResult) && ['apathyScore','fatigueScore','sadnessScore','anxietyScore','guiltScore','focusDifficultyScore'].every(key=>optionalScore(e,key)) && optionalScore(e,'recoveryMinutes',10080) && typeof e.aftermathRecorded==='boolean';
  if (!validBase || !validRadar) throw new Error('Backup inválido. Os dados atuais foram preservados.');
  ids.add(e.id);
 }
 return data;
}

export function inferCategory(action) {
 const text=action.toLocaleLowerCase('pt-BR');
 if(/porn|fap|masturb|sexual|acompanhante/.test(text))return 'sexual';
 if(/instagram|tiktok|facebook|twitter|rede social/.test(text))return 'social';
 if(/naveg|internet|youtube|celular/.test(text))return 'browsing';
 if(/enrol|procrast/.test(text))return 'avoidance';
 if(/estud|simulado|prova|chinês|chines/.test(text))return 'study';
 if(/trabal|saas|carreira/.test(text))return 'work';
 if(/exerc|academ|caminh|banho|água|agua/.test(text))return 'care';
 if(/jog|música|musica|tcg/.test(text))return 'leisure';
 return 'routine';
}

export function suggestCycleLevel(current={}) {
 if (current.cycleLevel !== null && current.cycleLevel !== undefined && current.cycleLevel !== '') return Number(current.cycleLevel);
 const observed=['energy','emotion','context','alone','nextActionDefined','avoidedTask'].some(key=>current[key]!==null&&current[key]!==undefined);
 if(!observed)return null;
 const vulnerableEmotions=['bored','anxious','sad','frustrated','irritated','lonely','overwhelmed'];
 let signals=0;
 if(['very_low','low'].includes(current.energy))signals++;
 if(vulnerableEmotions.includes(current.emotion))signals++;
 if(current.alone===true||current.context==='alone')signals++;
 if(current.nextActionDefined===false)signals++;
 if(current.avoidedTask&&!['none','unknown'].includes(current.avoidedTask))signals++;
 return signals>=2?1:0;
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

function riskFeatures(state) {
 const features=[];
 if(state.alone===true||state.context==='alone')features.push(['alone','sozinho',e=>e.alone===true||e.context==='alone']);
 if(state.nextActionDefined===false)features.push(['no_next','sem próxima ação',e=>e.nextActionDefined===false]);
 if(['very_low','low'].includes(state.energy))features.push(['low_energy','energia baixa',e=>['very_low','low'].includes(e.energy)]);
 if(state.emotion&&!['neutral','unknown'].includes(state.emotion)){const label=stateOptions.emotion.find(([v])=>v===state.emotion)?.[1].toLowerCase();features.push(['emotion',label,e=>e.emotion===state.emotion]);}
 if(state.context&&!['alone','other'].includes(state.context)){const label=stateOptions.context.find(([v])=>v===state.context)?.[1].toLowerCase();features.push(['context',`contexto: ${label}`,e=>e.context===state.context]);}
 if(state.avoidedTask&&!['none','unknown'].includes(state.avoidedTask)){const label=stateOptions.avoidedTask.find(([v])=>v===state.avoidedTask)?.[1].toLowerCase();features.push(['avoids',`evitando ${label}`,e=>e.avoidedTask===state.avoidedTask]);}
 if(state.action)features.push(['action',state.action,e=>e.action===state.action]);
 return features;
}
function combinations(items,size,start=0,prefix=[],result=[]) {if(prefix.length===size){result.push(prefix);return result;}for(let i=start;i<=items.length-(size-prefix.length);i++)combinations(items,size,i+1,[...prefix,items[i]],result);return result;}
export function assessCycleRisk(entries,current,minimum=5) {
 const ordered=[...entries].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
 const features=riskFeatures(current);
 const candidates=[];
 for(let size=Math.min(3,features.length);size>=1;size--)candidates.push(...combinations(features,size));
 let best=null,maxSample=0;
 for(const combo of candidates){
  const samples=ordered.filter(entry=>entry.id!==current.id&&(entry.cycleLevel===null||entry.cycleLevel<2)&&combo.every(([, ,matches])=>matches(entry)));
  maxSample=Math.max(maxSample,samples.length);
  if(samples.length<minimum)continue;
  let cycles=0;
  for(const sample of samples){const start=Date.parse(sample.at);if(ordered.some(entry=>entry.id!==sample.id&&Date.parse(entry.at)>start&&Date.parse(entry.at)<=start+30*60000&&entry.cycleLevel>=2))cycles++;}
  const percent=Math.round(cycles/samples.length*100);
  const candidate={sample:samples.length,cycles,percent,features:combo.map(([,label])=>label)};
  if(!best||candidate.features.length>best.features.length||(candidate.features.length===best.features.length&&percent>best.percent))best=candidate;
 }
 if(!best)return {ready:false,level:null,sample:maxSample,reason:`Há ${maxSample} de pelo menos ${minimum} situações comparáveis para estimar risco.`};
 const level=best.percent>=60?'high':best.percent>=30?'moderate':'low';
 return {...best,ready:true,level,reason:`Em ${best.percent}% de ${best.sample} situações com ${best.features.join(' + ')}, houve entrada em ciclo nos 30 minutos seguintes.`};
}

export function recurringSequences(entries,minimum=2) {
 const byPrevious=new Map();
 for(const entry of entries){if(!byPrevious.has(entry.previousId))byPrevious.set(entry.previousId,[]);byPrevious.get(entry.previousId).push(entry);}
 const counts=new Map();
 for(const start of entries){let chain=[start],current=start;for(let i=0;i<3;i++){const next=(byPrevious.get(current.id)||[]).filter(e=>Date.parse(e.at)-Date.parse(current.at)<=2*60*60*1000&&Date.parse(e.at)>=Date.parse(current.at)).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];if(!next)break;chain.push(next);current=next;if(chain.length>=3){const label=chain.map(e=>e.action).join(' → ');counts.set(label,(counts.get(label)||0)+1);}}}
 return [...counts].filter(([,count])=>count>=minimum).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

export function cycleInsights(entries,minimum=5) {
 const cycles=entries.filter(e=>e.cycleLevel>=2);
 const byId=new Map(entries.map(entry=>[entry.id,entry]));
 const count=(values,key)=>{const map=new Map();for(const value of values){const item=value[key];if(item!==null&&item!==undefined)map.set(item,(map.get(item)||0)+1);}return [...map].sort((a,b)=>b[1]-a[1]);};
 const interruptionRate=level=>{const items=entries.filter(e=>e.cycleLevel===level&&e.interventionResult);const stopped=items.filter(e=>e.interventionResult==='decreased').length;return {sample:items.length,ready:items.length>=minimum,percent:items.length?Math.round(stopped/items.length*100):0};};
 const interventions=new Map();for(const e of entries.filter(e=>e.intervention&&e.interventionResult)){const current=interventions.get(e.intervention)||{attempts:0,helped:0};current.attempts++;if(e.interventionResult==='decreased')current.helped++;interventions.set(e.intervention,current);}
 const recovery=cycles.map(e=>e.recoveryMinutes).filter(Number.isFinite);
 const hours=count(cycles.map(e=>({...e,hour:new Date(e.at).getHours()})),'hour');
 const beforeCycles=cycles.flatMap(cycle=>{const previous=byId.get(cycle.previousId);const gap=previous?Date.parse(cycle.at)-Date.parse(previous.at):Infinity;return previous&&gap>=0&&gap<=30*60000?[previous]:[];});
 const patterns=new Map();
 for(const entry of entries.filter(item=>item.cycleLevel===null||item.cycleLevel<2).slice(-200)){const risk=assessCycleRisk(entries,{...entry,id:null},minimum);if(!risk.ready)continue;const key=risk.features.join(' + ');const current=patterns.get(key);if(!current||risk.percent>current.percent)patterns.set(key,risk);}
 return {cycleCount:cycles.length,contexts:count(beforeCycles,'context'),triggers:count(cycles,'trigger'),hours,recoveryAverage:recovery.length?Math.round(recovery.reduce((a,b)=>a+b,0)/recovery.length):null,recoverySample:recovery.length,level1:interruptionRate(1),level3:interruptionRate(3),interventions:[...interventions].sort((a,b)=>(b[1].helped/b[1].attempts)-(a[1].helped/a[1].attempts)),sequences:recurringSequences(entries),combinations:[...patterns.values()].sort((a,b)=>b.percent-a.percent||b.sample-a.sample).slice(0,5)};
}

export function rankedActions(entries) {
 const other = actions.find(([, name]) => name === 'Outra ação');
 const options = new Map(actions.filter(option => option !== other).map(([icon, name]) => [name, icon]));
 const counts = new Map();
 for (const {action} of entries) {if (action === other[1]) continue;if (!options.has(action)) options.set(action, '◌');counts.set(action, (counts.get(action) || 0) + 1);}
 return [...options].sort(([a], [b]) => (counts.get(b) || 0) - (counts.get(a) || 0)).map(([name, icon]) => [icon, name]).concat([other]);
}

export function entriesToCsv(entries) {
 const cell = value => {let text=String(value??'');if(/^[=+@\-\t\r\n]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 const fields=['id','at','action','category','energy','emotion','context','alone','nextActionDefined','avoidedTask','cycleLevel','trigger','previousId','intervention','interventionResult','apathyScore','fatigueScore','sadnessScore','anxietyScore','guiltScore','focusDifficultyScore','recoveryMinutes'];
 const rows=[['id','data_hora','acao','objetivo','impacto','duracao_minutos','nota','acao_anterior_id','relacao','categoria','energia','emocao','contexto','sozinho','proxima_acao_definida','tarefa_evitada','nivel_ciclo','primeiro_sinal','intervencao','resultado_intervencao','apatia','cansaco','tristeza','ansiedade','culpa','dificuldade_concentracao','recuperacao_minutos']];
 for(const entry of entries){const impacts=entry.impacts.length?entry.impacts:[null];for(const impact of impacts){const radar=fields.slice(3).filter(key=>key!=='previousId').map(key=>entry[key]??'');rows.push([entry.id,entry.at,entry.action,impact?goals.find(g=>g[0]===impact.goal)[1]:'',impact?impactLabels[impact.value]:'',entry.minutes,entry.note,entry.previousId,entry.relation,...radar]);}}
 return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
