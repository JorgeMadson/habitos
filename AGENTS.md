# entre• — orientação para agentes

## Comece aqui

Leia [docs/architecture.md](docs/architecture.md) antes de modificar o app. Use [docs/firebase.md](docs/firebase.md) quando a tarefa envolver Auth, Firestore, offline, PWA ou publicação. Use [docs/plano-retomada-firebase.md](docs/plano-retomada-firebase.md) para o estado do produto e decisões ainda abertas.

## Regras de trabalho

- Preserve o registro rápido: estado, objetivo, impacto e contexto podem ser pulados; ações diretas continuam disponíveis.
- Mantenha os dados separados por usuário em `users/{uid}/entries/{entryId}`. Nunca adicione uma leitura global do Firestore.
- Valide mudanças de modelo em `src/model.test.js` e mudanças de Auth/Firestore em `tests/firestore.integration.mjs` e `tests/sync.spec.js`.
- Rode `npm test` e `npm run build` para toda alteração. Para integração, rode `npm run test:integration` com Java disponível.
- Não coloque senhas, chaves privadas ou contas de serviço no frontend. A configuração Web do Firebase é pública; a autorização está nas regras.
- Não publique regras abertas de teste. O arquivo canônico é `firestore.rules`.
- Trate `schemaVersion: 2` como o único contrato ativo. Registros V1 ficam fora da consulta e só entram após uma migração explícita para V2.
- Atualizações remotas não devem destruir um formulário em andamento. Escritas offline devem continuar visíveis no aparelho.
- Evite transformar frequência em causalidade: previsões e padrões são associações observadas e devem mostrar amostra/período.
- Antes de mudar um contrato, procure seus consumidores com `rg` e atualize documentação/testes no mesmo commit.

## Fonte de verdade por assunto

| Assunto | Arquivo canônico |
| --- | --- |
| Objetivos, ações, validação, ranking, previsão e CSV | `src/model.js` |
| Sessão, cache, snapshots, fila e escrita Firestore | `src/store.js` |
| Login, recuperação, importação/exportação e conta | `src/account.js` |
| Fluxo de telas e eventos | `src/app.js` |
| Service worker, instalação e atualização | `src/pwa.js`, `vite.config.js` |
| Autorização do banco | `firestore.rules` |
| Pipeline de Pages | `.github/workflows/pages.yml` |

Faça commits pequenos, preserve mudanças não relacionadas e não declare sincronização pronta sem testar no Firebase real.
