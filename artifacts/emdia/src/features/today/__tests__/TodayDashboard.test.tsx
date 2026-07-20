import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TodayDashboardPrototype } from '../TodayDashboardPrototype';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TodayPreview from '../../../pages/today-preview';
import { Router } from 'wouter';

describe('TodayDashboardPrototype (Decision Engine Integration)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1 e 2 e 3. Exibe valor numérico do Respiro, Ritmo calculados e Cenário Base sem risco', () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<TodayDashboardPrototype />);
    
    expect(screen.getByText(/2\.413,00/i)).toBeInTheDocument();
    expect(screen.getByText(/77,83|por dia/i)).toBeInTheDocument();
    expect(screen.getByText(/Cenário tranquilo/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('17. Abertura e fechamento da explicação e ausência de chamadas externas', () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<TodayDashboardPrototype />);
    
    const explainBtn = screen.getByText(/Entender cálculo/i);
    fireEvent.click(explainBtn);
    expect(screen.getByText(/Como chegamos a este resultado\?/i)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
    
    const closeBtn = screen.getByRole('button', { name: /Fechar|Close/i });
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/Como chegamos a este resultado\?/i)).not.toBeInTheDocument();
    }
  });

  it('4 e 5. Simulação de compra à vista (cria risco) e deduz do Respiro', () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<TodayDashboardPrototype />);
    
    const amountInput = screen.getByLabelText(/Valor total/i);
    fireEvent.change(amountInput, { target: { value: '3000' } });
    
    const simBtn = screen.getByText(/Simular impacto/i);
    fireEvent.click(simBtn);
    
    expect(screen.getByText(/Impacto Projetado/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Pode faltar saldo para compromissos essenciais/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/587,00/i)).toBeInTheDocument();
    
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('6. Simulação de compra parcelada alterando corretamente o cenário', () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<TodayDashboardPrototype />);
    
    const amountInput = screen.getByLabelText(/Valor total/i);
    fireEvent.change(amountInput, { target: { value: '300' } });
    
    const installmentsInput = screen.getByLabelText(/Parcelas/i);
    fireEvent.change(installmentsInput, { target: { value: '3' } });
    
    const simBtn = screen.getByText(/Simular impacto/i);
    fireEvent.click(simBtn);
    
    expect(screen.getByText(/Impacto Projetado/i)).toBeInTheDocument();
    expect(screen.getByText(/2\.313,00/i)).toBeInTheDocument();
    
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('16. Limpeza da simulação', () => {
    render(<TodayDashboardPrototype />);
    
    const amountInput = screen.getByLabelText(/Valor total/i);
    fireEvent.change(amountInput, { target: { value: '500' } });
    
    const simBtn = screen.getByText(/Simular impacto/i);
    fireEvent.click(simBtn);
    
    expect(screen.getByText(/Impacto Projetado/i)).toBeInTheDocument();
    
    // Limpar
    const clearBtn = screen.getByText(/^Limpar$/i);
    fireEvent.click(clearBtn);
    
    expect(screen.queryByText(/Impacto Projetado/i)).not.toBeInTheDocument();
    expect((amountInput as HTMLInputElement).value).toBe('');
  });
});

describe('TodayPreview (Feature Flag - 7 ao 10)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = () => render(
    <Router>
      <TodayPreview />
    </Router>
  );

  it('7. feature flag ausente redireciona', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', '');
    renderWithRouter();
    expect(screen.queryByText(/Boa tarde/i)).not.toBeInTheDocument();
  });

  it('8. feature flag "false" redireciona', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', 'false');
    renderWithRouter();
    expect(screen.queryByText(/Boa tarde/i)).not.toBeInTheDocument();
  });

  it('9. feature flag com valor diferente de "true" redireciona', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', 'enabled');
    renderWithRouter();
    expect(screen.queryByText(/Boa tarde/i)).not.toBeInTheDocument();
  });

  it('10. feature flag "true" exibindo o protótipo', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', 'true');
    renderWithRouter();
    expect(screen.getByText(/Boa tarde/i)).toBeInTheDocument();
  });
});
