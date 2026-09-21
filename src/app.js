import {state,subscribe,saveEntry,exportEntries,importEntries,errorMessage} from './store.js';
import {accountView,bindAccount,syncText,download} from './account.js';
import './pwa.js';
import '@fontsource-variable/dm-sans/wght.css';
import '@fontsource-variable/manrope/wght.css';
import {
 goals,rankedActions,impactLabels,validateEntries,summarize,transitions,predictNext,entriesToCsv,
 stateOptions,cycleLevels,triggerOptions,interventionOptions,inferCategory,suggestCycleLevel,
 assessCycleRisk,cycleInsights,
} from './model.js';

const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=(at,options)=>new Date(at).toLocaleString('pt-BR',options);
let entries=[];
let page='today',step='',draft={},period=30,notice='',savedId=null,captureStartedWithState=false;

const sameDay=entry=>new Date(entry.at).toDateString()===new Date().toDateString();
const latest=()=>[...entries].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at))[0];
const scoreFields=['apathyScore','fatigueScore','sadnessScore','anxietyScore','guiltScore','focusDifficultyScore'];
const emptyRadar=()=>({category:null,energy:null,emotion:null,context:null,alone:null,nextActionDefined:null,avoidedTask:null,cycleLevel:null,trigger:null,intervention:null,interventionResult:null,apathyScore:null,fatigueScore:null,sadnessScore:null,anxietyScore:null,guiltScore:null,focusDifficultyScore:null,recoveryMinutes:null,aftermathRecorded:false});

function newDraft(action='') {
 return {action,selected:[],impacts:{},minutes:'',note:'',relation:'unsure',previousId:latest()?.id||null,...emptyRadar()};
}
function begin(action='') {
 savedId=null;captureStartedWithState=!action;draft=newDraft(action);step=action?'goals':'state';render();window.scrollTo(0,0);
}
function optionLabel(options,value){return options.find(([id])=>id===value)?.[1]||value||'';}

function render(){
 if(!state.user){$('#app').innerHTML=`<main class="signed-out"><a class="brand" href="#">entre<span>•</span></a>${state.loading?'<p>Carregando sua conta…</p>':accountView()}${state.error?`<p role="alert">${esc(state.error)}</p>`:''}</main>`;bindAccount();return;}
 $('#app').innerHTML=`
  <aside><a class="brand" href="#" aria-label="Entre, início">entre<span>•</span></a><div class="workspace"><span class="avatar">eu</span><div>Meu espaço<small>Um passo de cada vez</small></div></div>
  <nav>${[['today','◫','Meu dia'],['goals','◎','Objetivos'],['patterns','⌁','Radar'],['history','▤','Histórico'],['account','○','Conta']].map(([id,icon,label])=>`<button data-page="${id}" class="${page===id?'active':''}"><span>${icon}</span>${label}</button>`).join('')}</nav>
  <div class="aside-bottom"><span class="local-dot"></span> Salvo na sua conta<button class="text-button" id="backup">Exportar backup ↗</button><label class="import-label">Restaurar backup<input id="import" type="file" accept="application/json" hidden></label><button id="export-csv" class="text-button">Exportar CSV</button></div></aside>
  <main class="${step?'recording':''}"><header><span>RADAR COMPORTAMENTAL</span><span>${fmt(new Date(),{day:'numeric',month:'long',year:'numeric'})}</span></header><div id="sync-state" class="sync-state" role="status">${esc(syncText())}</div>
  ${notice?`<div class="notice" role="status">${esc(notice)}</div>`:''}${state.loading?'<p>Carregando registros locais…</p>':step?wizard():content()}
  <footer>Observar é o primeiro passo. Sem cobranças, sem julgamentos.<span>feito para o seu ritmo <span class="leaf">✳</span></span></footer></main>`;
 bindShell();bindWizard();bindAccount();
}

