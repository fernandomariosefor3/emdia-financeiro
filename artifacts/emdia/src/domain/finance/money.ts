import { MoneyInCents } from "./types";

export const validateCents = (value: number): void => {
  if (!Number.isInteger(value)) {
    throw new Error(`Invalid money value: ${value}. Must be an integer representing cents.`);
  }
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid money value: ${value}. Cannot be Infinity or NaN.`);
  }
};

export const addMoney = (a: MoneyInCents, b: MoneyInCents): MoneyInCents => {
  validateCents(a);
  validateCents(b);
  return a + b;
};

export const subtractMoney = (a: MoneyInCents, b: MoneyInCents): MoneyInCents => {
  validateCents(a);
  validateCents(b);
  return a - b;
};

export const normalizeMoney = (value: MoneyInCents): MoneyInCents => {
  if (value < 0) return 0; // Dependendo da regra, pode-se querer manter negativo, mas geralmente normalizar significa garantir >= 0. Neste domínio, para valores que não podem ser negativos. 
  // Alterando para apenas retornar o valor após validação, a lógica de piso 0 deve ficar nas funções de domínio.
  validateCents(value);
  return value;
};

export const realsToCents = (reals: number): MoneyInCents => {
  if (!Number.isFinite(reals)) {
    throw new Error("Invalid real value.");
  }
  // Math.round to prevent floating point inaccuracies like 1.005 * 100 = 100.49999999999999
  return Math.round(reals * 100);
};

export const formatMoney = (cents: MoneyInCents): string => {
  validateCents(cents);
  const reals = cents / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(reals);
};
