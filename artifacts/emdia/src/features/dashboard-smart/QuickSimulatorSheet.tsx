import { useState } from "react";
import { format, addDays } from "date-fns";
import {
  ShoppingBag, X, AlertTriangle, TrendingDown, TrendingUp,
  CheckCircle2, Info, DollarSign, Calendar, CreditCard, ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PulseData, simulatePurchaseFromPulse } from "@/hooks/useFinancialPulse";
import type { FinancialScenario } from "@/domain/finance/types";
import { cn } from "@/lib/utils";

interface QuickSimulatorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pulse: PulseData;
}

function fmt(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function ScenarioDiff({
  label,
  before,
  after,
  unit = "",
}: {
  label: string;
  before: number;
  after: number;
  unit?: string;
}) {
  const diff = after - before;
  const isPositive = diff > 0;
  const isNegative = diff < 0;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-400 line-through">
          {fmt(before)}{unit}
        </span>
        <ArrowRight size={12} className="text-gray-300" />
        <span
          className={cn(
            "text-sm font-extrabold",
            after >= 0 ? "text-emerald-600" : "text-rose-600",
          )}
        >
          {fmt(after)}{unit}
        </span>
        {isNegative && diff !== 0 && (
          <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-full">
            -{fmt(Math.abs(diff))}
          </span>
        )}
        {isPositive && diff !== 0 && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
            +{fmt(diff)}
          </span>
        )}
      </div>
    </div>
  );
}

export function QuickSimulatorSheet({ open, onOpenChange, pulse }: QuickSimulatorSheetProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "installments">("cash");
  const [installments, setInstallments] = useState("1");
  const [scenario, setScenario] = useState<FinancialScenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount.replace(",", "."));

  function handleSimulate() {
    setError(null);
    setScenario(null);

    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError("Digite um valor válido maior que zero.");
      return;
    }

    if (amountNum > 999999) {
      setError("Valor muito alto. Tente um valor menor.");
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");

    const proposal = {
      totalAmountInCents: Math.round(amountNum * 100),
      paymentMethod,
      installments: parseInt(installments, 10) || 1,
      firstDueDate: paymentMethod === "cash" ? today : format(addDays(new Date(), 30), "yyyy-MM-dd"),
      description: description || "Compra simulada",
      category: "Outros (saída)",
    };

    try {
      const result = simulatePurchaseFromPulse(pulse, proposal);
      setScenario(result);
    } catch (e) {
      setError("Não foi possível calcular. Tente valores menores.");
    }
  }

  function handleReset() {
    setAmount("");
    setDescription("");
    setPaymentMethod("cash");
    setInstallments("1");
    setScenario(null);
    setError(null);
  }

  const hasNewRisks = scenario && scenario.newRisks.length > 0;
  const respiroAfter = scenario?.simulatedSnapshot.breathingRoomInCents ?? 0;
  const isDanger = respiroAfter < 0;
  const isCaution = respiroAfter >= 0 && respiroAfter < pulse.expenseInCents * 0.1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-[#0A0F1E]">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <ShoppingBag size={16} className="text-white" />
            </div>
            Simulador de Compra
          </DialogTitle>
        </DialogHeader>

        {/* Form */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Quanto quer gastar?
            </Label>
            <div className="relative">
              <DollarSign
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-9 text-lg font-bold rounded-xl h-12 border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600">
              Descrição (opcional)
            </Label>
            <Input
              placeholder="Ex: Tênis, Cinema, Presente..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600">Forma de pagamento</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as "cash" | "installments")}
              >
                <SelectTrigger className="rounded-xl h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <CreditCard size={14} /> À vista
                    </div>
                  </SelectItem>
                  <SelectItem value="installments">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} /> Parcelado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "installments" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600">Parcelas</Label>
                <Select value={installments} onValueChange={setInstallments}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n}x sem juros
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-600 font-medium">
              <Info size={14} className="shrink-0" />
              {error}
            </div>
          )}

          <Button
            onClick={handleSimulate}
            className="w-full bg-[#1AC87E] hover:bg-[#15A86A] text-white font-bold rounded-xl h-12 shadow-md shadow-[#1AC87E]/20"
          >
            Simular compra
          </Button>
        </div>

        {/* Results */}
        <AnimatePresence>
          {scenario && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 pt-2"
            >
              {/* Verdict */}
              <div
                className={cn(
                  "rounded-2xl p-4 border",
                  isDanger
                    ? "bg-rose-50 border-rose-200"
                    : isCaution
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200",
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isDanger ? (
                    <AlertTriangle size={18} className="text-rose-600" />
                  ) : isCaution ? (
                    <Info size={18} className="text-amber-600" />
                  ) : (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  )}
                  <span
                    className={cn(
                      "font-extrabold text-sm",
                      isDanger
                        ? "text-rose-700"
                        : isCaution
                        ? "text-amber-700"
                        : "text-emerald-700",
                    )}
                  >
                    {isDanger
                      ? "Cuidado! Esta compra aperta suas finanças."
                      : isCaution
                      ? "Atenção! Respiro fica bem reduzido."
                      : "Tudo certo! Seu respiro aguenta essa compra."}
                  </span>
                </div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isDanger ? "text-rose-600" : isCaution ? "text-amber-600" : "text-emerald-600",
                  )}
                >
                  Após a compra, seu respiro será{" "}
                  <strong>
                    {fmt(Math.abs(respiroAfter))}
                    {respiroAfter < 0 ? " negativo" : ""}
                  </strong>
                  .
                </p>
              </div>

              {/* Comparison */}
              <div className="rounded-xl border border-gray-200 p-4 space-y-0">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
                  Comparativo
                </p>
                <ScenarioDiff
                  label="Respiro"
                  before={scenario.previousSnapshot.breathingRoomInCents}
                  after={scenario.simulatedSnapshot.breathingRoomInCents}
                />
                <ScenarioDiff
                  label="Ritmo diário"
                  before={scenario.previousSnapshot.safeDailyPaceInCents}
                  after={scenario.simulatedSnapshot.safeDailyPaceInCents}
                  unit="/dia"
                />
              </div>

              {/* New risks */}
              {hasNewRisks && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingDown size={16} className="text-amber-600" />
                    <span className="font-extrabold text-sm text-amber-700">
                      {scenario.newRisks.length} novo{scenario.newRisks.length > 1 ? "s" : ""} risco{scenario.newRisks.length > 1 ? "s" : ""} gerado{scenario.newRisks.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  {scenario.newRisks.map((risk) => (
                    <p key={risk.id} className="text-xs text-amber-700 pl-6">
                      • {risk.reason} — falta {fmt(risk.shortfallInCents)}
                    </p>
                  ))}
                </div>
              )}

              {/* Installment breakdown */}
              {paymentMethod === "installments" && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Impacto por parcela
                  </p>
                  <p className="text-sm font-semibold text-[#0A0F1E]">
                    {installments}x de{" "}
                    <strong className="text-blue-600">
                      {fmt(Math.round((amountNum * 100) / parseInt(installments)))}
                    </strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {installments} compromissos adicionados ao longo de ~{Math.round(parseInt(installments) * 30 / 30)} meses.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleReset}
                className="w-full rounded-xl h-11 text-sm font-medium"
              >
                Simular outra compra
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
