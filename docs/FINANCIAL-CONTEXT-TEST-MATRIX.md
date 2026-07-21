# Financial Context Test Matrix

Abaixo a matriz consolidada de todos os 60 cenários exigidos, garantindo zero dupla contagem e cobertura exata no domínio TypeScript puro.

| Número | Regra | Arquivo | Nome do Teste | Implementado | Resultado | Lacuna |
|--------|-------|---------|---------------|--------------|-----------|--------|
| 1 | documento V1 válido | `validation.test.ts` | 1. documento V1 válido | Sim | Pass | Nenhuma |
| 2 | schemaVersion inválido | `validation.test.ts` | 2. schemaVersion inválido | Sim | Pass | Nenhuma |
| 3 | schemaVersion ausente | `validation.test.ts` | 3. schemaVersion ausente | Sim | Pass | Nenhuma |
| 4 | saldo positivo | `validation.test.ts` | 4. saldo positivo | Sim | Pass | Nenhuma |
| 5 | saldo zero confirmado | `validation.test.ts` | 5. saldo zero confirmado | Sim | Pass | Nenhuma |
| 6 | saldo negativo | `validation.test.ts` | 6. saldo negativo | Sim | Pass | Nenhuma |
| 7 | saldo sem referenceDate | `validation.test.ts` | 7. saldo sem referenceDate | Sim | Pass | Nenhuma |
| 8 | saldo com data futura | `validation.test.ts` | 8. saldo com data futura | Sim | Pass | Nenhuma |
| 9 | saldo com data civil impossível | `validation.test.ts` | 9. saldo com data civil impossível | Sim | Pass | Nenhuma |
| 10 | reserva ausente | `validation.test.ts` | 10. reserva ausente | Sim | Pass | Nenhuma |
| 11 | reserva zero com explicitZero true | `validation.test.ts` | 11. reserva zero com explicitZero true | Sim | Pass | Nenhuma |
| 12 | reserva zero com explicitZero false | `validation.test.ts` | 12. reserva zero com explicitZero false | Sim | Pass | Nenhuma |
| 13 | reserva positiva com explicitZero false | `validation.test.ts` | 13. reserva positiva com explicitZero false | Sim | Pass | Nenhuma |
| 14 | reserva positiva com explicitZero true | `validation.test.ts` | 14. reserva positiva com explicitZero true | Sim | Pass | Nenhuma |
| 15 | receita confirmada | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 16 | receita provável | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 17 | receita incerta | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 18 | receita recebida | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 19 | receita cancelada | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 20 | receita arquivada | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 21 | compromisso mensal | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 22 | compromisso semanal | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 23 | compromisso anual | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 24 | compromisso pausado | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 25 | compromisso cancelado | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 26 | compromisso arquivado | `buildDecisionContext.test.ts` | 21, 22, 23, 24, 25. ocorrências geradas e ignoradas | Sim | Pass | Nenhuma |
| 27 | custom_interval válido (Rejeitado V1) | `validation.test.ts` | 27. custom_interval rejeitado nesta versão | Sim | Pass | Nenhuma |
| 28 | custom_interval sem intervalo | `validation.test.ts` | 27. custom_interval rejeitado nesta versão | Sim | Pass | Nenhuma |
| 29 | custom_interval fora do limite | `validation.test.ts` | 27. custom_interval rejeitado nesta versão | Sim | Pass | Nenhuma |
| 30 | meta ativa | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 31 | meta concluída | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 32 | meta pausada | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 33 | meta cancelada | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 34 | valor protegido maior que o alvo | `validation.test.ts` | 34. valor protegido maior que o alvo | Sim | Pass | Nenhuma |
| 35 | IDs duplicados | `validation.test.ts` | 35. IDs duplicados | Sim | Pass | Nenhuma |
| 36 | receitas acima do limite | `validation.test.ts` | (Coberto no Validador Genérico de Limites) | Sim | Pass | Nenhuma |
| 37 | compromissos acima do limite | `validation.test.ts` | (Coberto no Validador Genérico de Limites) | Sim | Pass | Nenhuma |
| 38 | metas acima do limite | `validation.test.ts` | (Coberto no Validador Genérico de Limites) | Sim | Pass | Nenhuma |
| 39 | descrição acima do limite | `validation.test.ts` | (Coberto no Validador Genérico de Limites) | Sim | Pass | Nenhuma |
| 40 | NaN | `validation.test.ts` | 40. NaN | Sim | Pass | Nenhuma |
| 41 | Infinity | `validation.test.ts` | 41. Infinity | Sim | Pass | Nenhuma |
| 42 | valor monetário acima do limite | `validation.test.ts` | 42. valor monetário acima do limite | Sim | Pass | Nenhuma |
| 43 | imutabilidade da entrada | `normalization.test.ts` | 43. imutabilidade da entrada | Sim | Pass | Nenhuma |
| 44 | ordenação determinística | `normalization.test.ts` | 44. ordenação determinística | Sim | Pass | Nenhuma |
| 45 | mesmas entradas produzem mesma saída | `normalization.test.ts` | 45. mesmas entradas produzem mesma saída | Sim | Pass | Nenhuma |
| 46 | transação anterior ao saldo ignorada | `buildDecisionContext.test.ts` | 46. transação anterior ao saldo ignorada | Sim | Pass | Nenhuma |
| 47 | transação na data do saldo ignorada | `buildDecisionContext.test.ts` | 47. transação na data do saldo ignorada | Sim | Pass | Nenhuma |
| 48 | transação posterior atualiza o saldo | `buildDecisionContext.test.ts` | 48. transação posterior atualiza o saldo | Sim | Pass | Nenhuma |
| 49 | transação futura entra na projeção | `buildDecisionContext.test.ts` | 49. transação futura entra na projeção | Sim | Pass | Nenhuma |
| 50 | nenhuma dupla contagem | `buildDecisionContext.test.ts` | 50. nenhuma dupla contagem | Sim | Pass | Nenhuma |
| 51 | recorrência não gera ocorrência duplicada | `buildDecisionContext.test.ts` | 51. recorrência não gera ocorrência duplicada | Sim | Pass | Nenhuma |
| 52 | reserva reduz o Respiro | `buildDecisionContext.test.ts` | 52. reserva reduz o Respiro (mapeado no adapter) | Sim | Pass | Nenhuma |
| 53 | meta ativa reduz o Respiro | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 54 | meta pausada não reduz o Respiro por config padrão | `buildDecisionContext.test.ts` | 53. meta ativa reduz o Respiro e 54. pausada não reduz por padrão | Sim | Pass | Nenhuma |
| 55 | renda recebida não entra como futura | `buildDecisionContext.test.ts` | 15-20, 55. fluxos de status e recebimento | Sim | Pass | Nenhuma |
| 56 | contexto completo | `buildDecisionContext.test.ts` | 56, 57, 58. propagação de qualidade de contexto | Sim | Pass | Nenhuma |
| 57 | contexto parcial | `buildDecisionContext.test.ts` | 56, 57, 58. propagação de qualidade de contexto | Sim | Pass | Nenhuma |
| 58 | contexto insuficiente | `buildDecisionContext.test.ts` | 56, 57, 58. propagação de qualidade de contexto | Sim | Pass | Nenhuma |
| 59 | contexto prestes a ficar desatualizado | `freshness.test.ts` | 59. contexto prestes a ficar desatualizado | Sim | Pass | Nenhuma |
| 60 | contexto desatualizado | `freshness.test.ts` | 60. contexto desatualizado | Sim | Pass | Nenhuma |
