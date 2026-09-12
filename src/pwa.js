import {registerSW} from 'virtual:pwa-register';
function showNotice(text, actionLabel, action) {
  document.querySelector('.pwa-notice')?.remove();
  const box = document.createElement('div'); box.className='pwa-notice';box.setAttribute('role','status');
  const message=document.createElement('div');message.textContent=text;box.append(message);
  if(action){const button=document.createElement('button');button.textContent=actionLabel;button.onclick=action;box.append(button);}
  const close=document.createElement('button');close.textContent='Fechar';close.onclick=()=>box.remove();box.append(close);
  document.body.prepend(box);
}
const updateSW=registerSW({
  onOfflineReady(){showNotice('Pronto para abrir sem internet neste aparelho. Entre uma vez online para acessar sua conta offline.');},
  onNeedRefresh(){showNotice('Há uma atualização disponível. Salve o registro em andamento antes de atualizar.', 'Atualizar',()=>{if(confirm('Reabrir o app atualizado? Campos ainda não salvos serão descartados.'))updateSW(true);});},
  onRegisterError(){showNotice('Não foi possível preparar a abertura offline. Tente reabrir com internet.');},
});
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();
  showNotice('Adicione o entre• à tela inicial para abrir como aplicativo.', 'Instalar',async()=>{await event.prompt();document.querySelector('.pwa-notice')?.remove();});
});
