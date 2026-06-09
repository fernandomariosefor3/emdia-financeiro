// Planos disponíveis no emdia
export type PlanType = "free" | "pro" | "enterprise";

// Limites do plano gratuito
export const FREE_LIMITS = {
  transactionsPerMonth: 15,
  categories: 5,
  historyDays: 30,
  cloudSync: false,
  csvExport: false,
  reports: false,
  premiumSupport: false,
};

// Benefícios do plano Pro
export const PRO_FEATURES = {
  transactionsPerMonth: -1, // ilimitado
  categories: -1, // ilimitado
  historyDays: -1, // ilimitado
  cloudSync: true,
  csvExport: true,
  reports: true,
  premiumSupport: true,
  familyMembers: 1, // +1 para família
};

// Benefícios do plano Enterprise
export const ENTERPRISE_FEATURES = {
  ...PRO_FEATURES,
  familyMembers: 5, // até 5 membros
  multiUser: true,
  erpIntegration: true,
  sla: true,
};

// Descrições dos planos
export const PLAN_INFO = {
  free: {
    name: "Gratuito",
    price: 0,
    period: "para sempre",
    description: "Perfeito para começar",
    features: [
      "15 transações/mês",
      "5 categorias",
      "Histórico de 30 dias",
      "Gráfico de pizza básico",
      "Suporte por email",
    ],
    notIncluded: [
      "Exportação CSV",
      "Relatórios mensais",
      "Sincronização na nuvem",
      "Categorias ilimitadas",
    ],
  },
  pro: {
    name: "Pro",
    price: 6.58,
    period: "por mês",
    annualPrice: 78.99,
    annualPeriod: "por ano",
    description: "Para controle total das finanças",
    features: [
      "Transações ilimitadas",
      "Categorias ilimitadas",
      "Histórico completo",
      "Exportação CSV",
      "Relatórios mensais",
      "Sincronização na nuvem",
      "Suporte prioritário",
      "Backup histórico",
    ],
    popular: true,
  },
  enterprise: {
    name: "Empresas",
    price: null,
    period: "sob consulta",
    description: "Para equipes e empresas",
    features: [
      "Tudo do Pro",
      "Multi-usuários (até 5)",
      "Relatórios corporativos",
      "Integração ERP",
      "SLA dedicado",
      "Onboarding personalizado",
    ],
  },
};

// hook para gerenciar plano do usuário