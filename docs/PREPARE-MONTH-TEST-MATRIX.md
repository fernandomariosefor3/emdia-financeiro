# Prepare Your Month — Matriz de Testes (Fase 5A)

Matriz dos 30 cenários originais + 14 cenários de hardening, cobertos por 46 testes em
`test:prepare-month` (script independente de `test:ui` e `test:today-data`).

| # | Cenário | Arquivo | Resultado |
|---|---------|---------|-----------|
| 1 | flag desativada redireciona | `PrepareMonthPage.test.tsx` | Pass |
| 2 | usuário não autenticado continua protegido | `PrepareMonthPage.test.tsx` | Pass |
| 3 | página abre com flag ativa | `PrepareMonthPage.test.tsx` | Pass |
| 4 | saldo positivo | `buildContextFromForm.test.ts` | Pass |
| 5 | saldo zero | `buildContextFromForm.test.ts` | Pass |
| 6 | saldo negativo | `buildContextFromForm.test.ts` | Pass |
| 7 | data futura bloqueada | `PrepareMonthPage.test.tsx` | Pass |
| 8 | reserva ausente | `buildContextFromForm.test.ts` | Pass |
| 9 | reserva positiva | `buildContextFromForm.test.ts` | Pass |
| 10 | reserva zero explícita | `buildContextFromForm.test.ts` | Pass |
| 11 | campo vazio não vira zero | `buildContextFromForm.test.ts` | Pass |
| 12 | receita confirmada | `buildContextFromForm.test.ts` | Pass |
| 13 | receita provável | `buildContextFromForm.test.ts` | Pass |
| 14 | receita incerta | `buildContextFromForm.test.ts` | Pass |
| 15 | compromisso mensal | `buildContextFromForm.test.ts` | Pass |
| 16 | compromisso semanal | `buildContextFromForm.test.ts` | Pass |
| 17 | compromisso anual | `buildContextFromForm.test.ts` | Pass |
| 18 | custom_interval não aparece | `buildContextFromForm.test.ts` | Pass |
| 19 | meta válida | `PrepareMonthPage.test.tsx` | Pass |
| 20 | meta protegida maior que alvo bloqueada | `PrepareMonthPage.test.tsx` | Pass |
| 21 | contexto parcial | `PrepareMonthPage.test.tsx` | Pass |
| 22 | prévia válida | `PrepareMonthPage.test.tsx` | Pass |
| 23 | Respiro exibido como estimativa | `PrepareMonthPage.test.tsx` | Pass |
| 24 | renda provável ignorada no cenário oficial | `PrepareMonthPage.test.tsx` | Pass |
| 25 | reiniciar limpa o estado | `PrepareMonthPage.test.tsx` | Pass |
| 26 | dados não persistem após remontagem | `PrepareMonthPage.test.tsx` | Pass |
| 27 | ausência de chamadas Firebase | `PrepareMonthPage.test.tsx` | Pass |
| 28 | navegação voltar/avançar | `PrepareMonthPage.test.tsx` | Pass |
| 29 | foco muda corretamente | `PrepareMonthPage.test.tsx` | Pass |
| 30 | entrada original não é mutada | `buildContextFromForm.test.ts` | Pass |

Dois testes adicionais de suporte em `buildContextFromForm.test.ts` cobrem `parseReaisInputToCents`
retornando `null` (não zero) para entrada vazia e para entrada não numérica.

## Hardening (rodada de endurecimento pré-Ready)

| # | Cenário | Arquivo | Resultado |
|---|---------|---------|-----------|
| H1 | projectedBalance não é zero fabricado | `buildPrepareMonthPreview.test.ts` | Pass |
| H2 | projeção com saldo positivo (sem eventos) | `buildPrepareMonthPreview.test.ts` | Pass |
| H3 | projeção com compromisso deduz o valor | `buildPrepareMonthPreview.test.ts` | Pass |
| H4 | projeção com renda confirmada soma o valor | `buildPrepareMonthPreview.test.ts` | Pass |
| H5 | renda provável ignorada também na projeção | `buildPrepareMonthPreview.test.ts` | Pass |
| H6 | ação crítica usa R$ (não centavos crus) | `formatRecommendedActionForUser.test.ts` | Pass |
| H7 | ação de risco alto usa R$ | `formatRecommendedActionForUser.test.ts` | Pass |
| H8 | nenhuma mensagem contém "centavos" | `formatRecommendedActionForUser.test.ts` | Pass |
| H9 | nenhuma mensagem expõe reasonCodes técnicos | `formatRecommendedActionForUser.test.ts` | Pass |
| H10 | função de prévia é determinística | `buildPrepareMonthPreview.test.ts` | Pass |
| H11 | função de prévia não altera a entrada | `buildPrepareMonthPreview.test.ts` | Pass |
| H12 | nenhum termo técnico vaza para a mensagem | `formatRecommendedActionForUser.test.ts` | Pass |
| H13 | reiniciar continua limpando tudo (reconfirmado) | `PrepareMonthPage.test.tsx` | Pass |
| H14 | flag de produção continua desligada por padrão | `PrepareMonthPage.test.tsx` | Pass |

Também incluídos: mensagem de ritmo reduzido e mensagem de "manter plano" (ambas cobertas junto
de H6-H9 em `formatRecommendedActionForUser.test.ts`).

## Totais por suíte (workspace `artifacts/emdia`)

| Suíte | Testes | Resultado |
|-------|--------|-----------|
| `test:finance` | 25 | Pass |
| `test:ui` | 9 | Pass |
| `test:today-data` | 25 | Pass |
| `test:financial-context` | 54 | Pass |
| `test:prepare-month` | 46 | Pass |
| **Total único** | **159** | **Pass** |
