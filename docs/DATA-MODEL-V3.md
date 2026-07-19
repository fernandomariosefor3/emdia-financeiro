# Modelo de Dados (V3)

Este documento descreve os tipos principais que moldam o Domínio Financeiro do Emdia V3. O modelo é projetado para cálculos puros, isolado de bancos de dados.

## Tipos Básicos
- `MoneyInCents`: Representa um valor financeiro estritamente em centavos. (`number` inteiro).
- `IncomeConfidence`: Confiança da receita esperada (`"confirmed" | "probable" | "uncertain"`).
- `CommitmentStatus`: Estado do compromisso (`"pending" | "paid" | "overdue" | "cancelled"`).
- `RiskSeverity`: Gravidade do risco detectado (`"low" | "medium" | "high" | "critical"`).

## Entidades Principais

### FinancialTransaction
Representa uma transação passada ou concluída.
- `id` (string)
- `type` ("income" | "expense")
- `amountInCents` (MoneyInCents)
- `date` (string YYYY-MM-DD)
- `category` (string)
- `description` (string)
- `confirmed` (boolean)

### FinancialCommitment
Representa uma obrigação financeira (conta a pagar).
- `id` (string)
- `name` (string)
- `amountInCents` (MoneyInCents)
- `dueDate` (string YYYY-MM-DD)
- `status` (CommitmentStatus)
- `essential` (boolean)
- `priority` (number)
- `installment` ({ current: number, total: number } | undefined)
- `recurrence` (string | undefined)

### ExpectedIncome
Representa uma previsão de entrada de dinheiro.
- `id` (string)
- `description` (string)
- `amountInCents` (MoneyInCents)
- `expectedDate` (string YYYY-MM-DD)
- `confidence` (IncomeConfidence)
- `status` ("pending" | "received")

## Resultados Calculados (Outputs)

### FinancialSnapshot
O estado estático do usuário para uma data específica.
- `referenceDate` (string YYYY-MM-DD)
- `currentBalanceInCents` (MoneyInCents)
- `committedAmountInCents` (MoneyInCents)
- `protectedAmountInCents` (MoneyInCents)
- `breathingRoomInCents` (MoneyInCents)
- `safeDailyPaceInCents` (MoneyInCents)
- `nextIncomeDate` (string YYYY-MM-DD | null)
- `projectedBalanceInCents` (MoneyInCents)
- `calculatedAt` (string ISO timestamp)
- `explanations` (array de strings detalhando o cálculo)

### FinancialRisk
Identificação de um problema futuro na saúde financeira.
- `id` (string)
- `commitmentId` (string | null)
- `date` (string YYYY-MM-DD)
- `shortfallInCents` (MoneyInCents)
- `severity` (RiskSeverity)
- `reason` (string)
- `suggestedAdjustmentInCents` (MoneyInCents | null)

### RecommendedAction
Recomendação matemática sugerida pelo motor.
- `type` (string)
- `title` (string)
- `description` (string)
- `priority` (number)
- `amountInCents` (MoneyInCents | null)
- `deadline` (string YYYY-MM-DD | null)
- `reasonCodes` (array de strings)
- `explanation` (string)

### FinancialScenario
Compara o impacto de uma ação simulada (como uma compra) com o estado atual.
- `previousSnapshot` (FinancialSnapshot)
- `simulatedSnapshot` (FinancialSnapshot)
- `breathingRoomDifferenceInCents` (number - positivo ou negativo)
- `dailyPaceDifferenceInCents` (number - positivo ou negativo)
- `newRisks` (array de FinancialRisk gerados pela simulação)
- `affectedCommitments` (array de IDs)
- `explanations` (array de strings)

### PurchaseProposal
Utilizada como entrada na simulação (`simulatePurchase`).
- `totalAmountInCents` (MoneyInCents)
- `paymentMethod` ("cash" | "installments")
- `installments` (number)
- `firstDueDate` (string YYYY-MM-DD)
- `description` (string)
- `category` (string)
