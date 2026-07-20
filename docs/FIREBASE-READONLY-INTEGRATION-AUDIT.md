# Firebase Read-only Integration Audit

## Coleções Encontradas

### 1. `users`
- **Caminho:** `users/{uid}`
- **Descrição:** Contém o perfil e os limites da assinatura do usuário.
- **Campos:**
  - `plan` (string, opcional, padrão: "free") - ex: "free", "pro", "enterprise"
  - `transactionsThisMonth` (number, opcional, padrão: 0)
- **Riscos / Divergências:** Não contém informações de metas financeiras (`protectedAmounts`) ou receitas futuras, não contém reserva mínima configurada. O Decision Engine exigirá fallback/default.

### 2. `transactions`
- **Caminho:** `users/{uid}/transactions`
- **Descrição:** Contém o histórico de receitas e despesas registradas pelo usuário.
- **Campos Encontrados:**
  - `type` (string) - "income" ou "expense" (Obrigatório)
  - `amount` (number) - Em reais. Precisa ser convertido para centavos. (Obrigatório)
  - `category` (string) - Nome da categoria. (Obrigatório)
  - `description` (string) - Descrição da transação. (Obrigatório)
  - `date` (string) - Formato ISO de data. O dashboard usa `date` como string. (Obrigatório)
  - `createdAt` (string) - Timestamp ISO da criação. (Obrigatório)
- **Tipos no Código Fonte:** Mapeado no tipo `Transaction`.
- **Divergências / Dados Ausentes:**
  - O banco de dados NÃO distingue entre contas pagas e a pagar. Parece que todas as despesas inseridas são "passadas" ou "realizadas" baseado na data. O Decision Engine suporta `pending` e `paid` (baseado se a data é futura ou passada).
  - Valores estão muito possivelmente em *reais*, mas nosso domínio exige *centavos* (inteiro).
  - O banco de dados **não** possui coleção de "Receitas Futuras" ( Expected Income ), ou "Compromissos Recorrentes". 
- **Riscos:**
  - `amount` pode vir como float e ter problema de precisão (IEEE 754) ao multiplicar por 100.
  - Como não há `isPaid` explícito, transações com datas futuras podem ser a única heurística.
  - A falta de Receitas Previstas pode fazer com que o motor mostre sempre "Sem próxima renda" se não houver um workaround provisório ou limitação informada ao usuário.
  
## Autenticação
- Utiliza Firebase Auth (`getAuth()`).
- O UID é recuperado do `user.uid` fornecido por `onAuthStateChanged()`.
- O hook atual de transações usa o `user.uid` com segurança para apontar para `users/{uid}/transactions`.
- Nenhum acesso a dados de terceiros é possível, pois a subcoleção é estritamente vinculada ao `user.uid`.

## Regras Atuais do Firestore e Assinaturas
- O acesso a transações é feito por `onSnapshot` com ordenação `orderBy("date", "desc")`.
- Tratamento de loading/erro e re-fetch quando o `user.uid` muda já está estabelecido no `use-transactions.ts`.

## Proposta de Adaptação ao Decision Engine (Read-only)
- **FinancialContext Mapping:**
  - `currentBalance`: Será obtido calculando a soma de receitas menos a soma de despesas passadas (data <= `referenceDate`).
  - `confirmedTransactions`: Transações cuja `date` é <= `referenceDate` e `type === "expense"`.
  - `financialCommitments`: Transações cuja `date` é > `referenceDate` e `type === "expense"`.
  - `expectedIncomes`: Transações futuras cuja `date` > `referenceDate` e `type === "income"`. (Assumindo que usuários lancem receitas futuras, caso contrário ficará vazio).
  - `protectedAmounts` e `minimumReserve`: Como não há coleção, passaremos array vazio e zero para não travar a engine.
- As conversões de "Reais para Centavos" usarão `Math.round(amount * 100)`.
- Ignorar docs sem `amount` numérico ou `date` parseável para não retornar NaN.
