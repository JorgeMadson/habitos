import {entriesToCsv} from './model.js';
import {state, login, register, resetPassword, logout, legacyRaw, legacyEntries, importEntries, retryFailed, errorMessage, exportEntries} from './store.js';
export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function download(content, filename, type='application/json') {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function syncText() {
  if (!state.user) return 'Entre para sincronizar';
  if (state.error) return state.error;
  if (state.failed.length) return 'Há registros recusados. Abra Conta para recuperar.';
  if (state.pending) return navigator.onLine ? 'Salvo no aparelho · sincronização pendente' : 'Offline · salvo no aparelho · envio pendente';
  if (state.loading) return 'Carregando registros…';
  if (!navigator.onLine) return 'Offline · usando os registros deste aparelho';
  if (state.fromCache) return 'Dados locais · aguardando confirmação do servidor';
  return 'Sincronizado com sua conta';
}
export function accountView() {
  const legacy = legacyRaw();
  return `<section class="account panel"><h1>${state.user?'Sua conta.':'Seu espaço, com você.'}</h1>${state.user?`
    <p>Conectado como <strong>${escapeHtml(state.user.email)}</strong>.</p><p>Os registros ficam disponíveis neste aparelho e sincronizam quando a conexão volta.</p>
    <button id="account-csv" class="choice">Exportar CSV</button><button id="sign-out" class="choice">Sair da conta</button>
    <div id="recovery"><p>Registros que o servidor recusou: <span id="failed-count">${state.failed.length}</span>. A exportação inclui as ações recuperáveis.</p><button id="retry-failed" class="text-button">Tentar enviar novamente</button></div>
  `:`<p>Entre com a mesma conta nos seus dispositivos. O primeiro acesso precisa de internet.</p>
    <form id="auth-form"><label>E-mail<input name="email" type="email" autocomplete="username" required></label>
    <label>Senha<div class="password-field"><input name="password" type="password" autocomplete="current-password" minlength="6" required><button id="toggle-password" type="button" aria-label="Mostrar senha" aria-pressed="false">Mostrar</button></div></label>
    <div class="account-actions"><button name="intent" value="login" class="primary">Entrar</button><button name="intent" value="register" class="choice">Criar conta</button></div>
    <button id="reset-password" type="button" class="text-button">Esqueci minha senha</button></form>`}
    ${legacy?`<div class="legacy"><h2>Registros anteriores neste aparelho</h2><p>Eles continuam preservados. ${state.user?'Importe para esta conta sem substituir o histórico já sincronizado.':'Entre para importá-los para sua conta.'}</p>
    <button id="export-legacy" class="text-button">Exportar backup anterior</button>${state.user?'<button id="import-legacy" class="choice">Importar registros anteriores</button>':''}</div>`:''}
    <p id="account-message" role="status"></p><p class="muted">Use um aparelho pessoal. Sair da conta oculta o histórico, mas não apaga o cache local do navegador.</p></section>`;
}
export function bindAccount() {
  const $ = s => document.querySelector(s);
  const message = text => {const el=$('#account-message'); if(el)el.textContent=text;};
  async function run(button, action, success='') {
    if(button.disabled)return;button.disabled=true;
    try{await action();if(success)message(success);}catch(error){message(errorMessage(error));}finally{button.disabled=false;}
  }
  const form=$('#auth-form');
  if(form){form.onsubmit=e=>{e.preventDefault();const f=new FormData(form);const button=e.submitter;run(button,()=> (button.value==='register'?register:login)(String(f.get('email')).trim(),String(f.get('password'))));};
    $('#toggle-password').onclick=e=>{const input=form.elements.password;const visible=input.type==='text';input.type=visible?'password':'text';e.currentTarget.textContent=visible?'Mostrar':'Ocultar';e.currentTarget.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');e.currentTarget.setAttribute('aria-pressed',String(!visible));};
    $('#reset-password').onclick=e=>{const email=form.elements.email;if(!email.reportValidity())return;run(e.currentTarget,()=>resetPassword(email.value.trim()),'Se houver uma conta com esse e-mail, você receberá as instruções de recuperação.');};}
  if($('#account-csv'))$('#account-csv').onclick=()=>download(entriesToCsv(exportEntries()),'entre-registros.csv','text/csv;charset=utf-8');
  if($('#sign-out'))$('#sign-out').onclick=e=>run(e.currentTarget,logout);
  if($('#retry-failed'))$('#retry-failed').onclick=e=>run(e.currentTarget,retryFailed,'Tentativa de envio iniciada. Confira o estado da sincronização.');
  if($('#export-legacy'))$('#export-legacy').onclick=()=>download(legacyRaw(),'entre-backup-anterior.json');
  if($('#import-legacy'))$('#import-legacy').onclick=e=>run(e.currentTarget,async()=>{
    const records=legacyEntries();
    if(!confirm(`Importar ${records.length} registros anteriores para ${state.user.email}? Os IDs existentes serão preservados.`))return;
    const count=await importEntries(records);message(`${count} registros importados. A cópia anterior continua preservada.`);
  });
}
