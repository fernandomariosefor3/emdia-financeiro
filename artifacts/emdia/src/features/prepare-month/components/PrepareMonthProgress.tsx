import { Check } from "lucide-react";
import { PREPARE_MONTH_STAGES, PrepareMonthScreen } from "../types";
import { cn } from "@/lib/utils";

interface PrepareMonthProgressProps {
  currentScreen: PrepareMonthScreen;
}

export function PrepareMonthProgress({ currentScreen }: PrepareMonthProgressProps) {
  const currentStageIndex = PREPARE_MONTH_STAGES.findIndex((stage) =>
    stage.screens.includes(currentScreen)
  );

  return (
    <nav aria-label="Progresso do planejamento" className="mb-6">
      <ol className="flex flex-wrap gap-3">
        {PREPARE_MONTH_STAGES.map((stage, index) => {
          const isDone = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          return (
            <li
              key={stage.label}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border",
                isCurrent && "border-primary text-primary bg-primary/5",
                isDone && "border-muted-foreground/30 text-muted-foreground",
                !isCurrent && !isDone && "border-muted text-muted-foreground/60"
              )}
            >
              {isDone ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <span aria-hidden="true">{index + 1}.</span>
              )}
              <span>{stage.label}</span>
              {isDone && <span className="sr-only"> (concluída)</span>}
              {isCurrent && <span className="sr-only"> (etapa atual)</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
