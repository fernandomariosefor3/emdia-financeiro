import test from "node:test";
import assert from "node:assert";
import { suggestCategory, DEFAULT_EXPENSE_CATEGORY, DEFAULT_INCOME_CATEGORY } from "../categories";

test("suggestCategory", async (t) => {
  await t.test("1. mercado sugere Alimentação", () => {
    assert.strictEqual(suggestCategory("expense", "mercado"), "Alimentação");
  });

  await t.test("2. uber sugere Transporte", () => {
    assert.strictEqual(suggestCategory("expense", "uber para o trabalho"), "Transporte");
  });

  await t.test("3. aluguel sugere Moradia", () => {
    assert.strictEqual(suggestCategory("expense", "aluguel de julho"), "Moradia");
  });

  await t.test("4. farmácia sugere Saúde", () => {
    assert.strictEqual(suggestCategory("expense", "farmácia"), "Saúde");
  });

  await t.test("5. despesa sem palavra-chave usa categoria padrão", () => {
    assert.strictEqual(suggestCategory("expense", "algo qualquer"), DEFAULT_EXPENSE_CATEGORY);
  });

  await t.test("6. salário sugere categoria Salário para receita", () => {
    assert.strictEqual(suggestCategory("income", "salário de julho"), "Salário");
  });

  await t.test("7. freelance sugere categoria Freelance para receita", () => {
    assert.strictEqual(suggestCategory("income", "freelance de design"), "Freelance");
  });

  await t.test("8. receita sem palavra-chave usa categoria padrão", () => {
    assert.strictEqual(suggestCategory("income", "algo qualquer"), DEFAULT_INCOME_CATEGORY);
  });

  await t.test("9. correspondência não diferencia maiúsculas/minúsculas", () => {
    assert.strictEqual(suggestCategory("expense", "MERCADO"), "Alimentação");
  });
});
