import { useState } from "react";
import { FinancialCommitment, ExpectedIncome, MoneyInCents, FinancialScenario } from "@/domain/finance/types";
import { simulatePurchase } from "@/domain/finance/simulatePurchase";
import { formatMoney, realsToCents } from "@/domain/finance/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DecisionSimulatorProps {
  currentBalanceInCents: MoneyInCents;
  commitments: FinancialCommitment[];
  expectedIncomes: ExpectedIncome[];
  protectedAmountInCents: MoneyInCents;
  minimumReserveInCents: MoneyInCents;
  referenceDate: string;
  horizonDate: string;
}

export function DecisionSimulator({ 
  currentBalanceInCents,
  commitments,
  expectedIncomes,
  protectedAmountInCents,
  minimumReserveInCents,
  referenceDate, 
  horizonDate 
}: DecisionSimulatorProps) {
  const [description, setDescription] = useState("");
  const [amountInReals, setAmountInReals] = useState("");
  const [installments, setInstallments] = useState(1);
  const [startDate, setStartDate] = useState(referenceDate);
  const [scenario, setScenario] = useState<FinancialScenario | null>(null);

  const handleSimulate = () => {
    if (!amountInReals || isNaN(Number(amountInReals))) return;
    
    const amountInCents = realsToCents(Number(amountInReals));
    
    const result = simulatePurchase({
      currentBalanceInCents,
      commitments,
      expectedIncomes,
      protectedAmountInCents,
      minimumReserveInCents,
      referenceDate,
      horizonDate,
      proposal: {
        totalAmountInCents: amountInCents,
        paymentMethod: installments > 1 ? "installments" : "cash",
        installments,
        firstDueDate: startDate,
        description: description || "Nova compra",
        category: "others"
      }
    });
    
    setScenario(result);
  };

  const handleClear = () => {
    setScenario(null);
    setAmountInReals("");
    setDescription("");
    setInstallments(1);
    setStartDate(referenceDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Simular uma decisão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="desc">O que você quer comprar?</Label>
            <Input id="desc" placeholder="Ex: Tênis novo" value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Valor total (R$)</Label>
            <Input id="amount" type="number" placeholder="0.00" value={amountInReals} onChange={e => setAmountInReals(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installments">Parcelas</Label>
            <Input id="installments" type="number" min={1} max={48} value={installments} onChange={e => setInstallments(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Data da primeira cobrança</Label>
            <Input id="date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleSimulate}>Simular impacto</Button>
          {scenario && <Button variant="outline" onClick={handleClear}>Limpar</Button>}
        </div>

        <div aria-live="polite">
          {scenario && (
            <div className="mt-6 p-4 rounded-lg bg-muted space-y-3">
              <h4 className="font-medium">Impacto Projetado</h4>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Respiro atual</p>
                  <p className="font-medium">{formatMoney(scenario.previousSnapshot.breathingRoomInCents)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Respiro após compra</p>
                  <p className={`font-medium ${scenario.simulatedSnapshot.breathingRoomInCents < 0 ? 'text-red-500' : ''}`}>
                    {formatMoney(scenario.simulatedSnapshot.breathingRoomInCents)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ritmo atual</p>
                  <p className="font-medium">{formatMoney(scenario.previousSnapshot.safeDailyPaceInCents)}/dia</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ritmo após compra</p>
                  <p className="font-medium">{formatMoney(scenario.simulatedSnapshot.safeDailyPaceInCents)}/dia</p>
                </div>
              </div>
              
              {scenario.newRisks.length > 0 && (
                <div className="pt-2 border-t border-border mt-2">
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">Novos riscos criados:</p>
                  <ul className="text-sm space-y-1">
                    {scenario.newRisks.map((r, i) => (
                      <li key={i} className="text-orange-600/90 dark:text-orange-500/90">• {r.severity === 'critical' ? 'Pode faltar saldo para compromissos essenciais.' : 'Risco de saldo negativo ou respiro esgotado.'}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
