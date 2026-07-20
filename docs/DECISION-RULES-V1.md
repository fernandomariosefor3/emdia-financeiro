# Regras de Decisão do Motor (V1)

Este documento centraliza as regras lógicas determinísticas que ditam como o Motor Financeiro chega a suas conclusões (Respiro, Ritmo e Risco).

## Regra 1: Horizonte de Análise
As funções baseiam-se em um "horizonte" explícito. Tudo além do horizonte é ignorado para o cálculo imediato, exceto quando solicitado especificamente por uma simulação estendida.

## Regra 2: Respiro (Breathing Room)
O **Respiro** representa o capital verdadeiramente livre.
Cálculo:
1. Começa com o **Saldo Atual**.
2. SOMA-SE todas as receitas previstas no horizonte com confiança `confirmed`.
3. SUBTRAI-SE todos os compromissos `pending` no horizonte.
4. SUBTRAI-SE as metas protegidas (`protectedAmount`).
5. SUBTRAI-SE a reserva mínima definida pelo usuário (se aplicável).
Receitas com confiança `probable` ou `uncertain` **não compõem** o Respiro Base, mas podem ser incluídas em simulações otimistas (Respiro Otimista).

## Regra 3: Ritmo Diário Seguro (Safe Daily Pace)
O **Ritmo** representa quanto o usuário pode gastar hoje e a cada dia até a próxima receita, sem se endividar.
Cálculo:
1. Encontre a próxima receita `confirmed` no calendário.
2. Calcule os dias de distância (D) entre a `referenceDate` e a próxima receita.
   - O dia da referência conta (inclusivo).
   - Se D for 0 (a renda cai no mesmo dia), o cálculo do Ritmo diário divide por 1 para evitar divisão por zero.
3. Se não houver receita confirmada, divide-se pelo total de dias até o fim do mês (horizonte padrão).
4. `Ritmo = floor(Respiro / max(D, 1))`

## Regra 4: Deteção de Risco (Risco Futuro e Fluxo de Caixa)
O Motor projeta o saldo de cada dia:
1. Saldo no Início do Dia = Saldo Final do Dia Anterior.
2. Processa as Receitas (soma).
3. Processa as Despesas (subtrai).
4. Se o Saldo Final for menor que 0:
   - Um **Risco** é acionado (`severity = critical` se afetar uma despesa `essential`).
5. Se uma Despesa tiver vencimento `dueDate` < `referenceDate` e seu `status` for `pending`:
   - Um **Risco** de atraso é acionado imediatamente.

## Regra 5: Recomendações Priorizadas
A `buildRecommendedAction` analisa o Snapshot e a lista de Riscos e retorna APENAS UMA ação prioritária, na seguinte ordem de precedência:
1. **Cobrir compromisso essencial:** Se há Risco Crítico de conta essencial, sugere guardar ou cortar X valor imediatamente.
2. **Saldo negativo imediato:** Se o saldo vai ficar negativo em < 3 dias, alerta máxima redução do Ritmo.
3. **Reduzir Ritmo:** Se o Ritmo está abaixo do histórico ideal do usuário, sugere reduzir consumo não-essencial.
4. **Alocação Inteligente:** Se o Respiro for vastamente superior à reserva de emergência, sugere proteção extra de metas (investir).
5. **Manter o Curso:** Se não há riscos e o Ritmo está bom, ação é informativa (positivo).