function bindShell(){
 document.querySelectorAll('[data-page]').forEach(button=>button.onclick=()=>{page=button.dataset.page;step='';notice='';render();window.scrollTo(0,0);});
 $('.brand').onclick=event=>{event.preventDefault();page='today';step='';render();};
 $('#backup').onclick=()=>download(JSON.stringify(exportEntries(),null,2),`entre-backup-${new Date().toISOString().slice(0,10)}.json`);
 $('#export-csv').onclick=()=>download(entriesToCsv(exportEntries()),`entre-${new Date().toISOString().slice(0,10)}.csv`,'text/csv;charset=utf-8');
 $('#import').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;const incoming=validateEntries(JSON.parse(await file.text()));if(!confirm(`Importar ${incoming.length} registros para ${state.user.email}? Registros existentes não serão substituídos.`))return;notice=`${await importEntries(incoming)} registros importados.`;render();}catch(error){alert(errorMessage(error));}};
 document.querySelectorAll('[data-start]').forEach(button=>button.onclick=()=>begin());
 document.querySelectorAll('[data-quick]').forEach(button=>button.onclick=()=>begin(button.dataset.quick));
 document.querySelectorAll('[data-delete]').forEach(button=>button.onclick=async()=>{if(!confirm('Excluir este registro da sua conta em todos os dispositivos?'))return;const entry=entries.find(item=>item.id===button.dataset.delete);if(!entry)return;button.disabled=true;try{await saveEntry(entry,'delete');render();}catch(error){alert(errorMessage(error));button.disabled=false;}});
 document.querySelectorAll('[data-resume]').forEach(button=>button.onclick=()=>resumeFollowUp(button.dataset.resume));
 if($('#period'))$('#period').onchange=event=>{period=Number(event.target.value);render();};
}

function content(){
 if(page==='account')return accountView();
 if(page==='today')return todayView();
 if(page==='history')return `<div class="heading"><div class="eyebrow">UM MOMENTO DE CADA VEZ</div><h1>Sua linha do tempo.</h1><p>Ações, estados e conexões na ordem em que aconteceram.</p></div>${entries.length?timeline(entries):'<section class="empty"><h3>Ainda sem registros.</h3><button class="primary" data-start>Registrar</button></section>'}`;
 const filtered=entries.filter(entry=>Date.parse(entry.at)>=Date.now()-period*86400000);
 const select=`<select id="period" aria-label="Período">${[7,30,90].map(days=>`<option value="${days}" ${days===period?'selected':''}>Últimos ${days} dias</option>`).join('')}</select>`;
 if(page==='goals')return goalsView(filtered,select);
 return radarView(filtered,select);
}

function todayView(){
 const today=entries.filter(sameDay),touched=new Set(today.flatMap(entry=>entry.impacts.map(impact=>impact.goal)));
 return `<section class="mobile-register"><div class="eyebrow">OBSERVAR → PREVER → INTERVIR</div><h1>Como você está?</h1><p>Um registro rápido. Todos os campos de estado podem ser pulados.</p><button class="primary register-main" data-start>＋ Registrar</button><details class="quick-actions"><summary>Registrar uma ação diretamente</summary><div class="action-grid">${actionButtons('data-quick')}</div></details></section>
 <div class="heading desktop-intro"><div class="eyebrow">MENOS AUTOMÁTICO. MAIS CONSCIENTE.</div><h1>Perceba antes do próximo passo.</h1><p>Registre seu estado, observe o que aconteceu e deixe seu histórico revelar padrões.</p></div>
 <section class="hero"><div><span class="eyebrow">SEU PRÓXIMO REGISTRO</span><h2>Como você está agora?</h2><p>Estado primeiro. Ação e objetivos depois.</p><button class="primary" data-start>＋ Registrar <span>↗</span></button><small>Você pode pular qualquer campo.</small></div><div class="art" aria-hidden="true"><div class="orbit o1"></div><div class="orbit o2"></div><div class="orbit o3"></div><div class="art-center">✳</div></div></section>
 ${pendingFollowUp()}${currentRisk()}${prediction()}
 <div class="stats"><article><span>Registros hoje</span><strong>${String(today.length).padStart(2,'0')}</strong><small>Momentos observados</small></article><article><span>Objetivos presentes</span><strong>${String(touched.size).padStart(2,'0')}<em> / 11</em></strong><small>Conectados hoje</small></article><article><span>Sinais de ciclo</span><strong>${String(today.filter(entry=>entry.cycleLevel>=1).length).padStart(2,'0')}</strong><small>Níveis 1 a 4 registrados</small></article></div>
 <div class="section-title"><h2>Seu dia, até aqui <span class="count">${today.length}</span></h2><button class="text-button" data-page="history">Ver histórico ↗</button></div>${today.length?timeline(today):'<section class="empty compact">Seu primeiro registro do dia aparecerá aqui.</section>'}`;
}

