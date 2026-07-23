# Plano Fundador Emdia — R$ 9,99/ano

Documenta o que está implementado nesta fase (plano, página `/planos` e a
fundação de cobrança) e o que falta para ativar cobrança de verdade.
Enquanto `VITE_ENABLE_BILLING` não for `"true"` em produção, nada abaixo
processa pagamento real — a página apenas exibe o plano.

## Configuração central

Uma única fonte de verdade em cada lado (frontend e Functions, que são
implantados/tipados de forma independente — ver
[`EMDIA-WHATSAPP-MVP.md`](./EMDIA-WHATSAPP-MVP.md) para o motivo):

| Campo | Valor | Frontend | Backend |
|---|---|---|---|
| id | `founder-annual` | `artifacts/emdia/src/lib/founderPlan.ts` | — |
| nome | Plano Fundador Emdia | `FOUNDER_ANNUAL_PLAN.name` | — |
| preço | 999 centavos | `FOUNDER_ANNUAL_PLAN.priceCents` | `functions/src/billing/config.ts` `unitAmount` |
| moeda | BRL / brl | `FOUNDER_ANNUAL_PLAN.currency` | `FOUNDER_ANNUAL_PRICE.currency` |
| intervalo | anual | `FOUNDER_ANNUAL_PLAN.interval` | `FOUNDER_ANNUAL_PRICE.interval` |
| recorrente | true | `FOUNDER_ANNUAL_PLAN.recurring` | (implícito no `mode: "subscription"`) |
| versão do preço | 1 | `FOUNDER_ANNUAL_PLAN.priceVersion` | embutida no `lookup_key` |
| lookup_key no Stripe | `emdia_founder_annual_brl_999_v1` | — | `FOUNDER_ANNUAL_PRICE.lookupKey` |

## Página `/planos`

Rota pública (`artifacts/emdia/src/pages/planos.tsx` →
`features/founder-plan/FounderPlanPage.tsx`), acessível sem login. Mostra:

- nome, preço (`R$ 9,99 por ano`, `Menos de R$ 1 por mês.`) e a lista de
  recursos do plano;
- aviso "Emdia no Zap — em preparação";
- o texto obrigatório: *"Assinatura anual com renovação automática. Você
  poderá cancelar antes da próxima renovação."*;
- um botão cujo comportamento depende de `VITE_ENABLE_BILLING`.

### Com `VITE_ENABLE_BILLING=false` (estado atual em produção)

- o botão mostra "Assinaturas em breve" e fica desabilitado;
- nenhuma chamada de Checkout é feita;
- o acesso atual dos usuários não muda;
- nenhum paywall é criado — a página é somente informativa.

### Com `VITE_ENABLE_BILLING=true` (estado futuro)

- usuário não autenticado que clica é enviado para `/login?redirect=/planos`;
- usuário autenticado que clica chama a callable
  `createAnnualCheckoutSession` e é redirecionado para o Checkout hospedado
  pelo Stripe.

## Fundação de cobrança (Functions)

Implementada em `functions/src/billing/`, seguindo o mesmo padrão do módulo
WhatsApp: lógica core testável (`routeStripeEvent`) separada do transporte
HTTPS/`onCall`.

| Function | Tipo | Autenticação | Status nesta fase |
|---|---|---|---|
| `createAnnualCheckoutSession` | `onCall` | obrigatória | implementada, nunca chamada (frontend só chama com a flag ligada) |
| `createBillingPortalSession` | `onCall` | obrigatória | implementada, nunca chamada |
| `stripeBillingWebhook` | `onRequest` | validado por assinatura Stripe | implementada, sem endpoint cadastrado no Stripe ainda |

Nenhuma delas foi implantada nesta sessão, e `STRIPE_SECRET_KEY` /
`STRIPE_WEBHOOK_SECRET` não existem no Secret Manager ainda — as três
functions falhariam ao subir sem esses secrets, o que é esperado.

### Idempotência e controle de status

- Cada evento do Stripe é processado no máximo uma vez, via um guarda
  atômico *create-if-absent* em `stripeProcessedEvents/{eventId}` (mesmo
  padrão de `whatsappProcessedMessages` usado no webhook do WhatsApp).
- O status da assinatura é escrito exclusivamente pelo backend (Admin SDK)
  em `users/{uid}/billing/current`. As regras do Firestore
  (`firestore.rules`) negam qualquer escrita do cliente nessa subcoleção —
  o cliente só pode ler o próprio status.
- `checkout.session.completed` grava `stripeCustomers/{customerId} → { uid }`
  para permitir que eventos futuros de assinatura (`customer.subscription.*`)
  encontrem o `uid` a partir do `customerId` do Stripe, sem precisar de uma
  collection group query.

## Configuração futura do Price no Stripe

```
unit_amount: 999
currency: brl
recurring.interval: year
lookup_key: emdia_founder_annual_brl_999_v1
```

Criada de forma idempotente por
[`scripts/setup-stripe-founder-plan.mjs`](../scripts/setup-stripe-founder-plan.mjs)
— **não executado nesta sessão**. O script:

- lê `STRIPE_SECRET_KEY` apenas de variável de ambiente, nunca por argumento;
- nunca imprime o valor da chave;
- não grava nada em arquivo;
- confirma explicitamente ("SIM") antes de criar Product/Price;
- não cria um segundo Price se um com o mesmo `lookup_key` já existir.

## Checklist de ativação (futuro)

- [ ] Rodar `scripts/setup-stripe-founder-plan.mjs` com uma
      `STRIPE_SECRET_KEY` real para criar o Product/Price no Stripe.
- [ ] Cadastrar o endpoint do webhook (`stripeBillingWebhook`) no Dashboard
      do Stripe e copiar o signing secret gerado.
- [ ] Configurar os secrets das Functions:
      - `firebase functions:secrets:set STRIPE_SECRET_KEY`
      - `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`
- [ ] Implantar somente as três Functions de billing:
      `firebase deploy --only functions:createAnnualCheckoutSession,functions:createBillingPortalSession,functions:stripeBillingWebhook`.
- [ ] Testar um Checkout de ponta a ponta em modo teste do Stripe.
- [ ] Só então definir `VITE_ENABLE_BILLING: "true"` no step de build do
      workflow de deploy (`.github/workflows/deploy.yml`) e publicar uma
      nova versão do app.

## Proibições respeitadas nesta sessão

- Nenhuma chave real do Stripe foi configurada.
- Nenhuma chamada foi feita à API do Stripe.
- Nenhum produto ou preço real foi criado.
- Nenhuma Function de cobrança foi implantada.
