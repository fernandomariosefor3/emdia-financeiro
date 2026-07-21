import { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { CommitmentFormEntry, CommitmentRecurrenceLabel } from "../types";
import { MAX_PROTOTYPE_COMMITMENTS, createLocalEntryId } from "../initialState";
import { FieldFeedback } from "./FieldFeedback";

export type CommitmentsStepErrors = Record<string, { name?: string; amount?: string; date?: string }>;

interface CommitmentsStepProps {
  value: CommitmentFormEntry[];
  onChange: (value: CommitmentFormEntry[]) => void;
  errors: CommitmentsStepErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

const RECURRENCE_OPTIONS: { id: CommitmentRecurrenceLabel; label: string }[] = [
  { id: "monthly", label: "Mensal" },
  { id: "weekly", label: "Semanal" },
  { id: "yearly", label: "Anual" },
];

export function CommitmentsStep({ value, onChange, errors, headingRef }: CommitmentsStepProps) {
  function addCommitment() {
    onChange([
      ...value,
      {
        id: createLocalEntryId("commitment"),
        name: "",
        amountReaisText: "",
        nextDueDate: "",
        recurrence: "monthly",
        essential: true,
      },
    ]);
  }

  function updateCommitment(id: string, patch: Partial<CommitmentFormEntry>) {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function removeCommitment(id: string) {
    onChange(value.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold outline-none">
          O que precisa sair
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Contas e compromissos que se repetem. Marque como essencial o que não pode atrasar.
        </p>
      </div>

      <div className="space-y-4">
        {value.map((entry, index) => {
          const entryErrors = errors[entry.id] ?? {};
          return (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compromisso {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover compromisso ${index + 1}`}
                  onClick={() => removeCommitment(entry.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`commitment-name-${entry.id}`}>Nome</Label>
                <Input
                  id={`commitment-name-${entry.id}`}
                  placeholder="Ex: Aluguel, cartão..."
                  value={entry.name}
                  aria-invalid={!!entryErrors.name}
                  aria-describedby={entryErrors.name ? `commitment-name-${entry.id}-error` : undefined}
                  onChange={(e) => updateCommitment(entry.id, { name: e.target.value })}
                />
                <FieldFeedback id={`commitment-name-${entry.id}-error`} message={entryErrors.name} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`commitment-amount-${entry.id}`}>Valor (R$)</Label>
                  <Input
                    id={`commitment-amount-${entry.id}`}
                    inputMode="decimal"
                    placeholder="Ex: 900,00"
                    value={entry.amountReaisText}
                    aria-invalid={!!entryErrors.amount}
                    aria-describedby={entryErrors.amount ? `commitment-amount-${entry.id}-error` : undefined}
                    onChange={(e) => updateCommitment(entry.id, { amountReaisText: e.target.value })}
                  />
                  <FieldFeedback id={`commitment-amount-${entry.id}-error`} message={entryErrors.amount} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`commitment-date-${entry.id}`}>Próxima data</Label>
                  <Input
                    id={`commitment-date-${entry.id}`}
                    type="date"
                    value={entry.nextDueDate}
                    aria-invalid={!!entryErrors.date}
                    aria-describedby={entryErrors.date ? `commitment-date-${entry.id}-error` : undefined}
                    onChange={(e) => updateCommitment(entry.id, { nextDueDate: e.target.value })}
                  />
                  <FieldFeedback id={`commitment-date-${entry.id}-error`} message={entryErrors.date} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Recorrência</Label>
                <RadioGroup
                  aria-label={`Recorrência do compromisso ${index + 1}`}
                  value={entry.recurrence}
                  onValueChange={(recurrence) =>
                    updateCommitment(entry.id, { recurrence: recurrence as CommitmentRecurrenceLabel })
                  }
                  className="flex flex-wrap gap-4"
                >
                  {RECURRENCE_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <RadioGroupItem value={option.id} id={`commitment-recurrence-${entry.id}-${option.id}`} />
                      <Label htmlFor={`commitment-recurrence-${entry.id}-${option.id}`} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label>Este compromisso é</Label>
                <RadioGroup
                  aria-label={`Prioridade do compromisso ${index + 1}`}
                  value={entry.essential ? "essential" : "adjustable"}
                  onValueChange={(v) => updateCommitment(entry.id, { essential: v === "essential" })}
                  className="flex flex-wrap gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="essential" id={`commitment-priority-${entry.id}-essential`} />
                    <Label htmlFor={`commitment-priority-${entry.id}-essential`} className="font-normal">
                      Essencial
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="adjustable" id={`commitment-priority-${entry.id}-adjustable`} />
                    <Label htmlFor={`commitment-priority-${entry.id}-adjustable`} className="font-normal">
                      Posso ajustar
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={addCommitment}
        disabled={value.length >= MAX_PROTOTYPE_COMMITMENTS}
      >
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Adicionar compromisso
      </Button>
    </div>
  );
}