function goalsView(filtered,select){return `<div class="heading"><div class="eyebrow">O QUE IMPORTA PARA VOCÊ</div><h1>Seus objetivos.</h1><p>Impactos percebidos, sem pontuação ou competição.</p>${select}</div><div class="goal-grid">${goals.map(([id,name,description],index)=>{const summary=summarize(filtered,id),total=summary.positive+summary.negative+summary.neutral;return `<article class="goal-card"><span class="goal-number">${String(index+1).padStart(2,'0')} /</span><h3>${name}</h3><p>${description}</p><div class="bar">${total?['positive','negative','neutral'].map(value=>`<span class="${value}" style="width:${summary[value]/total*100}%"></span>`).join(''):''}</div><small>${summary.positive} positivos · ${summary.negative} negativos · ${summary.neutral} neutros</small></article>`;}).join('')}</div><p class="muted">Os registros mostram sua percepção. Não medem resultado nem estabelecem causalidade.</p>`;}

function radarView(filtered,select){
 const insight=cycleInsights(filtered),pairs=transitions(filtered);
 const context=insight.contexts[0],trigger=insight.triggers[0];
 const contextText=context?optionLabel(stateOptions.context,context[0]):'Ainda sem contexto recorrente';
 const triggerText=trigger?optionLabel(triggerOptions,trigger[0]):'Ainda sem primeiro sinal recorrente';
 const hours=insight.hours.slice(0,2).map(([hour])=>`${String(hour).padStart(2,'0')}h`).join(' e ');
 const rate=value=>value.ready?`${value.percent}% em ${value.sample} observações`:`${value.sample} de pelo menos 5 observações`;
 const interventionNames=Object.values(interventionOptions).flat();
 return `<div class="heading"><div class="eyebrow">ASSOCIAÇÕES DO SEU HISTÓRICO</div><h1>Seu radar.</h1><p>Padrões observados nos seus dados, nunca diagnósticos ou relações de causa.</p>${select}</div>
 <div class="insight-grid"><article><span>Contexto antes de ciclos</span><strong>${esc(contextText)}</strong><small>${context?`${context[1]} registros`:''}</small></article><article><span>Primeiro sinal mais comum</span><strong>${esc(triggerText)}</strong><small>${trigger?`${trigger[1]} registros`:''}</small></article><article><span>Horários mais frequentes</span><strong>${hours||'Coletando histórico'}</strong><small>${insight.cycleCount} entradas em ciclo</small></article><article><span>Recuperação média</span><strong>${insight.recoveryAverage===null?'Coletando histórico':`${insight.recoveryAverage} min`}</strong><small>${insight.recoverySample} ${insight.recoverySample===1?'registro':'registros'}</small></article></div>
 <section class="panel"><h2>Momento da interrupção</h2><div class="level-comparison"><p><b>Nível 1</b><span>${rate(insight.level1)}</span></p><p><b>Nível 3</b><span>${rate(insight.level3)}</span></p></div><small>Percentuais aparecem apenas com cinco resultados registrados. “Interrompeu” significa que o impulso diminuiu após a intervenção.</small></section>
 <section class="panel"><h2>Intervenções observadas</h2>${insight.interventions.length?insight.interventions.map(([id,result])=>{const name=interventionNames.find(([value])=>value===id)?.[1]||id;return `<div class="pattern-row"><strong>${esc(name)}</strong><span>${result.helped} ajudaram em ${result.attempts} tentativas</span></div>`;}).join(''):'<div class="empty compact">Os resultados das intervenções aparecerão aqui.</div>'}</section>
 <section class="panel"><h2>Combinações relevantes</h2><p>Sinais combinados antes de entradas em ciclo nos 30 minutos seguintes.</p>${insight.combinations.length?insight.combinations.map(item=>`<div class="pattern-row"><strong>${esc(item.features.join(' + '))}</strong><span>${item.percent}% · ${item.cycles} de ${item.sample}</span></div>`).join(''):'<div class="empty compact">São necessárias cinco situações comparáveis.</div>'}</section>
 <section class="panel"><h2>Sequências recorrentes</h2><p>Ações conectadas em até duas horas. Frequência não significa causalidade.</p>${insight.sequences.length?insight.sequences.map(([label,count])=>`<div class="pattern-row"><strong>${esc(label)}</strong><span>${count} vezes</span></div>`).join(''):'<div class="empty compact">São necessárias pelo menos duas sequências iguais.</div>'}</section>
 <section class="panel"><h2>Conexões percebidas</h2>${pairs.length?pairs.slice(0,8).map(([label,count])=>`<div class="pattern-row"><strong>${esc(label)}</strong><span>${count} ${count===1?'vez':'vezes'}</span></div>`).join(''):'<div class="empty compact">Conexões marcadas por você aparecerão aqui.</div>'}</section>`;
}

