#!/usr/bin/env node
/**
 * Cria (de forma idempotente) o Product e o Price do Plano Fundador Emdia
 * na conta Stripe conectada. NÃO deve ser executado até que a decisão de
 * ativar cobrança tenha sido tomada e uma STRIPE_SECRET_KEY real esteja
 * disponível.
 *
 * - Não aceita a chave por argumento — apenas via variável de ambiente
 *   STRIPE_SECRET_KEY. Ex.:
 *     STRIPE_SECRET_KEY=sk_live_... node scripts/setup-stripe-founder-plan.mjs
 * - Nunca imprime o valor da chave nem qualquer outro segredo.
 * - Não grava nada em arquivo.
 * - Não faz parte de nenhum pipeline de build/deploy — é 100% manual.
 * - Idempotente: se um Price com o lookup_key já existir, não cria outro.
 * - Usa apenas fetch nativo (Node 18+) contra a API REST do Stripe — sem
 *   dependência adicional.
 *
 * Consulte docs/FOUNDER-ANNUAL-PLAN.md para o restante do checklist de
 * ativação (STRIPE_WEBHOOK_SECRET, endpoint do webhook, VITE_ENABLE_BILLING).
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const FOUNDER_PLAN = {
  productName: "Plano Fundador Emdia",
  unitAmount: 999,
  currency: "brl",
  interval: "year",
  lookupKey: "emdia_founder_annual_brl_999_v1",
};

const STRIPE_API_BASE = "https://api.stripe.com/v1";

function getSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error(
      "STRIPE_SECRET_KEY não está definida no ambiente. Este script nunca aceita a chave por argumento.\n" +
        "Exporte a variável no seu shell antes de rodar e nunca a compartilhe ou salve em arquivo."
    );
    process.exit(1);
  }
  return key;
}

async function stripeRequest(secretKey, method, path, body) {
  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body).toString() : undefined,
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message ?? `Stripe respondeu ${response.status}`;
    throw new Error(message);
  }
  return data;
}

async function findExistingPrice(secretKey) {
  const query = new URLSearchParams();
  query.append("lookup_keys[]", FOUNDER_PLAN.lookupKey);
  query.append("limit", "1");
  const data = await stripeRequest(secretKey, "GET", `/prices?${query.toString()}`);
  return data.data?.[0] ?? null;
}

async function createProduct(secretKey) {
  return stripeRequest(secretKey, "POST", "/products", {
    name: FOUNDER_PLAN.productName,
  });
}

async function createPrice(secretKey, productId) {
  return stripeRequest(secretKey, "POST", "/prices", {
    product: productId,
    unit_amount: String(FOUNDER_PLAN.unitAmount),
    currency: FOUNDER_PLAN.currency,
    "recurring[interval]": FOUNDER_PLAN.interval,
    lookup_key: FOUNDER_PLAN.lookupKey,
  });
}

async function confirm(question) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(`${question} (digite SIM para continuar) `);
    return answer.trim() === "SIM";
  } finally {
    rl.close();
  }
}

async function main() {
  console.log("=== Emdia — setup do Plano Fundador no Stripe ===");
  console.log(`Produto: ${FOUNDER_PLAN.productName}`);
  console.log(`Preço: ${FOUNDER_PLAN.unitAmount} centavos (${FOUNDER_PLAN.currency}), recorrência ${FOUNDER_PLAN.interval}`);
  console.log(`lookup_key: ${FOUNDER_PLAN.lookupKey}`);
  console.log("");
  console.log("Este script NUNCA imprime sua STRIPE_SECRET_KEY e não a recebe por argumento.");
  console.log("");

  const secretKey = getSecretKey();

  const existing = await findExistingPrice(secretKey);
  if (existing) {
    console.log(`Já existe um Price com este lookup_key (id: ${existing.id}). Nada a fazer — script é idempotente.`);
    return;
  }

  console.log("Nenhum Price com este lookup_key foi encontrado na conta Stripe conectada.");
  const proceed = await confirm("Criar o Product e o Price agora, nesta conta Stripe?");
  if (!proceed) {
    console.log("Cancelado. Nada foi criado.");
    return;
  }

  const product = await createProduct(secretKey);
  console.log(`Product criado: ${product.id}`);

  const price = await createPrice(secretKey, product.id);
  console.log(`Price criado: ${price.id}`);
  console.log("");
  console.log("Próximos passos manuais (fora deste script):");
  console.log("  1. Cadastrar o endpoint do webhook (stripeBillingWebhook) no Dashboard do Stripe.");
  console.log("  2. Copiar o signing secret gerado e configurar STRIPE_WEBHOOK_SECRET via");
  console.log("     `firebase functions:secrets:set STRIPE_WEBHOOK_SECRET`.");
  console.log("  3. Configurar STRIPE_SECRET_KEY como secret da function com");
  console.log("     `firebase functions:secrets:set STRIPE_SECRET_KEY`.");
  console.log("  4. Implantar somente as Functions de billing e, só então, considerar");
  console.log("     VITE_ENABLE_BILLING=true. Veja docs/FOUNDER-ANNUAL-PLAN.md.");
}

main().catch((error) => {
  console.error(`Falha: ${error.message}`);
  process.exit(1);
});
