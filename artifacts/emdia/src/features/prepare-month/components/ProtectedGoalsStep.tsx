import { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import { GoalFormEntry } from "../types";
import { MAX_PROTOTYPE_GOALS, createLocalEntryId } from "../initialState";
import { FieldFeedback } from "./FieldFeedback";

export type ProtectedGoalsStepErrors = Record<
  string,
  { name?: string; target?: string; protectedAmount?: string }
>;

interface ProtectedGoalsStepProps {
  value: GoalFormEntry[];
  onChange: (value: GoalFormEntry[]) => void;
  errors: ProtectedGoalsStepErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function ProtectedGoalsStep({ value, onChange, errors, headingRef }: ProtectedGoalsStepProps) {
  function addGoal() {
    onChange([
      ...value,
      {
        id: createLocalEntryId("goal"),
        name: "",
        targetAmountReaisText: "",
        protectedAmountReaisText: "",
        targetDate: "",
        priority: value.length + 1,
      },
    ]);
  }

  function updateGoal(id: string, patch: Partial<GoalFormEntry>) {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function removeGoal(id: string) {
    onChange(value.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Metas protegidas
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Metas protegidas reduzem o dinheiro livre estimado, para você não gastar o que já tem
          outro destino.
        </p>
      </div>

      <div className="space-y-4">
        {value.map((entry, index) => {
          const entryErrors = errors[entry.id] ?? {};
          return (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Meta {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover meta ${index + 1}`}
                  onClick={() => removeGoal(entry.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`goal-name-${entry.id}`}>Nome</Label>
                <Input
                  id={`goal-name-${entry.id}`}
                  placeholder="Ex: Viagem, reserva de emergência..."
                  value={entry.name}
                  aria-invalid={!!entryErrors.name}
                  aria-describedby={entryErrors.name ? `goal-name-${entry.id}-error` : undefined}
                  onChange={(e) => updateGoal(entry.id, { name: e.target.value })}
                />
                <FieldFeedback id={`goal-name-${entry.id}-error`} message={entryErrors.name} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`goal-target-${entry.id}`}>Valor total da meta (R$)</Label>
                  <Input
                    id={`goal-target-${entry.id}`}
                    inputMode="decimal"
                    placeholder="Ex: 5000,00"
                    value={entry.targetAmountReaisText}
                    aria-invalid={!!entryErrors.target}
                    aria-describedby={entryErrors.target ? `goal-target-${entry.id}-error` : undefined}
                    onChange={(e) => updateGoal(entry.id, { targetAmountReaisText: e.target.value })}
                  />
                  <FieldFeedback id={`goal-target-${entry.id}-error`} message={entryErrors.target} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`goal-protected-${entry.id}`}>Já protegido (R$)</Label>
                  <Input
                    id={`goal-protected-${entry.id}`}
                    inputMode="decimal"
                    placeholder="Ex: 1000,00"
                    value={entry.protectedAmountReaisText}
                    aria-invalid={!!entryErrors.protectedAmount}
                    aria-describedby={
                      entryErrors.protectedAmount ? `goal-protected-${entry.id}-error` : undefined
                    }
                    onChange={(e) => updateGoal(entry.id, { protectedAmountReaisText: e.target.value })}
                  />
                  <FieldFeedback id={`goal-protected-${entry.id}-error`} message={entryErrors.protectedAmount} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`goal-date-${entry.id}`}>Data desejada (opcional)</Label>
                <Input
                  id={`goal-date-${entry.id}`}
                  type="date"
                  value={entry.targetDate}
                  onChange={(e) => updateGoal(entry.id, { targetDate: e.target.value })}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={addGoal} disabled={value.length >= MAX_PROTOTYPE_GOALS}>
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Adicionar meta
      </Button>
    </div>
  );
}
