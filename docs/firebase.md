# Firebase no entre•

O app usa o projeto `entre-habitos`, com configuração Web pública em `firebase.js`. Não usa Analytics, chave privada ou conta de serviço no navegador.

## Ativar no console

1. Em **Authentication → Método de login**, habilite **E-mail/senha**.
2. Em **Firestore Database → Regras**, copie o conteúdo integral de `firestore.rules` e clique em **Publicar**. Não use regras de teste abertas. O arquivo permite acesso somente em `users/{uid}/entries/{id}` para a própria conta autenticada.
3. Confirme que o banco criado é `(default)`.
4. Se houver restrições de domínio no projeto, inclua `jorgemadson.github.io` em **Authentication → Configurações → Domínios autorizados**. Para desenvolvimento, inclua também `localhost` conforme necessário.
5. Publique o build do app no Pages. Regras do Firestore não são publicadas pelo workflow do Pages.
6. Abra o site com conexão, crie sua conta por e-mail/senha e aguarde **Sincronizado com sua conta**. Abra a mesma conta no segundo dispositivo.

Alternativa para publicar apenas as regras, em uma máquina autenticada no Firebase CLI:

```sh
npx firebase deploy --only firestore:rules --project entre-habitos
```

A configuração Web é pública; a proteção está nas regras e na autenticação. Variáveis opcionais de build estão em `.env.example`. Nenhuma variável é necessária para o projeto atual.

## Offline e sincronização

- O Firestore usa cache persistente IndexedDB com suporte a múltiplas abas. O SDK mantém a fila de escritas e tenta enviá-las quando a conexão retorna.
- O app confirma o salvamento pelo snapshot local, sem esperar uma resposta da rede. O estado da sincronização distingue dados locais, escritas pendentes e confirmação do servidor.
- PWA/Workbox guarda HTML, JavaScript, CSS, ícones e fontes locais. O primeiro acesso precisa de conexão e conclusão da preparação offline. O modo `npm run dev` não instala esse cache; valide usando um build com `npm run preview` ou HTTPS publicado.
- O primeiro login, cadastro, recuperação de senha e importação de backup exigem conexão. A sessão existente permite usar os registros em cache offline.
- Cada ação V2 é um documento independente. Criar ações em dois dispositivos preserva ambas. Alterações concorrentes nos campos de estado/ciclo seguem a última escrita aceita pelo servidor.
- Exclusão marca `deleted: true`. O registro fica oculto em todos os dispositivos e não pode ser ressuscitado por importação.
- Notificações remotas não reconstroem o formulário enquanto você registra ou escreve contexto. Atualizações da PWA pedem que o usuário salve antes de recarregar.
- Sair da conta oculta o histórico e é bloqueado enquanto há escritas pendentes. O cache não é apagado ao sair; use um aparelho pessoal. Limpar dados do navegador pode apagar registros que ainda não chegaram ao servidor.

## Contrato V2 e exportação

O app consulta somente documentos com `schemaVersion == 2`. Backups V1 devem ser exportados antes da atualização e migrados fora do fluxo ativo; não há adaptação automática. Importação JSON aceita apenas entradas V2 completas, adiciona IDs ausentes por transações e preserva documentos existentes e tombstones.

Exportação JSON preserva a estrutura para nova importação. CSV usa UTF-8, separador `;`, uma linha por objetivo afetado e uma linha com objetivo/impacto vazios para ações sem objetivos. Textos iniciados por caracteres de fórmula são protegidos. Durações repetidas em linhas de objetivos não devem ser somadas como ações distintas.

Se o servidor recusar uma escrita, a interface informa o erro e guarda uma cópia de recuperação por conta em localStorage. Ações recusadas entram na exportação; **Conta → Tentar enviar novamente** permite tentar após corrigir o acesso. A fila offline normal continua sob responsabilidade do SDK, não de código próprio.

## Testes locais, sem tocar em produção

Requer Java 21+ e Chromium do Playwright:

```sh
npm ci
npx playwright install chromium
npm test
npm run test:integration
npm run build
```

`test:integration` inicia Authentication/Firestore no projeto fictício `demo-entre`, testa regras e executa o navegador contra um build com emuladores. Os dados são fictícios. `VITE_USE_FIREBASE_EMULATORS=true` é exclusivo dos testes; o build normal usa `entre-habitos`.

O teste de navegador gera um build isolado em `dist-test/`, com configuração de emuladores. O build de produção continua em `dist/`. O workflow do Pages gera seu próprio build normal.

## Referências

- [Persistência offline do Firestore](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Login por e-mail e senha](https://firebase.google.com/docs/auth/web/password-auth)
- [Atualizações da PWA com confirmação](https://vite-pwa-org.netlify.app/guide/prompt-for-update)
