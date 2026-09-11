# entre

Diário pessoal de ações, contexto e impacto percebido em objetivos. Interface responsiva, sem conta ou servidor de dados.

## Executar

```sh
npm install
npm run dev
```

Abra o endereço exibido pelo Vite. Para gerar a versão estática: `npm run build`. Para verificar a lógica: `npm test`.

## Fluxo

Escolha uma ação (ou escreva outra), selecione um ou mais objetivos e indique o impacto individual. Salve; duração, nota e relação percebida com o registro anterior podem ser adicionadas depois. O histórico permite excluir registros. Exportação e restauração JSON disponíveis na navegação.

Os 11 objetivos iniciais refletem o escopo pessoal solicitado. Ações não recebem julgamento global. Não há sequências obrigatórias nem metas de uso.

## Próximo registro provável

Frequência empírica de primeira ordem: para a última ação, conta quais registros a sucederam por `previousId`, com intervalo de até duas horas. Só exibe percentuais a partir de cinco transições elegíveis. A contagem de cada resultado e o denominador ficam visíveis. Cinco exemplos são um limite de apresentação, não garantia estatística. O modelo prevê registros observados, não comportamento completo; não estabelece causalidade. Relações explicitamente marcadas pelo usuário aparecem separadamente em Padrões.

## Persistência e limites

Dados no localStorage deste navegador e origem; sem sincronização, autenticação ou backup automático. Exporte backups: limpar os dados do navegador remove os registros. Restauração valida o arquivo e pede confirmação antes de substituir o acervo. Nenhum dado de ação é enviado a serviços externos. A fonte tipográfica usa Google Fonts com fallback local.

Esta versão não inclui PWA/offline, detalhamento por subtipo, valores financeiros, horários retroativos, hierarquias de objetivos ou previsões por contexto. Contagens de impacto não medem resultados reais de objetivos. Tempo entre registros não equivale à duração das atividades.
