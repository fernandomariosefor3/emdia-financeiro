import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { WhatsAppLinkPage } from "../WhatsAppLinkPage";
import { useAuth } from "@/lib/auth-context";
import * as whatsappLinkClient from "../whatsappLinkClient";
import type { User } from "firebase/auth";

vi.mock("@/lib/auth-context", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../whatsappLinkClient", () => ({
  createWhatsAppLinkCode: vi.fn(),
  getWhatsAppConnectionStatus: vi.fn(),
  disconnectWhatsApp: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedCreateCode = vi.mocked(whatsappLinkClient.createWhatsAppLinkCode);
const mockedGetStatus = vi.mocked(whatsappLinkClient.getWhatsAppConnectionStatus);
const mockedDisconnect = vi.mocked(whatsappLinkClient.disconnectWhatsApp);

function authenticated() {
  return {
    user: { uid: "test-user" } as User,
    loading: false,
    isAdmin: false,
    signUp: vi.fn(async () => undefined),
    signIn: vi.fn(async () => undefined),
    signInWithGoogle: vi.fn(async () => undefined),
    logOut: vi.fn(async () => undefined),
  };
}

function unauthenticated() {
  return { ...authenticated(), user: null };
}

describe("WhatsAppLinkPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. usuário não autenticado nunca consulta o status de conexão", async () => {
    mockedUseAuth.mockReturnValue(unauthenticated());
    render(<WhatsAppLinkPage />);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockedGetStatus).not.toHaveBeenCalled();
  });

  it("2. estado inicial mostra carregando enquanto o status não resolveu", () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WhatsAppLinkPage />);
    expect(screen.getByText(/Carregando status da conexão/i)).toBeInTheDocument();
  });

  it("3. status não conectado convida a gerar um código", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValue({ connected: false, maskedPhone: null, connectedAt: null });
    render(<WhatsAppLinkPage />);

    expect(await screen.findByText(/Conecte seu WhatsApp para começar/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Gerar código/i })).toBeInTheDocument();
  });

  it("4. gerar código mostra o código e o aviso de expiração de 10 minutos", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValue({ connected: false, maskedPhone: null, connectedAt: null });
    mockedCreateCode.mockResolvedValue({ code: "123456", expiresInSeconds: 600 });
    render(<WhatsAppLinkPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Gerar código/i }));

    expect(await screen.findByText(/VINCULAR 123456/i)).toBeInTheDocument();
    expect(screen.getByText(/expira em 10 minutos e só pode ser usado uma vez/i)).toBeInTheDocument();
  });

  it("5. erro ao gerar código mostra mensagem genérica com opção de tentar novamente", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValue({ connected: false, maskedPhone: null, connectedAt: null });
    mockedCreateCode.mockRejectedValueOnce(new Error("internal: secret missing"));
    render(<WhatsAppLinkPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Gerar código/i }));

    const errorMessage = await screen.findByRole("alert");
    expect(errorMessage.textContent).not.toMatch(/secret/i);
    expect(errorMessage.textContent).toMatch(/Não foi possível/i);

    mockedCreateCode.mockResolvedValueOnce({ code: "654321", expiresInSeconds: 600 });
    fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));
    expect(await screen.findByText(/VINCULAR 654321/i)).toBeInTheDocument();
  });

  it("6. status conectado mostra apenas o telefone mascarado", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValue({ connected: true, maskedPhone: "****1234", connectedAt: "2026-07-22T10:00:00.000Z" });
    render(<WhatsAppLinkPage />);

    const status = await screen.findByText(/WhatsApp conectado com final/i);
    expect(status.textContent).toContain("****1234");
    expect(status.textContent).not.toMatch(/\d{5,}/); // no run of 5+ raw digits anywhere
    expect(screen.getByRole("button", { name: /Desconectar WhatsApp/i })).toBeInTheDocument();
  });

  it("7. desconectar chama disconnectWhatsApp sem nenhum parâmetro e volta para não conectado", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValueOnce({ connected: true, maskedPhone: "****1234", connectedAt: "2026-07-22T10:00:00.000Z" });
    mockedDisconnect.mockResolvedValue({ disconnected: true });
    render(<WhatsAppLinkPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Desconectar WhatsApp/i }));

    await waitFor(() => expect(screen.getByText(/Conecte seu WhatsApp para começar/i)).toBeInTheDocument());
    expect(mockedDisconnect).toHaveBeenCalledTimes(1);
    expect(mockedDisconnect).toHaveBeenCalledWith();
  });

  it("8. desconectando mostra estado de progresso", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockResolvedValueOnce({ connected: true, maskedPhone: "****1234", connectedAt: "2026-07-22T10:00:00.000Z" });
    mockedDisconnect.mockReturnValue(new Promise(() => {})); // never resolves
    render(<WhatsAppLinkPage />);

    fireEvent.click(await screen.findByRole("button", { name: /Desconectar WhatsApp/i }));
    expect(await screen.findByText(/Desconectando/i)).toBeInTheDocument();
  });

  it("9. erro ao consultar status também usa a mensagem genérica, sem detalhes internos", async () => {
    mockedUseAuth.mockReturnValue(authenticated());
    mockedGetStatus.mockRejectedValueOnce(new Error("PERMISSION_DENIED: internal detail"));
    render(<WhatsAppLinkPage />);

    const errorMessage = await screen.findByRole("alert");
    expect(errorMessage.textContent).not.toMatch(/PERMISSION_DENIED/i);
  });
});
