import { test } from "node:test";
import assert from "node:assert/strict";
import { FOUNDER_ANNUAL_PRICE } from "../config";

test("FOUNDER_ANNUAL_PRICE — configuração congelada do Plano Fundador", async (t) => {
  await t.test("1. valor unitário é 999 (R$ 9,99 em centavos)", () => {
    assert.equal(FOUNDER_ANNUAL_PRICE.unitAmount, 999);
  });

  await t.test("2. moeda é brl", () => {
    assert.equal(FOUNDER_ANNUAL_PRICE.currency, "brl");
  });

  await t.test("3. intervalo é anual", () => {
    assert.equal(FOUNDER_ANNUAL_PRICE.interval, "year");
  });

  await t.test("4. lookup_key segue a convenção versionada", () => {
    assert.equal(FOUNDER_ANNUAL_PRICE.lookupKey, "emdia_founder_annual_brl_999_v1");
  });
});
