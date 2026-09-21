# Arquitetura do entre•

App web mobile-first, local-first e sem backend próprio. Vite gera o frontend; Firebase Authentication identifica o usuário; Cloud Firestore sincroniza registros; Workbox guarda o app shell.

## Primitiva do domínio

`Entry` é o único fato armazenado. O contrato ativo é V2:

```ts
type Entry = {
  schemaVersion: 2
  id: string
  at: string
  action: string
  impacts: { goal: GoalId, value: 'positive'|'negative'|'neutral' }[]
  minutes: number
  note: string
  relation: 'yes'|'no'|'unsure'
  previousId: string | null
  category: 'routine'|'work'|'study'|'care'|'leisure'|'avoidance'|'sexual'|'browsing'|'social'|'other'
  energy: 'very_low'|'low'|'normal'|'high'|null
  emotion: string|null
  context: string|null
  alone: boolean|null
  nextActionDefined: boolean|null
  avoidedTask: string|null
  cycleLevel: 0|1|2|3|4|null
  trigger: string|null
  intervention: string|null
  interventionResult: 'decreased'|'same'|'increased'|'continued'|null
  apathyScore: number|null
  fatigueScore: number|null
  sadnessScore: number|null
  anxietyScore: number|null
  guiltScore: number|null
  focusDifficultyScore: number|null
  recoveryMinutes: number|null
  aftermathRecorded: boolean
}
```

`impacts` pode ser vazio e campos de estado podem ser `null`: o registro rápido continua válido. O documento Firestore acrescenta `deleted: boolean`; exclusões são tombstones.

## Camadas

### `src/model.js`

Funções puras para validação, sugestão de nível, risco, sequências, insights, transições, ranking e exportação. `predictNext` usa transições ligadas por `previousId` em até duas horas. `assessCycleRisk` compara combinações de até três sinais e procura entrada em ciclo nos 30 minutos seguintes. Percentuais exigem cinco amostras comparáveis. Frequência indica associação, não causalidade.

### `src/store.js`

Consulta `schemaVersion == 2` em `users/{uid}/entries`, filtra tombstones e expõe snapshots. `saveEntry()` resolve quando a alteração aparece localmente; o SDK mantém a fila offline. Importação aceita somente V2 e usa transações para preservar IDs e tombstones.

### `src/app.js`

Mantém estado de interface. O fluxo principal é estado opcional → ação → objetivos opcionais → impactos → salvar. Níveis 1 a 3 abrem intervenção; níveis 2 a 4 pedem primeiro sinal; níveis 3 e 4 abrem o pós-ciclo. Ações rápidas podem pular o estado. Snapshots remotos não reconstroem um formulário aberto.

### Outras superfícies

`src/account.js` cuida de conta, backup e recuperação. `src/pwa.js` e `vite.config.js` cuidam do shell offline. `firestore.rules` exige entrada V2 completa e permite atualizar somente estado/ciclo ou tombstone; identidade, ação, horário e impactos ficam imutáveis.

## Corte V2

Documentos sem `schemaVersion: 2` não entram na consulta ativa nem nas análises. Exporte dados V1 antes da atualização. Uma migração futura deve produzir entradas V2 completas antes da importação.

## Regras de análise

- Sugestão de nível usa apenas respostas atuais e pode ser substituída manualmente.
- Risco e próxima ação usam somente o histórico da própria conta.
- Percentuais mostram denominador e exigem amostra mínima de cinco.
- Combinações têm prioridade sobre sinais isolados quando há amostra suficiente.
- Intervenção bem-sucedida significa `interventionResult == 'decreased'`.
- Tempo de recuperação mede custo percebido, não duração clínica.

## Validação

Rode `npm test` e `npm run build` em toda alteração. Mudanças de Auth/Firestore exigem `npm run test:integration`. Não declare sincronização pronta sem teste no Firebase real.
