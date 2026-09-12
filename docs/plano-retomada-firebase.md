# Plano de retomada — entre• + Firebase

Atualizado em 2026-09-12.

## Objetivo

Permitir que o entre• seja usado principalmente no celular, funcione offline depois do primeiro acesso e sincronize o histórico entre dispositivos usando uma conta de e-mail e senha.

## Estado atual

- O app tem registro de ações, objetivos, impactos, contexto, histórico, padrões e previsão da próxima ação.
- As ações mais frequentes aparecem primeiro.
- A persistência local antiga usa `localStorage` na chave `entre.entries.v1`.
- A integração Firebase já está implementada no código:
  - Authentication por e-mail e senha;
  - Firestore com um documento por registro em `users/{uid}/entries/{entryId}`;
  - cache persistente IndexedDB e fila offline do Firestore;
  - importação idempotente dos registros antigos;
  - exportação JSON e CSV;
  - exclusão por tombstone (`deleted: true`);
  - recuperação local de escritas recusadas;
  - PWA/Workbox para abrir o app sem conexão após a primeira preparação online.
- Regras de segurança estão em `firestore.rules`.
- Testes locais dos modelos, regras do Firestore e dois dispositivos no navegador passaram usando emuladores. O teste inclui recarga offline, reconexão, isolamento entre contas, importação sem duplicação, exclusão sincronizada e recuperação de escrita recusada.
- O site ainda não deve ser considerado pronto para uso real até publicar as regras e confirmar o fluxo no projeto `entre-habitos`.

## O que você precisa fazer no Firebase

1. Abra o projeto `entre-habitos` no console do Firebase.
2. Em **Authentication → Método de login**, habilite **E-mail/senha**.
3. Em **Firestore Database → Regras**, substitua as regras de teste pelo conteúdo de `firestore.rules` e clique em **Publicar**.
4. Confirme que o banco é o `(default)`.
5. Em **Authentication → Configurações → Domínios autorizados**, mantenha `localhost` para desenvolvimento e adicione `jorgemadson.github.io` quando o Pages estiver publicado.
6. Abra o site publicado com internet, crie uma conta, aguarde `Sincronizado com sua conta` e só então teste o modo offline.

Não envie senha, chave privada ou conta de serviço. O `firebaseConfig` Web é público; a proteção vem da autenticação e das regras.

## O que ainda falta no repositório

- Revisar/publicar a implementação atual em um commit dedicado, depois de validar o console real.
- Opcional: criar uma página de configuração/ajuda curta dentro do app explicando login, sincronização pendente, importação e backup.
- Opcional: decidir se o produto terá recuperação de conta por e-mail verificado antes de permitir o uso.
- Opcional: trocar o `localStorage` de recuperação por uma tela de backup mais explícita caso os registros recusados sejam frequentes.
- Opcional: reduzir o bundle inicial do Firebase com carregamento sob demanda; o build atual funciona, mas gera um aviso de tamanho.

## Critérios de aceite

- Uma conta criada no dispositivo A entra no dispositivo B com o mesmo e-mail e senha.
- Uma ação criada offline aparece imediatamente no dispositivo de origem, sobrevive a fechar/reabrir e é enviada quando a conexão volta.
- Ações distintas criadas em dois dispositivos aparecem ambas no histórico.
- Uma conta não lê nem grava documentos de outra conta.
- Uma edição de contexto em andamento não é destruída por uma atualização remota.
- Excluir uma ação oculta-a em todos os dispositivos e uma importação antiga não a ressuscita.
- Registros locais antigos só são enviados após ação explícita em **Conta → Importar registros anteriores**.
- JSON e CSV podem ser exportados sem enviar dados a terceiros.
- O app abre offline após a preparação inicial e deixa claro quando há envio pendente.

## Comandos de validação

```sh
npm ci
npm test
npm run test:integration
npm run build
```

`test:integration` usa o projeto fictício `demo-entre` e não altera o Firebase real. Para publicar somente regras, após autenticar o Firebase CLI:

```sh
npx firebase deploy --only firestore:rules --project entre-habitos
```

## Próxima retomada recomendada

Depois que as regras forem publicadas e E-mail/senha estiver habilitado, abrir o site online e executar o roteiro de aceite acima. Registrar pelo menos uma ação real, fechar/reabrir offline, reconectar e confirmar no segundo dispositivo. Só depois decidir se vale implementar melhorias de produto.

## Diagnóstico da publicação web — 2026-09-12

`https://jorgemadson.github.io/habitos/` responde HTTP 200, mas o HTML público ainda aponta para `/src/style.css` e `/src/app.js`. Isso indica que o Pages está servindo a raiz da branch, ou que a configuração de Pages ainda não está usando o artefato `dist/` do workflow. O workflow existente concluiu com sucesso no commit `4410382`, mas a configuração pública precisa ser conferida no GitHub em **Settings → Pages → Build and deployment → Source: GitHub Actions**.

O commit com Firebase/PWA deve ser enviado para `main` depois da revisão local; o push dispara o workflow novamente. Após o workflow terminar, conferir o HTML público e abrir o endereço em uma janela privada. O HTML esperado deve referenciar `/habitos/assets/...`, conter o manifest e carregar o app.

Firebase Hosting é uma alternativa coerente por deixar hospedagem, Auth e Firestore no mesmo projeto, mas não é necessária para corrigir este diagnóstico. Para o teste de hoje, manter GitHub Pages reduz mudanças: configurar o Source como GitHub Actions e enviar o build atual. Uma migração posterior para Firebase Hosting exigiria autenticar o Firebase CLI e configurar um segundo pipeline; não deve ser feita junto com o primeiro teste real.
