import { RefObject } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReferenceBalanceForm } from "../types";
import { FieldFeedback } from "./FieldFeedback";

export interface ReferenceBalanceStepErrors {
  amount?: string;
  date?: string;
}

interface ReferenceBalanceStepProps {
  value: ReferenceBalanceForm;
  onChange: (value: ReferenceBalanceForm) => void;
  todayIso: string;
  errors: ReferenceBalanceStepErrors;
  headingRef: RefObject<HTMLHeadingElement | null>;
}

export function ReferenceBalanceStep({ value, onChange, todayIso, errors, headingRef }: ReferenceBalanceStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 ref={headingRef} tabIndex={-1} className="text-xl font-bold rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          Seu ponto de partida
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Informe quanto você tinha disponível nesta data. Usaremos esse valor como ponto de
          partida para não contar movimentações antigas duas vezes.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prepare-month-balance-amount">Saldo de hoje (R$)</Label>
        <Input
          id="prepare-month-balance-amount"
          inputMode="decimal"
          placeholder="Ex: 1500,00 ou -200,00"
          value={value.amountReaisText}
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? "prepare-month-balance-amount-error" : undefined}
          onChange={(e) => onChange({ ...value, amountReaisText: e.target.value })}
        />
        <FieldFeedback id="prepare-month-balance-amount-error" message={errors.amount} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prepare-month-balance-date">Data desse saldo</Label>
        <Input
          id="prepare-month-balance-date"
          type="date"
          max={todayIso}
          value={value.referenceDate}
          aria-invalid={!!errors.date}
          aria-describedby={errors.date ? "prepare-month-balance-date-error" : undefined}
          onChange={(e) => onChange({ ...value, referenceDate: e.target.value })}
        />
        <FieldFeedback id="prepare-month-balance-date-error" message={errors.date} />
      </div>
    </div>
  );
}
