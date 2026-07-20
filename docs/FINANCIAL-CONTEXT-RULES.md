# Regras de Negócio do Contexto Financeiro

1. **Saldo de Referência**: O saldo base para o Decision Engine vem de uma confirmação explícita. Não deve ser somado duas vezes ao histórico de transações. Ele substitui a soma de transações passadas.
2. **Data do Saldo**: Toda confirmação de saldo acompanha uma "Data Civil" (`YYYY-MM-DD`). Transações ocorridas *antes* desta data não impactam os cálculos futuros, pois o saldo já as engloba.
3. **Próxima Renda**: Calculada a partir de `expectedIncomes` ativas. Se informada como futura, não deve ser automaticamente considerada confirmada até que o usuário (ou conciliação bancária) valide.
4. **Renda Variável**: Representada via `confidence: "uncertain"`. O motor pode projetá-la no fluxo otimista, mas não deve garantir respiro baseado nela.
5. **Reserva Mínima**: Ausência do campo reserva não significa "reserva zero". Se não informada, o sistema exige configuração (pode ser inferido um valor sugerido, mas nunca travado). O valor zero só é aceito se `explicitZeroReserve = true`.
6. **Conta Recorrente (Compromissos)**: A entidade de recorrência gera *ocorrências projetadas* em tempo de execução no Decision Engine. Não gera duplicações permanentes e soltas no banco de dados, evitando perda de controle.
7. **Compromisso Essencial**: Define o impacto direto no fluxo de sobrevivência. Se falhar, o risco gerado é de "Severidade Crítica".
8. **Meta Protegida**: Um valor separado do respiro diário. Não entra no cálculo do Ritmo de Gastos Livres.
9. **Edição e Arquivamento**: Registros não são excluídos fisicamente para manter histórico de intenções passadas, mas sofrem soft-delete via `archivedAt` e `active = false`.
10. **Exclusão**: Se for imperativo excluir (ex: LGPD), será um hard delete controlado, mas a regra padrão é arquivamento.
11. **Confirmação e Dados Desatualizados**: Toda alteração relevante via UI atualiza `lastConfirmedAt`. O sistema pode alertar se o `lastConfirmedAt` tiver mais de 15 dias ("Seu saldo de R$10,00 foi confirmado há 20 dias, deseja atualizar?").
12. **Inferência vs Confirmação**: Nenhuma inferência sistêmica pode substituir uma confirmação explícita feita pelo usuário.
13. **Isolamento do Decision Engine**: O Decision Engine continua recebendo apenas `FinancialSnapshot` via props (TypeScript). Ele **não acessa o Firebase**. A camada de repositório no frontend é responsável por buscar o `FinancialProfile`, convertê-lo e injetá-lo no Engine.
14. **Compatibilidade com Transações**: O módulo de transações (`users/{uid}/transactions`) é lido apenas para as transações *após* a data do `referenceBalance`.
