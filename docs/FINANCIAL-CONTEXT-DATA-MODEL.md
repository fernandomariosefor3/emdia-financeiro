# Modelo de Dados do Contexto Financeiro

## Arquiteturas Avaliadas

### 1. Várias Subcoleções
Estrutura:
- `users/{uid}/financialProfile/current`
- `users/{uid}/recurringCommitments/{commitmentId}`
- `users/{uid}/expectedIncomes/{incomeId}`
- `users/{uid}/protectedGoals/{goalId}`

**Vantagens**: Escalabilidade infinita. Ideal se as coleções tiverem centenas de milhares de documentos. Permite consultas complexas granulares.
**Desvantagens**: Para o Contexto Financeiro de pessoa física (que foca no mês atual), as listas são curtas. Fazer 4 ou mais queries para montar a "Tela Hoje" consome mais leituras do Firestore, aumenta a latência de rede e complica o caching local.

### 2. Documento Único (Recomendada)
Estrutura:
- `users/{uid}/financialContext/current`

Contém o saldo, configurações e arrays de compromissos e rendas ativas.

**Vantagens**:
- 1 única leitura de banco para renderizar a dashboard inteira.
- Simplicidade extrema para o Frontend e Decision Engine.
- Custo minimizado (1 read operation).
- Atualizações atômicas garantidas via uma única escrita.
**Desvantagens**: Limite de 1MB por documento. No entanto, o "Contexto Financeiro" (compras parceladas ativas, rendas do mês) raramente excede poucos KBs. O histórico longo (extrato) continuará na subcoleção `/transactions`.

### 3. Modelo Híbrido
- Contexto central no documento do usuário e histórico em subcoleção.

---

## Arquitetura Recomendada: Modelo Híbrido com Documento Único de Contexto

**Por quê?** O Contexto Financeiro é o "estado atual" (Snapshot). O histórico é infinito.
Portanto, as transações (passado) ficam em `users/{uid}/transactions`.
O Contexto (presente/futuro) fica em `users/{uid}/financialContext/current`.

Isso mantém as regras de segurança simples (ownership pelo UID), minimiza custos e facilita a compatibilidade com o Decision Engine, que espera um snapshot consolidado.

## Contratos TypeScript (Conceituais)

```typescript
type MoneyInCents = number;
type CivilDate = string; // YYYY-MM-DD

interface FinancialContextMetadata {
  version: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastConfirmedAt: string; // ISO
  dataQuality: "inferred" | "confirmed" | "imported";
  ownerUid: string;
}

interface ReferenceBalance {
  amountInCents: MoneyInCents;
  date: CivilDate;
  explicitZero: boolean; // Diferencia "não informado" de "saldo zero"
  source: "user_input" | "inferred_from_transactions" | "open_finance";
}

interface ExpectedIncome {
  id: string;
  description: string;
  amountInCents: MoneyInCents;
  expectedDate: CivilDate;
  confidence: "confirmed" | "probable" | "uncertain";
  active: boolean;
  archivedAt?: string;
}

interface RecurringCommitment {
  id: string;
  description: string;
  amountInCents: MoneyInCents; // Se variável, é uma estimativa
  dueDate: CivilDate; // Próximo vencimento base
  isEssential: boolean;
  recurrence: "monthly" | "weekly";
  active: boolean;
  archivedAt?: string;
}

interface ProtectedGoal {
  id: string;
  description: string;
  targetAmountInCents: MoneyInCents;
  accumulatedAmountInCents: MoneyInCents;
  deadline?: CivilDate;
  active: boolean;
}

interface CalculationPreferences {
  minimumReserveInCents: MoneyInCents;
  explicitZeroReserve: boolean;
}

export interface FinancialProfile {
  metadata: FinancialContextMetadata;
  referenceBalance: ReferenceBalance | null;
  preferences: CalculationPreferences;
  expectedIncomes: ExpectedIncome[];
  recurringCommitments: RecurringCommitment[];
  protectedGoals: ProtectedGoal[];
}
```

### Diferenciação de Dados
- **Dado ausente**: campo é `null` (ex: `referenceBalance: null`).
- **Valor zero confirmado**: `amountInCents: 0` E `explicitZero: true`.
- **Valor estimado/informado**: Indicado por `source` ou `confidence`.
- **Desatualizado**: `lastConfirmedAt` muito antigo em relação à data atual.
