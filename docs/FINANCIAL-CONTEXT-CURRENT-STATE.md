# Estado Atual do Contexto Financeiro

## Coleções e Caminhos Atualmente Utilizados
- `users/{uid}`: Documento principal do usuário.
- `users/{uid}/transactions`: Subcoleção contendo as transações individuais (receitas e despesas).

## Tipos e Modelos Atuais
Atualmente o aplicativo possui duas representações distintas, gerando um desalinhamento:
1. **Frontend Clássico (`artifacts/emdia/src/lib/types.ts`)**:
   - `TransactionType`: `"income" | "expense"`
   - `Transaction`:
     - `amount`: `number` (em Reais, sujeito a falhas de precisão flutuante).
     - `date`: `string` (ISO date string, ex: `2026-07-20T16:43:00.000Z`).
     - `category`, `description`: `string`.

2. **Decision Engine V1 (`artifacts/emdia/src/domain/finance/types.ts`)**:
   - Usa `MoneyInCents` (inteiro) para evitar erros de ponto flutuante.
   - `FinancialTransaction`:
     - `amountInCents`: `MoneyInCents`.
     - `date`: `string` (formato civil `YYYY-MM-DD`).
     - `confirmed`: `boolean`.
   - `FinancialCommitment`: compromissos com status (`pending`, `paid`), essenciais, parcelas (`installment`) e recorrência.
   - `ExpectedIncome`: rendas com níveis de confiança (`confirmed`, `probable`, `uncertain`).

## O que existe e o que não existe
- **Existe:**
  - Histórico de transações simples.
  - Tela Hoje recebendo mocks/dados locais no formato do Decision Engine (`amountInCents`, `YYYY-MM-DD`).
- **Não Existe / Dados Ausentes:**
  - **Saldo Inicial**: Não há uma confirmação formal do saldo de referência salvo em banco, forçando o dashboard a recalcular tudo ou o frontend a inferir.
  - **Reserva Mínima**: Ausente do modelo salvo (atualmente mockado ou fixo).
  - **Contas Recorrentes e Metas**: Ausentes da base de dados Firebase (apenas mapeadas em interface ou mocks do Decision Engine).

## Como os Cálculos Ocorrem Hoje
- **Dashboard Atual**: Calcula o saldo baseando-se no somatório de todas as `transactions` (receitas - despesas). Isso pode ser muito custoso e sujeito a erros se o histórico for longo ou houver dados não sincronizados.
- **Tela Hoje / Decision Engine**: Constrói o `FinancialSnapshot` localmente (em memória) passando as transações mapeadas para propriedades como `currentBalanceInCents`, `commitments`, `expectedIncomes`, e projeta o "Respiro" e "Ritmo Diário" de forma puramente computacional. Não escreve nem lê essas inferências formalizadas do Firestore. O Decision Engine recebe os dados de forma injetada (props).

## Problemas e Incompatibilidades
- **Riscos de Dupla Contagem**: O modelo atual não diferencia claramente o "saldo de referência confirmado hoje" de transações passadas.
- **Limitações do Respiro Estimado**: Como o respiro é gerado no client-side via inferência de mocks, ele se perde se o cache limpar ou se acessado de outro dispositivo.
- **Incompatibilidades com o Modelo Futuro**: O modelo futuro precisará migrar de `amount` em Reais e `Date` ISO para `amountInCents` e `YYYY-MM-DD` civis, além de introduzir a gravação do contexto confirmado pelo usuário (snapshot formal).
