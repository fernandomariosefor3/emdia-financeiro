export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date string
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: TransactionType | "both";
}

export const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { name: "Salário", color: "#1AC87E", icon: "💼", type: "income" },
  { name: "Freelance", color: "#3B82F6", icon: "💻", type: "income" },
  { name: "Investimentos", color: "#8B5CF6", icon: "📈", type: "income" },
  { name: "Outros (entrada)", color: "#06B6D4", icon: "➕", type: "income" },
  { name: "Alimentação", color: "#F97316", icon: "🍽️", type: "expense" },
  { name: "Transporte", color: "#EAB308", icon: "🚗", type: "expense" },
  { name: "Moradia", color: "#EF4444", icon: "🏠", type: "expense" },
  { name: "Saúde", color: "#EC4899", icon: "💊", type: "expense" },
  { name: "Lazer", color: "#A855F7", icon: "🎮", type: "expense" },
  { name: "Educação", color: "#14B8A6", icon: "📚", type: "expense" },
  { name: "Compras", color: "#F43F5E", icon: "🛍️", type: "expense" },
  { name: "Outros (saída)", color: "#6B7280", icon: "➖", type: "expense" },
];
