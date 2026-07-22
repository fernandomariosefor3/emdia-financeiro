import test from "node:test";
import assert from "node:assert";
import { parseTransactionIntent } from "../parser";

test("parseTransactionIntent", async (t) => {
  await t.test("1. despesa simples com valor inteiro", () => {
    const result = parseTransactionIntent("Gastei 38 no mercado");
    assert.deepStrictEqual(result, { type: "expense", amountInCents: 3800, description: "mercado" });
  });

  await t.test("2. receita simples com valor de milhar sem separador", () => {
    const result = parseTransactionIntent("Recebi 1200 do trabalho");
    assert.strictEqual(result?.type, "income");
    assert.strictEqual(result?.amountInCents, 120000);
  });

  await t.test("3. valor com vírgula decimal", () => {
    const result = parseTransactionIntent("Paguei 38,50 de uber");
    assert.strictEqual(result?.amountInCents, 3850);
    assert.strictEqual(result?.type, "expense");
  });

  await t.test("4. valor com separador de milhar e centavos", () => {
    const result = parseTransactionIntent("Recebi 1.200,50 de freelance");
    assert.strictEqual(result?.amountInCents, 120050);
  });

  await t.test("5. valor com R$ na frente", () => {
    const result = parseTransactionIntent("Comprei R$ 50 de remédio");
    assert.strictEqual(result?.amountInCents, 5000);
    assert.ok(!result?.description.toLowerCase().includes("r$"));
  });

  await t.test("6. mensagem sem palavra-chave de tipo retorna null", () => {
    const result = parseTransactionIntent("38 mercado");
    assert.strictEqual(result, null);
  });

  await t.test("7. mensagem sem valor numérico retorna null", () => {
    const result = parseTransactionIntent("Gastei no mercado");
    assert.strictEqual(result, null);
  });

  await t.test("8. mensagem vazia retorna null", () => {
    assert.strictEqual(parseTransactionIntent(""), null);
    assert.strictEqual(parseTransactionIntent("   "), null);
  });

  await t.test("9. ganhei é reconhecido como receita", () => {
    const result = parseTransactionIntent("Ganhei 500 de bônus");
    assert.strictEqual(result?.type, "income");
  });

  await t.test("10. descrição vazia recebe um valor padrão", () => {
    const result = parseTransactionIntent("Gastei 38");
    assert.strictEqual(result?.description, "Lançamento via WhatsApp");
  });

  await t.test("11. maiúsculas e minúsculas são tratadas da mesma forma", () => {
    const lower = parseTransactionIntent("gastei 38 no mercado");
    const upper = parseTransactionIntent("GASTEI 38 NO MERCADO");
    assert.strictEqual(lower?.amountInCents, upper?.amountInCents);
    assert.strictEqual(lower?.type, upper?.type);
  });

  await t.test("12. valor com centavos e formato ponto decimal", () => {
    const result = parseTransactionIntent("Paguei 38.50 de gasolina");
    assert.strictEqual(result?.amountInCents, 3850);
  });
});
