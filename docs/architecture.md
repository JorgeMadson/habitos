# Arquitetura do entre•

Este é um app web mobile-first, local-first e sem backend próprio. O frontend é um bundle Vite servido pelo GitHub Pages. Firebase Authentication identifica o usuário; Cloud Firestore sincroniza registros. O service worker só guarda o app shell. O Firestore IndexedDB é o cache e a fila de registros.

## Primitivas do domínio

`Entry` é o único fato armazenado:

```ts
type Entry = {
  id: string                 // também é o ID do documento Firestore
  at: string                 // ISO UTC gerado pelo aparelho
  action: string             // ação observada, até 100 caracteres
  impacts: { goal: GoalId, value: 'positive'|'negative'|'neutral' }[]
  minutes: number            // 0 quando não informado
  note: string               // opcional, até 2000 caracteres
  relation: 'yes'|'no'|'unsure'
  previousId: string | null  // ação anterior conhecida no aparelho/conta
}
```

`impacts` pode ser vazio. Isso é essencial: a ação é observável mesmo sem relação com um objetivo. Um objetivo pode aparecer no máximo uma vez por entrada. O documento Firestore acrescenta `deleted: boolean`; exclusões são tombstones, não deletes físicos.

Os objetivos e ações iniciais vivem em `src/model.js`. Ações personalizadas são strings, recebem ícone genérico e entram no ranking por frequência. `rankedActions()` preserva a ordem inicial em empates e deixa `Outra ação` no fim.

## Camadas e contratos

### `src/model.js`

Funções puras, sem DOM, Firebase ou relógio implícito: `validateEntries`, `summarize`, `transitions`, `predictNext`, `rankedActions` e `entriesToCsv`. Esta é a camada para mudar regras de negócio e testar dados sem navegador.

`predictNext` conta o próximo registro ligado por `previousId`, com intervalo máximo de duas horas. Só apresenta previsão a partir de cinco transições. É frequência observada, não causalidade.

### `src/store.js`

Inicializa Auth e Firestore por `firebase.js`, abre o snapshot de `users/{uid}/entries`, filtra tombstones e expõe o estado por `subscribe()`. `saveEntry()` escreve um documento por ação e resolve quando a alteração aparece localmente; a fila de rede é responsabilidade do SDK. `importEntries()` usa transação online para não duplicar IDs. `exportEntries()` inclui cópias de recuperação de falhas.

Transição de usuário encerra o snapshot anterior, limpa o estado em memória e começa outro listener. Nunca reaproveite `entries` de uma conta ao entrar em outra.

### `src/account.js`

Renderiza e liga os eventos da conta. Cadastro/login/reset exigem conexão; sessão já existente pode usar cache offline. Importação é explícita. O botão CSV exporta cada objetivo em uma linha e cria uma linha vazia para ações sem objetivo.

### `src/app.js`

Mantém apenas o estado de interface: `page`, `step`, `draft`, `period`, `notice` e `savedId`. O wizard é: escolher ação → escolher zero ou mais objetivos → impactos quando houver → salvar → contexto opcional. O registro mínimo deve continuar funcionando sem duração, nota, relação ou conexão a meta.

### `src/pwa.js` e `vite.config.js`

Geram manifest e service worker em build. A atualização pede confirmação antes de recarregar. O app só fica offline após uma abertura online que conclua o cache; `npm run dev` não prova esse comportamento.

### `firestore.rules`

Cada leitura exige `request.auth.uid == uid`. Criação exige documento completo válido. Updates só alteram contexto/tombstone; ação, timestamp e impactos não mudam. Tombstones não podem voltar a `false`. Publique este arquivo no banco `(default)` antes do teste real.

## Fluxos importantes

### Registro online/offline

1. `app` cria um `Entry` com `previousId` do último registro local.
2. `store.saveEntry()` envia `setDoc()` e o Firestore coloca o documento no cache.
3. O snapshot atualiza a interface imediatamente e indica envio pendente quando necessário.
4. Ao reconectar, o SDK envia a fila e o snapshot confirma o servidor.

### Importação legada

`entre.entries.v1` nunca é apagado automaticamente. Em Conta, o usuário confirma a importação online. Cada ID é testado por transação; repetir o arquivo não cria duplicatas.

### Falha de autorização/rede

Falhas de escrita ficam em `entre.failed.{uid}` e aparecem na exportação. A tela Conta oferece nova tentativa. Não confunda isso com a fila offline normal do SDK.

## Superfícies de publicação

O Pages usa `.github/workflows/pages.yml` e deve publicar o diretório `dist` com base `/habitos/`. O Firebase Hosting ainda não é necessário para a sincronização. Se for adotado, configure uma segunda superfície conscientemente; não misture o pipeline de Hosting com o Pages sem decidir qual URL será canônica.

## Como trabalhar em uma tarefa

1. Localize a primitiva e seus consumidores com `rg`.
2. Escreva ou ajuste o teste do contrato.
3. Faça a menor mudança end-to-end.
4. Rode `npm test`, `npm run build` e, quando tocar Firebase/PWA, `npm run test:integration` e um teste manual no celular.
5. Atualize a documentação que explica a decisão, não uma cópia de comandos que já estão no `package.json`.

## Limites conhecidos

Não há subtipo de ação, valor financeiro, horário retroativo, hierarquia de objetivos, previsão por contexto ou sincronização de dados sem login inicial. O relógio do aparelho define `at`. Alterações concorrentes no mesmo contexto seguem a última escrita aceita pelo Firestore. Limpar dados do navegador pode apagar escritas que ainda não chegaram ao servidor; exporte backups.
