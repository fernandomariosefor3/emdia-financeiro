import { useLocation } from "wouter";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PrepareMonthEntryCard() {
  const [, navigate] = useLocation();

  return (
    <Card className="bg-white border-gray-100 shadow-sm">
      <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1AC87E]/10 flex items-center justify-center shrink-0">
            <Calendar size={20} className="text-[#1AC87E]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[#0A0F1E]">Prepare seu mês</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-md">
              Organize seu saldo, receitas, compromissos e metas para saber quanto pode gastar com
              segurança.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate("/prepare-seu-mes")}
          className="bg-[#1AC87E] hover:bg-[#15A86A] text-white rounded-xl shadow-sm shadow-[#1AC87E]/20 shrink-0 w-full sm:w-auto"
        >
          Preparar meu mês
        </Button>
      </CardContent>
    </Card>
  );
}
