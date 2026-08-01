import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Router } from "wouter";
import { TodayDashboardPrototype } from "../TodayDashboardPrototype";
import type { FinancialContextResult } from "../data/types";

const mockUseToday = vi.fn();
vi.mock("../data/useTodayFinancialData", () => ({
  useTodayFinancialData: () => mockUseToday(),
}));

function result(overrides: Partial<FinancialContextResult> = {}): FinancialContextResult {
  return {
    context: {
      currentBalanceInCents: 100000,
      commitments: [],
      expectedIncomes: [],
      protectedAmountInCents: 0,
      minimumReserveInCents: 0,
    },
    quality: "partial",
    diagnostics: {
      validDocumentCount: 0,
      invalidDocumentCount: 0,
      ignoredDocumentCount: 0,
      warnings: [],
      assumptions: [],
    },
    availability: { minimumReserve: "missing", protectedGoals: "missing" },
    ...overrides,
  };
}

function renderDashboard() {
  return render(
    <Router>
      <TodayDashboardPrototype />
    </Router>
  );
}

describe("TodayDashboardPrototype — Prepare Month nudge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra o CTA 'Preparar meu mês' quando falta o contexto confirmado", () => {
    mockUseToday.mockReturnValue({
      loading: false,
      error: null,
      source: "firebase",
      data: result({
        diagnostics: {
          validDocumentCount: 0,
          invalidDocumentCount: 0,
          ignoredDocumentCount: 0,
          warnings: [],
          assumptions: ["Prepare seu mês para dados mais precisos (saldo de referência, reserva e metas)."],
        },
      }),
    });

    renderDashboard();

    const cta = screen.getByRole("link", { name: /Preparar meu mês/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("href", "/prepare-seu-mes");
  });

  it("não mostra o CTA quando o contexto confirmado está carregado", () => {
    mockUseToday.mockReturnValue({
      loading: false,
      error: null,
      source: "firebase",
      data: result({
        quality: "complete",
        diagnostics: {
          validDocumentCount: 0,
          invalidDocumentCount: 0,
          ignoredDocumentCount: 0,
          warnings: [],
          assumptions: ["Contexto financeiro confirmado carregado."],
        },
      }),
    });

    renderDashboard();

    expect(screen.queryByRole("link", { name: /Preparar meu mês/i })).not.toBeInTheDocument();
  });
});