function currentRisk(){const last=latest();if(!last)return '';const risk=assessCycleRisk(entries,last);return `<section class="risk-card ${risk.ready?risk.level:'learning'}"><div><span class="eyebrow">RISCO ESTIMADO NO ÚLTIMO REGISTRO</span><h2>${risk.ready?risk.level==='high'?'Alto':risk.level==='moderate'?'Moderado':'Baixo':'Coletando histórico'}</h2></div><p>${esc(risk.reason)}</p></section>`;}
function pendingFollowUp(){const entry=[...entries].reverse().find(item=>(item.intervention&&!item.interventionResult)||(item.cycleLevel>=3&&item.trigger&&!item.aftermathRecorded));if(!entry)return '';const resultPending=entry.intervention&&!entry.interventionResult;return `<section class="follow-up"><div><span class="eyebrow">${resultPending?'INTERVENÇÃO EM ANDAMENTO':'ESTADO POSTERIOR PENDENTE'}</span><h2>${esc(entry.action)}</h2><p>${resultPending?'Quando fizer sentido, registre como você ficou após os 10 minutos.':'Registre o custo percebido e o tempo de recuperação quando puder.'}</p></div><button class="primary" data-resume="${esc(entry.id)}">Continuar →</button></section>`;}
function resumeFollowUp(id){const entry=entries.find(item=>item.id===id);if(!entry)return;savedId=id;draft={...entry,selected:entry.impacts.map(impact=>impact.goal),impacts:Object.fromEntries(entry.impacts.map(impact=>[impact.goal,impact.value]))};step=entry.intervention&&!entry.interventionResult?'result':'aftermath';render();window.scrollTo(0,0);}
function prediction(){const last=latest();if(!last)return '';const prediction=predictNext(entries,last.action);return `<section class="prediction"><div class="eyebrow">O QUE COSTUMA VIR DEPOIS</div><h2>Depois de ${esc(last.action)}…</h2>${prediction.ready?`<div class="prediction-items">${prediction.items.slice(0,4).map(item=>`<div><strong>${esc(item.action)}</strong><span>${item.percent}% <small>· ${item.count} de ${prediction.total}</small></span></div>`).join('')}</div><p>Frequências em transições de até duas horas. Associação observada, não certeza.</p>`:`<p>${prediction.total} de pelo menos 5 transições observadas após esta ação.</p>`}</section>`;}

