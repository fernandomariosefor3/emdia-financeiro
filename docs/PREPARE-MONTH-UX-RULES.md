# Prepare Your Month — Regras de UX (Fase 5A)

## Linguagem simples

Termos técnicos do domínio nunca aparecem na interface. Equivalentes amigáveis usados:

| Termo técnico | Equivalente na interface |
|----------------|---------------------------|
| snapshot / referenceBalance | saldo de hoje |
| expectedIncomes | renda esperada |
| recurringCommitments | contas e compromissos |
| minimumReserve | reserva mínima |
| protectedGoals | metas protegidas |
| breathingRoomInCents | dinheiro livre estimado (Respiro) |
| schema / commitment / idempotency / data quality | não exibidos ao usuário |

## Estados da interface implementados

- Formulário vazio (estado inicial de cada etapa)
- Validação de campo (formato/presença, feedback imediato via `FieldFeedback`)
- Erro impeditivo (bloqueia avançar — ex.: data futura, meta protegida maior que o alvo)
- Contexto parcial (prévia calculada, mas com hipóteses assumidas — ex.: reserva não definida)
- Contexto insuficiente (dados não puderam ser validados pelo domínio)
- Prévia válida (Respiro, Ritmo, risco e ação recomendada exibidos)
- Botão voltar / continuar
- Reiniciar simulação (limpa tudo imediatamente)

## Estados explicitamente NÃO implementados

Por ser um protótipo local, os seguintes estados não existem nesta fase e não devem ser
adicionados sem uma decisão explícita de produto:

- Botão "salvar no Firebase" ou "confirmar e gravar"
- `localStorage`, `IndexedDB` ou cookies
- Qualquer chamada de rede ou analytics

## Acessibilidade

- Todo campo tem `<Label htmlFor>` associado ao `id` do input.
- Navegação por teclado nativa (nenhum componente captura foco incorretamente).
- Ao mudar de etapa, o foco move para o título (`<h2 tabIndex={-1}>`) da nova etapa.
- Mensagens de erro usam `aria-describedby` ligando o campo à mensagem, e `role="alert"`/`aria-live="polite"` via `FieldFeedback`.
- O resultado da prévia usa `role="status"` com `aria-live="polite"` para leitores de tela.
- Nenhuma informação depende só de cor — estados de etapa concluída/atual na barra de
  progresso usam ícone e texto (`sr-only`), não apenas cor.
- Botões têm nomes claros (`Adicionar renda`, `Remover compromisso 2`, `Reiniciar simulação`).
- Valores monetários são sempre formatados via `formatMoney` (padrão `Intl.NumberFormat pt-BR`).

## Responsividade

Testado visualmente em 360px, 768px e 1280px. O layout do wizard é de coluna única
(`max-w-2xl mx-auto`), o que naturalmente se adapta a telas estreitas sem grade
multi-coluna quebrando. Nenhuma alteração foi feita em landing page, login, cadastro,
dashboard, transações ou Today V3 — o protótipo vive inteiramente em sua própria rota e pasta
de feature.
