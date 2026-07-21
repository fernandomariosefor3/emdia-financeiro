import { RefObject } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ReserveForm, ReserveChoice } from "../types";
import { FieldFeedback } from "./FieldFeedback";

export interface ReserveStepErrors {
  amount?: string;
}

interface ReserveStepProps {
  value: ReserveForm;
  onChange: (value: ReserveForm) => void;
  errors: ReserveStepErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

const OPTIONS: { id: ReserveChoice; label: string }[] = [
  { id: "undecided", label: "Ainda não defini uma reserva" },
  { id: "want_to_protect", label: "Quero proteger um valor" },
  { id: "confirmed_none", label: "Confirmei que não quero reservar nenhum valor agora" },
];

export function ReserveStep({ value, onChange, errors, headingRef }: ReserveStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Reserva mínima
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Reserva é uma parte do dinheiro que não deve ser tratada como livre para gastar.
        </p>
      </div>

      <RadioGroup
        aria-label="Escolha sobre a reserva mínima"
        value={value.choice}
        onValueChange={(choice) => onChange({ ...value, choice: choice as ReserveChoice })}
        className="space-y-3"
      >
        {OPTIONS.map((option) => (
          <div key={option.id} className="flex items-center gap-2">
            <RadioGroupItem value={option.id} id={`reserve-choice-${option.id}`} />
            <Label htmlFor={`reserve-choice-${option.id}`} className="font-normal">
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {value.choice === "want_to_protect" && (
        <div className="space-y-1.5">
          <Label htmlFor="prepare-month-reserve-amount">Valor a proteger (R$)</Label>
          <Input
            id="prepare-month-reserve-amount"
            inputMode="decimal"
            placeholder="Ex: 500,00"
            value={value.amountReaisText}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "prepare-month-reserve-amount-error" : undefined}
            onChange={(e) => onChange({ ...value, amountReaisText: e.target.value })}
          />
          <FieldFeedback id="prepare-month-reserve-amount-error" message={errors.amount} />
        </div>
      )}
    </div>
  );
}