function timeline(list){const interventions=Object.values(interventionOptions).flat();const results={decreased:'impulso diminuiu',same:'ficou igual',increased:'aumentou',continued:'ciclo continuou'};return `<div class="timeline">${[...list].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).map(entry=>{const previous=entries.find(item=>item.id===entry.previousId);const level=entry.cycleLevel??null;const costs=[['Apatia',entry.apathyScore],['Cansaço',entry.fatigueScore],['Tristeza',entry.sadnessScore],['Ansiedade',entry.anxietyScore],['Culpa',entry.guiltScore],['Foco',entry.focusDifficultyScore]].filter(([,value])=>value!==null).map(([label,value])=>`${label} ${value}/5`).join(' · ');return `<article class="entry"><div class="entry-time">${fmt(entry.at,{hour:'2-digit',minute:'2-digit'})}<small>${fmt(entry.at,{day:'2-digit',month:'short'})}</small></div><div class="entry-body"><h3>${esc(entry.action)}${entry.minutes?`<span class="duration">${entry.minutes} min</span>`:''}</h3><div class="tags">${entry.impacts.map(impact=>`<span class="tag ${impact.value}">${esc(goals.find(goal=>goal[0]===impact.goal)[1])} · ${impactLabels[impact.value]}</span>`).join('')}${level!==null?`<span class="tag cycle-${level}">Nível ${level} · ${cycleLevels[level][1]}</span>`:''}${entry.emotion?`<span class="tag subtle">${esc(optionLabel(stateOptions.emotion,entry.emotion))}</span>`:''}</div>${entry.trigger?`<p class="signal">Primeiro sinal: ${esc(optionLabel(triggerOptions,entry.trigger))}</p>`:''}${entry.intervention?`<p class="signal">Intervenção: ${esc(optionLabel(interventions,entry.intervention))}${entry.interventionResult?` · ${results[entry.interventionResult]}`:''}</p>`:''}${costs?`<p class="signal">Pós-ciclo: ${esc(costs)}${entry.recoveryMinutes!==null?` · recuperação ${entry.recoveryMinutes} min`:''}</p>`:entry.recoveryMinutes!==null?`<p class="signal">Recuperação: ${entry.recoveryMinutes} min</p>`:''}${entry.note?`<p class="note">${esc(entry.note)}</p>`:''}${previous?`<small class="connection">${esc(previous.action)} → ${esc(entry.action)} · ${Math.max(0,Math.round((Date.parse(entry.at)-Date.parse(previous.at))/60000))} min</small>`:''}</div><button class="delete" data-delete="${esc(entry.id)}" aria-label="Excluir registro de ${esc(entry.action)}">×</button></article>`;}).join('')}</div>`;}

function actionButtons(attribute='data-action'){return rankedActions(entries).map(([icon,name])=>`<button ${attribute}="${esc(name)}" class="choice"><span>${icon}</span>${esc(name)}<b>↗</b></button>`).join('');}
function choiceGroup(field,options){return `<div class="chip-grid">${options.map(([value,label])=>{const selected=draft[field]!==null&&String(draft[field])===String(value);return `<button type="button" data-field="${field}" data-value="${value}" class="chip ${selected?'selected':''}" aria-pressed="${selected}">${label}</button>`;}).join('')}</div>`;}
function stateStep(){
 const suggested=suggestCycleLevel({...draft,cycleLevel:null}),selected=draft.cycleLevel===null?suggested:Number(draft.cycleLevel),risk=assessCycleRisk(entries,draft);
 return `<div class="wizard state-capture"><div class="wizard-top"><button id="back" class="text-button">← Voltar</button><span>ESTADO ATUAL · OPCIONAL</span><button id="cancel" class="text-button">Cancelar</button></div><h1>Como você está?</h1><p>Responda só o que for útil agora.</p>
 <section class="capture-question"><h2>Energia</h2>${choiceGroup('energy',stateOptions.energy)}</section><section class="capture-question"><h2>Emoção predominante</h2>${choiceGroup('emotion',stateOptions.emotion)}</section>
 <details class="progressive"><summary>Adicionar contexto</summary><section class="capture-question"><h2>Onde / com quem?</h2>${choiceGroup('context',stateOptions.context)}</section><section class="capture-question"><h2>Está sozinho?</h2>${choiceGroup('alone',[[true,'Sim'],[false,'Não']])}</section><section class="capture-question"><h2>Próxima ação definida?</h2>${choiceGroup('nextActionDefined',[[true,'Sim'],[false,'Não']])}</section><section class="capture-question"><h2>Está evitando algo?</h2>${choiceGroup('avoidedTask',stateOptions.avoidedTask)}</section></details>
 <section class="cycle-suggestion"><span>${draft.cycleLevel===null?'Sugestão atual':'Nível selecionado'}</span>${selected===null?'<strong>Sem sugestão ainda</strong><p>Responda um campo ou escolha o nível manualmente.</p>':`<strong>Nível ${selected} · ${cycleLevels[selected][1]}</strong><p>${cycleLevels[selected][2]}</p>`}<details><summary>Ajustar nível manualmente</summary>${choiceGroup('cycleLevel',cycleLevels.map(([value,label])=>[value,`Nível ${value} · ${label}`]))}</details></section>
 <section class="risk-inline ${risk.ready?risk.level:'learning'}"><b>${risk.ready?`Risco ${risk.level==='high'?'alto':risk.level==='moderate'?'moderado':'baixo'}`:'Risco: coletando histórico'}</b><p>${esc(risk.reason)}</p></section>
 <button id="state-next" class="primary">Continuar →</button><button id="skip-state" class="text-button skip">Pular estado</button></div>`;
}

