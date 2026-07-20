import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/domain/finance/money";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinancialTimelineProps {
  timeline: any[]; // CashFlowEvent from projectCashFlow
}

export function FinancialTimeline({ timeline }: FinancialTimelineProps) {
  // Show only the next 7 items from the projection (just to show it works, it's a flat list of events now)
  const eventsToShow = timeline.slice(0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linha do Tempo (Próximos eventos)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-4">
            {eventsToShow.map((ev, i) => {
              const dateStr = format(parseISO(ev.date), "dd/MM", { locale: ptBR });
              
              return (
                <li key={i} className="border-l-2 border-muted pl-4 relative">
                  <div className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${ev.type === 'expense' ? 'bg-orange-500' : 'bg-primary'}`} />
                  
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-sm">{dateStr}</h4>
                    <span className={`text-xs font-medium ${ev.balanceAfterInCents < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      Saldo ap.: {formatMoney(ev.balanceAfterInCents)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-2">
                      {ev.type === "income" ? (
                        <span className="text-green-500">+</span>
                      ) : (
                        <span className="text-red-400">-</span>
                      )}
                      {ev.description} 
                    </span>
                    <span className={ev.type === "income" ? "text-green-600 dark:text-green-400" : ""}>
                      {formatMoney(ev.amountInCents)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
