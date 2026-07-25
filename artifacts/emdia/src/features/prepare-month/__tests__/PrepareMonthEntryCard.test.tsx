import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { PrepareMonthEntryCard } from "../PrepareMonthEntryCard";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(() => ({ user: { uid: "user-123" } })),
}));

vi.mock("../data/usePrepareMonthPersistence", () => ({
  usePrepareMonthPersistence: vi.fn(() => ({ loadStatus: "loaded", savedDocument: null })),
}));

describe("PrepareMonthEntryCard (entrada no dashboard)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("1. exibe título, descrição e botão claros", () => {
    render(
      <Router>
        <PrepareMonthEntryCard />
      </Router>
    );
    expect(screen.getByText(/Prepare seu mês/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Organize seu saldo, receitas e compromissos para saber quanto pode gastar com segurança\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Planejar/i })).toBeInTheDocument();
  });

  it("2. leva para a rota oficial /prepare-seu-mes ao clicar", () => {
    const { hook, history } = memoryLocation({ path: "/dashboard", record: true });
    render(
      <Router hook={hook}>
        <PrepareMonthEntryCard />
      </Router>
    );

    fireEvent.click(screen.getByRole("button", { name: /Planejar/i }));

    expect(history[history.length - 1]).toBe("/prepare-seu-mes");
  });
});