function wizard(){
 if(step==='state')return stateStep();
 if(step==='trigger')return postSaveShell('PRIMEIRO SINAL','Qual foi o primeiro sinal que você percebe agora, olhando para trás?',choiceGroup('trigger',triggerOptions),'<button id="trigger-next" class="primary">Continuar →</button>');
 if(step==='intervention')return interventionStep();
 if(step==='result')return postSaveShell('DEPOIS DE 10 MINUTOS','Como você está agora?',choiceGroup('interventionResult',[['decreased','O impulso diminuiu'],['same','Ficou igual'],['increased','Aumentou'],['continued','O ciclo continuou']]),'<button id="result-next" class="primary" disabled>Registrar resultado →</button>');
 if(step==='aftermath')return aftermathStep();
 const titles={action:'O que aconteceu?',goals:'Qual relação com seus objetivos?',impact:'Como foi essa relação?'};
 return `<div class="wizard"><div class="wizard-top"><button id="back" class="text-button">← Voltar</button><span>REGISTRO RÁPIDO</span><button id="cancel" class="text-button">Cancelar</button></div><h1>${titles[step]}</h1>
 ${step==='action'?`<p>Escolha uma ação observável.</p><div class="action-grid">${actionButtons()}</div><form id="custom" hidden><label>Qual ação?<input id="custom-name" maxlength="100" required placeholder="Ex.: comecei a navegar"></label><button class="primary">Continuar →</button></form>`:''}
 ${step==='goals'?`<div class="selected-action">${esc(draft.action)}</div><p>Selecione quantos quiser ou continue sem objetivo.</p><div class="action-grid">${goals.map(([id,name])=>`<button class="choice ${draft.selected.includes(id)?'selected':''}" data-goal="${id}" aria-pressed="${draft.selected.includes(id)}">${name}<b>${draft.selected.includes(id)?'✓':'＋'}</b></button>`).join('')}</div><button id="goals-next" class="primary">${draft.selected.length?`Continuar com ${draft.selected.length} →`:'Continuar sem objetivo →'}</button>`:''}
 ${step==='impact'?`<p>Essa é a sua percepção, não uma classificação da ação.</p>${draft.selected.length?`<div class="impact-list">${draft.selected.map(id=>`<div class="impact-row"><h3>${goals.find(goal=>goal[0]===id)[1]}</h3><div class="impact-options">${Object.entries(impactLabels).map(([value,label])=>`<button data-impact="${id}:${value}" class="choice ${draft.impacts[id]===value?'selected':''}">${label}</button>`).join('')}</div></div>`).join('')}</div>`:'<div class="empty compact">Nenhum objetivo selecionado. A observação ainda será registrada.</div>'}<button id="save-entry" class="primary" ${draft.selected.some(id=>!draft.impacts[id])?'disabled':''}>Registrar →</button>`:''}</div>`;
}

