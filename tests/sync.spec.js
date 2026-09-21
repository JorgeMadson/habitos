import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {readFile} from 'node:fs/promises';
import {test,expect} from '@playwright/test';
const password='Only-emulator-123';
async function authenticate(page,email,create=false){
 await page.goto('./');
 await page.getByLabel('E-mail',{exact:true}).fill(email);
 await page.locator('input[name="password"]').fill(password);
 await page.getByRole('button',{name:create?'Criar conta':'Entrar',exact:true}).click();
 await expect(page.locator('#sync-state')).toContainText('Sincronizado',{timeout:20000});
}
async function record(page,action,goal='concurso'){
 await page.locator('.quick-actions summary').click();
 await page.locator(`[data-quick="${action}"]`).click();
 await page.locator(`[data-goal="${goal}"]`).click();
 await page.locator('#goals-next').click();
 await page.locator(`[data-impact="${goal}:positive"]`).click();
 await page.locator('#save-entry').click();
 await expect(page.locator('.notice')).toContainText('Registro salvo');
}
test('two devices, offline reopening, draft preservation, export and account isolation',async({browser})=>{
 const errors=[];
 const first=await browser.newContext({viewport:{width:390,height:844}});
 const second=await browser.newContext({viewport:{width:390,height:844}});
 const a=await first.newPage(),b=await second.newPage();
 a.on('pageerror',e=>errors.push(e.message));b.on('pageerror',e=>errors.push(e.message));
 const email=`offline-${Date.now()}@example.test`;
  await authenticate(a,email,true);
 await a.evaluate(async()=>{await navigator.serviceWorker.ready;});
 await expect.poll(()=>a.evaluate(()=>Boolean(navigator.serviceWorker.controller))).toBe(true);
 if(await a.getByRole('button',{name:'Fechar',exact:true}).count()) await a.getByRole('button',{name:'Fechar',exact:true}).click();
  await record(a,'Estudei');
  await a.locator('.mobile-register [data-start]').click();
  await a.locator('[data-field="energy"][data-value="low"]').click();
  await authenticate(b,email);
  await record(b,'Comi','dieta');
  await expect(a.locator('[data-field="energy"][data-value="low"]')).toHaveClass(/selected/);
  await a.locator('#cancel').click();
  await expect(a.locator('.entry h3').filter({hasText:'Comi'})).toBeVisible();
 await first.setOffline(true);
 await record(a,'Enrolei');
 await expect(a.locator('.entry h3').filter({hasText:'Enrolei'})).toBeVisible();
 await expect(a.locator('#sync-state')).toContainText('envio pendente');
 await a.reload();
 await expect(a.locator('.entry h3').filter({hasText:'Enrolei'})).toBeVisible();
 await expect(a.locator('#sync-state')).toContainText('Offline');
 await a.screenshot({path:'test-results/mobile-offline.png',fullPage:true});
 await record(b,'Dormi');
 b.on('dialog',dialog=>dialog.accept());
 await b.getByRole('button',{name:'Excluir registro de Comi',exact:true}).click();
 await first.setOffline(false);
 await expect(a.locator('#sync-state')).toHaveText('Sincronizado com sua conta',{timeout:30000});
 await expect(b.locator('.entry h3').filter({hasText:'Enrolei'})).toBeVisible({timeout:20000});
 await expect(a.locator('.entry h3').filter({hasText:'Dormi'})).toBeVisible();
 await expect(a.locator('.entry h3').filter({hasText:'Comi'})).toHaveCount(0);
  await expect(a.locator('.entry')).toHaveCount(3);
 await a.locator('[data-page="account"]').click();
 const exported=a.waitForEvent('download');await a.locator('#account-csv').click();
 expect((await exported).suggestedFilename()).toMatch(/csv$/);
 await a.locator('#sign-out').click();
 await expect(a.getByRole('button',{name:'Entrar',exact:true})).toBeVisible();
 await expect(a.locator('.entry')).toHaveCount(0);
 await authenticate(a,`other-${Date.now()}@example.test`,true);
 await expect(a.locator('.entry')).toHaveCount(0);
 expect(errors).toEqual([]);
 await first.close();await second.close();
});

test('a rejected write remains recoverable after reopening and can be retried', async ({browser}) => {
 const rules=await readFile('firestore.rules','utf8');
 const loadRules=async text=>{const environment=await initializeTestEnvironment({projectId:'demo-entre',firestore:{host:'127.0.0.1',port:8080,rules:text}});await environment.cleanup();};
 const context=await browser.newContext({viewport:{width:390,height:844}});
 const page=await context.newPage();page.on('dialog',dialog=>dialog.accept());
 try {
  await authenticate(page,`recovery-${Date.now()}@example.test`,true);
  await loadRules(rules.replace('allow create: if owner(uid)', "allow create: if request.resource.data.action != 'Trabalhei' && owner(uid)"));
  await record(page,'Trabalhei');
  await expect(page.locator('#sync-state')).toContainText('recusou');
  await page.reload();
  await expect(page.locator('#sync-state')).toContainText('recusados');
  await page.locator('[data-page="account"]').click();
  await expect(page.locator('#failed-count')).toHaveText('1');
  await loadRules(rules);
  await page.locator('#retry-failed').click();
  await expect(page.locator('#failed-count')).toHaveText('0');
  await expect(page.locator('#sync-state')).toHaveText('Sincronizado com sua conta');
  await page.locator('[data-page="today"]').click();
  await expect(page.locator('.entry h3').filter({hasText:'Trabalhei'})).toBeVisible();
 } finally {await loadRules(rules);await context.close();}
});
