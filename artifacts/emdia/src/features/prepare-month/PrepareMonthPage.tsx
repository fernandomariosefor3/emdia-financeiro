import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PrepareMonthWizard } from "./PrepareMonthWizard";

export function PrepareMonthPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Prepare seu mês</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informe sua situação financeira para o Emdia calcular seu Respiro, seu Ritmo seguro e os
          compromissos que precisam de atenção.
        </p>
        <Alert className="mt-4 bg-blue-50/50 border-blue-100 text-blue-900">
          <Info className="h-4 w-4 text-blue-600" aria-hidden="true" />
          <AlertDescription className="text-blue-700/90 text-sm">
            {user
              ? "Seus dados só são salvos quando você confirmar em \"Salvar meu planejamento\", na última etapa."
              : "Faça login para salvar seu planejamento."}
          </AlertDescription>
        </Alert>
      </div>
      <PrepareMonthWizard />
    </div>
  );
}