function postSaveShell(eyebrow,title,body,footer){return `<div class="wizard post-save"><div class="wizard-top"><span></span><span>${eyebrow}</span><button id="finish" class="text-button">Agora não</button></div><h1>${title}</h1><p>Uma resposta rápida ajuda o radar a aprender com o seu histórico.</p>${body}${footer}</div>`;}
function interventionStep(){return postSaveShell('INTERVENÇÃO CURTA','Parece que você entrou em um padrão conhecido. O que quer fazer por 10 minutos?',Object.entries(interventionOptions).map(([group,items])=>`<section class="intervention-group"><h2>${{stop:'Parar',arrange:'Arrumar',continue:'Seguir'}[group]}</h2>${choiceGroup('intervention',items)}</section>`).join('')+`<form id="custom-intervention"><label>Outra ação curta<input name="customIntervention" maxlength="100" placeholder="Ex.: ir para a varanda"></label><button class="choice">Usar esta ação</button></form>`,'');}
function aftermathStep(){const scores=[['apathyScore','Apatia'],['fatigueScore','Cansaço'],['sadnessScore','Tristeza'],['anxietyScore','Ansiedade'],['guiltScore','Culpa'],['focusDifficultyScore','Dificuldade de concentração']];return postSaveShell('PÓS-CICLO','Qual foi o custo percebido?',`<form id="aftermath-form"><div class="score-list">${scores.map(([field,label])=>`<label>${label}<select name="${field}"><option value="">Não informar</option>${[0,1,2,3,4,5].map(value=>`<option value="${value}" ${draft[field]===value?'selected':''}>${value}</option>`).join('')}</select></label>`).join('')}</div><label>Quanto tempo levou para voltar a uma atividade normal?<div class="input-suffix"><input name="recoveryMinutes" type="number" min="0" max="10080" inputmode="numeric" value="${draft.recoveryMinutes??''}"><span>minutos</span></div></label><button class="primary">Salvar estado posterior →</button></form>`,'');}

async function createEntry(button){
 button.disabled=true;const level=draft.cycleLevel===null?suggestCycleLevel(draft):Number(draft.cycleLevel);
 const record={schemaVersion:2,id:Array.from(crypto.getRandomValues(new Uint8Array(16)),number=>number.toString(16).padStart(2,'0')).join(''),at:new Date().toISOString(),action:draft.action,impacts:draft.selected.map(goal=>({goal,value:draft.impacts[goal]})),...emptyRadar(),...draft,minutes:0,note:'',relation:'unsure',category:inferCategory(draft.action),cycleLevel:level};
 delete record.selected;delete record.impacts;record.impacts=draft.selected.map(goal=>({goal,value:draft.impacts[goal]}));
 try{await saveEntry(record);savedId=record.id;draft={...record,selected:record.impacts.map(item=>item.goal),impacts:Object.fromEntries(record.impacts.map(item=>[item.goal,item.value]))};if(level>=2)step='trigger';else if(level===1)step='intervention';else finishFlow();render();}catch(error){alert(errorMessage(error));button.disabled=false;}
}
async function updateRadar(fields){let existing=entries.find(entry=>entry.id===savedId);if(!existing){const {selected,impacts,...base}=draft;existing={...base,impacts:selected.map(goal=>({goal,value:impacts[goal]}))};}const record={...existing,...Object.fromEntries(fields.map(key=>[key,draft[key]]))};await saveEntry(record,'radar',fields);}
function finishFlow(){step='';page='today';notice='Registro salvo no aparelho.';window.scrollTo(0,0);}
async function saveRadarAnd(nextStep,fields){try{await updateRadar(fields);if(nextStep)step=nextStep;else finishFlow();render();}catch(error){alert(errorMessage(error));}}

