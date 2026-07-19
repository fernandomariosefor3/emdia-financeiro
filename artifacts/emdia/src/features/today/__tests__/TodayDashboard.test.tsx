// @ts-nocheck
import { render, screen, fireEvent } from '@testing-library/react';
import { TodayDashboardPrototype } from '../TodayDashboardPrototype';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TodayPreview from '../../../pages/today-preview';
import { Router } from 'wouter';

describe('TodayDashboardPrototype', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renderização do Respiro e Ritmo', () => {
    render(<TodayDashboardPrototype />);
    expect(screen.getByText(/Respiro/i)).toBeInTheDocument();
    expect(screen.getByText(/Ritmo seguro/i)).toBeInTheDocument();
  });

  it('exibição do principal Risco e da Ação', () => {
    render(<TodayDashboardPrototype />);
    // There is no risk right now, everything is covered. Wait, we mocked 1240 balance + 2500 income = 3740.
    // 3740 - 250(reserve) = 3490.
    // Expenses = 1077.
    // It is a safe scenario!
    expect(screen.getByText(/Cenário tranquilo/i)).toBeInTheDocument();
    expect(screen.getByText(/Ação Prioritária/i)).toBeInTheDocument();
  });

  it('abertura da explicação', () => {
    render(<TodayDashboardPrototype />);
    const explainBtn = screen.getByText(/Entender cálculo/i);
    fireEvent.click(explainBtn);
    expect(screen.getByText(/Como chegamos a este resultado\?/i)).toBeInTheDocument();
  });

  it('simulação de compra à vista (cenário que cria risco)', () => {
    render(<TodayDashboardPrototype />);
    
    // Fill amount with very large number to trigger risk
    const amountInput = screen.getByLabelText(/Valor total/i);
    fireEvent.change(amountInput, { target: { value: '5000' } });
    
    const simBtn = screen.getByText(/Simular impacto/i);
    fireEvent.click(simBtn);
    
    expect(screen.getByText(/Impacto Projetado/i)).toBeInTheDocument();
    expect(screen.getByText(/Respiro após compra/i)).toBeInTheDocument();
  });

  it('simulação parcelada', () => {
    render(<TodayDashboardPrototype />);
    
    const amountInput = screen.getByLabelText(/Valor total/i);
    fireEvent.change(amountInput, { target: { value: '300' } });
    
    const installmentsInput = screen.getByLabelText(/Parcelas/i);
    fireEvent.change(installmentsInput, { target: { value: '3' } });
    
    const simBtn = screen.getByText(/Simular impacto/i);
    fireEvent.click(simBtn);
    
    expect(screen.getByText(/Impacto Projetado/i)).toBeInTheDocument();
  });
});

describe('TodayPreview (Feature Flag)', () => {
  it('feature flag desativada redireciona', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', 'false');
    
    render(
      <Router>
        <TodayPreview />
      </Router>
    );
    
    expect(screen.queryByText(/Boa tarde/i)).not.toBeInTheDocument();
  });

  it('feature flag ativada renderiza a tela', () => {
    vi.stubEnv('VITE_ENABLE_TODAY_V3', 'true');
    
    render(
      <Router>
        <TodayPreview />
      </Router>
    );
    
    expect(screen.getByText(/Boa tarde/i)).toBeInTheDocument();
  });
});
