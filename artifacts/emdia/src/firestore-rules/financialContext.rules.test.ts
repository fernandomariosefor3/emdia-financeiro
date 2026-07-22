import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc } from "firebase/firestore";

function findRepoRoot(startDir: string): string {
  let dir = startDir;
  for (let i = 0; i < 10; i++) {
    if (fs.existsSync(path.join(dir, "firestore.rules"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`firestore.rules not found walking up from ${startDir}`);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = findRepoRoot(__dirname);
const RULES_PATH = path.join(REPO_ROOT, "firestore.rules");

const PROJECT_ID = "emdia-financial-context-rules-test";
const UID_A = "user-a";
const UID_B = "user-b";

function validDocument(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: "2026-07-20T12:00:00.000Z",
      updatedAt: "2026-07-20T12:00:00.000Z",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
      source: "prepare_month_prototype",
      dataQuality: "partial",
      completeness: {
        referenceBalance: true,
        minimumReserve: false,
        expectedIncome: false,
        recurringCommitments: false,
        protectedGoals: false,
      },
      revision: 1,
    },
    profile: {},
    calculationPreferences: {
      includeProbableIncome: false,
      includeUncertainIncome: false,
      minimumDataQuality: "insufficient",
      planningHorizonDays: 30,
      protectMinimumReserve: true,
      includePausedGoals: false,
    },
    referenceBalance: {
      amountInCents: 150000,
      referenceDate: "2026-07-20",
      source: "user_input",
      confidence: "confirmed",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
    },
    minimumReserve: { status: "missing" },
    expectedIncomes: [],
    recurringCommitments: [],
    protectedGoals: [],
    ...overrides,
  };
}

let testEnv: RulesTestEnvironment;

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync(RULES_PATH, "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

function contextRef(context: ReturnType<RulesTestEnvironment["authenticatedContext"]>, uid: string) {
  return doc(context.firestore(), "users", uid, "financialContext", "current");
}

async function seedAsOwner(uid: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "users", uid, "financialContext", "current"), data);
  });
}

test("1. usuário lê o próprio contexto", async () => {
  await seedAsOwner(UID_A, validDocument());
  const userA = testEnv.authenticatedContext(UID_A);
  await assertSucceeds(getDoc(contextRef(userA, UID_A)));
});

test("2. usuário salva o próprio contexto válido", async () => {
  const userA = testEnv.authenticatedContext(UID_A);
  await assertSucceeds(setDoc(contextRef(userA, UID_A), validDocument()));
});

test("3. usuário não lê contexto de outro usuário", async () => {
  await seedAsOwner(UID_A, validDocument());
  const userB = testEnv.authenticatedContext(UID_B);
  await assertFails(getDoc(contextRef(userB, UID_A)));
});

test("4. usuário não escreve no contexto de outro usuário", async () => {
  const userB = testEnv.authenticatedContext(UID_B);
  await assertFails(setDoc(contextRef(userB, UID_A), validDocument()));
});

test("5. usuário não autenticado é bloqueado", async () => {
  await seedAsOwner(UID_A, validDocument());
  const anon = testEnv.unauthenticatedContext();
  await assertFails(getDoc(contextRef(anon, UID_A)));
  await assertFails(setDoc(contextRef(anon, UID_A), validDocument()));
});

test("6. schemaVersion inválido é bloqueado", async () => {
  const userA = testEnv.authenticatedContext(UID_A);
  await assertFails(setDoc(contextRef(userA, UID_A), validDocument({ schemaVersion: 2 })));
});

test("7. valor monetário não inteiro é bloqueado", async () => {
  const userA = testEnv.authenticatedContext(UID_A);
  const invalid = validDocument({
    referenceBalance: {
      amountInCents: 100.5,
      referenceDate: "2026-07-20",
      source: "user_input",
      confidence: "confirmed",
      lastConfirmedAt: "2026-07-20T12:00:00.000Z",
    },
  });
  await assertFails(setDoc(contextRef(userA, UID_A), invalid));
});

test("8. array acima do limite é bloqueado", async () => {
  const userA = testEnv.authenticatedContext(UID_A);
  const tooManyIncomes = Array.from({ length: 51 }, (_, i) => ({
    id: `income-${i}`,
    description: "Renda",
    amountInCents: 1000,
    expectedDate: "2026-07-25",
    status: "active",
    confidence: "confirmed",
    source: "test",
    lastConfirmedAt: "2026-07-20T12:00:00.000Z",
  }));
  await assertFails(setDoc(contextRef(userA, UID_A), validDocument({ expectedIncomes: tooManyIncomes })));
});

test("9. documento válido pode ser atualizado", async () => {
  await seedAsOwner(UID_A, validDocument());
  const userA = testEnv.authenticatedContext(UID_A);
  const updated = validDocument({
    metadata: {
      ...validDocument().metadata,
      revision: 2,
      updatedAt: "2026-07-21T12:00:00.000Z",
      lastConfirmedAt: "2026-07-21T12:00:00.000Z",
    },
  });
  await assertSucceeds(setDoc(contextRef(userA, UID_A), updated));
});

test("10. revisão incorreta não sobrescreve silenciosamente", async () => {
  await seedAsOwner(UID_A, validDocument());
  const userA = testEnv.authenticatedContext(UID_A);
  // Same revision as what's already stored (should have been 2) — must be rejected.
  const staleWrite = validDocument({
    metadata: { ...validDocument().metadata, revision: 1 },
  });
  await assertFails(setDoc(contextRef(userA, UID_A), staleWrite));

  let persistedRevision: number | undefined;
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const snapshot = await getDoc(doc(context.firestore(), "users", UID_A, "financialContext", "current"));
    persistedRevision = snapshot.data()?.metadata.revision;
  });
  assert.strictEqual(persistedRevision, 1);
});