function bindWizard(){
 if(!step)return;
 if($('#cancel'))$('#cancel').onclick=()=>{step='';render();};
 if($('#finish'))$('#finish').onclick=()=>{finishFlow();render();};
 if($('#back'))$('#back').onclick=()=>{step=step==='state'?'':step==='action'?'state':step==='goals'?(captureStartedWithState?'action':''):step==='impact'?'goals':'';render();};
 document.querySelectorAll('[data-field]').forEach(button=>button.onclick=()=>{let value=button.dataset.value;if(['nextActionDefined','alone'].includes(button.dataset.field))value=value==='true';if(button.dataset.field==='cycleLevel')value=Number(value);draft[button.dataset.field]=draft[button.dataset.field]===value?null:value;render();});
 if($('#state-next'))$('#state-next').onclick=()=>{draft.cycleLevel=draft.cycleLevel===null?suggestCycleLevel(draft):Number(draft.cycleLevel);step='action';render();window.scrollTo(0,0);};
 if($('#skip-state'))$('#skip-state').onclick=()=>{draft={...draft,...emptyRadar()};step='action';render();};
 document.querySelectorAll('[data-action]').forEach(button=>button.onclick=()=>{if(button.dataset.action==='Outra ação'){$('#custom').hidden=false;$('#custom-name').focus();return;}draft.action=button.dataset.action;step='goals';render();window.scrollTo(0,0);});
 if($('#custom'))$('#custom').onsubmit=event=>{event.preventDefault();draft.action=$('#custom-name').value.trim();if(draft.action){step='goals';render();}};
 document.querySelectorAll('[data-goal]').forEach(button=>button.onclick=()=>{const id=button.dataset.goal;draft.selected=draft.selected.includes(id)?draft.selected.filter(goal=>goal!==id):[...draft.selected,id];render();});
 if($('#goals-next'))$('#goals-next').onclick=()=>{step='impact';render();window.scrollTo(0,0);};
 document.querySelectorAll('[data-impact]').forEach(button=>button.onclick=()=>{const [id,value]=button.dataset.impact.split(':');draft.impacts[id]=value;render();});
 if($('#save-entry'))$('#save-entry').onclick=event=>createEntry(event.currentTarget);
 if($('#trigger-next'))$('#trigger-next').onclick=()=>{if(draft.trigger)saveRadarAnd(draft.cycleLevel<=3?'intervention':'aftermath',['trigger']);};
 document.querySelectorAll('[data-field="intervention"]').forEach(button=>button.onclick=()=>{draft.intervention=button.dataset.value;saveRadarAnd('result',['intervention']);});
 if($('#custom-intervention'))$('#custom-intervention').onsubmit=event=>{event.preventDefault();const value=new FormData(event.currentTarget).get('customIntervention').trim();if(!value)return;draft.intervention=value;saveRadarAnd('result',['intervention']);};
 if($('#result-next')){$('#result-next').disabled=!draft.interventionResult;$('#result-next').onclick=()=>saveRadarAnd(draft.cycleLevel>=3?'aftermath':'',['interventionResult']);}
 if($('#aftermath-form'))$('#aftermath-form').onsubmit=event=>{event.preventDefault();const data=new FormData(event.currentTarget);for(const field of scoreFields)draft[field]=data.get(field)===''?null:Number(data.get(field));draft.recoveryMinutes=data.get('recoveryMinutes')===''?null:Number(data.get('recoveryMinutes'));draft.aftermathRecorded=true;saveRadarAnd('',[...scoreFields,'recoveryMinutes','aftermathRecorded']);};
}

let renderedUid,wasLoading;
subscribe(current=>{const changed=renderedUid!==current.user?.uid;entries=current.entries;if(changed){step='';page='today';draft={};savedId=null;notice='';captureStartedWithState=false;}const readyChanged=wasLoading!==current.loading;renderedUid=current.user?.uid;wasLoading=current.loading;if(changed||readyChanged||(!step&&page!=='account'&&current.user))render();updateStatus();});
function updateStatus(){const element=$('#sync-state');if(element)element.textContent=syncText();const count=$('#failed-count');if(count)count.textContent=state.failed.length;}
window.addEventListener('online',updateStatus);window.addEventListener('offline',updateStatus);
