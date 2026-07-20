# Especificação do Motor de Decisão (Decision Engine Spec)

## Objetivo
O Motor Financeiro é o coração determinístico do Emdia Financeiro. Sua responsabilidade é calcular, com precisão absoluta, o estado financeiro real do usuário, identificando quanto dinheiro está livre (Respiro), qual o limite de gasto diário (Ritmo) e quais os perigos futuros (Risco), recomendando a melhor Ação de forma puramente matemática.

## Entradas e Saídas
- **Entradas:** 
  - Saldo atual em centavos.
  - Arrays de transações realizadas, compromissos futuros e receitas previstas.
  - Data de referência (nunca a data implícita do sistema).
  - Parâmetros de proteção (reserva mínima, metas).
- **Saídas:**
  - `FinancialSnapshot`: Um retrato imutável contendo o Respiro, o Ritmo, o balanço projetado e a data da próxima renda.
  - Array de `FinancialRisk`: Riscos iminentes detectados.
  - `RecommendedAction`: Ação sugerida baseada na severidade dos riscos e no saldo.

## Tratamento de Datas
As datas devem ser manipuladas como strings civis ISO `YYYY-MM-DD` ou utilizando uma biblioteca de datas com UTC explícito. A data de referência é injetada nas funções, garantindo que os cálculos sejam puros e testáveis (o mesmo estado na mesma data deve gerar o mesmo resultado).

## Tratamento de Dinheiro
Todos os cálculos e armazenamento de valores monetários devem ser feitos utilizando números inteiros que representam **centavos** (`MoneyInCents = number`). Apenas as camadas de UI serão responsáveis por formatar esses valores em Reais (R$).

## Critérios de Risco
Um compromisso se torna um risco quando:
1. Sua data de vencimento é anterior à data de referência (Vencido).
2. O saldo projetado na data do compromisso for menor que o valor necessário, indicando insuficiência de fundos (Sem Cobertura).
3. A distância de segurança até o saldo ficar negativo for muito curta.

## Regras de Arredondamento
As divisões que resultam em dízimas (como o cálculo do Ritmo diário) devem ser sempre arredondadas **para baixo** (usando `Math.floor()`) a fim de ser conservador e evitar sugerir que o usuário pode gastar mais do que realmente pode.

## Limitações
1. O Motor não interage com APIs externas ou Open Finance; ele assume que o Snapshot fornecido pela camada superior é a verdade absoluta.
2. Não executa cálculos estocásticos ou probabilísticos inventados (a IA cuida de inferências em linguagem natural, o Motor apenas roda regras fixas).

## Relação Futura com Firestore e Lia
- **Firestore:** Armazenará os eventos brutos. As Cloud Functions lerão esses eventos e chamarão as funções do Motor Financeiro de forma pura.
- **Lia (IA):** A Lia receberá o JSON do `FinancialSnapshot`, `FinancialRisk` e `RecommendedAction`. O papel da Lia será traduzir esse estado matemático em uma explicação humana, amigável e conversacional para o usuário (ex: "Seu ritmo hoje caiu para R$30 porque a conta de luz vence amanhã e você não tem fundos separados").
