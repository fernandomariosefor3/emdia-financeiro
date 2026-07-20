import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatMoney } from "@/domain/finance/money";
import { FinancialSnapshot } from "@/domain/finance/types";

interface ExplainCalculationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: FinancialSnapshot;
  horizonDate: string;
  totalIncomeInCents: number;
  totalCommitmentsInCents: number;
  minimumReserveInCents: number;
}

export function ExplainCalculationDialog({ 
  open, 
  onOpenChange, 
  snapshot, 
  horizonDate,
  totalIncomeInCents,
  totalCommitmentsInCents,
  minimumReserveInCents
}: ExplainCalculationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Como chegamos a este resultado?</DialogTitle>
          <DialogDescription>
            Cálculo determinístico até {horizonDate}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Saldo atual considerado:</span>
            <span className="font-medium">{formatMoney(snapshot.currentBalanceInCents)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Receitas confirmadas:</span>
            <span className="font-medium text-green-600 dark:text-green-400">+{formatMoney(totalIncomeInCents)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Compromissos no período:</span>
            <span className="font-medium text-red-500">-{formatMoney(totalCommitmentsInCents)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Reserva mínima protegida:</span>
            <span className="font-medium text-orange-500">-{formatMoney(minimumReserveInCents)}</span>
          </div>
          
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium mb-2">Regras aplicadas:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>• O Respiro é o saldo livre após subtrair todas as contas e reservas.</li>
              <li>• O Ritmo divide o Respiro pelos dias restantes até a próxima receita.</li>
              <li>• Receitas incertas ou não confirmadas não entram no cálculo oficial.</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
