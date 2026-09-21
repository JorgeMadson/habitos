# entre

Radar comportamental pessoal para observar estado, detectar sequências, prever risco e testar intervenções. Interface mobile-first, com sincronização Firebase e uso offline após o primeiro acesso.

Para uma orientação rápida de manutenção, leia [AGENTS.md](AGENTS.md) e [docs/architecture.md](docs/architecture.md). A documentação de configuração e retomada do Firebase está em [docs/firebase.md](docs/firebase.md).

## Executar

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar a versão estática: `npm run build`. Para verificar a lógica: `npm test`.

## GitHub Pages

O projeto está configurado para `https://jorgemadson.github.io/habitos/`, com o caminho base `/habitos/` em `vite.config.js`.

1. No repositório GitHub, abra **Settings → Pages → Build and deployment** e selecione **GitHub Actions** em **Source**.
2. Envie estas configurações para a branch `main`. O workflow `.github/workflows/pages.yml` instala as dependências com `npm ci`, executa os testes, gera `dist/` e publica no Pages. Também pode ser iniciado manualmente pela aba **Actions**.
3. Aguarde o workflow terminar; o endereço publicado aparece no ambiente `github-pages`.

Para conferir o build localmente, execute `npm run build` e `npm run preview`, depois abra `http://localhost:4173/habitos/`. Se o nome do repositório mudar ou um domínio próprio for usado, ajuste `base` conforme a [documentação do Vite](https://vite.dev/guide/static-deploy#github-pages).

Os registros locais não são transferidos automaticamente para o endereço publicado. Para levá-los, exporte o backup no endereço antigo e restaure no novo.

## Fluxo

Registre o estado atual ou pule essa etapa, escolha uma ação, relacione objetivos opcionalmente e salve. Quando surgem sinais de ciclo, o fluxo pede o primeiro sinal e oferece uma intervenção curta; níveis avançados permitem registrar o custo posterior e o tempo de recuperação.

As ações aparecem em ordem de frequência no histórico completo, incluindo as ações personalizadas. Empates preservam a ordem inicial; ações personalizadas empatadas seguem a primeira aparição no histórico. “Outra ação” permanece no final. A ordem é recalculada após registros, exclusões e restauração de backup, sem depender de conexão.

Os 11 objetivos iniciais refletem o escopo pessoal solicitado. Ações não recebem julgamento global. Não há sequências obrigatórias nem metas de uso.

## Previsões e insights

O próximo registro provável usa transições ligadas por `previousId`. O risco procura combinações de contexto no histórico e observa entradas em ciclo nos 30 minutos seguintes. Percentuais aparecem somente a partir de cinco situações comparáveis, sempre com amostra. São associações dos dados do usuário, não diagnóstico ou causalidade.

## Firebase e uso offline

A configuração Web do projeto `entre-habitos` está incluída. Antes do uso, habilite E-mail/senha no Authentication e publique as regras de `firestore.rules` no Firestore. O Pages publica o site, mas não as regras do banco.

Veja [configuração, contrato V2 e testes](docs/firebase.md).

Após o primeiro login e preparação online, os registros ficam no cache persistente do aparelho. O app pode abrir offline e sincroniza as alterações quando a conexão volta. Cada conta acessa seus próprios documentos. O estado na tela diferencia dados locais, envio pendente e confirmação do servidor.

Somente entradas com `schemaVersion: 2` entram no radar. Exporte dados V1 antes de atualizar; eles exigirão migração para o novo formato. Limpar os dados do navegador pode apagar registros ainda não sincronizados.

## Limites

Não há diagnóstico, causalidade, valores financeiros, horários retroativos ou hierarquias de objetivos. Com menos de cinco situações comparáveis, o risco permanece em coleta. Tempo entre registros não equivale à duração das atividades.
