import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus, Trash2, Pencil, ArrowUpRight, ArrowDownRight,
  TrendingUp, ChevronLeft, Loader2, Search,
} from "lucide-react";
import { useTransactions } from "@/hooks/use-transactions";
import { useUserPlan } from "@/lib/useUserPlan";
import { TransactionUsage, UpgradeModal } from "@/lib/ProBadge";
import { CSVExport } from "@/lib/PremiumReports";
import { DEFAULT_CATEGORIES, type Transaction, type TransactionType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const schema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Informe um valor positivo"),
  category: z.string().min(1, "Selecione uma categoria"),
  description: z.string().min(1, "Informe uma descrição"),
  date: z.string().min(1, "Informe a data"),
});

type FormData = z.infer<typeof schema>;

function fmt(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function TransactionForm({
  defaultValues,
  onSave,
  onCancel,
}: {
  defaultValues?: Partial<FormData>;
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: "expense",
      date: format(new Date(), "yyyy-MM-dd"),
      ...defaultValues,
    },
  });

  const type = watch("type") as TransactionType;
  const filteredCategories = DEFAULT_CATEGORIES.filter((c) => c.type === type || c.type === "both");

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-4">
      {/* Type */}
      <div className="space-y-1.5">
        <Label className="text-[#0A0F1E] font-medium">Tipo</Label>
        <div className="grid grid-cols-2 gap-2">
          {(["income", "expense"] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setValue("type", t)}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                type === t
                  ? t === "income"
                    ? "bg-[#1AC87E]/10 border-[#1AC87E] text-[#1AC87E]"
                    : "bg-red-50 border-red-400 text-red-500"
                  : "border-gray-200 text-gray-400 hover:border-gray-300"
              }`}
            >
              {t === "income" ? "Receita" : "Despesa"}
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="space-y-1.5">
        <Label htmlFor="amount" className="text-[#0A0F1E] font-medium">Valor (R$)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="0,00"
          className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300"
          {...register("amount")}
        />
        {errors.amount && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
      </div>

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-[#0A0F1E] font-medium">Categoria</Label>
        <Select onValueChange={(v) => setValue("category", v)} defaultValue={defaultValues?.category}>
          <SelectTrigger className="border-gray-200 bg-white text-[#0A0F1E]">
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200 text-[#0A0F1E]">
            {filteredCategories.map((c) => (
              <SelectItem key={c.name} value={c.name} className="focus:bg-gray-50">
                {c.icon} {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-[#0A0F1E] font-medium">Descrição</Label>
        <Input
          id="description"
          placeholder="Ex: Supermercado"
          className="border-gray-200 bg-white text-[#0A0F1E] placeholder:text-gray-300"
          {...register("description")}
        />
        {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
      </div>

      {/* Date */}
      <div className="space-y-1.5">
        <Label htmlFor="date" className="text-[#0A0F1E] font-medium">Data</Label>
        <Input
          id="date"
          type="date"
          className="border-gray-200 bg-white text-[#0A0F1E]"
          {...register("date")}
        />
        {errors.date && <p className="text-red-500 text-xs">{errors.date.message}</p>}
      </div>

      <DialogFooter className="gap-2 pt-2">
        <Button type="button" variant="ghost" className="text-gray-500" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#1AC87E] hover:bg-[#15a868] text-white shadow-md shadow-[#1AC87E]/20"
        >
          {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function Transacoes() {
  const [, navigate] = useLocation();
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { canPerformAction } = useUserPlan();

  const [showDialog, setShowDialog] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [search, setSearch] = useState("");

  const filtered = transactions.filter((t) => {
    const matchType = filterType === "all" || t.type === filterType;
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
      || t.category.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  async function handleSave(data: FormData) {
    if (editing) {
      await updateTransaction(editing.id, data);
    } else {
      await addTransaction(data);
    }
    setShowDialog(false);
    setEditing(null);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    setShowDialog(true);
  }

  function openNew() {
    if (!canPerformAction("addTransaction")) {
      setShowLimitModal(true);
      return;
    }
    setEditing(null);
    setShowDialog(true);
  }

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-[#0A0F1E]"
            onClick={() => navigate("/dashboard")}
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1AC87E] flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-lg text-[#0A0F1E]">Transações</span>
          </div>
        </div>
        <Button
          className="bg-[#1AC87E] hover:bg-[#15a868] text-white gap-2 shadow-md shadow-[#1AC87E]/20"
          onClick={openNew}
        >
          <Plus size={16} />
          Nova transação
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Uso do plano + exportação CSV */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white border border-gray-100 shadow-sm rounded-xl p-4">
            <TransactionUsage />
          </div>
          <div className="sm:w-80">
            <CSVExport transactions={transactions.map(t => ({
              ...t,
              type: t.type as "income" | "expense" | "debt",
              date: new Date(t.date),
            }))} />
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-400 font-medium">Total de receitas</p>
              <p className="text-xl font-extrabold text-[#1AC87E] mt-1">{fmt(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-sm">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-gray-400 font-medium">Total de despesas</p>
              <p className="text-xl font-extrabold text-red-500 mt-1">{fmt(totalExpense)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <Input
              placeholder="Buscar por descrição ou categoria..."
              className="pl-9 bg-white border-gray-200 text-[#0A0F1E] placeholder:text-gray-300"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <TabsList className="bg-gray-100 border border-gray-200">
              <TabsTrigger value="all" className="text-gray-500 data-[state=active]:bg-white data-[state=active]:text-[#0A0F1E] data-[state=active]:shadow-sm">Todos</TabsTrigger>
              <TabsTrigger value="income" className="text-gray-500 data-[state=active]:bg-[#1AC87E]/10 data-[state=active]:text-[#1AC87E]">Receitas</TabsTrigger>
              <TabsTrigger value="expense" className="text-gray-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-500">Despesas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List */}
        <Card className="bg-white border border-gray-100 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[#0A0F1E]">
              {filtered.length} transaç{filtered.length === 1 ? "ão" : "ões"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-14 bg-gray-100 rounded-lg" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <p>Nenhuma transação encontrada.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {filtered.map((tx) => {
                  const cat = DEFAULT_CATEGORIES.find((c) => c.name === tx.category);
                  return (
                    <li key={tx.id} className="py-3.5 flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                          style={{ backgroundColor: `${cat?.color ?? "#6B7280"}18` }}
                        >
                          {cat?.icon ?? (tx.type === "income" ? "💰" : "💸")}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[#0A0F1E]">{tx.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-400 py-0 px-1.5">
                              {tx.category}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {format(parseISO(tx.date), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-sm ${tx.type === "income" ? "text-[#1AC87E]" : "text-red-500"}`}>
                          {tx.type === "income" ? <ArrowUpRight size={14} className="inline" /> : <ArrowDownRight size={14} className="inline" />}
                          {fmt(tx.amount)}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-300 hover:text-[#0A0F1E]"
                            onClick={() => openEdit(tx)}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-300 hover:text-red-500"
                            onClick={() => deleteTransaction(tx.id)}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Modal de limite de plano */}
      <UpgradeModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        feature="unlimited"
        description="Você atingiu o limite de transações do plano gratuito este mês."
      />

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) setEditing(null); }}>
        <DialogContent className="bg-white border-gray-100 text-[#0A0F1E] max-w-md shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-[#0A0F1E] font-bold">{editing ? "Editar transação" : "Nova transação"}</DialogTitle>
          </DialogHeader>
          <TransactionForm
            defaultValues={editing ? {
              type: editing.type,
              amount: editing.amount,
              category: editing.category,
              description: editing.description,
              date: editing.date,
            } : undefined}
            onSave={handleSave}
            onCancel={() => { setShowDialog(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
