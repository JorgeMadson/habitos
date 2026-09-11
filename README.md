# entre

Diário pessoal de ações, contexto e impacto percebido em objetivos. Interface responsiva, sem conta ou servidor de dados.

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

Escolha uma ação (ou escreva outra), selecione um ou mais objetivos e indique o impacto individual. Salve; duração, nota e relação percebida com o registro anterior podem ser adicionadas depois. O histórico permite excluir registros. Exportação e restauração JSON disponíveis na navegação.

As ações aparecem em ordem de frequência no histórico completo, incluindo as ações personalizadas. Empates preservam a ordem inicial; ações personalizadas empatadas seguem a primeira aparição no histórico. “Outra ação” permanece no final. A ordem é recalculada após registros, exclusões e restauração de backup, sem depender de conexão.

Os 11 objetivos iniciais refletem o escopo pessoal solicitado. Ações não recebem julgamento global. Não há sequências obrigatórias nem metas de uso.

## Próximo registro provável

Frequência empírica de primeira ordem: para a última ação, conta quais registros a sucederam por `previousId`, com intervalo de até duas horas. Só exibe percentuais a partir de cinco transições elegíveis. A contagem de cada resultado e o denominador ficam visíveis. Cinco exemplos são um limite de apresentação, não garantia estatística. O modelo prevê registros observados, não comportamento completo; não estabelece causalidade. Relações explicitamente marcadas pelo usuário aparecem separadamente em Padrões.

## Persistência e limites

Dados no localStorage deste navegador e origem; sem sincronização, autenticação ou backup automático. Exporte backups: limpar os dados do navegador remove os registros. Restauração valida o arquivo e pede confirmação antes de substituir o acervo. Nenhum dado de ação é enviado a serviços externos. A fonte tipográfica usa Google Fonts com fallback local.

Esta versão não inclui PWA/offline, detalhamento por subtipo, valores financeiros, horários retroativos, hierarquias de objetivos ou previsões por contexto. Contagens de impacto não medem resultados reais de objetivos. Tempo entre registros não equivale à duração das atividades.
