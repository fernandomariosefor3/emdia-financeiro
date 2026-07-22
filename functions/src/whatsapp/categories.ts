import { TransactionType } from "./types";

// Mirrors the category vocabulary already used by processarGastoComIA
// (functions/index.ts) so transactions look consistent regardless of
// which channel created them.
export const DEFAULT_EXPENSE_CATEGORY = "Outros (saída)";
export const DEFAULT_INCOME_CATEGORY = "Outros (entrada)";

interface CategoryRule {
  category: string;
  keywords: string[];
}

const EXPENSE_CATEGORY_RULES: CategoryRule[] = [
  { category: "Alimentação", keywords: ["mercado", "supermercado", "feira", "restaurante", "lanche", "padaria", "ifood"] },
  { category: "Transporte", keywords: ["uber", "combustível", "combustivel", "gasolina", "ônibus", "onibus", "táxi", "taxi", "99"] },
  { category: "Moradia", keywords: ["aluguel", "condomínio", "condominio", "luz", "água", "agua", "internet", "gás", "gas"] },
  { category: "Saúde", keywords: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "consulta", "dentista"] },
  { category: "Lazer", keywords: ["cinema", "bar", "show", "viagem", "netflix", "streaming"] },
  { category: "Educação", keywords: ["curso", "faculdade", "livro", "escola", "mensalidade"] },
  { category: "Compras", keywords: ["loja", "roupa", "compra", "shopping"] },
];

const INCOME_CATEGORY_RULES: CategoryRule[] = [
  { category: "Salário", keywords: ["salário", "salario", "pagamento do trabalho"] },
  { category: "Freelance", keywords: ["freelance", "freela", "bico", "job"] },
  { category: "Investimentos", keywords: ["dividendo", "rendimento", "investimento", "juros"] },
];

/**
 * Keyword-based suggestion only — the user can always disagree by
 * answering NÃO, so this never needs to be exact. No AI involved.
 */
export function suggestCategory(type: TransactionType, description: string): string {
  const lowerDescription = description.toLowerCase();
  const rules = type === "expense" ? EXPENSE_CATEGORY_RULES : INCOME_CATEGORY_RULES;

  for (const rule of rules) {
    if (rule.keywords.some((kw) => lowerDescription.includes(kw))) return rule.category;
  }

  return type === "expense" ? DEFAULT_EXPENSE_CATEGORY : DEFAULT_INCOME_CATEGORY;
}
