# Prepare Your Month — Protótipo Local (Fase 5A)

## Objetivo

Oferecer uma experiência guiada, em etapas, para o usuário simular como seu mês pode se
comportar financeiramente — sem gravar nada em nenhum lugar. O protótipo reutiliza
integralmente os contratos e o Decision Engine já existentes no domínio `finance/context` e
`finance`; a interface apenas coleta e confirma dados, o domínio financeiro valida, e o
Decision Engine calcula.

Local: `artifacts/emdia/src/features/prepare-month/`
Rota: `/prepare-month-preview` (protegida por autenticação e por feature flag)

## Campos coletados

| Etapa | Campos |
|-------|--------|
| Seu ponto de partida | saldo atual (R$), data desse saldo |
| Reserva mínima | escolha entre "ainda não defini" / "quero proteger um valor" / "confirmei que não quero reservar" |
| O que pode entrar | até 3 rendas: descrição, valor, data prevista, confiança |
| O que precisa sair | até 5 compromissos: nome, valor, próxima data, recorrência, essencial/ajustável |
| O que você quer proteger | até 3 metas: nome, valor total, valor já protegido, data opcional |
| Veja como seu mês pode ficar | prévia calculada — sem campos, apenas leitura |

## Mapeamento para o domínio

Toda a tradução de texto de formulário para o contrato `FinancialContextDocumentV1` acontece
em `buildContextFromForm.ts`, uma camada de mapeamento pura:

- Valores em reais (texto) são convertidos para centavos via `realsToCents` (`domain/finance/money.ts`) — nunca reimplementados.
- Datas seguem o formato `CivilDate` (`YYYY-MM-DD`) já usado pelo domínio.
- A escolha de reserva mapeia para `MinimumReserveSetting`:
  - "ainda não defini" → `{ status: "missing" }`
  - "quero proteger um valor" → `{ status: "configured", amountInCents, explicitZero: false }`
  - "confirmei que não quero reservar" → `{ status: "configured", amountInCents: 0, explicitZero: true }`
- Confiança da renda mapeia para `confidence`: "tenho certeza" → `confirmed`, "provavelmente entra" → `probable`, "ainda é incerta" → `uncertain`.
- Recorrência do compromisso mapeia 1:1 para `monthly` / `weekly` / `yearly`. `custom_interval` nunca é oferecido na interface, pois é rejeitado pela validação da V1.

A validação de regras de negócio (data futura, `explicitZero` consistente, meta protegida não
pode superar o alvo, limites máximos) **não é duplicada na interface** — é feita
exclusivamente por `validateFinancialContextDocument`. A interface só faz checagens de
formato/presença (campo obrigatório, número válido) para dar feedback imediato.

## Ausência versus zero

Um campo vazio nunca é silenciosamente tratado como zero. A reserva mínima só assume
`amountInCents: 0` quando o usuário escolhe explicitamente a opção "confirmei que não quero
reservar nenhum valor agora" (`explicitZero: true`). Escolher "ainda não defini" produz
`{ status: "missing" }`, não um valor numérico.

## Natureza estimada dos resultados

O Respiro (dinheiro livre estimado) e o Ritmo seguro diário exibidos na prévia são
explicitamente rotulados como estimativas, nunca como garantias. O cenário oficial usa apenas
receitas com confiança "tenho certeza" — receitas prováveis e incertas ficam registradas como
hipótese, sem entrar no cálculo principal.

## Feature flag

`VITE_ENABLE_PREPARE_MONTH` — parser estrito (`isPrepareMonthEnabled`, em
`pages/prepare-month-preview.tsx`): somente a string `"true"` ativa a experiência. Ausente,
vazio ou qualquer outro valor mantém a rota desativada, redirecionando para `/dashboard`.
Produção permanece desativada por padrão.

## Ausência de persistência

Não há `localStorage`, `IndexedDB`, cookies, chamadas de rede ou escrita no Firebase em
nenhum arquivo desta pasta. Todo o estado vive em `useState` do React; recarregar a página ou
remontar o componente limpa tudo. O botão "Reiniciar simulação" também limpa o estado
imediatamente.

## Limitações conhecidas

- Limite de 3 rendas, 5 compromissos e 3 metas nesta primeira versão do protótipo (limites do
  domínio são maiores: 50/100/20).
- Não há edição de `calculationPreferences` pela interface — renda provável/incerta e metas
  pausadas seguem sempre os padrões conservadores (não incluídas).
- Não há suporte a `custom_interval` (também rejeitado pelo domínio na V1).
- Sem histórico entre sessões — cada visita começa do zero.

## Caminho futuro para escrita controlada

Quando a Fase 5A evoluir para persistência real, a etapa de mapeamento já está isolada em
`buildContextFromForm.ts`, pronta para alimentar uma futura escrita controlada (com revisão de
segurança, regras do Firestore e trilha de auditoria) sem exigir mudanças no domínio financeiro
ou no Decision Engine.
