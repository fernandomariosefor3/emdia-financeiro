import { Zap, ArrowRight, Brain } from "lucide-react";
import { Button } from "./ui/button";

interface InsightsCardProps {
  category: string;
  amount: number;
  percentage: number;
}

export function InsightsCard({ category, amount, percentage }: InsightsCardProps) {
  // Formatar o valor para R$
  const formattedAmount = new Intl.NumberFormat("pt-BR", { 
    style: "currency", 
    currency: "BRL" 
  }).format(amount);

  return (
    <div className="bg-gradient-to-r from-[#0A0F1E] to-[#141E3A] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
        <Brain size={120} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3 text-[#1AC87E]">
          <Zap size={18} className="fill-[#1AC87E]" />
          <span className="font-bold text-sm tracking-wide uppercase">Copilot Financeiro</span>
        </div>
        
        <h3 className="text-xl font-extrabold mb-2 text-white">
          Atenção aos gastos com {category} 🎯
        </h3>
        
        <p className="text-gray-300 text-sm mb-5 max-w-lg leading-relaxed">
          Nossa IA notou que {category} representa <strong className="text-white">{percentage.toFixed(0)}%</strong> das suas despesas totais neste mês, totalizando <strong className="text-white">{formattedAmount}</strong>. Considere reduzir esses gastos nos próximos dias para não estourar a meta.
        </p>
        
        <div className="flex items-center gap-3">
          <Button className="bg-[#1AC87E] hover:bg-[#15A86A] text-white rounded-xl font-semibold border-none">
            Ver detalhes de {category}
          </Button>
          <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-xl group">
            Dispensar
            <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
