# Glossário do Domínio Financeiro

Este documento padroniza a linguagem ubíqua usada no código e na interface do Emdia Financeiro.

### Saldo atual
Valor financeiro informado ou calculado para a data de referência (Geralmente, o dia atual ou o momento do cálculo). É o dinheiro real na conta naquele instante.

### Dinheiro comprometido
Valores reservados para compromissos que ainda deverão ser pagos. É o dinheiro que você tem, mas já tem "dono".

### Respiro
Valor realmente livre após compromissos, proteções (como metas e reservas mínimas). É o saldo atual menos o dinheiro comprometido e as reservas. O que sobrar é o Respiro.

### Ritmo
Valor médio diário disponível até a próxima renda ou até o fim do horizonte analisado. É o Respiro dividido pelo número de dias restantes no período.

### Risco
Situação futura em que um compromisso poderá não possuir cobertura financeira suficiente. Indica contas a pagar para as quais não haverá saldo, caso o comportamento se mantenha.

### Ação
Recomendação determinística que reduz o risco mais relevante. Uma Ação sempre mira um Risco ou o esgotamento do Respiro.

### Cenário
Comparação entre a situação atual e uma decisão financeira simulada (ex: uma compra ou mudança de renda). Permite visualizar o impacto de uma ação antes de confirmá-la.

### Confiança da receita
Probabilidade operacional de uma receita prevista ocorrer. É representada por estados explícitos em vez de porcentagens estatísticas:
- **confirmed:** Receita que já ocorreu ou cuja probabilidade é praticamente certa (ex: Salário fixo na data de pagamento).
- **probable:** Receita esperada, mas que pode sofrer atraso ou pequena variação (ex: Pagamento de cliente recorrente, frila quase entregue).
- **uncertain:** Receita desejada ou hipotética, que não deve ser usada para o cálculo primário de Respiro/Ritmo (ex: Bônus dependente de meta da empresa).
