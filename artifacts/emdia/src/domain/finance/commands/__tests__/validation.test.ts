import test from "node:test";
import assert from "node:assert";
import {
  validateFinancialCommand,
  canApplyCommand,
  isDuplicateCommand,
  confirmCommand,
  rejectCommand,
} from "../validation";
import { FinancialCommand } from "../types";

function baseCommand(overrides: Partial<FinancialCommand> = {}): FinancialCommand {
  return {
    commandId: "cmd-1",
    userId: "user-1",
    source: "web",
    type: "record_expense",
    amountInCents: 3800,
    description: "Mercado",
    categorySuggestion: "alimentação",
    occurredOn: "2026-07-22",
    confidence: "confirmed",
    confirmationStatus: "pending",
    createdAt: "2026-07-22T12:00:00.000Z",
    ...overrides,
  };
}

test("Comandos financeiros — despesa e receita", async (t) => {
  await t.test("1. comando de despesa pendente é válido", () => {
    const res = validateFinancialCommand(baseCommand({ type: "record_expense" }));
    assert.strictEqual(res.success, true);
  });

  await t.test("2. comando de receita pendente é válido", () => {
    const res = validateFinancialCommand(
      baseCommand({ type: "record_income", description: "Salário", amountInCents: 350000 })
    );
    assert.strictEqual(res.success, true);
  });

  await t.test("3. tipos ask_financial_status, simulate_purchase e create_commitment são aceitos", () => {
    for (const type of ["ask_financial_status", "simulate_purchase", "create_commitment"] as const) {
      const res = validateFinancialCommand(baseCommand({ type, amountInCents: null, occurredOn: null }));
      assert.strictEqual(res.success, true, `type ${type} deveria ser válido`);
    }
  });

  await t.test("4. tipo desconhecido é rejeitado", () => {
    const res = validateFinancialCommand(baseCommand({ type: "delete_everything" as never }));
    assert.strictEqual(res.success, false);
  });
});

test("Comandos financeiros — status pendente e confirmado", async (t) => {
  await t.test("5. comando pendente com valor e data ausentes é válido", () => {
    const res = validateFinancialCommand(
      baseCommand({ confirmationStatus: "pending", amountInCents: null, occurredOn: null })
    );
    assert.strictEqual(res.success, true);
  });

  await t.test("6. comando confirmado com valor e data presentes é válido", () => {
    const res = validateFinancialCommand(baseCommand({ confirmationStatus: "confirmed" }));
    assert.strictEqual(res.success, true);
  });

  await t.test("7. valor ambíguo (null) bloqueia confirmação", () => {
    const res = validateFinancialCommand(
      baseCommand({ confirmationStatus: "confirmed", amountInCents: null })
    );
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "AMBIGUOUS_COMMAND_CANNOT_BE_CONFIRMED");
  });

  await t.test("8. data ambígua (null) bloqueia confirmação", () => {
    const res = validateFinancialCommand(
      baseCommand({ confirmationStatus: "confirmed", occurredOn: null })
    );
    assert.strictEqual(res.success, false);
    if (!res.success) assert.strictEqual(res.errors[0].code, "AMBIGUOUS_COMMAND_CANNOT_BE_CONFIRMED");
  });

  await t.test("9. valor fora do formato inteiro é bloqueado", () => {
    const res = validateFinancialCommand(baseCommand({ amountInCents: 38.5 as unknown as number }));
    assert.strictEqual(res.success, false);
  });
});

test("Comandos financeiros — canApplyCommand", async (t) => {
  await t.test("10. comando confirmado e não ambíguo pode ser aplicado", () => {
    assert.strictEqual(canApplyCommand(baseCommand({ confirmationStatus: "confirmed" })), true);
  });

  await t.test("11. comando pendente nunca pode ser aplicado", () => {
    assert.strictEqual(canApplyCommand(baseCommand({ confirmationStatus: "pending" })), false);
  });

  await t.test("12. comando de origem whatsapp segue exatamente a mesma regra — sem atalho de gravação direta", () => {
    const pendingFromWhatsapp = baseCommand({ source: "whatsapp", confirmationStatus: "pending" });
    assert.strictEqual(canApplyCommand(pendingFromWhatsapp), false);

    const confirmedFromWhatsapp = baseCommand({ source: "whatsapp", confirmationStatus: "confirmed" });
    assert.strictEqual(canApplyCommand(confirmedFromWhatsapp), true);
  });

  await t.test("13. ask_financial_status nunca é 'aplicável' (não é um lançamento)", () => {
    const command = baseCommand({
      type: "ask_financial_status",
      confirmationStatus: "confirmed",
      amountInCents: null,
      occurredOn: null,
    });
    assert.strictEqual(canApplyCommand(command), false);
  });
});

test("Comandos financeiros — idempotência e correção", async (t) => {
  await t.test("14. commandId repetido é identificado como duplicado", () => {
    const existing = [baseCommand({ commandId: "abc" })];
    const candidate = baseCommand({ commandId: "abc", description: "Outra descrição" });
    assert.strictEqual(isDuplicateCommand(existing, candidate), true);
  });

  await t.test("15. commandId novo não é duplicado", () => {
    const existing = [baseCommand({ commandId: "abc" })];
    const candidate = baseCommand({ commandId: "xyz" });
    assert.strictEqual(isDuplicateCommand(existing, candidate), false);
  });

  await t.test("16. confirmCommand aplica correções do usuário antes de confirmar", () => {
    const pending = baseCommand({ confirmationStatus: "pending", amountInCents: null, occurredOn: null });
    const res = confirmCommand(pending, { amountInCents: 4200, occurredOn: "2026-07-22" });
    assert.strictEqual(res.success, true);
    if (res.success) {
      assert.strictEqual(res.data.confirmationStatus, "confirmed");
      assert.strictEqual(res.data.amountInCents, 4200);
    }
  });

  await t.test("17. confirmCommand ainda bloqueia quando a ambiguidade não foi corrigida", () => {
    const pending = baseCommand({ confirmationStatus: "pending", amountInCents: null });
    const res = confirmCommand(pending);
    assert.strictEqual(res.success, false);
  });

  await t.test("18. confirmCommand não muta o comando original", () => {
    const pending = baseCommand({ confirmationStatus: "pending" });
    const snapshot = JSON.stringify(pending);
    confirmCommand(pending);
    assert.strictEqual(JSON.stringify(pending), snapshot);
  });

  await t.test("19. rejectCommand retorna novo objeto com status rejected, sem mutar o original", () => {
    const pending = baseCommand({ confirmationStatus: "pending" });
    const rejected = rejectCommand(pending);
    assert.strictEqual(rejected.confirmationStatus, "rejected");
    assert.strictEqual(pending.confirmationStatus, "pending");
    assert.notStrictEqual(rejected, pending);
  });
});
