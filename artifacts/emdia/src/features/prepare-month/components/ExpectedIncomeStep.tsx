import { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Trash2, Plus } from "lucide-react";
import { IncomeFormEntry, IncomeConfidenceLabel } from "../types";
import { MAX_PROTOTYPE_INCOMES, createLocalEntryId } from "../initialState";
import { FieldFeedback } from "./FieldFeedback";

export type ExpectedIncomeStepErrors = Record<string, { description?: string; amount?: string; date?: string }>;

interface ExpectedIncomeStepProps {
  value: IncomeFormEntry[];
  onChange: (value: IncomeFormEntry[]) => void;
  errors: ExpectedIncomeStepErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

const CONFIDENCE_OPTIONS: { id: IncomeConfidenceLabel; label: string }[] = [
  { id: "certain", label: "Tenho certeza" },
  { id: "probable", label: "Provavelmente entra" },
  { id: "uncertain", label: "Ainda é incerta" },
];

export function ExpectedIncomeStep({ value, onChange, errors, headingRef }: ExpectedIncomeStepProps) {
  function addIncome() {
    onChange([
      ...value,
      {
        id: createLocalEntryId("income"),
        description: "",
        amountReaisText: "",
        expectedDate: "",
        confidenceLabel: "uncertain",
      },
    ]);
  }

  function updateIncome(id: string, patch: Partial<IncomeFormEntry>) {
    onChange(value.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)));
  }

  function removeIncome(id: string) {
    onChange(value.filter((entry) => entry.id !== id));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Receitas esperadas
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Renda esperada. O cenário oficial só soma valores em que você tem certeza — receitas
          prováveis ou incertas aparecem à parte, sem entrar na conta principal.
        </p>
      </div>

      <div className="space-y-4">
        {value.map((entry, index) => {
          const entryErrors = errors[entry.id] ?? {};
          return (
            <div key={entry.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Renda {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remover renda ${index + 1}`}
                  onClick={() => removeIncome(entry.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`income-description-${entry.id}`}>Descrição</Label>
                <Input
                  id={`income-description-${entry.id}`}
                  placeholder="Ex: Salário, freelance..."
                  value={entry.description}
                  aria-invalid={!!entryErrors.description}
                  aria-describedby={entryErrors.description ? `income-description-${entry.id}-error` : undefined}
                  onChange={(e) => updateIncome(entry.id, { description: e.target.value })}
                />
                <FieldFeedback id={`income-description-${entry.id}-error`} message={entryErrors.description} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor={`income-amount-${entry.id}`}>Valor (R$)</Label>
                  <Input
                    id={`income-amount-${entry.id}`}
                    inputMode="decimal"
                    placeholder="Ex: 3500,00"
                    value={entry.amountReaisText}
                    aria-invalid={!!entryErrors.amount}
                    aria-describedby={entryErrors.amount ? `income-amount-${entry.id}-error` : undefined}
                    onChange={(e) => updateIncome(entry.id, { amountReaisText: e.target.value })}
                  />
                  <FieldFeedback id={`income-amount-${entry.id}-error`} message={entryErrors.amount} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`income-date-${entry.id}`}>Data prevista</Label>
                  <Input
                    id={`income-date-${entry.id}`}
                    type="date"
                    value={entry.expectedDate}
                    aria-invalid={!!entryErrors.date}
                    aria-describedby={entryErrors.date ? `income-date-${entry.id}-error` : undefined}
                    onChange={(e) => updateIncome(entry.id, { expectedDate: e.target.value })}
                  />
                  <FieldFeedback id={`income-date-${entry.id}-error`} message={entryErrors.date} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Confiança</Label>
                <RadioGroup
                  aria-label={`Confiança da renda ${index + 1}`}
                  value={entry.confidenceLabel}
                  onValueChange={(confidenceLabel) =>
                    updateIncome(entry.id, { confidenceLabel: confidenceLabel as IncomeConfidenceLabel })
                  }
                  className="flex flex-wrap gap-4"
                >
                  {CONFIDENCE_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <RadioGroupItem value={option.id} id={`income-confidence-${entry.id}-${option.id}`} />
                      <Label htmlFor={`income-confidence-${entry.id}-${option.id}`} className="font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" onClick={addIncome} disabled={value.length >= MAX_PROTOTYPE_INCOMES}>
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Adicionar renda
      </Button>
    </div>
  );
}
