# Prepare Your Month — Matriz de Testes (Fase 5A)

Matriz dos 30 cenários exigidos, cobertos por 31 testes em `test:prepare-month` (script
independente de `test:ui` e `test:today-data`).

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
retornando `null` (não zero) para entrada vazia e para entrada não numérica — total de 31 testes.

## Totais por suíte (workspace `artifacts/emdia`)

| Suíte | Testes | Resultado |
|-------|--------|-----------|
| `test:finance` | 25 | Pass |
| `test:ui` | 9 | Pass |
| `test:today-data` | 25 | Pass |
| `test:financial-context` | 54 | Pass |
| `test:prepare-month` | 31 | Pass |
| **Total único** | **144** | **Pass** |
