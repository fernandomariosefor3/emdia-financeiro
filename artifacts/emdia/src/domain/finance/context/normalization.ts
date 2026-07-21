import { FinancialContextDocumentV1 } from "./types";

export function normalizeFinancialContextDocument(doc: FinancialContextDocumentV1): FinancialContextDocumentV1 {
  const normalizedIncomes = [...doc.expectedIncomes]
    .map(i => ({
      ...i,
      description: i.description.trim(),
    }))
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate) || a.id.localeCompare(b.id));

  const normalizedCommitments = [...doc.recurringCommitments]
    .map(c => ({
      ...c,
      name: c.name.trim(),
    }))
    .sort((a, b) => a.nextDueDate.localeCompare(b.nextDueDate) || a.id.localeCompare(b.id));

  const normalizedGoals = [...doc.protectedGoals]
    .map(g => ({
      ...g,
      name: g.name.trim(),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return {
    ...doc,
    expectedIncomes: normalizedIncomes,
    recurringCommitments: normalizedCommitments,
    protectedGoals: normalizedGoals,
  };
}

export function removeArchivedItems(doc: FinancialContextDocumentV1): FinancialContextDocumentV1 {
  return {
    ...doc,
    expectedIncomes: doc.expectedIncomes.filter(i => i.status !== "archived"),
    recurringCommitments: doc.recurringCommitments.filter(c => c.status !== "archived"),
    protectedGoals: doc.protectedGoals.filter(g => g.status !== "archived"),
  };
}
